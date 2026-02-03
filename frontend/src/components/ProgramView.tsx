import React from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  StatusBar,
  Dimensions,
  Platform // Hatayı çözen import eklendi
} from 'react-native';
import { DayFolder } from './DayFolder';
import { COLORS, GUNLER } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const ProgramView = ({ tasks, toggleTask, onBack, theme = COLORS.light }: any) => {
  // Haftalık Genel İlerleme Hesaplama
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const weeklyProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      {/* StatusBar rengi temaya göre değişir */}
      <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
      
      {/* Premium Header Tasarımı */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Haftalık Programım</Text>
          <Text style={styles.headerSubTitle}>Planına sadık kal, başarıya odaklan!</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Haftalık İstatistik Kartı */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
          <View style={styles.statsInfo}>
            <View>
              <Text style={[styles.statsTitle, { color: theme.text }]}>Haftalık İlerleme</Text>
              <Text style={[styles.statsSub, { color: theme.textSecondary }]}>
                {completedTasks} / {totalTasks} Ders Tamamlandı
              </Text>
            </View>
            <View style={[styles.progressCircle, { borderColor: theme.primary }]}>
              <Text style={[styles.progressText, { color: theme.primary }]}>%{weeklyProgress}</Text>
            </View>
          </View>
          {/* İlerleme Çubuğu */}
          <View style={[styles.progressTrack, { backgroundColor: theme.overlay }]}>
            <View style={[styles.progressFill, { width: `${weeklyProgress}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>

        {/* Günlük Klasörler */}
        {GUNLER.map(gun => {
          // Filtreleme yaparken orijinal dizideki index'i koruyoruz
          const filteredTasks = tasks
            .map((t: any, idx: number) => ({ ...t, originalIndex: idx }))
            .filter((t: any) => t.gun.toLowerCase() === gun.toLowerCase());

          return (
            <DayFolder 
              key={gun} 
              day={gun} 
              tasks={filteredTasks} 
              toggleTask={toggleTask}
              theme={theme}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  header: { 
    paddingHorizontal: 20, 
    paddingBottom: 30, 
    paddingTop: Platform.OS === 'ios' ? 10 : 40, // Platform eklendiği için artık çalışır
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSubTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  statsCard: {
    padding: 20,
    borderRadius: 25,
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  statsInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20
  },
  statsTitle: { fontSize: 18, fontWeight: 'bold' },
  statsSub: { fontSize: 13, marginTop: 4 },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressText: { fontWeight: 'bold', fontSize: 14 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 }
});

export default ProgramView;