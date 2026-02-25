const $ = (id) => document.getElementById(id);

const progressFill = $("progressFill");
const progressText = $("progressText");

const step1 = $("step1");
const step2 = $("step2");
const step3 = $("step3");

const familyGrid = $("familyGrid");
const tasksBox = $("tasksBox");

const yearsFamily = $("yearsFamily");
const yearsFamilyLabel = $("yearsFamilyLabel");
const status = $("status");
const freeText = $("freeText");

const formalEdu = $("formalEdu");
const courseHours = $("courseHours");

const resultSection = $("resultSection");
const resultSummary = $("resultSummary");
const resultList = $("resultList");
const downloadPdfBtn = $("downloadPdfBtn");
const restartBtn = $("restartBtn");

const s1Next = $("s1Next");
const s2Back = $("s2Back");
const s2Next = $("s2Next");
const s3Back = $("s3Back");
const calcBtn = $("calcBtn");

const DATA = window.ORIENTA;

let selectedFamilyId = "";
let selectedTasks = new Set();
let lastResults = []; // for PDF
let lastSummaryData = null;

// --------------------
// Icones (inline SVG)
// --------------------
function iconSvg(name){
  const base = `
  <rect x="2" y="2" width="20" height="20" rx="6"
        fill="currentColor"/>`;

  switch(name){

    case "briefcase": // Administració
      return `
      <svg width="20" height="20" viewBox="0 0 24 24">
        ${base}
        <path d="M8 10h8M9 8V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"
              stroke="#fff" stroke-width="1.8"
              stroke-linecap="round"/>
      </svg>`;

    case "utensils": // Hostaleria → H hotel
      return `
      <svg width="20" height="20" viewBox="0 0 24 24">
        ${base}
        <text x="12" y="16"
              text-anchor="middle"
              font-size="12"
              font-weight="700"
              fill="#fff"
              font-family="Inter, sans-serif">
          H
        </text>
      </svg>`;

    case "heart": // Sanitat
      return `
      <svg width="20" height="20" viewBox="0 0 24 24">
        ${base}
        <path d="M12 17s-4-3.5-4-6a2.5 2.5 0 0 1 4-1.7A2.5 2.5 0 0 1 16 11c0 2.5-4 6-4 6z"
              fill="#fff"/>
      </svg>`;

    case "cart": // Comerç
      return `
      <svg width="20" height="20" viewBox="0 0 24 24">
        ${base}
        <circle cx="9" cy="17" r="1.5" fill="#fff"/>
        <circle cx="16" cy="17" r="1.5" fill="#fff"/>
        <path d="M6 7h12l-1 6H8L6 7z"
              fill="#fff"/>
      </svg>`;

    default:
      return `
      <svg width="20" height="20" viewBox="0 0 24 24">
        ${base}
      </svg>`;
  }
}
// --------------------
// Wizard UI
// --------------------
function setStep(n){
  step1.classList.toggle("step-active", n === 1);
  step2.classList.toggle("step-active", n === 2);
  step3.classList.toggle("step-active", n === 3);

  const pct = n === 1 ? 33 : n === 2 ? 66 : 100;
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `Pas ${n} de 3`;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getFamily(){
  return DATA.families.find(f => f.id === selectedFamilyId) || null;
}

function renderFamilies(){
  familyGrid.innerHTML = DATA.families.map(f => `
    <div class="family-card ${selectedFamilyId===f.id ? "selected":""}" data-id="${f.id}">
      <div class="family-icon">${iconSvg(f.icon)}</div>
      <div>
        <div class="family-title">${f.title}</div>
        <div class="family-desc">${f.desc}</div>
      </div>
    </div>
  `).join("");

  familyGrid.querySelectorAll(".family-card").forEach(el => {
    el.addEventListener("click", () => {
      selectedFamilyId = el.getAttribute("data-id");
      renderFamilies();
      renderTasks();
    });
  });
}

function renderTasks(){
  const fam = getFamily();
  selectedTasks = new Set();
  if(!fam){
    tasksBox.innerHTML = `<div class="muted">Selecciona un àmbit al pas 1.</div>`;
    return;
  }

  tasksBox.innerHTML = fam.tasks.map(t => `
    <label class="task">
      <input type="checkbox" data-task="${t.id}">
      <div>
        <b>${t.label}</b>
        <span>${t.hint}</span>
      </div>
    </label>
  `).join("");

  tasksBox.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", () => {
      const id = cb.getAttribute("data-task");
      if(cb.checked) selectedTasks.add(id);
      else selectedTasks.delete(id);
    });
  });
}

yearsFamily.addEventListener("input", () => {
  const v = Number(yearsFamily.value);
  yearsFamilyLabel.textContent = v >= 15 ? "15+" : String(v);
});

// --------------------
// Motor “quasi IA” (sense cost)
// --------------------

// Sinònims / normalitzacions ràpides (Català/Castellà barrejats típics)
const SYNONYMS = {
  "gent gran": "geriatria",
  "avis": "geriatria",
  "persones grans": "geriatria",
  "ancians": "geriatria",
  "moviments": "mobilitzacions",
  "mobilitzar": "mobilitzacions",
  "grua": "grua",
  "abvd": "abvd",
  "netejar": "higiene",
  "netej": "higiene",
  "appcc": "appcc",
  "caixa registradora": "tpv",
  "tpv": "tpv",
  "facturacio": "factures",
  "comptabilitat": "factures",
  "albaran": "albarans",
  "albarans": "albarans",
  "reposicio": "reposicio",
  "repositor": "reposicio"
};

// Paraules “fortes” per sumar més punts
const STRONG = new Set([
  "abvd","grua","appcc","escandalls","tpv","geriatria","dependencia","tracabilitat"
]);

function normalizeText(input){
  if(!input) return "";
  let t = input.toString().toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  // aplicar sinònims
  for(const k of Object.keys(SYNONYMS)){
    t = t.replaceAll(k, SYNONYMS[k]);
  }

  // simplificació d’arrels molt suau (evita dependències)
  t = t
    .replaceAll(/acions\b/g, "")
    .replaceAll(/acio\b/g, "")
    .replaceAll(/ments\b/g, "")
    .replaceAll(/ment\b/g, "");

  // espais nets
  t = t.replaceAll(/[^a-z0-9\s+]/g, " ").replaceAll(/\s+/g, " ").trim();
  return t;
}

function eduPreferredLevel(){
  const edu = formalEdu.value;
  const hours = courseHours.value;

  let lvl = 1;

  // ✅ Ajust oficial orientatiu
  if (edu === "eso") lvl = 2;
  if (edu === "fp1") lvl = 2;
  if (edu === "fp2") lvl = 3;

  // Hores de formació complementària (no reglada) → com a màxim ajuda a “2”
  if (hours === "200_499") lvl = Math.max(lvl, 2);
  if (hours === "500_plus") lvl = Math.max(lvl, 2);

  return lvl;
}

function scoreQualifications(){
  const fam = getFamily();
  if(!fam) return [];

  const y = Number(yearsFamily.value || 0);
  const text = normalizeText(freeText.value || "");
  const pref = eduPreferredLevel();

  const results = fam.quals.map(q => {
    let score = 0;
    const why = [];

    // Tasques
    const hitTasks = q.taskIds.filter(id => selectedTasks.has(id)).length;
    if(hitTasks){
      score += hitTasks * 14;
      why.push(`Coincidència de tasques: ${hitTasks}`);
    }

    // Keywords + fortes
    let kwHits = 0;
    let strongHits = 0;
    for(const w of q.keywords){
      const nw = normalizeText(w);
      if(text.includes(nw)){
        kwHits++;
        if(STRONG.has(nw)) strongHits++;
      }
    }
    if(kwHits){
      score += kwHits * 7;
      why.push(`Paraules clau detectades: ${kwHits}`);
    }
    if(strongHits){
      score += strongHits * 10;
      why.push(`Competències específiques: ${strongHits}`);
    }

    // Experiència
    if(y >= q.minYears){
      score += 20;
      why.push(`Experiència ≥ ${q.minYears} anys`);
    } else if (y > 0) {
      score += Math.max(0, Math.floor((y / q.minYears) * 12));
      why.push(`Experiència parcial (${y} anys)`);
    }

    // Preferència de nivell (orientatiu)
    const diff = Math.abs(q.level - pref);
    if(diff === 0){
      score += 8;
      why.push(`Nivell coherent amb formació`);
    } else if (diff === 1){
      score += 3;
    }

    // Penalització suau si és nivell 3 sense evidència
    if(q.level === 3 && y < 2 && hitTasks === 0 && kwHits === 0){
      score -= 12;
    }

    return { ...q, score, why };
  });

  // només resultats amb base
  return results
    .filter(r => r.score >= 14)
    .sort((a,b) => b.score - a.score)
    .slice(0, 6);
}

function recommendedLevelFromEvidence(results){
  // nivell orientatiu general (no vinculant), basat en preferència + resultats
  const pref = eduPreferredLevel();
  if(!results.length) return Math.min(pref, 2); // si no hi ha res, no “pujem” molt

  const top = results[0];
  // mitjana ponderada suau
  const avg = results.reduce((acc, r) => acc + (r.level * Math.min(1, r.score/60)), 0) / results.length;
  const blend = Math.round((avg + pref) / 2);

  // clamp 1..3
  return Math.max(1, Math.min(3, blend || top.level || pref));
}

// --------------------
// Render result + PDF
// --------------------
function renderResult(){
  const fam = getFamily();
  const y = Number(yearsFamily.value || 0);
  const pref = eduPreferredLevel();
  const results = scoreQualifications();
  const recLevel = recommendedLevelFromEvidence(results);
  const accessNote = getAccessNote(recLevel, formalEdu.value);

  lastResults = results;
  lastSummaryData = {
    family: fam?.title || "",
    yearsFamily: y,
    status: status.value || "",
    tasks: Array.from(selectedTasks),
    freeText: freeText.value || "",
    formalEdu: formalEdu.value || "",
    courseHours: courseHours.value || "",
    prefLevel: pref,
    recLevel
  };

  const taskLabels = (fam?.tasks || [])
    .filter(t => selectedTasks.has(t.id))
    .map(t => t.label);

  const indicators = [];
  if(y >= 2) indicators.push("Experiència rellevant detectada");
  if(taskLabels.length >= 3) indicators.push("Tasques alineades amb competències clau");
  if(pref >= 2) indicators.push("Formació complementària coherent");
  if(!indicators.length) indicators.push("Informació limitada: es recomana afegir tasques i descripció");

  resultSummary.innerHTML = `
    <div><strong>Àmbit:</strong> ${fam?.title || "-"}</div>
    <div><strong>Anys en l’àmbit:</strong> ${y >= 15 ? "15+" : y}</div>
    <div><strong>Nivell orientatiu recomanat:</strong>
      <span style="color:var(--primary);font-weight:900">Nivell ${recLevel}</span>
    </div>
    ${accessNote ? `<div style="margin-top:8px; color:var(--muted); font-size:13px">
  <strong>Accés:</strong> ${accessNote}
</div>` : ""}
    <div style="margin-top:8px"><strong>Indicadors detectats:</strong></div>
    <ul style="margin:6px 0 0; padding-left:18px">
      ${indicators.map(i => `<li>${i}</li>`).join("")}
    </ul>
  `;

  if(!results.length){
    resultList.innerHTML = `
      <div class="result-card">
        <div class="result-top">
          <div><strong>No s’han detectat propostes clares</strong></div>
          <div class="tag">Orientatiu</div>
        </div>
        <div class="why">
          Prova a:
          <ul>
            <li>Marcar 3–6 tasques del pas 2</li>
            <li>Afegir una descripció breu amb paraules com “TPV”, “APPCC”, “ABVD”, “factures”…</li>
            <li>Indicar anys aproximats en l’àmbit</li>
          </ul>
        </div>
      </div>
    `;
  } else {
    resultList.innerHTML = results.map(r => {
      let label = "Coincidència inicial";
      let color = "#9CA3AF"; // gris

      if(r.score >= 60){
        label = "Coincidència alta";
        color = "#1F9D55"; // verd
      } else if(r.score >= 35){
        label = "Coincidència mitjana";
        color = "#B45309"; // taronja
      }

      return `
        <div class="result-card">
          <div class="result-top">
            <div>
              <div><strong>${r.code}</strong> · Nivell ${r.level}</div>
              <div style="margin-top:4px">${r.name}</div>
            </div>

            <div class="tag" style="border-color:${color}; color:${color}; font-weight:700">
              ${label}
            </div>
          </div>

          <div class="why">
            <strong>Indicadors detectats:</strong>
            <ul>${r.why.map(w => `<li>${w}</li>`).join("")}</ul>
          </div>
        </div>
      `;
    }).join("");
  }

  resultSection.classList.remove("hidden");
  resultSection.scrollIntoView({ behavior: "smooth" });
}

function niceEduLabel(v){
  switch(v){
    case "cap": return "Cap";
    case "eso": return "ESO / Graduat escolar";
    case "fp1": return "FP / CFGM (nivell 2 aprox.)";
    case "fp2": return "CFGS / Universitat (nivell 3 aprox.)";
    default: return v || "-";
  }
}
function niceHoursLabel(v){
  switch(v){
    case "0": return "0 h";
    case "1_49": return "1–49 h";
    case "50_199": return "50–199 h";
    case "200_499": return "200–499 h";
    case "500_plus": return "500+ h";
    default: return v || "-";
  }
}
function getAccessNote(level, edu){
  if(level === 1){
    return "Per al nivell 1 no s’exigeixen requisits acadèmics, però calen habilitats bàsiques de comunicació per seguir la formació.";
  }

  if(level === 2){
    if(edu === "eso" || edu === "fp1" || edu === "fp2") return "";
    return "Per accedir a nivell 2 normalment cal ESO o via equivalent. Si no es pot acreditar, es pot accedir superant una prova de competències clau de nivell 2 (segons procediment).";
  }

  if(level === 3){
    if(edu === "fp2") return "";
    return "Per accedir a nivell 3 normalment cal Batxillerat/Tècnic (o vies equivalents). Si no es pot acreditar, es pot accedir superant una prova de competències clau de nivell 3 (segons procediment).";
  }

  return "";
}

function downloadPdf(){
  if(!lastSummaryData) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"mm", format:"a4" });
  const today = new Date().toLocaleDateString("ca-ES");

  const fam = lastSummaryData.family || "-";
  const y = lastSummaryData.yearsFamily >= 15 ? "15+" : String(lastSummaryData.yearsFamily);
  const edu = niceEduLabel(lastSummaryData.formalEdu);
  const hrs = niceHoursLabel(lastSummaryData.courseHours);
  const recLevel = lastSummaryData.recLevel;

  const famObj = getFamily();
  const taskLabels = (famObj?.tasks || [])
    .filter(t => selectedTasks.has(t.id))
    .map(t => `• ${t.label}`);

  // Header
  doc.setFont("helvetica","bold");
  doc.setFontSize(16);
  doc.text("Informe orientatiu d’acreditació de competències", 15, 18);

  doc.setFont("helvetica","normal");
  doc.setFontSize(11);
  doc.text("Centre emissor: Foment Formació", 15, 26);
  doc.text("Data: " + today, 15, 32);

  doc.setDrawColor(230);
  doc.line(15, 36, 195, 36);

  // Data summary
  let yPos = 46;
  doc.setFont("helvetica","bold"); doc.text("Dades facilitades", 15, yPos);
  yPos += 8;
  doc.setFont("helvetica","normal");
  doc.text(`Àmbit professional: ${fam}`, 15, yPos); yPos += 7;
  doc.text(`Anys d’experiència en l’àmbit: ${y}`, 15, yPos); yPos += 7;
  doc.text(`Formació reglada: ${edu}`, 15, yPos); yPos += 7;
  doc.text(`Hores formació complementària: ${hrs}`, 15, yPos); yPos += 8;

  doc.setFont("helvetica","bold");
  doc.text("Tasques seleccionades", 15, yPos);
  yPos += 7;
  doc.setFont("helvetica","normal");

  if(taskLabels.length){
    const block = taskLabels.join("\n");
    const lines = doc.splitTextToSize(block, 170);
    doc.text(lines, 15, yPos);
    yPos += lines.length * 5 + 4;
  } else {
    doc.text("— No s’han seleccionat tasques —", 15, yPos);
    yPos += 10;
  }

  const extra = (lastSummaryData.freeText || "").trim();
  doc.setFont("helvetica","bold");
  doc.text("Descripció addicional", 15, yPos);
  yPos += 7;
  doc.setFont("helvetica","normal");
  if(extra){
    const lines = doc.splitTextToSize(extra, 170);
    doc.text(lines, 15, yPos);
    yPos += lines.length * 5 + 6;
  } else {
    doc.text("— Sense descripció addicional —", 15, yPos);
    yPos += 10;
  }

  // Result
  doc.setFont("helvetica","bold");
  doc.text(`Resultat orientatiu: Nivell ${recLevel}`, 15, yPos);
  yPos += 8;

  doc.setFont("helvetica","bold");
  doc.text("Propostes orientatives", 15, yPos);
  yPos += 7;
  doc.setFont("helvetica","normal");

  if(!lastResults.length){
    doc.text("No s’han detectat propostes clares amb la informació actual.", 15, yPos);
    yPos += 8;
  } else {
    for(const r of lastResults){
      const line = `${r.code} (Nivell ${r.level}) — ${r.name}`;
      const lines = doc.splitTextToSize("• " + line, 170);
      doc.text(lines, 15, yPos);
      yPos += lines.length * 5 + 2;
      if(yPos > 265){
        doc.addPage();
        yPos = 20;
      }
    }
  }

  yPos += 6;
  doc.setFont("helvetica","normal");
  const legal = "Avís: aquest informe és orientatiu i no substitueix la validació oficial del procediment d’acreditació.";
  doc.text(doc.splitTextToSize(legal, 170), 15, yPos);

  doc.save(`Informe_orientatiu_Foment_Formacio_${today.replaceAll("/","-")}.pdf`);
}

// --------------------
// Validacions minimalistes (professionals)
// --------------------
function ensureStep1(){
  if(!selectedFamilyId){
    alert("Selecciona un àmbit professional per continuar.");
    return false;
  }
  return true;
}

function ensureStep2(){
  const y = Number(yearsFamily.value || 0);
  if(y === 0 && selectedTasks.size === 0 && !freeText.value.trim()){
    const ok = confirm("No has indicat experiència, ni tasques, ni descripció. Vols continuar igualment?");
    return ok;
  }
  return true;
}

function ensureStep3(){
  if(!formalEdu.value || !courseHours.value){
    const ok = confirm("No has completat tota la informació de formació. Vols continuar igualment?");
    return ok;
  }
  return true;
}

// --------------------
// Events
// --------------------
s1Next.addEventListener("click", () => {
  if(!ensureStep1()) return;
  setStep(2);
});

s2Back.addEventListener("click", () => setStep(1));
s2Next.addEventListener("click", () => {
  if(!ensureStep2()) return;
  setStep(3);
});
s3Back.addEventListener("click", () => setStep(2));

calcBtn.addEventListener("click", () => {
  if(!ensureStep3()) return;
  renderResult();
});

downloadPdfBtn.addEventListener("click", downloadPdf);

restartBtn.addEventListener("click", () => {
  selectedFamilyId = "";
  selectedTasks = new Set();
  yearsFamily.value = "0";
  yearsFamilyLabel.textContent = "0";
  status.value = "";
  freeText.value = "";
  formalEdu.value = "";
  courseHours.value = "";
  lastResults = [];
  lastSummaryData = null;
  resultSection.classList.add("hidden");
  renderFamilies();
  renderTasks();
  setStep(1);
});

// init
renderFamilies();
renderTasks();
setStep(1);
