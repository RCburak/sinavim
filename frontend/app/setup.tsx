import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ActivityIndicator, StyleSheet, Alert,
  Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { programService } from '../src/services/programService';
import { COLORS } from '../src/constants/theme';

// DİKKAT: Ngrok linkin her zaman güncel olmalı!
const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export default function SetupScreen({ onComplete, onBack }: any) {
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!goal || !hours) return Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    
    setLoading(true);
    try {
      // 1. AI Programı Oluştur (services üzerinden Groq'a gider)
      const enrichedProgram = await programService.generateProgram(goal, parseInt(hours));
      
      if (!enrichedProgram) {
        throw new Error("AI program oluşturamadı.");
      }

      // 2. Kullanıcı ID'sini al
      const userId = await AsyncStorage.getItem('@SınavımAI_UserId');
      
      if (userId) {
        // 3. Programı Backend'e Kaydet (Bulut senkronizasyonu)
        const saveResponse = await fetch(`${API_URL}/save-program`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true' 
            },
            body: JSON.stringify({
                user_id: parseInt(userId),
                program: enrichedProgram
            })
        });

        if (!saveResponse.ok) throw new Error("Program sunucuya kaydedilemedi.");
      }

      Alert.alert("Başarılı", "Programın hazırlandı ve buluta kaydedildi! 🚀");
      onComplete(enrichedProgram); // Dashboard'a geri gönder
    } catch (e: any) {
      console.error("Setup Hatası:", e);
      Alert.alert("Program Oluşturulamadı", "Bir sorun çıktı: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Vazgeç</Text>
          </TouchableOpacity>
          
          <View style={styles.headerArea}>
            <Text style={styles.title}>Programını Hazırla 🎯</Text>
            <Text style={styles.subtitle}>
              Yapay zeka, hedeflerine uygun en verimli planı senin için hazırlayacak.
            </Text>
          </View>
          
          <View style={styles.form}>
            <Text style={styles.label}>Hedefin Nedir?</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Örn: TYT Matematik netlerimi artırmak" 
              onChangeText={setGoal}
              placeholderTextColor="#999"
            />
            
            <Text style={styles.label}>Günlük Çalışma Saati</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Örn: 4" 
              keyboardType="numeric" 
              onChangeText={setHours}
              placeholderTextColor="#999"
            />

            <TouchableOpacity 
              style={[styles.btn, loading && { opacity: 0.7 }]} 
              onPress={handleStart} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>AI Programımı Oluştur</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#fff' },
  backBtn: { marginTop: 50, marginBottom: 20 },
  backText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  headerArea: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 10, lineHeight: 22 },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginLeft: 5 },
  input: { 
    backgroundColor: '#F0F2F5', 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 20, 
    color: '#333', 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  btn: { 
    backgroundColor: COLORS.primary, 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 10, 
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});