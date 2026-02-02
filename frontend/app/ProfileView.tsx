import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  StatusBar, 
  SafeAreaView, 
  Switch // Gece modu anahtarı için eklendi
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Proplara theme, isDarkMode ve toggleDarkMode entegre edildi
export const ProfileView = ({ username, onBack, schedule, totalTime, theme, isDarkMode, toggleDarkMode }: any) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Üst Header: Renk artık theme.primary üzerinden geliyor */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profilim</Text>
          <View style={{ width: 46 }} /> 
        </SafeAreaView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profil Kartı: Arka plan theme.surface oldu */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarLetter}>{username?.charAt(0).toUpperCase() || 'B'}</Text>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{username || 'Burak'}</Text>
          <Text style={[styles.userTitle, { color: theme.textSecondary }]}>RC Sınavım Kullanıcısı</Text>
        </View>

        {/* GECE MODU AYARI - Buradan kontrol edeceksin */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Uygulama Ayarları</Text>
          <View style={[styles.actionButton, { backgroundColor: theme.surface }]}>
            <Ionicons 
              name={isDarkMode ? "moon" : "sunny"} 
              size={22} 
              color={isDarkMode ? "#FFD700" : "#FFA500"} 
            />
            <Text style={[styles.actionText, { color: theme.text }]}>Gece Modu</Text>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode} // index.tsx'deki fonksiyonu tetikler
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="book" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{schedule?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Aktif Ders</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="timer" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{totalTime || '00:00'}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Odak</Text>
          </View>
        </View>

        {/* Başarılar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Başarılarım</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={{fontSize: 28}}>🔥</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>3 Gün Seri</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={{fontSize: 28}}>🎯</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>Tam Odak</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={{fontSize: 28}}>🎮</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>RC Gamer</Text>
            </View>
          </View>
        </View>

        {/* Alt Menü */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.surface }]}>
            <Ionicons name="help-circle-outline" size={22} color={theme.text} />
            <Text style={[styles.actionText, { color: theme.text }]}>Destek Al</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 140,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  backButton: { padding: 15 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 25,
    marginTop: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    marginTop: -65,
    marginBottom: 10,
  },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  userName: { fontSize: 24, fontWeight: 'bold' },
  userTitle: { fontSize: 14, marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginTop: 25
  },
  statBox: {
    width: (width - 70) / 2,
    padding: 20,
    borderRadius: 22,
    alignItems: 'center',
    elevation: 3,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', marginVertical: 6 },
  statLabel: { fontSize: 13 },
  section: { padding: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { alignItems: 'center', width: 90, padding: 10, borderRadius: 15, elevation: 2 },
  badgeText: { fontSize: 10, marginTop: 8 },
  actionSection: { paddingHorizontal: 25, marginBottom: 20 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    elevation: 2,
    justifyContent: 'space-between'
  },
  actionText: { flex: 1, marginLeft: 15, fontSize: 16 }
});

export default ProfileView;