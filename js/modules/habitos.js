import { db, auth } from '../core/firebase-init.js';

let dailyGamification = {}; // Cache para los puntos del mes

export function openHabitosModal() {
    document.getElementById('modalHabitos').classList.remove('hidden');
    renderHeatmap();
}

export function closeHabitosModal() {
    document.getElementById('modalHabitos').classList.add('hidden');
}

/**
 * Función heredada para compatibilidad: Actualiza un valor en gamificacion_diaria
 */
export async function updateHabit(habitKey, value) {
    if (!auth.currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const ref = db.collection('gamificacion_diaria').doc(`${auth.currentUser.uid}_${today}`);
    try {
        await ref.set({
            uid: auth.currentUser.uid,
            date: today,
            [habitKey]: value,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        loadTodayStats();
    } catch (e) { console.error(e); }
}

/**
 * Función heredada para compatibilidad: Incrementa un valor
 */
export async function incrementHabit(habitKey, incrementValue) {
    return incrementGamify(habitKey, incrementValue);
}

/**
 * Incrementa un contador de gamificación
 */
export async function incrementGamify(key, incrementValue = 1) {
    if (!auth.currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const ref = db.collection('gamificacion_diaria').doc(`${auth.currentUser.uid}_${today}`);
    
    try {
        await ref.set({
            uid: auth.currentUser.uid,
            date: today,
            [key]: firebase.firestore.FieldValue.increment(incrementValue),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`Gamificación incrementada: ${key} += ${incrementValue}`);
        loadTodayStats(); // Actualizar UI del Avatar
    } catch (e) {
        console.error("Error incrementando gamificación:", e);
    }
}

/**
 * Carga las estadísticas de hoy para actualizar el Avatar
 */
export async function loadTodayStats() {
    if (!auth.currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    try {
        const doc = await db.collection('gamificacion_diaria').doc(`${auth.currentUser.uid}_${today}`).get();
        if (doc.exists) {
            const data = doc.data();
            const points = calculateDailyPoints(data);
            updateAvatarUI(points);
        } else {
            updateAvatarUI(0);
        }
    } catch (e) {
        console.error("Error cargando stats de hoy:", e);
    }
}

export function calculateDailyPoints(data) {
    let pts = 0;
    
    // Mindfulness: 1:5, 2:8, 3+:10
    const mind = data.mindfulness_sesiones || 0;
    if (mind >= 3) pts += 10;
    else if (mind === 2) pts += 8;
    else if (mind === 1) pts += 5;
    
    // Físico: 1:7, 2+:10
    const fis = data.fisico_sesiones || 0;
    if (fis >= 2) pts += 10;
    else if (fis === 1) pts += 7;
    
    // Organizador: 15 pts por planificar mañana
    if (data.organizador_planificado) pts += 15;
    
    // Juegos Mentales: 2 pts por cada 5 minutos
    const mins = data.juegos_mentales_minutos || 0;
    pts += Math.floor(mins / 5) * 2;
    
    return pts;
}

export function updateAvatarUI(pts) {
    const avatar = document.getElementById('avatarContainer');
    const name = document.getElementById('energyLevelName');
    const ptsDisplay = document.getElementById('energyPointsDisplay');
    const bar = document.getElementById('energyBarFill');
    
    if (!avatar || !name || !ptsDisplay || !bar) return;
    
    ptsDisplay.innerHTML = `${Math.floor(pts)} <span style="font-size: 0.7rem; color: #64748b;">PTS</span>`;
    
    // Reset aura classes
    avatar.classList.remove('aura-base', 'aura-saiyan', 'aura-dios');
    
    let progress = 0;
    if (pts < 15) {
        avatar.classList.add('aura-base');
        name.innerText = "Estado: Base";
        progress = (pts / 15) * 100;
    } else if (pts < 30) {
        avatar.classList.add('aura-saiyan');
        name.innerText = "Estado: Super Saiyan";
        name.style.color = "#fb923c";
        progress = ((pts - 15) / 15) * 100;
    } else {
        avatar.classList.add('aura-dios');
        name.innerText = "Estado: Ultra Instinto";
        name.style.color = "#fff";
        name.style.textShadow = "0 0 10px #22d3ee";
        progress = 100;
    }
    
    bar.style.width = `${progress}%`;
    
    // Actualizar HUD de Misiones Pendientes
    updateMissionsHUD(pts, avatar.classList.contains('aura-dios'));
}

function updateMissionsHUD(pts, isGodMode) {
    const container = document.getElementById('missionsHUDList');
    if (!container) return;
    
    // Obtenemos los datos de la caché global si están disponibles
    // Como loadTodayStats se llama antes, calculamos el estado
    // Para simplificar, usamos los umbrales de puntos como proxy o 
    // podríamos pasar el objeto data completo.
    
    let html = `
        <div class="mission-hud-item ${pts >= 15 ? 'mission-ok' : 'mission-pending'}">
            <span>${pts >= 15 ? '✅' : '⚠️'}</span>
            <span>Entrenamiento Diario</span>
        </div>
        <div class="mission-hud-item ${isGodMode ? 'mission-ok' : 'mission-pending'}">
            <span>${isGodMode ? '✨' : '⚔️'}</span>
            <span>Estado Ultra Instinto</span>
        </div>
    `;
    container.innerHTML = html;
}

/**
 * Carga los hábitos del mes actual para el Heatmap
 */
export async function loadMonthlyHabits() {
    if (!auth.currentUser) return;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    try {
        const snapshot = await db.collection('gamificacion_diaria')
            .where('uid', '==', auth.currentUser.uid)
            .where('date', '>=', startOfMonth)
            .where('date', '<=', endOfMonth)
            .get();
            
        dailyGamification = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            dailyGamification[data.date] = data;
        });
        
        return dailyGamification;
    } catch (e) {
        console.error("Error cargando gamificación mensual:", e);
        return {};
    }
}

/**
 * Genera el HTML del Heatmap basado en puntos
 */
export async function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;
    
    container.innerHTML = '<div style="grid-column: span 7; text-align: center; color: #94a3b8;">Cargando mapa...</div>';
    
    const habits = await loadMonthlyHabits();
    container.innerHTML = '';
    
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayData = habits[dateStr] || {};
        
        const pts = calculateDailyPoints(dayData);
        let level = 0;
        if (pts > 0) {
            if (pts < 15) level = 1;
            else if (pts < 30) level = 2;
            else if (pts < 45) level = 3;
            else level = 4;
        }
        
        const dayEl = document.createElement('div');
        dayEl.className = `heatmap-day h-level-${level}`;
        dayEl.title = `Día ${i}: ${pts} pts`;
        dayEl.onclick = () => showDayDetails(dateStr, dayData);
        
        container.appendChild(dayEl);
    }
}

export function showDayDetails(date, data) {
    const detailsBox = document.getElementById('habitDetails');
    if (!detailsBox) return;
    
    const pts = calculateDailyPoints(data);
    
    let html = `<div style="font-weight: 800; margin-bottom: 5px; color: #fff;">DETALLES DEL ${date}</div>`;
    html += `<div style="color: #facc15; font-weight: 900; margin-bottom: 15px;">TOTAL: ${pts} PUNTOS</div>`;
    html += '<div class="habit-details-list">';
    
    const list = [
        { val: data.juegos_mentales_minutos || 0, label: 'Mente: Agilidad', unit: 'min', icon: '🧠' },
        { val: data.organizador_planificado ? 1 : 0, label: 'Mente: Planificador', unit: '', icon: '📓' },
        { val: data.fisico_sesiones || 0, label: 'Cuerpo: Entrenamiento', unit: 'ses', icon: '🏃' },
        { val: data.mindfulness_sesiones || 0, label: 'Espíritu: Mindfulness', unit: 'ses', icon: '🫁' }
    ];
    
    list.forEach(h => {
        const isDone = h.val > 0;
        html += `
            <div class="habit-item">
                <div class="habit-status ${isDone ? 'status-done' : 'status-fail'}"></div>
                <span style="font-size: 1.1rem;">${h.icon}</span>
                <span style="color: ${isDone ? '#fff' : '#64748b'};">${h.label}: ${Math.floor(h.val)}${h.unit}</span>
            </div>
        `;
    });
    
    html += '</div>';
    detailsBox.innerHTML = html;
}

