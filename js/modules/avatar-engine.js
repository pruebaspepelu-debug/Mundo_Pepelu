import { calculateCurrentStreak, calculateLifetimeXP } from './habitos.js';
import { auth } from '../core/firebase-init.js';

export async function updateDragonEvolution(dailyXP) {
    const dragon = document.getElementById('dragonAvatar');
    const container = document.querySelector('.avatar-card-5d');
    if (!dragon || !container) return;

    // 1. Crecimiento Físico: Racha eclosiona huevo, Total XP evoluciona
    const totalXP = await calculateLifetimeXP();
    const streak = await calculateCurrentStreak();
    let newSrc = 'dragon_egg.glb'; // Fase 1 (Huevo por defecto)
    
    // Bypass Admin: Si el email contiene 'pep' o 'joseluisruedas', forzamos eclosión para pruebas
    const isDev = auth.currentUser && auth.currentUser.email && 
                 (auth.currentUser.email.toLowerCase().includes('pep') || 
                  auth.currentUser.email.toLowerCase().includes('joseluisruedas'));
    
    // Condición de Eclosión: 2 días seguidos con > 60 XP o usuario admin
    if (streak >= 2 || totalXP > 500 || isDev) { 
        if (totalXP >= 5000) {
            newSrc = 'dragon_blue_eyes.glb'; // Fase 4
        } else if (totalXP >= 2000) {
            newSrc = 'dragon_fase1.glb'; // Fase 3
        } else {
            newSrc = 'dragon_baby.glb'; // Fase 2 (Eclosionado)
        }
    }

    // Cambiar modelo si es diferente
    // Como aún no tenemos los otros .glb, para evitar un 404 que rompa la pantalla,
    // forzaremos dragon_fase1.glb siempre pero dejaremos la variable preparada.
    // DESCOMENTAR CUANDO ESTÉN LOS MODELOS:
    // if (dragon.getAttribute('src') !== newSrc) {
    //     dragon.setAttribute('src', newSrc);
    // }

    // 2. Aura (CSS Classes): Racha -> Aura Level
    container.classList.remove('aura-phase-1', 'aura-phase-2', 'aura-phase-3', 'aura-phase-4');
    
    if (streak >= 10) {
        container.classList.add('aura-phase-4');
    } else if (streak >= 7) {
        container.classList.add('aura-phase-3');
    } else if (streak >= 4) {
        container.classList.add('aura-phase-2');
    } else if (streak >= 2) {
        container.classList.add('aura-phase-1');
    }
}

// Inicializar y exponer al window para que habitos.js pueda llamarlo fácilmente
window.updateDragonEvolution = updateDragonEvolution;

// =========================================
// EFECTO PARALLAX 3D (HIPERREALISMO)
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.avatar-card-5d');
    const dragon = document.getElementById('dragonAvatar');
    
    if (!container || !dragon) return;
    
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Rotación máxima de 15 grados
        const rotateX = ((y - centerY) / centerY) * -15; 
        const rotateY = ((x - centerX) / centerX) * 15;
        
        container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        container.style.transition = 'transform 0.1s ease-out';
    });
    
    container.addEventListener('mouseleave', () => {
        container.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
        container.style.transition = 'transform 0.5s ease-out';
    });
});

/**
 * MODO TEST: Fuerza el estado de Oro y máximo brillo para previsualizar.
 */
window.previewGoldDragon = function() {
    const dragon = document.getElementById('dragonAvatar');
    if (!dragon) return;
    dragon.setAttribute('exposure', '2.5');
    
    if (dragon.model) {
        const materials = dragon.model.materials;
        materials.forEach(mat => {
            const pbr = mat.pbrMetallicRoughness;
            if (pbr) {
                pbr.setBaseColorFactor([1.0, 0.84, 0.0, 1.0]);
                pbr.setMetallicFactor(1.0);
                pbr.setRoughnessFactor(0.1);
            }
        });
        console.log("¡MODO ORO ACTIVADO! Esto es lo que te espera si mantienes la racha.");
    }
};

// Llamada temporal para el usuario
setTimeout(() => {
    window.previewGoldDragon();
}, 4000);
