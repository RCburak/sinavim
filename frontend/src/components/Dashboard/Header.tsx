import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView } from 'react-native';
import { COLORS } from '../../constants/theme';

export const DashboardHeader = ({ username, progress }: { username: string, progress: number }) => (
  <View style={styles.hero}>
    <SafeAreaView>
      <Image 
        source={require('../../../assets/images/icon.png')} 
        style={styles.logo} 
      />
      <Text style={styles.greeting}>Merhaba {username}! 👋</Text>
      <View style={styles.progressBox}>
        <Text style={styles.progressText}>Genel Başarı: %{progress}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  hero: { 
    padding: 30, 
    paddingBottom: 40, 
    backgroundColor: COLORS.primary, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    elevation: 5
  },
  logo: { width: 50, height: 50, borderRadius: 15, marginBottom: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  progressBox: { marginTop: 20 },
  progressText: { color: '#fff', marginBottom: 8, fontSize: 13, opacity: 0.9 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.secondary },
});