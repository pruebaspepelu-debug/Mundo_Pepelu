import { stopAllVoice, stopAllMusic, startMusicModule } from './audio-manager.js';
import { renderBreatheMenu, stopBreathe } from '../modules/mindfulness.js';
import { stopAllGameTimers } from '../modules/agilidad.js';
import { loadCustomRoutine } from '../modules/fisico.js';

export function showScreen(id) { 
    document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); }); 
    document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('active'); 
}

export function goHome() { 
    stopAllVoice(); 
    stopAllMusic(); 
    showScreen('screenMain'); 
}

export function openFisicoHub() { 
    showScreen('screenFisicoMenu'); 
    startMusicModule('workout'); 
}

export function openEstiramientosHub() { 
    showScreen('screenEstiramientosMenu'); 
}

export function openCustomRoutineMenu() {
    showScreen('screenCustomRoutineMenu');
    loadCustomRoutine();
}

export function openBreatheHub() { 
    showScreen('screenBreatheMenu'); 
    startMusicModule('zen'); 
    renderBreatheMenu(); 
}

export function goBackToBreatheMenu() { 
    stopBreathe(); 
    showScreen('screenBreatheMenu'); 
}

export function openGamesHub() { 
    showScreen('screenGamesMenu'); 
    startMusicModule('games'); 
}

export function goBackToGamesMenu() { 
    stopAllGameTimers(); 
    showScreen('screenGamesMenu'); 
}
