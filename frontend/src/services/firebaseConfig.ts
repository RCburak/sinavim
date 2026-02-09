import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // Storage eklendi
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

// DÜZELTME BURADA:
const auth = firebaseAuth;      // firebaseAuth değişkenini 'auth' ismine atadık
const storage = getStorage(app); // Storage servisini başlattık

// Artık her ikisi de tanımlı olduğu için hatasız dışarı aktarabiliriz
export { auth, storage };