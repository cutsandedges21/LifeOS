// Vercel serverless function: /api/overseer
//
// Proxies Overseer chat requests to Google's Gemini API so the API key
// stays on the server. The client sends { messages, ctx }; we build the
// system prompt server-side and forward to Gemini using GEMINI_API_KEY
// from Vercel's environment.
//
// The key lives in Vercel → Project Settings → Environment Variables. The
// deployed project stores it as `Google_Gemini_API`; local dev uses
// `GEMINI_API_KEY` in .env. The handler below reads either. Whatever the
// name, it must NOT have a VITE_ prefix — VITE_ vars get inlined into the
// client bundle, which is exactly what we're trying to avoid.

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Structured-output schema. Every reply is JSON: a coaching `reply` plus an
// optional `action` the user can confirm to write into their account. The
// action is a single flat, discriminated object (one `kind`, optional fields
// per kind) — far more reliable with Gemini than a polymorphic union.
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    action: {
      type: "object",
      nullable: true,
      properties: {
        kind: {
          type: "string",
          enum: ["transaction", "sleep", "gym", "habit_done", "goal_add", "goal_done", "journal"],
        },
        amount: { type: "number" },
        txnType: { type: "string", enum: ["income", "expense"] },
        category: { type: "string" },
        note: { type: "string" },
        score: { type: "number" },
        date: { type: "string" },
      },
      required: ["kind"],
      propertyOrdering: ["kind", "txnType", "amount", "score", "category", "note", "date"],
    },
  },
  required: ["reply"],
  propertyOrdering: ["reply", "action"],
};

// Appended to the system prompt so the model knows how to fill the schema.
const ACTION_INSTRUCTIONS = `

OUTPUT FORMAT
- Respond ONLY as JSON: { "reply": string, "action": object | null }.
- "reply" keeps your normal coaching voice and rules above.

ACTION EXTRACTION
- If the user's latest message clearly states something to record, fill "action"; otherwise set "action" to null.
- NEVER invent or guess a number. If an amount or score is not explicitly stated, set "action" to null and ask for it in "reply".
- "date" defaults to today; only set another date (YYYY-MM-DD) if the user names one.
- When you set an action, "reply" must confirm what you are logging, e.g. "Logging $20 income from work."
- Only ONE action per reply; if several are implied, log the most important and mention the rest in "reply".
- Mappings:
  - A "transaction" action MUST include "amount" as a positive number, plus "category" and "note". Without a numeric amount the action is invalid -> set action to null instead.
  - Money earned/received -> { kind:"transaction", txnType:"income", amount, category, note }
  - Money spent/paid -> { kind:"transaction", txnType:"expense", amount, category, note }
  - Sleep -> { kind:"sleep", score } where score = round(hours / 8 * 100), capped at 100
  - Worked out / went to the gym -> { kind:"gym" }
  - Did/completed a daily habit -> { kind:"habit_done", note: <habit name> }
  - Add a new goal/task -> { kind:"goal_add", note: <goal text> }
  - Finished an existing goal/task -> { kind:"goal_done", note: <goal text or keywords> }
  - A reflection/journal note -> { kind:"journal", note: <the entry> }`;

// Allow same-origin requests + localhost dev. VERCEL_URL is set by Vercel
// for every deployment (production + preview). Doesn't stop a determined
// attacker but kills casual scraping of the endpoint.
function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin fetches often omit Origin
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (process.env.VERCEL_URL && origin.endsWith(process.env.VERCEL_URL))
      return true;
    // Vercel preview + production domains all end in vercel.app for the
    // default deployment URL; custom domains go through VERCEL_URL above
    // OR can be added here explicitly.
    if (hostname.endsWith(".vercel.app")) return true;
    return false;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    return res.status(403).json({ error: "Forbidden origin" });
  }

  // Accept either name: local dev (.env) uses GEMINI_API_KEY, while the
  // Vercel project stores the key as Google_Gemini_API. Reading both keeps
  // dev and prod working without renaming the deployed secret.
  const apiKey = process.env.GEMINI_API_KEY || process.env.Google_Gemini_API;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "GEMINI_API_KEY not configured on server" });
  }

  const { messages, ctx, systemPrompt } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages must be an array" });
  }

  let ctxStr = "";
  try {
    ctxStr = JSON.stringify(ctx);
  } catch {
    ctxStr = "{ error: 'context too complex' }";
  }

  // System prompt is owned by the client (defined in MainPage.jsx as
  // OVERSEER_SYSTEM_PROMPT) so the instructions live next to the chat UI.
  // Fallback exists only for safety if the client omits it. The user's
  // live dashboard context is appended here so it's always fresh.
  const basePrompt =
    typeof systemPrompt === "string" && systemPrompt.trim()
      ? systemPrompt.trim()
      : "You are THE OVERSEER — brutally honest accountability AI. 2-4 sentences max. Direct. No fluff.";

  const sys = `${basePrompt}\n\nLIVE DASHBOARD CONTEXT: ${ctxStr}${ACTION_INSTRUCTIONS}`;

  try {
    const upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: messages.map((m) => ({
          role: m.role === "ai" || m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content ?? m.text ?? "") }],
        })),
        system_instruction: { parts: [{ text: sys }] },
        generationConfig: {
          // gemini-2.5-flash is a thinking model, and its hidden reasoning
          // tokens count against maxOutputTokens. With the old 200-token cap
          // the model spent most of the budget "thinking" and the visible
          // reply got cut off mid-sentence. Disabling thinking (budget 0)
          // hands the entire cap to the answer; the headroom below means a
          // 2–4 sentence reply never clips.
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 512,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const detail = data?.error?.message || `HTTP ${upstream.status}`;
      return res.status(upstream.status).json({ error: detail });
    }

    // The model returns a JSON string per RESPONSE_SCHEMA. Parse it into
    // { reply, action }. If parsing ever fails, fall back to treating the raw
    // text as the reply with no action so the chat still works.
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    let reply = "…";
    let action = null;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.reply === "string" && parsed.reply.trim()) reply = parsed.reply.trim();
      if (parsed.action && typeof parsed.action === "object") action = parsed.action;
    } catch {
      if (raw.trim()) reply = raw.trim();
    }
    return res.status(200).json({ reply, action });
  } catch (err) {
    return res
      .status(502)
      .json({ error: err?.message || "Upstream request failed" });
  }
}
