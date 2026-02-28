import { auth } from './firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { API_URL, API_HEADERS } from '../config/api';
import { AuthResponse, RegisterData, User } from '../types';

WebBrowser.maybeCompleteAuthSession();

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // 1. Kayıt Olma
  register: async ({ name, email, password }: RegisterData): Promise<AuthResponse> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
      return { status: "success", message: "Kayıt başarılı! Mail onay linkini kontrol et." };
    } catch (error: any) {
      console.error("Kayıt Hatası Detay:", error);
      let message = "Kayıt sırasında bir hata oluştu.";

      switch (error.code) {
        case 'auth/email-already-in-use':
          message = "Bu e-posta zaten kullanımda!";
          break;
        case 'auth/invalid-email':
          message = "Geçersiz bir e-posta adresi girdiniz.";
          break;
        case 'auth/weak-password':
          message = "Şifreniz çok zayıf. Lütfen daha güçlü bir şifre seçin.";
          break;
        case 'auth/operation-not-allowed':
          message = "E-posta/şifre girişi şu an devre dışı. Lütfen yöneticiyle iletişime geçin.";
          break;
        default:
          message = `Hata: ${error.message}`;
      }

      return { status: "error", message };
    }
  },

  // 2. Giriş Yapma (GÜNCELLENDİ: SYNC EKLENDİ)
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        return { status: "error", message: "Lütfen önce e-postanı doğrula!" };
      }

      // --- BACKEND İLE EŞİTLEME (SYNC) ---
      if (API_URL) {
        try {
          await fetch(`${API_URL}/sync-user`, {
            method: 'POST',
            headers: API_HEADERS as HeadersInit,
            body: JSON.stringify({
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email?.split('@')[0]
            })
          });
        } catch (e) {
          console.log("Backend eşitleme hatası (Önemsiz):", e);
        }
      }
      // -----------------------------------

      return {
        status: "success",
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0]
        }
      };
    } catch (error: any) {
      return { status: "error", message: "E-posta veya şifre hatalı!" };
    }
  },

  // 3. Şifre Sıfırlama
  resetPassword: async (email: string): Promise<AuthResponse> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { status: "success", message: "Şifre sıfırlama bağlantısı e-postana gönderildi." };
    } catch (error: any) {
      let msg = "E-posta gönderilemedi.";
      if (error.code === 'auth/user-not-found') msg = "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.";
      if (error.code === 'auth/invalid-email') msg = "Geçersiz e-posta adresi.";
      return { status: "error", message: msg };
    }
  },

  // 4. Google ile Giriş
  loginWithGoogle: async (idToken?: string): Promise<AuthResponse> => {
    try {
      if (Platform.OS === 'web') {
        const result = await signInWithPopup(auth, googleProvider);
        return {
          status: "success",
          user: {
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName
          }
        };
      } else {
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          const result = await signInWithCredential(auth, credential);
          const user = result.user;
          return {
            status: "success",
            user: {
              id: user.uid,
              email: user.email,
              name: user.displayName || user.email?.split('@')[0]
            }
          };
        }
        return { status: "error", message: "Token alınamadı." };
      }
    } catch (error: any) {
      console.error("Google Login Hatası:", error);
      return { status: "error", message: "Google girişi başarısız oldu." };
    }
  },

  // 5. Çıkış Yapma
  logout: async (): Promise<AuthResponse> => {
    try {
      await signOut(auth);
      return { status: "success" };
    } catch (e) {
      return { status: "error", message: "Çıkış yapılırken bir hata oluştu." };
    }
  },

  // 6. Doğrulama Mailini Tekrar Gönder
  resendVerification: async (): Promise<AuthResponse> => {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        return { status: "success", message: "Doğrulama e-postası tekrar gönderildi." };
      }
      return { status: "error", message: "Oturum bulunamadı. Lütfen tekrar giriş yapmayı deneyin." };
    } catch (e: any) {
      return { status: "error", message: "E-posta gönderilirken bir hata oluştu." };
    }
  },

  // 7. Kuruma Katıl (Backend Bağlantısı)
  joinClassroom: async (uid: string, email: string, code: string): Promise<any> => {
    try {
      if (!API_URL) {
        console.error("API URL eksik! .env dosyasını kontrol et.");
        return { status: "error", message: "Sistem hatası: API URL bulunamadı." };
      }

      const response = await fetch(`${API_URL}/join-institution`, {
        method: 'POST',
        headers: API_HEADERS as HeadersInit,
        body: JSON.stringify({ user_id: uid, email, code })
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error("Kuruma katılma hatası:", error);
      return { status: "error", message: "Sunucuya bağlanılamadı." };
    }
  },

  // 7. Öğretmen Girişi (Web Panel İçin)
  loginTeacher: async (email: string, password: string): Promise<any> => {
    try {
      if (!API_URL) return { status: "error", message: "API URL eksik" };

      const response = await fetch(`${API_URL}/teacher/login`, {
        method: 'POST',
        headers: API_HEADERS as HeadersInit,
        body: JSON.stringify({ email, password })
      });

      return await response.json();
    } catch (e) {
      console.error(e);
      return { status: "error", message: "Sunucuya bağlanılamadı." };
    }
  },

  // 8. Kurumdan Ayrıl
  leaveClassroom: async (uid: string): Promise<any> => {
    try {
      if (!API_URL) return { status: "error", message: "API URL eksik" };

      const response = await fetch(`${API_URL}/leave-institution`, {
        method: 'POST',
        headers: API_HEADERS as HeadersInit,
        body: JSON.stringify({ user_id: uid })
      });

      return await response.json();
    } catch (e) {
      console.error("Kurumdan ayrılma hatası:", e);
      return { status: "error", message: "Sunucuya bağlanılamadı." };
    }
  }
};