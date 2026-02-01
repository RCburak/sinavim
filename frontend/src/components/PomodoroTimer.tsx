import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  timer: number;
  isActive: boolean;
  isBreak: boolean;
  onToggle: () => void;
  onReset: () => void;
  formatTime: (s: number) => string;
}

export const PomodoroTimer = ({ timer, isActive, isBreak, onToggle, onReset, formatTime }: Props) => (
  <View style={styles.center}>
    <Text style={styles.status}>{isBreak ? "MOLA ZAMANI" : "ODAKLANMA VAKTİ"}</Text>
    <Text style={styles.timer}>{formatTime(timer)}</Text>
    <View style={styles.actions}>
      <TouchableOpacity style={styles.btn} onPress={onToggle}>
        <Text style={styles.btnText}>{isActive ? "Durdur" : "Başlat"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.resetBtn]} onPress={onReset}>
        <Text style={styles.btnText}>Sıfırla</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  status: { color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 2 },
  timer: { color: '#fff', fontSize: 100, fontWeight: 'bold', marginVertical: 30 },
  actions: { flexDirection: 'row', gap: 20 },
  btn: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 50 },
  btnText: { color: '#333', fontWeight: 'bold', fontSize: 18 },
  resetBtn: { backgroundColor: 'rgba(255,255,255,0.2)' }
});