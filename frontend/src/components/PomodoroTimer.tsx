import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

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
    <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatTime(timer)}</Text>
    </View>
    <View style={styles.actions}>
      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: '#fff' }]} 
        onPress={onToggle}
      >
        <Text style={[styles.btnText, { color: isBreak ? COLORS.success : COLORS.danger }]}>
            {isActive ? "Durdur" : "Başlat"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.btn, styles.resetBtn]} 
        onPress={onReset}
      >
        <Text style={[styles.btnText, { color: '#fff' }]}>Sıfırla</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  status: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 3, opacity: 0.9 },
  timerContainer: {
    marginVertical: 40,
    padding: 20,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  timer: { color: '#fff', fontSize: 85, fontWeight: '300', fontFamily: 'System' },
  actions: { flexDirection: 'row', gap: 15 },
  btn: { 
    paddingVertical: 18, 
    paddingHorizontal: 35, 
    borderRadius: 20, 
    minWidth: 140, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnText: { fontWeight: 'bold', fontSize: 16 },
  resetBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }
});