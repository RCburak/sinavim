import React, { useState, useEffect } from 'react';
import { View, StatusBar, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Sabitler ve Temalar ---
import { COLORS } from '../src/constants/theme';

// --- Servisler ve Hooklar ---
import { usePomodoro } from '../src/hooks/usePomodoro';
import { useAnaliz } from '../src/hooks/useAnaliz';

// --- Ekranlar ve Görünümler ---
import SetupScreen from './setup';
import { DashboardHeader } from '../src/components/Dashboard/Header';
import { MenuCard } from '../src/components/Dashboard/MenuCard';
import { ProgramView } from '../src/components/ProgramView';
import { PomodoroView } from '../src/components/PomodoroView';
import { AnalizView } from '../src/components/AnalizView';
import { ScrollView } from 'react-native-gesture-handler'; // Kaydırma için

export default function Index() {
  // 1. Durum Yönetimi (Routing & Data)
  const [view, setView] = useState<'dashboard' | 'setup' | 'pomodoro' | 'program' | 'analiz'>('dashboard');
  const [schedule, setSchedule] = useState<any[] | null>(null);

  // 2. Custom Hooklar (Mantık Katmanı)
  const pomodoro = usePomodoro();
  const analiz = useAnaliz();

  // 3. Veri Yükleme
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const savedProg = await AsyncStorage.getItem('@SınavımAI_Program');
      if (savedProg) setSchedule(JSON.parse(savedProg));
    } catch (e) {
      console.error("Veri yükleme hatası", e);
    }
  };

  // 4. Görev Tamamlama Mantığı
  const toggleTask = async (index: number) => {
    if (!schedule) return;
    const updated = [...schedule];
    updated[index].completed = !updated[index].completed;
    setSchedule(updated);
    await AsyncStorage.setItem('@SınavımAI_Program', JSON.stringify(updated));
  };

  const handleSetupComplete = (data: any) => {
    setSchedule(data);
    setView('dashboard');
  };

  // --- GÖRÜNÜM YÖNETİMİ (ROUTING) ---

  if (view === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} onBack={() => setView('dashboard')} />;
  }

  if (view === 'pomodoro') {
    return <PomodoroView {...pomodoro} onBack={() => setView('dashboard')} />;
  }

  if (view === 'program') {
    return (
      <ProgramView 
        tasks={schedule || []} 
        toggleTask={toggleTask} 
        onBack={() => setView('dashboard')} 
      />
    );
  }

  if (view === 'analiz') {
    return (
      <AnalizView 
        analizler={analiz.analizler}
        aiYorum={analiz.aiYorum}
        loadingYorum={analiz.loading}
        onAdd={analiz.addAnaliz}
        onSil={analiz.deleteAnaliz}
        onBack={() => setView('dashboard')}
      />
    );
  }

  // Varsayılan: Dashboard
  const progress = schedule && schedule.length > 0 
    ? Math.round((schedule.filter((t: any) => t.completed).length / schedule.length) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <DashboardHeader username="Burak" progress={progress} />

      <ScrollView contentContainerStyle={styles.menuGrid}>
        <MenuCard 
          title="Programım" 
          emoji="📅" 
          subText={`${schedule?.length || 0} Ders Planlandı`} 
          onPress={() => setView('program')} 
        />
        <MenuCard 
          title="Pomodoro" 
          emoji="⏱️" 
          subText={pomodoro.formatTime(pomodoro.timer)} 
          onPress={() => setView('pomodoro')} 
        />
        <MenuCard 
          title="Analizler" 
          emoji="📈" 
          subText="Net takibi yap" 
          color={COLORS.warning}
          onPress={() => {
            setView('analiz');
            analiz.refreshAnaliz(); // Sayfa açılırken verileri tazele
          }} 
        />
        <MenuCard 
          title="Ayarlar" 
          emoji="⚙️" 
          subText="Programı güncelle" 
          onPress={() => setView('setup')} 
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 20, 
    justifyContent: 'space-between',
    paddingTop: 30 
  },
});