// frontend/src/components/StudentTaskList.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { taskService } from '../services/taskService';
import { COLORS } from '../constants/theme';

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  institution_name: string;
}

export const StudentTaskList = ({ studentId }: { studentId: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) loadTasks();
  }, [studentId]);

  const loadTasks = async () => {
    const data = await taskService.getStudentTasks(studentId);
    setTasks(data);
    setLoading(false);
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Ödev</Text>
        </View>
      </View>
      
      <Text style={styles.desc}>{item.description}</Text>
      
      <View style={styles.footer}>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.date}>{new Date(item.due_date).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.teacher}>{item.institution_name}</Text>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator color={COLORS.light.primary} />;

  if (tasks.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="school-outline" size={40} color="#ccc" />
        <Text style={styles.emptyText}>Henüz atanmış ödevin yok.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Ödevlerim</Text>
        <TouchableOpacity onPress={loadTasks}>
          <Ionicons name="refresh" size={20} color={COLORS.light.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        scrollEnabled={false} // Ana sayfa scroll'u içinde olacağı için
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, marginBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: '#fff', padding: 15, marginHorizontal: 25, marginBottom: 10, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width:0, height:2} },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  badge: { backgroundColor: '#e3f2fd', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#2196f3', fontSize: 10, fontWeight: 'bold' },
  desc: { color: '#666', fontSize: 14, marginBottom: 10, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 12, color: '#666', marginLeft: 5 },
  teacher: { fontSize: 12, color: COLORS.light.primary, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#999', marginTop: 5 }
});