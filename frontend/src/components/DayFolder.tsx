import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  LayoutAnimation, 
  Platform, 
  UIManager, 
  TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DayFolder = ({ day, tasks, toggleTask, theme = COLORS.light }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  // Soru sayılarını tutmak için local state (İleride backend'e bağlanabilir)
  const [questionCounts, setQuestionCounts] = useState<{[key: string]: string}>({});

  const dayTasks = tasks.filter((t: any) => {
    const itemDay = (t.gun || t.gün || t.day || "").toLowerCase();
    const currentDay = day.toLowerCase();
    return itemDay === currentDay || itemDay.includes(currentDay) || currentDay.includes(itemDay);
  });

  const completedCount = dayTasks.filter((t: any) => t.completed).length;
  const progressPercent = dayTasks.length > 0 ? (completedCount / dayTasks.length) * 100 : 0;

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setIsOpen(!isOpen);
  };

  const handleQuestionChange = (index: number, val: string) => {
    setQuestionCounts(prev => ({ ...prev, [index]: val }));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Günlük İlerleme Çizgisi */}
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
            <Ionicons name={isOpen ? "calendar" : "calendar-outline"} size={22} color={isOpen ? "#fff" : theme.primary} />
          </View>
          <View>
            <Text style={[styles.dayText, { color: theme.text }]}>{day}</Text>
            <Text style={[styles.subInfo, { color: theme.textSecondary }]}>
              {completedCount}/{dayTasks.length} Görev Tamamlandı
            </Text>
          </View>
        </View>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.content}>
          {dayTasks.length > 0 ? (
            dayTasks.map((task: any, index: number) => {
              const taskKey = task.originalIndex || index;
              return (
                <View key={taskKey} style={[styles.taskWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <TouchableOpacity 
                    style={styles.taskMainRow}
                    onPress={() => toggleTask(task.originalIndex)}
                  >
                    <View style={[styles.colorTag, { backgroundColor: task.completed ? COLORS.success : theme.primary }]} />
                    
                    <View style={styles.taskInfo}>
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

                  {/* YKS ÖZEL: Soru Sayısı Girişi */}
                  <View style={[styles.qArea, { borderTopColor: theme.border }]}>
                    <Text style={[styles.qLabel, { color: theme.textSecondary }]}>Çözülen Soru:</Text>
                    <TextInput
                      style={[styles.qInput, { color: theme.text, backgroundColor: theme.overlay }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={questionCounts[taskKey] || ""}
                      onChangeText={(val) => handleQuestionChange(taskKey, val)}
                    />
                    <Text style={[styles.qUnit, { color: theme.textSecondary }]}>Soru</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Bu gün boş görünüyor. ☕</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 15, borderRadius: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  topProgressBar: { height: 3, width: '100%' },
  topProgressFill: { height: '100%' },
  folderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dayText: { fontSize: 17, fontWeight: 'bold' },
  subInfo: { fontSize: 11, marginTop: 1 },
  content: { padding: 12 },
  taskWrapper: { borderRadius: 16, marginBottom: 12, borderWidth: 1, overflow: 'hidden' },
  taskMainRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  colorTag: { width: 4, height: 25, borderRadius: 2, marginRight: 12 },
  taskInfo: { flex: 1 },
  taskText: { fontSize: 15, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  durationText: { fontSize: 11, marginLeft: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  completedText: { textDecorationLine: 'line-through', opacity: 0.5 },
  
  // Soru Sayısı Alanı Stilleri
  qArea: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5 },
  qLabel: { fontSize: 12, fontWeight: '500' },
  qInput: { width: 50, height: 30, borderRadius: 6, marginHorizontal: 10, textAlign: 'center', fontSize: 13, fontWeight: 'bold', padding: 0 },
  qUnit: { fontSize: 12 },

  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { fontStyle: 'italic', fontSize: 13 }
});