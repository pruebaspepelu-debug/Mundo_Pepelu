import { showScreen } from '../core/navigation.js';
import { playZenVoice } from '../core/audio-manager.js';
import { incrementGamify } from './habitos.js';

export const BREATHE_DB = { 
    "478": { 
        n: "Técnica 4-7-8", desc: "Baja el ritmo cardíaco radicalmente. Foco en inducción al sueño profundo.", effect: "SUEÑO PROFUNDO", icon: "🌙", 
        in: 4, hold1: 7, out: 8, hold2: 0, mode: "cycles", 
        options: [{l: "8 Ciclos", v: 8}, {l: "15 Ciclos (Recomendado)", v: 15}, {l: "30 Ciclos (Insomnio)", v: 30}] 
    }, 
    "cohe": { 
        n: "Coherencia Cardíaca", desc: "Sincroniza corazón y cerebro. Ideal para entrar en estado de flujo prolongado.", effect: "ESTADO DE FLUJO", icon: "🌊", 
        in: 5.5, hold1: 0, out: 5.5, hold2: 0, mode: "time", 
        options: [{l: "5 Minutos", v: 300}, {l: "10 Minutos", v: 600}, {l: "20 Minutos (Maestría)", v: 1200}] 
    }, 
    "box": { 
        n: "Respiración Cuadrada", desc: "Devuelve el control bajo presión extrema. Reseteo del sistema nervioso.", effect: "CONCENTRACIÓN LÁSER", icon: "🎯", 
        in: 4, hold1: 4, out: 4, hold2: 4, mode: "time", 
        options: [{l: "3 Minutos", v: 180}, {l: "10 Minutos", v: 600}, {l: "20 Minutos (Táctico)", v: 1200}] 
    }, 
    "sigh": { 
        n: "Suspiro Fisiológico", desc: "Reduce la agitación expulsando CO2 de golpe. Efecto calmante inmediato.", effect: "BOTÓN DEL PÁNICO", icon: "🚨", 
        in: 2, hold1: 0, out: 6, hold2: 0, mode: "cycles", 
        options: [{l: "3 Ciclos", v: 3}, {l: "10 Ciclos", v: 10}, {l: "20 Ciclos", v: 20}] 
    }, 
    "bee": { 
        n: "Respiración de la Abeja", desc: "La vibración prolongada estimula profundamente el nervio vago.", effect: "DESBLOQUEO MENTAL", icon: "🐝", 
        in: 4, hold1: 1, out: 9, hold2: 1, mode: "cycles", 
        options: [{l: "7 Ciclos", v: 7}, {l: "15 Ciclos", v: 15}, {l: "25 Ciclos", v: 25}] 
    }, 
    "nadi": { 
        n: "Respiración Alterna", desc: "Limpia canales y sincroniza ambos hemisferios cerebrales.", effect: "EQUILIBRIO MENTAL", icon: "⚖️", 
        in: 4, hold1: 2, out: 4, hold2: 2, mode: "cycles", 
        options: [{l: "10 Ciclos", v: 10}, {l: "20 Ciclos", v: 20}] 
    }, 
    "circ": { 
        n: "Circular Básica", desc: "Hiperoxigenación rápida del cerebro.", effect: "BRAINSTORMING", icon: "💡", 
        in: 2, hold1: 0, out: 2, hold2: 0, mode: "time", 
        options: [{l: "3 Minutos", v: 180}, {l: "5 Minutos", v: 300}], 
        warning: "⚠️ Ojo: Es normal sentir un ligero cosquilleo." 
    }, 
    "wim": { 
        n: "Activadora (El Café)", desc: "Sube la adrenalina de forma controlada. Despierta de golpe.", effect: "ENERGÍA EXTREMA", icon: "⚡", 
        in: 1, hold1: 0, out: 1, hold2: 0, mode: "cycles", 
        options: [{l: "1 Ronda (30x)", v: 30}, {l: "3 Rondas (90x)", v: 90}] 
    },
    "ujjayi": { 
        n: "Ujjayi (Oceánica)", desc: "Preámbulo a la meditación. Frena los pensamientos mediante el sonido.", effect: "FOCO Y CALOR", icon: "🌊", 
        in: 6, hold1: 0, out: 6, hold2: 0, mode: "time", 
        options: [{l: "5 Minutos", v: 300}, {l: "10 Minutos", v: 600}],
        guide: { title: "El Truco del Océano", text: "Contrae ligeramente la parte posterior de la garganta (la glotis) al inhalar y exhalar por la nariz. Debes escuchar un susurro constante, como las olas del mar dentro de tu cráneo. Usa ese sonido como ancla." }
    },
    "kevala": { 
        n: "Kevala Kumbhaka", desc: "El silencio entre alientos. Apaga el diálogo interno.", effect: "QUIETUD MENTAL", icon: "⏸️", 
        in: 4, hold1: 8, out: 4, hold2: 0, mode: "time", 
        options: [{l: "5 Minutos", v: 300}, {l: "10 Minutos", v: 600}],
        guide: { title: "El Silencio de la Retención", text: "El protagonista aquí no es el aire, es la pausa. Tras inhalar, no bloquees la garganta con fuerza, simplemente deja que el aire descanse dentro. Busca el momento de 'no-movimiento' donde el tiempo parece detenerse." }
    },
    "anapana": { 
        n: "Anapanasati", desc: "Atención desnuda. Afila la mente como un bisturí.", effect: "AGUDEZA LÁSER", icon: "👁️", 
        in: 3, hold1: 0, out: 3, hold2: 0, mode: "time", 
        options: [{l: "10 Minutos", v: 600}, {l: "20 Minutos", v: 1200}],
        guide: { title: "Atención Microscópica", text: "No fuerces la respiración, deja que el cuerpo respire solo. Fija toda tu atención en sentir el ligero roce del aire en la entrada de las fosas nasales o el labio superior. Si te distraes, vuelve a ese punto diminuto." }
    }
};

export function renderBreatheMenu() {
    const container = document.getElementById('breatheListContainer'); 
    container.className = 'hub-grid-container'; // Aseguramos que use la cuadr�cula
    container.innerHTML = '';
    
    for (const [id, tech] of Object.entries(BREATHE_DB)) {
        // Asegurarnos de que la t�cnica conoce su propio ID para la l�gica de voz
        tech.id = id; 
        
        let warningHtml = tech.warning ? <div class="safety-warning" style="margin-top: 10px;"> + tech.warning + </div> : '';
        
        let html = 
            <div class="hub-card zen-theme" style="flex-direction: column; align-items: center; cursor: default; height: 100%;">
                <div class="hub-card-icon" style="margin-bottom: 10px;"> + tech.icon + </div>
                <div class="hub-card-info" style="width: 100%; flex: 1; display: flex; flex-direction: column;">
                    <h4 class="hub-card-title" style="color: var(--breathe); text-align: center; margin-bottom: 8px;"> + tech.effect + </h4>
                    <p class="hub-card-desc" style="text-align: center; margin-bottom: 8px; font-size: 0.95rem;"><strong> + tech.n + </strong></p>
                    <p class="hub-card-desc" style="font-size: 0.8rem; text-align: center; flex: 1; opacity: 0.8;"> + tech.desc + </p>
                     + warningHtml + 
                </div>
                <div class="tech-options" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; width: 100%; justify-content: center; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
        ;
        
        tech.options.forEach(opt => { 
            html += <button class="btn btn-main" style="background: rgba(139, 92, 246, 0.2); border: 1px solid var(--breathe); color: #fff; padding: 10px 15px; font-size: 0.85rem; border-radius: 12px; margin: 0; min-width: 120px;" onclick="initBreatheEngine(' + id + ',  + opt.v + )"> + opt.l + </button>; 
        });
        
        html += </div></div>; 
        container.innerHTML += html;
    }
}

export let bAct=null, bTar=0, bCur=0, bInt=null, bRun=false, bPha=-1, bSec=0, bTick=0;

function showBreatheGuide(id, v) {
    const tech = BREATHE_DB[id];
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0'; modal.style.left = '0';
    modal.style.width = '100vw'; modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(15,23,42,0.95)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.padding = '30px';
    modal.style.color = '#f8fafc';
    modal.style.textAlign = 'center';
    modal.style.backdropFilter = 'blur(10px)';

    const content = document.createElement('div');
    content.className = 'glass-card';
    content.style.maxWidth = '500px';
    content.style.width = '100%';
    content.style.padding = '40px 30px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.alignItems = 'center';
    content.style.gap = '20px';

    const icon = document.createElement('div');
    icon.innerHTML = tech.icon;
    icon.style.fontSize = '3rem';

    const title = document.createElement('h2');
    title.innerText = tech.guide.title;
    title.style.color = 'var(--breathe)';
    title.style.margin = '0';
    title.style.fontSize = '1.5rem';
    title.style.fontWeight = '900';

    const text = document.createElement('p');
    text.innerText = tech.guide.text;
    text.style.color = '#cbd5e1';
    text.style.lineHeight = '1.6';
    text.style.fontSize = '1.1rem';

    const btn = document.createElement('button');
    btn.className = 'btn btn-main';
    btn.style.background = 'var(--breathe)';
    btn.style.color = '#fff';
    btn.style.width = '100%';
    btn.style.marginTop = '10px';
    btn.style.height = '50px';
    btn.style.fontSize = '1.1rem';
    btn.style.borderRadius = '12px';
    btn.style.cursor = 'pointer';
    btn.innerText = 'ENTENDIDO, COMENZAR';
    
    btn.onclick = () => {
        document.body.removeChild(modal);
        initBreatheEngine(id, v, true);
    };

    content.appendChild(icon);
    content.appendChild(title);
    content.appendChild(text);
    content.appendChild(btn);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

export function initBreatheEngine(id, v, skipGuide = false) { 
    if (BREATHE_DB[id].guide && !skipGuide) {
        showBreatheGuide(id, v);
        return;
    }
    bAct=BREATHE_DB[id]; bTar=v; bCur=(bAct.mode==='time')?v:0; bPha=-1; bTick=0; document.getElementById('breatheTitle').innerText=bAct.effect; document.getElementById('breatheDesc').innerText=bAct.n; updBreatheUI(); document.getElementById('breatheCircle').style.transition="transform 0.5s ease"; document.getElementById('breatheCircle').style.transform="scale(1)"; document.getElementById('breatheText').innerText="LISTO"; document.getElementById('btnBreathePlay').innerText="COMENZAR"; document.getElementById('btnBreathePlay').style.display="flex"; showScreen('screenBreatheActive'); 
}
export function toggleBreathe() { if(bRun){clearInterval(bInt);bRun=false;document.getElementById('btnBreathePlay').innerText="REANUDAR";document.getElementById('breatheCircle').style.transition="none";}else{bRun=true;document.getElementById('btnBreathePlay').innerText="PAUSA";if(bPha===-1)nextBreathePha();bInt=setInterval(breatheTick,500);} }
export function stopBreathe() { clearInterval(bInt); bRun=false; }
export function breatheTick() { bTick+=0.5; if(bAct.mode==='time'&&bTick%1===0){bCur--;if(bCur<=0){finBreathe();return;}} bSec-=0.5; if(bSec<=0)nextBreathePha(); if(bTick%1===0)updBreatheUI(); }
export function nextBreathePha() { bPha=(bPha+1)%4; if(bPha===0&&bAct.mode==='cycles'){bCur++;if(bCur>bTar){finBreathe();return;}} if(bPha===0)bSec=bAct.in; else if(bPha===1)bSec=bAct.hold1; else if(bPha===2)bSec=bAct.out; else if(bPha===3)bSec=bAct.hold2; if(bSec===0){nextBreathePha();return;} applyBreatheVis(); }
export function applyBreatheVis() { const c=document.getElementById('breatheCircle'); const t=document.getElementById('breatheText'); if(bPha===0){t.innerText=bAct.id==='sigh'?"INHALA DOBLE":"INHALA";playZenVoice(bAct.id==='sigh'?'inhala_doble':'inhala');c.style.transition=`transform ${bSec}s linear`;c.style.transform="scale(2.2)";} else if(bPha===1){t.innerText="AGUANTA";playZenVoice('aguanta');} else if(bPha===2){t.innerText="EXHALA";playZenVoice('exhala');c.style.transition=`transform ${bSec}s linear`;c.style.transform="scale(1)";} else if(bPha===3){t.innerText="AGUANTA";playZenVoice('aguanta');} }
export function updBreatheUI() { const d=document.getElementById('breatheTimerDisplay'); if(bAct.mode==='time'){let m=Math.floor(bCur/60);let s=bCur%60;d.innerText=`${m}:${s<10?'0'+s:s}`;}else{let sc=bCur===0?1:(bCur>bTar?bTar:bCur);d.innerText=`${sc}/${bTar}`;} }
export function finBreathe() { 
    stopBreathe(); 
    document.getElementById('breatheText').innerText="FIN"; 
    document.getElementById('breatheCircle').style.transition="transform 1s ease"; 
    document.getElementById('breatheCircle').style.transform="scale(1)"; 
    document.getElementById('btnBreathePlay').style.display="none"; 
    document.getElementById('breatheTimerDisplay').innerText="✅"; 
    
    // Conexión con Gamificación
    incrementGamify('mindfulness_sesiones', 1);
}

