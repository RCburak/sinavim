import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase Console > Project Settings > General kısmından bu bilgileri kopyala
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
export const auth = getAuth(app);