import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions, View } from 'react-native';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

// theme prop'unu parametre olarak ekledik
export const MenuCard = ({ title, emoji, subText, onPress, color, theme = COLORS.light }: any) => (
  <TouchableOpacity 
    style={[
      styles.menuCard, 
      { 
        backgroundColor: theme.surface, // Arka plan artık dinamik
        shadowColor: isDarkMode(theme) ? '#000' : '#000', // Gölge rengi
      }
    ]} 
    onPress={onPress}
  >
    <Text style={styles.cardEmoji}>{emoji}</Text>
    
    <Text style={[
      styles.cardTitle, 
      { color: color || theme.text } // Yazı rengi artık dinamik
    ]}>
      {title}
    </Text>
    
    <Text style={[
      styles.cardSub, 
      { color: theme.textSecondary } // Alt yazı rengi artık dinamik
    ]}>
      {subText}
    </Text>
  </TouchableOpacity>
);

// Yardimci fonksiyon: temanın dark olup olmadığını kontrol eder
const isDarkMode = (theme: any) => theme.background === '#121212';

const styles = StyleSheet.create({
  menuCard: { 
    width: width * 0.42, 
    padding: 20, 
    borderRadius: 25, 
    marginBottom: 20, 
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardEmoji: { fontSize: 30, marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: 'bold' },
  cardSub: { fontSize: 12, marginTop: 4 },
});