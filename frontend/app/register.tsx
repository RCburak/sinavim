import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, Keyboard, TouchableWithoutFeedback, 
  KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ onBack, onRegisterSuccess }: { onBack: () => void, onRegisterSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      return Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    }

    try {
      const userData = { name, email, password };
      // Kullanıcı verilerini kaydediyoruz
      await AsyncStorage.setItem('@SınavımAI_UserData', JSON.stringify(userData));
      Alert.alert("Başarılı", "Hesabın oluşturuldu! Şimdi giriş yapabilirsin. 🎉", [
        { text: "Tamam", onPress: onRegisterSuccess }
      ]);
    } catch (e) {
      Alert.alert("Hata", "Kayıt sırasında bir sorun oluştu.");
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
              <Text style={styles.title}>Yeni Hesap 📝</Text>
              <Text style={styles.subtitle}>RC Sınavım AI ailesine katıl.</Text>
            </View>

            <View style={styles.form}>
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
              
              <TouchableOpacity style={styles.regBtn} onPress={handleRegister}>
                <Text style={styles.regBtnText}>Kaydı Tamamla</Text>
              </TouchableOpacity>

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
  regBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 10 
  },
  regBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: 18 },
  backBtn: { marginTop: 20, alignItems: 'center' },
  backText: { color: COLORS.textSecondary }
});