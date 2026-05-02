export let bgMusicWorkout = null, isMusicWorkoutOn = false;
export let bgMusicZen = null, isMusicZenOn = false;
export let bgMusicGames = null, isMusicGamesOn = false;
export let bgMusicOrg = null, isMusicOrgOn = false;

export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function stopAllMusic() {
    if(isMusicWorkoutOn) { toggleMusic('workout'); if(bgMusicWorkout) bgMusicWorkout.currentTime = 0; }
    if(isMusicZenOn) { toggleMusic('zen'); if(bgMusicZen) bgMusicZen.currentTime = 0; }
    if(isMusicGamesOn) { toggleMusic('games'); if(bgMusicGames) bgMusicGames.currentTime = 0; }
    if(isMusicOrgOn) { toggleMusic('org'); if(bgMusicOrg) bgMusicOrg.currentTime = 0; }
}

export function toggleMusic(type) {
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    
    if(type === 'workout') {
        const btns = [document.getElementById('btnToggleMusicWorkoutGlobal'), document.getElementById('btnToggleMusicWorkoutEst'), document.getElementById('btnToggleMusicWorkoutIn')];
        if(isMusicWorkoutOn) { bgMusicWorkout.pause(); isMusicWorkoutOn=false; btns.forEach(b => b?.classList.add('toggle-off')); } 
        else { if(!bgMusicWorkout) { bgMusicWorkout = new Audio('./Online/voces/musica_fondo.mp3'); bgMusicWorkout.loop=true; bgMusicWorkout.volume=0.12; } bgMusicWorkout.play().catch(e=>{}); isMusicWorkoutOn=true; btns.forEach(b => b?.classList.remove('toggle-off')); }
    } 
    else if(type === 'zen') {
        const b1 = document.getElementById('btnToggleMusicZen'); const b2 = document.getElementById('btnToggleMusicZenGlobal');
        if(isMusicZenOn) { bgMusicZen.pause(); isMusicZenOn=false; b1?.classList.add('toggle-off'); b2?.classList.add('toggle-off'); } 
        else { if(!bgMusicZen) { bgMusicZen = new Audio('./Online/audios_zen/musica_zen.mp3'); bgMusicZen.loop=true; bgMusicZen.volume=0.15; } bgMusicZen.play().catch(e=>{}); isMusicZenOn=true; b1?.classList.remove('toggle-off'); b2?.classList.remove('toggle-off'); }
    }
    else if(type === 'games') {
        const bGlobal = document.getElementById('btnToggleMusicGamesGlobal');
        if(isMusicGamesOn) { bgMusicGames.pause(); isMusicGamesOn=false; bGlobal?.classList.add('toggle-off'); } 
        else { if(!bgMusicGames) { bgMusicGames = new Audio('./Online/audio_modulo_juegos/musica_fondo_juegos.mp3'); bgMusicGames.loop=true; bgMusicGames.volume=0.2; } bgMusicGames.play().catch(e=>{}); isMusicGamesOn=true; bGlobal?.classList.remove('toggle-off'); }
    }
    else if(type === 'org') {
        const b = document.getElementById('btnToggleMusicOrg');
        if(isMusicOrgOn) { 
            bgMusicOrg.pause(); 
            isMusicOrgOn=false; 
            b?.classList.add('toggle-off'); 
        } else { 
            if(!bgMusicOrg) { 
                console.log("Cargando audio desde: ./Online/audios_organizador/ondas_alfa.m4a");
                bgMusicOrg = new Audio('./Online/audios_organizador/ondas_alfa.m4a'); 
                bgMusicOrg.loop = true; 
                bgMusicOrg.volume = 0.30; 
                
                bgMusicOrg.onerror = () => {
                    console.error("Error al cargar el archivo de audio: ./Online/audios_organizador/ondas_alfa.m4a");
                };
            } 
            
            bgMusicOrg.play().then(() => {
                isMusicOrgOn = true; 
                b?.classList.remove('toggle-off'); 
            }).catch(e => {
                console.error("Error al reproducir el audio. (Puede requerir interacción del usuario o la ruta es incorrecta): ", e);
            });
        }
    }
}

export function startMusicModule(type) { 
    if (type !== 'workout' && isMusicWorkoutOn) toggleMusic('workout');
    if (type !== 'zen' && isMusicZenOn) toggleMusic('zen');
    if (type !== 'games' && isMusicGamesOn) toggleMusic('games');
    if (type !== 'org' && isMusicOrgOn) toggleMusic('org');

    if(type === 'workout' && !isMusicWorkoutOn) toggleMusic('workout'); 
    if(type === 'zen' && !isMusicZenOn) toggleMusic('zen'); 
    if(type === 'games' && !isMusicGamesOn) toggleMusic('games'); 
    if(type === 'org' && !isMusicOrgOn) toggleMusic('org'); 
}

export function playBeep(t) { 
    if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); 
    const osc = audioCtx.createOscillator(); const g = audioCtx.createGain(); 
    osc.connect(g); g.connect(audioCtx.destination); 
    if(t==='short'){
        osc.type='sine';osc.frequency.setValueAtTime(600,audioCtx.currentTime);g.gain.setValueAtTime(0.5,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.15);osc.start(audioCtx.currentTime);osc.stop(audioCtx.currentTime+0.15);
    }else{
        osc.type='square';osc.frequency.setValueAtTime(800,audioCtx.currentTime);g.gain.setValueAtTime(0.3,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.5);osc.start(audioCtx.currentTime);osc.stop(audioCtx.currentTime+0.5);
    } 
}

export let bestVoice = null; 
export const synth = window.speechSynthesis;
function loadVoices() {
    if(!synth) return;
    let voices = synth.getVoices();
    // Prioridad Premium: Voces Online, Naturales, Google o Helena (Microsoft) o Monica/Paulina (Apple)
    bestVoice = voices.find(v => (v.lang.includes('es') || v.lang.includes('MX')) && 
        (v.name.includes('Online') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Helena') || v.name.includes('Monica') || v.name.includes('Paulina'))) || 
        voices.find(v => v.lang.includes('es')) || 
        voices[0];
    if(bestVoice) console.log("TTS: Voz optimizada seleccionada ->", bestVoice.name);
}
if(synth) {
    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;
    loadVoices();
}

export let currentVoiceAudio = null; 
export function stopAllVoice() { if(currentVoiceAudio) { currentVoiceAudio.pause(); currentVoiceAudio.currentTime = 0; currentVoiceAudio = null; } if(synth) synth.cancel(); }

export const motivaciones = ["motiva_1", "motiva_2", "motiva_3", "motiva_4", "motiva_5"];
export function playWorkoutAudio(filename, fbTitle, fbInstr) { 
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    stopAllVoice(); 
    let a = new Audio('./Online/voces/' + filename + '.mp3'); currentVoiceAudio = a;
    a.play().catch(e => { 
        if(!filename.includes('motiva') && synth){ 
            console.log("Audio MP3 falló, usando TTS fallback para:", fbTitle);
            speakNative(fbInstr ? fbTitle + ". " + fbInstr : fbTitle);
        } 
    }); 
}

export let isVoiceZenOn = true; 
export function toggleZenVoice() { const b = document.getElementById('btnToggleVoiceZen'); if(isVoiceZenOn){isVoiceZenOn=false;b.classList.add('toggle-off');}else{isVoiceZenOn=true;b.classList.remove('toggle-off');} } 
export function playZenVoice(fn) { 
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if(!isVoiceZenOn)return; let a=new Audio('./Online/audios_zen/' + fn + '.mp3'); a.play().catch(e=>{}); 
}

export let isVoiceWorkoutOn = true;
export function toggleWorkoutVoice() {
    const b = document.getElementById('btnToggleVoiceWorkout');
    if(isVoiceWorkoutOn) {
        isVoiceWorkoutOn = false;
        b?.classList.add('toggle-off');
    } else {
        isVoiceWorkoutOn = true;
        b?.classList.remove('toggle-off');
        // Pequeño truco para "desbloquear" el synth en móviles
        if(synth) {
            let u = new SpeechSynthesisUtterance("");
            synth.speak(u);
        }
    }
}

export function initTTS() {
    if(!synth) return;
    console.log("TTS: Ejecutando desbloqueo (initTTS)...");
    synth.cancel();
    let u = new SpeechSynthesisUtterance("Voz activada");
    u.volume = 0; // Silencioso pero procesado
    u.lang = 'es-ES';
    if(bestVoice) u.voice = bestVoice;
    synth.speak(u);
}

// Función centralizada para hablar
function speakNative(text) {
    if(!synth) return;
    synth.cancel(); // Limpiar cola
    let u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    if(bestVoice) u.voice = bestVoice;
    u.rate = 0.9;   // Un poco más pausado para sonar menos "ametralladora"
    u.pitch = 1.0;  // Tono neutro para evitar distorsión metálica
    u.onerror = (e) => console.error("TTS Error:", e);
    console.log("TTS: Locutando ->", text, "| Rate: 0.9, Pitch: 1.0");
    synth.speak(u);
}

export function playWorkoutTTS(text) {
    if(!isVoiceWorkoutOn) {
        console.warn("TTS: Locución omitida (isVoiceWorkoutOn es false)");
        return;
    }
    speakNative(text);
}
