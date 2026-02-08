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
  sendPasswordResetEmail // EKLENDİ
} from "firebase/auth";
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // 1. Kayıt Olma
  register: async ({ name, email, password }: any) => { 
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
      return { status: "success", message: "Kayıt başarılı! Mail onay linkini kontrol et." };
    } catch (error: any) {
      let message = "Kayıt sırasında bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') message = "Bu e-posta zaten kullanımda!";
      return { status: "error", message };
    }
  },

  // 2. Giriş Yapma
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        return { status: "error", message: "Lütfen önce e-postanı doğrula!" };
      }
      return { 
        status: "success", 
        user: { 
          id: userCredential.user.uid, 
          email: userCredential.user.email,
          name: userCredential.user.displayName || userCredential.user.email?.split('@')[0]
        } 
      };
    } catch (error: any) {
      return { status: "error", message: "E-posta veya şifre hatalı!" };
    }
  },

  // 3. ŞİFRE SIFIRLAMA (YENİ EKLENDİ)
  resetPassword: async (email: string) => {
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
  loginWithGoogle: async (idToken?: string) => {
    try {
      if (Platform.OS === 'web') {
        const result = await signInWithPopup(auth, googleProvider);
        return { 
          status: "success", 
          user: { id: result.user.uid, email: result.user.email, name: result.user.displayName } 
        };
      } else {
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          const result = await signInWithCredential(auth, credential);
          return { status: "success", user: result.user };
        }
        return { status: "error", message: "Token alınamadı." };
      }
    } catch (error: any) {
      console.error("Google Login Hatası:", error);
      return { status: "error", message: "Google girişi başarısız oldu." };
    }
  },

  // 5. Çıkış Yapma
  logout: async () => {
    try {
      await signOut(auth);
      return { status: "success" };
    } catch (e) {
      return { status: "error", message: "Çıkış yapılırken bir hata oluştu." };
    }
  }
};