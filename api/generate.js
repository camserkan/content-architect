// api/generate.js
import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getBearerToken(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

function jsonBody(req) {
  // Vercel çoğu zaman req.body'yi obje olarak verir; bazen string gelebilir.
  const b = req.body;
  if (!b) return {};
  if (typeof b === "string") {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return b;
}

/* -----------------------------
   Supabase (server-only)
------------------------------ */
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Admin client (server-only). DO NOT expose service role to client.
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

export default async function handler(req, res) {
  // Basic CORS (same-origin on Vercel; harmless for dev)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { provider, model, messages, temperature } = jsonBody(req) || {};
    if (!provider || !model || !Array.isArray(messages)) {
      return res.status(400).json({ ok: false, error: "provider, model, messages are required" });
    }
    const temp = typeof temperature === "number" ? temperature : 0.7;

    // --- Supabase env check
    if (!supabaseAdmin) {
      return res.status(500).json({
        ok: false,
        error: "Supabase server env missing. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
      });
    }

    // --- Auth token (client session)
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({ ok: false, error: "Missing Authorization Bearer token" });
    }

    // Verify token -> get user
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !userData?.user) {
      return res.status(401).json({ ok: false, error: "Invalid session" });
    }
    const userId = userData.user.id;

    // --- Consume credit atomically (server-side)
    // Requires RPC: public.consume_credit_for(target_id uuid)
    const { data: creditData, error: creditErr } = await supabaseAdmin.rpc("consume_credit_for", {
      target_id: userId,
    });

    if (creditErr) {
      const msg = String(creditErr.message || creditErr);
      if (msg.includes("NO_CREDITS")) {
        return res.status(402).json({ ok: false, error: "NO_CREDITS" });
      }
      return res.status(500).json({ ok: false, error: `CREDIT_DECREMENT_FAILED: ${msg}` });
    }

    const newCredits = Array.isArray(creditData) ? creditData?.[0]?.credits : creditData?.credits;

    // --- Provider call
    let text = "";
    if (provider === "openai") {
      text = await callOpenAI({ model, messages, temperature: temp });
    } else if (provider === "anthropic") {
      text = await callAnthropic({ model, messages, temperature: temp });
    } else if (provider === "gemini") {
      text = await callGemini({ model, messages, temperature: temp });
    } else {
      return res.status(400).json({ ok: false, error: `Unknown provider: ${provider}` });
    }

    return res.json({ ok: true, text, newCredits });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}

/* -----------------------------
   Provider calls
------------------------------ */
async function callOpenAI({ model, messages, temperature }) {
  const key = requireEnv("OPENAI_API_KEY");

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, temperature, messages }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "OpenAI request failed");
  const text = data?.choices?.[0]?.message?.content || "";
  return text.trim();
}

async function callAnthropic({ model, messages, temperature }) {
  const key = requireEnv("ANTHROPIC_API_KEY");

  const system = messages.find((m) => m.role === "system")?.content || "";
  const filtered = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      temperature,
      system,
      messages: filtered,
    }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Anthropic request failed");
  const text = data?.content?.map((c) => (c.type === "text" ? c.text : "")).join("\n") || "";
  return text.trim();
}

async function callGemini({ model, messages, temperature }) {
  const key = requireEnv("GEMINI_API_KEY");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const system = messages.find((m) => m.role === "system")?.content || "";
  const mergedContents = system ? [{ role: "user", parts: [{ text: system }] }, ...contents] : contents;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(key)}`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: mergedContents,
      generationConfig: { temperature, maxOutputTokens: 1800 },
    }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Gemini request failed");
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
  return text.trim();
}

