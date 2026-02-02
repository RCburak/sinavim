import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
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

const app = initializeApp(firebaseConfig);

let authInstance: any;

try {
  // TypeScript hatasını (2305) aşmak için fonksiyonu dinamik olarak çağırıyoruz
  const { getReactNativePersistence } = require("firebase/auth"); 
  
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  // Eğer zaten başlatılmışsa veya hata verirse mevcut auth'u al
  authInstance = getAuth(app);
}

export const auth = authInstance;