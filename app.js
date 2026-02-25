const $ = (id) => document.getElementById(id);

const steps = [$("step1"), $("step2"), $("step3"), $("step4")];
const barFill = $("barFill");
const barText = $("barText");

const age = $("age");
const status = $("status");
const yearsTotal = $("yearsTotal");
const family = $("family");

const yearsFamily = $("yearsFamily");
const keywords = $("keywords");
const tasksBox = $("tasksBox");

const formalEdu = $("formalEdu");
const courseHours = $("courseHours");
const notes = $("notes");

const resultSummary = $("resultSummary");
const resultList = $("resultList");

const data = window.ORIENTACIO_DATA;

let selectedTasks = new Set();

function showStep(n){
  steps.forEach((s, i) => s.classList.toggle("active", i === n));
  const pct = ((n+1)/steps.length) * 100;
  barFill.style.width = `${pct}%`;
  barText.textContent = `Pas ${n+1} de ${steps.length}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function familyObj(){
  const f = family.value;
  return f && data.families[f] ? data.families[f] : null;
}

function renderTasks(){
  const f = familyObj();
  selectedTasks = new Set();

  if(!f){
    tasksBox.innerHTML = `<div class="muted">Selecciona una família al pas 1.</div>`;
    return;
  }

  const html = `
    <div class="taskGrid">
      ${f.tasks.map(t => `
        <label class="task">
          <input type="checkbox" data-task="${t.id}">
          <div>
            <b>${t.label}</b>
            <span>${t.hint}</span>
          </div>
        </label>
      `).join("")}
    </div>
  `;
  tasksBox.innerHTML = html;

  tasksBox.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", () => {
      const id = cb.getAttribute("data-task");
      if(cb.checked) selectedTasks.add(id);
      else selectedTasks.delete(id);
    });
  });
}

function normalizeText(s){
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function parseNum(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function eduBoostToTargetLevel(){
  // No “decidim” el nivell, només fem una orientació suau
  // Retorna un “nivell preferent” aproximat (1..3) segons formació i cursos
  const edu = formalEdu.value;
  const hours = courseHours.value;

  let lvl = 1;

  if (edu === "fp1") lvl = 2;
  if (edu === "fp2") lvl = 3;

  if (hours === "200_499") lvl = Math.max(lvl, 2);
  if (hours === "500_plus") lvl = Math.max(lvl, 2);

  return lvl;
}
const SYNONYMS = {
  "gent gran": "geriatria",
  "avis": "geriatria",
  "persones grans": "geriatria",
  "moviments": "mobilitzacions",
  "mobilitzar": "mobilitzacions",
  "netejar": "higiene",
  "caixa registradora": "tpv",
  "cuidador": "dependència",
  "cuidar": "dependència",
  "auxiliar": "suport",
  "facturacio": "factures",
  "comptabilitat": "factures"
};

const STRONG_KEYWORDS = [
  "abvd",
  "grua",
  "appcc",
  "escandall",
  "tpv",
  "dependencia",
  "geriatria"
];
function computeResults(){
  const f = familyObj();
  if(!f) return [];

  const yFam = parseNum(yearsFamily.value);
  const yTot = parseNum(yearsTotal.value);

  const kw = normalizeText(keywords.value + " " + notes.value);
  const taskArr = Array.from(selectedTasks);

  const prefLevel = eduBoostToTargetLevel();

  const results = f.qualifications.map(q => {
    let score = 0;
    const why = [];

    // 1) Tasques seleccionades
    const hitsTasks = q.taskIds.filter(id => selectedTasks.has(id)).length;
    if(hitsTasks > 0){
      score += hitsTasks * 12;
      why.push(`Coincidència de tasques: ${hitsTasks}`);
    }

    // 2) Paraules clau
    const kwHits = q.keywords.filter(w => kw.includes(normalizeText(w))).length;
    if(kwHits > 0){
      score += kwHits * 6;
      why.push(`Paraules clau detectades: ${kwHits}`);
    }

    // 3) Anys d’experiència
    if(yFam >= q.minAnys){
      score += 18;
      why.push(`Experiència en la família ≥ ${q.minAnys} anys`);
    } else if (yFam > 0) {
      score += Math.max(0, Math.floor((yFam / q.minAnys) * 10));
      why.push(`Experiència parcial (${yFam} anys)`);
    } else if (yTot >= q.minAnys) {
      score += 8;
      why.push(`Experiència total podria ser compatible`);
    }

    // 4) Preferència de nivell (orientatiu)
    const levelDiff = Math.abs((q.nivell || 1) - prefLevel);
    if(levelDiff === 0){
      score += 8;
      why.push(`Nivell coherent amb formació/cursos`);
    } else if (levelDiff === 1){
      score += 3;
    }

    // Penalitzacions suaus: si demana molt i no hi ha evidència
    if(q.minAnys >= 2.5 && yFam < 1.0 && hitsTasks === 0 && kwHits === 0){
      score -= 12;
    }

    return {
      ...q,
      score,
      why
    };
  });

  // Filtrar: només els que tenen una evidència mínima
  const filtered = results
    .filter(r => r.score >= 12)
    .sort((a,b) => b.score - a.score)
    .slice(0, 6);

  return filtered;
}

function buildSummary(results){
  const f = familyObj();
  const ageVal = parseNum(age.value);
  const yTot = parseNum(yearsTotal.value);
  const yFam = parseNum(yearsFamily.value);

  const missing = [];
  if(!family.value) missing.push("família");
  if(!status.value) missing.push("situació");
  if(!yearsTotal.value) missing.push("anys d’experiència total");
  if(!yearsFamily.value) missing.push("anys a la família");
  if(selectedTasks.size === 0) missing.push("tasques");

  const base = `
    <div><strong>Família:</strong> ${f?.name || "-"}</div>
    <div><strong>Edat:</strong> ${ageVal || "-"}</div>
    <div><strong>Situació:</strong> ${status.value || "-"}</div>
    <div><strong>Experiència total:</strong> ${yTot || "-"} anys</div>
    <div><strong>Experiència família:</strong> ${yFam || "-"} anys</div>
    <div><strong>Tasques marcades:</strong> ${selectedTasks.size}</div>
    <div><strong>Nivell orientatiu segons formació:</strong> ${eduBoostToTargetLevel()}</div>
  `;

  const warn = missing.length
    ? `<div style="margin-top:8px;color:var(--warn)"><strong>Per millorar el resultat:</strong> completa ${missing.join(", ")}.</div>`
    : `<div style="margin-top:8px;color:var(--ok)"><strong>Dades suficients</strong> per una orientació inicial.</div>`;

  const resNote = results.length
    ? `<div style="margin-top:8px"><strong>Resultat:</strong> ${results.length} proposta(es) orientativa(es).</div>`
    : `<div style="margin-top:8px"><strong>Resultat:</strong> no hem pogut detectar propostes clares amb la informació actual.</div>`;

  return base + warn + resNote;
}

function renderResults(){
  const results = computeResults();

  resultSummary.innerHTML = buildSummary(results);

  if(results.length === 0){
    resultList.innerHTML = `
      <div class="result">
        <div class="resultTop">
          <div><strong>No hi ha coincidències suficients</strong></div>
          <div class="tag">Orientatiu</div>
        </div>
        <div class="why">
          Prova a:
          <ul>
            <li>Marcar 3–6 tasques del pas 2</li>
            <li>Afegir paraules clau (ex: “factures”, “cuina”, “ABVD”, “TPV”...)</li>
            <li>Indicar anys aproximats en la família</li>
          </ul>
        </div>
      </div>
    `;
    return;
  }

  resultList.innerHTML = results.map(r => `
    <div class="result">
      <div class="resultTop">
        <div>
          <div><strong>${r.codi}</strong> · Nivell ${r.nivell}</div>
          <div style="margin-top:4px">${r.nom}</div>
        </div>
        <div class="tag"><span class="score">${r.score}</span> pts</div>
      </div>
      <div class="why">
        <strong>Per què surt:</strong>
        <ul>
          ${r.why.map(w => `<li>${w}</li>`).join("")}
        </ul>
        <div style="margin-top:8px">
          <strong>Què et preguntaria un orientador:</strong>
          <ul>
            <li>Quines 3–6 funcions feies exactament en el lloc principal?</li>
            <li>Quantes hores/anys aproximats tens en aquestes funcions?</li>
            <li>Tens certificats o cursos amb hores relacionats?</li>
          </ul>
        </div>
      </div>
    </div>
  `).join("");
}

// VALIDACIONS SUAVES
function validateStep1(){
  if(!family.value){
    alert("Selecciona una família professional per continuar.");
    family.focus();
    return false;
  }
  if(!status.value){
    alert("Selecciona la teva situació actual.");
    status.focus();
    return false;
  }
  if(parseNum(yearsTotal.value) === 0){
    // allow 0 but warn
    const ok = confirm("No has indicat anys d’experiència total. Vols continuar igualment?");
    if(!ok) { yearsTotal.focus(); return false; }
  }
  return true;
}

function validateStep2(){
  if(parseNum(yearsFamily.value) === 0){
    const ok = confirm("No has indicat anys en aquesta família. Vols continuar igualment?");
    if(!ok) { yearsFamily.focus(); return false; }
  }
  if(selectedTasks.size === 0){
    const ok = confirm("No has marcat cap tasca. Vols continuar igualment?");
    if(!ok) return false;
  }
  return true;
}

function validateStep3(){
  if(!formalEdu.value || !courseHours.value){
    const ok = confirm("No has completat tota la formació. Vols continuar igualment?");
    if(!ok) return false;
  }
  return true;
}

// EVENTS
$("toStep2").addEventListener("click", () => {
  if(!validateStep1()) return;
  renderTasks();
  showStep(1);
});

$("back1").addEventListener("click", () => showStep(0));

$("toStep3").addEventListener("click", () => {
  if(!validateStep2()) return;
  showStep(2);
});

$("back2").addEventListener("click", () => showStep(1));

$("toStep4").addEventListener("click", () => {
  if(!validateStep3()) return;
  renderResults();
  showStep(3);
});

$("back3").addEventListener("click", () => showStep(2));

$("restart").addEventListener("click", () => {
  // reset inputs
  [age, yearsTotal, yearsFamily].forEach(i => i.value = "");
  status.value = "";
  family.value = "";
  keywords.value = "";
  formalEdu.value = "";
  courseHours.value = "";
  notes.value = "";
  selectedTasks = new Set();
  tasksBox.innerHTML = "";
  resultSummary.innerHTML = "";
  resultList.innerHTML = "";
  showStep(0);
});

// When family changes on step1, refresh tasks if user had moved
family.addEventListener("change", () => {
  if($("step2").classList.contains("active")) renderTasks();
});

// init
showStep(0);
