import React, { useState, useEffect } from 'react';
import { View, StatusBar, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from "firebase/auth"; 
import { auth } from '../src/services/firebaseConfig'; 

import { COLORS } from '../src/constants/theme'; // Temayı import ettik
import LoginScreen from './login'; 
import RegisterScreen from './register'; 
import SetupScreen from './setup';
import { DashboardView } from './dashboard';
import { ProfileView } from './ProfileView'; 
import { ProgramView } from '../src/components/ProgramView';
import { PomodoroView } from '../src/components/PomodoroView';
import { AnalizView } from '../src/components/AnalizView';
import { usePomodoro } from '../src/hooks/usePomodoro';
import { useAnaliz } from '../src/hooks/useAnaliz';

const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export default function Index() {
  const [authState, setAuthState] = useState<'loading' | 'login' | 'register' | 'authenticated'>('loading');
  const [view, setView] = useState<'dashboard' | 'setup' | 'pomodoro' | 'program' | 'analiz' | 'profile'>('dashboard');
  const [userName, setUserName] = useState('Öğrenci');
  const [schedule, setSchedule] = useState<any[]>([]); 
  
  // GECE MODU STATE'İ
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const pomodoro = usePomodoro();
  const analiz = useAnaliz();

  // --- 1. Firebase Dinleyicisi ---
  useEffect(() => {
    const loadSettings = async () => {
      const savedTheme = await AsyncStorage.getItem('@RCSinavim_DarkMode');
      if (savedTheme !== null) setIsDarkMode(savedTheme === 'true');
    };
    loadSettings();

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
    return unsubscribe;
  }, []);

  // Gece Modu Değiştirme Fonksiyonu
  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await AsyncStorage.setItem('@RCSinavim_DarkMode', String(newValue));
  };

  const loadProgram = async (uid: string) => {
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
        const mappedProg = cloudProg.map((item: any) => ({
          gun: item.gun || item.gün || item.day || "Pazartesi",
          task: item.task || item.görev || "Ders Çalışma",
          duration: item.duration || item.süre || "1 Saat",
          completed: item.completed === 1 || item.completed === true
        }));
        setSchedule(mappedProg);
      }
    } catch (e) { 
      console.error("Program yükleme hatası:", e);
      setSchedule([]);
    }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Emin misin?", [
      { text: "Evet", onPress: async () => {
          await auth.signOut(); 
          await AsyncStorage.multiRemove(['@SınavımAI_UserId', '@SınavımAI_UserName', '@SınavımAI_UserLoggedIn']);
          setAuthState('login');
          setView('dashboard');
      }}
    ]);
  };

  if (authState === 'loading') return null;

  if (authState === 'login') {
    return <LoginScreen onLogin={() => {}} onGoToRegister={() => setAuthState('register')} />;
  }

  // --- GÖRÜNÜM YÖNETİMİ ---
  // Tüm view'lara 'theme' ve 'isDarkMode' proplarını ekledik
  switch (view) {
    case 'setup': 
      return <SetupScreen theme={theme} onComplete={(newProg: any) => { setSchedule(newProg); setView('dashboard'); }} onBack={() => setView('dashboard')} />;
    case 'pomodoro': 
      return <PomodoroView {...pomodoro} theme={theme} onBack={() => setView('dashboard')} />;
    case 'program': 
      return <ProgramView tasks={schedule} theme={theme} onBack={() => setView('dashboard')} />;
    case 'analiz': 
      return <AnalizView analizler={analiz.analizler} theme={theme} aiYorum={analiz.aiYorum} loadingYorum={analiz.loading} onAdd={analiz.addAnaliz} onSil={analiz.deleteAnaliz} onBack={() => setView('dashboard')} />;
    case 'profile': 
      return <ProfileView username={userName} theme={theme} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} schedule={schedule} totalTime={pomodoro.formatTime(pomodoro.timer)} onBack={() => setView('dashboard')} />;
    default: 
      const progress = schedule.length > 0 ? Math.round((schedule.filter((t: any) => t.completed).length / schedule.length) * 100) : 0;
      return <DashboardView username={userName} progress={progress} theme={theme} isDarkMode={isDarkMode} onLogout={handleLogout} setView={setView} schedule={schedule} analiz={analiz} pomodoro={pomodoro} />;
  }
}