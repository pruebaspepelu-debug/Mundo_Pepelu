import { showScreen } from './navigation.js';
import { stopAllMusic, stopAllVoice } from './audio-manager.js';

export const firebaseConfig = { apiKey: "AIzaSyD0cYKJL5k_rZgwSQkGJWxtv96yDQsH5aQ", authDomain: "mundo-pepelu.firebaseapp.com", projectId: "mundo-pepelu", storageBucket: "mundo-pepelu.firebasestorage.app", messagingSenderId: "628431126447", appId: "1:628431126447:web:c8eb9cdeb6f23ea480795a" };
firebase.initializeApp(firebaseConfig); 
export const db = firebase.firestore();
export const auth = firebase.auth();

export let currentUser = "Invitado";

auth.onAuthStateChanged((user) => {
    if (user) {
        // Lógica de Skins Gamer Pro
        const isPepelu = user.email === 'joseluisruedas.jlr@gmail.com';
        currentUser = user.displayName || (isPepelu ? "Pepelu" : user.email.split('@')[0]);
        
        document.getElementById('displayUser').innerText = currentUser;
        
        // Asignación de Skin
        const avatarImg = document.getElementById('userAvatar');
        if (avatarImg) {
            avatarImg.src = isPepelu ? "avatar_goku_nivelSuperInstinto.png" : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.uid;
        }
        
        // Carga de HUD
        import('../modules/habitos.js').then(m => m.loadTodayStats());
        
        showScreen('screenMain');
    } else {
        currentUser = "Invitado";
        showScreen('screenLogin');
    }
});

export async function authLogin(email, pass) { 
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const userCredential = await auth.signInWithEmailAndPassword(email, pass);
        console.log("ID de usuario Firebase:", userCredential.user.uid);
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("Credenciales incorrectas o error en el servidor.");
    }
}

export async function authRegister(email, pass) {
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        console.log("Nueva cuenta creada. ID:", userCredential.user.uid);
    } catch (error) {
        console.error("Error al registrar cuenta:", error);
        alert("Error al registrar la cuenta. Puede que el email ya esté en uso o la contraseña sea muy débil.");
    }
}

export async function authResetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        alert("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
    } catch (error) {
        console.error("Error al enviar recuperación:", error);
        alert("Error al enviar el correo. Revisa que esté bien escrito.");
    }
}

export async function logOut() { 
    stopAllMusic(); 
    stopAllVoice(); 
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
    document.getElementById('loginEmail').value = ""; 
    document.getElementById('loginPass').value = ""; 
    // onAuthStateChanged se encargará de redirigir
}
