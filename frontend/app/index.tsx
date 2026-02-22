import React, { useState, useEffect, useRef } from "react";
import { View, StatusBar, StyleSheet, Alert, ActivityIndicator, AppState, Platform } from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../src/services/firebaseConfig";
import { API_URL, API_HEADERS } from "../src/config/api";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../src/contexts/ThemeContext";
import { useSchedule } from "../src/contexts/ScheduleContext";
import { usePomodoro } from "../src/hooks/usePomodoro";
import { useAnaliz } from "../src/hooks/useAnaliz";

import LoginScreen from "./login";
import RegisterScreen from "./register";
import { DashboardView } from "./dashboard";
import { ProfileView } from "./ProfileView";
import { ProgramView } from "../src/components/ProgramView";
import { PomodoroView } from "../src/components/PomodoroView";
import { AnalizView } from "../src/components/AnalizView";
import { HistoryView } from "./HistoryView";
import { SplashScreen } from "./SplashScreen";
import { QuestionPoolView } from "./QuestionPoolView";

type AuthScreen = "login" | "register";
type AppView =
  | "dashboard"
  | "manual_setup"
  | "pomodoro"
  | "program"
  | "analiz"
  | "profile"
  | "analiz"
  | "profile"
  | "history"
  | "question_pool";

export default function Index() {
  const router = useRouter();
  const { user, userName, setUserName, loading: authLoading, logout } = useAuth();
  const { theme, isDarkMode, toggleDarkMode } = useTheme();
  const {
    schedule,
    setSchedule,
    loadProgram,
    saveScheduleToCloud,
    toggleTask,
    updateQuestions,
  } = useSchedule();

  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [view, setView] = useState<AppView>("dashboard");
  const [isWebRedirecting, setIsWebRedirecting] = useState(Platform.OS === 'web');

  const pomodoro = usePomodoro();
  const analiz = useAnaliz();

  const [institution, setInstitution] = useState<any>(null);

  // Institution Status Check
  const checkInstitutionStatus = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/user-stats/${user.uid}`, {
        headers: API_HEADERS as HeadersInit,
      });
      const data = await response.json();
      setInstitution(data.institution);
    } catch (e) {
      console.error("Kurum bilgisi alınamadı:", e);
    }
  };

  useEffect(() => {
    if (user?.uid) checkInstitutionStatus();
  }, [user?.uid]);

  // Platform Check for Web -> Teacher Panel
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Small delay to ensure navigation is ready or just direct
      const timer = setTimeout(() => {
        router.replace('/staff/login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Kullanıcı giriş yaptığında programı yükle
  useEffect(() => {
    if (user?.uid && Platform.OS !== 'web') {
      loadProgram(user.uid);
    }
  }, [user?.uid, loadProgram]);

  // App ön plana gelince programı yeniden yükle
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        if (user?.uid) {
          loadProgram(user.uid);
          checkInstitutionStatus();
        }
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [user?.uid, loadProgram]);

  // Sayfa değiştiğinde de programı yeniden yükle (dashboard'a dönünce)
  useEffect(() => {
    if (view === 'dashboard' && user?.uid && Platform.OS !== 'web') {
      loadProgram(user.uid);
      checkInstitutionStatus();
    }
  }, [view]);

  const archiveProgram = async (programType: string) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/archive-program`, {
        method: "POST",
        headers: API_HEADERS as HeadersInit,
        body: JSON.stringify({ user_id: user.uid, type: programType }),
      });
    } catch (e) {
      console.error("Arşiv hatası:", e);
    }
  };

  const finalizeManualWeek = async () => {
    if (!user || schedule.length === 0) return;
    const isTeacherProgram = view === "program";
    const archiveType = isTeacherProgram ? "teacher" : "manual";
    Alert.alert(
      "Haftayı Bitir",
      isTeacherProgram
        ? "Ödev arşivlenecek ve ödevlerim geçmişine düşecek. Emin misin?"
        : "Bu haftanın programı arşivlenecek. Emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Bitir",
          style: "destructive",
          onPress: async () => {
            try {
              await saveScheduleToCloud(schedule);
              await archiveProgram(archiveType);
              setSchedule([]);
              Alert.alert("Başarılı", "Arşivlendi! Geçmişten inceleyebilirsin. 🚀");
              setView("dashboard");
            } catch (e) {
              Alert.alert("Hata", "İşlem sırasında bir sorun oluştu.");
            }
          },
        },
      ]
    );
  };

  // Auto-save when leaving manual_setup
  const handleBackFromSetup = async () => {
    if (schedule.length > 0) {
      await saveScheduleToCloud(schedule);
    }
    setView("dashboard");
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Emin misin?", [
      {
        text: "Evet",
        onPress: async () => {
          await logout();
          setSchedule([]);
          setView("dashboard");
        },
      },
    ]);
  };

  const handleUpdateQuestions = async (index: number, count: string) => {
    if (index === undefined || index === null) return;
    const qCount = parseInt(count, 10) || 0;
    const newSchedule = [...schedule];
    newSchedule[index].questions = qCount;
    setSchedule(newSchedule);
    if (view !== "manual_setup") await saveScheduleToCloud(newSchedule);
  };

  const handleToggleTask = async (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].completed = !newSchedule[index].completed;
    setSchedule(newSchedule);
    if (view !== "manual_setup") await saveScheduleToCloud(newSchedule);
  };

  // WEB REDIRECT LOADER
  if (isWebRedirecting) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Yükleniyor
  if (authLoading) {
    return <SplashScreen />;
  }

  // Giriş / Kayıt ekranları
  if (!user) {
    if (authScreen === "register") {
      return (
        <RegisterScreen
          theme={theme}
          onBack={() => setAuthScreen("login")}
          onRegisterSuccess={() => setAuthScreen("login")}
        />
      );
    }
    return (
      <LoginScreen
        theme={theme}
        onLogin={() => { }}
        onGoToRegister={() => setAuthScreen("register")}
      />
    );
  }



  // Ana uygulama - sayfa render
  const renderView = () => {
    switch (view) {
      case "manual_setup":
        return (
          <ProgramView
            tasks={schedule}
            isEditMode
            toggleTask={handleToggleTask}
            updateQuestions={handleUpdateQuestions}
            onAddTask={(t: any) => setSchedule((prev) => [...prev, t])}
            onDeleteTask={(index: number) => setSchedule((prev) => prev.filter((_, i) => i !== index))}
            onFinalize={finalizeManualWeek}
            theme={theme}
            onBack={handleBackFromSetup}
          />
        );
      case "pomodoro":
        return (
          <PomodoroView {...pomodoro} theme={theme} onBack={() => setView("dashboard")} />
        );
      case "program":
        return (
          <ProgramView
            tasks={schedule}
            toggleTask={handleToggleTask}
            updateQuestions={handleUpdateQuestions}
            theme={theme}
            onBack={() => setView("dashboard")}
            onFinalize={finalizeManualWeek}
          />
        );
      case "analiz":
        return (
          <AnalizView
            analizler={analiz.analizler}
            theme={theme}
            onAdd={analiz.addAnaliz}
            onSil={analiz.deleteAnaliz}
            onBack={() => setView("dashboard")}
          />
        );
      case "history":
        return (
          <HistoryView
            theme={theme}
            onBack={() => setView("dashboard")}
            userId={user.uid}
            institution={institution}
          />
        );
      case "question_pool":
        return (
          <QuestionPoolView theme={theme} onBack={() => setView("dashboard")} />
        );
      case "profile":
        return (
          <ProfileView
            username={userName}
            theme={theme}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            onBack={(n?: string) => {
              if (n) setUserName(n);
              setView("dashboard");
            }}
            onLogout={() => {
              setSchedule([]);
              setView("dashboard");
            }}
          />
        );
      default:
        return (
          <DashboardView
            username={userName}
            theme={theme}
            onLogout={handleLogout}
            setView={(v: any) => setView(v)}
            schedule={schedule}
            analiz={analiz}
            pomodoro={pomodoro}
            institution={institution}
            refreshInstitution={checkInstitutionStatus}
          />
        );
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
