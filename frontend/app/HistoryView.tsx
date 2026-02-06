import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  StatusBar,
  Platform,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/theme';

const { width } = Dimensions.get('window');
const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export const HistoryView = ({ theme, onBack, userId }: any) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // YENİ: Sekme kontrolü için state
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [selectedWeek, setSelectedWeek] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/get-history/${userId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Geçmiş yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (week: any) => {
    setSelectedWeek(week);
    setModalVisible(true);
  };

  const getTotalQuestions = (progData: any[]) => {
    return progData?.reduce((total, item) => total + (parseInt(item.questions) || 0), 0) || 0;
  };

  // YENİ: Aktif sekmeye göre listeyi filtreleme
  const filteredHistory = history.filter(item => 
    activeTab === 'ai' ? item.program_type === 'ai' : item.program_type === 'manual'
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Başarı Geçmişim</Text>
      </View>

      {/* --- YENİ SEKMELER --- */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
        <TouchableOpacity 
          onPress={() => setActiveTab('ai')}
          style={[styles.tabItem, activeTab === 'ai' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'ai' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'ai' ? 'bold' : 'normal' }]}>
            AI Programlarım
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('manual')}
          style={[styles.tabItem, activeTab === 'manual' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'manual' ? theme.primary : theme.textSecondary, fontWeight: activeTab === 'manual' ? 'bold' : 'normal' }]}>
            Kendi Planlarım
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredHistory.length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filteredHistory.map((item) => {
            const weeklyTotalQ = getTotalQuestions(item.program_data);
            return (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => openDetails(item)} 
                activeOpacity={0.7}
                style={[styles.historyCard, { backgroundColor: theme.surface }]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                      {new Date(item.archive_date).toLocaleDateString('tr-TR')}
                    </Text>
                    <Text style={[styles.weekTitle, { color: theme.text }]}>
                      {item.program_type === 'ai' ? 'AI Haftalık Analiz' : 'Manuel Haftalık Analiz'}
                    </Text>
                  </View>
                  <View style={[styles.rateBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.rateText, { color: theme.primary }]}>%{item.completion_rate}</Text>
                  </View>
                </View>

                <View style={styles.qSummaryRow}>
                  <Ionicons name="pencil" size={14} color={theme.primary} />
                  <Text style={[styles.qSummaryText, { color: theme.textSecondary }]}>
                    Toplam <Text style={{fontWeight:'bold', color: theme.text}}>{weeklyTotalQ}</Text> soru çözüldü
                  </Text>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: theme.overlay }]}>
                  <View style={[styles.progressFill, { width: `${item.completion_rate}%`, backgroundColor: theme.primary }]} />
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                    Ders detayları ve soru dağılımı
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {activeTab === 'ai' ? 'Henüz AI programı arşivin yok.' : 'Henüz kendi planlarından bir arşiv yok.'}
          </Text>
        </View>
      )}

      {/* --- HAFTALIK DETAY MODALI --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Haftalık Rapor</Text>
                <Text style={{color: theme.textSecondary, fontSize: 12}}>
                  {selectedWeek?.program_type === 'ai' ? 'Robotik Koç Programı' : 'Bireysel Tasarım Planı'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedWeek?.program_data?.map((task: any, index: number) => (
                <View key={index} style={[styles.taskItem, { borderBottomColor: theme.overlay }]}>
                  <View style={styles.taskLeft}>
                    <View style={[styles.statusDot, { backgroundColor: task.completed ? '#4CAF50' : '#FF9800' }]} />
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskName, { color: theme.text }]}>
                        {task.task}
                      </Text>
                      <Text style={[styles.taskSub, { color: theme.textSecondary }]}>
                        {task.gun} • {task.duration}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.qBadge, { backgroundColor: theme.overlay }]}>
                    <Text style={[styles.qBadgeText, { color: theme.primary }]}>
                      {task.questions || 0} Soru
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HistoryView;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  backBtn: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  // YENİ: Sekme stilleri
  tabBar: { flexDirection: 'row', height: 50, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 14 },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scrollContent: { padding: 20 },
  historyCard: { 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 16, 
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  dateText: { fontSize: 11, fontWeight: 'bold', opacity: 0.6 },
  weekTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  rateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rateText: { fontWeight: 'bold', fontSize: 13 },
  qSummaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  qSummaryText: { fontSize: 13, marginLeft: 6 },
  progressTrack: { height: 6, borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoText: { fontSize: 12, fontStyle: 'italic' },
  emptyText: { marginTop: 15, fontSize: 16, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  modalScroll: { flex: 1 },
  taskItem: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: 'bold' },
  taskSub: { fontSize: 12, marginTop: 3 },
  qBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  qBadgeText: { fontSize: 12, fontWeight: 'bold' }
});