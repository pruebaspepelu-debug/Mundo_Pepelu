import { db, auth } from '../core/firebase-init.js';
import { calculateLifetimeXP, calculateCurrentStreak } from './habitos.js';
import { speakElevenLabs } from '../core/audio-manager.js';

let isChatOpen = false;
let memoryCache = [];

/**
 * Abre la interfaz de entrenamiento / chat del dragón.
 */
export async function openDragonChat() {
    const totalXP = await calculateLifetimeXP();
    const streak = await calculateCurrentStreak();
    
    // Bypass Admin para pruebas de IA (Usuario: Joseluisruedas)
    const isDev = auth.currentUser && auth.currentUser.email && 
                 (auth.currentUser.email.toLowerCase().includes('pep') || 
                  auth.currentUser.email.toLowerCase().includes('joseluisruedas'));
    
    // Bloqueo Cognitivo Nivel 1 (Huevo) - Requiere eclosionar (2 días racha)
    if (!isDev && streak < 2 && totalXP < 500) {
        alert("El núcleo del huevo pulsa, pero aún no tiene la capacidad de comunicarse contigo. Rompe el huevo demostrando disciplina: cumple más del 60% de tus objetivos durante 2 días seguidos.");
        return;
    }

    const modal = document.getElementById('dragonChatModal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    isChatOpen = true;
    
    await loadMemories();
    renderChatHistory();
    
    // Mensaje de bienvenida basado en la fase
    if (memoryCache.length === 0) {
        addSystemMessage(getWelcomeMessage(totalXP));
    }
}

export function closeDragonChat() {
    const modal = document.getElementById('dragonChatModal');
    if (modal) modal.classList.add('hidden');
    isChatOpen = false;
}

window.openDragonChat = openDragonChat;
window.closeDragonChat = closeDragonChat;

/**
 * Enviar mensaje del usuario a la IA y guardar memoria.
 */
export async function sendDragonMessage() {
    const input = document.getElementById('dragonChatInput');
    const text = input.value.trim();
    if (!text || !auth.currentUser) return;
    
    input.value = '';
    
    // 1. Mostrar mensaje del usuario
    appendMessageToUI(text, 'user');
    
    // 2. Guardar en la "Bóveda de Conocimiento"
    const memory = {
        text: text,
        timestamp: new Date().getTime()
    };
    memoryCache.push(memory);
    saveMemoryToFirebase(memory);
    
    // 3. Generar respuesta de la IA
    appendMessageToUI("Pensando...", 'dragon-temp');
    
    const response = await generateDragonResponse(text);
    
    // Eliminar el "Pensando..." y poner la respuesta real
    const tempMsg = document.getElementById('temp-msg');
    if (tempMsg) tempMsg.remove();
    
    appendMessageToUI(response, 'dragon');
    
    // HABLAR: Voz del Dragón (Desactivada temporalmente a petición)
    // speakElevenLabs(response);
}

window.sendDragonMessage = sendDragonMessage;

// Evitar que el form haga reload si el usuario pulsa Enter
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('dragonChatInput');
    if (input) {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendDragonMessage();
            }
        });
    }
});

/**
 * Funciones de Base de Datos y Memoria
 */
async function saveMemoryToFirebase(memoryObj) {
    if (!auth.currentUser) return;
    try {
        await db.collection('dragon_memories').add({
            uid: auth.currentUser.uid,
            ...memoryObj
        });
    } catch (e) {
        console.error("Error guardando memoria del dragón:", e);
    }
}

async function loadMemories() {
    if (!auth.currentUser) return;
    try {
        const snapshot = await db.collection('dragon_memories')
            .where('uid', '==', auth.currentUser.uid)
            .orderBy('timestamp', 'asc')
            .limit(20) // Últimos 20 recuerdos para el contexto
            .get();
            
        memoryCache = [];
        snapshot.forEach(doc => {
            memoryCache.push(doc.data());
        });
    } catch (e) {
        console.error("Error cargando memorias:", e);
    }
}

/**
 * Interacción con Gemini Nano (window.ai)
 */
async function generateDragonResponse(userText) {
    const totalXP = await calculateLifetimeXP();
    
    let persona = "Eres una criatura mágica muy joven, hambrienta y hablas con frases instintivas y cortas.";
    if (totalXP >= 5000) {
        persona = "Eres un Dragón Ancestral de Ojos Azules. Eres un dios de la sabiduría táctica, muy estoico y majestuoso.";
    } else if (totalXP >= 2000) {
        persona = "Eres un Sargento Instructor Táctico militar. Rudo, directo y enfocado en la constancia extrema.";
    }

    const contextMemories = memoryCache.map(m => m.text).join(" | ");
    
    const prompt = `
Contexto de Personalidad: ${persona}
Contexto de Memorias (Lo que el usuario te ha dicho antes): ${contextMemories}
Mensaje actual del usuario: "${userText}"

Genera una respuesta corta, directa y en el tono de tu personalidad. No uses comillas.
`;

    if (window.ai && window.ai.createTextSession) {
        try {
            const session = await window.ai.createTextSession();
            const result = await session.prompt(prompt);
            session.destroy();
            return result;
        } catch (e) {
            console.error("Error AI local:", e);
            return fallbackResponse(totalXP);
        }
    } else {
        return fallbackResponse(totalXP);
    }
}

function fallbackResponse(totalXP) {
    if (totalXP >= 5000) return "El tiempo y la constancia revelan la verdad oculta. Continúa tu camino, mortal.";
    if (totalXP >= 2000) return "¡Menos charla y más acción, soldado! Completa tus misiones.";
    return "¡Grawr! ¡Hambre de XP!";
}

function getWelcomeMessage(totalXP) {
    if (totalXP >= 5000) return "Bienvenido de nuevo. Tu constancia habla más fuerte que las palabras. ¿Qué conocimiento buscas hoy?";
    if (totalXP >= 2000) return "¡Soldado en posición! El enlace neuronal está activo. Dame un reporte de situación.";
    return "*Gruñido instintivo* ...comida... XP...";
}

/**
 * UI del Chat
 */
function appendMessageToUI(text, sender) {
    const history = document.getElementById('dragonChatHistory');
    if (!history) return;
    
    const div = document.createElement('div');
    div.style.padding = "10px 15px";
    div.style.borderRadius = "8px";
    div.style.marginBottom = "5px";
    div.style.maxWidth = "85%";
    div.style.lineHeight = "1.4";
    
    if (sender === 'user') {
        div.style.background = "rgba(0, 243, 255, 0.2)";
        div.style.border = "1px solid rgba(0, 243, 255, 0.5)";
        div.style.alignSelf = "flex-end";
        div.style.color = "#fff";
        div.innerText = "Tú: " + text;
    } else {
        div.style.background = "rgba(250, 204, 21, 0.1)";
        div.style.border = "1px solid rgba(250, 204, 21, 0.4)";
        div.style.alignSelf = "flex-start";
        div.style.color = "#facc15";
        div.innerText = "🐲: " + text;
        if (sender === 'dragon-temp') div.id = 'temp-msg';
    }
    
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

function addSystemMessage(text) {
    const history = document.getElementById('dragonChatHistory');
    if (!history) return;
    const div = document.createElement('div');
    div.style.textAlign = "center";
    div.style.color = "#94a3b8";
    div.style.fontSize = "0.85rem";
    div.style.margin = "10px 0";
    div.innerText = text;
    history.appendChild(div);
}

function renderChatHistory() {
    const history = document.getElementById('dragonChatHistory');
    if (!history) return;
    history.innerHTML = '';
    // Podríamos renderizar history anterior, pero por ahora solo el contexto en vivo para la IA
}
