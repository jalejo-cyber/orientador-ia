import fs from "fs";
import path from "path";

const CNECP_PATH = path.join(process.cwd(), "data", "cnecp.json");

function score(ecp, haystack){
  const t = (ecp.titulo || "").toLowerCase();
  let s = 0;
  for(const w of t.split(/\s+/).filter(x => x.length >= 5).slice(0, 12)){
    if(haystack.includes(w)) s += 2;
  }
  if(ecp.nivel === 2) s += 1;
  return s;
}

function buildContext(lang, top){
  const ca = lang === "ca";
  const header = ca
    ? "Ets un orientador d’acreditació de competències. Dona una orientació preliminar NO VINCULANT. Sigues molt amable i pedagògic. No inventis dades."
    : "Eres un orientador de acreditación de competencias. Da una orientación preliminar NO VINCULANTE. Sé amable y pedagógico. No inventes datos.";

  const list = top.map(x => `- ${x.codigo} (Nivell ${x.nivel}) — ${x.titulo}`).join("\n");
  const cat = ca ? "Catàleg (candidats):\n" : "Catálogo (candidatos):\n";

  return `${header}\n\n${cat}${list}\n`;
}

export default async function handler(req, res){
  if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try{
    const { lang="ca", userMessage="", extractedText="", convo=[] } = req.body || {};
    const catalog = JSON.parse(fs.readFileSync(CNECP_PATH, "utf8"));

    const haystack = (extractedText || "").toLowerCase();
    const top = (catalog.ecps || [])
      .map(ecp => ({ ecp, s: score(ecp, haystack) }))
      .sort((a,b) => b.s - a.s)
      .slice(0, 10)
      .map(x => x.ecp);

    const systemContext = buildContext(lang, top);

    // Historial curt (per no fer-ho enorme)
    const shortConvo = Array.isArray(convo) ? convo.slice(-8) : [];

    const input = [
      { role: "system", content: systemContext },
      ...shortConvo,
      {
        role: "user",
        content:
          `Text dels documents (pot estar incomplet):\n${extractedText.slice(0, 12000)}\n\n` +
          `Missatge usuari:\n${userMessage}\n\n` +
          (lang === "ca"
            ? "Retorna: 1) Resum de perfil (2-4 frases). 2) 3-6 recomanacions d’ECP amb 'per què'. 3) 3 preguntes per afinar."
            : "Devuelve: 1) Resumen de perfil (2-4 frases). 2) 3-6 recomendaciones de ECP con 'por qué'. 3) 3 preguntas para afinar.")
      }
    ];

    const apiKey = process.env.OPENAI_API_KEY;
    if(!apiKey) return res.status(500).json({ error: "Falta OPENAI_API_KEY a Vercel" });

    // Responses API (POST /v1/responses)
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.2",
        input
      })
    });

    const data = await r.json();
   if (!response.ok) {
  console.log("OPENAI ERROR:", data);
  return res.status(500).json({
    error: data.error?.message || JSON.stringify(data)
  });
}

    const reply = data.output_text || (lang==="ca" ? "No he pogut generar resposta." : "No he podido generar respuesta.");

    const newConvo = [...shortConvo, { role:"user", content:userMessage }, { role:"assistant", content:reply }];

    return res.status(200).json({ reply, convo: newConvo });

  }catch(err){
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
