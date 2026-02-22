import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';
import { PomodoroMode } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  timer: number;
  isActive: boolean;
  mode: PomodoroMode;
  completedSessions: number;
  onToggle: () => void;
  onReset: () => void;
  onChangeMode: (m: PomodoroMode) => void;
  formatTime: (s: number) => string;
}

const { width } = Dimensions.get('window');

export const PomodoroTimer = ({
  timer, isActive, mode, completedSessions,
  onToggle, onReset, onChangeMode, formatTime
}: Props) => {

  const getStatusText = () => {
    switch (mode) {
      case 'focus': return "ODAKLANMA";
      case 'shortBreak': return "KISA MOLA";
      case 'longBreak': return "UZUN MOLA";
    }
  };

  return (
    <View style={styles.center}>
      {/* Mod Seçici */}
      <View style={styles.modeSelector}>
        <TouchableOpacity onPress={() => onChangeMode('focus')} style={[styles.modeBtn, mode === 'focus' && styles.activeMode]}>
          <Text style={[styles.modeText, mode === 'focus' && styles.activeModeText]}>Odak</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChangeMode('shortBreak')} style={[styles.modeBtn, mode === 'shortBreak' && styles.activeMode]}>
          <Text style={[styles.modeText, mode === 'shortBreak' && styles.activeModeText]}>Kısa</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChangeMode('longBreak')} style={[styles.modeBtn, mode === 'longBreak' && styles.activeMode]}>
          <Text style={[styles.modeText, mode === 'longBreak' && styles.activeModeText]}>Uzun</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>{getStatusText()}</Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatTime(timer)}</Text>
      </View>

      {/* İstatistik */}
      <View style={styles.statsContainer}>
        <Ionicons name="trophy-outline" size={20} color="rgba(255,255,255,0.8)" />
        <Text style={styles.statsText}>Tamamlanan Döngü: {completedSessions}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: '#fff' }]}
          onPress={onToggle}
          activeOpacity={0.8}
        >
          {/* DÜZELTME: COLORS.primary yerine COLORS.light.primary kullanıldı */}
          <Text style={[styles.btnText, { color: COLORS.light.primary }]}>
            {isActive ? "Durdur" : "Başlat"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.resetBtn]}
          onPress={onReset}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 20, width: '100%' },

  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 25,
    padding: 5,
    marginBottom: 30,
    width: '100%',
    justifyContent: 'space-between'
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeMode: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  modeText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 14
  },
  activeModeText: {
    color: '#333',
    fontWeight: 'bold'
  },

  status: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 4, opacity: 0.9, marginBottom: 10 },

  timerContainer: {
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: { color: '#fff', fontSize: 90, fontWeight: '700', fontFamily: 'System', letterSpacing: -2 },

  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 40,
    gap: 8
  },
  statsText: { color: '#fff', fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  btn: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 24,
    minWidth: 160,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  btnText: { fontWeight: 'bold', fontSize: 18 },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    minWidth: 60,
    paddingHorizontal: 0,
    width: 60,
    height: 60,
    justifyContent: 'center'
  }
});