import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, SafeAreaView, Switch, ActivityIndicator, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../src/hooks/useProfile';
import { ProfileModals } from '../src/components/profile/ProfileModals';
import { TeacherJoinModal } from '../src/components/profile/TeacherJoinModal'; // YENİ IMPORT
import { auth } from '../src/services/firebaseConfig'; // Email almak için

const { width } = Dimensions.get('window');

export const ProfileView = ({ username, onBack, onLogout, theme, isDarkMode, toggleDarkMode }: any) => {
  const profile = useProfile(username);
  const [teacherModalVisible, setTeacherModalVisible] = useState(false); // YENİ STATE

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity onPress={() => onBack(profile.newName)} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profilim</Text>
          <TouchableOpacity onPress={profile.fetchUserStats} style={styles.iconBtn}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* PROFiL KARTI */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={profile.pickImage} style={[styles.avatarCircle, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
            {profile.imageLoading ? (
              <ActivityIndicator color="#fff" />
            ) : profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>{profile.newName?.charAt(0).toUpperCase() || 'B'}</Text>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: theme.text }]}>{profile.newName || 'Öğrenci'}</Text>
          <Text style={[styles.userTitle, { color: theme.textSecondary }]}>RC Sınavım Üyesi</Text>
        </View>

        {/* YENİ BÖLÜM: EĞİTİM KURUMUM */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Eğitim Kurumum</Text>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.surface }]}
            onPress={() => setTeacherModalVisible(true)}
          >
            <View style={styles.row}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                <Ionicons name="school" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.actionText, { color: theme.text, marginLeft: 0 }]}>Öğretmenine Bağlan</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>Kurum kodunu girerek sınıfına katıl</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* UYGULAMA AYARLARI */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Uygulama Ayarları</Text>
          <View style={[styles.actionButton, { backgroundColor: theme.surface }]}>
            <View style={styles.row}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={22} color={isDarkMode ? "#FFD700" : "#FFA500"} />
              <Text style={[styles.actionText, { color: theme.text }]}>Gece Modu</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={Platform.OS === 'ios' ? undefined : (isDarkMode ? "#f5dd4b" : "#f4f3f4")} />
          </View>
        </View>

        {/* İSTATİSTİKLER */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Çalışma Performansım</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Ionicons name="time" size={28} color={theme.primary} />
              {profile.loading ? <ActivityIndicator size="small" color={theme.primary} style={styles.loader} /> : <Text style={[styles.statValue, { color: theme.text }]}>{profile.stats.total_hours}s</Text>}
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Süre</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface }]}>
              <Ionicons name="checkmark-done-circle" size={28} color="#4CAF50" />
               {profile.loading ? <ActivityIndicator size="small" color="#4CAF50" style={styles.loader} /> : <Text style={[styles.statValue, { color: theme.text }]}>{profile.stats.total_tasks}</Text>}
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Biten Görev</Text>
            </View>
          </View>
        </View>

         {/* BAŞARILARIM */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Başarılarım</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.surface }]}>
              <Text style={styles.emoji}>{profile.stats.total_tasks >= 10 ? "🏆" : "🔥"}</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                {profile.stats.total_tasks >= 10 ? "Usta" : "Yeni Başlayan"}
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

        {/* AYARLAR VE ÇIKIŞ YAP */}
        <View style={[styles.section, { marginTop: 10, marginBottom: 40 }]}>
          <TouchableOpacity style={[styles.bigSettingsBtn, { backgroundColor: theme.surface }]} onPress={() => profile.toggleModal('settings', true)}>
            <View style={styles.row}>
              <Ionicons name="settings-outline" size={22} color={theme.text} />
              <Text style={[styles.bigSettingsText, { color: theme.text }]}>Ayarlar</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.bigSettingsBtn, { backgroundColor: theme.surface, marginTop: 15, borderColor: '#FF3B30', borderWidth: 1 }]} 
            onPress={() => profile.handleLogout(onLogout)}
          >
            <View style={styles.row}>
              <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
              <Text style={[styles.bigSettingsText, { color: "#FF3B30" }]}>Çıkış Yap</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODALLAR BİLEŞENİ */}
      <ProfileModals theme={theme} hook={profile} />

      {/* YENİ: ÖĞRETMEN BAĞLANMA MODALI */}
      <TeacherJoinModal 
        visible={teacherModalVisible} 
        onClose={() => setTeacherModalVisible(false)}
        theme={theme}
        userEmail={auth.currentUser?.email || null}
        onSuccess={(institutionName) => {
           // Burada gerekirse profili yenileyebilirsin
           profile.fetchUserStats(); 
        }}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: Platform.OS === 'ios' ? 110 : 90, justifyContent: 'flex-end', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 15 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  iconBtn: { padding: 5 },
  scrollContent: { paddingBottom: 40 },
  profileCard: { alignItems: 'center', marginHorizontal: 25, borderRadius: 25, padding: 25, marginTop: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 4, marginBottom: 15, position: 'relative', overflow: 'visible' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 45 },
  avatarLetter: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#333', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 24, fontWeight: 'bold' },
  userTitle: { fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: 25, marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, justifyContent: 'space-between', elevation: 2 },
  actionText: { marginLeft: 15, fontSize: 16, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { width: (width - 70) / 2, padding: 20, borderRadius: 22, alignItems: 'center', elevation: 3 },
  statValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  statLabel: { fontSize: 13, fontWeight: '600' },
  loader: { marginVertical: 10 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { alignItems: 'center', width: (width - 80) / 3, padding: 15, borderRadius: 20, elevation: 2 },
  emoji: { fontSize: 30, marginBottom: 5 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  bigSettingsBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, justifyContent: 'space-between', elevation: 2 },
  bigSettingsText: { marginLeft: 15, fontSize: 16, fontWeight: 'bold' },
});

export default ProfileView;