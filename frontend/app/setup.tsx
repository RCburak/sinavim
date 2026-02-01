import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SetupScreen({ onComplete, onBack }: any) {
  const [goal, setGoal] = useState('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!goal || !hours) return Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    setLoading(true);
    try {
      // Buradaki URL'yi kendi Ngrok adresinle güncellemeyi unutma!
      const response = await fetch('https://sam-unsublimed-unoptimistically.ngrok-free.dev/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ goal, hours: parseInt(hours) }),
      });
      const data = await response.json();
      if (data.status === "success") {
        const enriched = data.program.map((item: any) => ({ ...item, completed: false }));
        await AsyncStorage.setItem('@SınavımAI_Program', JSON.stringify(enriched));
        onComplete(enriched);
      }
    } catch (e) {
      Alert.alert("Bağlantı Hatası", "Backend'e ulaşılamadı.");
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
      <TextInput style={styles.input} placeholder="Hedefin (Sayısal, EA...)" onChangeText={setGoal} />
      <TextInput style={styles.input} placeholder="Günlük Çalışma Saati" keyboardType="numeric" onChangeText={setHours} />
      <TouchableOpacity style={styles.btn} onPress={handleStart} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Hazırla</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  backBtn: { marginBottom: 20 },
  backText: { color: '#6200ee', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  input: { backgroundColor: '#F0F2F5', padding: 18, borderRadius: 15, marginBottom: 15 },
  btn: { backgroundColor: '#6200ee', padding: 20, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});