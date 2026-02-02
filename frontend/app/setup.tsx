import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ActivityIndicator, StyleSheet, Alert,
  Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { programService } from '../src/services/programService';
import { COLORS } from '../src/constants/theme';

const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

// Bileşen ismi ve içeriği "AI Program" olarak güncellendi
export default function AIProgramScreen({ onComplete, onBack, theme = COLORS.light }: any) {
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!goal || !hours) return Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    
    setLoading(true);
    try {
      // 1. AI Programı Oluştur
      const enrichedProgram = await programService.generateProgram(goal, parseInt(hours));
      
      if (!enrichedProgram) {
        throw new Error("AI program oluşturamadı.");
      }

      // 2. Kullanıcı ID'sini al
      const userId = await AsyncStorage.getItem('@SınavımAI_UserId');
      
      if (userId) {
        // 3. Programı Backend'e Kaydet
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

      Alert.alert("Başarılı", "AI Programın hazırlandı ve buluta kaydedildi! 🚀");
      onComplete(enrichedProgram); 
    } catch (e: any) {
      console.error("AI Program Hatası:", e);
      Alert.alert("Hata", "Program oluşturulurken bir sorun çıktı: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.container}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={[styles.backText, { color: theme.primary }]}>← Vazgeç</Text>
            </TouchableOpacity>
            
            <View style={styles.headerArea}>
              <Text style={[styles.title, { color: theme.text }]}>AI Programını Hazırla 🤖</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Hedeflerine en kısa sürede ulaşman için yapay zeka seninle birlikte planlama yapar.
              </Text>
            </View>
            
            <View style={styles.form}>
              <Text style={[styles.label, { color: theme.text }]}>Odaklanmak İstediğin Hedef</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                placeholder="Örn: AYT Edebiyat konularını bitirmek" 
                onChangeText={setGoal}
                placeholderTextColor={theme.textSecondary}
              />
              
              <Text style={[styles.label, { color: theme.text }]}>Günlük Ayırabileceğin Süre (Saat)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                placeholder="Örn: 5" 
                keyboardType="numeric" 
                onChangeText={setHours}
                placeholderTextColor={theme.textSecondary}
              />

              <TouchableOpacity 
                style={[
                    styles.btn, 
                    { backgroundColor: theme.primary, shadowColor: theme.primary },
                    loading && { opacity: 0.7 }
                ]} 
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
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30 },
  backBtn: { marginTop: 50, marginBottom: 20 },
  backText: { fontWeight: 'bold', fontSize: 16 },
  headerArea: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 15, marginTop: 10, lineHeight: 22 },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 10, marginLeft: 5 },
  input: { 
    padding: 18, 
    borderRadius: 15, 
    marginBottom: 20, 
    fontSize: 16,
    borderWidth: 1,
  },
  btn: { 
    padding: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 15, 
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});