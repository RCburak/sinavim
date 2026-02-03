import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  Modal, 
  Pressable, 
  Alert,
  Dimensions,
  Image 
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { MenuCard } from '../src/components/Dashboard/MenuCard';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- Header Bileşeni ---
const DashboardHeader = ({ username, onLogout, progress, setView, theme }: any) => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={[styles.headerWrapper, { backgroundColor: theme.background }]}>
      <View style={[styles.blueHeader, { backgroundColor: theme.primary }]}>
        <View style={styles.topRow}>
          <View style={styles.logoBox}>
            <Image 
              source={require('../assets/images/icon.png')} 
              style={styles.actualLogo}
              resizeMode="contain"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.profileCircle} 
            onPress={() => setMenuVisible(true)}
          >
            <Text style={styles.profileLetter}>
              {username ? username.charAt(0).toUpperCase() : 'B'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.greetingText}>Merhaba {username || 'Burak'}! 👋</Text>

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Günün Tamamlanma Oranı</Text>
            <Text style={styles.progressPercent}>%{progress || 11}</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: theme.overlay }]}>
            <View style={[styles.progressBarFill, { width: `${progress || 11}%` }]} />
          </View>
        </View>
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuContent, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { 
              setMenuVisible(false); 
              setView('profile'); 
            }}>
              <Ionicons name="person-outline" size={18} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Profilim</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={() => { 
              setMenuVisible(false); 
              onLogout(); 
            }}>
              <Ionicons name="log-out-outline" size={18} color="#FF4444" />
              <Text style={[styles.menuItemText, { color: "#FF4444" }]}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

// --- Ana Dashboard Görünümü ---
export const DashboardView = ({ username, progress, onLogout, setView, schedule, analiz, pomodoro, theme }: any) => (
  <View style={[styles.container, { backgroundColor: theme.background }]}>
    <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
    
    <DashboardHeader 
      username={username} 
      onLogout={onLogout} 
      progress={progress} 
      setView={setView} 
      theme={theme}
    />

    <ScrollView contentContainerStyle={styles.menuGrid}>
      {/* 1. KART: Programım */}
      <MenuCard 
        title="Programım" 
        emoji="📅" 
        subText={`${schedule?.length || 0} Ders Planlandı`} 
        onPress={() => setView('program')} 
        theme={theme}
      />

      {/* 2. KART: AI Programım */}
      <MenuCard 
        title="AI Programım" 
        emoji="🤖" 
        subText="Yapay zeka ile planla" 
        onPress={() => setView('setup')} 
        theme={theme}
      />

      {/* 3. KART: Analizler */}
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

      {/* 4. KART: Pomodoro */}
      <MenuCard 
        title="Pomodoro" 
        emoji="⏱️" 
        subText={pomodoro.formatTime(pomodoro.timer)} 
        onPress={() => setView('pomodoro')} 
        theme={theme}
      />

      {/* 5. KART: Geçmişim (YENİ EKLENDİ) */}
      <MenuCard 
        title="Geçmişim" 
        emoji="📚" 
        subText="Eski haftaları incele" 
        onPress={() => setView('history')} 
        theme={theme}
      />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: { },
  blueHeader: {
    paddingTop: 60,
    paddingHorizontal: 25,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    overflow: 'hidden' 
  },
  actualLogo: { width: '100%', height: '100%' },
  profileCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    borderWidth: 2, 
    borderColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileLetter: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  greetingText: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 25 },
  progressSection: { marginTop: 10 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  progressPercent: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  progressBarBg: { height: 6, borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 20, 
    justifyContent: 'space-between', 
    paddingTop: 20 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.1)', 
    justifyContent: 'flex-start', 
    alignItems: 'flex-end', 
    paddingTop: 110, 
    paddingRight: 30 
  },
  menuContent: { 
    borderRadius: 15, 
    width: 160, 
    padding: 8, 
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  menuItemText: { marginLeft: 10, fontSize: 15 },
  divider: { height: 1, marginVertical: 4 }
});

export default DashboardView;