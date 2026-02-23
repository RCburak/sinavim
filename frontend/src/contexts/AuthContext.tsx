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
      try {
        if (firebaseUser) {
          // En son e-posta doğrulama durumunu al
          try {
            await firebaseUser.reload();
          } catch (reloadErr) {
            console.error("User reload error:", reloadErr);
          }

          const freshUser = auth.currentUser;

          if (freshUser && freshUser.emailVerified) {
            // "Oturum açık tut" seçilmiş mi kontrol et
            const rememberMe = await AsyncStorage.getItem("@SınavımAI_RememberMe");
            if (rememberMe === "false") {
              await auth.signOut();
              await AsyncStorage.removeItem("@SınavımAI_RememberMe");
              setUser(null);
            } else {
              const savedName = await AsyncStorage.getItem("@SınavımAI_UserName");
              const finalName =
                freshUser.displayName ||
                savedName ||
                freshUser.email?.split("@")[0] ||
                "Öğrenci";

              setUserName(finalName);
              setUser(freshUser);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        // Daha hızlı açılış için süreyi kısalttım (800ms)
        setTimeout(() => setLoading(false), 800);
      }
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
