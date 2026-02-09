import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  Dimensions,
  Image,
  Platform
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { MenuCard } from '../src/components/Dashboard/MenuCard';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- ALT NAVİGASYON ÇUBUĞU (YENİ) ---
const BottomTabBar = ({ setView, theme }: any) => {
  return (
    <View style={[styles.bottomBar, { backgroundColor: theme.surface }]}>
      {/* Anasayfa Butonu (Aktif) */}
      <TouchableOpacity style={styles.tabItem} activeOpacity={0.8}>
        <Ionicons name="home" size={24} color={theme.primary} />
        <Text style={[styles.tabText, { color: theme.primary, fontWeight: '700' }]}>Anasayfa</Text>
      </TouchableOpacity>

      {/* Profil Butonu (Pasif - Tıklayınca Profil Sayfasına Gider) */}
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => setView('profile')}
        activeOpacity={0.8}
      >
        <Ionicons name="person-outline" size={24} color={theme.textSecondary} />
        <Text style={[styles.tabText, { color: theme.textSecondary }]}>Profilim</Text>
      </TouchableOpacity>
    </View>
  );
};

const DashboardHeader = ({ username, theme }: any) => {
  const today = new Date().toLocaleDateString('tr-TR', { 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  });

  return (
    <View style={[styles.headerWrapper, { backgroundColor: theme.background }]}>
      <View style={[styles.blueHeader, { backgroundColor: theme.primary }]}>
        
        {/* Üst Satır: Logo ve Tarih */}
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

        {/* Alt Satır: Sadece İsim ve Mesaj (Profil butonu kaldırıldı) */}
        <View style={styles.greetingRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.usernameText}>{username || 'Öğrenci'} 👋</Text>
            <Text style={styles.subText}>İyi çalışmalar, hedeflerine odaklan!</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export const DashboardView = ({ username, onLogout, setView, schedule, analiz, pomodoro, theme }: any) => (
  <View style={[styles.container, { backgroundColor: theme.background }]}>
    <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
    
    <DashboardHeader 
      username={username} 
      theme={theme}
    />

    <ScrollView contentContainerStyle={styles.menuGrid} showsVerticalScrollIndicator={false}>
      
      <MenuCard 
        title="Programım" 
        emoji="📅" 
        subText={`${schedule?.length || 0} Ders Listeleniyor`} 
        onPress={() => setView('program')} 
        theme={theme}
      />

      <MenuCard 
        title="AI Programım" 
        emoji="🤖" 
        subText="Yapay zeka ile planla" 
        onPress={() => setView('setup')} 
        theme={theme}
      />

      <MenuCard 
        title="Kendi Planım" 
        emoji="✍️" 
        subText="Haftanı kendin tasarla" 
        onPress={() => setView('manual_setup')} 
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
        title="Analizler" 
        emoji="📈" 
        subText="Net takibi yap" 
        onPress={() => {
          setView('analiz');
          analiz.refreshAnaliz();
        }} 
        theme={theme}
      />

      <MenuCard 
        title="Pomodoro" 
        emoji="⏱️" 
        subText={pomodoro.formatTime(pomodoro.timer)} 
        onPress={() => setView('pomodoro')} 
        theme={theme}
      />
      
      {/* ScrollView altında boşluk bırakıyoruz ki bottom bar içeriği kapatmasın */}
      <View style={{ height: 80 }} />

    </ScrollView>

    {/* Alt Navigasyon Çubuğu */}
    <BottomTabBar setView={setView} theme={theme} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: { zIndex: 10 },
  blueHeader: {
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingHorizontal: 25,
    paddingBottom: 35,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
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
    width: 44, 
    height: 44, 
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 2
  },
  
  brandContainer: {
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 24,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandBold: {
    fontWeight: '900', 
    letterSpacing: -0.5,
  },
  brandLight: {
    fontWeight: '300',
    opacity: 0.95,
    letterSpacing: 0.5,
  },

  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
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
  nameContainer: {
    justifyContent: 'center'
  },
  usernameText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  subText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500'
  },
  
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 20, 
    justifyContent: 'space-between',
    paddingTop: 25
  },

  // --- BOTTOM BAR STİLLERİ ---
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 70, // iOS için safe area payı
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    elevation: 20, // Android gölge
    shadowColor: '#000', // iOS gölge
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    gap: 4
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500'
  }
});

export default DashboardView;