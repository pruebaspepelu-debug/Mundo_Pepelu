import { db, auth } from '../core/firebase-init.js';
import { showXPNotification } from '../core/notifier.js';

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
        showXPNotification(incrementValue, `Progreso en ${key.split('_')[0].toUpperCase()}`);
        loadTodayStats(); // Actualizar UI del Avatar
    } catch (e) {
        console.error("Error incrementando gamificación:", e);
    }
}

/**
 * Motor de Interfaz HUD TRADING / GAMER PRO
 */
let chartInstance = null;

export async function loadTodayStats() {
    if (!auth.currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    try {
        const doc = await db.collection('gamificacion_diaria').doc(`${auth.currentUser.uid}_${today}`).get();
        const data = doc.exists ? doc.data() : {};
        
        const xpStats = calculateDailyXP(data);
        updateAvatarUI(xpStats);
        updateManaBars(xpStats);
        initTradingChart();
    } catch (e) {
        console.error("Error cargando XP diario:", e);
    }
}

export function updateManaBars(xp) {
    const setBar = (id, current, max) => {
        const fill = document.getElementById(`bar${id}`);
        const text = document.getElementById(`val${id}Text`);
        const percent = (current / max) * 100;
        
        if (fill) {
            fill.style.width = `${Math.min(percent, 100)}%`;
            fill.classList.add('updating');
            setTimeout(() => fill.classList.remove('updating'), 600);
        }
        if (text) text.innerText = `${Math.floor(current)}/${max} XP`;
    };

    setBar('Fisico', xp.fisico, 30);
    setBar('Mental', xp.mente, 20);
    setBar('Org', xp.organizador, 30);
    setBar('Mind', xp.mindfulness, 20);
}

export async function initTradingChart() {
    const container = document.getElementById('trading-chart-container');
    if (!container || chartInstance) return;

    try {
        chartInstance = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: 450,
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
            },
            timeScale: { borderVisible: false },
            rightPriceScale: { borderVisible: false }
        });

        if (chartInstance && typeof chartInstance.addCandlestickSeries === 'function') {
            const candleSeries = chartInstance.addCandlestickSeries({
                upColor: '#00ff88', downColor: '#ff0055', borderVisible: false,
                wickUpColor: '#00ff88', wickDownColor: '#ff0055',
            });
        } else {
            console.warn("LightweightCharts: addCandlestickSeries no disponible. Comprueba la versión de la librería.");
        }
    } catch (e) {
        console.error("Error al inicializar el gráfico de trading:", e);
    }

    // Cargar datos de los últimos 7 días
    const last7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    try {
        const snapshot = await db.collection('gamificacion_diaria')
            .where('uid', '==', auth.currentUser.uid)
            .where('date', '>=', last7Days[0])
            .get();

        const dataMap = {};
        snapshot.forEach(doc => dataMap[doc.data().date] = doc.data());

        const chartData = last7Days.map(date => {
            const dayData = dataMap[date] || {};
            const xp = calculateDailyXP(dayData).total;
            return {
                time: date,
                open: xp * 0.8 || 10,
                high: xp * 1.1 || 20,
                low: xp * 0.7 || 5,
                close: xp || 15
            };
        });

        // INYECTAR DATOS DE PRUEBA (DUMMY DATA) PARA VER EL DISEÑO:
        candleSeries.setData([
            { time: '2026-04-27', open: 10, high: 40, low: 10, close: 35 },
            { time: '2026-04-28', open: 35, high: 60, low: 30, close: 50 },
            { time: '2026-04-29', open: 50, high: 55, low: 20, close: 25 }, // Día malo (rojo)
            { time: '2026-04-30', open: 25, high: 70, low: 25, close: 65 },
            { time: '2026-05-01', open: 65, high: 80, low: 60, close: 75 },
            { time: '2026-05-02', open: 75, high: 100, low: 70, close: 95 }, // Día casi perfecto
        ]);
        
        chartInstance.timeScale().fitContent();
    } catch (e) { console.error(e); }
}

export function calculateDailyXP(data) {
    let fisico = 0;
    let mente = 0;
    let organizador = 0;
    let mindfulness = 0;

    // 1. FÍSICO (Máx 30 XP)
    // 2 sesiones de Estiramientos (+5 XP c/u, máx 10)
    const estiramientos = data.fisico_estiramientos || 0;
    fisico += Math.min(estiramientos, 2) * 5;
    // Sesión Entreno/Rehabilitación (+20 XP)
    if (data.fisico_sesion_fuerte) fisico += 20;
    fisico = Math.min(fisico, 30);

    // 2. MENTAL JUEGOS (Máx 20 XP)
    // >10 min jugando (+15 XP)
    if ((data.juegos_minutos || 0) >= 10) mente += 15;
    // Nuevo Récord (+5 XP)
    if (data.juegos_nuevo_record) mente += 5;
    mente = Math.min(mente, 20);

    // 3. ORGANIZADOR (Máx 30 XP)
    // Auditoría >= 75% (+15 XP)
    if ((data.organizador_cumplimiento || 0) >= 75) organizador += 15;
    // 3 Tareas Foco (+10 XP)
    if (data.organizador_foco_completado) organizador += 10;
    // >10 min organizando (+5 XP)
    if ((data.organizador_minutos || 0) >= 10) organizador += 5;
    organizador = Math.min(organizador, 30);

    // 4. MINDFULNESS (Máx 20 XP)
    // >10 min actividad (+10 XP) y otra sesión >10 min (+10 XP, máx 2 total)
    const mindSessions = data.mindfulness_sesiones_largas || 0; // Guardaremos aquí las sesiones >= 10min
    mindfulness += Math.min(mindSessions, 2) * 10;
    mindfulness = Math.min(mindfulness, 20);

    return { fisico, mente, organizador, mindfulness, total: fisico + mente + organizador + mindfulness };
}

export function updateAvatarUI(xpStats) {
    const ptsDisplay = document.getElementById('energyPointsDisplay');
    const xpPercent = document.getElementById('xpPercentDisplay');
    const xpBar = document.getElementById('xpBarFill');
    
    const totalXP = xpStats.total;
    const pct = Math.min((totalXP / 100) * 100, 100);
    
    if (ptsDisplay) ptsDisplay.innerText = `${Math.floor(totalXP)} XP`;
    if (xpBar) xpBar.style.width = `${pct}%`;
    if (xpPercent) xpPercent.innerText = Math.floor(pct);

    // Call Avatar Engine if loaded
    if (window.updateDragonEvolution) {
        window.updateDragonEvolution(totalXP);
    }
}

/**
 * Calcula la racha actual de días consecutivos con XP >= 75
 * basados en los datos del último mes (simplificación para rendimiento).
 */
export async function calculateCurrentStreak() {
    const habits = await loadMonthlyHabits();
    const todayStr = new Date().toISOString().split('T')[0];
    let streak = 0;
    
    // Contamos hacia atrás empezando por hoy
    for (let i = 0; i < 31; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayData = habits[dateStr];
        if (!dayData) {
            // Si es hoy y no hay datos, miramos ayer. Si es otro día, la racha se rompe.
            if (i === 0) continue; 
            break;
        }
        
        const xp = calculateDailyXP(dayData).total;
        if (xp >= 60) {
            streak++;
        } else {
            // Si el XP es < 60 hoy, la racha se rompió
            if (i === 0) continue; 
            break;
        }
    }
    return streak;
}

/**
 * Suma todo el XP de la vida del usuario para calcular el Crecimiento Físico.
 */
export async function calculateLifetimeXP() {
    if (!auth.currentUser) return 0;
    
    try {
        const snapshot = await db.collection('gamificacion_diaria')
            .where('uid', '==', auth.currentUser.uid)
            .get();
            
        let totalXP = 0;
        snapshot.forEach(doc => {
            totalXP += calculateDailyXP(doc.data()).total;
        });
        
        return totalXP;
    } catch (e) {
        console.error("Error calculando XP Total:", e);
        return 0;
    }
}

// ... rest of the file (heatmap etc) kept for compatibility ...

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

