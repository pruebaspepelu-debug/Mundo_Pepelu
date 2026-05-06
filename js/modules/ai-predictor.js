import { loadMonthlyHabits, calculateDailyXP } from './habitos.js';

/**
 * Analiza los últimos días y genera una predicción o mensaje motivacional usando IA local.
 */
export async function runAIPrediction() {
    const habits = await loadMonthlyHabits();
    
    // Extraer XP de los últimos 4 días (hoy y los 3 anteriores)
    const recentXP = [];
    for (let i = 0; i < 4; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const dayData = habits[dateStr];
        if (dayData) {
            recentXP.push(calculateDailyXP(dayData).total);
        } else {
            recentXP.push(0); // Si no hay datos, 0 XP
        }
    }
    
    // Analizar patrón de caída: XP está disminuyendo o es consistentemente bajo (<50)
    // recentXP[0] es hoy, recentXP[1] es ayer...
    // Queremos ver si ayer < anteayer < trasanteayer
    let isDropping = false;
    if (recentXP.length >= 4) {
        if (recentXP[1] < recentXP[2] && recentXP[2] < recentXP[3]) {
            isDropping = true;
        } else if (recentXP[1] < 50 && recentXP[2] < 50) {
            isDropping = true;
        }
    }

    // Solo intervenimos si hay peligro inminente (caída o estancamiento)
    if (isDropping) {
        const prompt = `Actúa como un sargento instructor militar de alto rendimiento. El soldado (usuario) lleva varios días bajando su puntuación de disciplina (XP ayer: ${recentXP[1]}, anteayer: ${recentXP[2]}). Escribe UN SOLO PÁRRAFO corto, brutal y directo (máximo 30 palabras) para que despierte y cumpla sus objetivos hoy. No uses comillas ni saludos, ve directo al grano.`;
        
        const message = await generateAIMessage(prompt, "¡SOLDADO! Estás bajando el ritmo. Tus números de los últimos días son inaceptables. Levántate ahora mismo, recupera el foco y ejecuta tu plan del día sin excusas.");
        
        displayGuardianMessage(message);
    }
}

/**
 * Llama a window.ai (Gemini Nano) si está disponible, sino usa el fallback.
 */
async function generateAIMessage(prompt, fallback) {
    if (window.ai && window.ai.createTextSession) {
        try {
            const session = await window.ai.createTextSession();
            const result = await session.prompt(prompt);
            session.destroy();
            return result;
        } catch (e) {
            console.error("Error al generar IA local:", e);
            return fallback;
        }
    } else {
        // Fallback heurístico
        return fallback;
    }
}

function displayGuardianMessage(msg) {
    const container = document.getElementById('aiGuardianMessage');
    if (!container) return;
    
    container.innerText = msg;
    container.classList.remove('hidden');
    
    // Ocultar después de 15 segundos
    setTimeout(() => {
        container.classList.add('hidden');
    }, 15000);
}

// Ejecutamos la predicción automáticamente cuando carga la app
setTimeout(() => {
    runAIPrediction();
}, 3000); // Pequeño retraso para dejar cargar Firebase
