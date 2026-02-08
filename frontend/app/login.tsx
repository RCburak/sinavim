import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Keyboard, 
  TouchableWithoutFeedback, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ActivityIndicator,
  Modal, // Eklendi
  Pressable // Eklendi
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../src/services/authService';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons'; // İkonlar için eklendi

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onLogin, onGoToRegister, theme = COLORS.light }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Şifre Sıfırlama State'leri
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Google Giriş
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "292154739046-2ae45f3560de9e8b7860a7.apps.googleusercontent.com",
    iosClientId: "IOS_CLIENT_ID_BURAYA",
    androidClientId: "ANDROID_CLIENT_ID_BURAYA",
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params; 
      handleGoogleLoginSuccess(id_token);
    }
  }, [response]);

  const handleGoogleLoginSuccess = async (token: string) => {
    setLoading(true);
    try {
      const result = await authService.loginWithGoogle(token);
      if (result.status === "success") {
        await saveUserDataAndLogin(result.user);
      } else {
        Alert.alert("Hata", result.message);
      }
    } catch (e) {
      Alert.alert("Hata", "Google oturumu doğrulanırken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const saveUserDataAndLogin = async (user: any) => {
    try {
      const displayName = user.name || user.displayName || 'Öğrenci';
      await AsyncStorage.setItem('@SınavımAI_UserLoggedIn', 'true');
      await AsyncStorage.setItem('@SınavımAI_UserId', user.id || user.uid);
      await AsyncStorage.setItem('@SınavımAI_UserName', displayName);
      onLogin(); 
    } catch (e) {
      Alert.alert("Hata", "Giriş bilgileri kaydedilemedi.");
    }
  };

  const handleLogin = async () => {
    if (email.length < 3 || password.length < 3) {
      return Alert.alert("Hata", "Lütfen bilgileri eksiksiz girin.");
    }
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.status === "success") {
        await saveUserDataAndLogin(result.user);
      } else {
        Alert.alert("Giriş Başarısız", result.message);
      }
    } catch (e) {
      Alert.alert("Hata", "Giriş sırasında bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Şifre Sıfırlama Fonksiyonu
  const handlePasswordReset = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi girin.");
      return;
    }
    setResetLoading(true);
    try {
      const result = await authService.resetPassword(resetEmail);
      if (result.status === 'success') {
        Alert.alert("Başarılı", result.message);
        setResetModalVisible(false);
        setResetEmail('');
      } else {
        Alert.alert("Hata", result.message);
      }
    } catch (e) {
      Alert.alert("Hata", "İşlem sırasında bir sorun oluştu.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={[styles.logoText, { color: theme.primary }]}>RC</Text>
              <Text style={[styles.title, { color: theme.text }]}>Sınavım</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Başarıya giden yolda asistanın.</Text>
            </View>

            <View style={styles.form}>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                placeholder="E-posta" 
                placeholderTextColor={theme.textSecondary} 
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none" 
                keyboardType="email-address" 
              />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                placeholder="Şifre" 
                placeholderTextColor={theme.textSecondary} 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
                onSubmitEditing={handleLogin} 
              />
              
              {/* Şifremi Unuttum Linki */}
              <TouchableOpacity style={styles.forgotPassBtn} onPress={() => setResetModalVisible(true)}>
                <Text style={[styles.forgotPassText, { color: theme.primary }]}>Şifremi Unuttum?</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.loginBtn, { backgroundColor: theme.primary }, loading && { opacity: 0.7 }]} 
                onPress={handleLogin} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.loginBtnText, { color: '#fff' }]}>Giriş Yap</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.googleBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                onPress={() => promptAsync()} 
                disabled={!request || loading}
              >
                <Text style={[styles.googleBtnText, { color: theme.textSecondary }]}>Google ile Devam Et</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.registerBtn} onPress={onGoToRegister}>
                <Text style={[styles.registerText, { color: theme.textSecondary }]}>
                  Hesabın yok mu? <Text style={{fontWeight: 'bold', color: theme.primary}}>Kaydol</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* ŞİFRE SIFIRLAMA MODALI */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={resetModalVisible}
              onRequestClose={() => setResetModalVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setResetModalVisible(false)}>
                <TouchableWithoutFeedback>
                  <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                    <View style={styles.modalHeader}>
                      <Text style={[styles.modalTitle, { color: theme.text }]}>Şifre Sıfırlama</Text>
                      <TouchableOpacity onPress={() => setResetModalVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
                      Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                    </Text>

                    <TextInput 
                      style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                      placeholder="E-posta adresiniz" 
                      placeholderTextColor={theme.textSecondary} 
                      value={resetEmail} 
                      onChangeText={setResetEmail} 
                      autoCapitalize="none" 
                      keyboardType="email-address" 
                    />

                    <TouchableOpacity 
                      style={[styles.loginBtn, { backgroundColor: theme.primary, marginTop: 10 }]} 
                      onPress={handlePasswordReset}
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={[styles.loginBtnText, { color: '#fff' }]}>Bağlantı Gönder</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </Pressable>
            </Modal>

          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30 },
  header: { alignItems: 'center', marginBottom: 50 },
  logoText: { fontSize: 60, fontWeight: 'bold' },
  title: { fontSize: 32, fontWeight: 'bold', marginTop: 10 },
  subtitle: { fontSize: 16, marginTop: 5 },
  form: { width: '100%' },
  input: { padding: 18, borderRadius: 15, marginBottom: 15, borderWidth: 1 },
  loginBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 3 },
  loginBtnText: { fontWeight: 'bold', fontSize: 18 },
  googleBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 15, borderWidth: 1, flexDirection: 'row', justifyContent: 'center' },
  googleBtnText: { fontWeight: 'bold', fontSize: 16 },
  registerBtn: { marginTop: 25, alignItems: 'center' },
  registerText: {},
  
  // YENİ EKLENEN STİLLER
  forgotPassBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPassText: { fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 20, padding: 25, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalDesc: { fontSize: 14, marginBottom: 20, lineHeight: 20 }
});