import { auth, authLogin, authRegister, authResetPassword, logOut } from './core/firebase-init.js';
import { toggleMusic, toggleZenVoice, playZenVoice, startMusicModule, stopAllMusic, stopAllVoice, playBeep, playWorkoutAudio, toggleWorkoutVoice, initTTS } from './core/audio-manager.js';
import { showScreen, goHome, openFisicoHub, openEstiramientosHub, openBreatheHub, goBackToBreatheMenu, openGamesHub, goBackToGamesMenu, openCustomRoutineMenu } from './core/navigation.js';
import { startWorkoutSession, exitWorkout, loadEx, toggleWorkoutPlay, workoutTick, startWorkoutRest, stopWorkoutTimer, updateWorkoutTimer, nextEx, prevEx, finishWorkout, addCustomExercise, deleteCustomExercise } from './modules/fisico.js';
import { renderBreatheMenu, initBreatheEngine, toggleBreathe, stopBreathe, breatheTick, nextBreathePha, applyBreatheVis, updBreatheUI, finBreathe } from './modules/mindfulness.js';
import { checkAndSaveRecordCloud, showGameResult, startMath, genMath, submitMath, startReflex, spawnTarget, clickTarget, startSimon, nextSimon, playSimon, simonClick, startStroop, nextStroop, strClick, startNBack, clickNBack, startSyllogism, submitSyllogism, startSpatial, submitSpatial, openRanking, loadRanking, stopAllGameTimers } from './modules/agilidad.js';
import { initWizardPlaton } from './modules/metafisica.js';
import { switchOrgTab, addIdea, openOrganizador, openIdeaSelector, closeIdeaSelector, selectIdea, loadSpecificDay, sellarPlan, toggleDoneSnapshot, evaluarConstancia } from './modules/organizador.js';
import { prevMonth, nextMonth } from './modules/agenda.js';
import { openHabitosModal, closeHabitosModal, updateHabit, incrementGamify, loadTodayStats } from './modules/habitos.js';

// Inicializar Módulos Avanzados (Protocolos 3 y 4)
import './modules/avatar-engine.js';
import './modules/ai-predictor.js';
import './modules/dragon-chat.js';

// =========================================
// FIREBASE
// =========================================
auth.onAuthStateChanged((user) => {
    if (user) loadTodayStats();
});

// =========================================
// NAVEGACIÓN DINÁMICA (MODO DIOS)
// =========================================
window.showSubMenu = function(module, el) {
    const container = document.getElementById('subMenuContainer');
    if (!container) return;

    container.classList.remove('hidden');
    container.style.display = 'flex'; // Asegurar que sea flex
    
    // Feedback visual en pestañas
    document.querySelectorAll('.hud-tab').forEach(tab => tab.classList.remove('active'));
    el.classList.add('active');

    let html = '';
    switch(module) {
        case 'fisico':
            html = `
                <div class="hub-card fisico-theme mission-mini" onclick="openFisicoHub()">
                    <div class="hub-card-icon" style="font-size: 1.2rem;">🔥</div>
                    <div class="hub-card-info"><h4 class="hub-card-title" style="font-size: 0.9rem;">FUERZA / REHAB</h4></div>
                </div>
                <div class="hub-card fisico-theme mission-mini" onclick="openEstiramientosHub()">
                    <div class="hub-card-icon" style="font-size: 1.2rem;">🧘</div>
                    <div class="hub-card-info"><h4 class="hub-card-title" style="font-size: 0.9rem;">ESTIRAMIENTOS</h4></div>
                </div>
            `;
            break;
        case 'juegos':
            html = `
                <div class="hub-card brain-theme mission-mini" onclick="openGamesHub()">
                    <div class="hub-card-icon" style="font-size: 1.2rem;">🎮</div>
                    <div class="hub-card-info"><h4 class="hub-card-title" style="font-size: 0.9rem;">ENTRENAMIENTO</h4></div>
                </div>
                <div class="hub-card brain-theme mission-mini" onclick="openRanking()">
                    <div class="hub-card-icon" style="font-size: 1.2rem;">🏆</div>
                    <div class="hub-card-info"><h4 class="hub-card-title" style="font-size: 0.9rem;">RANKING</h4></div>
                </div>
            `;
            break;
        case 'organizador':
            html = `
                <div class="hub-card mission-mini" onclick="openOrganizador()" style="border-color: rgba(255,255,255,0.2);">
                    <div class="hub-card-icon" style="font-size: 1.2rem;">📅</div>
                    <div class="hub-card-info"><h4 class="hub-card-title" style="font-size: 0.9rem;">AGENDA</h4></div>
                </div>
                <div class="hub-card mission-mini" onclick="openHabitosModal()" style="border-color: rgba(255,255,255,0.2);">
                    <div class="hub-card-icon" style="font-size: 1.2rem;">🔥</div>
                    <div class="hub-card-info"><h4 class="hub-card-title" style="font-size: 0.9rem;">CONSTANCIA</h4></div>
                </div>
            `;
            break;
        case 'mindfulness':
            html = `
                <div class="hub-card zen-theme mission-mini" onclick="openBreatheHub()">
                    <div class="hub-card-icon" style="font-size: 1.2rem;">🧘</div>
                    <div class="hub-card-info"><h4 class="hub-card-title" style="font-size: 0.9rem;">SESIÓN ZEN</h4></div>
                </div>
            `;
            break;
    }
    
    container.innerHTML = html;
};

window.handleLogin = function() {
    let email = document.getElementById('loginEmail').value.trim();
    let pass = document.getElementById('loginPass').value.trim();
    if (!email || !pass) { alert("Rellena ambos campos."); return; }
    authLogin(email, pass);
};

window.handleRegister = function(e) {
    e.preventDefault();
    let email = document.getElementById('loginEmail').value.trim();
    let pass = document.getElementById('loginPass').value.trim();
    if (!email || !pass) { alert("Rellena ambos campos para registrarte."); return; }
    if (pass.length < 6) { alert("La contraseña debe tener al menos 6 caracteres."); return; }
    authRegister(email, pass);
};

window.handleResetPassword = function(e) {
    e.preventDefault();
    let email = prompt("Introduce tu correo electrónico para recuperar la contraseña:");
    if (email && email.trim() !== "") {
        authResetPassword(email.trim());
    }
};

window.logOut = logOut;

// =========================================
// AUDIO (EXACT BINDINGS REQUESTED)
// =========================================
window.toggleMusic = toggleMusic;
window.playWorkoutAudio = playWorkoutAudio;
window.playZenVoice = playZenVoice;
window.toggleZenVoice = toggleZenVoice;
window.playBeep = playBeep;
window.stopAllVoice = stopAllVoice;
window.stopAllMusic = stopAllMusic;
window.toggleWorkoutVoice = toggleWorkoutVoice;
window.initTTS = initTTS;

window.startMusicModule = startMusicModule;

// =========================================
// NAVIGATION
// =========================================
window.showScreen = showScreen;
window.goHome = goHome;
window.openFisicoHub = openFisicoHub;
window.openEstiramientosHub = openEstiramientosHub;
window.openCustomRoutineMenu = openCustomRoutineMenu;
window.openBreatheHub = openBreatheHub;
window.goBackToBreatheMenu = goBackToBreatheMenu;
window.openGamesHub = openGamesHub;
window.goBackToGamesMenu = goBackToGamesMenu;
window.openOrganizador = openOrganizador;

// =========================================
// FISICO
// =========================================
window.startWorkoutSession = startWorkoutSession;
window.exitWorkout = exitWorkout;
window.loadEx = loadEx;
window.toggleWorkoutPlay = toggleWorkoutPlay;
window.workoutTick = workoutTick;
window.startWorkoutRest = startWorkoutRest;
window.stopWorkoutTimer = stopWorkoutTimer;
window.updateWorkoutTimer = updateWorkoutTimer;
window.nextEx = nextEx;
window.prevEx = prevEx;
window.finishWorkout = finishWorkout;
window.addCustomExercise = addCustomExercise;
window.deleteCustomExercise = deleteCustomExercise;

// =========================================
// MINDFULNESS
// =========================================
window.renderBreatheMenu = renderBreatheMenu;
window.initBreatheEngine = initBreatheEngine;
window.toggleBreathe = toggleBreathe;
window.stopBreathe = stopBreathe;
window.breatheTick = breatheTick;
window.nextBreathePha = nextBreathePha;
window.applyBreatheVis = applyBreatheVis;
window.updBreatheUI = updBreatheUI;
window.finBreathe = finBreathe;

// =========================================
// AGILIDAD
// =========================================
window.checkAndSaveRecordCloud = checkAndSaveRecordCloud;
window.showGameResult = showGameResult;
window.startMath = startMath;
window.genMath = genMath;
window.submitMath = submitMath;
window.startReflex = startReflex;
window.spawnTarget = spawnTarget;
window.clickTarget = clickTarget;
window.startSimon = startSimon;
window.nextSimon = nextSimon;
window.playSimon = playSimon;
window.simonClick = simonClick;
window.startStroop = startStroop;
window.nextStroop = nextStroop;
window.strClick = strClick;
window.startNBack = startNBack;
window.clickNBack = clickNBack;
window.startSyllogism = startSyllogism;
window.submitSyllogism = submitSyllogism;
window.startSpatial = startSpatial;
window.submitSpatial = submitSpatial;
window.openRanking = openRanking;
window.loadRanking = loadRanking;
window.stopAllGameTimers = stopAllGameTimers;

// =========================================
// METAFISICA
// =========================================
window.initWizardPlaton = initWizardPlaton;

// =========================================
// ORGANIZADOR
// =========================================
window.switchOrgTab = switchOrgTab;
window.addIdea = addIdea;
window.sellarPlan = sellarPlan;
window.toggleDoneSnapshot = toggleDoneSnapshot;
window.evaluarConstancia = evaluarConstancia;
window.openIdeaSelector = openIdeaSelector;
window.closeIdeaSelector = closeIdeaSelector;
window.selectIdea = selectIdea;
window.loadSpecificDay = loadSpecificDay;
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
window.openHabitosModal = openHabitosModal;
window.closeHabitosModal = closeHabitosModal;
window.updateHabit = updateHabit;
window.incrementGamify = incrementGamify;

console.log("Mundo Pepelu: Módulos ES6 y Audios cargados y vinculados al objeto window.");
