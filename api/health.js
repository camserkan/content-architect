// api/health.js
export default async function handler(_req, res) {
  res.status(200).json({
    ok: true,
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
    },
  });
}

