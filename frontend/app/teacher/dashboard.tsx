import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import { API_URL } from '../../src/config/api';

// Tip Tanımlamaları
interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
  status?: string; // pending | approved
  class_id?: string | null;
}

interface ClassItem {
  id: string;
  name: string;
}

interface Analiz {
  id: number;
  ad: string;
  net: string;
  tarih: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]); // Sınıflar
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<any>(null);

  // Filtered Lists
  const pendingStudents = students.filter(s => s.status === 'pending');
  const approvedStudents = students.filter(s => s.status !== 'pending');

  // Detay Modalı için State'ler
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAnaliz, setStudentAnaliz] = useState<Analiz[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Class Management States
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [assignClassModal, setAssignClassModal] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState<Student | null>(null);

  useEffect(() => {
    // Teacher verisini sessionStorage'dan oku
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('teacher_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          setTeacherData(parsed);
          fetchData(parsed.id);
          return;
        }
      }
    } catch (e) { /* ignore */ }
    // Giriş yapılmamışsa login'e yönlendir
    router.replace('/teacher/login');
  }, []);

  const fetchData = async (institutionId: string) => {
    setLoading(true);
    await Promise.all([fetchStudents(institutionId), fetchClasses(institutionId)]);
    setLoading(false);
  };

  const fetchStudents = async (institutionId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/students/${institutionId}`);
      const data = await response.json();
      if (Array.isArray(data)) setStudents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClasses = async (institutionId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/classes/${institutionId}`);
      const data = await response.json();
      if (Array.isArray(data)) setClasses(data);
    } catch (error) {
      console.error(error);
    }
  };

  const approveStudent = async (studentId: string) => {
    try {
      const res = await fetch(`${API_URL}/teacher/approve-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      if (res.ok) {
        // Listeyi güncelle
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'approved' } : s));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createClass = async () => {
    if (!newClassName || !teacherData?.id) return;
    try {
      const res = await fetch(`${API_URL}/teacher/create-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institution_id: teacherData.id, name: newClassName }),
      });
      const data = await res.json();
      if (data.id) {
        setClasses(prev => [...prev, data]);
        setNewClassName("");
        setShowClassModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const assignClassToStudent = async (classId: string | null) => {
    if (!studentToAssign) return;
    try {
      const res = await fetch(`${API_URL}/teacher/assign-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentToAssign.id, class_id: classId }),
      });
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === studentToAssign.id ? { ...s, class_id: classId } : s));
        setAssignClassModal(false);
        setStudentToAssign(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Öğrenci Detaylarını Getir (Analizler)
  const openStudentDetail = async (student: Student) => {
    setSelectedStudent(student);
    setModalVisible(true);
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_URL}/analizler/${student.id}`);
      const data = await response.json();
      setStudentAnaliz(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setStudentAnaliz([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students');

  const renderStudentRow = ({ item, index }: { item: Student, index: number }) => (
    <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
      <View style={{ flex: 0.5, justifyContent: 'center' }}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={[styles.cell, { fontWeight: 'bold' }]}>{item.name}</Text>
        {item.status === 'pending' && <Text style={styles.pendingBadge}>Onay Bekliyor</Text>}
      </View>
      <Text style={[styles.cell, { flex: 3 }]}>{item.email}</Text>

      {/* Sınıf Sütunu */}
      <View style={{ flex: 1.5, justifyContent: 'center' }}>
        <TouchableOpacity
          style={styles.classBadge}
          onPress={() => { setStudentToAssign(item); setAssignClassModal(true); }}
        >
          <Text style={styles.classBadgeText}>
            {classes.find(c => c.id === item.class_id)?.name || "Sınıf Yok +"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1.5, flexDirection: 'row', gap: 5, justifyContent: 'center' }}>
        {item.status === 'pending' ? (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#27ae60' }]} onPress={() => approveStudent(item.id)}>
            <Text style={styles.actionBtnText}>Onayla</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => openStudentDetail(item)}>
            <Text style={styles.actionBtnText}>İncele</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderClassesTab = () => (
    <View style={styles.content}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Text style={styles.sectionTitle}>Sınıflar</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowClassModal(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Yeni Sınıf</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.classGrid}>
        {classes.map(c => (
          <View key={c.id} style={styles.classCard}>
            <View style={styles.classHeader}>
              <Ionicons name="people" size={24} color={COLORS.light.primary} />
              <Text style={styles.className}>{c.name}</Text>
            </View>
            <Text style={styles.classCount}>
              {students.filter(s => s.class_id === c.id).length} Öğrenci
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.brandContainer}>
          <Ionicons name="school" size={32} color="#fff" />
          <Text style={styles.logo}>RC PANEL</Text>
        </View>

        <TouchableOpacity
          style={activeTab === 'students' ? styles.menuItemActive : styles.menuItem}
          onPress={() => setActiveTab('students')}
        >
          <Ionicons name="people" size={20} color={activeTab === 'students' ? "#fff" : "#bdc3c7"} style={styles.menuIcon} />
          <Text style={activeTab === 'students' ? styles.menuTextActive : styles.menuText}>Öğrenciler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={activeTab === 'classes' ? styles.menuItemActive : styles.menuItem}
          onPress={() => setActiveTab('classes')}
        >
          <Ionicons name="library" size={20} color={activeTab === 'classes' ? "#fff" : "#bdc3c7"} style={styles.menuIcon} />
          <Text style={activeTab === 'classes' ? styles.menuTextActive : styles.menuText}>Sınıflar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/teacher/assignments')}>
          <Ionicons name="create" size={20} color="#bdc3c7" style={styles.menuIcon} />
          <Text style={styles.menuText}>Ödev Atama</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/teacher/login')}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" style={styles.menuIcon} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* Ana İçerik */}
      <View style={styles.main}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'students' ? 'Öğrenci Yönetimi' : 'Sınıf Yönetimi'}
          </Text>
          <View style={styles.headerRight}>
            {pendingStudents.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#fae3d9' }]}>
                <Text style={[styles.badgeText, { color: '#e74c3c' }]}>{pendingStudents.length} Onay Bekliyor</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{students.length} Öğrenci</Text>
            </View>
            <View style={styles.profileIcon}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{teacherData?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'ÖĞ'}</Text>
            </View>
          </View>
        </View>

        {activeTab === 'classes' ? renderClassesTab() : (
          <View style={styles.content}>
            {/* Pending Approvals Alert */}
            {pendingStudents.length > 0 && (
              <View style={styles.pendingAlert}>
                <Ionicons name="alert-circle" size={24} color="#e67e22" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.pendingTitle}>{pendingStudents.length} yeni öğrenci onayı bekliyor</Text>
                  <Text style={styles.pendingDesc}>Öğrencilerin sisteme erişebilmesi için onaylamanız gerekir.</Text>
                </View>
              </View>
            )}

            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 0.5 }]}>#</Text>
                <Text style={[styles.headerCell, { flex: 2 }]}>Ad Soyad</Text>
                <Text style={[styles.headerCell, { flex: 3 }]}>E-Posta</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>Sınıf</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>İşlem</Text>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color={COLORS.light.primary} style={{ margin: 50 }} />
              ) : (
                <FlatList
                  data={[...pendingStudents, ...approvedStudents]}
                  keyExtractor={(item) => item.id}
                  renderItem={renderStudentRow}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
            </View>
          </View>
        )}
      </View>

      {/* ÖĞRENCİ DETAY MODALI */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedStudent?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            {/* Mevcut içerik... */}
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.studentSummary}>
                <Text style={styles.summaryLabel}>Sınıf:</Text>
                <Text style={styles.summaryValue}>{classes.find(c => c.id === selectedStudent?.class_id)?.name || "Atanmamış"}</Text>
              </View>
              <Text style={styles.sectionTitle}>Analizler</Text>
              {studentAnaliz.map((a, i) => <Text key={i}>{a.ad}: {a.net}</Text>)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CREATE CLASS MODAL */}
      <Modal visible={showClassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 400 }]}>
            <Text style={styles.modalTitle}>Yeni Sınıf Oluştur</Text>
            <TextInput
              style={styles.input}
              placeholder="Sınıf Adı (Örn: 12-A)"
              value={newClassName}
              onChangeText={setNewClassName}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowClassModal(false)}>
                <Text style={styles.closeBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { marginLeft: 10 }]} onPress={createClass}>
                <Text style={styles.actionBtnText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ASSIGN CLASS MODAL */}
      <Modal visible={assignClassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 400 }]}>
            <Text style={styles.modalTitle}>Sınıf Atama: {studentToAssign?.name}</Text>
            <ScrollView style={{ maxHeight: 300, marginVertical: 15 }}>
              <TouchableOpacity
                style={[styles.classOption, !studentToAssign?.class_id && styles.classOptionActive]}
                onPress={() => assignClassToStudent(null)}
              >
                <Text style={[styles.classOptionText, !studentToAssign?.class_id && { color: '#fff' }]}>Sınıfsız</Text>
              </TouchableOpacity>
              {classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.classOption, studentToAssign?.class_id === c.id && styles.classOptionActive]}
                  onPress={() => assignClassToStudent(c.id)}
                >
                  <Text style={[styles.classOptionText, studentToAssign?.class_id === c.id && { color: '#fff' }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAssignClassModal(false)}>
              <Text style={styles.closeBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f4f6f8' },
  sidebar: { width: 250, backgroundColor: '#2c3e50', paddingVertical: 30, paddingHorizontal: 20 },
  brandContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, gap: 10 },
  logo: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 5, borderRadius: 8 },
  menuItemActive: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 5, borderRadius: 8, backgroundColor: COLORS.light.primary },
  menuIcon: { marginRight: 10 },
  menuText: { color: '#bdc3c7', fontSize: 14 },
  menuTextActive: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  logoutText: { color: '#e74c3c', marginLeft: 10, fontWeight: 'bold' },

  main: { flex: 1 },
  header: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  badge: { backgroundColor: '#e3f2fd', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  badgeText: { color: '#1976d2', fontWeight: 'bold', fontSize: 12 },
  profileIcon: { width: 35, height: 35, borderRadius: 17.5, backgroundColor: COLORS.light.primary, justifyContent: 'center', alignItems: 'center' },

  content: { padding: 30 },
  tableCard: { backgroundColor: '#fff', borderRadius: 8, padding: 0, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8f9fa', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerCell: { fontWeight: 'bold', color: '#555', fontSize: 13 },
  tableRow: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  cell: { color: '#333', fontSize: 14 },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: '#555' },
  actionBtn: { backgroundColor: COLORS.light.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // New Styles
  pendingAlert: { flexDirection: 'row', backgroundColor: '#fff3cd', padding: 15, borderRadius: 8, marginBottom: 20, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#f39c12' },
  pendingTitle: { fontWeight: 'bold', color: '#e67e22', fontSize: 15 },
  pendingDesc: { color: '#d35400', fontSize: 13 },
  pendingBadge: { fontSize: 10, color: '#e67e22', backgroundColor: '#fff3cd', padding: 4, borderRadius: 4, transform: [{ scale: 0.9 }], marginLeft: 5 },

  // Class Styles
  classBadge: { backgroundColor: '#eef2f7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  classBadgeText: { fontSize: 12, color: '#34495e', fontWeight: '600' },
  addBtn: { flexDirection: 'row', backgroundColor: COLORS.light.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, alignItems: 'center', gap: 5 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  classCard: { width: 220, height: 120, backgroundColor: '#fff', borderRadius: 12, padding: 20, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  classHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  className: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  classCount: { color: '#7f8c8d', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 500, backgroundColor: '#fff', borderRadius: 12, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  studentSummary: { flexDirection: 'row', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  summaryLabel: { fontWeight: 'bold', marginRight: 10, color: '#555' },
  summaryValue: { color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#2c3e50' },
  modalFooter: { marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  closeBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#eee', borderRadius: 6 },
  closeBtnText: { color: '#333', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
  classOption: { padding: 12, borderRadius: 6, marginBottom: 5, backgroundColor: '#f8f9fa' },
  classOptionActive: { backgroundColor: COLORS.light.primary },
  classOptionText: { fontSize: 15, color: '#333' }
});