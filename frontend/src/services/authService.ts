import { auth } from './firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential, // Mobil giriş için eklendi
  updateProfile 
} from "firebase/auth";
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser'; // Eklenen paket

// Tarayıcı oturumlarını mobil cihazlarda yönetmek için gerekli
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

  // 3. Google ile Giriş (Web & Mobil Tam Uyumlu)
  loginWithGoogle: async (idToken?: string) => {
    try {
      if (Platform.OS === 'web') {
        const result = await signInWithPopup(auth, googleProvider);
        return { 
          status: "success", 
          user: { id: result.user.uid, email: result.user.email, name: result.user.displayName } 
        };
      } else {
        // MOBİL TARAFI:
        // Buraya login.tsx'ten gelen idToken ile giriş yapacağız.
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

  // 4. Çıkış Yapma
  logout: async () => {
    try {
      await signOut(auth);
      return { status: "success" };
    } catch (e) {
      return { status: "error", message: "Çıkış yapılırken bir hata oluştu." };
    }
  }
};