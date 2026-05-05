import { db, currentUser, auth } from '../core/firebase-init.js';
import { showScreen } from '../core/navigation.js';
import { initCalendar } from './agenda.js';
import { incrementGamify } from './habitos.js';

import { startMusicModule } from '../core/audio-manager.js';

// =========================================
// UI TABS
// =========================================
export function openOrganizador() {
    showScreen('screenOrganizador');
    startMusicModule('org');
    switchOrgTab('ideas');
}
export function switchOrgTab(tabName, dateStr = null) {
    document.getElementById('tabIdeas').classList.remove('active-tab');
    document.getElementById('tabPlanificador').classList.remove('active-tab');
    document.getElementById('tabCalendar').classList.remove('active-tab');
    
    document.getElementById('orgIdeasView').classList.add('view-hidden');
    document.getElementById('orgAgendaView').classList.add('view-hidden');
    document.getElementById('orgCalendarView').classList.add('view-hidden');
    
    document.getElementById('orgIdeasView').classList.remove('view-active');
    document.getElementById('orgAgendaView').classList.remove('view-active');
    document.getElementById('orgCalendarView').classList.remove('view-active');

    if (tabName === 'ideas') {
        document.getElementById('tabIdeas').classList.add('active-tab');
        document.getElementById('orgIdeasView').classList.remove('view-hidden');
        document.getElementById('orgIdeasView').classList.add('view-active');
        loadIdeas();
    } else if (tabName === 'planificador') {
        document.getElementById('tabPlanificador').classList.add('active-tab');
        document.getElementById('orgAgendaView').classList.remove('view-hidden');
        document.getElementById('orgAgendaView').classList.add('view-active');
        loadPlan(dateStr);
    } else if (tabName === 'calendar') {
        document.getElementById('tabCalendar').classList.add('active-tab');
        document.getElementById('orgCalendarView').classList.remove('view-hidden');
        document.getElementById('orgCalendarView').classList.add('view-active');
        initCalendar();
    }
}

export function loadSpecificDay(dateStr) {
    showScreen('screenOrganizador');
    startMusicModule('org');
    switchOrgTab('planificador', dateStr);
}

// =========================================
// EMBUDO DE IDEAS
// =========================================
export async function addIdea(priority) {
    if (!auth.currentUser) {
        console.warn("Esperando autenticación de Firebase...");
        return;
    }

    const input = document.getElementById('ideaInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    try {
        await db.collection('ideas').add({
            user: auth.currentUser.uid,
            text: text,
            priority: priority,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = '';
    } catch (error) {
        console.error("Error al guardar la idea: ", error);
        alert("Hubo un error al guardar tu idea.");
    }
}

let ideasUnsubscribe = null;
export let cachedIdeas = [];
export let activeFocusInput = null;

export function loadIdeas() {
    if (!auth.currentUser) return;

    if (ideasUnsubscribe) {
        ideasUnsubscribe();
    }

    ideasUnsubscribe = db.collection('ideas')
        .where('user', '==', auth.currentUser.uid)
        .onSnapshot((snapshot) => {
            const redCol = document.getElementById('container-red');
            const yellowCol = document.getElementById('container-yellow');
            const greenCol = document.getElementById('container-green');
            
            if (!redCol || !yellowCol || !greenCol) return;
            
            redCol.innerHTML = '';
            yellowCol.innerHTML = '';
            greenCol.innerHTML = '';
            
            let ideas = [];
            snapshot.forEach(doc => {
                ideas.push({ id: doc.id, ...doc.data() });
            });
            
            // Ordenar en cliente para evitar error de "Index Required" en Firestore
            ideas.sort((a, b) => {
                let tA = a.timestamp ? a.timestamp.toMillis() : Date.now();
                let tB = b.timestamp ? b.timestamp.toMillis() : Date.now();
                return tB - tA;
            });
            
            cachedIdeas = ideas;
            
            ideas.forEach(data => {
                const ideaEl = document.createElement('div');
                ideaEl.className = `idea-card idea-${data.priority}`;
                
                ideaEl.innerHTML = `<span>${data.text}</span>`;
                
                const delBtn = document.createElement('button');
                delBtn.className = 'delete-idea';
                delBtn.innerText = '✕';
                delBtn.title = 'Borrar Idea';
                delBtn.onclick = () => deleteIdea(data.id);
                ideaEl.appendChild(delBtn);
                
                switch (data.priority) {
                    case 'red':
                        redCol.appendChild(ideaEl);
                        break;
                    case 'yellow':
                        yellowCol.appendChild(ideaEl);
                        break;
                    case 'green':
                        greenCol.appendChild(ideaEl);
                        break;
                }
            });
        }, (error) => {
            console.error("Error escuchando ideas: ", error);
        });
}

async function deleteIdea(id) {
    if (confirm("¿Borrar esta idea?")) {
        try {
            await db.collection('ideas').doc(id).delete();
        } catch (error) {
            console.error("Error al borrar la idea: ", error);
        }
    }
}

// =========================================
// SELECCIÓN DE IDEAS PARA PLANIFICADOR
// =========================================
export function openIdeaSelector(inputId) {
    activeFocusInput = inputId;
    const list = document.getElementById('ideaSelectorList');
    if (!list) return;
    list.innerHTML = '';
    
    if (cachedIdeas.length === 0) {
        list.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 20px;">No hay ideas en tu embudo.</div>';
    } else {
        cachedIdeas.forEach(idea => {
            const ideaEl = document.createElement('div');
            ideaEl.className = `idea-card idea-${idea.priority}`;
            ideaEl.innerHTML = `<span>${idea.text}</span>`;
            ideaEl.onclick = () => selectIdea(idea.text);
            list.appendChild(ideaEl);
        });
    }
    
    const modal = document.getElementById('ideaSelectorModal');
    if (modal) modal.classList.remove('hidden');
}

export function closeIdeaSelector() {
    const modal = document.getElementById('ideaSelectorModal');
    if (modal) modal.classList.add('hidden');
    activeFocusInput = null;
}

export function selectIdea(text) {
    if (activeFocusInput) {
        const input = document.getElementById(activeFocusInput);
        if (input) input.value = text;
        
        // Si el input activo es el de snapshot, lo procesamos
        if (activeFocusInput === 'snapshotInput') {
             // addSnapshotTask logic? No, just set value.
        }
        
        closeIdeaSelector();
    }
}

// =========================================
// SISTEMA SNAPSHOT (PLANIFICADOR DIARIO)
// =========================================

// =========================================
// SISTEMA SNAPSHOT (PLANIFICADOR DIARIO)
// =========================================

export let currentSnapshotData = {
    focus: ["", "", ""],
    schedule: {} // { "06:00": { text: "...", isDone: false }, ... }
};
let snapshotPhase = 1; // 1: Edición, 2: Lectura, 3: Auditoría

function getTodayString() {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return (new Date(today.getTime() - offset)).toISOString().slice(0, 10);
}

export function loadPlan(dateStr = null) {
    if (!dateStr) dateStr = getTodayString();
    
    const savedPlan = localStorage.getItem('snapshot_plan');
    const today = getTodayString();
    
    if (savedPlan) {
        try {
            const planData = JSON.parse(savedPlan);
            
            // Lógica de Migración: Si venimos de la versión v1 (array de 'tasks')
            if (planData.tasks && (!planData.focus || planData.focus.every(f => !f))) {
                const legacyFocus = planData.tasks.filter(t => t.isFocus);
                const legacyOther = planData.tasks.filter(t => !t.isFocus);
                
                currentSnapshotData.focus = [
                    legacyFocus[0] ? legacyFocus[0].text : "",
                    legacyFocus[1] ? legacyFocus[1].text : "",
                    legacyFocus[2] ? legacyFocus[2].text : ""
                ];
                currentSnapshotData.focusDone = [
                    legacyFocus[0] ? !!legacyFocus[0].isDone : false,
                    legacyFocus[1] ? !!legacyFocus[1].isDone : false,
                    legacyFocus[2] ? !!legacyFocus[2].isDone : false
                ];
                
                currentSnapshotData.schedule = {};
                legacyOther.forEach((t, i) => {
                    // Distribuir en slots de 30 min desde las 09:00
                    let slotHour = 9 + Math.floor(i / 2);
                    let slotMin = (i % 2 === 0) ? "00" : "30";
                    if (slotHour <= 23) {
                        let timeKey = `${slotHour.toString().padStart(2, '0')}:${slotMin}`;
                        currentSnapshotData.schedule[timeKey] = { text: t.text, isDone: !!t.isDone };
                    }
                });
                
                // Guardar migración para que persista
                planData.focus = currentSnapshotData.focus;
                planData.focusDone = currentSnapshotData.focusDone;
                planData.schedule = currentSnapshotData.schedule;
                localStorage.setItem('snapshot_plan', JSON.stringify(planData));
            } else {
                currentSnapshotData = {
                    focus: planData.focus || ["", "", ""],
                    schedule: planData.schedule || {},
                    focusDone: planData.focusDone || [false, false, false]
                };
            }
            
            if (planData.date === today) {
                snapshotPhase = 2;
                renderSnapshotPhase2();
            } else if (planData.date < today) {
                snapshotPhase = 3;
                renderSnapshotPhase3();
            } else {
                snapshotPhase = 1;
                renderSnapshotPhase1();
            }
        } catch (e) {
            console.error("Error parseando snapshot_plan", e);
            snapshotPhase = 1;
            renderSnapshotPhase1();
        }
    } else {
        currentSnapshotData = { focus: ["", "", ""], schedule: {}, focusDone: [false, false, false] };
        snapshotPhase = 1;
        renderSnapshotPhase1();
    }
}

export function sellarPlan() {
    // Recoger Foco
    const f1 = document.getElementById('snapFocus1').value.trim();
    const f2 = document.getElementById('snapFocus2').value.trim();
    const f3 = document.getElementById('snapFocus3').value.trim();
    
    if (!f1 && !f2 && !f3) {
        alert("Define al menos un objetivo de foco antes de sellar.");
        return;
    }
    
    // Recoger Horario
    const schedule = {};
    for (let h = 6; h <= 23; h++) {
        let hStr = h.toString().padStart(2, '0');
        let times = [`${hStr}:00`, `${hStr}:30`];
        times.forEach(t => {
            const val = document.getElementById(`snap-${t}`).value.trim();
            if (val) schedule[t] = { text: val, isDone: false };
        });
    }
    // Añadir 00:00 final
    const val00 = document.getElementById(`snap-00:00`).value.trim();
    if (val00) schedule["00:00"] = { text: val00, isDone: false };

    const today = getTodayString();
    const planData = {
        date: today,
        focus: [f1, f2, f3],
        focusDone: [false, false, false],
        schedule: schedule
    };
    
    localStorage.setItem('snapshot_plan', JSON.stringify(planData));
    currentSnapshotData = planData;
    
    // Gamificación
    incrementGamify('organizador_planificado', 1);
    
    snapshotPhase = 2;
    renderSnapshotPhase2();
    
    const btn = document.getElementById('btnSellarPlan');
    if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = "¡COMPROMISO SELLADO!";
        btn.classList.add("btn-fijar-success");
        setTimeout(() => { btn.innerHTML = orig; btn.classList.remove("btn-fijar-success"); }, 2000);
    }
}

export function toggleDoneSnapshot(type, id) {
    if (snapshotPhase !== 3) return;
    
    if (type === 'focus') {
        currentSnapshotData.focusDone[id] = !currentSnapshotData.focusDone[id];
    } else if (type === 'schedule') {
        currentSnapshotData.schedule[id].isDone = !currentSnapshotData.schedule[id].isDone;
    }
    
    // Guardar cambio
    const planData = JSON.parse(localStorage.getItem('snapshot_plan'));
    planData.focusDone = currentSnapshotData.focusDone;
    planData.schedule = currentSnapshotData.schedule;
    localStorage.setItem('snapshot_plan', JSON.stringify(planData));
    
    renderSnapshotPhase3();
}

export function evaluarConstancia() {
    if (snapshotPhase !== 3) return;
    
    const focusTotal = currentSnapshotData.focus.filter(f => f).length;
    const focusDone = currentSnapshotData.focusDone.filter((d, i) => d && currentSnapshotData.focus[i]).length;
    
    const scheduleItems = Object.values(currentSnapshotData.schedule);
    const scheduleTotal = scheduleItems.length;
    const scheduleDone = scheduleItems.filter(s => s.isDone).length;
    
    const total = focusTotal + scheduleTotal;
    const completed = focusDone + scheduleDone;
    
    if (total === 0) return;
    
    const percentage = (completed / total) * 100;
    let xp = 0;
    
    if (percentage >= 75) xp += 15;
    if (focusTotal > 0 && focusDone === focusTotal) xp += 10;
    
    if (xp > 0) {
        alert(`¡AUDITORÍA COMPLETADA!\nEfectividad: ${Math.round(percentage)}%\nHas extraído +${xp} XP de constancia.`);
        if (window.updateMascotXP) window.updateMascotXP(xp);
    } else {
        alert(`Auditoría finalizada. Efectividad: ${Math.round(percentage)}%. ¡Mañana lo haremos mejor!`);
    }
    
    localStorage.removeItem('snapshot_plan');
    loadPlan();
}

// -- RENDERERS --

function renderSnapshotPhase1() {
    switchPhaseView(1);
    
    // Limpiar inputs foco
    document.getElementById('snapFocus1').value = currentSnapshotData.focus[0];
    document.getElementById('snapFocus2').value = currentSnapshotData.focus[1];
    document.getElementById('snapFocus3').value = currentSnapshotData.focus[2];
    
    const list = document.getElementById('snapshotTimelineEdit');
    if (!list) return;
    list.innerHTML = '';
    
    let html = '';
    for (let h = 6; h <= 23; h++) {
        let hs = h.toString().padStart(2, '0');
        [`${hs}:00`, `${hs}:30`].forEach(t => {
            const val = currentSnapshotData.schedule[t] ? currentSnapshotData.schedule[t].text : '';
            html += `
                <div class="agenda-row">
                    <span class="agenda-time">${t}</span>
                    <input type="text" class="agenda-input" id="snap-${t}" placeholder="..." value="${val}" autocomplete="off">
                    <button class="idea-bulb-btn" onclick="openIdeaSelector('snap-${t}')">💡</button>
                </div>`;
        });
    }
    // 00:00 final
    const val00 = currentSnapshotData.schedule["00:00"] ? currentSnapshotData.schedule["00:00"].text : '';
    html += `<div class="agenda-row"><span class="agenda-time">00:00</span><input type="text" class="agenda-input" id="snap-00:00" placeholder="..." value="${val00}" autocomplete="off"><button class="idea-bulb-btn" onclick="openIdeaSelector('snap-00:00')">💡</button></div>`;
    
    list.innerHTML = html;
}

function renderSnapshotPhase2() {
    switchPhaseView(2);
    
    // Foco View
    const fView = document.getElementById('snapshotFocusView');
    fView.innerHTML = '<div style="text-align: center; font-weight: 800; color: #facc15; margin-bottom: 10px; font-size: 0.9rem;">⭐ OBJETIVOS CRÍTICOS (SELLADOS)</div>';
    currentSnapshotData.focus.forEach((f, i) => {
        if (!f) return;
        const div = document.createElement('div');
        div.className = 'snapshot-task focus-task';
        div.style.marginBottom = '8px';
        div.innerHTML = `<span style="margin-right:10px;">★</span><span class="task-text">${f}</span>`;
        fView.appendChild(div);
    });
    
    // Timeline View
    const list = document.getElementById('snapshotTimelineReadOnly');
    list.innerHTML = '';
    let html = '';
    Object.keys(currentSnapshotData.schedule).sort().forEach(t => {
        const item = currentSnapshotData.schedule[t];
        html += `
            <div class="agenda-row" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0;">
                <span style="width: 60px; font-weight: 800; color: #64748b; font-size: 0.85rem; text-align: center;">${t}</span>
                <span style="flex: 1; color: #f8fafc; font-size: 0.95rem;">${item.text}</span>
            </div>`;
    });
    list.innerHTML = html || '<div style="text-align:center; padding:20px; color:#64748b;">No hay actividades programadas.</div>';
}

function renderSnapshotPhase3() {
    switchPhaseView(3);
    
    // Foco Audit
    const fView = document.getElementById('snapshotFocusView');
    fView.innerHTML = '<div style="text-align: center; font-weight: 800; color: #facc15; margin-bottom: 10px; font-size: 0.9rem;">⭐ AUDITORÍA DE OBJETIVOS</div>';
    currentSnapshotData.focus.forEach((f, i) => {
        if (!f) return;
        const div = document.createElement('div');
        div.className = `snapshot-task focus-task ${currentSnapshotData.focusDone[i] ? 'done' : ''}`;
        div.style.marginBottom = '8px';
        div.style.cursor = 'pointer';
        div.onclick = () => toggleDoneSnapshot('focus', i);
        div.innerHTML = `
            <input type="checkbox" class="audit-checkbox" ${currentSnapshotData.focusDone[i] ? 'checked' : ''} style="margin-right:10px;">
            <span class="task-text">${f}</span>`;
        fView.appendChild(div);
    });
    
    // Timeline Audit
    const list = document.getElementById('snapshotTimelineReadOnly');
    list.innerHTML = '';
    let html = '';
    Object.keys(currentSnapshotData.schedule).sort().forEach(t => {
        const item = currentSnapshotData.schedule[t];
        const isDone = item.isDone;
        html += `
            <div class="snapshot-task ${isDone ? 'done' : ''}" style="margin-bottom: 5px; cursor: pointer;" onclick="toggleDoneSnapshot('schedule', '${t}')">
                <span style="width: 50px; font-weight: 800; color: #64748b; font-size: 0.75rem;">${t}</span>
                <input type="checkbox" class="audit-checkbox" ${isDone ? 'checked' : ''} style="margin-right:10px;">
                <span class="task-text">${item.text}</span>
            </div>`;
    });
    list.innerHTML = html;
}

function switchPhaseView(phase) {
    const p1 = document.getElementById('snapshotPhase1');
    const pView = document.getElementById('snapshotPhaseView');
    const auditActions = document.getElementById('snapshotAuditActions');
    const title = document.getElementById('snapshotPhaseLabel');
    
    if (p1) { p1.classList.add('hidden-phase'); p1.classList.remove('active-phase'); }
    if (pView) { pView.classList.add('hidden-phase'); pView.classList.remove('active-phase'); }
    if (auditActions) auditActions.classList.add('hidden-phase');
    
    if (phase === 1) {
        if (p1) { p1.classList.remove('hidden-phase'); p1.classList.add('active-phase'); }
        if (title) title.innerText = "MODO EDICIÓN";
    } else if (phase === 2) {
        if (pView) { pView.classList.remove('hidden-phase'); pView.classList.add('active-phase'); }
        if (title) title.innerText = "MODO LECTURA (SNAPSHOT)";
    } else if (phase === 3) {
        if (pView) { pView.classList.remove('hidden-phase'); pView.classList.add('active-phase'); }
        if (auditActions) auditActions.classList.remove('hidden-phase');
        if (title) title.innerText = "MODO AUDITORÍA (COMPROMISO DE AYER)";
    }
}

// =========================================
// NAVEGACIÓN Y EVENTOS UI
// =========================================
document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const active = document.activeElement;
    if (!active || (!active.classList.contains('agenda-input') && !active.classList.contains('focus-input'))) return;

    e.preventDefault();
    const inputs = Array.from(document.querySelectorAll('.focus-input, .agenda-input'));
    const index = inputs.indexOf(active);
    
    if (e.key === 'ArrowUp' && index > 0) {
        inputs[index - 1].focus();
    } else if (e.key === 'ArrowDown' && index < inputs.length - 1) {
        inputs[index + 1].focus();
    }
});

document.addEventListener('focusin', (e) => {
    if (e.target && (e.target.classList.contains('agenda-input') || e.target.classList.contains('focus-input'))) {
        setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
    }
});
