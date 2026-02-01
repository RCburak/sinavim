import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, Alert, Dimensions, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DayFolder } from '../src/components/DayFolder';
import { PomodoroTimer } from '../src/components/PomodoroTimer';
import { AnalizTablosu } from '../src/components/AnalizTablosu';
import { COLORS, GUNLER } from '../src/constants/theme';
import SetupScreen from './setup';

const { width } = Dimensions.get('window');

// BURAYI BİR KEZ SABİT ADRESİNLE DEĞİŞTİR, BİR DAHA DOKUNMA!
const API_URL = 'https://senin-sabit-domainin.ngrok-free.app'; 

export default function Index() {
  const [schedule, setSchedule] = useState<any[] | null>(null);
  const [analizler, setAnalizler] = useState<any[]>([]);
  const [view, setView] = useState<'dashboard' | 'setup' | 'pomodoro' | 'program' | 'analiz'>('dashboard');
  const [aiYorum, setAiYorum] = useState<string>('Analiz ediliyor...');
  const [loadingYorum, setLoadingYorum] = useState(false);
  
  const [denemeAd, setDenemeAd] = useState('');
  const [denemeNet, setDenemeNet] = useState('');

  // Pomodoro Timer State
  const [timer, setTimer] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (view === 'analiz') {
      fetchAnalizler();
      fetchAIYorum();
    }
  }, [view]);

  // Ortak Header: Ngrok engelini ve JSON hatasını kökten çözer
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  };

  const loadInitialData = async () => {
    const savedProg = await AsyncStorage.getItem('@SınavımAI_Program');
    if (savedProg) setSchedule(JSON.parse(savedProg));
  };

  const fetchAnalizler = async () => {
    try {
      const res = await fetch(`${API_URL}/analizler`, { headers });
      const data = await res.json();
      setAnalizler(data);
    } catch (e) { console.error("Veritabanı hatası:", e); }
  };

  const fetchAIYorum = async () => {
    setLoadingYorum(true);
    try {
      const res = await fetch(`${API_URL}/ai-yorumla`, { headers });
      const data = await res.json();
      setAiYorum(data.yorum);
    } catch (e) { setAiYorum("Koçun şu an meşgul Burak, ama netlerin harika görünüyor!"); }
    setLoadingYorum(false);
  };

  const yeniAnalizEkle = async () => {
    if (!denemeAd || !denemeNet) return Alert.alert("Hata", "Lütfen tüm alanları doldur!");
    const yeni = { ad: denemeAd, net: parseFloat(denemeNet), tarih: new Date().toLocaleDateString('tr-TR') };
    
    try {
      const res = await fetch(`${API_URL}/analiz-ekle`, {
        method: 'POST',
        headers,
        body: JSON.stringify(yeni),
      });
      if (res.ok) {
        setDenemeAd(''); setDenemeNet('');
        fetchAnalizler();
        fetchAIYorum();
      }
    } catch (e) { Alert.alert("Hata", "Sunucuya bağlanılamadı."); }
  };

  const toggleTask = async (index: number) => {
    if (!schedule) return;
    const updated = [...schedule];
    updated[index].completed = !updated[index].completed;
    setSchedule(updated);
    await AsyncStorage.setItem('@SınavımAI_Program', JSON.stringify(updated));
  };

  useEffect(() => {
    if (isActive && timer > 0) {
      intervalRef.current = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      clearInterval(intervalRef.current);
      setIsActive(false);
      const nextMode = !isBreak;
      setIsBreak(nextMode);
      setTimer(nextMode ? 5 * 60 : 25 * 60);
      Alert.alert(isBreak ? "Mola Bitti! ☕" : "Çalışma Bitti! 💪");
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timer]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = schedule ? Math.round((schedule.filter((t: any) => t.completed).length / schedule.length) * 100) : 0;
  const tasksWithIndex = schedule?.map((item, index) => ({ ...item, originalIndex: index })) || [];

  if (view === 'setup') return <SetupScreen onComplete={(data: any) => { setSchedule(data); setView('dashboard'); }} onBack={() => setView('dashboard')} />;
  if (view === 'pomodoro') return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: isBreak ? COLORS.success : COLORS.danger }]}>
      <TouchableOpacity onPress={() => setView('dashboard')} style={styles.backBtn}><Text style={styles.backBtnText}>← Dashboard</Text></TouchableOpacity>
      <PomodoroTimer timer={timer} isActive={isActive} isBreak={isBreak} onToggle={() => setIsActive(!isActive)} onReset={() => {setTimer(isBreak ? 300 : 1500); setIsActive(false);}} formatTime={formatTime} />
    </SafeAreaView>
  );
  if (view === 'program') return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: COLORS.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}><TouchableOpacity onPress={() => setView('dashboard')}><Text style={styles.backBtnText}>← Dashboard</Text></TouchableOpacity><Text style={styles.headerTitle}>Haftalık Programım</Text></View>
      <ScrollView style={{ padding: 20 }}>{GUNLER.map(gun => <DayFolder key={gun} day={gun} tasks={tasksWithIndex} toggleTask={toggleTask} />)}</ScrollView>
    </SafeAreaView>
  );
  if (view === 'analiz') return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={[styles.header, { backgroundColor: COLORS.warning }]}><TouchableOpacity onPress={() => setView('dashboard')}><Text style={styles.backBtnText}>← Dashboard</Text></TouchableOpacity><Text style={styles.headerTitle}>Deneme Analizi</Text></View>
      <View style={styles.aiCard}><Text style={styles.aiTitle}>🤖 Sınavım AI Yorumu</Text>{loadingYorum ? <ActivityIndicator color={COLORS.warning} /> : <Text style={styles.aiContent}>{aiYorum}</Text>}</View>
      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="Deneme Adı" value={denemeAd} onChangeText={setDenemeAd} placeholderTextColor={COLORS.gray} />
        <TextInput style={styles.input} placeholder="Netiniz" keyboardType="numeric" value={denemeNet} onChangeText={setDenemeNet} placeholderTextColor={COLORS.gray} />
        <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.warning }]} onPress={yeniAnalizEkle}><Text style={styles.btnText}>Veriyi Kaydet</Text></TouchableOpacity>
      </View>
      <View style={{ padding: 20, flex: 1 }}><AnalizTablosu veriler={analizler} /></View>
    </SafeAreaView>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.hero, { backgroundColor: COLORS.primary }]}><SafeAreaView><Text style={styles.greeting}>Merhaba Burak! 👋</Text><View style={styles.progressBox}><Text style={styles.progressText}>Genel Başarı: %{progress}</Text><View style={[styles.progressBar, { backgroundColor: COLORS.overlay }]}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: COLORS.secondary }]} /></View></View></SafeAreaView></View>
      <ScrollView contentContainerStyle={styles.menuGrid}>
        <TouchableOpacity style={styles.menuCard} onPress={() => setView('program')}><Text style={styles.cardEmoji}>📅</Text><Text style={styles.cardTitle}>Programım</Text><Text style={styles.cardSub}>Günlük planların</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuCard} onPress={() => setView('pomodoro')}><Text style={styles.cardEmoji}>⏱️</Text><Text style={styles.cardTitle}>Pomodoro</Text><Text style={styles.cardSub}>{formatTime(timer)} Odaklan</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuCard} onPress={() => setView('analiz')}><Text style={styles.cardEmoji}>📈</Text><Text style={[styles.cardTitle, { color: COLORS.warning }]}>Analizler</Text><Text style={styles.cardSub}>Net takibi yap</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuCard} onPress={() => setView('setup')}><Text style={styles.cardEmoji}>⚙️</Text><Text style={styles.cardTitle}>Ayarlar</Text><Text style={styles.cardSub}>Yeni program kur</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fullScreen: { flex: 1 },
  hero: { padding: 30, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 5 },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  progressBox: { marginTop: 20 },
  progressText: { color: '#fff', marginBottom: 8 },
  progressBar: { height: 8, borderRadius: 4 },
  progressFill: { height: '100%', borderRadius: 4 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, justifyContent: 'space-between' },
  menuCard: { width: width * 0.42, backgroundColor: '#fff', padding: 20, borderRadius: 25, marginBottom: 20, elevation: 3 },
  cardEmoji: { fontSize: 30, marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  header: { padding: 25, flexDirection: 'row', alignItems: 'center', paddingTop: 50 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 20 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
  backBtn: { padding: 20, paddingTop: 40 },
  formCard: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 20, elevation: 2 },
  input: { borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, paddingVertical: 10, marginBottom: 15, color: COLORS.text },
  btn: { padding: 15, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  aiCard: { backgroundColor: '#FFF4E5', margin: 20, padding: 15, borderRadius: 20, borderLeftWidth: 5, borderLeftColor: COLORS.warning },
  aiTitle: { fontWeight: 'bold', color: COLORS.warning, marginBottom: 5 },
  aiContent: { color: COLORS.text, fontStyle: 'italic' }
});