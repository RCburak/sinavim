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
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../src/services/authService';

// Mobil Google girişi için gerekli Expo kütüphaneleri
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Tarayıcı oturumunu tamamlamak için gerekli
WebBrowser.maybeCompleteAuthSession();

// Parametrelere 'theme' eklendi. Eğer dışarıdan gelmezse varsayılan olarak light kullanır.
export default function LoginScreen({ onLogin, onGoToRegister, theme = COLORS.light }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Giriş Yapılandırması
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "292154739046-2ae45f3560de9e8b7860a7.apps.googleusercontent.com",
    iosClientId: "IOS_CLIENT_ID_BURAYA",
    androidClientId: "ANDROID_CLIENT_ID_BURAYA",
  });

  // Google'dan yanıt geldiğinde tetiklenir
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* Arka plan rengi temaya göre değişir */}
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
                <Text style={[styles.googleBtnText, { color: theme.textSecondary }]}>G   Google ile Devam Et</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.registerBtn} onPress={onGoToRegister}>
                <Text style={[styles.registerText, { color: theme.textSecondary }]}>
                  Hesabın yok mu? <Text style={{fontWeight: 'bold', color: theme.primary}}>Kaydol</Text>
                </Text>
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
  registerText: { }
});