import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const hasValidConfig = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

const activeConfig = hasValidConfig ? firebaseConfig : {
    apiKey: "AIzaSyDummyApiKeyForDevMode1234567890",
    authDomain: "demo-app.firebaseapp.com",
    projectId: "demo-app",
    storageBucket: "demo-app.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:1234567890"
};

if (!hasValidConfig && typeof window !== "undefined") {
    console.warn("⚠️ Firebase configuration missing! Please set NEXT_PUBLIC_FIREBASE_* environment variables in .env.local");
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(activeConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Firestore with persistence and cache settings
let db;
try {
    db = initializeFirestore(app, {
        localCache: typeof window !== "undefined" ? persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
            cacheSizeBytes: 100 * 1024 * 1024 // 100MB cache
        }) : undefined
    });
} catch (error) {
    console.warn("Firestore initialization fallback:", error);
}

// Enable Auth persistence
if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence)
        .catch((error) => {
            console.error("Auth persistence error:", error);
        });
}

export { app, auth, db, storage };
