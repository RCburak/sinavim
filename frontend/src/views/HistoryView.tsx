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
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, API_HEADERS } from '../config/api';

const { width } = Dimensions.get('window');

export const HistoryView = ({ theme, onBack, userId, institution }: any) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'manual' | 'odev'>('manual');
  const [selectedWeek, setSelectedWeek] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/get-history/${userId}`, {
        headers: API_HEADERS as HeadersInit,
      });
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Geçmiş yükleme hatası:", e);
      Alert.alert("Hata", "Geçmiş verisi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Programı Sil",
      "Bu geçmiş kaydını kalıcı olarak silmek istediğine emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/delete-history/${id}`, {
                method: 'DELETE',
                headers: API_HEADERS as HeadersInit,
              });
              const data = await res.json();
              if (data.status === 'success') {
                setHistory(prev => prev.filter(item => item.id !== id));
              } else {
                Alert.alert("Hata", "Kayıt silinemedi.");
              }
            } catch (e) {
              Alert.alert("Hata", "Bağlantı hatası oluştu.");
            }
          }
        }
      ]
    );
  };

  const openDetails = (week: any) => {
    let parsedData = [];
    try {
      parsedData = typeof week.program_data === 'string'
        ? JSON.parse(week.program_data)
        : week.program_data;
    } catch (e) {
      parsedData = [];
    }
    setSelectedWeek({ ...week, program_data: parsedData });
    setModalVisible(true);
  };

  const getTotalQuestions = (progData: any) => {
    if (!progData) return 0;
    try {
      const data = typeof progData === 'string' ? JSON.parse(progData) : progData;
      return Array.isArray(data)
        ? data.reduce((total: number, item: any) => total + (parseInt(item.questions) || 0), 0)
        : 0;
    } catch (e) {
      return 0;
    }
  };

  const filteredHistory = history.filter(item =>
    activeTab === 'odev' ? item.program_type === 'teacher' : item.program_type !== 'teacher'
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <LinearGradient
        colors={isDark ? ['#1A1A2E', '#16213E'] : ['#6C3CE1', '#4A1DB5']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Başarı Geçmişim</Text>
      </LinearGradient>

      {/* SEKMELER - Pill Style */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('manual')}
          style={[styles.tabPill, activeTab === 'manual' && { backgroundColor: theme.primary }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: activeTab === 'manual' ? '#fff' : theme.textSecondary, fontWeight: activeTab === 'manual' ? '700' : '500' }]}>
            Kendi Planlarım
          </Text>
        </TouchableOpacity>

        {institution && (
          <TouchableOpacity
            onPress={() => setActiveTab('odev')}
            style={[styles.tabPill, activeTab === 'odev' && { backgroundColor: theme.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === 'odev' ? '#fff' : theme.textSecondary, fontWeight: activeTab === 'odev' ? '700' : '500' }]}>
              Ödevlerim
            </Text>
          </TouchableOpacity>
        )}
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
                style={[styles.historyCard, { backgroundColor: theme.surface }, theme.cardShadow]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                      {new Date(item.archive_date).toLocaleDateString('tr-TR')}
                    </Text>
                    <Text style={[styles.weekTitle, { color: theme.text }]}>
                      {item.program_type === 'teacher' ? 'Öğretmen Ödevi' : 'Kendi Planım'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.rateBadge, { backgroundColor: theme.primary + '15' }]}>
                      <Text style={[styles.rateText, { color: theme.primary }]}>%{item.completion_rate}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.qSummaryRow}>
                  <Ionicons name="pencil" size={13} color={theme.primary} />
                  <Text style={[styles.qSummaryText, { color: theme.textSecondary }]}>
                    Toplam <Text style={{ fontWeight: '700', color: theme.text }}>{weeklyTotalQ}</Text> soru çözüldü
                  </Text>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: theme.primary + '12' }]}>
                  <View style={[styles.progressFill, { width: `${Math.min(item.completion_rate, 100)}%`, backgroundColor: theme.primary }]} />
                </View>

                <View style={styles.cardFooter}>
                  <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                    Ders detayları ve soru dağılımı
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={56} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {activeTab === 'odev' ? 'Henüz ödev arşivin yok.' : 'Henüz kendi planlarından bir arşiv yok.'}
          </Text>
        </View>
      )}

      {/* MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Haftalık Rapor</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '500' }}>
                  {selectedWeek?.program_type === 'teacher' ? 'Öğretmen Ödevi' : 'Kendi Planım'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedWeek?.program_data?.map((task: any, index: number) => (
                <View key={index} style={[styles.taskItem, { borderBottomColor: theme.border + '40' }]}>
                  <View style={styles.taskLeft}>
                    <View style={[styles.statusDot, { backgroundColor: task.completed ? '#10B981' : '#F59E0B' }]} />
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskName, { color: theme.text }]}>
                        {task.task}
                      </Text>
                      <Text style={[styles.taskSub, { color: theme.textSecondary }]}>
                        {task.gun} • {task.duration}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.qBadge, { backgroundColor: theme.primary + '12' }]}>
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
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },

  tabBar: { flexDirection: 'row', padding: 8, marginHorizontal: 20, marginTop: 16, borderRadius: 16, gap: 6 },
  tabPill: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 12 },
  tabText: { fontSize: 13 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scrollContent: { padding: 20, paddingTop: 16 },
  historyCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  dateText: { fontSize: 11, fontWeight: '600' },
  weekTitle: { fontSize: 17, fontWeight: '800', marginTop: 2 },
  rateBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  rateText: { fontWeight: '800', fontSize: 13 },
  deleteBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  qSummaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  qSummaryText: { fontSize: 13, fontWeight: '500' },
  progressTrack: { height: 5, borderRadius: 3, marginBottom: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoText: { fontSize: 12, fontWeight: '500' },
  emptyText: { marginTop: 15, fontSize: 15, textAlign: 'center', fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, height: '75%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  modalScroll: { flex: 1 },
  taskItem: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 14 },
  taskInfo: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: '700' },
  taskSub: { fontSize: 12, marginTop: 3, fontWeight: '500' },
  qBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  qBadgeText: { fontSize: 12, fontWeight: '700' },
});
