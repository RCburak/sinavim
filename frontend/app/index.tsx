import React, { useState, useEffect } from 'react';
import { View, StatusBar, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from "firebase/auth"; 
import { auth } from '../src/services/firebaseConfig'; 

import { COLORS } from '../src/constants/theme'; 
import LoginScreen from './login'; 
import RegisterScreen from './register'; 
import AIProgramScreen from './setup'; 
import { DashboardView } from './dashboard';
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
  const [view, setView] = useState<'dashboard' | 'setup' | 'pomodoro' | 'program' | 'analiz' | 'profile' | 'history'>('dashboard');
  const [userName, setUserName] = useState('Öğrenci');
  const [schedule, setSchedule] = useState<any[]>([]); 
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  const pomodoro = usePomodoro();
  const analiz = useAnaliz();

  useEffect(() => {
    const initApp = async () => {
      const savedTheme = await AsyncStorage.getItem('@RCSinavim_DarkMode');
      if (savedTheme !== null) setIsDarkMode(savedTheme === 'true');
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
    return unsubscribe;
  }, []);

  const toggleDarkMode = async () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await AsyncStorage.setItem('@RCSinavim_DarkMode', String(newValue));
  };

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
          completed: item.completed === 1 || item.completed === true
        })));
      }
    } catch (e) { 
      setSchedule([]);
    }
  };

  const archiveOldAndSetup = async () => {
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
                  body: JSON.stringify({ user_id: user.uid })
                });
                setView('setup');
              } catch (e) {
                setView('setup'); 
              }
            }
          }
        ]
      );
    } else {
      setView('setup');
    }
  };

  const toggleTask = async (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].completed = !newSchedule[index].completed;
    setSchedule(newSchedule);

    try {
      const user = auth.currentUser;
      if (user) {
        await fetch(`${API_URL}/save-program`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.uid,
            program: newSchedule
          })
        });
      }
    } catch (e) {
      console.error(e);
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

  if (authState === 'loading') return null;

  if (authState === 'login') {
    return <LoginScreen theme={theme} onLogin={() => {}} onGoToRegister={() => setAuthState('register')} />;
  }

  if (authState === 'register') {
    return <RegisterScreen theme={theme} onBack={() => setAuthState('login')} onRegisterSuccess={() => setAuthState('login')} />;
  }

  switch (view) {
    case 'setup': 
      return (
        <AIProgramScreen 
          theme={theme} 
          onComplete={(newProg: any) => { 
            // VERİ DOĞRULAMA: Gelen veriyi temizle ve dizi olduğundan emin ol
            const safeProg = Array.isArray(newProg) ? newProg.map((item: any) => ({
                gun: item.gun || "Pazartesi",
                task: item.task || "Ders",
                duration: item.duration || "1 Saat",
                completed: item.completed === 1 || item.completed === true
            })) : [];

            setSchedule(safeProg); 
            setView('dashboard'); 
          }} 
          onBack={() => setView('dashboard')} 
        />
      );
    case 'pomodoro': 
      return <PomodoroView {...pomodoro} theme={theme} onBack={() => setView('dashboard')} />;
    case 'program': 
      return <ProgramView tasks={schedule} toggleTask={toggleTask} theme={theme} onBack={() => setView('dashboard')} />;
    case 'analiz': 
      return <AnalizView analizler={analiz.analizler} theme={theme} aiYorum={analiz.aiYorum} loadingYorum={analiz.loading} onAdd={analiz.addAnaliz} onSil={analiz.deleteAnaliz} onBack={() => setView('dashboard')} />;
    case 'history':
      return <HistoryView theme={theme} onBack={() => setView('dashboard')} userId={auth.currentUser?.uid} />;
    case 'profile': 
      return (
        <ProfileView 
          username={userName} 
          theme={theme} 
          isDarkMode={isDarkMode} 
          toggleDarkMode={toggleDarkMode} 
          onBack={(updatedName?: string) => {
            if (updatedName && typeof updatedName === 'string') {
              setUserName(updatedName);
            }
            setView('dashboard');
          }} 
        />
      );
    default: 
      const progress = schedule.length > 0 ? Math.round((schedule.filter((t: any) => t.completed).length / schedule.length) * 100) : 0;
      return (
        <DashboardView 
          username={userName} 
          progress={progress} 
          theme={theme} 
          onLogout={handleLogout} 
          setView={(v: any) => v === 'setup' ? archiveOldAndSetup() : setView(v)} 
          schedule={schedule} 
          analiz={analiz} 
          pomodoro={pomodoro} 
        />
      );
  }
}