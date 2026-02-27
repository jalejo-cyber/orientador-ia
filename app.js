const $ = (id) => document.getElementById(id);

/* -----------------------
   ELEMENTS
------------------------ */
const progressFill = $("progressFill");
const progressText = $("progressText");

const step1 = $("step1");
const step2 = $("step2");
const step3 = $("step3");

const familyGrid = $("familyGrid");

const yearsFamily = $("yearsFamily");
const yearsFamilyLabel = $("yearsFamilyLabel");
const freeText = $("freeText");
const formalEdu = $("formalEdu");
const nonFormalHours = $("nonFormalHours");
const cvUpload = $("cvUpload");
const cvStatus = $("cvStatus");

const resultSection = $("resultSection");
const resultList = $("resultList");

const s1Next = $("s1Next");
const s2Back = $("s2Back");
const s2Next = $("s2Next");
const s3Back = $("s3Back");
const calcBtn = $("calcBtn");
const restartBtn = $("restartBtn");
const generateReportBtn = $("generateReportBtn");

/* -----------------------
   GLOBAL STATE
------------------------ */
let DATA = [];
let selectedFamily = "";
let cvExtractedText = "";
let lastResultsForPdf = [];

/* -----------------------
   LOAD DATA
------------------------ */
async function loadData(){
  try {
    const res = await fetch("/data_cp.json"); // public/data_cp.json
    if(!res.ok) throw new Error("No s'ha pogut carregar /data_cp.json");
    DATA = await res.json();
    renderFamilies();
  } catch (err) {
    console.error("Error carregant JSON:", err);
    familyGrid.innerHTML = `<div class="muted">Error carregant dades. Revisa que existeixi <b>/public/data_cp.json</b>.</div>`;
  }
}
loadData();

/* -----------------------
   NORMALITZADOR TEXT
------------------------ */
function normalizeText(input){
  if(!input) return "";
  return input.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

/* -----------------------
   PDF.js SETUP
------------------------ */
if (window.pdfjsLib) {
  // CDN worker
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* -----------------------
   LECTURA CV (PDF o TXT)
------------------------ */
cvUpload.addEventListener("change", async (event)=>{
  const file = event.target.files && event.target.files[0];
  if(!file) return;

  cvExtractedText = "";
  cvStatus.textContent = "Llegint CV…";

  try{
    if(file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")){
      cvExtractedText = await file.text();
      cvStatus.textContent = `CV carregat ✅ (${file.name})`;
      return;
    }

    if(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")){
      if(!window.pdfjsLib){
        cvStatus.textContent = "Error: PDF.js no està carregat.";
        return;
      }

      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

      let fullText = "";
      for(let i=1;i<=pdf.numPages;i++){
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(" ") + " ";
      }

      cvExtractedText = fullText;
      cvStatus.textContent = `CV carregat ✅ (${file.name}, ${pdf.numPages} pàg.)`;
      return;
    }

    cvStatus.textContent = "Format no suportat. Puja PDF o TXT.";
  }catch(e){
    console.error(e);
    cvStatus.textContent = "No s’ha pogut llegir el CV. Prova amb TXT.";
  }
});

/* -----------------------
   REQUISITS D’ACCÉS (missatge + motiu)
------------------------ */
function accessExplanation(level, edu){
  if(level === 1){
    return {
      ok: true,
      message: "Nivell 1: no s’exigeixen requisits acadèmics formals (cal competències bàsiques suficients).",
      reason: "Sense requisit acadèmic"
    };
  }

  if(level === 2){
    const ok = ["eso","fp1","fp2","batx","grau"].includes(edu);
    if(ok){
      return {
        ok: true,
        message: "Nivell 2: requisits acadèmics coherents (ESO/CFGM/CFGS/Batx/Grau o equivalent).",
        reason: "Titulació adequada"
      };
    }
    return {
      ok: false,
      message: "Nivell 2: normalment cal ESO o equivalent. Si no es pot acreditar, es pot accedir mitjançant prova de competències clau de nivell 2 (segons procediment vigent).",
      reason: "Falta ESO o equivalent"
    };
  }

  if(level === 3){
    const ok = ["fp2","batx","grau"].includes(edu);
    if(ok){
      return {
        ok: true,
        message: "Nivell 3: requisits acadèmics coherents (CFGS/Batx/Grau o equivalent).",
        reason: "Titulació adequada"
      };
    }
    return {
      ok: false,
      message: "Nivell 3: normalment cal Batxillerat/CFGS o equivalent. Si no es pot acreditar, es pot accedir mitjançant prova de competències clau de nivell 3 (segons procediment vigent).",
      reason: "Falta Batx/CFGS o equivalent"
    };
  }

  return { ok:false, message:"Nivell no identificat.", reason:"Desconegut" };
}

/* -----------------------
   STEP UI
------------------------ */
function setStep(n){
  step1.classList.toggle("step-active", n===1);
  step2.classList.toggle("step-active", n===2);
  step3.classList.toggle("step-active", n===3);

  const pct = n===1 ? 33 : n===2 ? 66 : 100;
  progressFill.style.width = pct+"%";
  progressText.textContent = "Pas "+n+" de 3";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* -----------------------
   FAMILIES
------------------------ */
function renderFamilies(){
  const families = [...new Set(DATA.map(d=>d.familia).filter(Boolean))].sort();

  familyGrid.innerHTML = families.map(f=>`
    <div class="family-card ${selectedFamily===f?'selected':''}" data-id="${f}">
      <div class="family-title">${f}</div>
      <div class="family-desc">Certificats professionals</div>
    </div>
  `).join("");

  familyGrid.querySelectorAll(".family-card").forEach(el=>{
    el.addEventListener("click",()=>{
      selectedFamily = el.getAttribute("data-id");
      renderFamilies();
    });
  });
}

/* -----------------------
   MOTOR D’ANÀLISI (B)
   - combina text manual + CV
   - match per paraules
   - calcula cobertura UC
------------------------ */
function analyzeCertificates(){
  const combinedText = normalizeText((freeText.value || "") + " " + (cvExtractedText || ""));
  if(!combinedText) return [];

  // Paraules útils (treu paraules molt curtes)
  const words = combinedText.split(" ").filter(w => w.length >= 4);
  const userEdu = formalEdu.value;
  const extraHours = Number(nonFormalHours.value || 0);
  const experienceYears = Number(yearsFamily.value || 0);

  const results = [];

  for(const cp of DATA){
    if(selectedFamily && cp.familia !== selectedFamily) continue;

    const totalUC = (cp.competencies || []).length;
    if(totalUC === 0) continue;

    const matchedUC = [];
    const unmatchedUC = [];

    for(const uc of cp.competencies){
      const desc = normalizeText(uc.descripcio || "");
      let matches = 0;

      for(const w of words){
        if(desc.includes(w)) matches++;
      }

      if(matches > 0) matchedUC.push(uc);
      else unmatchedUC.push(uc);
    }

    if(matchedUC.length === 0) continue;

    let coverage = Math.round((matchedUC.length / totalUC) * 100);

    // Ajust suau (orientatiu)
    if(experienceYears >= 3) coverage += 5;
    if(extraHours >= 100) coverage += 5;
    if(coverage > 100) coverage = 100;

    const access = accessExplanation(cp.nivell, userEdu);

    results.push({
      ...cp,
      totalUC,
      matchedUC,
      unmatchedUC,
      coverage,
      access
    });
  }

  // Ordena: primer els que compleixen requisits, després per cobertura desc
  results.sort((a,b)=>{
    if(a.access.ok && !b.access.ok) return -1;
    if(!a.access.ok && b.access.ok) return 1;
    return b.coverage - a.coverage;
  });

  return results;
}

/* -----------------------
   RENDER RESULTAT
   - només >= 60%
   - primer viables
   - PDF: només viables
------------------------ */
function renderResult(){
  const resultsAll = analyzeCertificates();

  const results = resultsAll
    .filter(cp => cp.coverage >= 60)
    .sort((a,b)=>{
      if(a.access.ok && !b.access.ok) return -1;
      if(!a.access.ok && b.access.ok) return 1;
      return b.coverage - a.coverage;
    });

  lastResultsForPdf = results.filter(cp => cp.access.ok);

  if(!results.length){
    resultList.innerHTML = `
      <div class="result-card">
        <strong>No hi ha coincidències suficients (mínim 60%).</strong>
        <div style="margin-top:8px;color:#6b7280;font-size:14px;">
          Prova a:
          <ul>
            <li>Afegir més detall a les funcions realitzades</li>
            <li>Pujar el CV complet</li>
            <li>Incloure hores de cursos no reglats</li>
          </ul>
        </div>
      </div>
    `;
    resultSection.classList.remove("hidden");
    resultSection.scrollIntoView({behavior:"smooth"});
    return;
  }

  resultList.innerHTML = results.map(cp=>{
    const badgeColor = cp.access.ok ? "green" : "#C1121F";
    const badgeText = cp.access.ok ? "Viable" : "No viable (requisits)";

    return `
      <div class="result-card">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
          <div>
            <div><strong>${cp.codi}</strong> · Nivell ${cp.nivell}</div>
            <div style="margin-top:4px">${cp.nom || ""}</div>
            <div style="font-size:13px;color:#6b7280">${cp.familia || ""}</div>
          </div>
          <span class="badge" style="border-color:${badgeColor}; color:${badgeColor};">${badgeText}</span>
        </div>

        <div style="margin-top:10px">
          <strong>Cobertura detectada:</strong> ${cp.coverage}%
          <span style="color:#6b7280;font-size:13px;">(${cp.matchedUC.length} de ${cp.totalUC} UC)</span>
        </div>

        <div style="margin-top:10px">
          <strong>Unitats detectades:</strong>
          <ul style="margin:8px 0 0; padding-left:18px;">
            ${cp.matchedUC.map(uc=>`
              <li><strong>${uc.codi}</strong> – ${uc.descripcio || ""}</li>
            `).join("")}
          </ul>
        </div>

        <div style="margin-top:10px">
          <strong>Requisits d’accés:</strong><br>
          ${
            cp.access.ok
              ? `<span style="color:green;font-weight:700;">✔ ${cp.access.reason}</span>
                 <div style="margin-top:4px;font-size:13px;color:#6b7280;">${cp.access.message}</div>`
              : `<span style="color:#C1121F;font-weight:700;">✖ ${cp.access.reason}</span>
                 <div style="margin-top:4px;font-size:13px;color:#6b7280;">${cp.access.message}</div>`
          }
        </div>
      </div>
    `;
  }).join("");

  resultSection.classList.remove("hidden");
  resultSection.scrollIntoView({behavior:"smooth"});
}

/* -----------------------
   INFORME PDF (tots els viables)
------------------------ */
function generatePdfReport(){
  if(!lastResultsForPdf || lastResultsForPdf.length === 0){
    alert("No hi ha certificats viables (requisits ok) per generar l’informe.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"mm", format:"a4" });

  const today = new Date().toLocaleDateString("ca-ES");
  let y = 18;

  doc.setFont("helvetica","bold");
  doc.setFontSize(16);
  doc.text("Informe orientatiu (resultats viables)", 14, y);
  y += 8;

  doc.setFont("helvetica","normal");
  doc.setFontSize(11);
  doc.text("Centre: Foment Formació", 14, y); y += 6;
  doc.text("Data: " + today, 14, y); y += 8;

  doc.setDrawColor(220);
  doc.line(14, y, 196, y);
  y += 10;

  for(const cp of lastResultsForPdf){
    if(y > 270){
      doc.addPage();
      y = 18;
    }

    doc.setFont("helvetica","bold");
    doc.setFontSize(12);
    doc.text(`${cp.codi} · Nivell ${cp.nivell} · Cobertura ${cp.coverage}%`, 14, y);
    y += 6;

    doc.setFont("helvetica","normal");
    doc.setFontSize(11);

    const nameLines = doc.splitTextToSize(cp.nom || "", 180);
    doc.text(nameLines, 14, y);
    y += nameLines.length * 5 + 4;

    doc.text("Requisits d'accés (orientatiu):", 14, y);
    y += 6;

    const accessLines = doc.splitTextToSize(cp.access.message || "", 180);
    doc.text(accessLines, 14, y);
    y += accessLines.length * 5 + 6;

    doc.setFont("helvetica","bold");
    doc.text("Unitats de competència detectades:", 14, y);
    y += 6;

    doc.setFont("helvetica","normal");
    for(const uc of cp.matchedUC){
      if(y > 270){
        doc.addPage();
        y = 18;
      }
      const ucLine = `• ${uc.codi} — ${uc.descripcio || ""}`;
      const ucLines = doc.splitTextToSize(ucLine, 180);
      doc.text(ucLines, 14, y);
      y += ucLines.length * 5;
    }

    y += 6;
    doc.setDrawColor(235);
    doc.line(14, y, 196, y);
    y += 10;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica","normal");
  doc.text(
    doc.splitTextToSize("Avís: aquest informe és orientatiu i no substitueix el procediment oficial.", 180),
    14,
    Math.min(y, 285)
  );

  doc.save("Informe_viables_Foment_Formacio_" + today.replaceAll("/","-") + ".pdf");
}

/* -----------------------
   EVENTS
------------------------ */
s1Next.addEventListener("click",()=>setStep(2));
s2Back.addEventListener("click",()=>setStep(1));
s2Next.addEventListener("click",()=>setStep(3));
s3Back.addEventListener("click",()=>setStep(2));

calcBtn.addEventListener("click",renderResult);

yearsFamily.addEventListener("input",()=>{
  const v = Number(yearsFamily.value);
  yearsFamilyLabel.textContent = v>=15 ? "15+" : String(v);
});

restartBtn.addEventListener("click",()=>{
  selectedFamily = "";
  freeText.value = "";
  cvExtractedText = "";
  cvUpload.value = "";
  if(cvStatus) cvStatus.textContent = "Encara no s’ha pujat cap CV.";
  yearsFamily.value = 0;
  yearsFamilyLabel.textContent = "0";
  formalEdu.value = "";
  nonFormalHours.value = "";
  lastResultsForPdf = [];
  resultSection.classList.add("hidden");
  renderFamilies();
  setStep(1);
});

generateReportBtn.addEventListener("click", generatePdfReport);

// init
setStep(1);
