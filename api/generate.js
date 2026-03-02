// api/generate.js
import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function readHeader(req, name) {
  // Vercel/Node API route: req.headers is a plain object.
  if (req?.headers && typeof req.headers === "object" && typeof req.headers.get !== "function") {
    return req.headers[name] || req.headers[name.toLowerCase()] || "";
  }
  // Edge/Fetch style: Headers instance with .get().
  if (req?.headers && typeof req.headers.get === "function") {
    return req.headers.get(name) || req.headers.get(name.toLowerCase()) || "";
  }
  return "";
}

function getBearerToken(req) {
  const h = readHeader(req, "authorization");
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

function getSupabaseAdmin() {
  const url = requireEnv("SUPABASE_URL");
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.SUPABASE_ANON_KEY;

  const key = serviceRole || anon;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY");
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

  let { data, error } = await supabase
    .from("profiles")
    .select("id,is_paid,plan,credits")
    .eq("id", userId)
    .maybeSingle();

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

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const user = await verifyUserFromRequest(req);
    if (!user) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const profile = await readProfileByUserId(user.id);
    if (!profile) return res.status(403).json({ ok: false, error: "Profile not found" });
    if (!profile.is_paid) return res.status(402).json({ ok: false, error: "Paid plan required" });
    if ((profile.credits ?? 0) <= 0) return res.status(402).json({ ok: false, error: "No credits" });

    const { provider = "openai", model = "gpt-4o-mini", temperature = 0.7, messages = [] } = req.body || {};

    if (provider !== "openai") {
      return res.status(400).json({ ok: false, error: "Only openai provider enabled in api/generate.js" });
    }

    const apiKey = requireEnv("OPENAI_API_KEY");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature }),
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
    return res.status(200).json({ ok: true, text });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
