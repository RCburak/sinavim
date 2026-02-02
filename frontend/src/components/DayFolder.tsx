import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// theme prop'u eklendi
export const DayFolder = ({ day, tasks, toggleTask, theme = COLORS.light }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const dayTasks = tasks.filter((t: any) => {
    const itemDay = (t.gun || t.gün || t.day || "").toLowerCase();
    const currentDay = day.toLowerCase();
    return itemDay === currentDay || itemDay.includes(currentDay) || currentDay.includes(itemDay);
  });

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <TouchableOpacity 
        style={[
          styles.folderHeader, 
          { backgroundColor: isOpen ? theme.primary : theme.surface } // Aktiflik rengi dinamik
        ]} 
        onPress={toggleOpen}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.folderEmoji}>{isOpen ? '📂' : '📁'}</Text>
          <Text style={[
            styles.dayText, 
            { color: isOpen ? '#fff' : theme.text } // Yazı rengi dinamik
          ]}>
            {day}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isOpen ? 'rgba(255,255,255,0.2)' : theme.border }]}>
          <Text style={[
            styles.badgeText, 
            { color: isOpen ? '#fff' : theme.textSecondary }
          ]}>
            {dayTasks.length} Ders
          </Text>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.content, { backgroundColor: theme.surface }]}>
          {dayTasks.length > 0 ? (
            dayTasks.map((task: any) => (
              <TouchableOpacity 
                key={task.originalIndex} 
                style={[styles.taskRow, { borderBottomColor: theme.border }]}
                onPress={() => toggleTask(task.originalIndex)}
              >
                <View style={[
                  styles.checkbox, 
                  { borderColor: theme.primary },
                  task.completed && { backgroundColor: theme.primary }
                ]}>
                  {task.completed && <Text style={styles.checkIcon}>✓</Text>}
                </View>
                <View style={styles.taskInfo}>
                  <Text style={[
                    styles.taskText, 
                    { color: theme.text },
                    task.completed && [styles.completedText, { color: theme.textSecondary }]
                  ]}>
                    {task.task}
                  </Text>
                  <Text style={[styles.durationText, { color: theme.textSecondary }]}>
                    {task.duration}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Bu gün için planlanmış ders yok. Dinlenme vakti! ☕
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 15, borderRadius: 20, overflow: 'hidden', elevation: 2 },
  folderHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 18, 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  folderEmoji: { fontSize: 20, marginRight: 12 },
  dayText: { fontSize: 18, fontWeight: 'bold' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  content: { padding: 10 },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkIcon: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  taskInfo: { flex: 1 },
  taskText: { fontSize: 15, fontWeight: '500' },
  durationText: { fontSize: 12, marginTop: 2 },
  completedText: { textDecorationLine: 'line-through', opacity: 0.6 },
  emptyText: { textAlign: 'center', padding: 20, fontStyle: 'italic' }
});

export default DayFolder;