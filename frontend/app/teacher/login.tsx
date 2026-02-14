import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../src/services/authService';
import { COLORS } from '../../src/constants/theme';

export default function TeacherLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    const result = await authService.loginTeacher(email, password);
    setLoading(false);

    if (result.status === 'success') {
      // Teacher verisini kaydet (institution_id = teacher doc ID)
      try {
        const teacherData = result.teacher;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('teacher_data', JSON.stringify(teacherData));
        }
      } catch (e) { /* ignore storage errors */ }
      router.replace('/teacher/dashboard');
    } else {
      Alert.alert("Giriş Başarısız", result.message || "Hatalı e-posta veya şifre.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Öğretmen Paneli</Text>
          <Text style={styles.subtitle}>RC Sınavım Yönetim Sistemi</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>E-Posta Adresi</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@kurum.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    width: Platform.OS === 'web' ? 400 : '100%',
    padding: 40,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: COLORS.light.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});