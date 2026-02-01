import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScheduleCard } from './ScheduleCard';
import { COLORS } from '../constants/theme';

export const DayFolder = ({ day, tasks, toggleTask }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dayTasks = tasks.filter((t: any) => t.gun === day);

  if (dayTasks.length === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.header, isOpen && { backgroundColor: COLORS.primary }]} 
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.text, isOpen && { color: COLORS.white }]}>
          {isOpen ? '📂' : '📁'} {day}
        </Text>
        <Text style={[styles.count, isOpen && { color: COLORS.white }]}>
          {dayTasks.length} Ders
        </Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.list}>
          {dayTasks.map((item: any) => (
            <TouchableOpacity key={item.originalIndex} onPress={() => toggleTask(item.originalIndex)}>
              <View style={item.completed ? { opacity: 0.5 } : null}>
                <ScheduleCard item={item} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12, borderRadius: 15, overflow: 'hidden' },
  header: { backgroundColor: COLORS.white, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  text: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  count: { fontSize: 12, color: COLORS.gray },
  list: { padding: 10, backgroundColor: COLORS.lightGray }
});