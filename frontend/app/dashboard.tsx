import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  RefreshControl
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MenuCard } from '../src/components/Dashboard/MenuCard';
import { Ionicons } from '@expo/vector-icons';
import { TeacherJoinModal } from '../src/components/profile/TeacherJoinModal';
import { auth } from '../src/services/firebaseConfig';
import { API_URL, API_HEADERS } from '../src/config/api';

const { width } = Dimensions.get('window');

import { DashboardViewProps, Theme } from '../src/types';

// ... (imports remain the same)

// --- ALT NAVİGASYON ÇUBUĞU ---
const BottomTabBar = ({ setView, theme }: { setView: (view: string) => void; theme: Theme }) => {
  return (
    <View style={[styles.bottomBar, { backgroundColor: theme.surface }]}>
      <TouchableOpacity style={styles.tabItem} activeOpacity={0.8}>
        <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
        <Ionicons name="home" size={22} color={theme.primary} />
        <Text style={[styles.tabText, { color: theme.primary, fontWeight: '700' }]}>Anasayfa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setView('profile')}
        activeOpacity={0.8}
      >
        <View style={styles.activeIndicator} />
        <Ionicons name="person-outline" size={22} color={theme.textSecondary} />
        <Text style={[styles.tabText, { color: theme.textSecondary }]}>Profilim</Text>
      </TouchableOpacity>
    </View>
  );
};

const DashboardHeader = ({ username, theme }: { username: string | null; theme: Theme }) => {
  const today = new Date().toLocaleDateString('tr-TR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

  return (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={isDark ? ['#1A1A2E', '#16213E'] : ['#6C3CE1', '#4A1DB5']}
        style={styles.blueHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Üst Satır */}
        <View style={styles.topRow}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.actualLogo}
              resizeMode="contain"
            />
            <View style={styles.brandContainer}>
              <Text style={styles.brandText}>
                <Text style={styles.brandBold}>RC </Text>
                <Text style={styles.brandLight}>Sınavım</Text>
              </Text>
            </View>
          </View>

          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={styles.dateText}>{today}</Text>
          </View>
        </View>

        {/* Alt Satır */}
        <View style={styles.greetingRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.usernameText}>{username || 'Öğrenci'} 👋</Text>
            <Text style={styles.subText}>İyi çalışmalar, hedeflerine odaklan!</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export const DashboardView = ({ username, onLogout, setView, schedule, analiz, pomodoro, theme, institution, refreshInstitution }: DashboardViewProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    if (analiz && analiz.refreshAnaliz) analiz.refreshAnaliz();
    if (refreshInstitution) refreshInstitution();
    setTimeout(() => setRefreshing(false), 1000);
  }, [analiz, refreshInstitution]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <DashboardHeader
        username={username}
        theme={theme}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >

        <View style={styles.menuGrid}>
          <MenuCard
            title="Kendi Planım"
            emoji="✍️"
            subText="Haftanı kendin tasarla"
            onPress={() => setView('manual_setup')}
            theme={theme}
          />



          {institution && (
            <MenuCard
              title="Ödev"
              emoji="📝"
              subText={`${schedule?.length || 0} Ders Atanmış`}
              onPress={() => setView('program')}
              theme={theme}
            />
          )}

          <MenuCard
            title="Analizler"
            emoji="📈"
            subText="Net takibi yap"
            onPress={() => {
              setView('analiz');
              if (analiz && analiz.refreshAnaliz) analiz.refreshAnaliz();
            }}
            theme={theme}
          />

          <MenuCard
            title="Geçmişim"
            emoji="📚"
            subText="Arşivlenen programlar"
            onPress={() => setView('history')}
            theme={theme}
          />

          <MenuCard
            title="Pomodoro"
            emoji="⏱️"
            subText={pomodoro.formatTime(pomodoro.timer)}
            onPress={() => setView('pomodoro')}
            theme={theme}
          />

          <MenuCard
            title="Soru Havuzu"
            emoji="📸"
            subText="Yapamadıkların"
            onPress={() => setView('question_pool')}
            theme={theme}
            color="#EC4899"
          />
        </View>

        <View style={{ height: 80 }} />

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: { zIndex: 10 },
  blueHeader: {
    paddingTop: Platform.OS === 'android' ? 60 : 70,
    paddingHorizontal: 25,
    paddingBottom: 35,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actualLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  brandContainer: { justifyContent: 'center' },
  brandText: { fontSize: 22, color: '#fff' },
  brandBold: { fontWeight: '900', letterSpacing: -0.5 },
  brandLight: { fontWeight: '300', opacity: 0.95, letterSpacing: 0.5 },

  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6
  },
  dateText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 11,
    fontWeight: '600'
  },

  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5
  },
  nameContainer: { justifyContent: 'center' },
  usernameText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  subText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500'
  },

  scrollContent: {
    paddingBottom: 20,
    paddingTop: 20
  },

  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'space-between',
    paddingTop: 5
  },

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
    borderTopWidth: 0,
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
  }
});