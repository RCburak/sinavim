import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions, View } from 'react-native';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export const MenuCard = ({ title, emoji, subText, onPress, color, theme = COLORS.light }: any) => (
  <TouchableOpacity
    style={[
      styles.menuCard,
      { backgroundColor: theme.surface },
      theme.cardShadow,
    ]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    {/* Accent strip */}
    <View style={[styles.accentStrip, { backgroundColor: theme.primary + '15' }]} />

    {/* Emoji circle */}
    <View style={[styles.emojiCircle, { backgroundColor: theme.primary + '12' }]}>
      <Text style={styles.cardEmoji}>{emoji}</Text>
    </View>

    <Text style={[styles.cardTitle, { color: color || theme.text }]}>{title}</Text>

    <Text style={[styles.cardSub, { color: theme.textSecondary }]}>{subText}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  menuCard: {
    width: width * 0.42,
    padding: 20,
    paddingTop: 24,
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  accentStrip: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 4,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  emojiCircle: {
    width: 50, height: 50, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  cardEmoji: { fontSize: 26 },
  cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  cardSub: { fontSize: 12, marginTop: 4, fontWeight: '500' },
});