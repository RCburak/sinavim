import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../src/services/authService';

// Mobil Google girişi için gerekli Expo kütüphaneleri
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Tarayıcı oturumunu tamamlamak için gerekli
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ onLogin, onGoToRegister }: { onLogin: () => void, onGoToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Giriş Yapılandırması
  const [request, response, promptAsync] = Google.useAuthRequest({
    // NOT: Buradaki ID'leri Google Cloud Console'dan alman gerekir. 
    // WebClientId genelde Firebase config'deki ile aynıdır.
    webClientId: "292154739046-2ae45f3560de9e8b7860a7.apps.googleusercontent.com",
    iosClientId: "IOS_CLIENT_ID_BURAYA",
    androidClientId: "ANDROID_CLIENT_ID_BURAYA",
  });

  // Google'dan yanıt geldiğinde tetiklenir
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params; // Google'dan gelen kimlik token'ı
      handleGoogleLoginSuccess(id_token);
    }
  }, [response]);

  const handleGoogleLoginSuccess = async (token: string) => {
    setLoading(true);
    try {
      // Servisimize token'ı gönderiyoruz
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.logoText}>RC</Text>
              <Text style={styles.title}>Sınavım</Text>
              <Text style={styles.subtitle}>Başarıya giden yolda asistanın.</Text>
            </View>

            <View style={styles.form}>
              <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={handleLogin} />
              
              <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Giriş Yap</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.googleBtn} 
                onPress={() => promptAsync()} // Google penceresini açar
                disabled={!request || loading}
              >
                <Text style={styles.googleBtnText}>G   Google ile Devam Et</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.registerBtn} onPress={onGoToRegister}>
                <Text style={styles.registerText}>Hesabın yok mu? <Text style={{fontWeight: 'bold', color: COLORS.primary}}>Kaydol</Text></Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30 },
  header: { alignItems: 'center', marginBottom: 50 },
  logoText: { fontSize: 60, fontWeight: 'bold', color: COLORS.primary },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginTop: 10 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 5 },
  form: { width: '100%' },
  input: { backgroundColor: COLORS.surface, padding: 18, borderRadius: 15, marginBottom: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  loginBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 3 },
  loginBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 18 },
  googleBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 15, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', justifyContent: 'center' },
  googleBtnText: { color: '#757575', fontWeight: 'bold', fontSize: 16 },
  registerBtn: { marginTop: 25, alignItems: 'center' },
  registerText: { color: COLORS.textSecondary }
});