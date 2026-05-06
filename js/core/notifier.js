import { playXPLevelUp } from './audio-manager.js';

export function showXPNotification(amount, message = "¡Sigue así!") {
    const container = getOrCreateNotifyContainer();
    
    // Reproducir sonido de recompensa
    playXPLevelUp();
    
    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    
    // Icono y color según el mensaje o tipo (opcional, por ahora genérico brillante)
    toast.innerHTML = `
        <div class="xp-toast-icon">⚡</div>
        <div class="xp-toast-content">
            <span class="xp-toast-amount">+${amount} XP</span>
            <span class="xp-toast-msg">${message}</span>
        </div>
    `;

    container.appendChild(toast);

    // Animación y auto-destrucción
    setTimeout(() => {
        toast.classList.add('active');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function getOrCreateNotifyContainer() {
    let container = document.getElementById('hud-notify-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'hud-notify-container';
        document.body.appendChild(container);
    }
    return container;
}

// Estilos dinámicos para el notificador (se inyectan una vez)
const style = document.createElement('style');
style.textContent = `
    #hud-notify-container {
        position: fixed;
        top: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 10000;
        pointer-events: none;
    }

    .xp-toast {
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(0, 243, 255, 0.3);
        border-left: 4px solid var(--primary);
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 15px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 243, 255, 0.1);
        transform: translateX(120%);
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        min-width: 250px;
    }

    .xp-toast.active {
        transform: translateX(0);
    }

    .xp-toast-icon {
        font-size: 1.5rem;
        filter: drop-shadow(0 0 5px var(--primary));
    }

    .xp-toast-content {
        display: flex;
        flex-direction: column;
    }

    .xp-toast-amount {
        color: var(--primary);
        font-weight: 800;
        font-family: 'Outfit', sans-serif;
        font-size: 1.1rem;
        text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
    }

    .xp-toast-msg {
        color: #94a3b8;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
`;
document.head.appendChild(style);
