import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TeacherJoinModal } from '../components/profile/TeacherJoinModal';
import { auth } from '../services/firebaseConfig';

const { width } = Dimensions.get('window');

import { DashboardViewProps, Theme } from '../types';

// ─── MENU ITEMS CONFIG ─────────────────────────────
const MENU_ITEMS = [
  { key: 'manual_setup', title: 'Kendi Planım', icon: 'calendar', gradient: ['#7C3AED', '#5B21B6'], subText: 'Haftanı kendin tasarla' },
  { key: 'analiz', title: 'Analizler', icon: 'stats-chart', gradient: ['#F59E0B', '#D97706'], subText: 'Net takibi yap' },
  { key: 'history', title: 'Geçmişim', icon: 'time', gradient: ['#6366F1', '#4F46E5'], subText: 'Arşivlenen programlar' },
  { key: 'pomodoro', title: 'Pomodoro', icon: 'timer', gradient: ['#EF4444', '#DC2626'], subText: '' },
  { key: 'question_pool', title: 'Soru Havuzu', icon: 'camera', gradient: ['#EC4899', '#DB2777'], subText: 'Yapamadıkların' },
  { key: 'notebook', title: 'Not Defteri', icon: 'document-text', gradient: ['#10B981', '#059669'], subText: 'Notlarını yaz' },
  { key: 'exam_calendar', title: 'Deneme Takvimi', icon: 'calendar-number', gradient: ['#3B82F6', '#2563EB'], subText: 'Sınavlarını takip et' },
];

// ─── PREMIUM MENU CARD ─────────────────────────────
const PremiumCard = ({ item, onPress, theme, index }: any) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[s.menuCard, { backgroundColor: theme.surface }, theme.cardShadow]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {/* Gradient Icon Circle */}
        <LinearGradient
          colors={item.gradient}
          style={s.iconCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={item.icon} size={24} color="#fff" />
        </LinearGradient>

        {/* Decorative dot */}
        <View style={[s.cardDot, { backgroundColor: item.gradient[0] + '15' }]} />

        <Text style={[s.cardTitle, { color: theme.text }]}>{item.title}</Text>
        {item.subText ? (
          <Text style={[s.cardSub, { color: theme.textSecondary }]}>{item.subText}</Text>
        ) : null}

        {/* Arrow indicator */}
        <View style={[s.cardArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
          <Ionicons name="chevron-forward" size={14} color={theme.textSecondary + '60'} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── BOTTOM TAB BAR ────────────────────────────────
const BottomTabBar = ({ setView, theme }: { setView: (view: string) => void; theme: Theme }) => {
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
        const isActive = tab.key === 'dashboard';
        return (
          <TouchableOpacity key={tab.key} style={s.tabItem} onPress={() => setView(tab.key)} activeOpacity={0.8}>
            <View style={[s.activeIndicator, isActive && { backgroundColor: theme.primary }]} />
            <Ionicons name={(isActive ? tab.icon : tab.iconOutline) as any} size={22} color={isActive ? theme.primary : theme.textSecondary} />
            <Text style={[s.tabText, { color: isActive ? theme.primary : theme.textSecondary, fontWeight: isActive ? '700' : '500' }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── MAIN VIEW ─────────────────────────────────────
export const DashboardView = ({ username, onLogout, setView, schedule, analiz, pomodoro, theme, institution, refreshInstitution, streak }: DashboardViewProps & { streak?: any }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

  const today = new Date().toLocaleDateString('tr-TR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (analiz && analiz.refreshAnaliz) analiz.refreshAnaliz();
    if (refreshInstitution) refreshInstitution();
    setTimeout(() => setRefreshing(false), 1000);
  }, [analiz, refreshInstitution]);

  // Build menu items with dynamic ones
  const menuItems = [
    ...MENU_ITEMS.slice(0, 1),
    ...(institution ? [{
      key: 'program',
      title: 'Ödev',
      icon: 'school',
      gradient: ['#8B5CF6', '#6D28D9'] as string[],
      subText: `${schedule?.length || 0} Ders Atanmış`,
    }] : []),
    ...MENU_ITEMS.slice(1),
  ];

  // Update pomodoro subtext dynamically
  const finalMenuItems = menuItems.map(item => {
    if (item.key === 'pomodoro') {
      return { ...item, subText: pomodoro.formatTime(pomodoro.timer) };
    }
    if (item.key === 'analiz' && analiz) {
      return { ...item, subText: 'Net takibi yap' };
    }
    return item;
  });

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* ═══ PREMIUM HEADER ═══ */}
      <LinearGradient
        colors={isDark ? ['#0F0F2E', '#1A1045', '#2D1B69'] : ['#4F46E5', '#6C3CE1', '#8B5CF6']}
        style={s.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={[s.decorCircle, { top: -40, right: -30, width: 140, height: 140, opacity: 0.06 }]} />
        <View style={[s.decorCircle, { top: 30, left: -50, width: 120, height: 120, opacity: 0.04 }]} />
        <View style={[s.decorCircle, { bottom: 10, right: 50, width: 70, height: 70, opacity: 0.08 }]} />

        {/* Top Row */}
        <View style={s.topRow}>
          <View style={s.logoRow}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.brandName}>RC Sınavım</Text>
          </View>

          <View style={s.dateBadge}>
            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={s.dateText}>{today}</Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={s.greetingSection}>
          <Text style={s.greetingName}>{username || 'Öğrenci'} 👋</Text>
          <Text style={s.greetingSub}>İyi çalışmalar, hedeflerine odaklan!</Text>
        </View>

        {/* Quick Stats Row */}
        {streak && (
          <View style={s.quickStatsRow}>
            <View style={s.quickStat}>
              <View style={s.quickStatIcon}>
                <Ionicons name="flame" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={s.quickStatValue}>{streak.currentStreak || 0}</Text>
                <Text style={s.quickStatLabel}>Gün Seri</Text>
              </View>
            </View>
            <View style={s.quickStatDivider} />
            <View style={s.quickStat}>
              <View style={s.quickStatIcon}>
                <Ionicons name="trophy" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={s.quickStatValue}>{streak.longestStreak || 0}</Text>
                <Text style={s.quickStatLabel}>En Uzun</Text>
              </View>
            </View>
            <View style={s.quickStatDivider} />
            <View style={s.quickStat}>
              <View style={s.quickStatIcon}>
                <Ionicons name="calendar" size={16} color="#10B981" />
              </View>
              <View>
                <Text style={s.quickStatValue}>{streak.totalActiveDays || 0}</Text>
                <Text style={s.quickStatLabel}>Aktif Gün</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* ═══ CONTENT ═══ */}
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Section Title */}
        <View style={s.sectionHeader}>
          <View style={s.sectionDot} />
          <Text style={[s.sectionTitle, { color: theme.text }]}>Araçlar</Text>
        </View>

        {/* Menu Grid */}
        <View style={s.menuGrid}>
          {finalMenuItems.map((item, index) => (
            <PremiumCard
              key={item.key}
              item={item}
              index={index}
              theme={theme}
              onPress={() => {
                if (item.key === 'analiz' && analiz?.refreshAnaliz) analiz.refreshAnaliz();
                setView(item.key);
              }}
            />
          ))}
        </View>

        {/* Institution Join Banner */}
        {!institution && (
          <TouchableOpacity
            style={[s.joinBanner, { backgroundColor: theme.surface }, theme.cardShadow]}
            onPress={() => setTeacherModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7C3AED10', '#3B82F610']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={s.joinIconBox}>
              <Ionicons name="school" size={22} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.joinTitle, { color: theme.text }]}>Kuruma Katıl</Text>
              <Text style={[s.joinSub, { color: theme.textSecondary }]}>Öğretmeninden ödev al</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      <BottomTabBar setView={setView} theme={theme} />

      <TeacherJoinModal
        visible={teacherModalVisible}
        onClose={() => setTeacherModalVisible(false)}
        theme={theme}
        userEmail={auth.currentUser?.email || null}
        onSuccess={(institutionName: string) => {
          if (refreshInstitution) refreshInstitution();
        }}
      />
    </View>
  );
};

export default DashboardView;

// ─── STYLES ────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: Platform.OS === 'android' ? 52 : 62,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  brandName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  dateText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
  },

  // Greeting
  greetingSection: {
    marginBottom: 18,
  },
  greetingName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  greetingSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '500',
  },

  // Quick Stats
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  quickStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  quickStatLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
  },
  quickStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
  },

  // Content
  scrollContent: {
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Menu Grid
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  menuCard: {
    width: (width - 52) / 2,
    padding: 18,
    borderRadius: 22,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardArrow: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Join Banner
  joinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 20,
    gap: 14,
    overflow: 'hidden',
  },
  joinIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#7C3AED15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  joinSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // Bottom Bar
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
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: 3,
  },
  activeIndicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 11,
  },
});
