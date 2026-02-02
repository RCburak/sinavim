import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { DayFolder } from './DayFolder';
import { COLORS, GUNLER } from '../constants/theme';

// theme prop'u eklendi
export const ProgramView = ({ tasks, toggleTask, onBack, theme = COLORS.light }: any) => (
  <SafeAreaView style={[styles.fullScreen, { backgroundColor: theme.background }]}>
    {/* StatusBar rengini temaya göre ayarla */}
    <StatusBar barStyle="light-content" />
    
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backBtnText}>← Geri</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Haftalık Programım</Text>
    </View>

    <ScrollView style={{ padding: 20 }}>
      {GUNLER.map(gun => {
        // Sadece o güne ait görevleri filtrele ve orijinal index'i ekle
        const filteredTasks = tasks
          .map((t: any, idx: number) => ({ ...t, originalIndex: idx }))
          .filter((t: any) => t.gun.toLowerCase() === gun.toLowerCase());

        return (
          <DayFolder 
            key={gun} 
            day={gun} 
            tasks={filteredTasks} 
            toggleTask={toggleTask}
            theme={theme} // DayFolder içine de temayı gönderiyoruz
          />
        );
      })}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  header: { 
    padding: 25, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 20 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
});

export default ProgramView;