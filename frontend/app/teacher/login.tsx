import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/services/authService';
import { COLORS } from '../../src/constants/theme';

const { width, height } = Dimensions.get('window');

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
      <LinearGradient
        colors={[COLORS.light.primary, '#6C3CE1', '#4F46E5']}
        style={styles.background}
      />

      {/* Abstract Shapes */}
      <View style={[styles.shape, styles.shape1]} />
      <View style={[styles.shape, styles.shape2]} />

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="school" size={40} color={COLORS.light.primary} />
          </View>
          <Text style={styles.title}>Öğretmen Paneli</Text>
          <Text style={styles.subtitle}>RC Sınavım Yönetim Sistemi</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-Posta Adresi"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <LinearGradient
                colors={[COLORS.light.primary, '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Giriş Yap</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footerText}>© 2024 RC Sınavım. Tüm hakları saklıdır.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  shape: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
    backgroundColor: '#fff',
  },
  shape1: {
    width: 300,
    height: 300,
    top: -100,
    left: -100,
  },
  shape2: {
    width: 400,
    height: 400,
    bottom: -150,
    right: -100,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: Platform.OS === 'web' ? 420 : '90%',
    padding: 40,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF'
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  form: {
    width: '100%',
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: '100%',
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.light.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footerText: {
    position: 'absolute',
    bottom: 20,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  }
});