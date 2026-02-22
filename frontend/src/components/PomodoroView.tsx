import React from 'react';
import { SafeAreaView, TouchableOpacity, StyleSheet, View, StatusBar } from 'react-native';
import { PomodoroTimer } from './PomodoroTimer';
import { Ionicons } from '@expo/vector-icons';
import { PomodoroMode, PomodoroHook, Theme } from '../types';

// Renk paleti
const THEME_COLORS = {
  focus: '#BA4949',      // Kırmızı
  shortBreak: '#38858A', // Turkuaz/Yeşil
  longBreak: '#397097',  // Mavi
};

interface PomodoroViewProps extends PomodoroHook {
  onBack: () => void;
  theme: Theme;
}

export const PomodoroView = ({
  timer, isActive, mode, completedSessions,
  toggleTimer, resetTimer, changeMode, formatTime, onBack, theme
}: PomodoroViewProps) => {

  const currentTheme = THEME_COLORS[mode as PomodoroMode] || THEME_COLORS.focus;

  return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: currentTheme }]}>
      <StatusBar barStyle="light-content" backgroundColor={currentTheme} />

      <View style={styles.container}>
        {/* Geri Butonu: Sadece İkon */}
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <PomodoroTimer
          timer={timer}
          isActive={isActive}
          mode={mode}
          completedSessions={completedSessions}
          onToggle={toggleTimer}
          onReset={resetTimer}
          onChangeMode={changeMode}
          formatTime={formatTime}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Geri butonu stili güncellendi: Yuvarlak ve sadece ikon
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 45, // Kare/Yuvarlak olması için sabit genişlik/yükseklik
    height: 45,
    justifyContent: 'center', // İkonu ortala
    alignItems: 'center',     // İkonu ortala
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 22.5, // Tam yuvarlak
  },
  // backBtnText stili artık kullanılmadığı için kaldırıldı
});