import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard,
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../src/services/authService';
import { Ionicons } from '@expo/vector-icons';

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

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={isDark ? ['#0F0F1A', '#1A1A2E', '#16213E'] : ['#6C3CE1', '#4A1DB5', '#3B0F99']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Ionicons name="person-add" size={32} color="#fff" />
              </View>
              <Text style={styles.title}>Yeni Hesap</Text>
              <Text style={styles.subtitle}>RC Sınavım ailesine katıl.</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ad Soyad"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={name}
                  onChangeText={setName}
                />
              </View>

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
                  secureTextEntry
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifre Tekrar"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.regBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color="#6C3CE1" /> : <Text style={styles.regBtnText}>Kaydı Tamamla</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.5)" />
                <Text style={styles.backText}>Vazgeç ve Geri Dön</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 30 },

  header: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
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

  regBtn: {
    backgroundColor: '#fff', height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  regBtnText: { color: '#6C3CE1', fontWeight: '800', fontSize: 17 },

  backBtn: { marginTop: 22, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  backText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 14 },
});