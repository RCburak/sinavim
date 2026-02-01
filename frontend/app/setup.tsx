import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SetupScreen({ onComplete, onBack }: any) {
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://sam-unsublimed-unoptimistically.ngrok-free.dev'; 

  const handleStart = async () => {
    if (!goal || !hours) return Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate-program`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify({ goal, hours: parseInt(hours) }),
      });

      if (!response.ok) {
        throw new Error(`Sunucu Hatası: ${response.status}`);
      }

      const data = await response.json();

      // Esnek format kontrolü
      if (data.program && Array.isArray(data.program)) {
        const enriched = data.program.map((item: any) => ({ 
          day: item.day || item.gün || "Belirtilmedi",
          task: item.task || item.görev || "Çalışma",
          duration: item.duration || item.süre || "2 Saat",
          completed: false 
        }));
        
        await AsyncStorage.setItem('@SınavımAI_Program', JSON.stringify(enriched));
        Alert.alert("Başarılı", "Programın hazırlandı! 🚀");
        onComplete(enriched);
      } else {
        throw new Error("AI yanıtı beklenen program listesini içermiyor.");
      }
    } catch (e: any) {
      console.error("Bağlantı Hatası:", e);
      Alert.alert("Bağlantı Hatası", `Hata: ${e.message}. Ngrok ve Flask sunucularının açık olduğundan emin ol.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Vazgeç</Text>
      </TouchableOpacity>
      <Text style={styles.title}>AI Program Hazırla</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Hedefin (Sayısal, Yazılım...)" 
        onChangeText={setGoal} 
        placeholderTextColor="#999"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Günlük Çalışma Saati" 
        keyboardType="numeric" 
        onChangeText={setHours} 
        placeholderTextColor="#999"
      />
      <TouchableOpacity style={styles.btn} onPress={handleStart} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Programı Oluştur</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  backBtn: { marginBottom: 20 },
  backText: { color: '#6200ee', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#333' },
  input: { backgroundColor: '#F0F2F5', padding: 18, borderRadius: 15, marginBottom: 15, color: '#333' },
  btn: { backgroundColor: '#6200ee', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 2 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});