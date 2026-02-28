import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, StatusBar, Platform,
  Modal, Dimensions, Alert
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

  useEffect(() => { if (userId) fetchHistory(); }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/get-history/${userId}`, { headers: API_HEADERS as HeadersInit });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert("Hata", "Geçmiş verisi yüklenemedi.");
    } finally { setLoading(false); }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Programı Sil", "Bu kaydı kalıcı olarak silmek istediğine emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil", style: "destructive", onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/delete-history/${id}`, { method: 'DELETE', headers: API_HEADERS as HeadersInit });
            const data = await res.json();
            if (data.status === 'success') setHistory(prev => prev.filter(item => item.id !== id));
            else Alert.alert("Hata", "Kayıt silinemedi.");
          } catch { Alert.alert("Hata", "Bağlantı hatası."); }
        }
      }
    ]);
  };

  const openDetails = (week: any) => {
    let parsedData = [];
    try { parsedData = typeof week.program_data === 'string' ? JSON.parse(week.program_data) : week.program_data; } catch { parsedData = []; }
    setSelectedWeek({ ...week, program_data: parsedData });
    setModalVisible(true);
  };

  const getTotalQuestions = (progData: any) => {
    try {
      const data = typeof progData === 'string' ? JSON.parse(progData) : progData;
      return Array.isArray(data) ? data.reduce((total: number, item: any) => total + (parseInt(item.questions) || 0), 0) : 0;
    } catch { return 0; }
  };

  const filteredHistory = history.filter(item =>
    activeTab === 'odev' ? item.program_type === 'teacher' : item.program_type !== 'teacher'
  );

  const getCompletionColor = (rate: number) => rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* ═══ HEADER ═══ */}
        <LinearGradient
          colors={isDark ? ['#1A1040', '#2D1B69', '#4C1D95'] : ['#7C3AED', '#6D28D9', '#5B21B6']}
          style={s.header}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={[s.decorCircle, { top: -30, right: -20, width: 100, height: 100 }]} />
          <View style={[s.decorCircle, { bottom: -15, left: -25, width: 80, height: 80 }]} />
          <View style={s.headerRow}>
            <TouchableOpacity onPress={onBack} style={s.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.headerTitle}>Başarı Geçmişim</Text>
              <Text style={s.headerSub}>{filteredHistory.length} kayıt</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ═══ TABS ═══ */}
        <View style={[s.tabBar, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('manual')}
            style={[s.tabPill, activeTab === 'manual' && { backgroundColor: theme.primary }]}
          >
            <Ionicons name="calendar" size={16} color={activeTab === 'manual' ? '#fff' : theme.textSecondary} />
            <Text style={[s.tabText, { color: activeTab === 'manual' ? '#fff' : theme.textSecondary, fontWeight: activeTab === 'manual' ? '700' : '500' }]}>
              Kendi Planlarım
            </Text>
          </TouchableOpacity>
          {institution && (
            <TouchableOpacity
              onPress={() => setActiveTab('odev')}
              style={[s.tabPill, activeTab === 'odev' && { backgroundColor: theme.primary }]}
            >
              <Ionicons name="school" size={16} color={activeTab === 'odev' ? '#fff' : theme.textSecondary} />
              <Text style={[s.tabText, { color: activeTab === 'odev' ? '#fff' : theme.textSecondary, fontWeight: activeTab === 'odev' ? '700' : '500' }]}>
                Ödevlerim
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ═══ CONTENT ═══ */}
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12, fontWeight: '500' }}>Yükleniyor...</Text>
          </View>
        ) : filteredHistory.length > 0 ? (
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {filteredHistory.map((item) => {
              const weeklyTotalQ = getTotalQuestions(item.program_data);
              const rate = Math.min(item.completion_rate || 0, 100);
              const completionColor = getCompletionColor(rate);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => openDetails(item)}
                  activeOpacity={0.75}
                  style={[s.card, { backgroundColor: theme.surface }, theme.cardShadow]}
                >
                  {/* Accent top */}
                  <LinearGradient
                    colors={[completionColor, completionColor + '80']}
                    style={s.cardAccent}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />

                  <View style={s.cardRow}>
                    {/* Icon */}
                    <LinearGradient
                      colors={[completionColor, completionColor + 'CC']}
                      style={s.cardIcon}
                    >
                      <Ionicons name={item.program_type === 'teacher' ? 'school' : 'calendar'} size={20} color="#fff" />
                    </LinearGradient>

                    <View style={{ flex: 1 }}>
                      <View style={s.cardTopRow}>
                        <Text style={[s.cardDate, { color: theme.textSecondary }]}>
                          {new Date(item.archive_date).toLocaleDateString('tr-TR')}
                        </Text>
                        <View style={[s.rateBadge, { backgroundColor: completionColor + '15' }]}>
                          <Text style={{ fontSize: 12, fontWeight: '900', color: completionColor }}>%{rate}</Text>
                        </View>
                      </View>
                      <Text style={[s.cardTitle, { color: theme.text }]}>
                        {item.program_type === 'teacher' ? 'Öğretmen Ödevi' : 'Kendi Planım'}
                      </Text>
                    </View>
                  </View>

                  {/* Stats row */}
                  <View style={s.statsRow}>
                    <View style={[s.statChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Ionicons name="create" size={13} color={theme.primary} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>{weeklyTotalQ}</Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary }}>Soru</Text>
                    </View>

                    <View style={[s.progressBar, { backgroundColor: completionColor + '15' }]}>
                      <View style={[s.progressFill, { width: `${rate}%`, backgroundColor: completionColor }]} />
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={s.cardFooter}>
                    <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '500' }}>Detayları gör</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.deleteBtn}>
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary + '60'} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={s.centerBox}>
            <View style={[s.emptyIcon, { backgroundColor: theme.surface }]}>
              <Ionicons name="book-outline" size={36} color={theme.textSecondary + '50'} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 16 }}>
              {activeTab === 'odev' ? 'Ödev arşivin boş' : 'Plan arşivin boş'}
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
              Haftalık planların burada arşivlenir
            </Text>
          </View>
        )}

        {/* ═══ DETAIL MODAL ═══ */}
        <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
              <View style={s.modalHandle} />
              <View style={s.modalHeader}>
                <View>
                  <Text style={[s.modalTitle, { color: theme.text }]}>Haftalık Rapor</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '500' }}>
                    {selectedWeek?.program_type === 'teacher' ? 'Öğretmen Ödevi' : 'Kendi Planım'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={[s.modalCloseBtn, { backgroundColor: theme.background }]}>
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedWeek?.program_data?.map((task: any, index: number) => (
                  <View key={index} style={[s.taskItem, { borderBottomColor: theme.border + '30' }]}>
                    <View style={s.taskLeft}>
                      <View style={[s.statusDot, { backgroundColor: task.completed ? '#10B981' : '#F59E0B' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.taskName, { color: theme.text }]}>{task.task}</Text>
                        <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 3, fontWeight: '500' }}>
                          {task.gun} • {task.duration}
                        </Text>
                      </View>
                    </View>
                    <View style={[s.qBadge, { backgroundColor: theme.primary + '12' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>{task.questions || 0} Soru</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default HistoryView;

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginTop: 2 },

  tabBar: { flexDirection: 'row', padding: 6, marginHorizontal: 20, marginTop: 16, borderRadius: 18, gap: 6 },
  tabPill: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 14 },
  tabText: { fontSize: 13 },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  card: { padding: 18, borderRadius: 22, marginBottom: 14, overflow: 'hidden' },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  cardIcon: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardDate: { fontSize: 11, fontWeight: '600' },
  rateBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FEE2E215', justifyContent: 'center', alignItems: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, height: '75%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  taskItem: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 14 },
  taskName: { fontSize: 15, fontWeight: '700' },
  qBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
});
