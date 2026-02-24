const chatEl = document.getElementById("chat");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const langSelect = document.getElementById("langSelect");
const pdfInput = document.getElementById("pdfInput");
const pdfStatus = document.getElementById("pdfStatus");
const analyzeBtn = document.getElementById("analyzeBtn");
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");

let extractedText = ""; // text combinat dels PDFs
let convo = []; // historial curt

function t(ca, es){
  return langSelect.value === "es" ? es : ca;
}

function addBubble(role, text){
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setLoading(on, text){
  loading.classList.toggle("hidden", !on);
  if (text) loadingText.textContent = text;
  sendBtn.disabled = on;
  analyzeBtn.disabled = on;
}

addBubble("bot", t(
  "Hola! Sóc l’orientador amb IA. Pots pujar els PDFs i després et faré un prediagnòstic orientatiu (no vinculant).",
  "¡Hola! Soy el orientador con IA. Puedes subir los PDFs y luego haré un prediagnóstico orientativo (no vinculante)."
));

pdfInput.addEventListener("change", () => {
  const files = pdfInput.files ? Array.from(pdfInput.files) : [];
  if (!files.length){
    pdfStatus.textContent = t("Cap document pujat", "Ningún documento subido");
    return;
  }
  pdfStatus.textContent = t(
    `${files.length} PDF(s) seleccionat(s)`,
    `${files.length} PDF(s) seleccionado(s)`
  );
});

analyzeBtn.addEventListener("click", async () => {
  const files = pdfInput.files ? Array.from(pdfInput.files) : [];
  if (!files.length){
    alert(t("Puja com a mínim un PDF abans d’analitzar.", "Sube al menos un PDF antes de analizar."));
    return;
  }

  setLoading(true, t("Analitzant documents…", "Analizando documentos…"));

  try{
    const fd = new FormData();
    for (const f of files) fd.append("docs", f);

    const res = await fetch("/api/extract", { method:"POST", body: fd });
    const data = await res.json();

    if(!res.ok) throw new Error(data?.error || "Error");

    extractedText = (data.docs || [])
      .map(d => `--- ${d.filename} ---\n${d.text}\n`)
      .join("\n");

    addBubble("bot", t(
      "Documents analitzats ✅. Ara escriu-me què vols aconseguir (ex: “vull acreditar experiència en administració”).",
      "Documentos analizados ✅. Ahora dime qué quieres conseguir (ej: “quiero acreditar experiencia en administración”)."
    ));
  }catch(e){
    alert(t("Error analitzant PDFs.", "Error analizando PDFs."));
  }finally{
    setLoading(false);
  }
});

async function sendMessage(){
  const text = (msgInput.value || "").trim();
  if(!text) return;

  addBubble("user", text);
  msgInput.value = "";

  setLoading(true, t("Pensant…", "Pensando…"));

  try{
    const res = await fetch("/api/chat", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        lang: langSelect.value,
        userMessage: text,
        extractedText,
        convo
      })
    });

    const data = await res.json();
    if(!res.ok) throw new Error(data?.error || "Error");

    addBubble("bot", data.reply || t("No he pogut respondre.", "No he podido responder."));
    convo = data.convo || convo;
  }catch(e){
    addBubble("bot", t("Hi ha hagut un error. Torna-ho a provar.", "Ha habido un error. Inténtalo de nuevo."));
  }finally{
    setLoading(false);
  }
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
