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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/theme';

const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export const HistoryView = ({ theme, onBack, userId }: any) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Program Geçmişim</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : history.length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {history.map((item) => (
            <View key={item.id} style={[styles.historyCard, { backgroundColor: theme.surface }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                    {new Date(item.archive_date).toLocaleDateString('tr-TR')}
                  </Text>
                  <Text style={[styles.weekTitle, { color: theme.text }]}>Haftalık Özet</Text>
                </View>
                <View style={[styles.rateBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.rateText, { color: theme.primary }]}>%{item.completion_rate}</Text>
                </View>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: theme.overlay }]}>
                <View style={[styles.progressFill, { width: `${item.completion_rate}%`, backgroundColor: theme.primary }]} />
              </View>

              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Toplam {item.program_data?.length || 0} ders planlanmıştı.
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Henüz arşivlenmiş bir haftan yok.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// EXPO ROUTER İÇİN DEFAULT EXPORT ŞART
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scrollContent: { padding: 20 },
  historyCard: { 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  dateText: { fontSize: 12, fontWeight: '600' },
  weekTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  rateBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  rateText: { fontWeight: 'bold', fontSize: 14 },
  progressTrack: { height: 8, borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  infoText: { fontSize: 13, fontStyle: 'italic' },
  emptyText: { marginTop: 15, fontSize: 16, textAlign: 'center' }
});