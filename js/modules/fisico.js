import { showScreen } from '../core/navigation.js';
import { audioCtx, stopAllVoice, playWorkoutAudio, playBeep, motivaciones, playWorkoutTTS, isVoiceWorkoutOn, initTTS } from '../core/audio-manager.js';
import { db, auth } from '../core/firebase-init.js';
import { incrementGamify } from './habitos.js';

export const ASSETS = {
    leg: { content: '<svg viewBox="0 0 24 24"><path d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5C2,3.89 2.9,3 4,3H20M13,11.5C13,11.5 15,11.5 15,12.5C15,13.5 13,14.5 13,14.5V17H11V14.5C11,14.5 9,13.5 9,12.5C9,11.5 11,11.5 11,11.5V9H13V11.5Z"/></svg>' },
    lunge: { content: '<svg viewBox="0 0 24 24"><path d="M19,15H15V13H19V15M13,7A2,2 0 0,1 11,5A2,2 0 0,1 13,3A2,2 0 0,1 15,5A2,2 0 0,1 13,7M21.54,21.14L20.14,22.54L18.45,15.65L14,13V16H10V10H10.15L12.54,12.42C12.8,12.67 13.15,12.81 13.5,12.81H18V14L21.54,21.14M6.35,16.62L3.88,14.15L7.24,6.75C7.5,6.2 8,5.81 8.6,5.81C9.57,5.81 10.27,6.8 9.91,7.7L7.75,12.5L10,14.74V22H8V15.79L6.35,16.62Z"/></svg>' },
    chair: { content: '<svg viewBox="0 0 24 24"><path d="M20 8H4V6h16v2zm-2-4H6V2h12v2zm2 14v6h-3v-4H7v4H4v-6h16zM4 10h16v6H4v-6z"/></svg>' }, 
    floor: { content: '<svg viewBox="0 0 24 24"><path d="M6,2C4.89,2 4,2.9 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V4C20,2.89 19.1,2 18,2H6M6,4H18V20H6V4M9.5,13.5A2.5,2.5 0 0,1 12,11A2.5,2.5 0 0,1 14.5,13.5A2.5,2.5 0 0,1 12,16A2.5,2.5 0 0,1 9.5,13.5Z"/></svg>' },
    torso: { content: '<svg viewBox="0 0 24 24"><path d="M12,2A5,5 0 0,1 17,7A5,5 0 0,1 12,12A5,5 0 0,1 7,7A5,5 0 0,1 12,2M12,4A3,3 0 0,0 9,7A3,3 0 0,0 12,10A3,3 0 0,0 15,7A3,3 0 0,0 12,4M19,22H5V20H19V22M17,18H7V16H17V18M15,14H9V12H15V14Z"/></svg>' },
    neck: { content: '<svg viewBox="0 0 24 24"><path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21 1.35.33 2.74.33 4.26 0 4.41-3.59 8-8 8z"/></svg>' },
    roller: { content: '<svg viewBox="0 0 24 24"><path d="M19,10H5V14H19V10M19,8A2,2 0 0,1 21,10V14A2,2 0 0,1 19,16H5A2,2 0 0,1 3,14V10A2,2 0 0,1 5,8H19Z"/></svg>' }
};

export const WORKOUT_DB = {
    home: [
        {id: "gemelo_derecho", n:"Gemelo Derecho", i:"Pie derecho atrás, talón suelo.", a: ASSETS.leg, t: 40}, {id: "gemelo_izquierdo", n:"Gemelo Izquierdo", i:"Pie izquierdo atrás, talón suelo.", a: ASSETS.leg, t: 40}, {id: "cuadriceps_derecho", n:"Cuádriceps Derecho", i:"Talón al glúteo derecho.", a: ASSETS.leg, t: 40}, {id: "cuadriceps_izquierdo", n:"Cuádriceps Izquierdo", i:"Talón al glúteo izquierdo.", a: ASSETS.leg, t: 40}, {id: "femoral_derecho", n:"Femoral Derecho", i:"Talón clavado, punta arriba.", a: ASSETS.leg, t: 40}, {id: "femoral_izquierdo", n:"Femoral Izquierdo", i:"Talón clavado, punta arriba.", a: ASSETS.leg, t: 40}, {id: "aductor_derecho", n:"Aductor Derecho", i:"Piernas abiertas, carga peso a derecha.", a: ASSETS.leg, t: 40}, {id: "aductor_izquierdo", n:"Aductor Izquierdo", i:"Piernas abiertas, carga peso a izquierda.", a: ASSETS.leg, t: 40}, {id: "psoas_derecho", n:"Psoas Derecho", i:"Zancada profunda, rodilla al suelo.", a: ASSETS.lunge, t: 40}, {id: "psoas_izquierdo", n:"Psoas Izquierdo", i:"Zancada profunda, rodilla al suelo.", a: ASSETS.lunge, t: 40}, {id: "piramidal_derecho", n:"Piramidal Derecho", i:"Tumbado. Tobillo derecho sobre rodilla izquierda.", a: ASSETS.floor, t: 40}, {id: "piramidal_izquierdo", n:"Piramidal Izquierdo", i:"Tumbado. Tobillo izquierdo sobre rodilla derecha.", a: ASSETS.floor, t: 40}, {id: "pies_juntos", n:"Pies Juntos", i:"Espalda recta, toca puntas.", a: ASSETS.torso, t: 40}, {id: "pies_separados", n:"Pies Separados", i:"Espalda recta, toca suelo centro.", a: ASSETS.torso, t: 40}, {id: "dorsal_derecho", n:"Dorsal Derecho", i:"Brazo derecho cruza por arriba.", a: ASSETS.torso, t: 40}, {id: "dorsal_izquierdo", n:"Dorsal Izquierdo", i:"Brazo izquierdo cruza por arriba.", a: ASSETS.torso, t: 40}, {id: "pectoral_derecho", n:"Pectoral Derecho", i:"Brazo en marco puerta.", a: ASSETS.torso, t: 40}, {id: "pectoral_izquierdo", n:"Pectoral Izquierdo", i:"Brazo en marco puerta.", a: ASSETS.torso, t: 40}, {id: "cobra", n:"Cobra", i:"Tumbado boca abajo, levanta pecho.", a: ASSETS.floor, t: 40}, {id: "cuello_derecho", n:"Cuello Derecho", i:"Oreja al hombro derecho.", a: ASSETS.neck, t: 40}, {id: "cuello_izquierdo", n:"Cuello Izquierdo", i:"Oreja al hombro izquierdo.", a: ASSETS.neck, t: 40}
    ],
    office: [
        {id: "gemelo_derecho", n:"Gemelo Derecho", i:"Pie derecho atrás, empuja pared.", a: ASSETS.leg, t: 40}, {id: "gemelo_izquierdo", n:"Gemelo Izquierdo", i:"Pie izquierdo atrás, empuja pared.", a: ASSETS.leg, t: 40}, {id: "cuadriceps_derecho", n:"Cuádriceps Derecho", i:"De pie. Agárrate a la mesa si necesitas.", a: ASSETS.leg, t: 40}, {id: "cuadriceps_izquierdo", n:"Cuádriceps Izquierdo", i:"De pie. Agárrate a la mesa si necesitas.", a: ASSETS.leg, t: 40}, {id: "femoral_derecho", n:"Femoral Derecho", i:"Talón clavado, punta arriba.", a: ASSETS.leg, t: 40}, {id: "femoral_izquierdo", n:"Femoral Izquierdo", i:"Talón clavado, punta arriba.", a: ASSETS.leg, t: 40}, {id: "aductor_derecho", n:"Aductor Derecho", i:"De pie. Abre piernas, flexiona derecha.", a: ASSETS.leg, t: 40}, {id: "aductor_izquierdo", n:"Aductor Izquierdo", i:"De pie. Abre piernas, flexiona izquierda.", a: ASSETS.leg, t: 40}, {id: "psoas_derecho", n:"Psoas Derecho", i:"Zancada DE PIE. No toques suelo con rodilla.", a: ASSETS.lunge, t: 40}, {id: "psoas_izquierdo", n:"Psoas Izquierdo", i:"Zancada DE PIE. No toques suelo con rodilla.", a: ASSETS.lunge, t: 40}, {id: "piramidal_derecho", n:"Piramidal Derecho", i:"SENTADO en silla. Tobillo sobre rodilla.", a: ASSETS.chair, t: 40}, {id: "piramidal_izquierdo", n:"Piramidal Izquierdo", i:"SENTADO en silla. Tobillo sobre rodilla.", a: ASSETS.chair, t: 40}, {id: "pies_juntos", n:"Pies Juntos", i:"De pie. Baja tronco recto.", a: ASSETS.torso, t: 40}, {id: "pies_separados", n:"Pies Separados", i:"De pie. Baja tronco al centro.", a: ASSETS.torso, t: 40}, {id: "dorsal_derecho", n:"Dorsal Derecho", i:"Brazo derecho cruza por arriba.", a: ASSETS.torso, t: 40}, {id: "dorsal_izquierdo", n:"Dorsal Izquierdo", i:"Brazo izquierdo cruza por arriba.", a: ASSETS.torso, t: 40}, {id: "pectoral_derecho", n:"Pectoral Derecho", i:"Brazo en marco puerta.", a: ASSETS.torso, t: 40}, {id: "pectoral_izquierdo", n:"Pectoral Izquierdo", i:"Brazo en marco puerta.", a: ASSETS.torso, t: 40}, {id: "extension_espalda", n:"Extensión Espalda", i:"DE PIE. Manos a riñones, arquea suave atrás.", a: ASSETS.torso, t: 40}, {id: "cuello_derecho", n:"Cuello Derecho", i:"Oreja al hombro derecho.", a: ASSETS.neck, t: 40}, {id: "cuello_izquierdo", n:"Cuello Izquierdo", i:"Oreja al hombro izquierdo.", a: ASSETS.neck, t: 40}
    ],
    rehab: [
        {id: "gluteo_y_piramidal", n:"Rulo: Glúteo Derecho", t: 120, i:"Cruza tobillo derecho sobre rodilla izquierda.", a: ASSETS.roller}, {id: "gluteo_y_piramidal", n:"Rulo: Glúteo Izquierdo", t: 120, i:"Cruza tobillo izquierdo sobre rodilla derecha.", a: ASSETS.roller}, {id: "espalda_alta_dorsal", n:"Rulo: Espalda Alta", t: 180, i:"Manos en nuca, levanta glúteo y rueda a mitad de espalda.", a: ASSETS.roller}, {id: "cuadriceps_flexores", n:"Rulo: Cuádriceps", t: 90, i:"Boca abajo, rueda de cadera a rodilla con ambas piernas.", a: ASSETS.roller}, {id: "psoas_derecho", n:"Psoas Derecho", t: 45, i:"Una rodilla al suelo. Empuja cadera apretando glúteo.", a: ASSETS.lunge}, {id: "psoas_izquierdo", n:"Psoas Izquierdo", t: 45, i:"Una rodilla al suelo. Empuja cadera apretando glúteo.", a: ASSETS.lunge}, {id: "piramidal_derecho", n:"Piramidal Derecho", t: 45, i:"Boca arriba, tira del muslo derecho al pecho.", a: ASSETS.floor}, {id: "piramidal_izquierdo", n:"Piramidal Izquierdo", t: 45, i:"Boca arriba, tira del muslo izquierdo al pecho.", a: ASSETS.floor}, {id: "pectoral_derecho", n:"Pectoral Derecho", t: 45, i:"En marco, apoya antebrazo y gira tronco.", a: ASSETS.torso}, {id: "pectoral_izquierdo", n:"Pectoral Izquierdo", t: 45, i:"En marco, apoya antebrazo y gira tronco.", a: ASSETS.torso}, {id: "puente_de_gluteo", n:"Puente de Glúteo", t: 50, sets: 3, restSet: 15, i:"12 Repeticiones. Sube cadera apretando fuerte arriba.", a: ASSETS.floor}, {id: "retraccion_escapular", n:"Retracción Escapular", t: 50, sets: 3, restSet: 15, i:"12 Repeticiones. Junta omóplatos, brazos en 'W'.", a: ASSETS.floor}, {id: "cuadrupedia", n:"Cuadrupedia", t: 50, sets: 3, restSet: 15, i:"10 Repeticiones. Alterna brazo y pierna contraria sin arquear.", a: ASSETS.floor}
    ]
};

export let wRoutine=[], wIdx=0, wTimer=40, wIsRunning=false, wInterval=null, wCurrentSet=1;
export let customRoutine = [];
let wRepTimer = 0;
let wCurrentRep = 0;

export function startWorkoutSession(mode) { 
    if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); 
    initTTS(); // Desbloqueo del motor de voz por gesto del usuario
    if (mode === 'custom') {
        if(customRoutine.length === 0) { 
            alert("Añade al menos un ejercicio a tu lista antes de empezar."); 
            return; 
        }
        wRoutine = customRoutine;
        saveCustomRoutine(); 
    } else {
        wRoutine = WORKOUT_DB[mode]; 
    }
    wIdx=0; 
    document.getElementById('workoutModeBadge').innerText=mode === 'office' ? "OFICINA" : (mode === 'home' ? "CASA" : (mode === 'custom' ? "MI RUTINA" : "REHABILITACIÓN")); 
    showScreen('screenWorkout'); 
    loadEx(0, true); 
}
export function exitWorkout() { 
    stopWorkoutTimer(); 
    stopAllVoice(); 
    if(document.getElementById('workoutModeBadge').innerText === "REHABILITACIÓN") showScreen('screenFisicoMenu'); 
    else showScreen('screenEstiramientosMenu'); 
}
export function loadEx(i, isNewEx=true) { 
    if(i>=wRoutine.length){finishWorkout();return;} 
    if(i<0)i=0; wIdx=i; let ex=wRoutine[wIdx]; 
    if(isNewEx)wCurrentSet=1; 
    document.getElementById('exName').innerText=ex.n; 
    document.getElementById('exInstr').innerText=ex.i || "Sigue a tu propio ritmo."; 
    
    // Si la rutina es custom no tiene asset específico, usar torse o genérico
    const svgContent = ex.a ? ex.a.content : ASSETS.torso.content;
    document.getElementById('vizBox').innerHTML=svgContent; 
    const svgEl = document.getElementById('vizBox').querySelector('svg');
    if (svgEl) svgEl.style.fill="#fff";  
    const b=document.getElementById('seriesBadge'); 
    if(ex.sets>1){b.style.display="block";b.innerText=`Serie ${wCurrentSet}/${ex.sets}`;}else{b.style.display="none";} 
    
    wTimer = ex.t || 40; 
    if (ex.type === 'reps') {
        wRepTimer = ex.cadence || 4;
        wCurrentRep = 0;
    }
    
    updateWorkoutTimer(); wIsRunning=false; 
    document.getElementById('btnWorkoutPlay').innerHTML="▶"; 
    
    if(isNewEx) {
        if (ex.isCustom) {
            let msg = "Siguiente ejercicio: " + ex.n + ". ";
            if (ex.type === 'reps') msg += `Haz ${ex.val} repeticiones. `;
            msg += (ex.i ? ex.i : "");
            playWorkoutTTS(msg);
        } else {
            playWorkoutAudio(ex.id, ex.n, ex.i);
        }
    }
}
export function toggleWorkoutPlay() { 
    if(wIsRunning) { 
        stopWorkoutTimer(); 
        document.getElementById('btnWorkoutPlay').innerHTML="▶"; 
    } else { 
        if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); 
        wIsRunning=true; 
        document.getElementById('btnWorkoutPlay').innerHTML="⏸"; 
        wInterval=setInterval(workoutTick, 1000); 
    } 
}
export function workoutTick() { 
    wTimer--; updateWorkoutTimer(); let ex=wRoutine[wIdx]; 
    
    // Lógica de Metrónomo para Repeticiones
    if (ex.type === 'reps') {
        wRepTimer--;
        if (wRepTimer <= 0) {
            wCurrentRep++;
            playBeep('short');
            // Cantar el número cada repetición (o cada 5 si es muy rápido, pero aquí seguimos la orden)
            const numEspanol = ["", "Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez", "Once", "Doce", "Trece", "Catorce", "Quince", "Diez y seis", "Diez y siete", "Diez y ocho", "Diez y nueve", "Veinte"];
            let textoCount = wCurrentRep <= 20 ? numEspanol[wCurrentRep] : wCurrentRep.toString();
            playWorkoutTTS(textoCount);
            updateWorkoutTimer(); // Forzar actualización visual inmediata para sincronizar con la voz
            
            if (wCurrentRep < ex.val) {
                wRepTimer = ex.cadence || 4;
            }
        }
    }

    if(ex.type !== 'reps' && wTimer===20 && (ex.t||40)>25) { 
        if (ex.isCustom) {
            const frases = ["¡Vamos, un último esfuerzo!", "¡Tú puedes, no te rindas!", "¡Ya casi lo tienes!", "¡Mantén el ritmo, Pepelu!"];
            const az = Math.floor(Math.random() * frases.length);
            playWorkoutTTS(frases[az]);
        } else {
            let az=Math.floor(Math.random()*motivaciones.length); 
            playWorkoutAudio(motivaciones[az],"",""); 
        }
    } 
    if(wTimer===5 && ex.type !== 'reps') {
        if (ex.isCustom) playWorkoutTTS("Cinco segundos");
        else playWorkoutAudio("cinco_segundos","Cinco segundos",""); 
    } 
    if(wTimer>0&&wTimer<=3 && ex.type !== 'reps') playBeep('short'); 
    if(wTimer<=0) { 
        stopWorkoutTimer(); 
        playBeep('long'); 
        if(ex.sets && wCurrentSet<ex.sets) { 
            wCurrentSet++; startWorkoutRest(true, ex.restSet || 15); 
        } else { 
            // Usar el descanso entre ejercicios configurado (default 4 si no existe)
            startWorkoutRest(false, ex.restEx || 4); 
        } 
    } 
}
export function startWorkoutRest(isSetRest, duration) { 
    if(!isSetRest && wIdx>=wRoutine.length-1){finishWorkout();return;} 
    const ov=document.getElementById('restLayer'); ov.classList.add('active'); 
    if(isSetRest){
        document.getElementById('restTypeLabel').innerText="DESCANSO";
        document.getElementById('nextExTitle').innerText=wRoutine[wIdx].n+` (Serie ${wCurrentSet})`;
        if (wRoutine[wIdx].isCustom) playWorkoutTTS("Descanso");
        else playWorkoutAudio("descanso","Descanso","");
    }else{
        document.getElementById('restTypeLabel').innerText="CAMBIO";
        document.getElementById('nextExTitle').innerText=wRoutine[wIdx+1].n;
        if (wRoutine[wIdx].isCustom) playWorkoutTTS("Cambio de ejercicio");
        else playWorkoutAudio("cambio","Cambio","");
    } 
    let rTime=duration; document.getElementById('restTimer').innerText=rTime; 
    let rInt=setInterval(()=>{
        rTime--;document.getElementById('restTimer').innerText=rTime;
        if(rTime>0&&rTime<=3) playBeep('short');
        if(rTime<=0){
            clearInterval(rInt);ov.classList.remove('active');
            playBeep('long');
            if(isSetRest){
                if (wRoutine[wIdx].isCustom) playWorkoutTTS("Siguiente serie, ¡vamos!");
                else playWorkoutAudio("siguiente_serie_vamos","Siguiente serie","");
                loadEx(wIdx,false);
            }else{
                if (wRoutine[wIdx+1].isCustom) playWorkoutTTS("Comenzamos");
                else playWorkoutAudio("comenzamos","Comenzamos","");
                loadEx(wIdx+1,true);
            }
            toggleWorkoutPlay();
        }
    },1000); 
}
export function stopWorkoutTimer() { clearInterval(wInterval); wIsRunning=false; } 
export function updateWorkoutTimer() { 
    const ex = wRoutine[wIdx];
    const display = document.getElementById('workoutTimerDisplay');
    if (!display) return;

    if (ex && ex.type === 'reps') {
        display.innerText = wCurrentRep;
        display.style.color = "var(--primary)"; // Color destacado para reps
    } else {
        display.innerText = wTimer >= 60 ? `${Math.floor(wTimer/60)}:${(wTimer%60)<10?'0':''}${wTimer%60}` : wTimer;
        display.style.color = ""; // Color normal
    }
} 
export function nextEx() { stopWorkoutTimer(); stopAllVoice(); loadEx(wIdx+1,true); } 
export function prevEx() { stopWorkoutTimer(); stopAllVoice(); loadEx(wIdx-1,true); } 
export function finishWorkout() { 
    stopWorkoutTimer(); 
    stopAllVoice(); 
    document.getElementById('exName').innerText="¡TERMINADO!"; 
    document.getElementById('exInstr').innerText="Buen trabajo, Pepelu."; 
    document.getElementById('workoutTimerDisplay').style.color = "";
    
    // Conexión con Gamificación
    incrementGamify('fisico_sesiones', 1);
    
    if (wRoutine[wIdx] && wRoutine[wIdx].isCustom) playWorkoutTTS("Entrenamiento terminado. Buen trabajo.");
    else playWorkoutAudio("terminado","Terminado",""); 
}

// =========================================
// RUTINA CUSTOM (FIREBASE)
// =========================================
export async function loadCustomRoutine() {
    if (!auth.currentUser) return;
    try {
        const doc = await db.collection('rutinas_fisico').doc(auth.currentUser.uid).get();
        if (doc.exists) {
            customRoutine = doc.data().routine || [];
            renderCustomRoutine();
        }
    } catch(e) {
        console.error("Error cargando rutina custom:", e);
    }
}

export async function saveCustomRoutine() {
    if (!auth.currentUser) return;
    try {
        await db.collection('rutinas_fisico').doc(auth.currentUser.uid).set({
            routine: customRoutine
        });
    } catch(e) {
        console.error("Error guardando rutina custom:", e);
    }
}

export function addCustomExercise() {
    const nameIn = document.getElementById('crExName');
    const typeIn = document.getElementById('crExType');
    const valIn = document.getElementById('crExVal');
    const cadenceIn = document.getElementById('crExCadence');
    const setsIn = document.getElementById('crExSets');
    const restSetIn = document.getElementById('crExRestSet');
    const restExIn = document.getElementById('crExRestEx');
    const instrIn = document.getElementById('crExInstr');
    
    const name = nameIn.value.trim();
    const type = typeIn.value;
    const val = parseInt(valIn.value);
    const cadence = parseInt(cadenceIn.value) || 4;
    const sets = parseInt(setsIn.value) || 1;
    const restSet = parseInt(restSetIn.value) || 15;
    const restEx = parseInt(restExIn.value) || 30;
    const instr = instrIn ? instrIn.value.trim() : "";
    
    if (!name || isNaN(val) || val <= 0) {
        alert("Introduce un nombre y una cantidad válida.");
        return;
    }
    
    customRoutine.push({
        id: `custom_${Date.now()}`,
        n: name,
        type: type,
        val: val,
        cadence: cadence,
        sets: sets,
        restSet: restSet,
        restEx: restEx,
        t: type === 'reps' ? val * cadence : val,
        i: instr,
        isCustom: true
    });
    
    nameIn.value = '';
    valIn.value = '';
    if(instrIn) instrIn.value = '';
    renderCustomRoutine();
    saveCustomRoutine(); // <- Guardado automático añadido
}

export function deleteCustomExercise(index) {
    customRoutine.splice(index, 1);
    renderCustomRoutine();
    saveCustomRoutine();
}

export function renderCustomRoutine() {
    const list = document.getElementById('crExerciseList');
    if (!list) return;
    list.innerHTML = '';
    
    if(customRoutine.length === 0) {
        list.innerHTML = '<div style="color: #94a3b8; text-align: center; font-size: 0.9rem; margin-top: 10px;">Aún no has añadido ejercicios.</div>';
        return;
    }
    
    customRoutine.forEach((ex, i) => {
        const item = document.createElement('div');
        item.className = 'cr-item';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'flex-start';
        const icon = ex.type === 'reps' ? '🔢' : '⏱️';
        const label = ex.type === 'reps' ? `${ex.val} reps` : `${ex.t}s`;
        const details = `${ex.sets} ser | D.S: ${ex.restSet}s | D.E: ${ex.restEx}s`;
        item.innerHTML = `
            <div style="width:100%; display:flex; justify-content:space-between; align-items:center;">
                <div><span>${icon}</span> <strong>${ex.n}</strong> <span style="color:#94a3b8; font-size:0.85rem;">(${label})</span></div>
                <button class="cr-item-del" onclick="deleteCustomExercise(${i})">🗑️</button>
            </div>
            <div style="font-size:0.75rem; color:var(--primary); font-weight:700; margin-top:2px;">${details}</div>
            ${ex.i ? `<div style="font-size:0.8rem; color:#94a3b8; font-style:italic; margin-top:4px;">"${ex.i}"</div>` : ''}
        `;
        list.appendChild(item);
    });
}
