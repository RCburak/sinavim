import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../src/services/authService';

export default function LoginScreen({ onLogin, onGoToRegister }: { onLogin: () => void, onGoToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (email.length < 3 || password.length < 3) {
      return Alert.alert("Hata", "Lütfen bilgileri eksiksiz girin.");
    }

    setLoading(true);
    try {
      const result = await authService.login(email, password);
      
      if (result.status === "success") {
        // Backend'den gelen tüm kritik verileri kaydediyoruz
        await AsyncStorage.setItem('@SınavımAI_UserLoggedIn', 'true');
        await AsyncStorage.setItem('@SınavımAI_UserId', result.user.id.toString());
        await AsyncStorage.setItem('@SınavımAI_UserName', result.user.name);
        onLogin();
      } else {
        Alert.alert("Giriş Başarısız", result.message);
      }
    } catch (e) {
      Alert.alert("Hata", "Sunucuya ulaşılamıyor. Ngrok açık mı?");
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
              <Text style={styles.title}>Sınavım AI</Text>
              <Text style={styles.subtitle}>Başarıya giden yolda asistanın.</Text>
            </View>
            <View style={styles.form}>
              <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={handleLogin} />
              
              <TouchableOpacity 
                style={[styles.loginBtn, loading && { opacity: 0.7 }]} 
                onPress={handleLogin} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Giriş Yap</Text>}
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
  registerBtn: { marginTop: 25, alignItems: 'center' },
  registerText: { color: COLORS.textSecondary }
});