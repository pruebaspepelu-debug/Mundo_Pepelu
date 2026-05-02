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
// PLANIFICADOR DIARIO
// =========================================
export function openIdeaSelector(inputId) {
    activeFocusInput = inputId;
    const list = document.getElementById('ideaSelectorList');
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
    
    document.getElementById('ideaSelectorModal').classList.remove('hidden');
}

export function closeIdeaSelector() {
    document.getElementById('ideaSelectorModal').classList.add('hidden');
    activeFocusInput = null;
}

export function selectIdea(text) {
    if (activeFocusInput) {
        document.getElementById(activeFocusInput).value = text;
        closeIdeaSelector();
    }
}

function generateAgendaHTML() {
    const list = document.getElementById('agendaList');
    if (list.children.length > 0) return; // Ya generado
    
    let html = '';
    const currentHour = new Date().getHours();
    const currentMin = new Date().getMinutes();
    
    for (let h = 6; h <= 23; h++) {
        let hourStr = h.toString().padStart(2, '0');
        
        let isCurrent00 = (h === currentHour && currentMin < 30);
        let rowClass00 = isCurrent00 ? "agenda-row current-hour" : "agenda-row";
        
        let isCurrent30 = (h === currentHour && currentMin >= 30);
        let rowClass30 = isCurrent30 ? "agenda-row current-hour" : "agenda-row";
        
        html += `
            <div class="${rowClass00}">
                <span class="agenda-time">${hourStr}:00</span>
                <input type="text" class="agenda-input" id="agenda-${hourStr}:00" placeholder="..." autocomplete="off">
                <button class="idea-bulb-btn" onclick="openIdeaSelector('agenda-${hourStr}:00')" title="Añadir idea">💡</button>
            </div>
            <div class="${rowClass30}">
                <span class="agenda-time">${hourStr}:30</span>
                <input type="text" class="agenda-input" id="agenda-${hourStr}:30" placeholder="..." autocomplete="off">
                <button class="idea-bulb-btn" onclick="openIdeaSelector('agenda-${hourStr}:30')" title="Añadir idea">💡</button>
            </div>
        `;
    }
    list.innerHTML = html;
}

function getTodayString() {
    const today = new Date();
    // Ajuste de zona horaria local para evitar que getISOString devuelva ayer a última hora
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - offset)).toISOString().slice(0, 10);
    return localISOTime;
}

export let currentLoadedDate = null;

export async function loadPlan(dateStr = null) {
    if (!dateStr) dateStr = getTodayString();
    currentLoadedDate = dateStr;
    
    generateAgendaHTML();
    
    const label = document.getElementById('planDateLabel');
    if (label) {
        label.innerText = (dateStr === getTodayString()) ? "Plan de Hoy" : "Plan del " + dateStr.split('-').reverse().join('/');
    }

    if (!auth.currentUser) return;

    try {
        const doc = await db.collection('diarios').doc(`${auth.currentUser.uid}_${dateStr}`).get();
        if (doc.exists) {
            const data = doc.data();
            
            document.getElementById('focus1').value = data.focus[0] || '';
            document.getElementById('focus2').value = data.focus[1] || '';
            document.getElementById('focus3').value = data.focus[2] || '';
            
            for (let h = 6; h <= 23; h++) {
                let hourStr = h.toString().padStart(2, '0');
                let times = [`${hourStr}:00`, `${hourStr}:30`];
                
                times.forEach(timeStr => {
                    if (data.schedule && data.schedule[timeStr]) {
                        document.getElementById(`agenda-${timeStr}`).value = data.schedule[timeStr];
                    } else {
                        document.getElementById(`agenda-${timeStr}`).value = '';
                    }
                });
            }
        } else {
            // No hay plan hoy, limpiamos
            document.getElementById('focus1').value = '';
            document.getElementById('focus2').value = '';
            document.getElementById('focus3').value = '';
            for (let h = 6; h <= 23; h++) {
                let hourStr = h.toString().padStart(2, '0');
                document.getElementById(`agenda-${hourStr}:00`).value = '';
                document.getElementById(`agenda-${hourStr}:30`).value = '';
            }
        }
    } catch (error) {
        console.error("Error al cargar agenda: ", error);
    }
}

export async function guardarPlan(silent = false, btnElement = null) {
    if (!auth.currentUser) {
        if (!silent) alert("No estás autenticado.");
        return;
    }

    const dateStr = currentLoadedDate || getTodayString();
    
    const focus = [
        document.getElementById('focus1').value.trim(),
        document.getElementById('focus2').value.trim(),
        document.getElementById('focus3').value.trim()
    ];
    
    const schedule = {};
    for (let h = 6; h <= 23; h++) {
        let hourStr = h.toString().padStart(2, '0');
        let timeStr00 = `${hourStr}:00`;
        let timeStr30 = `${hourStr}:30`;
        schedule[timeStr00] = document.getElementById(`agenda-${timeStr00}`).value.trim();
        schedule[timeStr30] = document.getElementById(`agenda-${timeStr30}`).value.trim();
    }
    
    try {
        await db.collection('diarios').doc(`${auth.currentUser.uid}_${dateStr}`).set({
            user: auth.currentUser.uid,
            date: dateStr,
            focus: focus,
            schedule: schedule,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Conexión con Mapa de Constancia (Hábito: Planificar mañana)
        const todayStr = getTodayString();
        const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        
        if (dateStr === tomorrowStr) {
            incrementGamify('organizador_planificado', 1);
        } else if (dateStr === todayStr) {
            // También podemos marcarlo si planifica el mismo día, 
            // pero la orden específica es "para la fecha de mañana"
        }
        
        // Rastreador Silencioso: Registro de actividad
        try {
            await db.collection('user_activity').add({
                uid: auth.currentUser.uid,
                date: dateStr,
                type: "planificacion",
                status: "completed",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (activityError) {
            console.error("Aviso: No se pudo registrar la actividad silenciosa.", activityError);
        }
        
        if (btnElement) {
            const originalText = btnElement.innerText;
            btnElement.innerText = "¡PLAN FIJADO!";
            btnElement.classList.add("btn-fijar-success");
            setTimeout(() => {
                btnElement.innerText = originalText;
                btnElement.classList.remove("btn-fijar-success");
            }, 2500);
        } else if (!silent) {
            alert("¡Plan Guardado con éxito!");
        }
    } catch (error) {
        console.error("Error al guardar agenda: ", error);
        if (!silent) alert("Hubo un error al guardar tu plan.");
    }
}

export async function limpiarDia() {
    if (!auth.currentUser) return;
    if (!confirm("¿Estás seguro de que quieres limpiar toda la agenda de este día?")) return;
    
    const dateStr = currentLoadedDate || getTodayString();
    try {
        await db.collection('diarios').doc(`${auth.currentUser.uid}_${dateStr}`).delete();
        loadPlan(dateStr); // Recargará y vaciará los campos
    } catch (error) {
        console.error("Error al limpiar agenda: ", error);
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
