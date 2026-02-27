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

const resultSection = $("resultSection");
const resultList = $("resultList");

const s1Next = $("s1Next");
const s2Back = $("s2Back");
const s2Next = $("s2Next");
const s3Back = $("s3Back");
const calcBtn = $("calcBtn");
const restartBtn = $("restartBtn");

/* -----------------------
   GLOBAL STATE
------------------------ */

let DATA = [];
let selectedFamily = "";

/* -----------------------
   LOAD DATA
------------------------ */

async function loadData(){
  try {
    const res = await fetch("/data_cp.json");
    DATA = await res.json();
    renderFamilies();
  } catch (err) {
    console.error("Error carregant JSON:", err);
  }
}

loadData();

/* -----------------------
   TEXT NORMALIZER
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
   STEP UI
------------------------ */

function setStep(n){
  step1.classList.toggle("step-active", n===1);
  step2.classList.toggle("step-active", n===2);
  step3.classList.toggle("step-active", n===3);

  const pct = n===1 ? 33 : n===2 ? 66 : 100;
  progressFill.style.width = pct+"%";
  progressText.textContent = "Pas "+n+" de 3";
}

/* -----------------------
   FAMILIES
------------------------ */

function renderFamilies(){
  const families = [...new Set(DATA.map(d=>d.familia).filter(Boolean))].sort();

  familyGrid.innerHTML = families.map(f=>`
    <div class="family-card ${selectedFamily===f?'selected':''}" data-id="${f}">
      <div>
        <div class="family-title">${f}</div>
        <div class="family-desc">Certificats professionals</div>
      </div>
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
   CORE ENGINE
   (Detecta UC coincidents)
------------------------ */

function analyzeCertificates(){

  const text = normalizeText(freeText.value);
  if(!text) return [];

  const words = text.split(" ").filter(w => w.length > 3);
  const userEdu = formalEdu.value;

  const results = [];

  DATA.forEach(cp => {

    if(selectedFamily && cp.familia !== selectedFamily) return;

    const totalUC = (cp.competencies || []).length;
    if(totalUC === 0) return;

    let matchedUC = [];
    let unmatchedUC = [];

    cp.competencies.forEach(uc => {

      const desc = normalizeText(uc.descripcio);
      let matches = 0;

      words.forEach(word=>{
        if(desc.includes(word)) matches++;
      });

      if(matches > 0){
        matchedUC.push(uc);
      } else {
        unmatchedUC.push(uc);
      }

    });

    if(matchedUC.length > 0){

      const coverage = Math.round((matchedUC.length / totalUC) * 100);
      const accessOk = meetsAccessRequirement(cp.nivell, userEdu);

      results.push({
        ...cp,
        totalUC,
        matchedUC,
        unmatchedUC,
        coverage,
        accessOk
      });

    }

  });

  return results.sort((a,b)=> b.coverage - a.coverage);
}

/* -----------------------
   RENDER RESULT
------------------------ */

function renderResult(){

  const results = findMatchingCompetencies();

  if(!results.length){
    resultList.innerHTML = `
      <div class="result-card">
        <strong>No s’han detectat Unitats de Competència coincidents.</strong>
        <div class="why">
          Prova a descriure tasques més concretes (ex: facturació, atenció al client, manteniment, instal·lació, dependència, etc.).
        </div>
      </div>
    `;
  } else {

    // Agrupar per certificat
    const grouped = {};

    results.forEach(r=>{
      if(!grouped[r.cpCodi]){
        grouped[r.cpCodi] = {
          nom: r.cpNom,
          nivell: r.nivell,
          familia: r.familia,
          ucs: []
        };
      }

      grouped[r.cpCodi].ucs.push({
        codi: r.ucCodi,
        desc: r.ucDesc,
        durada: r.durada
      });
    });

    resultList.innerHTML = Object.entries(grouped).map(([codi, cp]) => `
      <div class="result-card">

        <div style="margin-bottom:10px">
          <strong>${codi}</strong> · Nivell ${cp.nivell ?? "-"}
          <div style="margin-top:4px">${cp.nom}</div>
          <div style="font-size:13px; color:#6b7280">${cp.familia}</div>
        </div>

        <div>
          <strong>Unitats de Competència detectades:</strong>
          <ul>
            ${cp.ucs.map(uc=>`
              <li style="margin-bottom:8px">
                <strong>${uc.codi}</strong><br>
                ${uc.desc}
                ${uc.durada ? `<div style="font-size:12px;color:#6b7280">Durada: ${uc.durada}h</div>` : ""}
              </li>
            `).join("")}
          </ul>
        </div>

      </div>
    `).join("");
  }

  resultSection.classList.remove("hidden");
  resultSection.scrollIntoView({behavior:"smooth"});
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
  yearsFamilyLabel.textContent = v>=15 ? "15+" : v;
});

restartBtn.addEventListener("click",()=>{
  selectedFamily="";
  freeText.value="";
  yearsFamily.value=0;
  formalEdu.value="";
  resultSection.classList.add("hidden");
  renderFamilies();
  setStep(1);
});
