import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const ScheduleCard = ({ item }: { item: any }) => (
  <View style={styles.card}>
    <View style={styles.cardBadge}>
      <Text style={styles.dayText}>{item.gun}</Text>
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.lessonText}>{item.ders}</Text>
      <Text style={styles.topicText}>{item.konu}</Text>
      <Text style={styles.durationText}>⏱️ {item.sure}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#fdfdfd', borderRadius: 15, padding: 15, marginBottom: 15, flexDirection: 'row', borderWidth: 1, borderColor: '#eee' },
  cardBadge: { backgroundColor: '#6200ee20', padding: 10, borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 80 },
  dayText: { color: '#6200ee', fontWeight: 'bold', fontSize: 14 },
  cardBody: { marginLeft: 15, justifyContent: 'center' },
  lessonText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  topicText: { fontSize: 14, color: '#777', marginVertical: 2 },
  durationText: { fontSize: 14, color: '#6200ee', fontWeight: '600' }
});