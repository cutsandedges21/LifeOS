// Vercel serverless function: /api/overseer
//
// Proxies Overseer chat requests to Google's Gemini API so the API key
// stays on the server. The client sends { messages, ctx }; we build the
// system prompt server-side and forward to Gemini using GEMINI_API_KEY
// from Vercel's environment.
//
// Set GEMINI_API_KEY in Vercel → Project Settings → Environment Variables
// (Production + Preview + Development). It must NOT have a VITE_ prefix —
// VITE_ vars get inlined into the client bundle, which is exactly what
// we're trying to avoid.

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "GEMINI_API_KEY not configured on server" });
  }

  const { messages, ctx } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages must be an array" });
  }

  let ctxStr = "";
  try {
    ctxStr = JSON.stringify(ctx);
  } catch {
    ctxStr = "{ error: 'context too complex' }";
  }

  const sys = `You are THE OVERSEER — brutally honest accountability AI. You know this person's full dashboard context: ${ctxStr}. 2-4 sentences max. Direct. No fluff. Call them out when slipping. Brief praise for real wins.`;

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
