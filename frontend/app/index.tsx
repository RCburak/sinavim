import React, { useState, useEffect } from 'react';
import { View, StatusBar, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from "firebase/auth"; 
import { auth } from '../src/services/firebaseConfig'; 

import { COLORS } from '../src/constants/theme'; 
import LoginScreen from './login'; 
import RegisterScreen from './register'; 
import AIProgramScreen from './setup'; 
import { DashboardView } from './dashboard';
// DİKKAT: Dosya isminin ProfileView.tsx ile tam eşleştiğinden emin olun
import { ProfileView } from './ProfileView'; 
import { ProgramView } from '../src/components/ProgramView';
import { PomodoroView } from '../src/components/PomodoroView';
import { AnalizView } from '../src/components/AnalizView';
import { HistoryView } from './HistoryView'; 
import { usePomodoro } from '../src/hooks/usePomodoro';
import { useAnaliz } from '../src/hooks/useAnaliz';

const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export default function Index() {
  const [authState, setAuthState] = useState<'loading' | 'login' | 'register' | 'authenticated'>('loading');
  const [view, setView] = useState<'dashboard' | 'setup' | 'manual_setup' | 'pomodoro' | 'program' | 'analiz' | 'profile' | 'history'>('dashboard');
  const [userName, setUserName] = useState('Öğrenci');
  const [schedule, setSchedule] = useState<any[]>([]); 
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const pomodoro = usePomodoro();
  const analiz = useAnaliz();

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@RCSinavim_DarkMode');
        if (savedTheme !== null) setIsDarkMode(savedTheme === 'true');
      } catch (e) {
        console.log("Tema yükleme hatası:", e);
      }
    };
    initApp();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        const savedName = await AsyncStorage.getItem('@SınavımAI_UserName');
        const finalName = user.displayName || savedName || user.email?.split('@')[0] || 'Öğrenci';
        setUserName(finalName);
        
        await loadProgram(user.uid);
        setAuthState('authenticated');
      } else {
        setAuthState('login');
      }
    });
    return () => unsubscribe();
  }, []);

  const loadProgram = async (uid: string) => {
    if (!uid) return;
    try {
      const response = await fetch(`${API_URL}/get-program/${uid}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (response.status === 404) {
        setSchedule([]);
        return;
      }
      const cloudProg = await response.json();
      if (cloudProg && Array.isArray(cloudProg)) {
        setSchedule(cloudProg.map((item: any) => ({
          gun: item.gun || "Pazartesi",
          task: item.task || "Ders",
          duration: item.duration || "1 Saat",
          completed: item.completed === 1 || item.completed === true,
          questions: item.questions || 0 
        })));
      }
    } catch (e) { 
      setSchedule([]);
    }
  };

  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await AsyncStorage.setItem('@RCSinavim_DarkMode', String(newValue));
  };

  const saveScheduleToCloud = async (newSchedule: any[]) => {
    try {
      const user = auth.currentUser;
      if (user) {
        return await fetch(`${API_URL}/save-program`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.uid,
            program: newSchedule
          })
        });
      }
    } catch (e) {
      console.error("Buluta kaydetme hatası:", e);
    }
  };

  const updateQuestions = async (index: number, count: string) => {
    if (index === undefined || index === null) return;
    const qCount = parseInt(count) || 0;
    const newSchedule = [...schedule];
    newSchedule[index].questions = qCount;
    setSchedule(newSchedule);
    if (view !== 'manual_setup') await saveScheduleToCloud(newSchedule);
  };

  const toggleTask = async (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].completed = !newSchedule[index].completed;
    setSchedule(newSchedule);
    if (view !== 'manual_setup') await saveScheduleToCloud(newSchedule);
  };

  const finalizeManualWeek = async () => {
    const user = auth.currentUser;
    if (!user || schedule.length === 0) return;

    try {
      await saveScheduleToCloud(schedule);
      await fetch(`${API_URL}/archive-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, type: 'manual' })
      });
      setSchedule([]); 
      Alert.alert("Başarılı", "Plan arşivlendi! 🚀");
      setView('dashboard');
    } catch (e) {
      Alert.alert("Hata", "İşlem sırasında bir sorun oluştu.");
    }
  };

  const archiveOldAndSetup = async (targetView: 'setup' | 'manual_setup') => {
    const user = auth.currentUser;
    if (!user) return;

    if (schedule.length > 0) {
      Alert.alert(
        "Yeni Haftaya Başla",
        "Mevcut programın arşive taşınacak. Onaylıyor musun?",
        [
          { text: "Vazgeç", style: "cancel" },
          { 
            text: "Evet", 
            onPress: async () => {
              try {
                await fetch(`${API_URL}/archive-program`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.uid, type: 'ai' })
                });
                setSchedule([]); 
                setView(targetView);
              } catch (e) {
                setSchedule([]);
                setView(targetView);
              }
            }
          }
        ]
      );
    } else {
      setView(targetView);
    }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Emin misin?", [
      { text: "Evet", onPress: async () => {
          await auth.signOut(); 
          setAuthState('login');
          setSchedule([]);
          setView('dashboard');
      }}
    ]);
  };

  if (authState === 'loading') {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (authState === 'login') return <LoginScreen theme={theme} onLogin={() => {}} onGoToRegister={() => setAuthState('register')} />;
  if (authState === 'register') return <RegisterScreen theme={theme} onBack={() => setAuthState('login')} onRegisterSuccess={() => setAuthState('login')} />;

  // Sayfa render mantığı
  const renderView = () => {
    switch (view) {
      case 'setup': 
        return <AIProgramScreen theme={theme} onComplete={(n: any) => { setSchedule(n); setView('dashboard'); }} onBack={() => setView('dashboard')} />;
      case 'manual_setup':
        return <ProgramView tasks={schedule} isEditMode={true} toggleTask={toggleTask} updateQuestions={updateQuestions} onAddTask={(t: any) => setSchedule(prev => [...prev, t])} onFinalize={finalizeManualWeek} theme={theme} onBack={() => setView('dashboard')} />;
      case 'pomodoro': return <PomodoroView {...pomodoro} theme={theme} onBack={() => setView('dashboard')} />;
      case 'program': return <ProgramView tasks={schedule} toggleTask={toggleTask} updateQuestions={updateQuestions} theme={theme} onBack={() => setView('dashboard')} />;
      case 'analiz': return <AnalizView analizler={analiz.analizler} theme={theme} aiYorum={analiz.aiYorum} loadingYorum={analiz.loading} onAdd={analiz.addAnaliz} onSil={analiz.deleteAnaliz} onBack={() => setView('dashboard')} />;
      case 'history': return <HistoryView theme={theme} onBack={() => setView('dashboard')} userId={auth.currentUser?.uid} />;
      case 'profile': return <ProfileView username={userName} theme={theme} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onBack={(n:any)=>{if(n)setUserName(n);setView('dashboard')}} />;
      default: 
        return <DashboardView username={userName} theme={theme} onLogout={handleLogout} setView={(v: any) => (v === 'setup' || v === 'manual_setup') ? archiveOldAndSetup(v) : setView(v)} schedule={schedule} analiz={analiz} pomodoro={pomodoro} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      {renderView()}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});