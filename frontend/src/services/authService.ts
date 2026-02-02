import { auth } from './firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile 
} from "firebase/auth";
import { Platform } from 'react-native';

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // 1. Kayıt Olma: İsmi Firebase profiline ekler
  register: async ({ name, email, password }: any) => { 
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Kayıt anında ismi Firebase profiline yazıyoruz
      await updateProfile(userCredential.user, {
        displayName: name
      });

      await sendEmailVerification(userCredential.user);
      
      return { 
        status: "success", 
        message: "Kayıt başarılı! Lütfen e-postanı onaylamak için gelen linke tıkla." 
      };
    } catch (error: any) {
      let message = "Kayıt sırasında bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') message = "Bu e-posta zaten kullanımda!";
      if (error.code === 'auth/weak-password') message = "Şifre çok zayıf (en az 6 karakter)!";
      return { status: "error", message };
    }
  },

  // 2. Giriş Yapma: displayName bilgisini döndürür
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
          name: userCredential.user.displayName // İsim burada dönüyor
        } 
      };
    } catch (error: any) {
      return { status: "error", message: "E-posta veya şifre hatalı!" };
    }
  },

  loginWithGoogle: async () => {
    try {
      if (Platform.OS === 'web') {
        const result = await signInWithPopup(auth, googleProvider);
        return { 
          status: "success", 
          user: { id: result.user.uid, email: result.user.email, name: result.user.displayName } 
        };
      } else {
        await signInWithRedirect(auth, googleProvider);
        return { status: "success", message: "Yönlendiriliyor..." };
      }
    } catch (error: any) {
      return { status: "error", message: "Google girişi yapılamadı." };
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      return { status: "success" };
    } catch (e) {
      return { status: "error" };
    }
  }
};