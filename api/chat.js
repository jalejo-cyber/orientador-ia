import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const { message, lang } = body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
Ets un orientador expert en acreditació de competències professionals.
Respon en ${lang === "es" ? "castellano" : "català"}.
Pregunta de l’usuari: ${message}
`
    });

    return res.status(200).json({
      reply: completion.output[0].content[0].text
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
