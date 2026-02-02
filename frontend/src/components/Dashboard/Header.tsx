import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/theme';

interface HeaderProps {
  username: string;
  progress: number;
  onLogout: () => void;
  theme?: any; // Tema prop'u eklendi
}

// theme prop'unu parametre olarak ekledik. Gelmezse varsayılan light olur.
export const DashboardHeader = ({ username, progress, onLogout, theme = COLORS.light }: HeaderProps) => (
  <View style={[styles.hero, { backgroundColor: theme.primary }]}>
    <SafeAreaView>
      <View style={styles.topRow}>
        <Image 
          source={require('../../../assets/images/icon.png')} 
          style={styles.logo} 
        />
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Çıkış 🚪</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.greeting}>Merhaba {username}! 👋</Text>
      
      <View style={styles.progressBox}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Günün Tamamlanma Oranı</Text>
          <Text style={styles.progressPercentage}>%{progress}</Text>
        </View>
        {/* Progress bar arka planı temaya göre değişir */}
        <View style={[styles.progressBar, { backgroundColor: theme.overlay }]}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  hero: { 
    padding: 25, 
    paddingBottom: 35, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  logo: { 
    width: 45, 
    height: 45, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.4)' 
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  progressBox: { marginTop: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: '#fff', fontSize: 13, opacity: 0.9 },
  progressPercentage: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  progressBar: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#fff' },
});