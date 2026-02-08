import React from 'react';
import { SafeAreaView, TouchableOpacity, Text, StyleSheet, View, StatusBar } from 'react-native';
import { PomodoroTimer } from './PomodoroTimer';
import { Ionicons } from '@expo/vector-icons';
import { PomodoroMode } from '../hooks/usePomodoro';

// Renk paleti
const THEME_COLORS = {
  focus: '#BA4949',      // Kırmızı
  shortBreak: '#38858A', // Turkuaz/Yeşil
  longBreak: '#397097',  // Mavi
};

export const PomodoroView = ({ 
  timer, isActive, mode, completedSessions, 
  toggleTimer, resetTimer, changeMode, formatTime, onBack 
}: any) => {
  
  const currentTheme = THEME_COLORS[mode as PomodoroMode] || THEME_COLORS.focus;

  return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: currentTheme }]}>
      <StatusBar barStyle="light-content" backgroundColor={currentTheme} />
      
      <View style={styles.container}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
            <Text style={styles.backBtnText}>Dashboard</Text>
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
  // DÜZELTME: 'transition' özelliği kaldırıldı
  fullScreen: { flex: 1 }, 
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    zIndex: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 4 }
});