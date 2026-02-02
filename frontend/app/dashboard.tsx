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
import { COLORS } from '../src/constants/theme';
import { MenuCard } from '../src/components/Dashboard/MenuCard';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Header Bileşeni: Profil Menüsü Entegre Edildi
const DashboardHeader = ({ username, onLogout, progress, setView }: any) => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.blueHeader}>
        {/* Üst Satır: Logo ve Profil Butonu */}
        <View style={styles.topRow}>
          <View style={styles.logoBox}>
            <Image 
              source={require('../assets/images/icon.png')} //
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

        {/* Karşılama Metni */}
        <Text style={styles.greetingText}>Merhaba {username || 'Burak'}! 👋</Text>

        {/* İlerleme Çubuğu Alanı */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Günün Tamamlanma Oranı</Text>
            <Text style={styles.progressPercent}>%{progress || 11}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress || 11}%` }]} />
          </View>
        </View>
      </View>

      {/* Profil Menüsü (Modal) */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContent}>
            {/* Profilim Butonu: Artık ProfileView'a yönlendiriyor */}
            <TouchableOpacity style={styles.menuItem} onPress={() => { 
              setMenuVisible(false); 
              setView('profile'); // Profil sayfasına geçiş
            }}>
              <Ionicons name="person-outline" size={18} color={COLORS.text} />
              <Text style={styles.menuItemText}>Profilim</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

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

export const DashboardView = ({ username, progress, onLogout, setView, schedule, analiz, pomodoro }: any) => (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" />
    
    <DashboardHeader 
      username={username} 
      onLogout={onLogout} 
      progress={progress} 
      setView={setView} 
    />

    <ScrollView contentContainerStyle={styles.menuGrid}>
      <MenuCard 
        title="Programım" 
        emoji="📅" 
        subText={`${schedule?.length || 0} Ders Planlandı`} 
        onPress={() => setView('program')} 
      />
      <MenuCard 
        title="Pomodoro" 
        emoji="⏱️" 
        subText={pomodoro.formatTime(pomodoro.timer)} 
        onPress={() => setView('pomodoro')} 
      />
      <MenuCard 
        title="Analizler" 
        emoji="📈" 
        subText="Net takibi yap" 
        color={COLORS.warning}
        onPress={() => {
          setView('analiz');
          analiz.refreshAnaliz();
        }} 
      />
      <MenuCard 
        title="Ayarlar" 
        emoji="⚙️" 
        subText="Programı güncelle" 
        onPress={() => setView('setup')} 
      />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  headerWrapper: { backgroundColor: '#F8F9FB' },
  blueHeader: {
    backgroundColor: '#5D12D2', // Fotoğraftaki mor tonu
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
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
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
    backgroundColor: '#fff', 
    borderRadius: 15, 
    width: 160, 
    padding: 8, 
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  menuItemText: { marginLeft: 10, fontSize: 15, color: '#333' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 4 }
});

export default DashboardView;