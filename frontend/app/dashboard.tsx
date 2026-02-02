import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { COLORS } from '../src/constants/theme';
import { DashboardHeader } from '../src/components/Dashboard/Header';
import { MenuCard } from '../src/components/Dashboard/MenuCard';

// Bileşeni tanımlıyoruz
export const DashboardView = ({ username, progress, onLogout, setView, schedule, analiz, pomodoro }: any) => (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" />
    <DashboardHeader username={username} progress={progress} onLogout={onLogout} />
    <ScrollView contentContainerStyle={styles.menuGrid}>
      <MenuCard 
        title="Programım" 
        emoji="📅" 
        subText={`${schedule?.length || 0} Ders Planlandı`} 
        onPress={() => setView('program')} 
      />
      <MenuCard 
        title="Pomodoro" 
        emoji="⏱️" 
        subText={pomodoro.formatTime(pomodoro.timer)} 
        onPress={() => setView('pomodoro')} 
      />
      <MenuCard 
        title="Analizler" 
        emoji="📈" 
        subText="Net takibi yap" 
        color={COLORS.warning}
        onPress={() => {
          setView('analiz');
          analiz.refreshAnaliz();
        }} 
      />
      <MenuCard 
        title="Ayarlar" 
        emoji="⚙️" 
        subText="Programı güncelle" 
        onPress={() => setView('setup')} 
      />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 20, 
    justifyContent: 'space-between',
    paddingTop: 30 
  },
});

// KRİTİK: Expo Router için default export şart!
export default DashboardView;