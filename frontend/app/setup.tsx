import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ActivityIndicator, StyleSheet, Alert,
  Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { programService } from '../src/services/programService';
import { COLORS } from '../src/constants/theme';

export default function SetupScreen({ onComplete, onBack }: any) {
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!goal || !hours) return Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    
    setLoading(true);
    try {
      const enrichedProgram = await programService.generateProgram(goal, parseInt(hours));
      await AsyncStorage.setItem('@SınavımAI_Program', JSON.stringify(enrichedProgram));
      Alert.alert("Başarılı", "Programın hazırlandı! 🚀");
      onComplete(enrichedProgram);
    } catch (e: any) {
      Alert.alert("Bağlantı Hatası", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. Ekranın boş yerine basınca klavyeyi kapatır
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* 2. Klavyenin inputların üzerine binmesini engeller */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← Vazgeç</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>RC Sınavım AI</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Hedefin (Sayısal, Yazılım...)" 
            onChangeText={setGoal}
            placeholderTextColor="#999"
            returnKeyType="done" // Klavyede 'Bitti' butonu çıkar
            onSubmitEditing={Keyboard.dismiss} // Bitti'ye basınca klavyeyi kapatır
          />
          
          <TextInput 
            style={styles.input} 
            placeholder="Günlük Çalışma Saati" 
            keyboardType="numeric" 
            onChangeText={setHours}
            placeholderTextColor="#999"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />

          <TouchableOpacity style={styles.btn} onPress={handleStart} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Programı Oluştur</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  backBtn: { marginBottom: 20 },
  backText: { color: COLORS.primary, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#333' },
  input: { backgroundColor: '#F0F2F5', padding: 18, borderRadius: 15, marginBottom: 15, color: '#333' },
  btn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});