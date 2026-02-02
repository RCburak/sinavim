import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Ekranlar & Görünümler ---
import LoginScreen from './login'; 
import RegisterScreen from './register'; 
import SetupScreen from './setup';
import { DashboardView } from './dashboard'; 
import { ProgramView } from '../src/components/ProgramView';
import { PomodoroView } from '../src/components/PomodoroView';
import { AnalizView } from '../src/components/AnalizView';

// --- Mantık Katmanı (Hooks) ---
import { usePomodoro } from '../src/hooks/usePomodoro';
import { useAnaliz } from '../src/hooks/useAnaliz';

export default function Index() {
  const [authState, setAuthState] = useState<'loading' | 'login' | 'register' | 'authenticated'>('loading');
  const [view, setView] = useState<'dashboard' | 'setup' | 'pomodoro' | 'program' | 'analiz'>('dashboard');
  const [userName, setUserName] = useState('Öğrenci'); // İsim state'i eklendi
  const [schedule, setSchedule] = useState<any[] | null>(null);

  const pomodoro = usePomodoro();
  const analiz = useAnaliz();

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      const userStatus = await AsyncStorage.getItem('@SınavımAI_UserLoggedIn');
      const savedName = await AsyncStorage.getItem('@SınavımAI_UserName'); // İsim çekiliyor
      const savedProg = await AsyncStorage.getItem('@SınavımAI_Program');
      
      if (savedName) setUserName(savedName);
      if (savedProg) setSchedule(JSON.parse(savedProg));
      
      setAuthState(userStatus === 'true' ? 'authenticated' : 'login');
    } catch (e) { 
      setAuthState('login'); 
    }
  };

  const handleLoginSuccess = async () => {
    // Giriş sonrası ismi tekrar hafızadan oku
    const savedName = await AsyncStorage.getItem('@SınavımAI_UserName');
    if (savedName) setUserName(savedName);
    setAuthState('authenticated');
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Evet", onPress: async () => {
          await AsyncStorage.multiRemove(['@SınavımAI_UserLoggedIn', '@SınavımAI_UserId', '@SınavımAI_UserName']);
          setAuthState('login');
          setView('dashboard');
          setUserName('Öğrenci');
      }}
    ]);
  };

  // --- NAVİGASYON ---
  if (authState === 'loading') return null;
  
  if (authState === 'login') return <LoginScreen onLogin={handleLoginSuccess} onGoToRegister={() => setAuthState('register')} />;
  
  if (authState === 'register') return <RegisterScreen onBack={() => setAuthState('login')} onRegisterSuccess={() => setAuthState('login')} />;

  switch (view) {
    case 'setup': 
      return <SetupScreen onComplete={(data: any) => { setSchedule(data); setView('dashboard'); }} onBack={() => setView('dashboard')} />;
    case 'pomodoro': 
      return <PomodoroView {...pomodoro} onBack={() => setView('dashboard')} />;
    case 'program': 
      return <ProgramView tasks={schedule || []} toggleTask={() => {}} onBack={() => setView('dashboard')} />;
    case 'analiz': 
      return <AnalizView analizler={analiz.analizler} aiYorum={analiz.aiYorum} loadingYorum={analiz.loading} onAdd={analiz.addAnaliz} onSil={analiz.deleteAnaliz} onBack={() => setView('dashboard')} />;
    default: 
      const progress = schedule && schedule.length > 0 ? Math.round((schedule.filter((t: any) => t.completed).length / schedule.length) * 100) : 0;
      return (
        <DashboardView 
          username={userName} // Dinamik isim gönderiliyor
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