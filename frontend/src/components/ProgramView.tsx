import React, { useState } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  StatusBar,
  Dimensions,
  Platform 
} from 'react-native';
import { DayFolder } from './DayFolder';
import { COLORS, GUNLER } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const ProgramView = ({ tasks, toggleTask, onBack, theme = COLORS.light }: any) => {
  // Seçili gün state'i (Varsayılan olarak Pazartesi veya boş bırakıp "Hepsi" diyebiliriz)
  const [selectedDay, setSelectedDay] = useState(GUNLER[0]);

  // İstatistik Hesaplamaları
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const weeklyProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Motivasyon Mesajı
  const getMotivationalNote = () => {
    if (weeklyProgress === 0) return "Haydi, ilk adımı at!";
    if (weeklyProgress < 40) return "Isınma turları bitti, tempoyu artır!";
    if (weeklyProgress < 75) return "Harika gidiyorsun, hedefe az kaldı!";
    return "Efsane bir hafta! Gurur duy kendinle.";
  };

  return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
      
      {/* Premium Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>YKS Çalışma Masam</Text>
          <Text style={styles.headerSubTitle}>{getMotivationalNote()}</Text>
        </View>
      </View>

      {/* GÜN SEÇİCİ (Horizontal Tab) */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {GUNLER.map((gun) => (
            <TouchableOpacity 
              key={gun} 
              onPress={() => setSelectedDay(gun)}
              style={[
                styles.tabItem, 
                selectedDay === gun && { borderBottomColor: theme.primary, borderBottomWidth: 3 }
              ]}
            >
              <Text style={[
                styles.tabText, 
                { color: selectedDay === gun ? theme.primary : theme.textSecondary },
                selectedDay === gun && { fontWeight: 'bold' }
              ]}>
                {gun.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* İlerleme Kartı */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
          <View style={styles.statsInfo}>
            <View>
              <Text style={[styles.statsTitle, { color: theme.text }]}>Haftalık Yol Haritan</Text>
              <Text style={[styles.statsSub, { color: theme.textSecondary }]}>
                {completedTasks} / {totalTasks} Görev Tamamlandı
              </Text>
            </View>
            <View style={[styles.progressCircle, { borderColor: theme.primary }]}>
              <Text style={[styles.progressText, { color: theme.primary }]}>%{weeklyProgress}</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.overlay }]}>
            <View style={[styles.progressFill, { width: `${weeklyProgress}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>

        {/* Seçili Günün Klasörü */}
        <View style={styles.dayView}>
          <Text style={[styles.dayTitle, { color: theme.text }]}>{selectedDay} Programı</Text>
          {tasks
            .map((t: any, idx: number) => ({ ...t, originalIndex: idx }))
            .filter((t: any) => t.gun.toLowerCase() === selectedDay.toLowerCase())
            .length > 0 ? (
              tasks
                .map((t: any, idx: number) => ({ ...t, originalIndex: idx }))
                .filter((t: any) => t.gun.toLowerCase() === selectedDay.toLowerCase())
                .map((task: any) => (
                  <DayFolder 
                    key={task.originalIndex} 
                    day={selectedDay} 
                    tasks={[task]} // Tekli görev gönderiyoruz çünkü filtreledik
                    toggleTask={toggleTask}
                    theme={theme}
                  />
                ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cafe-outline" size={50} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Bugün için ders atanmamış. Biraz dinlenmeye ne dersin?</Text>
              </View>
            )
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  header: { 
    paddingHorizontal: 20, 
    paddingBottom: 25, 
    paddingTop: Platform.OS === 'ios' ? 10 : 40, 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
  
  // Tab Stilleri
  tabContainer: { height: 60, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  tabScroll: { paddingHorizontal: 15, alignItems: 'center' },
  tabItem: { paddingHorizontal: 20, height: '100%', justifyContent: 'center' },
  tabText: { fontSize: 15 },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  statsCard: { padding: 20, borderRadius: 25, marginBottom: 25, elevation: 4 },
  statsInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statsTitle: { fontSize: 17, fontWeight: 'bold' },
  statsSub: { fontSize: 12, marginTop: 4 },
  progressCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontWeight: 'bold', fontSize: 13 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  dayView: { marginTop: 10 },
  dayTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 15, fontSize: 14, lineHeight: 20 }
});

export default ProgramView;