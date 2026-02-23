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
  Modal,
  Pressable,
  Dimensions,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../src/services/authService';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onLogin, onGoToRegister, theme = COLORS.light }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "624675277189-liukvj1lrr8icrj0ko8h0s3dqug1klqt.apps.googleusercontent.com",
    androidClientId: "624675277189-liukvj1lrr8icrj0ko8h0s3dqug1klqt.apps.googleusercontent.com",
    iosClientId: "624675277189-liukvj1lrr8icrj0ko8h0s3dqug1klqt.apps.googleusercontent.com",
    redirectUri: "https://auth.expo.io/@rcburak/rc-sinavim",
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLoginSuccess(id_token);
    } else if (response?.type === 'error') {
      Alert.alert("Google Giriş Hatası", "Giriş işlemi sırasında bir hata oluştu.");
      console.error("Google Auth Error:", response.error);
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
      console.log(e);
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
      await AsyncStorage.setItem('@SınavımAI_RememberMe', rememberMe ? 'true' : 'false');
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
      const result = await authService.login(email.trim(), password);
      if (result.status === "success") {
        await saveUserDataAndLogin(result.user);
      } else {
        if (result.message.includes("e-postanı doğrula")) {
          Alert.alert(
            "E-posta Doğrulanmamış 📧",
            result.message,
            [
              { text: "Tamam", style: "cancel" },
              { text: "Tekrar Gönder", onPress: handleResendVerification }
            ]
          );
        } else {
          Alert.alert("Giriş Başarısız", result.message);
        }
      }
    } catch (e) {
      Alert.alert("Hata", "Giriş sırasında bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const result = await authService.resendVerification();
      if (result.status === 'success') {
        Alert.alert("Başarılı", result.message);
      } else {
        Alert.alert("Hata", result.message);
      }
    } catch (e) {
      Alert.alert("Hata", "E-posta gönderilemedi.");
    }
  };

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

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={isDark ? ['#0F0F1A', '#1A1A2E', '#16213E'] : ['#6C3CE1', '#4A1DB5', '#3B0F99']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>
            {/* Logo & Branding */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>RC Sınavım</Text>
              <Text style={styles.subtitle}>Başarıya giden yolda asistanın.</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>

              {/* Oturum Açık Tut + Şifremi Unuttum */}
              <View style={styles.rememberRow}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.rememberText}>Oturum açık tut</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setResetModalVisible(true)}>
                  <Text style={styles.forgotPassText}>Şifremi Unuttum?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color="#6C3CE1" /> : <Text style={styles.loginBtnText}>Giriş Yap</Text>}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleBtn}
                onPress={() => promptAsync()}
                disabled={!request || loading}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.googleBtnText}>Google ile Devam Et</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.registerBtn} onPress={onGoToRegister}>
                <Text style={styles.registerText}>
                  Hesabın yok mu? <Text style={styles.registerBold}>Kaydol</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Şifre Sıfırlama Modalı */}
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
                        <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
                      Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                    </Text>

                    <TextInput
                      style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                      placeholder="E-posta adresiniz"
                      placeholderTextColor={theme.textSecondary}
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />

                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                      onPress={handlePasswordReset}
                      disabled={resetLoading}
                    >
                      {resetLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.modalBtnText}>Bağlantı Gönder</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </Pressable>
            </Modal>

          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 30 },

  header: { alignItems: 'center', marginBottom: 45 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  logoImage: { width: '100%', height: '100%', borderRadius: 24 },
  title: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 6, fontWeight: '500' },

  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    height: 56,
  },
  inputIcon: { marginLeft: 18 },
  input: { flex: 1, color: '#fff', fontSize: 16, paddingHorizontal: 14, height: '100%' },
  eyeBtn: { padding: 15 },

  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    marginTop: 4,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6C3CE1',
    borderColor: '#6C3CE1',
  },
  rememberText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 13 },
  forgotPassText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 13 },

  loginBtn: {
    backgroundColor: '#fff', height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  loginBtnText: { color: '#6C3CE1', fontWeight: '800', fontSize: 17 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  dividerText: { color: 'rgba(255,255,255,0.4)', marginHorizontal: 15, fontSize: 13, fontWeight: '500' },

  googleBtn: {
    flexDirection: 'row', height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  googleBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  registerBtn: { marginTop: 25, alignItems: 'center' },
  registerText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  registerBold: { fontWeight: '800', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 24, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalDesc: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  modalInput: { height: 56, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, fontSize: 16, marginBottom: 15 },
  modalBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});