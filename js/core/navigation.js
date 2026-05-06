import { stopAllVoice, stopAllMusic, startMusicModule, toggleDragonAura } from './audio-manager.js';
import { renderBreatheMenu, stopBreathe } from '../modules/mindfulness.js';
import { stopAllGameTimers } from '../modules/agilidad.js';
import { loadCustomRoutine } from '../modules/fisico.js';
import { startTracking, stopTracking } from './time-tracker.js';

export function showScreen(id) { 
    document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); }); 
    document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('active'); 
    
    // Lógica de Ruta Híbrida (Cerebro Flotante)
    const brain = document.getElementById('tacticalBrain');
    if (brain) {
        if (id === 'screenMain') {
            brain.classList.add('hidden');
            toggleDragonAura(true); // Activar presencia sonora del dragón
        } else {
            brain.classList.remove('hidden');
            toggleDragonAura(false); // Apagar al salir de su sala
        }
    }
}

export function goHome() { 
    stopAllVoice(); 
    stopAllMusic(); 
    stopTracking(); // Paramos tracking al volver al dashboard
    showScreen('screenMain'); 
}

export function openFisicoHub() { 
    showScreen('screenFisicoMenu'); 
    startMusicModule('workout'); 
    startTracking('fisico');
}

export function openEstiramientosHub() { 
    showScreen('screenEstiramientosMenu'); 
    startTracking('fisico');
}

export function openCustomRoutineMenu() {
    showScreen('screenCustomRoutineMenu');
    loadCustomRoutine();
    startTracking('fisico');
}

export function openBreatheHub() { 
    showScreen('screenBreatheMenu'); 
    startMusicModule('zen'); 
    renderBreatheMenu(); 
    startTracking('mindfulness');
}

export function goBackToBreatheMenu() { 
    stopBreathe(); 
    showScreen('screenBreatheMenu'); 
    startTracking('mindfulness');
}

export function openGamesHub() { 
    showScreen('screenGamesMenu'); 
    startMusicModule('games'); 
    startTracking('juegos');
}

export function goBackToGamesMenu() { 
    stopAllGameTimers(); 
    showScreen('screenGamesMenu'); 
    startTracking('juegos');
}
