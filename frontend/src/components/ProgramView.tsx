import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DayFolder } from './DayFolder';
import { COLORS, GUNLER } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

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

  const handleSaveTask = () => {
    if (!taskName) return;

    const newTask = {
      gun: selectedDay,
      task: taskName,
      duration: duration || "1 Saat",
      questions: parseInt(questions) || 0,
      completed: false
    };

    onAddTask(newTask);
    setTaskName('');
    setQuestions('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1A1A2E', '#16213E'] : ['#6C3CE1', '#4A1DB5']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{isEditMode ? "Programımı Tasarla" : "Ödevlerim"}</Text>
          <Text style={styles.headerSubTitle}>{isEditMode ? "Kendi haftalık planını oluştur" : "Öğretmenin atadığı program"}</Text>
        </View>
      </LinearGradient>

      {/* Gün Tabları - Pill Style */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {GUNLER.map((gun) => (
            <TouchableOpacity
              key={gun}
              onPress={() => setSelectedDay(gun)}
              style={[
                styles.tabPill,
                selectedDay === gun && { backgroundColor: theme.primary }
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                { color: selectedDay === gun ? '#fff' : theme.textSecondary },
                selectedDay === gun && { fontWeight: '700' }
              ]}>
                {gun.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* İstatistik Kartı */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
          <View style={styles.statsInfo}>
            <View>
              <Text style={[styles.statsTitle, { color: theme.text }]}>Haftalık Durum</Text>
              <Text style={[styles.statsSub, { color: theme.textSecondary }]}>
                {completedTasks} / {totalTasks} Görev Tamamlandı
              </Text>
            </View>
            <View style={[styles.progressCircle, { borderColor: theme.primary }]}>
              <Text style={[styles.progressText, { color: theme.primary }]}>%{weeklyProgress}</Text>
            </View>
          </View>
          {/* Mini progress bar */}
          <View style={[styles.miniProgressTrack, { backgroundColor: theme.primary + '15' }]}>
            <View style={[styles.miniProgressFill, { width: `${weeklyProgress}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>

        {/* Görev Listesi */}
        <View style={styles.dayView}>
          <Text style={[styles.dayTitle, { color: theme.text }]}>{selectedDay} Listesi</Text>
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

          {/* Edit mode'da basit task listesi (DayFolder yerine silme butonlu) */}
          {isEditMode && tasks
            .map((t: any, idx: number) => ({ ...t, originalIndex: idx }))
            .filter((t: any) => t.gun.toLowerCase() === selectedDay.toLowerCase())
            .map((task: any) => (
              <View key={`edit-${task.originalIndex}`} style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 10 }, theme.cardShadow]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>{task.task}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>{task.duration}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onDeleteTask && onDeleteTask(task.originalIndex)}
                  style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          }

          {tasks.filter((t: any) => t.gun.toLowerCase() === selectedDay.toLowerCase()).length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: theme.surface }, theme.cardShadow]}>
              <Ionicons name="add-circle-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Bu güne henüz ders eklemedin.</Text>
            </View>
          )}
        </View>

        {onFinalize && tasks.length > 0 && selectedDay === 'Pazar' && (
          <TouchableOpacity
            style={styles.finalizeBtn}
            onPress={onFinalize}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.finalizeBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-done-circle-outline" size={24} color="#fff" />
              <Text style={styles.finalizeBtnText}>Haftayı Bitir 🎉</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedDay} İçin Ders Ekle</Text>

            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Ders veya Konu Adı"
              placeholderTextColor={theme.textSecondary}
              value={taskName}
              onChangeText={setTaskName}
            />

            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginRight: 10, color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Süre (Örn: 2 Saat)"
                placeholderTextColor={theme.textSecondary}
                value={duration}
                onChangeText={setDuration}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1, color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Soru Hedefi"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
                value={questions}
                onChangeText={setQuestions}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveTask} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Programa Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FAB */}
      {isEditMode && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: { marginRight: 15, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSubTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2, fontWeight: '500' },

  tabContainer: { paddingVertical: 12 },
  tabScroll: { paddingHorizontal: 15, alignItems: 'center', gap: 8 },
  tabPill: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
  },
  tabText: { fontSize: 13 },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  statsCard: { padding: 18, borderRadius: 20, marginBottom: 20 },
  statsInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsTitle: { fontSize: 16, fontWeight: '700' },
  statsSub: { fontSize: 11, marginTop: 3, fontWeight: '500' },
  progressCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontWeight: '800', fontSize: 12 },
  miniProgressTrack: { height: 4, borderRadius: 2, marginTop: 14, overflow: 'hidden' },
  miniProgressFill: { height: '100%', borderRadius: 2 },

  dayView: { marginTop: 5 },
  dayTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, marginLeft: 5 },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40, borderRadius: 20 },
  emptyText: { textAlign: 'center', marginTop: 12, fontSize: 14, lineHeight: 20, fontWeight: '500' },

  fab: {
    position: 'absolute', bottom: 30, right: 30, width: 58, height: 58,
    borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#6C3CE1', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 25, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  modalInput: { height: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, marginBottom: 14, fontSize: 15 },
  modalRow: { flexDirection: 'row' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
  cancelBtn: { padding: 15 },
  saveBtn: { paddingVertical: 15, paddingHorizontal: 25, borderRadius: 14 },

  finalizeBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  finalizeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  finalizeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 10 }
});

export default ProgramView;