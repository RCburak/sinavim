import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GUNLER } from '../../src/constants/theme';
import { API_URL } from '../../src/config/api';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('teacher_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

interface Student {
  id: string;
  name: string;
  email: string;
  class_id?: string | null;
}

interface ClassItem {
  id: string;
  name: string;
}

// Basit Program Item yapısı
interface ProgramItem {
  id: number;
  day: string;
  subject: string;
  topic: string;
  questionCount: string;
}

export default function AssignmentBuilder() {
  const router = useRouter();

  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<any>(null);

  // Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [activeClassFilter, setActiveClassFilter] = useState<string>('ALL');

  // Program Builder State
  const [selectedDay, setSelectedDay] = useState(GUNLER[0]);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState('');
  const [programList, setProgramList] = useState<ProgramItem[]>([]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('teacher_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          setTeacherData(parsed);
          const institutionId = parsed.admin_id || parsed.id;
          fetchData(institutionId);
          return;
        }
      }
    } catch (e) { /* ignore */ }
    router.replace('/staff/login');
  }, []);

  const fetchData = async (institutionId: string) => {
    setLoading(true);
    await Promise.all([fetchStudents(institutionId), fetchClasses(institutionId)]);
    setLoading(false);
  };

  const fetchStudents = async (institutionId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/students/${institutionId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) setStudents(data.filter((s: any) => s.status !== 'pending'));
    } catch (error) { console.error(error); }
  };

  const fetchClasses = async (institutionId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/classes/${institutionId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) setClasses(data);
    } catch (error) { console.error(error); }
  };

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
      // Deselect all
      setSelectedStudentIds(prev => prev.filter(id => !idsInFilter.includes(id)));
    } else {
      // Select all
      const unique = new Set([...selectedStudentIds, ...idsInFilter]);
      setSelectedStudentIds(Array.from(unique));
    }
  };

  const addToProgram = () => {
    if (!subject || !topic || !questionCount) {
      showAlert("Eksik Bilgi", "Lütfen ders, konu ve soru sayısını girin.");
      return;
    }
    const newItem: ProgramItem = {
      id: Date.now(),
      day: selectedDay,
      subject,
      topic,
      questionCount
    };
    setProgramList([...programList, newItem]);
    setSubject('');
    setTopic('');
    setQuestionCount('');
  };

  const removeFromProgram = (id: number) => {
    setProgramList(prev => prev.filter(item => item.id !== id));
  };

  const sendProgram = async () => {
    if (selectedStudentIds.length === 0) { showAlert("Hata", "Lütfen en az bir öğrenci seçin."); return; }
    if (programList.length === 0) { showAlert("Hata", "Program listesi boş."); return; }

    let successCount = 0;

    // Basit batch loop (Backend'de batch endpoint olmalı)
    for (const studentId of selectedStudentIds) {
      try {
        const response = await fetch(`${API_URL}/teacher/assign-program`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            student_id: studentId,
            program: programList
          })
        });
        if (response.ok) successCount++;
      } catch (e) { console.error(e); }
    }

    if (successCount > 0) {
      showAlert("Başarılı", `${successCount} öğrenciye program gönderildi!`);
      setProgramList([]);
      setSelectedStudentIds([]);
    } else {
      showAlert("Hata", "Gönderim başarısız oldu.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.sidebar}>
        <View style={styles.brand}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandText}>RC</Text>
          </View>
          <Text style={styles.brandTitle}>Öğretmen Paneli</Text>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/teacher/dashboard')}>
          <Ionicons name="people-outline" size={20} color="#9CA3AF" />
          <Text style={styles.menuText}>Öğrenciler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/teacher/dashboard')}>
          <Ionicons name="layers-outline" size={20} color="#9CA3AF" />
          <Text style={styles.menuText}>Sınıflar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={[styles.menuText, styles.menuTextActive]}>Ödev Atama</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <View style={styles.userProfile}>
          <LinearGradient colors={['#4B5563', '#374151']} style={styles.userAvatar}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {teacherData?.name?.slice(0, 1).toUpperCase() || 'T'}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{teacherData?.name || 'Öğretmen'}</Text>
            <Text style={styles.userRole}>Eğitmen</Text>
          </View>
          <TouchableOpacity onPress={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('teacher_data');
              sessionStorage.removeItem('teacher_token');
            }
            router.replace('/staff/login');
          }}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content - 2 Panes */}
      <View style={styles.main}>
        {/* Left Pane: Student Selection */}
        <View style={styles.leftPane}>
          <View style={styles.paneHeader}>
            <Text style={styles.paneTitle}>Öğrenci Seçimi</Text>
            <TouchableOpacity onPress={toggleSelectAllInFilter}>
              <Text style={styles.linkText}>
                {filteredStudents.every(s => selectedStudentIds.includes(s.id)) ? 'Seçimi Kaldır' : 'Tümünü Seç'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Class Filters */}
          <View style={styles.filterScrollContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterChip, activeClassFilter === 'ALL' && styles.filterChipActive]}
                onPress={() => setActiveClassFilter('ALL')}
              >
                <Text style={[styles.filterChipText, activeClassFilter === 'ALL' && styles.filterChipTextActive]}>Tümü</Text>
              </TouchableOpacity>
              {classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.filterChip, activeClassFilter === c.id && styles.filterChipActive]}
                  onPress={() => setActiveClassFilter(c.id)}
                >
                  <Text style={[styles.filterChipText, activeClassFilter === c.id && styles.filterChipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.light.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 10 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSelected = selectedStudentIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.studentCard, isSelected && styles.studentCardActive]}
                    onPress={() => toggleStudent(item.id)}
                  >
                    <View style={[styles.checkCircle, isSelected && { backgroundColor: COLORS.light.primary, borderColor: COLORS.light.primary }]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={styles.avatarMini}>
                      <Text style={styles.avatarTextMini}>{item.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.studentName, isSelected && { color: COLORS.light.primary }]}>{item.name}</Text>
                      <Text style={styles.studentClass}>
                        {classes.find(c => c.id === item.class_id)?.name || "Sınıfsız"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* Right Pane: Program Builder */}
        <View style={styles.rightPane}>
          <Text style={styles.paneTitle}>Program Oluştur</Text>

          <View style={styles.formContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {GUNLER.map((gun) => (
                <TouchableOpacity
                  key={gun}
                  style={[styles.dayChip, selectedDay === gun && styles.dayChipActive]}
                  onPress={() => setSelectedDay(gun)}
                >
                  <Text style={[styles.dayChipText, selectedDay === gun && styles.dayChipTextActive]}>{gun}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Ders (Örn: Matematik)"
                value={subject} onChangeText={setSubject}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Soru Sayısı"
                keyboardType="numeric"
                value={questionCount} onChangeText={setQuestionCount}
              />
            </View>
            <TextInput
              style={[styles.input, { marginBottom: 15 }]}
              placeholder="Konu (Örn: Türev)"
              value={topic} onChangeText={setTopic}
            />

            <TouchableOpacity style={styles.addBtn} onPress={addToProgram}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Listeye Ekle</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Program Önizleme ({programList.length})</Text>
              {programList.length > 0 && (
                <TouchableOpacity onPress={() => setProgramList([])}>
                  <Text style={styles.clearText}>Temizle</Text>
                </TouchableOpacity>
              )}
            </View>

            {programList.length === 0 ? (
              <View style={styles.emptyPreview}>
                <Ionicons name="list-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Henüz ders eklenmedi.</Text>
              </View>
            ) : (
              <FlatList
                data={programList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.programItem}>
                    <View style={styles.programLeft}>
                      <Text style={styles.programDay}>{item.day}</Text>
                      <Text style={styles.programDetail}>{item.subject} - {item.topic}</Text>
                    </View>
                    <View style={styles.programRight}>
                      <View style={styles.programBadge}>
                        <Text style={styles.programBadgeText}>{item.questionCount} Soru</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFromProgram(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.selectionCount}>
              {selectedStudentIds.length} öğrenci seçildi
            </Text>
            <TouchableOpacity
              style={[styles.sendBtn, (selectedStudentIds.length === 0 || programList.length === 0) && { opacity: 0.5 }]}
              disabled={selectedStudentIds.length === 0 || programList.length === 0}
              onPress={sendProgram}
            >
              <Text style={styles.sendBtnText}>Programı Gönder</Text>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F3F4F6' },

  // SIDEBAR
  sidebar: { width: 260, paddingVertical: 30, paddingHorizontal: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, gap: 12 },
  brandLogo: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.light.primary, justifyContent: 'center', alignItems: 'center' },
  brandText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  brandTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },

  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 5, gap: 12 },
  menuItemActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  menuText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  menuTextActive: { color: '#fff', fontWeight: 'bold' },

  userProfile: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, gap: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  userName: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  userRole: { color: '#9CA3AF', fontSize: 11 },

  // MAIN LAYOUT
  main: { flex: 1, flexDirection: 'row', padding: 20, gap: 20 },

  leftPane: { flex: 4, backgroundColor: '#fff', borderRadius: 24, padding: 20, ...COLORS.light.cardShadow },
  rightPane: { flex: 3, backgroundColor: '#fff', borderRadius: 24, padding: 20, ...COLORS.light.cardShadow, display: 'flex', flexDirection: 'column' },

  // HEADERS
  paneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  paneTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 15 },
  linkText: { color: COLORS.light.primary, fontWeight: '600' },

  // FILTERS
  filterScrollContainer: { height: 50, marginBottom: 10 },
  filterContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  filterChipActive: { backgroundColor: COLORS.light.primary },
  filterChipText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },

  // STUDENT GRID
  studentCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', gap: 10 },
  studentCardActive: { backgroundColor: '#EFF6FF', borderColor: COLORS.light.primary },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  avatarTextMini: { fontWeight: 'bold', color: '#6B7280' },
  studentName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  studentClass: { fontSize: 12, color: '#6B7280' },

  // FORM
  formContainer: { marginBottom: 20 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6', marginRight: 8 },
  dayChipActive: { backgroundColor: COLORS.light.secondary },
  dayChipText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  dayChipTextActive: { color: '#fff' },

  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 14 },
  addBtn: { backgroundColor: COLORS.light.primary, borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },

  // PREVIEW
  previewContainer: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  clearText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },

  emptyPreview: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9CA3AF', marginTop: 10, fontSize: 13 },

  programItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3 },
  programLeft: { flex: 1 },
  programDay: { fontSize: 11, color: COLORS.light.primary, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase' },
  programDetail: { fontSize: 13, color: '#111827', fontWeight: '500' },
  programRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  programBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  programBadgeText: { fontSize: 11, color: '#4B5563', fontWeight: '600' },

  // FOOTER
  footer: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectionCount: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  sendBtn: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sendBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});