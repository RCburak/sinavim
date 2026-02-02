import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export const MenuCard = ({ title, emoji, subText, onPress, color }: any) => (
  <TouchableOpacity style={styles.menuCard} onPress={onPress}>
    <Text style={styles.cardEmoji}>{emoji}</Text>
    <Text style={[styles.cardTitle, color ? { color } : null]}>{title}</Text>
    {/* HATA BURADAYDI: COLORS.gray yerine COLORS.textSecondary kullanıyoruz */}
    <Text style={styles.cardSub}>{subText}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  menuCard: { 
    width: width * 0.42, 
    backgroundColor: COLORS.surface, 
    padding: 20, 
    borderRadius: 25, 
    marginBottom: 20, 
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardEmoji: { fontSize: 30, marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }, // Düzenlendi
});