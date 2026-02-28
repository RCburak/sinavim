import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, LayoutAnimation,
  Platform, UIManager, TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Lesson color mapping for accent
const LESSON_ACCENT: Record<string, string> = {
  'matematik': '#3B82F6', 'geometri': '#06B6D4', 'fizik': '#EF4444',
  'kimya': '#10B981', 'biyoloji': '#F59E0B', 'türkçe': '#EC4899',
  'tarih': '#8B5CF6', 'coğrafya': '#14B8A6', 'felsefe': '#6366F1',
  'din': '#F97316', 'ingilizce': '#D946EF',
};

const getAccent = (taskName: string): string => {
  const lower = taskName.toLowerCase();
  for (const [key, color] of Object.entries(LESSON_ACCENT)) {
    if (lower.includes(key)) return color;
  }
  return '#7C3AED';
};

export const DayFolder = ({ day, tasks, toggleTask, updateQuestions, theme = COLORS.light }: any) => {
  const [isOpen, setIsOpen] = useState(true);

  const dayTasks = tasks.filter((t: any) => {
    const itemDay = (t.gun || t.gün || t.day || "").toLowerCase();
    const currentDay = day.toLowerCase();
    return itemDay === currentDay || itemDay.includes(currentDay) || currentDay.includes(itemDay);
  });

  const completedCount = dayTasks.filter((t: any) => t.completed).length;
  const progressPercent = dayTasks.length > 0 ? (completedCount / dayTasks.length) * 100 : 0;
  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setIsOpen(!isOpen);
  };

  return (
    <View style={[s.container, { backgroundColor: theme.surface }, theme.cardShadow]}>
      {/* Gradient Progress Top Bar */}
      <View style={[s.topBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
        <LinearGradient
          colors={progressPercent >= 100 ? ['#10B981', '#059669'] : [theme.primary, theme.primary + '99']}
          style={[s.topBarFill, { width: `${progressPercent}%` }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
      </View>

      {/* Header */}
      <TouchableOpacity
        style={[s.header, isOpen && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}
        onPress={toggleOpen}
        activeOpacity={0.8}
      >
        <View style={s.headerLeft}>
          <LinearGradient
            colors={isOpen ? [theme.primary, theme.primary + 'CC'] : [isDark ? 'rgba(255,255,255,0.06)' : '#F0EAFF', isDark ? 'rgba(255,255,255,0.06)' : '#F0EAFF']}
            style={s.iconCircle}
          >
            <Ionicons name={isOpen ? "calendar" : "calendar-outline"} size={20} color={isOpen ? "#fff" : theme.primary} />
          </LinearGradient>
          <View>
            <Text style={[s.dayText, { color: theme.text }]}>{day}</Text>
            <View style={s.subRow}>
              <Text style={[s.subInfo, { color: theme.textSecondary }]}>
                {completedCount}/{dayTasks.length} Görev
              </Text>
              {progressPercent >= 100 && (
                <View style={s.completeBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '700' }}>Tamam</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={[s.chevronBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F7FF' }]}>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* Tasks */}
      {isOpen && (
        <View style={s.content}>
          {dayTasks.length > 0 ? (
            dayTasks.map((task: any, index: number) => {
              const taskKey = task.originalIndex || index;
              const accent = getAccent(task.task || '');
              return (
                <View key={taskKey} style={[s.taskCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFBFC' }]}>
                  {/* Accent side */}
                  <View style={[s.accentSide, { backgroundColor: task.completed ? '#10B981' : accent }]} />

                  <TouchableOpacity
                    style={s.taskMainRow}
                    onPress={() => toggleTask(task.originalIndex)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        s.taskText,
                        { color: theme.text },
                        task.completed && s.completedText
                      ]}>
                        {task.task}
                      </Text>
                      <View style={s.taskMeta}>
                        <View style={[s.metaTag, { backgroundColor: accent + '12' }]}>
                          <Ionicons name="time-outline" size={11} color={accent} />
                          <Text style={{ fontSize: 10, color: accent, fontWeight: '700' }}>{task.duration}</Text>
                        </View>
                        {(task.questions > 0) && (
                          <View style={[s.metaTag, { backgroundColor: '#3B82F612' }]}>
                            <Ionicons name="create-outline" size={11} color="#3B82F6" />
                            <Text style={{ fontSize: 10, color: '#3B82F6', fontWeight: '700' }}>{task.questions} Soru</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Checkbox */}
                    <View style={[
                      s.checkbox,
                      task.completed ? { backgroundColor: '#10B981', borderColor: '#10B981' } : { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0' }
                    ]}>
                      {task.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  </TouchableOpacity>

                  {/* Question Input */}
                  <View style={[s.qArea, { borderTopColor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
                    <Ionicons name="create" size={13} color={theme.textSecondary} />
                    <Text style={[s.qLabel, { color: theme.textSecondary }]}>Çözülen:</Text>
                    <TextInput
                      style={[s.qInput, { color: theme.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}
                      placeholder="0"
                      placeholderTextColor={theme.textSecondary + '60'}
                      keyboardType="numeric"
                      value={task.questions !== undefined ? String(task.questions) : ""}
                      onChangeText={(val) => updateQuestions(task.originalIndex, val)}
                    />
                    <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '500' }}>Soru</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={s.emptyState}>
              <Ionicons name="cafe-outline" size={24} color={theme.textSecondary + '50'} />
              <Text style={[s.emptyText, { color: theme.textSecondary }]}>Bu gün boş görünüyor ☕</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginBottom: 14, borderRadius: 22, overflow: 'hidden' },
  topBar: { height: 3, width: '100%' },
  topBarFill: { height: '100%', borderTopRightRadius: 3, borderBottomRightRadius: 3 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 16, fontWeight: '800' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  subInfo: { fontSize: 11, fontWeight: '600' },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chevronBox: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  content: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 8 },
  taskCard: { borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  accentSide: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  taskMainRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, paddingLeft: 18 },
  taskText: { fontSize: 15, fontWeight: '700' },
  completedText: { textDecorationLine: 'line-through', opacity: 0.4 },
  taskMeta: { flexDirection: 'row', gap: 8, marginTop: 6 },
  metaTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  checkbox: { width: 26, height: 26, borderRadius: 9, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },

  qArea: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
  qLabel: { fontSize: 11, fontWeight: '600' },
  qInput: { width: 48, height: 30, borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: '800', padding: 0 },

  emptyState: { padding: 24, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 13, fontWeight: '500' },
});