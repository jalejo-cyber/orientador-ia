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
   LECTURA CV (PDF o TXT)
------------------------ */

cvUpload.addEventListener("change", async (event)=>{
  const file = event.target.files[0];
  if(!file) return;

  if(file.type === "text/plain"){
    const text = await file.text();
    cvExtractedText = text;
  }

  if(file.type === "application/pdf"){
    const reader = new FileReader();
    reader.onload = async function(){
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;

      let fullText = "";

      for(let i=1;i<=pdf.numPages;i++){
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(" ") + " ";
      }

      cvExtractedText = fullText;
    };
    reader.readAsArrayBuffer(file);
  }
});

/* -----------------------
   REQUISITS ACCÉS
------------------------ */

function accessExplanation(level, edu){

  if(level === 1){
    return {
      ok:true,
      message:"Nivell 1 no requereix titulació acadèmica formal."
    };
  }

  if(level === 2){
    if(["eso","fp1","fp2","batx","grau"].includes(edu)){
      return { ok:true, message:"Compleix requisits acadèmics per nivell 2." };
    }
    return {
      ok:false,
      message:"Per nivell 2 cal ESO o equivalent. Alternativament, prova de competències clau nivell 2."
    };
  }

  if(level === 3){
    if(["fp2","batx","grau"].includes(edu)){
      return { ok:true, message:"Compleix requisits acadèmics per nivell 3." };
    }
    return {
      ok:false,
      message:"Per nivell 3 cal Batxillerat, CFGS o equivalent. Alternativament, prova competències clau nivell 3."
    };
  }

  return { ok:false, message:"Nivell no identificat." };
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
   MOTOR D’ANÀLISI
------------------------ */

function analyzeCertificates(){

  const combinedText = normalizeText(
    freeText.value + " " + cvExtractedText
  );

  if(!combinedText) return [];

  const words = combinedText.split(" ").filter(w => w.length > 3);
  const userEdu = formalEdu.value;
  const extraHours = Number(nonFormalHours.value || 0);
  const experienceYears = Number(yearsFamily.value || 0);

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

      let coverage = Math.round((matchedUC.length / totalUC) * 100);

      // Ajust per experiència i cursos no reglats
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

  });

  return results.sort((a,b)=>{

  // 1️⃣ Prioritat: compleix requisits
  if(a.access.ok && !b.access.ok) return -1;
  if(!a.access.ok && b.access.ok) return 1;

  // 2️⃣ Després ordenar per cobertura
  return b.coverage - a.coverage;
});
}

/* -----------------------
   RENDER RESULTAT
------------------------ */

function renderResult(){

  // 1️⃣ Analitzem tots els resultats
  const resultsAll = analyzeCertificates();

  // guardem tots per al PDF
  lastResults = resultsAll;

  // 2️⃣ Només mostrem els que tenen cobertura >= 60%
  const results = resultsAll
    .filter(cp => cp.coverage >= 60)
    .sort((a,b)=>{

      // Primer els que compleixen requisits
      if(a.access.ok && !b.access.ok) return -1;
      if(!a.access.ok && b.access.ok) return 1;

      // Després per cobertura
      return b.coverage - a.coverage;
    });

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
    return;
  }

  resultList.innerHTML = results.map(cp=>`

    <div class="result-card">

      <div style="margin-bottom:10px">
        <strong>${cp.codi}</strong> · Nivell ${cp.nivell}
        <div>${cp.nom}</div>
        <div style="font-size:13px;color:#6b7280">${cp.familia}</div>
      </div>

      <div style="margin-bottom:10px">
        <strong>Cobertura detectada:</strong> ${cp.coverage}%
      </div>

      <div style="margin-bottom:10px">
        <strong>Unitats detectades:</strong>
        <ul>
          ${cp.matchedUC.map(uc=>`
            <li><strong>${uc.codi}</strong> – ${uc.descripcio}</li>
          `).join("")}
        </ul>
      </div>

      <div style="margin-bottom:10px">
        <strong>Requisits d’accés:</strong><br>
        ${cp.access.ok
          ? `<span style="color:green;font-weight:600;">
               ✔ Administrativament viable
             </span><br>
             <span style="font-size:13px;color:#6b7280;">
               ${cp.access.message}
             </span>`
          : `<span style="color:#C1121F;font-weight:600;">
               ✖ No compleix requisits actuals
             </span><br>
             <span style="font-size:13px;color:#6b7280;">
               ${cp.access.message}
             </span>`
        }
      </div>

    </div>

  `).join("");

  resultSection.classList.remove("hidden");
  resultSection.scrollIntoView({behavior:"smooth"});
}

/* -----------------------
   INFORME PDF
------------------------ */

generateReportBtn.addEventListener("click",()=>{

  const results = analyzeCertificates();
  if(!results.length) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const cp = results[0];

  let y = 15;

  doc.setFontSize(14);
  doc.text("INFORME TÈCNIC D’ORIENTACIÓ", 10, y);
  y+=10;

  doc.setFontSize(11);
  doc.text("Certificat: "+cp.codi,10,y); y+=6;
  doc.text(cp.nom,10,y); y+=6;
  doc.text("Nivell: "+cp.nivell,10,y); y+=10;

  doc.text("Cobertura estimada: "+cp.coverage+"%",10,y); y+=10;

  doc.text("Requisits d'accés:",10,y); y+=6;
  doc.text(cp.access.message,10,y);

  doc.save("Informe_orientacio_"+cp.codi+".pdf");

});

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
  cvExtractedText="";
  yearsFamily.value=0;
  formalEdu.value="";
  nonFormalHours.value="";
  resultSection.classList.add("hidden");
  renderFamilies();
  setStep(1);
});
