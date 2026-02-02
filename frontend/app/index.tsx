import React, { useState, useEffect } from 'react';
import { View, StatusBar, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';

// --- Sabitler ve Temalar ---
import { COLORS } from '../src/constants/theme';

// --- Servisler ve Hooklar ---
import { usePomodoro } from '../src/hooks/usePomodoro';
import { useAnaliz } from '../src/hooks/useAnaliz';

// --- Ekranlar ve Görünümler ---
import LoginScreen from './login'; 
import RegisterScreen from './register'; 
import SetupScreen from './setup';
import { DashboardHeader } from '../src/components/Dashboard/Header';
import { MenuCard } from '../src/components/Dashboard/MenuCard';
import { ProgramView } from '../src/components/ProgramView';
import { PomodoroView } from '../src/components/PomodoroView';
import { AnalizView } from '../src/components/AnalizView';

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [view, setView] = useState<'dashboard' | 'setup' | 'pomodoro' | 'program' | 'analiz'>('dashboard');
  const [schedule, setSchedule] = useState<any[] | null>(null);

  const pomodoro = usePomodoro();
  const analiz = useAnaliz();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userStatus = await AsyncStorage.getItem('@SınavımAI_UserLoggedIn');
      if (userStatus === 'true') setIsLoggedIn(true);

      const savedProg = await AsyncStorage.getItem('@SınavımAI_Program');
      if (savedProg) setSchedule(JSON.parse(savedProg));
    } catch (e) {
      console.error("Veri yükleme hatası", e);
    }
  };

  const handleLogin = async () => {
    await AsyncStorage.setItem('@SınavımAI_UserLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Oturumu kapatmak istediğine emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Evet, Çık", 
          onPress: async () => {
            await AsyncStorage.removeItem('@SınavımAI_UserLoggedIn');
            setIsLoggedIn(false);
            setView('dashboard');
            setAuthView('login');
          },
          style: "destructive"
        }
      ]
    );
  };

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

  if (!isLoggedIn) {
    if (authView === 'register') {
      return <RegisterScreen onBack={() => setAuthView('login')} onRegisterSuccess={() => setAuthView('login')} />;
    }
    return <LoginScreen onLogin={handleLogin} onGoToRegister={() => setAuthView('register')} />;
  }

  if (view === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} onBack={() => setView('dashboard')} />;
  }

  if (view === 'pomodoro') {
    return <PomodoroView {...pomodoro} onBack={() => setView('dashboard')} />;
  }

  if (view === 'program') {
    return <ProgramView tasks={schedule || []} toggleTask={toggleTask} onBack={() => setView('dashboard')} />;
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

  const progress = schedule && schedule.length > 0 
    ? Math.round((schedule.filter((t: any) => t.completed).length / schedule.length) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* DashboardHeader içine onLogout eklendi */}
      <DashboardHeader 
        username="Burak" 
        progress={progress} 
        onLogout={handleLogout} 
      />

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
            analiz.refreshAnaliz();
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