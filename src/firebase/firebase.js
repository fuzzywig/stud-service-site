import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyA6C7sHBGwWc538wAKgARcAHROpGhgIXd0",
    authDomain: "studservice-app.firebaseapp.com",
    projectId: "studservice-app",
    storageBucket: "studservice-app.firebasestorage.app",
    messagingSenderId: "260297704377",
    appId: "1:260297704377:web:c1d99be89240c43a02ac68"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Setup RecaptchaVerifier for phone auth
export const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            'size': 'invisible',
            'callback': (response) => {
                console.log('Recaptcha verified');
            },
            'expired-callback': () => {
                console.log('Recaptcha expired');
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        });
    }
    return window.recaptchaVerifier;
};

// Clean up recaptcha
export const clearRecaptcha = () => {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }
};