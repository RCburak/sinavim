import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { DayFolder } from './DayFolder';
import { COLORS, GUNLER } from '../constants/theme';

export const ProgramView = ({ tasks, toggleTask, onBack }: any) => (
  <SafeAreaView style={styles.fullScreen}>
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backBtnText}>← Geri</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Haftalık Programım</Text>
    </View>
    <ScrollView style={{ padding: 20 }}>
      {GUNLER.map(gun => {
        // KRİTİK DÜZELTME: Sadece o güne ait görevleri filtrele ve orijinal index'i ekle
        const filteredTasks = tasks
          .map((t: any, idx: number) => ({ ...t, originalIndex: idx }))
          .filter((t: any) => t.gun.toLowerCase() === gun.toLowerCase());

        return (
          <DayFolder 
            key={gun} 
            day={gun} 
            tasks={filteredTasks} 
            toggleTask={toggleTask} 
          />
        );
      })}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 25, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingTop: 50 },
  headerTitle: { color: COLORS.surface, fontSize: 20, fontWeight: 'bold', marginLeft: 20 },
  backBtnText: { color: COLORS.surface, fontWeight: 'bold' },
});

export default ProgramView;