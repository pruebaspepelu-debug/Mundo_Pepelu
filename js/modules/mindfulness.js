import { db, auth } from '../core/firebase-init.js';
import { playZenVoice, stopAllVoice, stopAllMusic } from '../core/audio-manager.js';
import { incrementGamify } from './habitos.js';

export const BREATHE_DB = {
    "478": { 
        icon: "🧘", effect: "Relax Profundo (4-7-8)", n: "Anti-Insomnio / Ansiedad",
        desc: "Inhala 4s, Mantén 7s, Exhala 8s. El estándar de oro para calmar el sistema nervioso.",
        options: [{l:"5 Ciclos",v:5}, {l:"10 Ciclos",v:10}],
        inhale: 4, hold: 7, exhale: 8, holdPost: 0
    },
    "box": { 
        icon: "📦", effect: "Respiración Cuadrada", n: "Foco Guerrero (Navy Seals)",
        desc: "4-4-4-4. Estabiliza la mente bajo presión y mejora la concentración.",
        options: [{l:"3 Minutos",v:180}, {l:"5 Minutos",v:300}],
        inhale: 4, hold: 4, exhale: 4, holdPost: 4, mode: 'time'
    },
    "sigh": { 
        icon: "🌬️", effect: "Suspiro Fisiológico", n: "Reset Instantáneo",
        desc: "Doble inhalación corta + exhalación larga. La forma más rápida de bajar el pulso.",
        options: [{l:"5 Ciclos",v:5}, {l:"10 Ciclos",v:10}],
        inhale: 3, hold: 0, exhale: 6, holdPost: 0, warning: "Ideal para picos de estrés."
    },
    "power": { 
        icon: "⚡", effect: "Respiración de Fuego", n: "Energía y Alerta",
        desc: "Inhalaciones y exhalaciones rápidas y rítmicas. Activa el metabolismo.",
        options: [{l:"1 Minuto",v:60}, {l:"2 Minutos",v:120}],
        inhale: 1, hold: 0, exhale: 1, holdPost: 0, mode: 'time'
    }
};

export function renderBreatheMenu() {
    const container = document.getElementById('breatheListContainer'); 
    if (!container) return;
    container.className = 'hub-grid-container';
    container.innerHTML = '';
    
    for (const [id, tech] of Object.entries(BREATHE_DB)) {
        tech.id = id; 
        let warningHtml = tech.warning ? `<div class="safety-warning" style="margin-top: 10px;">${tech.warning}</div>` : '';
        
        let html = `
            <div class="hub-card zen-theme" style="flex-direction: column; align-items: center; cursor: default; height: 100%;">
                <div class="hub-card-icon" style="margin-bottom: 10px;">${tech.icon}</div>
                <div class="hub-card-info" style="width: 100%; flex: 1; display: flex; flex-direction: column;">
                    <h4 class="hub-card-title" style="color: var(--breathe); text-align: center; margin-bottom: 8px;">${tech.effect}</h4>
                    <p class="hub-card-desc" style="text-align: center; margin-bottom: 8px; font-size: 0.95rem;"><strong>${tech.n}</strong></p>
                    <p class="hub-card-desc" style="font-size: 0.8rem; text-align: center; flex: 1; opacity: 0.8;">${tech.desc}</p>
                    ${warningHtml}
                </div>
                <div class="tech-options" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; width: 100%; justify-content: center; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
        `;
        
        tech.options.forEach(opt => { 
            html += `<button class="btn btn-main" style="background: rgba(139, 92, 246, 0.2); border: 1px solid var(--breathe); color: #fff; padding: 10px 15px; font-size: 0.85rem; border-radius: 12px; margin: 0; min-width: 120px;" onclick="initBreatheEngine('${id}', ${opt.v})">${opt.l}</button>`; 
        });
        
        html += `</div></div>`; 
        container.innerHTML += html;
    }
}

export let bAct = null;
export let bStatus = "stopped"; 
export let bCur = 0; 
export let bTar = 0; 
export let bPha = "inhale"; 
export let bPhaRem = 0; 
export let bTimer = null;

export function initBreatheEngine(id, target) {
    bAct = BREATHE_DB[id];
    bTar = target;
    bCur = 0;
    bStatus = "playing";
    bPha = "inhale";
    bPhaRem = bAct.inhale;
    
    document.getElementById('breatheTitle').innerText = bAct.effect;
    document.getElementById('breatheListContainer').classList.add('hidden');
    document.getElementById('activeBreatheScreen').classList.remove('hidden');
    document.getElementById('btnBreathePlay').style.display = "flex";
    
    startBreathe();
}

export function toggleBreathe() {
    if (bStatus === "playing") stopBreathe();
    else startBreathe();
}

export function startBreathe() {
    bStatus = "playing";
    document.getElementById('btnBreathePlay').innerText = "⏸️";
    applyBreatheVis();
    playZenVoice(bAct.id==='sigh'?'inhala_doble':'inhala');
    bTimer = setInterval(breatheTick, 1000);
}

export function stopBreathe() {
    bStatus = "paused";
    document.getElementById('btnBreathePlay').innerText = "▶️";
    clearInterval(bTimer);
}

export function breatheTick() {
    bPhaRem--;
    if (bAct.mode === 'time') bCur++;
    
    if (bPhaRem <= 0) {
        nextBreathePha();
    }
    updBreatheUI();
}

export function nextBreathePha() {
    if (bPha === "inhale") {
        if (bAct.hold > 0) { bPha = "hold"; bPhaRem = bAct.hold; playZenVoice('manten'); }
        else { bPha = "exhale"; bPhaRem = bAct.exhale; playZenVoice('exhala'); }
    } else if (bPha === "hold") {
        bPha = "exhale"; bPhaRem = bAct.exhale; playZenVoice('exhala');
    } else if (bPha === "exhale") {
        if (bAct.holdPost > 0) { bPha = "holdPost"; bPhaRem = bAct.holdPost; playZenVoice('manten'); }
        else {
            if (bAct.mode !== 'time') bCur++;
            if (bAct.mode !== 'time' && bCur >= bTar) { finBreathe(); return; }
            if (bAct.mode === 'time' && bCur >= bTar) { finBreathe(); return; }
            bPha = "inhale"; bPhaRem = bAct.inhale; playZenVoice(bAct.id==='sigh'?'inhala_doble':'inhala');
        }
    } else if (bPha === "holdPost") {
        if (bAct.mode !== 'time') bCur++;
        if (bAct.mode !== 'time' && bCur >= bTar) { finBreathe(); return; }
        if (bAct.mode === 'time' && bCur >= bTar) { finBreathe(); return; }
        bPha = "inhale"; bPhaRem = bAct.inhale; playZenVoice(bAct.id==='sigh'?'inhala_doble':'inhala');
    }
    applyBreatheVis();
}

export function applyBreatheVis() {
    const c = document.getElementById('breatheCircle');
    const t = document.getElementById('breatheText');
    if (!c || !t) return;
    if (bPha === "inhale") { t.innerText = "INHALA"; c.style.transform = "scale(1.5)"; c.style.transition = `transform ${bAct.inhale}s ease-in-out`; }
    else if (bPha === "hold" || bPha === "holdPost") { t.innerText = "MANTÉN"; c.style.transition = "none"; }
    else if (bPha === "exhale") { t.innerText = "EXHALA"; c.style.transform = "scale(1)"; c.style.transition = `transform ${bAct.exhale}s ease-in-out`; }
}

export function updBreatheUI() {
    const d = document.getElementById('breatheTimerDisplay');
    if (!d) return;
    if (bAct.mode === 'time') {
        let m = Math.floor(bCur / 60); let s = bCur % 60;
        d.innerText = `${m}:${s < 10 ? '0' + s : s}`;
    } else {
        let sc = bCur === 0 ? 1 : (bCur > bTar ? bTar : bCur);
        d.innerText = `${sc}/${bTar}`;
    }
}

export function finBreathe() {
    stopBreathe();
    const t = document.getElementById('breatheText');
    const c = document.getElementById('breatheCircle');
    const p = document.getElementById('btnBreathePlay');
    if (t) t.innerText = "FIN";
    if (c) { c.style.transition = "transform 1s ease"; c.style.transform = "scale(1)"; }
    if (p) p.style.display = "none";
    incrementGamify('mindfulness_sesiones', 1);
}
