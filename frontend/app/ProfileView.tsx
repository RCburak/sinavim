import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  StatusBar, 
  SafeAreaView, 
  Switch,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../src/services/firebaseConfig';

const { width } = Dimensions.get('window');
const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export const ProfileView = ({ username, onBack, theme, isDarkMode, toggleDarkMode }: any) => {
  const [stats, setStats] = useState({ total_hours: 0, total_tasks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user-stats/${user.uid}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await response.json();
      setStats(data);
    } catch (e) {
      console.error("İstatistik hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER: Yüksekliği ve paddingi sabitlendi */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profilim</Text>
          <TouchableOpacity onPress={fetchUserStats} style={styles.iconBtn}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* PROFiL KARTI: Negatif margin yerine padding ve hizalama düzenlendi */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarLetter}>{username?.charAt(0).toUpperCase() || 'B'}</Text>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{username || 'Öğrenci'}</Text>
          <Text style={[styles.userTitle, { color: theme.textSecondary }]}>RC Sınavım Üyesi</Text>
        </View>

        {/* AYARLAR BÖLÜMÜ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Uygulama Ayarları</Text>
          <View style={[styles.actionButton, { backgroundColor: theme.surface }]}>
            <View style={styles.row}>
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={22} 
                color={isDarkMode ? "#FFD700" : "#FFA500"} 
              />
              <Text style={[styles.actionText, { color: theme.text }]}>Gece Modu</Text>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : (isDarkMode ? "#f5dd4b" : "#f4f3f4")}
            />
          </View>
        </View>

        {/* İSTATİSTİKLER: statsGrid yapısı genişletildi */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Çalışma Performansım</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Ionicons name="time" size={28} color={theme.primary} />
              {loading ? (
                <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
              ) : (
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.total_hours}s</Text>
              )}
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Süre</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Ionicons name="checkmark-done-circle" size={28} color="#4CAF50" />
              {loading ? (
                <ActivityIndicator size="small" color="#4CAF50" style={styles.loader} />
              ) : (
                <Text style={[styles.statValue, { color: theme.text }]}>{stats.total_tasks}</Text>
              )}
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Biten Görev</Text>
            </View>
          </View>
        </View>

        {/* BAŞARILAR */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Başarılarım</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={styles.emoji}>{stats.total_tasks >= 10 ? "🏆" : "🔥"}</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                {stats.total_tasks >= 10 ? "Usta" : "Yeni Başlayan"}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={styles.emoji}>🎯</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>Tam Odak</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={styles.emoji}>🛡️</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>RC Gamer</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    height: Platform.OS === 'ios' ? 110 : 90, 
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    paddingBottom: 15
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  iconBtn: { padding: 5 },
  scrollContent: { paddingBottom: 40 },
  profileCard: { 
    alignItems: 'center', 
    marginHorizontal: 25, 
    borderRadius: 25, 
    padding: 25, 
    marginTop: 20, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 8 
  },
  avatarCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 4, 
    borderColor: '#fff', 
    marginBottom: 15 
  },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  userName: { fontSize: 24, fontWeight: 'bold' },
  userTitle: { fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: 25, marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 18, 
    justifyContent: 'space-between',
    elevation: 2 
  },
  actionText: { marginLeft: 15, fontSize: 16, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { 
    width: (width - 70) / 2, 
    padding: 20, 
    borderRadius: 22, 
    alignItems: 'center', 
    elevation: 3 
  },
  statValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { fontSize: 13, fontWeight: '600' },
  loader: { marginVertical: 10 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { 
    alignItems: 'center', 
    width: (width - 80) / 3, 
    padding: 15, 
    borderRadius: 20, 
    elevation: 2 
  },
  emoji: { fontSize: 30, marginBottom: 5 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }
});

export default ProfileView;