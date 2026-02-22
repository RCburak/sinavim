import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../src/constants/theme';
import { API_URL } from '../../src/config/api';

const { width } = Dimensions.get('window');

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('teacher_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

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
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<any>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered Lists
  const pendingStudents = students.filter(s => s.status === 'pending');
  const approvedStudents = students.filter(s => s.status !== 'pending');

  // Search Logic
  const filteredApproved = approvedStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Detay Modalı State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAnaliz, setStudentAnaliz] = useState<Analiz[]>([]);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Class Management States
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [assignClassModal, setAssignClassModal] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState<Student | null>(null);

  const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students');

  // Class Detail State
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [addStudentModalVisible, setAddStudentModalVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('teacher_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Rehber öğretmen ise rehber panele yönlendir
          if (parsed.teacher_type === 'rehber') {
            router.replace('/teacher/rehber-dashboard');
            return;
          }
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
      if (Array.isArray(data)) setStudents(data);
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

  const approveStudent = async (studentId: string) => {
    try {
      const res = await fetch(`${API_URL}/teacher/approve-student`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ student_id: studentId }),
      });
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'approved' } : s));
      }
    } catch (e) { console.error(e); }
  };

  const rejectStudent = async (studentId: string) => {
    try {
      const res = await fetch(`${API_URL}/leave-institution`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: studentId }),
      });
      if (res.ok) {
        setStudents(prev => prev.filter(s => s.id !== studentId));
      }
    } catch (e) { console.error(e); }
  };

  const createClass = async () => {
    const instId = teacherData?.admin_id || teacherData?.id;
    if (!newClassName || !instId) return;
    try {
      const res = await fetch(`${API_URL}/teacher/create-class`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ institution_id: instId, name: newClassName }),
      });
      const data = await res.json();
      if (data.id) {
        setClasses(prev => [...prev, data]);
        setNewClassName("");
        setShowClassModal(false);
      }
    } catch (e) { console.error(e); }
  };

  const assignClassToStudent = async (classId: string | null, studentId?: string) => {
    const targetStudentId = studentId || studentToAssign?.id;
    if (!targetStudentId) return;

    try {
      const res = await fetch(`${API_URL}/teacher/assign-class`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ student_id: targetStudentId, class_id: classId }),
      });
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === targetStudentId ? { ...s, class_id: classId } : s));
        setAssignClassModal(false);
        setStudentToAssign(null);
      }
    } catch (e) { console.error(e); }
  };

  const deleteClass = async (classId: string, className: string) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`"${className}" sınıfını silmek istediğinize emin misiniz? Öğrencilerin sınıf ataması kaldırılacak.`)
      : true;
    if (!confirmed) return;
    try {
      const instId = teacherData?.admin_id || teacherData?.id;
      const res = await fetch(`${API_URL}/teacher/delete-class`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ institution_id: instId, class_id: classId }),
      });
      if (res.ok) {
        setClasses(prev => prev.filter(c => c.id !== classId));
        setStudents(prev => prev.map(s => s.class_id === classId ? { ...s, class_id: null } : s));
        if (selectedClass?.id === classId) setSelectedClass(null);
      }
    } catch (e) { console.error(e); }
  };

  const openStudentDetail = async (student: Student) => {
    setSelectedStudent(student);
    setModalVisible(true);
    setLoadingDetail(true);
    try {
      const [analizRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/analizler/${student.id}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/get-history/${student.id}`, { headers: getAuthHeaders() })
      ]);

      const analizData = await analizRes.json();
      const historyData = await historyRes.json();

      setStudentAnaliz(Array.isArray(analizData) ? analizData : []);
      setStudentHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error(error);
      setStudentAnaliz([]);
      setStudentHistory([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const renderStudentRow = ({ item, index }: { item: Student, index: number }) => (
    <View style={styles.cardItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <LinearGradient
          colors={['#8B5CF6', '#6C3CE1']}
          style={styles.avatarPlaceholder}
        >
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSub}>{item.email}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
        {/* Class Badge */}
        <TouchableOpacity
          style={[styles.badge, { backgroundColor: '#F3F4F6' }]}
          onPress={() => { setStudentToAssign(item); setAssignClassModal(true); }}
        >
          <Ionicons name="people-outline" size={14} color="#4B5563" style={{ marginRight: 5 }} />
          <Text style={styles.badgeText}>
            {classes.find(c => c.id === item.class_id)?.name || "Sınıf Yok"}
          </Text>
        </TouchableOpacity>

        {item.status === 'pending' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => approveStudent(item.id)}>
              <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 3 }} />
              <Text style={styles.actionBtnText}>Onayla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => rejectStudent(item.id)}>
              <Ionicons name="close" size={16} color="#fff" style={{ marginRight: 3 }} />
              <Text style={styles.actionBtnText}>Reddet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => openStudentDetail(item)}>
            <Text style={styles.actionBtnText}>İncele</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderClassDetail = () => {
    if (!selectedClass) return null;
    const classStudents = students.filter(s => s.class_id === selectedClass.id);
    // Öğrencileri listele (bu sınıfta olmayanlar)
    const availableStudents = students.filter(s => s.class_id !== selectedClass.id && s.status !== 'pending');

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => setSelectedClass(null)} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <View>
              <Text style={styles.sectionTitle}>{selectedClass.name}</Text>
              <Text style={styles.sectionSub}>{classStudents.length} Öğrenci</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setAddStudentModalVisible(true)}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Öğrenci Ekle</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={classStudents}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.cardItem}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <LinearGradient colors={['#8B5CF6', '#6C3CE1']} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>{item.email}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.badge, { backgroundColor: '#DBEAFE' }]}
                  onPress={() => openStudentDetail(item)}
                >
                  <Ionicons name="eye-outline" size={16} color="#2563EB" style={{ marginRight: 5 }} />
                  <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: 12 }}>İncele</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.badge, { backgroundColor: '#FEE2E2' }]}
                  onPress={() => {
                    assignClassToStudent(null, item.id); // Sınıftan çıkar
                  }}
                >
                  <Ionicons name="remove-circle-outline" size={16} color="#EF4444" style={{ marginRight: 5 }} />
                  <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 12 }}>Çıkar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Bu sınıfta henüz öğrenci yok.</Text>
            </View>
          }
        />

        {/* Add Student Modal */}
        <Modal visible={addStudentModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sınıfa Öğrenci Ekle</Text>
                <TouchableOpacity onPress={() => setAddStudentModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <Text style={{ marginBottom: 10, color: '#6B7280' }}>
                Listeden öğrenci seçerek {selectedClass.name} sınıfına ekleyebilirsiniz.
              </Text>

              <FlatList
                data={availableStudents}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.cardItem, { marginBottom: 8 }]}
                    onPress={() => {
                      assignClassToStudent(selectedClass.id, item.id);
                      setAddStudentModalVisible(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <LinearGradient colors={['#E5E7EB', '#D1D5DB']} style={styles.avatarPlaceholder}>
                        <Text style={[styles.avatarText, { color: '#374151' }]}>{item.name.charAt(0).toUpperCase()}</Text>
                      </LinearGradient>
                      <View style={{ marginLeft: 15 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={[styles.itemSub, { color: item.class_id ? '#D97706' : '#10B981' }]}>
                          {item.class_id ? `Mevcut: ${classes.find(c => c.id === item.class_id)?.name}` : 'Sınıfsız'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="add-circle" size={24} color={COLORS.light.primary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 20 }}>
                    Eklenebilecek öğrenci bulunamadı.
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderClassesTab = () => {
    if (selectedClass) return renderClassDetail();

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <View>
            <Text style={styles.sectionTitle}>Sınıflar</Text>
            <Text style={styles.sectionSub}>{classes.length} aktif sınıf</Text>
          </View>
          {/* Sınıf oluşturma yetkisi sadece rehber öğretmenlerde */}
        </View>

        <View style={styles.grid}>
          {classes.map(c => (
            <View key={c.id} style={styles.gridCard}>
              <View style={styles.gridHeader}>
                <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                  <Ionicons name="school" size={24} color={COLORS.light.primary} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setSelectedClass(c)}>
                    <Text style={{ color: COLORS.light.primary, fontWeight: '600' }}>Detay</Text>
                  </TouchableOpacity>
                  {/* Sınıf silme yetkisi sadece rehber öğretmenlerde */}
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedClass(c)}>
                <Text style={styles.gridTitle}>{c.name}</Text>
              </TouchableOpacity>
              <Text style={styles.gridSub}>
                {students.filter(s => s.class_id === c.id).length} Öğrenci
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (students.filter(s => s.class_id === c.id).length / Math.max(1, students.length)) * 100)}%` }]} />
              </View>
            </View>
          ))}
          {classes.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Henüz hiç sınıf oluşturulmadı.</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderStats = () => (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="people" size={24} color="#2563EB" />
        </View>
        <View>
          <Text style={styles.statValue}>{students.length}</Text>
          <Text style={styles.statLabel}>Toplam Öğrenci</Text>
        </View>
      </View>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="alert-circle" size={24} color="#D97706" />
        </View>
        <View>
          <Text style={styles.statValue}>{pendingStudents.length}</Text>
          <Text style={styles.statLabel}>Onay Bekleyen</Text>
        </View>
      </View>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="layers" size={24} color="#059669" />
        </View>
        <View>
          <Text style={styles.statValue}>{classes.length}</Text>
          <Text style={styles.statLabel}>Aktif Sınıf</Text>
        </View>
      </View>
    </View>
  );

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

        <TouchableOpacity
          style={[styles.menuItem, activeTab === 'students' && styles.menuItemActive]}
          onPress={() => setActiveTab('students')}
        >
          <Ionicons name="people-outline" size={20} color={activeTab === 'students' ? "#fff" : "#9CA3AF"} />
          <Text style={[styles.menuText, activeTab === 'students' && styles.menuTextActive]}>Öğrenciler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeTab === 'classes' && styles.menuItemActive]}
          onPress={() => setActiveTab('classes')}
        >
          <Ionicons name="layers-outline" size={20} color={activeTab === 'classes' ? "#fff" : "#9CA3AF"} />
          <Text style={[styles.menuText, activeTab === 'classes' && styles.menuTextActive]}>Sınıflar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/teacher/assignments')}>
          <Ionicons name="create-outline" size={20} color="#9CA3AF" />
          <Text style={styles.menuText}>Ödev Atama</Text>
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

      {/* Main Content */}
      <View style={styles.main}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {activeTab === 'students' ? 'Öğrenci Listesi' : 'Sınıf Yönetimi'}
            </Text>
            <Text style={styles.headerDate}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color="#6B7280" />
              {pendingStudents.length > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStats()}

          {activeTab === 'classes' ? renderClassesTab() : (
            <View style={styles.tabContent}>
              {/* Search & Filter Bar */}
              <View style={styles.toolbar}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Öğrenci ara..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {pendingStudents.length > 0 && (
                <View style={styles.pendingSection}>
                  <Text style={styles.sectionHeader}>Onay Bekleyenler ({pendingStudents.length})</Text>
                  {pendingStudents.map((item, index) => (
                    <View key={item.id} style={{ marginBottom: 10 }}>
                      {renderStudentRow({ item, index })}
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sectionHeader}>Onaylı Öğrenciler ({filteredApproved.length})</Text>
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.light.primary} style={{ marginTop: 20 }} />
              ) : (
                <View style={{ gap: 10 }}>
                  {filteredApproved.map((item, index) => (
                    <View key={item.id}>{renderStudentRow({ item, index })}</View>
                  ))}
                </View>
              )}
            </View>
          )}
          <View style={{ height: 50 }} />
        </ScrollView>
      </View>

      {/* DETAY MODALI */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedStudent?.name}</Text>
              <TouchableOpacity style={styles.closeIcon} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
            {loadingDetail ? (
              <ActivityIndicator color={COLORS.light.primary} style={{ padding: 40 }} />
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Sınıf Bilgisi</Text>
                  <View style={styles.modalValueBox}>
                    <Ionicons name="school-outline" size={18} color={COLORS.light.primary} />
                    <Text style={styles.modalValue}>
                      {classes.find(c => c.id === selectedStudent?.class_id)?.name || "Atanmamış"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectionTitle}>Analizler</Text>
                {studentAnaliz.length > 0 ? (
                  studentAnaliz.map((a, i) => (
                    <View key={i} style={styles.analizRow}>
                      <View style={styles.analizScore}>
                        <Text style={styles.analizScoreText}>{a.net}</Text>
                      </View>
                      <View>
                        <Text style={styles.analizName}>{a.ad || "Deneme"}</Text>
                        <Text style={styles.analizDate}>{new Date(a.tarih).toLocaleDateString('tr-TR')}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Henüz veri yok.</Text>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Geçmiş Ödev & Programlar</Text>
                {studentHistory.length > 0 ? (
                  studentHistory.map((h, i) => (

                    <View key={i} style={{ marginBottom: 12 }}>
                      <TouchableOpacity
                        style={[styles.analizRow, { marginBottom: 0, borderBottomWidth: expandedHistoryId === h.id ? 0 : 1 }]}
                        onPress={() => setExpandedHistoryId(expandedHistoryId === h.id ? null : h.id)}
                      >
                        <View style={[styles.analizScore, { backgroundColor: '#D1FAE5' }]}>
                          <Ionicons name={expandedHistoryId === h.id ? "chevron-up" : "chevron-down"} size={16} color="#059669" />
                        </View>
                        <View>
                          <Text style={styles.analizName}>{h.program_type === 'teacher_assigned' ? 'Öğretmen Ödevi' : 'Program'}</Text>
                          <Text style={styles.analizDate}>{new Date(h.archive_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <View style={{ marginLeft: 'auto' }}>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>
                            {h.program_data?.length || 0} Ders
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {expandedHistoryId === h.id && (
                        <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginTop: 4 }}>
                          {h.program_data?.map((task: any, idx: number) => (
                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                              <View style={[styles.statusDot, { backgroundColor: task.completed ? '#10B981' : '#F59E0B', width: 8, height: 8, borderRadius: 4, marginRight: 10 }]} />
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{task.task}</Text>
                                <Text style={{ fontSize: 11, color: '#6B7280' }}>{task.gun} • {task.duration}</Text>
                              </View>
                              {task.questions > 0 && (
                                <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#E0E7FF', borderRadius: 6 }}>
                                  <Text style={{ fontSize: 11, color: '#4338CA', fontWeight: 'bold' }}>{task.questions} Soru</Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Henüz geçmiş kaydı yok.</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* CREATE CLASS MODAL */}
      <Modal visible={showClassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 350 }]}>
            <Text style={styles.modalTitle}>Yeni Sınıf</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Örn: 12-A"
              placeholderTextColor="#9CA3AF"
              value={newClassName}
              onChangeText={setNewClassName}
            />
            <View style={[styles.modalActions, { marginTop: 15 }]}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowClassModal(false)}>
                <Text style={styles.secondaryBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={createClass}>
                <Text style={styles.primaryBtnText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ASSIGN CLASS MODAL */}
      <Modal visible={assignClassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 350 }]}>
            <Text style={styles.modalTitle}>Sınıf Atama: {studentToAssign?.name}</Text>
            <ScrollView style={{ maxHeight: 250, marginVertical: 15 }}>
              <TouchableOpacity
                style={[styles.optionRow, !studentToAssign?.class_id && styles.optionRowActive]}
                onPress={() => assignClassToStudent(null)}
              >
                <Text style={[styles.optionText, !studentToAssign?.class_id && { color: COLORS.light.primary, fontWeight: 'bold' }]}>Sınıfsız</Text>
                {!studentToAssign?.class_id && <Ionicons name="checkmark" size={18} color={COLORS.light.primary} />}
              </TouchableOpacity>
              {classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.optionRow, studentToAssign?.class_id === c.id && styles.optionRowActive]}
                  onPress={() => assignClassToStudent(c.id)}
                >
                  <Text style={[styles.optionText, studentToAssign?.class_id === c.id && { color: COLORS.light.primary, fontWeight: 'bold' }]}>{c.name}</Text>
                  {studentToAssign?.class_id === c.id && <Ionicons name="checkmark" size={18} color={COLORS.light.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setAssignClassModal(false)}>
              <Text style={styles.secondaryBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // MAIN
  main: { flex: 1 },
  header: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerDate: { color: '#6B7280', fontSize: 14, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#F3F4F6', position: 'relative' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },

  content: { flex: 1, padding: 32 },

  // STATS
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 16, ...COLORS.light.cardShadow },
  statIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  // TAB CONTENT
  tabContent: { flex: 1 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  sectionSub: { fontSize: 14, color: '#6B7280' },
  sectionHeader: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12, marginTop: 24 },

  // Toolbar
  toolbar: { flexDirection: 'row', marginBottom: 20 },
  searchBar: { flex: 1, height: 48, backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  // CARDS
  cardItem: { backgroundColor: '#fff', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, ...COLORS.light.cardShadow },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  itemSub: { fontSize: 13, color: '#6B7280' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#374151', fontWeight: '600' },

  // BUTTONS
  primaryBtn: { backgroundColor: COLORS.light.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secondaryBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  secondaryBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // GRID
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  gridCard: { width: 220, backgroundColor: '#fff', borderRadius: 20, padding: 20, ...COLORS.light.cardShadow },
  gridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  gridTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  gridSub: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  progressBar: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: COLORS.light.secondary, borderRadius: 3 },

  pendingSection: { marginBottom: 20 },

  // EMPTY
  emptyState: { width: '100%', alignItems: 'center', padding: 40 },
  emptyText: { color: '#9CA3AF', marginTop: 10 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: 450, maxWidth: '90%', ...COLORS.light.cardShadow },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  closeIcon: { padding: 4 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },

  modalSection: { marginBottom: 20, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
  modalValueBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalValue: { fontSize: 16, fontWeight: '600', color: '#111827' },

  analizRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  analizScore: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  analizScoreText: { color: '#2563EB', fontWeight: 'bold' },
  analizName: { color: '#111827', fontWeight: '600' },
  analizDate: { color: '#6B7280', fontSize: 12 },

  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, backgroundColor: '#F9FAFB', marginBottom: 8 },
  optionRowActive: { backgroundColor: '#EFF6FF', borderColor: COLORS.light.primary, borderWidth: 1 },
  optionText: { color: '#374151', fontSize: 14 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 }
});