import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Keyboard, TouchableWithoutFeedback, 
  KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Veri kontrolü için eklendi
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

// onGoToRegister prop'u eklendi
export default function LoginScreen({ onLogin, onGoToRegister }: { onLogin: () => void, onGoToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      // Yerel hafızadaki kayıtlı kullanıcıyı çekiyoruz
      const savedUser = await AsyncStorage.getItem('@SınavımAI_UserData');
      const userData = savedUser ? JSON.parse(savedUser) : null;

      // Eğer kayıtlı kullanıcı varsa ve bilgiler eşleşiyorsa giriş yap
      if (userData && email === userData.email && password === userData.password) {
        onLogin();
      } 
      // Eğer henüz kayıt yoksa ama test aşamasındaysan geçici giriş izni (Opsiyonel)
      else if (email === "admin" && password === "1234") {
        onLogin();
      }
      else {
        Alert.alert("Hata", "Giriş bilgileri hatalı veya hesap bulunamadı!");
      }
    } catch (e) {
      Alert.alert("Hata", "Giriş işlemi sırasında bir sorun oluştu.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.logoText}>RC</Text>
              <Text style={styles.title}>Sınavım AI</Text>
              <Text style={styles.subtitle}>Başarıya giden yolda asistanın.</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="E-posta"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Şifre"
                placeholderTextColor={COLORS.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Giriş Yap</Text>
              </TouchableOpacity>

              {/* Kaydol butonu işlevsel hale getirildi */}
              <TouchableOpacity 
                style={styles.registerBtn} 
                onPress={onGoToRegister}
              >
                <Text style={styles.registerText}>
                  Hesabın yok mu? <Text style={{fontWeight: 'bold', color: COLORS.primary}}>Kaydol</Text>
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
  logoText: { fontSize: 60, fontWeight: 'bold', color: COLORS.primary },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginTop: 10 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 5 },
  form: { width: '100%' },
  input: { 
    backgroundColor: COLORS.surface, 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 15, 
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  loginBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 3
  },
  loginBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 18 },
  registerBtn: { marginTop: 25, alignItems: 'center' },
  registerText: { color: COLORS.textSecondary }
});