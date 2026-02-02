import React, { useState, useEffect } from 'react';
import { View, StatusBar, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from "firebase/auth"; 
import { auth } from '../src/services/firebaseConfig'; 

import LoginScreen from './login'; 
import RegisterScreen from './register'; 
import SetupScreen from './setup';
import { DashboardView } from './dashboard';
import { ProfileView } from './ProfileView'; // Yeni eklenen profil sayfası
import { ProgramView } from '../src/components/ProgramView';
import { PomodoroView } from '../src/components/PomodoroView';
import { AnalizView } from '../src/components/AnalizView';
import { usePomodoro } from '../src/hooks/usePomodoro';
import { useAnaliz } from '../src/hooks/useAnaliz';

const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export default function Index() {
  const [authState, setAuthState] = useState<'loading' | 'login' | 'register' | 'authenticated'>('loading');
  // 'profile' tipi buraya eklendi
  const [view, setView] = useState<'dashboard' | 'setup' | 'pomodoro' | 'program' | 'analiz' | 'profile'>('dashboard');
  const [userName, setUserName] = useState('Öğrenci');
  const [schedule, setSchedule] = useState<any[]>([]); 

  const pomodoro = usePomodoro();
  const analiz = useAnaliz();

  // --- 1. Firebase Dinleyicisi ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        const savedName = await AsyncStorage.getItem('@SınavımAI_UserName');
        const finalName = user.displayName || savedName || user.email?.split('@')[0] || 'Öğrenci';
        
        setUserName(finalName);
        
        await AsyncStorage.setItem('@SınavımAI_UserId', user.uid);
        await AsyncStorage.setItem('@SınavımAI_UserName', finalName);
        await AsyncStorage.setItem('@SınavımAI_UserLoggedIn', 'true');
        
        await loadProgram(user.uid);
        setAuthState('authenticated');
      } else {
        setAuthState('login');
      }
    });

    return unsubscribe;
  }, []);

  // --- 2. Programı Backend'den Çekme ---
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

  const toggleTask = async (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].completed = !newSchedule[index].completed;
    setSchedule(newSchedule);

    try {
      const userId = await AsyncStorage.getItem('@SınavımAI_UserId');
      if (userId) {
        await fetch(`${API_URL}/save-program`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
          body: JSON.stringify({ user_id: userId, program: newSchedule })
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Emin misin?", [
      { text: "Evet", onPress: async () => {
          await auth.signOut(); 
          await AsyncStorage.multiRemove(['@SınavımAI_UserId', '@SınavımAI_UserName', '@SınavımAI_UserLoggedIn']);
          setAuthState('login');
          setSchedule([]);
          setView('dashboard');
      }}
    ]);
  };

  // --- RENDER ---
  if (authState === 'loading') return null;

  if (authState === 'login') {
    return <LoginScreen onLogin={() => {}} onGoToRegister={() => setAuthState('register')} />;
  }

  if (authState === 'register') {
    return <RegisterScreen onBack={() => setAuthState('login')} onRegisterSuccess={() => setAuthState('login')} />;
  }

  // --- GÖRÜNÜM YÖNETİMİ ---
  switch (view) {
    case 'setup': 
      return (
        <SetupScreen 
          onComplete={(newProg: any) => { 
            setSchedule(newProg);
            setView('dashboard'); 
          }} 
          onBack={() => setView('dashboard')} 
        />
      );
    case 'pomodoro': return <PomodoroView {...pomodoro} onBack={() => setView('dashboard')} />;
    case 'program': return <ProgramView tasks={schedule} toggleTask={toggleTask} onBack={() => setView('dashboard')} />;
    case 'analiz': return <AnalizView analizler={analiz.analizler} aiYorum={analiz.aiYorum} loadingYorum={analiz.loading} onAdd={analiz.addAnaliz} onSil={analiz.deleteAnaliz} onBack={() => setView('dashboard')} />;
    
    // YENİ: Profil Sayfası Case'i
    case 'profile': 
      return (
        <ProfileView 
          username={userName} 
          schedule={schedule}
          totalTime={pomodoro.formatTime(pomodoro.timer)} // Pomodoro'dan gelen zamanı profil ile paylaşıyoruz
          onBack={() => setView('dashboard')} 
        />
      );

    default: 
      const progress = schedule.length > 0 ? Math.round((schedule.filter((t: any) => t.completed).length / schedule.length) * 100) : 0;
      return (
        <DashboardView 
          username={userName} 
          progress={progress} 
          onLogout={handleLogout} 
          setView={setView} 
          schedule={schedule} 
          analiz={analiz} 
          pomodoro={pomodoro} 
        />
      );
  }
}