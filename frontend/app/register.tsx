import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, 
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../src/services/authService';

export default function RegisterScreen({ onBack, onRegisterSuccess }: { onBack: () => void, onRegisterSuccess: () => void }) {
  // --- State Yönetimi ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [loading, setLoading] = useState(false);

  // --- Kayıt İşlemi ---
  const handleRegister = async () => {
    // Boş alan kontrolü
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    }
    
    // Şifre eşleşme kontrolü
    if (password !== confirmPassword) {
      return Alert.alert("Hata", "Şifreler birbiriyle uyuşmuyor!");
    }

    // Şifre uzunluğu kontrolü (Firebase en az 6 karakter ister)
    if (password.length < 6) {
      return Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır!");
    }

    setLoading(true);
    try {
      // DÜZELTME: Firebase'e ismi de gönderiyoruz ki Dashboard'da "Öğrenci" yazmasın
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
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>
            
            <View style={styles.form}>
              <View style={styles.header}>
                <Text style={styles.title}>Yeni Hesap 📝</Text>
                <Text style={styles.subtitle}>RC Sınavım AI ailesine katıl.</Text>
              </View>

              {/* Girdi Alanları */}
              <TextInput 
                style={styles.input} 
                placeholder="Ad Soyad" 
                placeholderTextColor={COLORS.textSecondary} 
                value={name} 
                onChangeText={setName} 
              />
              <TextInput 
                style={styles.input} 
                placeholder="E-posta" 
                placeholderTextColor={COLORS.textSecondary} 
                value={email} 
                onChangeText={setEmail} 
                autoCapitalize="none" 
                keyboardType="email-address" 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Şifre" 
                placeholderTextColor={COLORS.textSecondary} 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
              />
              <TextInput 
                style={styles.input} 
                placeholder="Şifre Tekrar" 
                placeholderTextColor={COLORS.textSecondary} 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry 
              />

              {/* Kayıt Butonu */}
              <TouchableOpacity 
                style={[styles.regBtn, loading && { opacity: 0.7 }]} 
                onPress={handleRegister} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.surface} /> : <Text style={styles.regBtnText}>Kaydı Tamamla</Text>}
              </TouchableOpacity>

              {/* Geri Dön Butonu */}
              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Text style={styles.backText}>Vazgeç ve Geri Dön</Text>
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
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: 5 },
  form: { width: '100%' },
  input: { backgroundColor: COLORS.surface, padding: 18, borderRadius: 15, marginBottom: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border },
  regBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, height: 60, justifyContent: 'center' },
  regBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 18 },
  backBtn: { marginTop: 20, alignItems: 'center' },
  backText: { color: COLORS.textSecondary, fontWeight: '600' }
});