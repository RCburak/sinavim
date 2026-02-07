import React from 'react';
import { SafeAreaView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { PomodoroTimer } from './PomodoroTimer';
import { COLORS } from '../constants/theme';

export const PomodoroView = ({ timer, isActive, isBreak, toggleTimer, resetTimer, formatTime, onBack }: any) => (
  <SafeAreaView style={[styles.fullScreen, { backgroundColor: isBreak ? COLORS.success : COLORS.danger }]}>
    <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        
        <PomodoroTimer 
            timer={timer} 
            isActive={isActive} 
            isBreak={isBreak} 
            onToggle={toggleTimer} // usePomodoro hook'undan gelen isimle eşledik
            onReset={resetTimer} 
            formatTime={formatTime} 
        />
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 40, left: 20, zIndex: 10, padding: 10 },
  backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});