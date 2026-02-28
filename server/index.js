// server/index.js
import dotenv from "dotenv";

// ✅ Load local env first, then fallback to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json({ limit: "2mb" }));

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

function getSupabaseAdmin() {
  const url = requireEnv("SUPABASE_URL");
  // Service role kullanıyorsan:
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Yoksa anon ile sadece token doğrulama bazı senaryolarda yetmeyebilir
  const anon = process.env.SUPABASE_ANON_KEY;

  const key = serviceRole || anon;
  if (!key) throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function verifyUserFromRequest(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
}

async function readProfileByUserId(userId) {
  const supabase = getSupabaseAdmin();

  // Primary: profiles.id
  let { data, error } = await supabase
    .from("profiles")
    .select("id,is_paid,plan,credits")
    .eq("id", userId)
    .maybeSingle();

  // Fallback: profiles.user_id
  if (!data && !error) {
    const fb = await supabase
      .from("profiles")
      .select("id,is_paid,plan,credits")
      .eq("user_id", userId)
      .maybeSingle();
    if (fb?.data) data = fb.data;
    if (fb?.error) error = fb.error;
  }

  if (error) throw error;
  return data || null;
}

async function decrementCredit(userId) {
  // ✅ "secure" yol: RPC ile atomik düşürme (önerilen).
  // Şimdilik basit UPDATE örneği (race condition olabilir).
  const supabase = getSupabaseAdmin();

  // Primary: profiles.id
  const { data, error } = await supabase
    .from("profiles")
    .update({ credits: (await readProfileByUserId(userId))?.credits - 1 })
    .eq("id", userId)
    .select("credits")
    .maybeSingle();

  if (!error && data) return data;

  // Fallback: profiles.user_id
  const fb = await supabase
    .from("profiles")
    .update({ credits: (await readProfileByUserId(userId))?.credits - 1 })
    .eq("user_id", userId)
    .select("credits")
    .maybeSingle();

  if (fb.error) throw fb.error;
  return fb.data || null;
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    },
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    // 1) Auth + gating
    const user = await verifyUserFromRequest(req);
    if (!user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const profile = await readProfileByUserId(user.id);
    if (!profile) return res.status(403).json({ ok: false, error: "Profile not found" });
    if (!profile.is_paid) return res.status(402).json({ ok: false, error: "Paid plan required" });
    if ((profile.credits ?? 0) <= 0) return res.status(402).json({ ok: false, error: "No credits" });

    // 2) Provider routing (şimdilik OpenAI odaklı)
    const { provider = "openai", model = "gpt-4o-mini", temperature = 0.7, messages = [] } = req.body || {};

    if (provider !== "openai") {
      return res.status(400).json({ ok: false, error: "Only openai provider is enabled in local server/index.js for now." });
    }

    const apiKey = requireEnv("OPENAI_API_KEY");

    // 3) OpenAI Chat Completions
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        ok: false,
        error: data?.error?.message || "OpenAI request failed",
        raw: data,
      });
    }

    const text = data?.choices?.[0]?.message?.content ?? "";

    // 4) Credit düş (basit)
    await decrementCredit(user.id);

    return res.json({ ok: true, text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
