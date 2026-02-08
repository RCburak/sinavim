import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  TouchableOpacity, 
  Modal, 
  Pressable, 
  Dimensions,
  Image,
  Platform
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { MenuCard } from '../src/components/Dashboard/MenuCard';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DashboardHeader = ({ username, onLogout, setView, theme }: any) => {
  const [menuVisible, setMenuVisible] = useState(false);

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
            {/* YENİ: Tipografik Logo Tasarımı */}
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

        {/* Alt Satır: İsim ve Profil */}
        <View style={styles.greetingRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.usernameText}>{username || 'Öğrenci'} 👋</Text>
            <Text style={styles.subText}>İyi çalışmalar, hedeflerine odaklan!</Text>
          </View>

          <TouchableOpacity 
            style={styles.profileBtn} 
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.8}
          >
             <Text style={styles.profileLetter}>
               {username ? username.charAt(0).toUpperCase() : 'B'}
             </Text>
             <View style={styles.profileBadge}>
                <Ionicons name="settings-sharp" size={10} color={theme.primary} />
             </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profil Menüsü (Modal) */}
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

export const DashboardView = ({ username, onLogout, setView, schedule, analiz, pomodoro, theme }: any) => (
  <View style={[styles.container, { backgroundColor: theme.background }]}>
    <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
    
    <DashboardHeader 
      username={username} 
      onLogout={onLogout} 
      setView={setView} 
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
      
    </ScrollView>
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
  
  // YENİ: Marka İsmi Stilleri
  brandContainer: {
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 24,
    color: '#fff',
    // Gölge efekti (Opsiyonel ama şık durur)
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandBold: {
    fontWeight: '900', // Ekstra kalın
    letterSpacing: -0.5,
  },
  brandLight: {
    fontWeight: '300', // İnce ve zarif
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
  
  profileBtn: { 
    width: 54, 
    height: 54, 
    borderRadius: 27, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileLetter: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  profileBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)'
  },

  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 20, 
    justifyContent: 'space-between',
    paddingTop: 25
  },
  
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    justifyContent: 'flex-start', 
    alignItems: 'flex-end', 
    paddingTop: Platform.OS === 'android' ? 120 : 130, 
    paddingRight: 25 
  },
  menuContent: { 
    borderRadius: 16, 
    width: 170, 
    padding: 10, 
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12,
    borderRadius: 10
  },
  menuItemText: { 
    marginLeft: 12, 
    fontSize: 14, 
    fontWeight: '500' 
  },
  divider: { 
    height: 1, 
    marginVertical: 4,
    opacity: 0.1 
  }
});

export default DashboardView;