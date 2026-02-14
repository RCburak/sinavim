import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { API_URL, API_HEADERS } from "../config/api";

interface AuthContextType {
  user: User | null;
  userName: string;
  setUserName: (name: string) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("Öğrenci");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        // "Oturum açık tut" seçilmiş mi kontrol et
        const rememberMe = await AsyncStorage.getItem("@SınavımAI_RememberMe");
        if (rememberMe === "false") {
          // Oturum açık tutma seçilmemiş, çıkış yap
          await auth.signOut();
          await AsyncStorage.removeItem("@SınavımAI_RememberMe");
          setUser(null);
          // Minimum splash süresi
          setTimeout(() => setLoading(false), 2600);
          return;
        }
        const savedName = await AsyncStorage.getItem("@SınavımAI_UserName");
        const finalName =
          firebaseUser.displayName ||
          savedName ||
          firebaseUser.email?.split("@")[0] ||
          "Öğrenci";
        setUserName(finalName);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      // Minimum 2 saniye splash göster
      setTimeout(() => setLoading(false), 3400);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setUserName("Öğrenci");
  };

  return (
    <AuthContext.Provider
      value={{ user, userName, setUserName, loading, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
