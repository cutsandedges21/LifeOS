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

  const sys = `${basePrompt}\n\nLIVE DASHBOARD CONTEXT: ${ctxStr}`;

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
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const detail = data?.error?.message || `HTTP ${upstream.status}`;
      return res.status(upstream.status).json({ error: detail });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "…";
    return res.status(200).json({ text });
  } catch (err) {
    return res
      .status(502)
      .json({ error: err?.message || "Upstream request failed" });
  }
}
