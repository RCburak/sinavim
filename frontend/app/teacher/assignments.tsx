import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import { API_URL } from '../../src/config/api';

interface Student {
  id: string;
  name: string;
  class_id?: string | null;
}

interface ClassItem {
  id: string;
  name: string;
}

interface ProgramItem {
  gun: string;
  task: string;
  duration: string;
  questions: string;
}

const GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function AssignmentBuilder() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // Selection States
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [activeClassFilter, setActiveClassFilter] = useState<string | 'ALL'>('ALL');

  // Form State
  const [selectedDay, setSelectedDay] = useState('Pazartesi');
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState('45 dk');
  const [questions, setQuestions] = useState('20');

  // Oluşturulan Program Listesi
  const [programList, setProgramList] = useState<ProgramItem[]>([]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('teacher_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          fetchData(parsed.id);
          return;
        }
      }
    } catch (e) { /* ignore */ }
    router.replace('/teacher/login');
  }, []);

  const fetchData = async (institutionId: string) => {
    await Promise.all([fetchStudents(institutionId), fetchClasses(institutionId)]);
  };

  const fetchStudents = async (institutionId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/students/${institutionId}`);
      const data = await response.json();
      if (Array.isArray(data)) setStudents(data);
    } catch (e) { console.error(e); }
  };

  const fetchClasses = async (institutionId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/classes/${institutionId}`);
      const data = await response.json();
      if (Array.isArray(data)) setClasses(data);
    } catch (error) { console.error(error); }
  };

  // Filter Logic
  const filteredStudents = activeClassFilter === 'ALL'
    ? students
    : students.filter(s => s.class_id === activeClassFilter);

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
    } else {
      setSelectedStudentIds(prev => [...prev, id]);
    }
  };

  const toggleSelectAllInFilter = () => {
    const idsInFilter = filteredStudents.map(s => s.id);
    const allSelected = idsInFilter.every(id => selectedStudentIds.includes(id));

    if (allSelected) {
      // Deselect all in current filter
      setSelectedStudentIds(prev => prev.filter(id => !idsInFilter.includes(id)));
    } else {
      // Select all in current filter
      const unique = new Set([...selectedStudentIds, ...idsInFilter]);
      setSelectedStudentIds(Array.from(unique));
    }
  };

  const addToProgram = () => {
    if (!task) { Alert.alert("Hata", "Lütfen ders/konu giriniz."); return; }

    const newItem: ProgramItem = {
      gun: selectedDay,
      task,
      duration,
      questions
    };

    setProgramList([...programList, newItem]);
    setTask('');
  };

  const removeFromProgram = (index: number) => {
    const newList = [...programList];
    newList.splice(index, 1);
    setProgramList(newList);
  };

  const sendProgram = async () => {
    if (selectedStudentIds.length === 0) { Alert.alert("Hata", "Lütfen en az bir öğrenci seçin."); return; }
    if (programList.length === 0) { Alert.alert("Hata", "Program listesi boş."); return; }

    let successCount = 0;

    // Basit bir batch gönderimi (Client-side loop)
    // Gerçek dünyada backend'de toplu işlem endpoint'i olmalı
    for (const studentId of selectedStudentIds) {
      try {
        const response = await fetch(`${API_URL}/teacher/assign-program`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            program: programList
          })
        });
        if (response.ok) successCount++;
      } catch (e) {
        console.error(e);
      }
    }

    if (successCount > 0) {
      Alert.alert("Başarılı", `${successCount} öğrenciye program gönderildi!`);
      setProgramList([]);
      setSelectedStudentIds([]);
    } else {
      Alert.alert("Hata", "Gönderim başarısız oldu.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar (Basit) */}
      <View style={styles.sidebar}>
        <Text style={styles.logo}>RC PANEL</Text>
        <TouchableOpacity onPress={() => router.push('/teacher/dashboard')} style={styles.menuItem}>
          <Ionicons name="people" size={20} color="#bdc3c7" />
          <Text style={styles.menuText}>Öğrenciler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItemActive}>
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.menuTextActive}>Program Yaz</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Haftalık Program Oluşturucu</Text>
        </View>

        <View style={styles.contentRow}>
          {/* SOL: Form Alanı */}
          <View style={styles.formPanel}>
            <Text style={styles.sectionTitle}>1. Öğrenci Seç</Text>

            {/* Sınıf Filtreleri */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classFilterScroll}>
              <TouchableOpacity
                style={[styles.filterChip, activeClassFilter === 'ALL' && styles.filterChipActive]}
                onPress={() => setActiveClassFilter('ALL')}
              >
                <Text style={[styles.filterText, activeClassFilter === 'ALL' && { color: '#fff' }]}>Tümü</Text>
              </TouchableOpacity>
              {classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.filterChip, activeClassFilter === c.id && styles.filterChipActive]}
                  onPress={() => setActiveClassFilter(c.id)}
                >
                  <Text style={[styles.filterText, activeClassFilter === c.id && { color: '#fff' }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.bulkActions}>
              <Text style={{ fontSize: 12, color: '#777' }}>{selectedStudentIds.length} seçili</Text>
              <TouchableOpacity onPress={toggleSelectAllInFilter}>
                <Text style={{ fontSize: 12, color: COLORS.light.primary, fontWeight: 'bold' }}>
                  {filteredStudents.every(s => selectedStudentIds.includes(s.id)) && filteredStudents.length > 0 ? "Seçimi Kaldır" : "Tümünü Seç"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.studentGridScroll}>
              <View style={styles.studentGrid}>
                {filteredStudents.map(s => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => toggleStudent(s.id)}
                    >
                      {isSelected && <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 5 }} />}
                      <Text style={[styles.chipText, isSelected && { color: '#fff', fontWeight: 'bold' }]}>{s.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.sectionTitle}>2. Ders Ekle</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gün:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {GUNLER.map(g => (
                  <TouchableOpacity key={g} onPress={() => setSelectedDay(g)} style={[styles.dayChip, selectedDay === g && styles.dayChipActive]}>
                    <Text style={[styles.dayText, selectedDay === g && { color: '#fff' }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Ders / Konu:</Text>
              <TextInput style={styles.input} value={task} onChangeText={setTask} placeholder="Örn: Matematik - Türev Test 1" />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Süre:</Text>
                  <TextInput style={styles.input} value={duration} onChangeText={setDuration} placeholder="45 dk" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Soru Sayısı:</Text>
                  <TextInput style={styles.input} value={questions} onChangeText={setQuestions} keyboardType="numeric" placeholder="20" />
                </View>
              </View>

              <TouchableOpacity style={styles.addBtn} onPress={addToProgram}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addBtnText}>Listeye Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SAĞ: Önizleme Listesi */}
          <View style={styles.previewPanel}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>3. Program Önizleme</Text>
              <TouchableOpacity style={styles.sendBtn} onPress={sendProgram}>
                <Text style={styles.sendBtnText}>Programı Gönder 🚀</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
              {programList.length === 0 ? (
                <Text style={styles.emptyText}>Henüz ders eklenmedi.</Text>
              ) : (
                <FlatList
                  data={programList}
                  keyExtractor={(_, i) => i.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.listItem}>
                      <View style={styles.listLeft}>
                        <Text style={styles.listDay}>{item.gun}</Text>
                        <Text style={styles.listTask}>{item.task}</Text>
                        <Text style={styles.listDetail}>{item.duration} • {item.questions} Soru</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFromProgram(index)}>
                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f5f6fa' },
  sidebar: { width: 80, backgroundColor: '#2c3e50', alignItems: 'center', paddingTop: 30 },
  logo: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginBottom: 30 },
  menuItem: { alignItems: 'center', marginBottom: 20, opacity: 0.6 },
  menuItemActive: { alignItems: 'center', marginBottom: 20, opacity: 1 },
  menuText: { color: '#fff', fontSize: 10, marginTop: 4 },
  menuTextActive: { color: '#fff', fontSize: 10, marginTop: 4, fontWeight: 'bold' },

  main: { flex: 1, padding: 20 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },

  contentRow: { flex: 1, flexDirection: 'row', gap: 20 },

  // SOL PANEL
  formPanel: { flex: 0.4, backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },

  // Filter Styles
  classFilterScroll: { marginBottom: 10, maxHeight: 40 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0f0f0', borderRadius: 8, marginRight: 8, height: 32, justifyContent: 'center' },
  filterChipActive: { backgroundColor: '#34495e' },
  filterText: { fontSize: 12, color: '#555' },

  bulkActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 },

  studentGridScroll: { maxHeight: 150, marginBottom: 20 },
  studentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#eee', borderRadius: 20 },
  chipActive: { backgroundColor: COLORS.light.primary },
  chipText: { fontSize: 13, color: '#333' },

  inputGroup: { gap: 10 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, backgroundColor: '#fafafa' },

  dayChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0f0f0', borderRadius: 6, marginRight: 6 },
  dayChipActive: { backgroundColor: '#34495e' },
  dayText: { fontSize: 12, color: '#555' },

  addBtn: { backgroundColor: '#27ae60', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginTop: 10 },
  addBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },

  // SAĞ PANEL
  previewPanel: { flex: 0.6, backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  sendBtn: { backgroundColor: COLORS.light.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },

  listContainer: { flex: 1, marginTop: 10, backgroundColor: '#fafafa', borderRadius: 8, padding: 10 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, marginBottom: 8, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: COLORS.light.primary },
  listLeft: { flex: 1 },
  listDay: { fontSize: 10, fontWeight: 'bold', color: '#999', textTransform: 'uppercase' },
  listTask: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  listDetail: { fontSize: 12, color: '#666' }
});