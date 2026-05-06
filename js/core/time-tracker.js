import { incrementGamify } from '../modules/habitos.js';

let activeModule = null;
let startTime = null;
let intervalId = null;

// Mapa de los módulos a sus keys en Firebase gamificacion_diaria
const moduleKeys = {
    'fisico': null, // Físico no tiene XP por minutos, sino por sesiones
    'juegos': 'juegos_minutos',
    'organizador': 'organizador_minutos',
    'mindfulness': null // Mindfulness va por sesiones largas, pero podemos trackear 'mindfulness_minutos' si queremos, aunque la XP usa sesiones_largas
};

export function startTracking(moduleName) {
    if (activeModule === moduleName) return; // Ya estamos trackeando esto
    
    // Si había uno previo, lo paramos y guardamos el tiempo
    stopTracking();
    
    activeModule = moduleName;
    startTime = Date.now();
    
    // Guardar periódicamente cada 1 minuto (por seguridad ante cierres bruscos)
    // Pero para no saturar Firebase, guardaremos localmente y sincronizaremos con FB al cambiar de pantalla
    intervalId = setInterval(() => {
        // Ping visual o logs si es necesario
        // console.log(`[TimeTracker] Activo en: ${activeModule}`);
    }, 60000);
}

export function stopTracking() {
    if (!activeModule || !startTime) return;
    
    clearInterval(intervalId);
    
    const endTime = Date.now();
    const diffMs = endTime - startTime;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    // Solo guardamos si ha pasado al menos 1 minuto entero, 
    // o podríamos acumular segundos en localStorage.
    // Para simplificar, acumularemos segundos en localStorage y 
    // enviaremos minutos enteros a Firebase.
    
    if (diffMs > 0) {
        const localKey = `time_${activeModule}_seconds`;
        let accumulatedSecs = parseInt(localStorage.getItem(localKey) || '0', 10);
        accumulatedSecs += Math.floor(diffMs / 1000);
        
        const minutesToSync = Math.floor(accumulatedSecs / 60);
        const remainingSecs = accumulatedSecs % 60;
        
        localStorage.setItem(localKey, remainingSecs.toString());
        
        if (minutesToSync > 0 && moduleKeys[activeModule]) {
            incrementGamify(moduleKeys[activeModule], minutesToSync);
        }
        
        // Regla especial Mindfulness: Sesión > 10 min
        if (activeModule === 'mindfulness' && (diffMs / 60000) >= 10) {
            incrementGamify('mindfulness_sesiones_largas', 1);
        }
    }
    
    activeModule = null;
    startTime = null;
}

// Hookeamos el evento de visibilidad para parar si el usuario minimiza
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (activeModule) {
            // Guardamos el módulo actual en una variable temporal para reanudarlo
            const temp = activeModule;
            stopTracking();
            activeModule = temp; // Lo dejamos "preparado"
        }
    } else {
        if (activeModule) {
            // Reanudamos
            const temp = activeModule;
            activeModule = null; // forzar el start
            startTracking(temp);
        }
    }
});
