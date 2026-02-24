export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔥 Parse manual del body (important en Vercel)
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const { message, lang = "ca" } = body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const systemPrompt =
      lang === "es"
        ? "Eres un orientador profesional amable que ayuda paso a paso."
        : "Ets un orientador professional amable que ajuda pas a pas.";

  const res = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: message,
    lang: document.getElementById("langSelect").value || "ca"
  })
});

    const data = await response.json();

    if (!response.ok) {
      console.log("OPENAI ERROR:", data);
      return res.status(500).json({ error: data.error?.message || "OpenAI error" });
    }

    return res.status(200).json({
      reply: data.output_text || "Resposta buida"
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
