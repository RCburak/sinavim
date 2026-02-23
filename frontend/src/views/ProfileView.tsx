import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions,
  StatusBar, Switch, ActivityIndicator, Image, Platform, Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../hooks/useProfile';
import { ProfileModals } from '../components/profile/ProfileModals';
import { TeacherJoinModal } from '../components/profile/TeacherJoinModal';
import { auth } from '../services/firebaseConfig';
import { Theme, AppView } from '../types';

const { width } = Dimensions.get('window');
const EXAM_KEY = '@RCSinavim_TargetExam';
const GOAL_KEY = '@RCSinavim_WeeklyGoal';

// ─── EXAM OPTIONS ──────────────────────────────────
const EXAM_OPTIONS = [
  { id: 'yks', label: 'YKS', emoji: '🎓', color: '#7C3AED' },
  { id: 'lgs', label: 'LGS', emoji: '📚', color: '#3B82F6' },
  { id: 'kpss', label: 'KPSS', emoji: '🏛️', color: '#10B981' },
  { id: 'ales', label: 'ALES', emoji: '📊', color: '#F59E0B' },
  { id: 'dgs', label: 'DGS', emoji: '🔄', color: '#EC4899' },
  { id: 'tyt', label: 'TYT', emoji: '📝', color: '#6366F1' },
  { id: 'ayt', label: 'AYT', emoji: '🔬', color: '#EF4444' },
  { id: 'other', label: 'Diğer', emoji: '📋', color: '#64748B' },
];

const WEEKLY_GOALS = [5, 10, 15, 20, 25, 30, 40, 50];

// ─── SECTION ITEM ──────────────────────────────────
const SectionItem = ({ icon, iconColor, iconBg, label, sublabel, theme, onPress, right, noBorder }: any) => (
  <TouchableOpacity
    style={[s.sectionItem, !noBorder && { borderBottomWidth: 1, borderBottomColor: theme.border + '20' }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    <View style={[s.sectionIconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[s.sectionItemLabel, { color: theme.text }]}>{label}</Text>
      {sublabel && <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>{sublabel}</Text>}
    </View>
    {right || (onPress && <Ionicons name="chevron-forward" size={16} color={theme.textSecondary + '60'} />)}
  </TouchableOpacity>
);

// ─── BOTTOM TAB BAR ────────────────────────────────
const BottomTabBar = ({ setView, theme }: { setView: (view: AppView) => void; theme: Theme }) => {
  const tabs = [
    { key: 'dashboard', label: 'Anasayfa', icon: 'home', iconOutline: 'home-outline' },
    { key: 'announcements', label: 'Duyurular', icon: 'notifications', iconOutline: 'notifications-outline' },
    { key: 'friends', label: 'Arkadaşlar', icon: 'people', iconOutline: 'people-outline' },
    { key: 'gamification', label: 'Başarılarım', icon: 'trophy', iconOutline: 'trophy-outline' },
    { key: 'profile', label: 'Profilim', icon: 'person', iconOutline: 'person-outline' },
  ];

  return (
    <View style={[s.bottomBar, { backgroundColor: theme.surface }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === 'profile';
        return (
          <TouchableOpacity
            key={tab.key}
            style={s.tabItem}
            onPress={() => setView(tab.key as AppView)}
            activeOpacity={0.8}
          >
            <View style={[s.activeIndicator, isActive && { backgroundColor: theme.primary }]} />
            <Ionicons
              name={(isActive ? tab.icon : tab.iconOutline) as any}
              size={22}
              color={isActive ? theme.primary : theme.textSecondary}
            />
            <Text style={[s.tabText, { color: isActive ? theme.primary : theme.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ═══ MAIN COMPONENT ════════════════════════════════
export const ProfileView = ({ username, onBack, onLogout, theme, isDarkMode, toggleDarkMode, setView }: any) => {
  const profile = useProfile(username);
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);
  const [targetExam, setTargetExam] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState(15);
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
  const userEmail = auth.currentUser?.email || '';

  // Load saved preferences
  useEffect(() => {
    const load = async () => {
      const [exam, goal] = await Promise.all([
        AsyncStorage.getItem(EXAM_KEY),
        AsyncStorage.getItem(GOAL_KEY),
      ]);
      if (exam) setTargetExam(exam);
      if (goal) setWeeklyGoal(parseInt(goal, 10));
    };
    load();
  }, []);

  const saveExam = async (id: string) => {
    setTargetExam(id);
    setShowExamPicker(false);
    await AsyncStorage.setItem(EXAM_KEY, id);
  };

  const saveGoal = async (hours: number) => {
    setWeeklyGoal(hours);
    setShowGoalPicker(false);
    await AsyncStorage.setItem(GOAL_KEY, hours.toString());
  };

  const selectedExam = EXAM_OPTIONS.find(e => e.id === targetExam);
  const memberSince = auth.currentUser?.metadata?.creationTime
    ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
    : '';

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ═══ PREMIUM HERO HEADER ═══ */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#6C3CE1', '#5B21B6', '#4C1D95']}
        style={s.heroHeader}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Decorative elements */}
        <View style={[s.decorCircle, { top: -20, right: -30, width: 140, height: 140, opacity: 0.06 }]} />
        <View style={[s.decorCircle, { bottom: 10, left: -20, width: 80, height: 80, opacity: 0.08 }]} />

        {/* Top row */}
        <View style={s.heroTopRow}>
          <TouchableOpacity onPress={() => onBack(profile.newName)} style={s.heroIconBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={profile.fetchUserStats} style={s.heroIconBtn}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Avatar + Info */}
        <View style={s.heroProfileRow}>
          <TouchableOpacity onPress={profile.pickImage} style={s.avatarOuter}>
            <LinearGradient colors={['#F59E0B', '#EF4444', '#EC4899']} style={s.avatarGradRing}>
              <View style={[s.avatarInner, { backgroundColor: isDark ? '#1E293B' : '#5B21B6' }]}>
                {profile.imageLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : profile.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={s.avatarImg} />
                ) : (
                  <Text style={s.avatarLetter}>{profile.newName?.charAt(0).toUpperCase() || 'B'}</Text>
                )}
              </View>
            </LinearGradient>
            <View style={s.cameraBtn}>
              <Ionicons name="camera" size={11} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.heroName}>{profile.newName || 'Öğrenci'}</Text>
            <Text style={s.heroEmail}>{userEmail}</Text>
            {profile.stats.institution && profile.stats.institution.status !== 'pending' && (
              <View style={s.instBadge}>
                <Ionicons name="school" size={11} color="#A78BFA" />
                <Text style={s.instBadgeText}>{profile.stats.institution.name}</Text>
              </View>
            )}
            {memberSince ? (
              <Text style={s.memberSince}>Üyelik: {memberSince}</Text>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ═══ HEDEF SINAV & ÇALIŞMA HEDEFİ ═══ */}
        <View style={s.quickCardsRow}>
          {/* Hedef Sınav */}
          <TouchableOpacity
            style={[s.quickCard, { backgroundColor: theme.surface }, theme.cardShadow]}
            onPress={() => setShowExamPicker(!showExamPicker)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[selectedExam ? selectedExam.color + '15' : '#7C3AED10', 'transparent']} style={s.quickCardGrad}>
              <Text style={{ fontSize: 28 }}>{selectedExam ? selectedExam.emoji : '🎯'}</Text>
              <Text style={[s.quickCardLabel, { color: theme.textSecondary }]}>Hedef Sınavım</Text>
              <Text style={[s.quickCardValue, { color: theme.text }]}>
                {selectedExam ? selectedExam.label : 'Seç'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Haftalık Hedef */}
          <TouchableOpacity
            style={[s.quickCard, { backgroundColor: theme.surface }, theme.cardShadow]}
            onPress={() => setShowGoalPicker(!showGoalPicker)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#10B98112', 'transparent']} style={s.quickCardGrad}>
              <Text style={{ fontSize: 28 }}>⏱️</Text>
              <Text style={[s.quickCardLabel, { color: theme.textSecondary }]}>Haftalık Hedef</Text>
              <Text style={[s.quickCardValue, { color: theme.text }]}>{weeklyGoal} saat</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ═══ EXAM PICKER ═══ */}
        {showExamPicker && (
          <View style={[s.pickerContainer, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <Text style={[s.pickerTitle, { color: theme.text }]}>Hedef Sınavını Seç</Text>
            <View style={s.examGrid}>
              {EXAM_OPTIONS.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  style={[s.examOption, targetExam === exam.id && { borderColor: exam.color, borderWidth: 2, backgroundColor: exam.color + '10' }]}
                  onPress={() => saveExam(exam.id)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 22 }}>{exam.emoji}</Text>
                  <Text style={[s.examOptionLabel, { color: targetExam === exam.id ? exam.color : theme.text }]}>{exam.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ═══ GOAL PICKER ═══ */}
        {showGoalPicker && (
          <View style={[s.pickerContainer, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <Text style={[s.pickerTitle, { color: theme.text }]}>Haftalık Çalışma Hedefi</Text>
            <View style={s.goalGrid}>
              {WEEKLY_GOALS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[s.goalOption, weeklyGoal === h && { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                  onPress={() => saveGoal(h)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.goalOptionText, { color: weeklyGoal === h ? '#fff' : theme.text }]}>{h}s</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ═══ EĞİTİM KURUMUM ═══ */}
        <View style={[s.sectionCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
          <View style={s.sectionCardHeader}>
            <Ionicons name="school" size={16} color="#7C3AED" />
            <Text style={[s.sectionCardTitle, { color: theme.text }]}>Eğitim Kurumum</Text>
          </View>

          {profile.stats.institution ? (
            profile.stats.institution.status === 'pending' ? (
              <View style={[s.instRow, { backgroundColor: '#FEF3C710' }]}>
                <View style={[s.sectionIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time" size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionItemLabel, { color: theme.text }]}>{profile.stats.institution.name}</Text>
                  <Text style={{ fontSize: 11, color: '#D97706', marginTop: 1 }}>⏳ Onay Bekleniyor</Text>
                </View>
                <TouchableOpacity onPress={profile.handleLeaveClass} style={s.cancelBtn}>
                  <Text style={s.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <SectionItem
                icon="log-out-outline" iconColor="#EF4444" iconBg="#FEE2E2"
                label={profile.stats.institution.name}
                sublabel="Kurumdan Ayrıl"
                theme={theme} onPress={profile.handleLeaveClass} noBorder
              />
            )
          ) : (
            <SectionItem
              icon="add-circle" iconColor="#7C3AED" iconBg="#7C3AED15"
              label="Kuruma Bağlan"
              sublabel="Kurum kodunu girerek sınıfına katıl"
              theme={theme} onPress={() => setTeacherModalVisible(true)} noBorder
            />
          )}
        </View>

        {/* ═══ HESAP AYARLARI ═══ */}
        <View style={[s.sectionCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
          <View style={s.sectionCardHeader}>
            <Ionicons name="person-circle" size={16} color="#3B82F6" />
            <Text style={[s.sectionCardTitle, { color: theme.text }]}>Hesap</Text>
          </View>
          <SectionItem
            icon="create-outline" iconColor="#3B82F6" iconBg="#3B82F615"
            label="İsim Değiştir"
            sublabel={profile.newName || 'Öğrenci'}
            theme={theme} onPress={() => profile.toggleModal('editName', true)}
          />
          <SectionItem
            icon="lock-closed-outline" iconColor="#F59E0B" iconBg="#F59E0B15"
            label="Şifre Değiştir"
            theme={theme} onPress={() => profile.toggleModal('changePass', true)}
          />
          <SectionItem
            icon="settings-outline" iconColor="#64748B" iconBg="#64748B15"
            label="Ayarlar"
            theme={theme} onPress={() => profile.toggleModal('settings', true)} noBorder
          />
        </View>

        {/* ═══ UYGULAMA AYARLARI ═══ */}
        <View style={[s.sectionCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
          <View style={s.sectionCardHeader}>
            <Ionicons name="options" size={16} color="#10B981" />
            <Text style={[s.sectionCardTitle, { color: theme.text }]}>Tercihler</Text>
          </View>
          <SectionItem
            icon={isDarkMode ? 'moon' : 'sunny'} iconColor={isDarkMode ? '#FCD34D' : '#F59E0B'} iconBg={isDarkMode ? '#FCD34D18' : '#F59E0B15'}
            label="Gece Modu"
            theme={theme}
            right={
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#E5E7EB', true: theme.primary + '50' }}
                thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
              />
            }
            noBorder
          />
        </View>

        {/* ═══ HAKKINDA ═══ */}
        <View style={[s.sectionCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
          <View style={s.sectionCardHeader}>
            <Ionicons name="information-circle" size={16} color="#EC4899" />
            <Text style={[s.sectionCardTitle, { color: theme.text }]}>Hakkında</Text>
          </View>
          <SectionItem
            icon="star-outline" iconColor="#F59E0B" iconBg="#F59E0B12"
            label="Uygulamayı Değerlendir"
            theme={theme}
            onPress={() => Alert.alert('Değerlendir', 'Uygulama mağazasına yönlendirileceksiniz.')}
          />
          <SectionItem
            icon="chatbubble-ellipses-outline" iconColor="#3B82F6" iconBg="#3B82F612"
            label="Geri Bildirim Gönder"
            sublabel="Fikirlerini bizimle paylaş"
            theme={theme}
            onPress={() => Linking.openURL('mailto:destek@rcsinavim.com?subject=Geri%20Bildirim')}
          />
          <SectionItem
            icon="shield-checkmark-outline" iconColor="#10B981" iconBg="#10B98112"
            label="Gizlilik Politikası"
            theme={theme}
            onPress={() => Alert.alert('Gizlilik', 'Gizlilik politikası sayfasına yönlendirileceksiniz.')}
          />
          <View style={[s.sectionItem, { borderBottomWidth: 0 }]}>
            <View style={[s.sectionIconBox, { backgroundColor: '#64748B10' }]}>
              <Ionicons name="code-slash" size={18} color="#64748B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.sectionItemLabel, { color: theme.text }]}>Sürüm</Text>
            </View>
            <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }}>1.0.0</Text>
          </View>
        </View>

        {/* ═══ ÇIKIŞ YAP ═══ */}
        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: theme.surface }, theme.cardShadow]}
          onPress={() => profile.handleLogout(onLogout)}
          activeOpacity={0.7}
        >
          <LinearGradient colors={['#EF444408', '#EF444415']} style={s.logoutBtnGrad}>
            <View style={[s.sectionIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <Text style={s.logoutText}>Çıkış Yap</Text>
            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[s.footerText, { color: theme.textSecondary + '40' }]}>
          RC Sınavım © 2026 — Tüm hakları saklıdır.
        </Text>
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

      <BottomTabBar setView={setView} theme={theme} />
    </View>
  );
};

// ─── STYLES ────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // Hero Header
  heroHeader: {
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  heroIconBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  heroProfileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarOuter: { position: 'relative' },
  avatarGradRing: { width: 76, height: 76, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarInner: { width: 66, height: 66, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 20 },
  avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '900' },
  cameraBtn: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 10, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  heroName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroEmail: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  instBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(167,139,250,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  instBadgeText: { color: '#A78BFA', fontSize: 10, fontWeight: '700' },
  memberSince: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', marginTop: 4 },

  // Quick Cards
  quickCardsRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 12 },
  quickCard: { flex: 1, borderRadius: 22, overflow: 'hidden' },
  quickCardGrad: { padding: 18, alignItems: 'center', gap: 6 },
  quickCardLabel: { fontSize: 11, fontWeight: '600' },
  quickCardValue: { fontSize: 17, fontWeight: '800' },

  // Pickers
  pickerContainer: { marginHorizontal: 20, marginTop: 12, padding: 18, borderRadius: 22 },
  pickerTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  examGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  examOption: { width: (width - 106) / 4, alignItems: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent', gap: 4 },
  examOptionLabel: { fontSize: 11, fontWeight: '700' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalOption: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  goalOptionText: { fontSize: 14, fontWeight: '700' },

  // Section Cards
  sectionCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 22, overflow: 'hidden' },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4 },
  sectionCardTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  sectionIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionItemLabel: { fontSize: 14, fontWeight: '600' },

  // Institution
  instRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  cancelBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  cancelBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },

  // Logout
  logoutBtn: { marginHorizontal: 20, marginTop: 16, borderRadius: 22, overflow: 'hidden' },
  logoutBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 12 },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#EF4444' },

  // Footer
  footerText: { textAlign: 'center', fontSize: 11, fontWeight: '500', marginTop: 24, marginBottom: 10 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: 3
  },
  activeIndicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600'
  },
});

export default ProfileView;
