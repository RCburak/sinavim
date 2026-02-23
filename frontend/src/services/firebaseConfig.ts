import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; // Firestore eklendi
// Persistence modülünü doğrudan alt dizinden çağırıyoruz
// @ts-ignore: TS bazen bu alt modül deklarasyonunu göremeyebilir
import { getReactNativePersistence } from "@firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBePH21Qu6U6EJF3IrFbPukMT_xW-LXZ7I",
  authDomain: "rcsinavim.firebaseapp.com",
  projectId: "rcsinavim",
  storageBucket: "rcsinavim.firebasestorage.app",
  messagingSenderId: "292154739046",
  appId: "1:292154739046:web:2ae45f3560de9e8b7860a7",
  measurementId: "G-8ZHYW33XXY"
};

// Uygulamanın zaten başlatılıp başlatılmadığını kontrol ediyoruz
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Auth nesnesini güvenli bir şekilde başlatalım. 
 */
let firebaseAuth;
try {
  firebaseAuth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  firebaseAuth = getAuth(app);
}

const auth = firebaseAuth;
const storage = getStorage(app);
const db = getFirestore(app); // Firestore instance

export { auth, storage, db };