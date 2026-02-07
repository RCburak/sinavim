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
import { DayFolder } from './DayFolder';
import { COLORS, GUNLER } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// isEditMode, onAddTask ve onFinalize propları Index.tsx'den geliyor
export const ProgramView = ({ tasks, toggleTask, updateQuestions, onBack, onAddTask, onFinalize, theme = COLORS.light, isEditMode = false }: any) => {
  const [selectedDay, setSelectedDay] = useState(GUNLER[0]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State'leri
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState('1 Saat');
  const [questions, setQuestions] = useState('');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const weeklyProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleSaveTask = () => {
    if (!taskName) return;
    
    const newTask = {
      gun: selectedDay,
      task: taskName,
      duration: duration || "1 Saat",
      questions: parseInt(questions) || 0,
      completed: false
    };

    onAddTask(newTask); // Index.tsx'e veriyi gönderir (Sadece yerel state güncellenir)
    setTaskName('');
    setQuestions('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.background === '#121212' ? "light-content" : "dark-content"} />
      
      {/* Header Kısmı */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{isEditMode ? "Programımı Tasarla" : "Çalışma Masam"}</Text>
          <Text style={styles.headerSubTitle}>{isEditMode ? "Kendi haftalık planını oluştur" : "Bugün ne yapıyoruz?"}</Text>
        </View>
      </View>

      {/* Gün Tabları */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {GUNLER.map((gun) => (
            <TouchableOpacity 
              key={gun} 
              onPress={() => setSelectedDay(gun)}
              style={[
                styles.tabItem, 
                selectedDay === gun && { borderBottomColor: theme.primary, borderBottomWidth: 3 }
              ]}
            >
              <Text style={[
                styles.tabText, 
                { color: selectedDay === gun ? theme.primary : theme.textSecondary },
                selectedDay === gun && { fontWeight: 'bold' }
              ]}>
                {gun.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* İstatistik Kartı */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
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
          
          {tasks.filter((t: any) => t.gun.toLowerCase() === selectedDay.toLowerCase()).length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="add-circle-outline" size={50} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Bu güne henüz ders eklemedin. Aşağıdaki butondan ekleyebilirsin.</Text>
            </View>
          )}
        </View>

        {/* --- DÜZELTİLEN BÖLÜM: SADECE PAZAR GÜNÜ GÖRÜNEN BUTON --- */}
        {isEditMode && tasks.length > 0 && selectedDay === 'Pazar' && (
          <TouchableOpacity 
            style={[styles.finalizeBtn, { backgroundColor: '#27ae60' }]} 
            onPress={onFinalize}
          >
            <Ionicons name="checkmark-done-circle-outline" size={24} color="#fff" />
            <Text style={styles.finalizeBtnText}>Haftayı Onayla ve Bitir</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* --- MANUEL EKLEME MODALI --- */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedDay} İçin Ders Ekle</Text>
            
            <TextInput 
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Ders veya Konu Adı"
              placeholderTextColor="#999"
              value={taskName}
              onChangeText={setTaskName}
            />

            <View style={styles.modalRow}>
              <TextInput 
                style={[styles.modalInput, { flex: 1, marginRight: 10, color: theme.text, borderColor: theme.border }]}
                placeholder="Süre (Örn: 2 Saat)"
                placeholderTextColor="#999"
                value={duration}
                onChangeText={setDuration}
              />
              <TextInput 
                style={[styles.modalInput, { flex: 1, color: theme.text, borderColor: theme.border }]}
                placeholder="Soru Hedefi"
                keyboardType="numeric"
                placeholderTextColor="#999"
                value={questions}
                onChangeText={setQuestions}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: theme.textSecondary }}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveTask} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Programa Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- YÜZEN EKLEME BUTONU (FAB) --- */}
      {isEditMode && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: theme.primary }]} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={32} color="#fff" />
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backBtn: { marginRight: 15 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSubTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  tabContainer: { height: 60, elevation: 2 },
  tabScroll: { paddingHorizontal: 15, alignItems: 'center' },
  tabItem: { paddingHorizontal: 20, height: '100%', justifyContent: 'center' },
  tabText: { fontSize: 14 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  statsCard: { padding: 15, borderRadius: 20, marginBottom: 20, elevation: 3 },
  statsInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsTitle: { fontSize: 16, fontWeight: 'bold' },
  statsSub: { fontSize: 11, marginTop: 2 },
  progressCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontWeight: 'bold', fontSize: 12 },
  dayView: { marginTop: 5 },
  dayTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', marginTop: 15, fontSize: 13, lineHeight: 18 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, elevation: 8, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modalInput: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15 },
  modalRow: { flexDirection: 'row' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { padding: 15, marginRight: 10 },
  saveBtn: { paddingVertical: 15, paddingHorizontal: 25, borderRadius: 12 },
  finalizeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20, 
    padding: 18, 
    borderRadius: 15, 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  finalizeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});

export default ProgramView;