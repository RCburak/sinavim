import React, { useState } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity, SafeAreaView,
  StyleSheet, StatusBar, Dimensions, Platform, Modal,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DayFolder } from './DayFolder';
import { COLORS, GUNLER } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DAY_COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
const DAY_ICONS = ['school', 'book', 'flask', 'calculator', 'planet', 'star', 'cafe'];

const LESSON_PRESETS = [
  { name: 'Matematik', icon: 'calculator', color: '#3B82F6' },
  { name: 'Geometri', icon: 'shapes', color: '#06B6D4' },
  { name: 'Fizik', icon: 'flash', color: '#EF4444' },
  { name: 'Kimya', icon: 'flask', color: '#10B981' },
  { name: 'Biyoloji', icon: 'leaf', color: '#F59E0B' },
  { name: 'Türkçe', icon: 'book', color: '#EC4899' },
  { name: 'Tarih', icon: 'time', color: '#8B5CF6' },
  { name: 'Coğrafya', icon: 'globe', color: '#14B8A6' },
  { name: 'Felsefe', icon: 'bulb', color: '#6366F1' },
  { name: 'Din', icon: 'moon', color: '#F97316' },
  { name: 'İngilizce', icon: 'language', color: '#D946EF' },
];

const DURATION_PRESETS = ['30 Dk', '45 Dk', '1 Saat', '1.5 Saat', '2 Saat', '2.5 Saat', '3 Saat'];

export const ProgramView = ({ tasks, toggleTask, updateQuestions, onBack, onAddTask, onDeleteTask, onFinalize, theme = COLORS.light, isEditMode = false }: any) => {
  const [selectedDay, setSelectedDay] = useState(GUNLER[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState('1 Saat');
  const [questions, setQuestions] = useState('');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const weeklyProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
  const dayIndex = GUNLER.indexOf(selectedDay);

  // Day-specific stats
  const dayTasks = tasks.filter((t: any) => (t.gun || '').toLowerCase() === selectedDay.toLowerCase());
  const dayCompleted = dayTasks.filter((t: any) => t.completed).length;
  const dayQuestions = dayTasks.reduce((sum: number, t: any) => sum + (parseInt(t.questions) || 0), 0);

  const handleSaveTask = () => {
    if (!taskName) return;
    onAddTask({ gun: selectedDay, task: taskName, duration: duration || "1 Saat", questions: parseInt(questions) || 0, completed: false });
    setTaskName(''); setQuestions(''); setModalVisible(false);
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ═══ HEADER ═══ */}
      <LinearGradient
        colors={isDark
          ? (isEditMode ? ['#0F172A', '#1E3A5F', '#1E40AF'] : ['#1A1040', '#2D1B69', '#4C1D95'])
          : (isEditMode ? ['#3B82F6', '#2563EB', '#1D4ED8'] : ['#7C3AED', '#6D28D9', '#5B21B6'])}
        style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={[s.decorCircle, { top: -30, right: -20, width: 100, height: 100 }]} />
        <View style={[s.decorCircle, { bottom: -15, left: -25, width: 80, height: 80 }]} />

        <View style={s.headerRow}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.headerTitle}>{isEditMode ? "Programımı Tasarla" : "Ödevlerim"}</Text>
            <Text style={s.headerSub}>{isEditMode ? "Kendi haftalık planını oluştur" : "Öğretmenin atadığı program"}</Text>
          </View>
        </View>

        {/* Mini Stats Bar */}
        <View style={s.miniStats}>
          <View style={s.miniStatItem}>
            <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={s.miniStatVal}>{completedTasks}/{totalTasks}</Text>
            <Text style={s.miniStatLabel}>Görev</Text>
          </View>
          <View style={s.miniStatDivider} />
          <View style={s.miniStatItem}>
            <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={s.miniStatVal}>%{weeklyProgress}</Text>
            <Text style={s.miniStatLabel}>İlerleme</Text>
          </View>
          <View style={s.miniStatDivider} />
          <View style={s.miniStatItem}>
            <Ionicons name="create" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={s.miniStatVal}>{dayQuestions}</Text>
            <Text style={s.miniStatLabel}>Soru</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ═══ DAY TABS ═══ */}
      <View style={s.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScroll}>
          {GUNLER.map((gun, i) => {
            const isActive = selectedDay === gun;
            const color = DAY_COLORS[i % DAY_COLORS.length];
            const dayTasksCount = tasks.filter((t: any) => (t.gun || '').toLowerCase() === gun.toLowerCase()).length;
            const dayCompletedCount = tasks.filter((t: any) => (t.gun || '').toLowerCase() === gun.toLowerCase() && t.completed).length;
            const allDone = dayTasksCount > 0 && dayCompletedCount === dayTasksCount;

            return (
              <TouchableOpacity
                key={gun}
                onPress={() => setSelectedDay(gun)}
                style={[
                  s.tabPill,
                  isActive ? { backgroundColor: color } : { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border }
                ]}
                activeOpacity={0.7}
              >
                <Text style={[s.tabText, { color: isActive ? '#fff' : theme.textSecondary, fontWeight: isActive ? '800' : '600' }]}>
                  {gun.substring(0, 3)}
                </Text>
                {dayTasksCount > 0 && (
                  <View style={[s.tabDot, { backgroundColor: isActive ? 'rgba(255,255,255,0.5)' : (allDone ? '#10B981' : color) }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ═══ WEEKLY PROGRESS CARD ═══ */}
        <View style={[s.progressCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
          <LinearGradient
            colors={[`${isEditMode ? '#3B82F6' : '#7C3AED'}08`, 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={s.progressRow}>
            <View>
              <Text style={[s.progressTitle, { color: theme.text }]}>Haftalık İlerleme</Text>
              <Text style={[s.progressSub, { color: theme.textSecondary }]}>
                {completedTasks} tamamlandı, {totalTasks - completedTasks} kalan
              </Text>
            </View>
            <View style={[s.percentCircle, { borderColor: weeklyProgress >= 100 ? '#10B981' : isEditMode ? '#3B82F6' : '#7C3AED' }]}>
              <Text style={[s.percentText, { color: weeklyProgress >= 100 ? '#10B981' : isEditMode ? '#3B82F6' : '#7C3AED' }]}>
                %{weeklyProgress}
              </Text>
            </View>
          </View>
          <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
            <LinearGradient
              colors={weeklyProgress >= 100 ? ['#10B981', '#059669'] : isEditMode ? ['#3B82F6', '#2563EB'] : ['#7C3AED', '#6D28D9']}
              style={[s.progressFill, { width: `${Math.min(weeklyProgress, 100)}%` }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </View>
        </View>

        {/* ═══ DAY HEADER ═══ */}
        <View style={s.dayHeader}>
          <View style={[s.dayDot, { backgroundColor: DAY_COLORS[dayIndex % DAY_COLORS.length] }]} />
          <Text style={[s.dayTitle, { color: theme.text }]}>{selectedDay}</Text>
          <View style={[s.dayCount, { backgroundColor: DAY_COLORS[dayIndex % DAY_COLORS.length] + '15' }]}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: DAY_COLORS[dayIndex % DAY_COLORS.length] }}>
              {dayCompleted}/{dayTasks.length}
            </Text>
          </View>
        </View>

        {/* ═══ TASK LIST ═══ */}
        {tasks
          .map((t: any, idx: number) => ({ ...t, originalIndex: idx }))
          .filter((t: any) => t.gun.toLowerCase() === selectedDay.toLowerCase())
          .map((task: any) => (
            <DayFolder
              key={task.originalIndex}
              day={selectedDay}
              tasks={[task]}
              toggleTask={toggleTask}
              updateQuestions={updateQuestions}
              theme={theme}
            />
          ))}

        {/* Edit Mode Inline Tasks */}
        {isEditMode && tasks
          .map((t: any, idx: number) => ({ ...t, originalIndex: idx }))
          .filter((t: any) => t.gun.toLowerCase() === selectedDay.toLowerCase())
          .map((task: any) => (
            <View key={`edit-${task.originalIndex}`} style={[s.editCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
              <View style={[s.editAccent, { backgroundColor: DAY_COLORS[dayIndex % DAY_COLORS.length] }]} />
              <View style={{ flex: 1, paddingLeft: 6 }}>
                <Text style={[s.editTaskName, { color: theme.text }]}>{task.task}</Text>
                <View style={s.editMeta}>
                  <View style={[s.editTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                    <Ionicons name="time-outline" size={11} color={theme.textSecondary} />
                    <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: '600' }}>{task.duration}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => onDeleteTask && onDeleteTask(task.originalIndex)}
                style={s.editDeleteBtn}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        }

        {/* Empty State */}
        {tasks.filter((t: any) => t.gun.toLowerCase() === selectedDay.toLowerCase()).length === 0 && (
          <View style={[s.emptyBox, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <View style={[s.emptyIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F7FF' }]}>
              <Ionicons name="add-circle-outline" size={32} color={theme.textSecondary + '50'} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>Henüz ders yok</Text>
            <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>
              {isEditMode ? '+ butonuyla ders ekle' : 'Öğretmenin henüz bu güne ders atamadı'}
            </Text>
          </View>
        )}

        {/* Finalize Button */}
        {onFinalize && tasks.length > 0 && selectedDay === 'Pazar' && (
          <TouchableOpacity style={s.finalizeBtn} onPress={onFinalize} activeOpacity={0.85}>
            <LinearGradient colors={['#10B981', '#059669']} style={s.finalizeBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="checkmark-done-circle" size={22} color="#fff" />
              <Text style={s.finalizeBtnText}>Haftayı Bitir 🎉</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ═══ ADD MODAL ═══ */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
            <View style={s.modalHandle} />

            {/* Modal Header */}
            <View style={s.modalHeaderRow}>
              <View style={[s.modalIconBox, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="book" size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.modalTitle, { color: theme.text }]}>{selectedDay} İçin Ders Ekle</Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '500', marginTop: 2 }}>Ders seç veya konu yaz</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[s.modalCloseBtn, { backgroundColor: theme.background }]}>
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Section: Ders Seç */}
              <View style={s.sectionLabel}>
                <Ionicons name="school-outline" size={14} color={theme.textSecondary} />
                <Text style={[s.sectionLabelText, { color: theme.textSecondary }]}>DERS SEÇ</Text>
              </View>
              <View style={s.lessonGrid}>
                {LESSON_PRESETS.map((l) => {
                  const active = taskName === l.name;
                  return (
                    <TouchableOpacity
                      key={l.name}
                      style={[s.lessonChip, active ? { backgroundColor: l.color, borderColor: l.color } : { borderColor: theme.border, backgroundColor: theme.background }]}
                      onPress={() => setTaskName(l.name)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.lessonChipIcon, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : l.color + '15' }]}>
                        <Ionicons name={l.icon as any} size={14} color={active ? '#fff' : l.color} />
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : theme.text }}>{l.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Topic Input */}
              <View style={s.sectionLabel}>
                <Ionicons name="create-outline" size={14} color={theme.textSecondary} />
                <Text style={[s.sectionLabelText, { color: theme.textSecondary }]}>VEYA KONU YAZ</Text>
              </View>
              <TextInput
                style={[s.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Örn: Türev, Osmanlı Tarihi..."
                placeholderTextColor={theme.textSecondary + '80'}
                value={taskName}
                onChangeText={setTaskName}
              />

              {/* Section: Süre */}
              <View style={s.sectionLabel}>
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text style={[s.sectionLabelText, { color: theme.textSecondary }]}>ÇALIŞMA SÜRESİ</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 14 }}>
                <View style={s.durationRow}>
                  {DURATION_PRESETS.map((d) => {
                    const active = duration === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[s.durationChip, active ? { backgroundColor: '#3B82F6', borderColor: '#3B82F6' } : { borderColor: theme.border, backgroundColor: theme.background }]}
                        onPress={() => setDuration(d)}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : theme.text }}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Section: Soru Hedefi */}
              <View style={s.sectionLabel}>
                <Ionicons name="pencil-outline" size={14} color={theme.textSecondary} />
                <Text style={[s.sectionLabelText, { color: theme.textSecondary }]}>SORU HEDEFİ (Opsiyonel)</Text>
              </View>
              <View style={s.questionInputRow}>
                <TouchableOpacity onPress={() => setQuestions(String(Math.max(0, (parseInt(questions) || 0) - 5)))} style={[s.qStepBtn, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Ionicons name="remove" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
                <TextInput
                  style={[s.qBigInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary + '60'}
                  value={questions}
                  onChangeText={setQuestions}
                />
                <TouchableOpacity onPress={() => setQuestions(String((parseInt(questions) || 0) + 5))} style={[s.qStepBtn, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Ionicons name="add" size={18} color={theme.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginLeft: 8 }}>Soru</Text>
              </View>

              {/* Preview Card */}
              {taskName.length > 0 && (
                <View style={[s.previewCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: theme.border }]}>
                  <Ionicons name="eye-outline" size={14} color={theme.textSecondary} />
                  <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '600' }}>Önizleme:</Text>
                  <Text style={{ fontSize: 13, color: theme.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    {taskName} • {duration} {questions && parseInt(questions) > 0 ? `• ${questions} Soru` : ''}
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={s.modalBtns}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={[s.modalCancelBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
                  <Ionicons name="close-outline" size={18} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveTask} style={[{ flex: 1, borderRadius: 16, overflow: 'hidden', opacity: taskName.length > 0 ? 1 : 0.5 }]} disabled={!taskName}>
                  <LinearGradient colors={['#3B82F6', '#2563EB']} style={s.modalSaveGrad}>
                    <Ionicons name="add-circle" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Programa Ekle</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ FAB ═══ */}
      {isEditMode && (
        <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <LinearGradient colors={['#3B82F6', '#2563EB']} style={s.fabGrad}>
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: Platform.OS === 'ios' ? 10 : 40, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginTop: 2 },

  miniStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginTop: 14 },
  miniStatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  miniStatVal: { color: '#fff', fontSize: 13, fontWeight: '800' },
  miniStatLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' },
  miniStatDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Tabs
  tabContainer: { paddingVertical: 12 },
  tabScroll: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  tabPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, alignItems: 'center' },
  tabText: { fontSize: 13 },
  tabDot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },

  scrollContent: { padding: 20, paddingTop: 4, paddingBottom: 120 },

  // Progress Card
  progressCard: { padding: 18, borderRadius: 22, marginBottom: 18, overflow: 'hidden' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  progressTitle: { fontSize: 16, fontWeight: '800' },
  progressSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  percentCircle: { width: 52, height: 52, borderRadius: 16, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center' },
  percentText: { fontWeight: '900', fontSize: 13 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Day Header
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 4 },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayTitle: { fontSize: 18, fontWeight: '800', flex: 1 },
  dayCount: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

  // Edit Card
  editCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, marginBottom: 10, gap: 10, overflow: 'hidden' },
  editAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  editTaskName: { fontWeight: '700', fontSize: 15 },
  editMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  editTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  editDeleteBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E215', justifyContent: 'center', alignItems: 'center' },

  // Empty
  emptyBox: { padding: 32, borderRadius: 22, alignItems: 'center', gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Finalize
  finalizeBtn: { marginTop: 20, borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  finalizeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 10 },
  finalizeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // FAB
  fab: { position: 'absolute', bottom: 30, right: 24, borderRadius: 18, elevation: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGrad: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingHorizontal: 24, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingRight: 4 },
  modalIconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modalInput: { height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, marginBottom: 14, fontSize: 14, fontWeight: '500' },

  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginTop: 6 },
  sectionLabelText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  lessonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  lessonChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, borderWidth: 1.5 },
  lessonChipIcon: { width: 26, height: 26, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },

  durationRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  durationChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },

  questionInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qStepBtn: { width: 40, height: 40, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  qBigInput: { width: 64, height: 44, borderRadius: 14, borderWidth: 1.5, textAlign: 'center', fontSize: 18, fontWeight: '900', marginHorizontal: 10, padding: 0 },

  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 16 },

  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 20 },
  modalCancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16 },
  modalSaveGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
});

export default ProgramView;