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
                bgMusicOrg = new Audio('./Online/audios_organizador/ondas_alfa.m4a'); 
                bgMusicOrg.loop = true; 
                bgMusicOrg.volume = 0.30; 
            } 
            bgMusicOrg.play().then(() => {
                isMusicOrgOn = true; 
                b?.classList.remove('toggle-off'); 
            }).catch(e => {
                console.error("Error al reproducir el audio: ", e);
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
    bestVoice = voices.find(v => (v.lang.includes('es') || v.lang.includes('MX')) && 
        (v.name.includes('Online') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Helena') || v.name.includes('Monica') || v.name.includes('Paulina'))) || 
        voices.find(v => v.lang.includes('es')) || 
        voices[0];
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
        if(synth) {
            let u = new SpeechSynthesisUtterance("");
            synth.speak(u);
        }
    }
}

export function initTTS() {
    if(!synth) return;
    synth.cancel();
    let u = new SpeechSynthesisUtterance("Voz activada");
    u.volume = 0;
    u.lang = 'es-ES';
    if(bestVoice) u.voice = bestVoice;
    synth.speak(u);
}

function speakNative(text) {
    if(!synth) return;
    synth.cancel();
    let u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    if(bestVoice) u.voice = bestVoice;
    u.rate = 0.9;
    u.pitch = 1.0;
    synth.speak(u);
}

export function playWorkoutTTS(text) {
    if(!isVoiceWorkoutOn) return;
    speakNative(text);
}

/* =========================================
   VOZ DEL DRAGÓN
   ========================================= */
export function speakDragon(text) {
    if(!synth) return;
    synth.cancel();
    let u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    if(bestVoice) u.voice = bestVoice;
    u.rate = 0.8;
    u.pitch = 0.6; // Voz grave
    u.volume = 1.0;
    synth.speak(u);
}

let auraOsc = null;
let auraGain = null;

export function toggleDragonAura(on) {
    if(!audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume();

    if(on) {
        if(!auraOsc) {
            auraOsc = audioCtx.createOscillator();
            auraGain = audioCtx.createGain();
            auraOsc.type = 'sine';
            auraOsc.frequency.setValueAtTime(40, audioCtx.currentTime);
            auraGain.gain.setValueAtTime(0, audioCtx.currentTime);
            auraGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 1);
            auraOsc.connect(auraGain);
            auraGain.connect(audioCtx.destination);
            auraOsc.start();
        }
    } else {
        if(auraGain) {
            auraGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
            setTimeout(() => {
                if(auraOsc) { auraOsc.stop(); auraOsc = null; auraGain = null; }
            }, 1100);
        }
    }
}

/* =========================================
   ELEVENLABS BRIDGE
   ========================================= */
const ELEVEN_LABS_API_KEY = "sk_7d99645c13f373bae0fdc19a1ebe8c1595fb91cc528e1fb9";
const VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Voz de Adam

export async function speakElevenLabs(text) {
    if(!ELEVEN_LABS_API_KEY) {
        speakDragon(text);
        return;
    }

    try {
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_ID, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVEN_LABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (!response.ok) throw new Error("ElevenLabs API error");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
    } catch (e) {
        console.error("ElevenLabs Error:", e);
        speakDragon(text);
    }
}

// Desbloqueo Global de Audio (Interacción de Usuario)
document.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => console.log("AudioContext DESBLOQUEADO"));
    }
}, { once: true });

export function playXPLevelUp() {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    
    // Crear un sonido tipo "Sparkle/Magic"
    const now = audioCtx.currentTime;
    
    // Oscilador 1: Tono base suave
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // Nota A5
    osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.2); // Sube a E6
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    // Oscilador 2: Armónico alto para el brillo
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1760, now); // Nota A6
    
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.05, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.3);
    osc2.start(now);
    osc2.stop(now + 0.15);
}
