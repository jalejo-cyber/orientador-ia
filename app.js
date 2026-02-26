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

let DATA = [];
let selectedFamily = "";
let lastResults = [];

/* -----------------------
   LOAD REAL DATA
------------------------ */

async function loadData(){
  const res = await fetch("./public/data_cp.json");
  DATA = await res.json();
  renderFamilies();
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
   FAMILIES (dynamic)
------------------------ */

function renderFamilies(){
  const families = [...new Set(DATA.map(d=>d.familia).filter(Boolean))];

  familyGrid.innerHTML = families.map(f=>`
    <div class="family-card ${selectedFamily===f?'selected':''}" data-id="${f}">
      <div>
        <div class="family-title">${f}</div>
        <div class="family-desc">Certificats professionals SOC</div>
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
   LEVEL PREFERENCE
------------------------ */

function eduPreferredLevel(){
  const edu = formalEdu.value;
  if(edu==="cap") return 1;
  if(edu==="eso") return 2;
  if(edu==="fp1") return 2;
  if(edu==="fp2") return 3;
  return 1;
}

/* -----------------------
   HYBRID ENGINE
------------------------ */

function scoreQualificationsHybrid(){

  const text = normalizeText(freeText.value);
  const y = Number(yearsFamily.value || 0);
  const prefLevel = eduPreferredLevel();

  const results = DATA.map(cp=>{

    let score = 0;
    const why = [];

    // Family match
    if(selectedFamily && cp.familia===selectedFamily){
      score += 30;
      why.push("Família professional coherent");
    }

    // Keyword matching in UC
    let matches = 0;

    cp.competencies.forEach(uc=>{
      const desc = normalizeText(uc.descripcio);
      if(text && desc.includes(text)){
        matches++;
      }
    });

    if(matches){
      score += matches * 10;
      why.push("Coincidència amb unitats de competència: "+matches);
    }

    // Experience
    if(y>=2){
      score += 15;
      why.push("Experiència rellevant");
    }

    // Level coherence
    if(cp.nivell===prefLevel){
      score += 10;
      why.push("Nivell coherent amb formació");
    }

    return {...cp, score, why};

  });

  return results
    .filter(r=>r.score>20)
    .sort((a,b)=>b.score-a.score)
    .slice(0,6);
}

/* -----------------------
   RENDER RESULT
------------------------ */

function renderResult(){

  const results = scoreQualificationsHybrid();
  lastResults = results;

  if(!results.length){
    resultList.innerHTML = `
      <div class="result-card">
        <strong>No s’han detectat coincidències clares.</strong>
        <div class="why">Prova a afegir més descripció de tasques.</div>
      </div>
    `;
  }else{

    resultList.innerHTML = results.map(r=>`

      <div class="result-card">
        <div class="result-top">
          <div>
            <div><strong>${r.codi}</strong> · Nivell ${r.nivell}</div>
            <div style="margin-top:4px">${r.nom}</div>
          </div>
          <div class="tag">${r.score} punts</div>
        </div>

        <div class="why">
          <strong>Indicadors:</strong>
          <ul>
            ${r.why.map(w=>"<li>"+w+"</li>").join("")}
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
