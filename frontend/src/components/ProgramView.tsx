import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { DayFolder } from './DayFolder';
import { COLORS, GUNLER } from '../constants/theme';

// DİKKAT: "export const ProgramView" şeklinde başladığından emin ol
export const ProgramView = ({ tasks, toggleTask, onBack }: any) => (
  <SafeAreaView style={styles.fullScreen}>
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backBtnText}>← Geri</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Haftalık Programım</Text>
    </View>
    <ScrollView style={{ padding: 20 }}>
      {/* Orijinal index'leri koruyarak görevleri gönderiyoruz */}
      {GUNLER.map(gun => {
        const tasksWithIndex = tasks.map((t: any, idx: number) => ({ ...t, originalIndex: idx }));
        return (
          <DayFolder 
            key={gun} 
            day={gun} 
            tasks={tasksWithIndex} 
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