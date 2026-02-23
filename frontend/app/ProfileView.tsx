import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, SafeAreaView, Switch, ActivityIndicator, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../src/hooks/useProfile';
import { ProfileModals } from '../src/components/profile/ProfileModals';
import { TeacherJoinModal } from '../src/components/profile/TeacherJoinModal';
import { auth } from '../src/services/firebaseConfig';
import { API_URL, API_HEADERS } from '../src/config/api';

const { width } = Dimensions.get('window');

export const ProfileView = ({ username, onBack, onLogout, theme, isDarkMode, toggleDarkMode }: any) => {
  const profile = useProfile(username);
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const fetchAnnouncements = async () => {
    if (!profile.stats.institution?.id) return;
    try {
      const resp = await fetch(`${API_URL}/announcements/${profile.stats.institution.id}`, {
        headers: API_HEADERS as HeadersInit,
      });
      const data = await resp.json();
      if (Array.isArray(data)) setAnnouncements(data);
    } catch (e) {
      console.error("Duyurular alinamadi:", e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [profile.stats.institution?.id]);

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <LinearGradient
        colors={isDark ? ['#1A1A2E', '#16213E'] : ['#6C3CE1', '#4A1DB5']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity onPress={() => onBack(profile.newName)} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profilim</Text>
          <TouchableOpacity onPress={profile.fetchUserStats} style={styles.iconBtn}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profil Kartı */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
          <TouchableOpacity onPress={profile.pickImage} style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            {profile.imageLoading ? (
              <ActivityIndicator color="#fff" />
            ) : profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>{profile.newName?.charAt(0).toUpperCase() || 'B'}</Text>
            )}
            <View style={[styles.editIconBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: theme.text }]}>{profile.newName || 'Öğrenci'}</Text>
          <Text style={[styles.userTitle, { color: theme.textSecondary }]}>{profile.stats.institution ? (profile.stats.institution.status === 'pending' ? `${profile.stats.institution.name} - Onay Bekleniyor` : `${profile.stats.institution.name} Üyesi`) : 'RC Sınavım Üyesi'}</Text>
        </View>

        {/* Eğitim Kurumum */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Eğitim Kurumum</Text>

          {profile.stats.institution ? (
            profile.stats.institution.status === 'pending' ? (
              /* Onay Bekleniyor */
              <View
                style={[styles.actionButton, { backgroundColor: theme.surface }, theme.cardShadow]}
              >
                <View style={styles.row}>
                  <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="time" size={20} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionText, { color: theme.text }]}>{profile.stats.institution.name}</Text>
                    <Text style={{ fontSize: 12, color: '#D97706', marginTop: 2, fontWeight: '500' }}>⏳ Onay Bekleniyor</Text>
                  </View>
                  <TouchableOpacity
                    onPress={profile.handleLeaveClass}
                    style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                  >
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>İptal Et</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Onaylanmış */
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.surface }, theme.cardShadow]}
                onPress={profile.handleLeaveClass}
                activeOpacity={0.8}
              >
                <View style={styles.row}>
                  <View style={[styles.actionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="school" size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={[styles.actionText, { color: theme.text }]}>{profile.stats.institution.name}</Text>
                    <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 2, fontWeight: '500' }}>Kurumdan Ayrıl</Text>
                  </View>
                </View>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.surface }, theme.cardShadow]}
              onPress={() => setTeacherModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.row}>
                <View style={[styles.actionIconCircle, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="school" size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.actionText, { color: theme.text }]}>Kuruma Bağlan</Text>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2, fontWeight: '500' }}>Kurum kodunu girerek sınıfına katıl</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Duyurular */}
        {profile.stats.institution && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Duyurular</Text>
              {announcements.length > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{announcements.length}</Text>
                </View>
              )}
            </View>
            {announcements.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.announcementList}>
                {announcements.map((item: any, index: number) => (
                  <View key={index} style={[styles.announcementCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                    <View style={styles.announcementHeader}>
                      <Text style={[styles.announcementTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                      <Ionicons name="megaphone" size={14} color={theme.primary} />
                    </View>
                    <Text style={[styles.announcementContent, { color: theme.textSecondary }]} numberOfLines={2}>{item.content}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.emptyAnnouncementCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.emptyAnnouncementText, { color: theme.textSecondary }]}>Henüz yeni bir duyuru bulunmuyor.</Text>
              </View>
            )}
          </View>
        )}

        {/* Uygulama Ayarları */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Uygulama Ayarları</Text>
          <View style={[styles.actionButton, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <View style={styles.row}>
              <View style={[styles.actionIconCircle, { backgroundColor: isDarkMode ? '#FCD34D20' : '#FFA50020' }]}>
                <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={isDarkMode ? "#FCD34D" : "#FFA500"} />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Gece Modu</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ false: "#E5E7EB", true: theme.primary + '50' }} thumbColor={isDarkMode ? theme.primary : "#f4f3f4"} />
          </View>
        </View>

        {/* İstatistikler */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Çalışma Performansım</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: theme.surface }, theme.cardShadow]}>
              <View style={[styles.statIconCircle, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="time" size={24} color={theme.primary} />
              </View>
              {profile.loading ? <ActivityIndicator size="small" color={theme.primary} style={styles.loader} /> : <Text style={[styles.statValue, { color: theme.text }]}>{profile.stats.total_hours}s</Text>}
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Süre</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface }, theme.cardShadow]}>
              <View style={[styles.statIconCircle, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
              </View>
              {profile.loading ? <ActivityIndicator size="small" color="#10B981" style={styles.loader} /> : <Text style={[styles.statValue, { color: theme.text }]}>{profile.stats.total_tasks}</Text>}
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Biten Görev</Text>
            </View>
          </View>
        </View>

        {/* Başarılarım */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Başarılarım</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.surface }, theme.cardShadow]}>
              <Text style={styles.emoji}>{profile.stats.total_tasks >= 10 ? "🏆" : "🔥"}</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                {profile.stats.total_tasks >= 10 ? "Usta" : "Yeni Başlayan"}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.surface }, theme.cardShadow]}>
              <Text style={styles.emoji}>🎯</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>Tam Odak</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.surface }, theme.cardShadow]}>
              <Text style={styles.emoji}>🛡️</Text>
              <Text style={[styles.badgeText, { color: theme.textSecondary }]}>RC Gamer</Text>
            </View>
          </View>
        </View>

        {/* Ayarlar ve Çıkış */}
        <View style={[styles.section, { marginTop: 10, marginBottom: 40 }]}>
          <TouchableOpacity style={[styles.bigSettingsBtn, { backgroundColor: theme.surface }, theme.cardShadow]} onPress={() => profile.toggleModal('settings', true)}>
            <View style={styles.row}>
              <View style={[styles.actionIconCircle, { backgroundColor: theme.primary + '10' }]}>
                <Ionicons name="settings-outline" size={20} color={theme.text} />
              </View>
              <Text style={[styles.bigSettingsText, { color: theme.text }]}>Ayarlar</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigSettingsBtn, { backgroundColor: theme.surface, marginTop: 12 }, theme.cardShadow]}
            onPress={() => profile.handleLogout(onLogout)}
            activeOpacity={0.7}
          >
            <View style={styles.row}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.bigSettingsText, { color: "#EF4444" }]}>Çıkış Yap</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ProfileModals theme={theme} hook={profile} />

      <TeacherJoinModal
        visible={teacherModalVisible}
        onClose={() => setTeacherModalVisible(false)}
        theme={theme}
        userEmail={auth.currentUser?.email || null}
        onSuccess={(institutionName: string) => {
          profile.fetchUserStats();
        }}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: Platform.OS === 'ios' ? 110 : 95,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 15
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },

  profileCard: { alignItems: 'center', marginHorizontal: 25, borderRadius: 24, padding: 28, marginTop: 20 },
  avatarCircle: { width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative', overflow: 'visible' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 28 },
  avatarLetter: { color: '#fff', fontSize: 34, fontWeight: '800' },
  editIconBadge: { position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: '800' },
  userTitle: { fontSize: 13, marginTop: 4, fontWeight: '500' },

  section: { paddingHorizontal: 25, marginTop: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, justifyContent: 'space-between' },
  actionIconCircle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionText: { fontSize: 15, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  statBox: { flex: 1, padding: 18, borderRadius: 20, alignItems: 'center' },
  statIconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '800', marginVertical: 4 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  loader: { marginVertical: 10 },

  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  badge: { alignItems: 'center', flex: 1, padding: 14, borderRadius: 18 },
  emoji: { fontSize: 28, marginBottom: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  bigSettingsBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, justifyContent: 'space-between' },
  bigSettingsText: { fontSize: 15, fontWeight: '700' },

  // --- ANNOUNCEMENT STYLES ---
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  notifBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  announcementList: {
    paddingRight: 20,
  },
  announcementCard: {
    width: width * 0.7,
    padding: 16,
    borderRadius: 20,
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  announcementContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyAnnouncementCard: {
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyAnnouncementText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ProfileView;