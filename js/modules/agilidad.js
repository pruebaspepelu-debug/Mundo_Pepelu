import { db, currentUser, auth } from '../core/firebase-init.js';
import { showScreen } from '../core/navigation.js';
import { incrementGamify } from './habitos.js';

let gameSessionStart = null;

export class AdaptiveDifficultyManager {
    constructor(config = {}) {
        // Lógica de Puntuación (Modular)
        this.multiplier = 1.0;
        this.consecutiveHits = 0;
        this.consecutiveMisses = 0;
        this.totalHits = 0;
        this.totalAttempts = 0;
        this.reactionTimes = [];

        // Lógica de Tiempo (Online IA)
        this.tiempoActual = config.tiempoInicial || 3000;
        this.tiempoMinimo = config.tiempoMinimo || 800;
        this.tiempoMaximo = config.tiempoMaximo || 5000;
        this.umbralTiempoRapido = config.umbralTiempoRapido || 1500;
        this.rachaAciertos = 0;
        this.rachaFallos = 0;
    }

    record(hit, timeMs) {
        this.totalAttempts++;
        if (timeMs) this.reactionTimes.push(timeMs);
        
        if (hit) {
            this.totalHits++;
            this.consecutiveHits++;
            this.consecutiveMisses = 0;
            this.rachaFallos = 0;
            this.rachaAciertos++;

            // Ajuste de multiplicador de puntos
            if (this.consecutiveHits % 3 === 0) {
                this.multiplier = Math.min(3.0, this.multiplier + 0.15);
            }

            // Ajuste de dificultad temporal (IA)
            if (this.rachaAciertos >= 3 && timeMs < this.umbralTiempoRapido) {
                this.tiempoActual = Math.max(this.tiempoMinimo, this.tiempoActual * 0.9);
                this.rachaAciertos = 0;
            }
        } else {
            this.consecutiveMisses++;
            this.consecutiveHits = 0;
            this.rachaAciertos = 0;
            this.rachaFallos++;

            // Penalización de puntos
            this.multiplier = Math.max(0.5, this.multiplier - 0.2);

            // Relajación de dificultad temporal (IA)
            if (this.rachaFallos >= 2) {
                this.tiempoActual = Math.min(this.tiempoMaximo, this.tiempoActual * 1.15);
                this.rachaFallos = 0;
            }
        }
    }

    getMultiplier() { return this.multiplier; }
    getTime() { return Math.round(this.tiempoActual); }

    getStats() {
        let precision = this.totalAttempts > 0 ? Math.round((this.totalHits / this.totalAttempts) * 100) : 0;
        let avgTime = this.reactionTimes.length > 0 ? this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length : 0;
        let ppm = avgTime > 0 ? Math.round(60000 / avgTime) : 0; 
        let baseScore = this.totalHits * 100;
        let difficultyBonus = baseScore * (this.multiplier - 1.0);
        let speedBonus = ppm * 2;
        let finalScore = Math.round(baseScore + difficultyBonus + speedBonus);
        
        return { precision, ppm, finalScore, avgTime: Math.round(avgTime) };
    }
}

export let adm = new AdaptiveDifficultyManager();

export async function checkAndSaveRecordCloud(gameID, curVal, isLowBet=false) { 
    let rBox=document.getElementById('recordContainer'); rBox.innerHTML="Sincronizando con Mundo Pepelu... ☁️"; rBox.className='record-box record-old'; 
    try { 
        if(!db || !auth.currentUser) throw new Error("No DB or Auth");
        const uid = auth.currentUser.uid;
        const dRef=db.collection("records_"+gameID).doc(uid); 
        const snap=await dRef.get(); let isNew=false, past=null; 
        if(snap.exists) { 
            past=snap.data().score; 
            if(isLowBet){if(curVal<past)isNew=true;}else{if(curVal>past)isNew=true;} 
        } else { isNew=true; } 
        if(isNew) { 
            await dRef.set({score:curVal,user:uid,displayName:currentUser,date:new Date()}); past=curVal; 
            rBox.className='record-box record-new'; rBox.innerHTML=`🏆 ¡NUEVO RÉCORD DE ${currentUser.toUpperCase()}!`; 
        } else { 
            let u=gameID==='reflex'?'ms':'pts'; 
            rBox.innerHTML=`Mejor marca de ${currentUser}: ${past} ${u} ☁️`; 
        } 
    } catch(e) { console.error(e); rBox.innerHTML="Aviso: Sin conexión a la nube. 🚨"; } 
}

export function showGameResult(html, gID, val, lowBet=false) { 
    showScreen('screenResult'); 
    document.getElementById('resGrid').innerHTML=html; checkAndSaveRecordCloud(gID,val,lowBet); 
    
    // Registrar tiempo en Mapa de Constancia
    if (gameSessionStart) {
        const elapsedMinutes = (Date.now() - gameSessionStart) / 60000;
        if (elapsedMinutes > 0.1) { // Mínimo 6 segundos para contar algo
            incrementGamify('juegos_mentales_minutos', elapsedMinutes);
        }
        gameSessionStart = null;
    }
}

// ==========================================
// 1. CÁLCULO RÁPIDO (MATH)
// ==========================================
export let mathScore=0, mathTime=30, mathInt=null, currentAns=0; 
let lastMathTime = 0;
export function startMath() { 
    // Inicializar ADM con tiempos de cálculo (IA)
    adm = new AdaptiveDifficultyManager({
        tiempoInicial: 30, // Segundos totales de juego (usado para el contador, no para ADM en sí)
        tiempoMinimo: 800, 
        tiempoMaximo: 5000
    });
    mathScore=0; mathTime=30; 
    document.getElementById('mathScore').innerText="0 pts"; 
    document.getElementById('mathIn').value=""; 
    document.getElementById('mathBar').style.width="100%"; 
    genMath(); 
    gameSessionStart = Date.now();
    showScreen('gameMath'); 
    setTimeout(()=>document.getElementById('mathIn').focus(),500); 
    mathInt=setInterval(()=>{
        mathTime--;
        document.getElementById('mathTime').innerText=mathTime+"s";
        document.getElementById('mathBar').style.width=(mathTime/30*100)+"%";
        if(mathTime<=0){
            clearInterval(mathInt);
            document.getElementById('mathIn').blur();
            let stats = adm.getStats();
            let h=`<div class="res-item"><span>Puntuación:</span><span class="res-val">${stats.finalScore}</span></div><div class="res-item"><span>Precisión:</span><span class="res-val">${stats.precision}%</span></div><div class="res-item"><span>Velocidad:</span><span class="res-val">${stats.ppm} PPM</span></div>`;
            showGameResult(h,'math',stats.finalScore,false);
        }
    },1000); 
} 
export function genMath() { 
    lastMathTime = Date.now();
    let op=Math.floor(Math.random()*3);
    let mult = adm.getMultiplier();
    let maxN = Math.floor(20 * mult); 
    let n1,n2,s;
    if(op===0){n1=Math.floor(Math.random()*maxN)+1;n2=Math.floor(Math.random()*maxN)+1;s="+";currentAns=n1+n2;}
    else if(op===1){n1=Math.floor(Math.random()*maxN)+10;n2=Math.floor(Math.random()*(maxN/2))+1;s="-";currentAns=n1-n2;}
    else{n1=Math.floor(Math.random()*(10*mult))+2;n2=Math.floor(Math.random()*(9*mult))+2;s="x";currentAns=n1*n2;} 
    document.getElementById('mathEq').innerText=`${n1} ${s} ${n2}`; 
} 
export function submitMath(e) { 
    e.preventDefault();
    let v=parseInt(document.getElementById('mathIn').value);
    if(isNaN(v))return;
    let t=Date.now()-lastMathTime;
    if(v===currentAns){ adm.record(true, t); genMath(); }
    else{ adm.record(false, t); } 
    document.getElementById('mathScore').innerText=adm.getStats().finalScore+" pts";
    document.getElementById('mathIn').value=""; 
}

// ==========================================
// 2. REFLEJOS (CAZA-DIANAS)
// ==========================================
export let refCount=0, refSpawn=0, refTimeout=null; 
export function startReflex() { 
    adm = new AdaptiveDifficultyManager({
        tiempoInicial: 2000, // Tiempo base para reflejos
        tiempoMinimo: 400,
        tiempoMaximo: 3000
    });
    refCount=0; 
    document.getElementById('refCount').innerText="1"; 
    document.getElementById('refTarget').style.display="none"; 
    gameSessionStart = Date.now();
    showScreen('gameReflex'); 
    refTimeout=setTimeout(spawnTarget,Math.random()*600+200); 
} 
export function spawnTarget() { 
    const tg=document.getElementById('refTarget'); 
    const bx=document.getElementById('refBox'); 
    let mult = adm.getMultiplier();
    let size = Math.max(20, Math.floor(50 / mult)); 
    tg.style.width = size + "px"; tg.style.height = size + "px";
    tg.style.left=Math.floor(Math.random()*(bx.clientWidth-size))+"px"; 
    tg.style.top=Math.floor(Math.random()*(bx.clientHeight-size))+"px"; 
    tg.style.display="block"; 
    refSpawn=Date.now(); 
} 
export function clickTarget() { 
    let t = Date.now()-refSpawn;
    adm.record(true, t);
    document.getElementById('refTarget').style.display="none"; 
    refCount++; 
    if(refCount<15){
        document.getElementById('refCount').innerText=refCount+1;
        let delay = Math.max(100, adm.getTime() / 4); 
        refTimeout=setTimeout(spawnTarget, delay);
    }else{
        let stats = adm.getStats();
        let h=`<div class="res-item"><span>Media Reacción:</span><span class="res-val">${stats.avgTime} ms</span></div><div class="res-item"><span>Precisión:</span><span class="res-val">100%</span></div><div class="res-item"><span>Velocidad:</span><span class="res-val">${stats.ppm} PPM</span></div>`;
        showGameResult(h,'reflex',stats.avgTime,true);
    } 
}

// ==========================================
// 3. SIMÓN (MEMORIA)
// ==========================================
export let simonSeq=[], simonStep=0, simonLocked=false; export const sColors=['red','blue','green','yellow']; 
export function startSimon() { 
    gameSessionStart = Date.now();
    adm = new AdaptiveDifficultyManager(); simonSeq=[]; showScreen('gameSimon'); nextSimon(); 
} 
export function nextSimon() { simonStep=0; simonSeq.push(sColors[Math.floor(Math.random()*4)]); document.getElementById('simonMsg').innerText=`Nivel ${simonSeq.length}`; document.getElementById('simonMsg').style.color="var(--text)"; playSimon(); } 
export async function playSimon() { 
    simonLocked=true; 
    let mult = adm.getMultiplier();
    let delay1 = Math.max(150, 500 / mult);
    let delay2 = Math.max(50, 200 / mult);
    await new Promise(r=>setTimeout(r,600)); 
    for(let c of simonSeq){
        const b=document.getElementById('btn-'+c);
        b.classList.add('active');
        await new Promise(r=>setTimeout(r,delay1));
        b.classList.remove('active');
        await new Promise(r=>setTimeout(r,delay2));
    } 
    simonLocked=false; 
    document.getElementById('simonMsg').innerText="¡Tu turno!"; 
    document.getElementById('simonMsg').style.color="var(--brain)"; 
} 
export function simonClick(c) { 
    if(simonLocked)return; 
    const b=document.getElementById('btn-'+c);b.classList.add('active');setTimeout(()=>b.classList.remove('active'),150); 
    if(c===simonSeq[simonStep]){
        simonStep++;
        if(simonStep===simonSeq.length){
            adm.record(true, 1000); 
            simonLocked=true;
            setTimeout(nextSimon,800);
        }
    }else{
        adm.record(false, 1000);
        let mLvl=simonSeq.length-1;
        let stats = adm.getStats();
        let h=`<div class="res-item"><span>Nivel Máximo:</span><span class="res-val">${mLvl}</span></div><div class="res-item"><span>Puntuación Global:</span><span class="res-val">${stats.finalScore} pts</span></div>`;
        showGameResult(h,'simon',stats.finalScore,false);
    } 
}

// ==========================================
// 4. STROOP (CONTROL INHIBITORIO)
// ==========================================
export const stroopData=[{txt:"ROJO",val:"red",hex:"#ef4444"},{txt:"AZUL",val:"blue",hex:"#3b82f6"},{txt:"VERDE",val:"green",hex:"#22c55e"},{txt:"AMARILLO",val:"yellow",hex:"#eab308"}]; 
export let strCount=0,strTarget="",strSpawn=0,strTimeout=null,strInt=null,strTimeLeft=3000; 
export function startStroop() { 
    gameSessionStart = Date.now();
    adm = new AdaptiveDifficultyManager(); strCount=0; document.getElementById('strScore').innerText="Aciertos: 0"; showScreen('gameStroop'); nextStroop(); 
} 
export function nextStroop() { 
    if(strCount>=20){
        let stats = adm.getStats();
        let h=`<div class="res-item"><span>Puntuación:</span><span class="res-val">${stats.finalScore}</span></div><div class="res-item"><span>Precisión:</span><span class="res-val">${stats.precision}%</span></div><div class="res-item"><span>Velocidad:</span><span class="res-val">${stats.ppm} PPM</span></div>`;
        showGameResult(h,'stroop',stats.finalScore,false);
        return;
    } 
    strCount++; document.getElementById('strCount').innerText=strCount; 
    let wObj=stroopData[Math.floor(Math.random()*4)];
    let cObj=stroopData[Math.floor(Math.random()*4)]; 
    const wN=document.getElementById('strWord');wN.innerText=wObj.txt;wN.style.color=cObj.hex;
    strTarget=cObj.val; 
    
    // IA Adaptativa: El tiempo se ajusta según el rendimiento
    strTimeLeft = adm.getTime();
    let totalTime = strTimeLeft;
    
    document.getElementById('strBar').style.width="100%"; 
    strSpawn=Date.now(); 
    clearInterval(strInt); 
    strInt=setInterval(()=>{
        strTimeLeft-=100;
        document.getElementById('strBar').style.width=(strTimeLeft/totalTime*100)+"%";
        if(strTimeLeft<=0)strClick("TIMEOUT");
    },100); 
} 
export function strClick(val) { 
    clearInterval(strInt); 
    let tTaken=Date.now()-strSpawn; 
    if(val===strTarget){
        adm.record(true, tTaken);
        document.getElementById('strScore').innerText="Aciertos: "+adm.totalHits;
    } else { adm.record(false, tTaken); }
    nextStroop(); 
}

// ==========================================
// 5. N-BACK (MEMORIA DE TRABAJO)
// ==========================================
export let nbSeq = [], nbStep = 0, nbCurrentMatch = false;
export function startNBack() {
    gameSessionStart = Date.now();
    adm = new AdaptiveDifficultyManager({
        tiempoInicial: 1500,
        tiempoMinimo: 600,
        tiempoMaximo: 2500
    });
    nbSeq = []; nbStep = 0; 
    showScreen('gameNBack');
    for(let i=0; i<20; i++) {
        if (i >= 2 && Math.random() < 0.3) nbSeq.push(nbSeq[i-2]);
        else nbSeq.push(Math.floor(Math.random()*9));
    }
    document.getElementById('nbackScore').innerText="Aciertos: 0";
    nextNBack();
}
export function nextNBack() {
    if(nbStep >= nbSeq.length) {
        let stats = adm.getStats();
        let h=`<div class="res-item"><span>Puntuación:</span><span class="res-val">${stats.finalScore}</span></div><div class="res-item"><span>Precisión:</span><span class="res-val">${stats.precision}%</span></div><div class="res-item"><span>Velocidad:</span><span class="res-val">${stats.ppm} PPM</span></div>`;
        showGameResult(h,'nback',stats.finalScore,false);
        return;
    }
    document.querySelectorAll('.nback-cell').forEach(c => c.classList.remove('active'));
    let cell = document.getElementById('nbc-' + nbSeq[nbStep]);
    cell.classList.add('active');
    nbCurrentMatch = (nbStep >= 2 && nbSeq[nbStep] === nbSeq[nbStep-2]);
    let tSpawn = Date.now();
    window.currentNBackSpawn = tSpawn;
    window.currentNBackAnswered = false;
    // IA Adaptativa: El tiempo se ajusta según el rendimiento
    let displayTime = adm.getTime();
    if (displayTime > 2000) displayTime = 2000; // Cap para N-Back
    
    let gapTime = Math.max(200, displayTime / 3);
    setTimeout(() => {
        cell.classList.remove('active');
        if (nbCurrentMatch && !window.currentNBackAnswered) adm.record(false, displayTime);
        else if (!nbCurrentMatch && !window.currentNBackAnswered) adm.record(true, displayTime);
        document.getElementById('nbackScore').innerText="Aciertos: "+adm.totalHits;
        nbStep++;
        setTimeout(nextNBack, gapTime);
    }, displayTime);
}
export function clickNBack() {
    if (window.currentNBackAnswered) return;
    window.currentNBackAnswered = true;
    let tTaken = Date.now() - window.currentNBackSpawn;
    if (nbCurrentMatch) adm.record(true, tTaken);
    else adm.record(false, tTaken);
    document.getElementById('nbackScore').innerText="Aciertos: "+adm.totalHits;
}

// ==========================================
// 6. SILOGISMOS LÓGICOS
// ==========================================
export let sylCount = 0, sylTotal = 10, sylAns = true, sylSpawn = 0;
export function startSyllogism() {
    gameSessionStart = Date.now();
    adm = new AdaptiveDifficultyManager();
    sylCount = 0;
    document.getElementById('sylScore').innerText = "1/10";
    showScreen('gameSyllogism');
    nextSyllogism();
}
export function nextSyllogism() {
    if (sylCount >= sylTotal) {
        let stats = adm.getStats();
        let h=`<div class="res-item"><span>Puntuación:</span><span class="res-val">${stats.finalScore}</span></div><div class="res-item"><span>Precisión:</span><span class="res-val">${stats.precision}%</span></div><div class="res-item"><span>Velocidad:</span><span class="res-val">${stats.ppm} PPM</span></div>`;
        showGameResult(h,'syllogism',stats.finalScore,false);
        return;
    }
    sylCount++;
    document.getElementById('sylScore').innerText = `${sylCount}/${sylTotal}`;
    let mult = adm.getMultiplier();
    const entities = ["Cuadrado", "Círculo", "Triángulo", "Rombo"];
    entities.sort(() => Math.random() - 0.5);
    let isTrue = Math.random() > 0.5;
    sylAns = isTrue;
    let p1, p2, conc;
    if (mult < 1.5) {
        p1 = `${entities[0]} es mayor que ${entities[1]}`;
        p2 = `${entities[1]} es mayor que ${entities[2]}`;
        if (isTrue) conc = `Por tanto, ${entities[0]} es mayor que ${entities[2]}`;
        else conc = `Por tanto, ${entities[2]} es mayor que ${entities[0]}`;
    } else {
        let r = Math.random();
        if (r < 0.5) {
            p1 = `${entities[0]} no es menor que ${entities[1]}`;
            p2 = `${entities[1]} es mayor que ${entities[2]}`;
            if (isTrue) conc = `Por tanto, ${entities[0]} es mayor que ${entities[2]}`;
            else conc = `Por tanto, ${entities[2]} es mayor que ${entities[0]}`;
        } else {
            p1 = `${entities[0]} es más rápido que ${entities[1]}`;
            p2 = `${entities[2]} es más lento que ${entities[1]}`; 
            if (isTrue) conc = `Por tanto, ${entities[0]} es más rápido que ${entities[2]}`;
            else conc = `Por tanto, ${entities[2]} es más rápido que ${entities[0]}`;
        }
    }
    document.getElementById('sylP1').innerText = p1;
    document.getElementById('sylP2').innerText = p2;
    document.getElementById('sylC').innerText = conc;
    sylSpawn = Date.now();
}
export function submitSyllogism(ans) {
    let t = Date.now() - sylSpawn;
    if (ans === sylAns) adm.record(true, t);
    else adm.record(false, t);
    nextSyllogism();
}

// ==========================================
// 7. ROTACIÓN ESPACIAL
// ==========================================
export let spatCount = 0, spatTotal = 10, spatAns = 0, spatSpawn = 0;
export function startSpatial() {
    gameSessionStart = Date.now();
    adm = new AdaptiveDifficultyManager();
    spatCount = 0;
    showScreen('gameSpatial');
    nextSpatial();
}
export function nextSpatial() {
    if (spatCount >= spatTotal) {
        let stats = adm.getStats();
        let h=`<div class="res-item"><span>Puntuación:</span><span class="res-val">${stats.finalScore}</span></div><div class="res-item"><span>Precisión:</span><span class="res-val">${stats.precision}%</span></div><div class="res-item"><span>Velocidad:</span><span class="res-val">${stats.ppm} PPM</span></div>`;
        showGameResult(h,'spatial',stats.finalScore,false);
        return;
    }
    spatCount++;
    document.getElementById('spatScore').innerText = `${spatCount}/${spatTotal}`;
    let mult = adm.getMultiplier();
    let numBlocks = Math.floor(3 + mult); 
    let grid = Array(9).fill(0);
    let indices = [0,1,2,3,4,5,6,7,8];
    indices.sort(() => Math.random() - 0.5);
    for(let i=0; i<numBlocks; i++) grid[indices[i]] = 1;
    
    function rotate90(g) { return [g[6],g[3],g[0], g[7],g[4],g[1], g[8],g[5],g[2]]; }
    let r90 = rotate90(grid); let r180 = rotate90(r90); let r270 = rotate90(r180);
    let correctRotations = [r90, r180, r270];
    let correctGrid = correctRotations[Math.floor(Math.random()*3)];
    
    let bad1 = [...correctGrid]; let bad2 = [...correctGrid];
    let flip1 = Math.floor(Math.random()*9); bad1[flip1] = bad1[flip1] === 1 ? 0 : 1;
    let flip2 = Math.floor(Math.random()*9); while (flip2 === flip1) flip2 = Math.floor(Math.random()*9); bad2[flip2] = bad2[flip2] === 1 ? 0 : 1;
    
    let options = [correctGrid, bad1, bad2];
    options.sort(() => Math.random() - 0.5);
    spatAns = options.indexOf(correctGrid);
    
    document.getElementById('spatMain').innerHTML = grid.map(b => `<div class="spat-cell ${b?'active':''}"></div>`).join('');
    for(let i=0; i<3; i++) {
        document.getElementById('spatOpt'+i).innerHTML = options[i].map(b => `<div class="spat-cell ${b?'active':''}"></div>`).join('');
    }
    spatSpawn = Date.now();
}
export function submitSpatial(ans) {
    let t = Date.now() - spatSpawn;
    if (ans === spatAns) adm.record(true, t);
    else adm.record(false, t);
    nextSpatial();
}

// ==========================================
// UTILIDADES GENERALES
// ==========================================
export function openRanking() { showScreen('screenRanking'); let fTab=document.getElementById('rankingTabs').firstElementChild; loadRanking('math',fTab); }
export async function loadRanking(gID, btnEl) { 
    document.querySelectorAll('#rankingTabs .rank-tab').forEach(b=>b.classList.remove('active-tab')); 
    if(btnEl)btnEl.classList.add('active-tab'); 
    const lst=document.getElementById('rankingList'); 
    lst.innerHTML="<div style='text-align:center; color:#fb923c; margin-top:20px; font-weight:800;'>Descargando datos... ☁️</div>"; 
    let isAsc=(gID==='reflex'); let oDir=isAsc?"asc":"desc"; let u=gID==='reflex'?'ms':'pts'; 
    try { 
        if(!db)throw new Error("No DB"); 
        const sn=await db.collection("records_"+gID).orderBy("score",oDir).limit(10).get(); 
        if(sn.empty){lst.innerHTML="<div style='text-align:center; color:#cbd5e1; margin-top:20px;'>Nadie ha jugado aún.</div>";return;} 
        let html=""; let pos=1; 
        sn.forEach(d=>{ 
            let dt=d.data(); 
            let displayName = dt.displayName || dt.user; // Use displayName if available, fallback to uid/old format
            let isCurrent = (dt.user === auth?.currentUser?.uid || displayName === currentUser);
            let med=pos===1?"🥇":(pos===2?"🥈":(pos===3?"🥉":pos+"º")); 
            let hl=isCurrent?"border:1px solid var(--brain); background:rgba(251,146,60,0.15);":""; 
            let cn=isCurrent?"color:var(--brain);":"color:#fff;"; 
            html+=`<div class="res-item" style="align-items:center; ${hl}"><div style="display:flex; align-items:center; gap:15px;"><span style="font-size:1.5rem; width:30px; text-align:center;">${med}</span><span style="font-weight:900; font-size:1.1rem; ${cn} text-transform:uppercase;">${displayName}</span></div><div style="font-weight:900; color:#facc15; font-size:1.2rem;">${dt.score} <span style="font-size:0.8rem; color:#94a3b8;">${u}</span></div></div>`; 
            pos++; 
        }); 
        lst.innerHTML=html; 
    } catch(e) { console.error(e); lst.innerHTML="<div style='text-align:center; color:#ef4444; margin-top:20px;'>Error de conexión. 🚨</div>"; } 
}

export function stopAllGameTimers() {
    clearInterval(mathInt); clearTimeout(refTimeout); clearTimeout(strTimeout); clearInterval(strInt);
}
