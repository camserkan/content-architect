import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json({ limit: "2mb" }));

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    }
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const { provider, model, messages, temperature } = req.body || {};
    if (!provider || !model || !Array.isArray(messages)) {
      return res.status(400).json({ error: "provider, model, messages are required" });
    }
    const temp = typeof temperature === "number" ? temperature : 0.7;

    let text = "";
    if (provider === "openai") {
      text = await callOpenAI({ model, messages, temperature: temp });
    } else if (provider === "anthropic") {
      text = await callAnthropic({ model, messages, temperature: temp });
    } else if (provider === "gemini") {
      text = await callGemini({ model, messages, temperature: temp });
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    return res.json({ ok: true, text });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Server error"
    });
  }
});

async function callOpenAI({ model, messages, temperature }) {
  const key = requireEnv("OPENAI_API_KEY");

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature,
      messages
    })
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
      content: m.content
    }));

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      temperature,
      system,
      messages: filtered
    })
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Anthropic request failed");
  const text =
    data?.content?.map((c) => (c.type === "text" ? c.text : "")).join("\n") || "";
  return text.trim();
}

async function callGemini({ model, messages, temperature }) {
  const key = requireEnv("GEMINI_API_KEY");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

  const system = messages.find((m) => m.role === "system")?.content || "";
  const mergedContents = system
    ? [{ role: "user", parts: [{ text: system }] }, ...contents]
    : contents;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(key)}`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: mergedContents,
      generationConfig: {
        temperature,
        maxOutputTokens: 1800
      }
    })
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || "Gemini request failed");
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
  return text.trim();
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
