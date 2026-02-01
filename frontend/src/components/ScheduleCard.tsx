import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const ScheduleCard = ({ item }: { item: any }) => {
  // Veri Uyumlandırma (Mapping)
  // AI'dan gelen 'day', 'task' ve 'duration' anahtarlarını senin tasarımına bağlıyoruz
  const displayDay = item.day || item.gun || "Gün";
  const displayTask = item.task || item.ders || "Ders Çalışma";
  const displayDuration = item.duration || item.sure || "2 Saat";

  return (
    <View style={[styles.card, item.completed && styles.completedCard]}>
      <View style={[styles.cardBadge, item.completed && styles.completedBadge]}>
        <Text style={[styles.dayText, item.completed && styles.completedDayText]}>
          {displayDay}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.lessonText, item.completed && styles.completedText]}>
          {displayTask}
        </Text>
        {/* AI bazen 'konu' yerine direkt görev verir, eğer konu yoksa süreye odaklanır */}
        <Text style={styles.durationText}>⏱️ {displayDuration}</Text>
      </View>
      {item.completed && <Text style={styles.checkMark}>✅</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fdfdfd', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 15, 
    flexDirection: 'row', 
    borderWidth: 1, 
    borderColor: '#eee',
    alignItems: 'center'
  },
  completedCard: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    opacity: 0.8
  },
  cardBadge: { 
    backgroundColor: '#6200ee20', 
    padding: 10, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    minWidth: 85 
  },
  completedBadge: {
    backgroundColor: '#e0e0e0'
  },
  dayText: { color: '#6200ee', fontWeight: 'bold', fontSize: 13 },
  completedDayText: { color: '#777' },
  cardBody: { marginLeft: 15, flex: 1, justifyContent: 'center' },
  lessonText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  completedText: { textDecorationLine: 'line-through', color: '#777' },
  durationText: { fontSize: 13, color: '#6200ee', fontWeight: '600', marginTop: 4 },
  checkMark: { fontSize: 20, marginLeft: 10 }
});