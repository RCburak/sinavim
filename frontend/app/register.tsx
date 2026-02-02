import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, 
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../src/services/authService';

// theme prop'u eklendi
export default function RegisterScreen({ onBack, onRegisterSuccess, theme = COLORS.light }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    }
    
    if (password !== confirmPassword) {
      return Alert.alert("Hata", "Şifreler birbiriyle uyuşmuyor!");
    }

    if (password.length < 6) {
      return Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır!");
    }

    setLoading(true);
    try {
      const result = await authService.register({ name, email, password });
      
      if (result.status === "success") {
        Alert.alert(
          "Doğrulama Linki Gönderildi 📧", 
          `${email} adresine bir onay linki gönderdik. Lütfen linke tıkladıktan sonra giriş yap.`, 
          [{ text: "Giriş Ekranına Git", onPress: onRegisterSuccess }]
        );
      } else {
        Alert.alert("Hata", result.message);
      }
    } catch (e) {
      Alert.alert("Hata", "Kayıt işlemi sırasında bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* Arka plan temadan geliyor */}
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>
            
            <View style={styles.form}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Yeni Hesap 📝</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>RC Sınavım AI ailesine katıl.</Text>
              </View>

              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                placeholder="Ad Soyad" 
                placeholderTextColor={theme.textSecondary} 
                value={name} 
                onChangeText={setName} 
              />
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
              />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                placeholder="Şifre Tekrar" 
                placeholderTextColor={theme.textSecondary} 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry 
              />

              <TouchableOpacity 
                style={[styles.regBtn, { backgroundColor: theme.primary }, loading && { opacity: 0.7 }]} 
                onPress={handleRegister} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.regBtnText, { color: '#fff' }]}>Kaydı Tamamla</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Text style={[styles.backText, { color: theme.textSecondary }]}>Vazgeç ve Geri Dön</Text>
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
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, textAlign: 'center', marginTop: 5 },
  form: { width: '100%' },
  input: { padding: 18, borderRadius: 15, marginBottom: 15, borderWidth: 1 },
  regBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, height: 60, justifyContent: 'center' },
  regBtnText: { fontWeight: 'bold', fontSize: 18 },
  backBtn: { marginTop: 20, alignItems: 'center' },
  backText: { fontWeight: '600' }
});