import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DayFolder = ({ day, tasks, toggleTask, theme = COLORS.light }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const dayTasks = tasks.filter((t: any) => {
    const itemDay = (t.gun || t.gün || t.day || "").toLowerCase();
    const currentDay = day.toLowerCase();
    return itemDay === currentDay || itemDay.includes(currentDay) || currentDay.includes(itemDay);
  });

  const completedCount = dayTasks.filter((t: any) => t.completed).length;
  const progressPercent = dayTasks.length > 0 ? (completedCount / dayTasks.length) * 100 : 0;

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring); // Daha yumuşak animasyon
    setIsOpen(!isOpen);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Günlük İlerleme Çizgisi (Klasörün En Üstünde) */}
      <View style={[styles.topProgressBar, { backgroundColor: theme.border }]}>
        <View style={[styles.topProgressFill, { width: `${progressPercent}%`, backgroundColor: theme.primary }]} />
      </View>

      <TouchableOpacity 
        style={[styles.folderHeader, isOpen && { borderBottomWidth: 1, borderBottomColor: theme.border }]} 
        onPress={toggleOpen}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: isOpen ? theme.primary : theme.overlay }]}>
            <Ionicons 
                name={isOpen ? "folder-open" : "folder"} 
                size={22} 
                color={isOpen ? "#fff" : theme.primary} 
            />
          </View>
          <View>
            <Text style={[styles.dayText, { color: theme.text }]}>{day}</Text>
            <Text style={[styles.subInfo, { color: theme.textSecondary }]}>
                {completedCount}/{dayTasks.length} Tamamlandı
            </Text>
          </View>
        </View>
        <Ionicons 
            name={isOpen ? "chevron-up-circle" : "chevron-down-circle"} 
            size={24} 
            color={theme.textSecondary} 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.content}>
          {dayTasks.length > 0 ? (
            dayTasks.map((task: any, index: number) => (
              <TouchableOpacity 
                key={task.originalIndex || index} 
                style={[styles.taskCard, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => toggleTask(task.originalIndex)}
              >
                <View style={[styles.colorTag, { backgroundColor: task.completed ? COLORS.success : theme.primary }]} />
                
                <View style={styles.taskMain}>
                  <Text style={[
                    styles.taskText, 
                    { color: theme.text },
                    task.completed && styles.completedText
                  ]}>
                    {task.task}
                  </Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                    <Text style={[styles.durationText, { color: theme.textSecondary }]}>{task.duration}</Text>
                  </View>
                </View>

                <View style={[
                    styles.checkbox, 
                    { borderColor: task.completed ? COLORS.success : theme.border },
                    task.completed && { backgroundColor: COLORS.success }
                ]}>
                  {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Bugün için ders atanmamış. 🏖️</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginBottom: 16, 
    borderRadius: 24, 
    overflow: 'hidden', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10 
  },
  topProgressBar: { height: 4, width: '100%' },
  topProgressFill: { height: '100%' },
  folderHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  dayText: { fontSize: 18, fontWeight: 'bold' },
  subInfo: { fontSize: 12, marginTop: 2 },
  content: { padding: 12 },
  taskCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 18, 
    marginBottom: 10, 
    borderWidth: 1 
  },
  colorTag: { width: 4, height: '80%', borderRadius: 2, marginRight: 12 },
  taskMain: { flex: 1 },
  taskText: { fontSize: 16, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  durationText: { fontSize: 12, marginLeft: 4 },
  checkbox: { width: 26, height: 26, borderRadius: 9, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  completedText: { textDecorationLine: 'line-through', opacity: 0.5 },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { fontStyle: 'italic' }
});