import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DayFolder = ({ day, tasks, toggleTask }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // ESNEK FİLTRELEME: Harf ve kelime uyuşmazlıklarını çözer
  const dayTasks = tasks.filter((t: any) => {
    const itemDay = (t.gun || t.gün || t.day || "").toLowerCase();
    const currentDay = day.toLowerCase();
    
    // Ya tam eşleşmeli ya da gün ismi (pazar) dersin gün bilgisinde (pazartesi) geçmeli
    return itemDay === currentDay || itemDay.includes(currentDay) || currentDay.includes(itemDay);
  });

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.folderHeader, isOpen && styles.activeHeader]} 
        onPress={toggleOpen}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.folderEmoji}>{isOpen ? '📂' : '📁'}</Text>
          <Text style={[styles.dayText, isOpen && { color: COLORS.surface }]}>{day}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, isOpen && { color: COLORS.primary }]}>
            {dayTasks.length} Ders
          </Text>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.content}>
          {dayTasks.length > 0 ? (
            dayTasks.map((task: any) => (
              <TouchableOpacity 
                key={task.originalIndex} 
                style={styles.taskRow}
                onPress={() => toggleTask(task.originalIndex)}
              >
                <View style={[styles.checkbox, task.completed && styles.checked]}>
                  {task.completed && <Text style={styles.checkIcon}>✓</Text>}
                </View>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskText, task.completed && styles.completedText]}>
                    {task.task}
                  </Text>
                  <Text style={styles.durationText}>{task.duration}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Bu gün için planlanmış ders yok. Dinlenme vakti! ☕</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 15, borderRadius: 20, overflow: 'hidden', backgroundColor: COLORS.surface, elevation: 2 },
  folderHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 18, 
    backgroundColor: COLORS.surface 
  },
  activeHeader: { backgroundColor: COLORS.primary },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  folderEmoji: { fontSize: 20, marginRight: 12 },
  dayText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  badge: { backgroundColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSecondary },
  content: { padding: 10, backgroundColor: COLORS.surface },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: COLORS.primary },
  checkIcon: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  durationText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  completedText: { textDecorationLine: 'line-through', color: COLORS.textSecondary, opacity: 0.6 },
  emptyText: { textAlign: 'center', padding: 20, color: COLORS.textSecondary, fontStyle: 'italic' }
});