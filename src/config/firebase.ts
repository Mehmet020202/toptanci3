import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAhSPWqqvtjNwvOkdhs1okqi4TDwCZBbmU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "toptanci2-6591e.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://toptanci2-6591e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "toptanci2-6591e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "toptanci2-6591e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "840331445115",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:840331445115:web:ce496091d8152be01bb3de",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-2NX49L55TQ"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Servisleri dışa aktar
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
// Mobil cihazlar için ek ayarlar
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export const analytics = getAnalytics(app);

export default app;