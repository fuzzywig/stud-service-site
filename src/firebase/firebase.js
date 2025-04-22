import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
export const storage = getStorage(app); // ✅ added
