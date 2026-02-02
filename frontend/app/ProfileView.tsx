import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/theme';

const { width } = Dimensions.get('window');

export const ProfileView = ({ username, onBack, schedule, totalTime }: any) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Üst Header: Sabit duracak kısım */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profilim</Text>
          <View style={{ width: 46 }} /> 
        </SafeAreaView>
      </View>

      {/* Kaydırılabilir İçerik */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent} // Padding buraya eklendi
      >
        {/* Profil Kartı */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{username?.charAt(0).toUpperCase() || 'B'}</Text>
          </View>
          <Text style={styles.userName}>{username || 'Burak'}</Text>
          <Text style={styles.userTitle}>RC Sınavım Kullanıcısı</Text>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="book" size={24} color="#5D12D2" />
            <Text style={styles.statValue}>{schedule?.length || 0}</Text>
            <Text style={styles.statLabel}>Aktif Ders</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="timer" size={24} color="#5D12D2" />
            <Text style={styles.statValue}>{totalTime || '00:00'}</Text>
            <Text style={styles.statLabel}>Toplam Odak</Text>
          </View>
        </View>

        {/* Başarılar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Başarılarım</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={{fontSize: 28}}>🔥</Text>
              <Text style={styles.badgeText}>3 Gün Seri</Text>
            </View>
            <View style={styles.badge}>
              <Text style={{fontSize: 28}}>🎯</Text>
              <Text style={styles.badgeText}>Tam Odak</Text>
            </View>
            <View style={styles.badge}>
              <Text style={{fontSize: 28}}>🎮</Text>
              <Text style={styles.badgeText}>RC Gamer</Text>
            </View>
          </View>
        </View>

        {/* Alt Menü */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={20} color="#333" />
            <Text style={styles.actionText}>Hesap Ayarları</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: {
    backgroundColor: '#5D12D2',
    height: 140, // Header yüksekliği sabitlendi
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
    paddingTop: 20, // Sayfa açıldığında içeriği aşağıda başlatır
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 25,
    marginTop: 30, // Header'ın altına temiz bir şekilde yerleşmesi için
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
    backgroundColor: '#5D12D2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    marginTop: -65, // Kartın üzerine yarım biner
    marginBottom: 10,
  },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  userTitle: { color: '#888', fontSize: 14, marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginTop: 25
  },
  statBox: {
    backgroundColor: '#fff',
    width: (width - 70) / 2,
    padding: 20,
    borderRadius: 22,
    alignItems: 'center',
    elevation: 3,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginVertical: 6 },
  statLabel: { fontSize: 13, color: '#888' },
  section: { padding: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { alignItems: 'center', width: 90, backgroundColor: '#fff', padding: 10, borderRadius: 15, elevation: 2 },
  badgeText: { fontSize: 10, color: '#666', marginTop: 8 },
  actionSection: { paddingHorizontal: 25 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 18,
    elevation: 2
  },
  actionText: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333' }
});

export default ProfileView;