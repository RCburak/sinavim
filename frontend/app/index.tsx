import React, { useState, useEffect } from "react";
import { View, StatusBar, StyleSheet, Alert, ActivityIndicator } from "react-native";
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

type AuthScreen = "login" | "register";
type AppView =
  | "dashboard"
  | "manual_setup"
  | "pomodoro"
  | "program"
  | "analiz"
  | "profile"
  | "history";

export default function Index() {
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

  const pomodoro = usePomodoro();
  const analiz = useAnaliz();

  // Kullanıcı giriş yaptığında programı yükle
  useEffect(() => {
    if (user?.uid) {
      loadProgram(user.uid);
    }
  }, [user?.uid, loadProgram]);

  const archiveProgram = async () => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/archive-program`, {
        method: "POST",
        headers: API_HEADERS as HeadersInit,
        body: JSON.stringify({ user_id: user.uid, type: "manual" }),
      });
    } catch (e) {
      console.error("Arşiv hatası:", e);
    }
  };

  const finalizeManualWeek = async () => {
    if (!user || schedule.length === 0) return;
    try {
      await saveScheduleToCloud(schedule);
      await archiveProgram();
      setSchedule([]);
      Alert.alert("Başarılı", "Plan arşivlendi! 🚀");
      setView("dashboard");
    } catch (e) {
      Alert.alert("Hata", "İşlem sırasında bir sorun oluştu.");
    }
  };

  const archiveOldAndSetup = async () => {
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
              await archiveProgram();
              setSchedule([]);
              setView("manual_setup");
            },
          },
        ]
      );
    } else {
      setView("manual_setup");
    }
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

  // Yükleniyor
  if (authLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
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
        onLogin={() => {}}
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
            onFinalize={finalizeManualWeek}
            theme={theme}
            onBack={() => setView("dashboard")}
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
          />
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
            setView={(v: any) =>
              v === "manual_setup" ? archiveOldAndSetup() : setView(v)
            }
            schedule={schedule}
            analiz={analiz}
            pomodoro={pomodoro}
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
