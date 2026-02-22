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
import { COLORS, GUNLER } from '../../src/constants/theme';
import { API_URL } from '../../src/config/api';

const { width } = Dimensions.get('window');

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('teacher_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

type TabType = 'overview' | 'students' | 'classes' | 'assignments' | 'messages' | 'materials' | 'gamification' | 'calendar';

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
  status?: string;
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

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}

interface AssignmentTemplate {
  id: string;
  name: string;
  items: any[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: any;
  image_url?: string;
  class_id?: string;
}

interface Material {
  id: string;
  title: string;
  file_url: string;
  type: 'pdf' | 'video' | 'link';
  class_id?: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  // Main State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");

  // Modern Stats (derived)
  const stats = {
    totalStudents: students.filter(s => s.status !== 'pending').length,
    totalClasses: classes.length,
    avgNet: 0, // Mock for now
    activeAssignments: 12, // Mock for now
  };

  // UI State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAnaliz, setStudentAnaliz] = useState<Analiz[]>([]);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [addStudentModalVisible, setAddStudentModalVisible] = useState(false);

  // Additional UI State
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const [assignClassModal, setAssignClassModal] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState<Student | null>(null);

  // Assignment System States
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [programList, setProgramList] = useState<any[]>([]);
  const [assignmentTemplates, setAssignmentTemplates] = useState<AssignmentTemplate[]>([]);
  const [selectedDay, setSelectedDay] = useState(GUNLER[0]);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState('');
  const [showTemplateSaveModal, setShowTemplateSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Communication & Materials States
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', class_id: '' });

  // Phase 5: Gamification & Calendar States
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'trial', description: '', class_id: '' });

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
    const adminId = teacherData?.admin_id;
    // Eğer staff ise kurum bilgilerini de çekip invite code'u senkronize et
    const tasks: Promise<any>[] = [fetchStudents(institutionId), fetchClasses(institutionId)];
    if (adminId) {
      tasks.push(fetchInstitutionInfo(adminId));
    } else {
      tasks.push(fetchInstitutionInfo(institutionId));
    }
    tasks.push(fetchTemplates());
    tasks.push(fetchAnnouncements(institutionId));
    tasks.push(fetchMaterials(institutionId));
    tasks.push(fetchEvents(institutionId));
    tasks.push(fetchLeaderboard(institutionId));
    await Promise.all(tasks);
    setLoading(false);
  };

  const fetchAnnouncements = async (instId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/announcements/${instId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) setAnnouncements(data);
    } catch (e) { console.error("Duyurular yuklenemedi", e); }
  };

  const fetchMaterials = async (instId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/materials/${instId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) setMaterials(data);
    } catch (e) { console.error("Materyaller yuklenemedi", e); }
  };

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', file_url: '', type: 'pdf', class_id: '' });

  const addMaterial = async () => {
    const instId = teacherData?.admin_id || teacherData?.id;
    if (!newMaterial.title || !newMaterial.file_url || !instId) return;
    try {
      const response = await fetch(`${API_URL}/teacher/create-material`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          institution_id: instId,
          teacher_id: teacherData.id,
          title: newMaterial.title,
          file_url: newMaterial.file_url,
          type: newMaterial.type,
          class_id: newMaterial.class_id || null
        }),
      });
      if (response.ok) {
        alert("Materyal başarıyla eklendi!");
        setNewMaterial({ title: '', file_url: '', type: 'pdf', class_id: '' });
        setShowMaterialModal(false);
        fetchMaterials(instId);
      }
    } catch (e) { console.error(e); }
  };

  const createAnnouncement = async () => {
    const instId = teacherData?.admin_id || teacherData?.id;
    if (!newAnnouncement.title || !newAnnouncement.content || !instId) return;
    try {
      const response = await fetch(`${API_URL}/teacher/create-announcement`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          institution_id: instId,
          author_id: teacherData.id,
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          class_id: newAnnouncement.class_id || null
        }),
      });
      if (response.ok) {
        alert("Duyuru başarıyla oluşturuldu!");
        setNewAnnouncement({ title: '', content: '', class_id: '' });
        setShowAnnouncementModal(false);
        fetchAnnouncements(instId);
      }
    } catch (e) { console.error(e); }
  };

  const fetchLeaderboard = async (instId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/leaderboard/${instId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) setLeaderboard(data);
    } catch (e) { console.error("Siralama yuklenemedi", e); }
  };

  const fetchEvents = async (instId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/events/${instId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) setEvents(data);
    } catch (e) { console.error("Takvim yuklenemedi", e); }
  };

  const addEvent = async () => {
    const instId = teacherData?.admin_id || teacherData?.id;
    if (!newEvent.title || !newEvent.date || !instId) return;
    try {
      const response = await fetch(`${API_URL}/teacher/create-event`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          institution_id: instId,
          title: newEvent.title,
          date: newEvent.date,
          type: newEvent.type,
          description: newEvent.description,
          class_id: newEvent.class_id || null
        }),
      });
      if (response.ok) {
        alert("Etkinlik takvime eklendi!");
        setNewEvent({ title: '', date: '', type: 'trial', description: '', class_id: '' });
        setShowEventModal(false);
        fetchEvents(instId);
      }
    } catch (e) { console.error(e); }
  };

  const fetchTemplates = async () => {
    try {
      if (!teacherData?.id) return;
      const response = await fetch(`${API_URL}/teacher/templates/${teacherData.id}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) setAssignmentTemplates(data);
    } catch (e) { console.error("Sablonlar yuklenemedi", e); }
  };

  const fetchInstitutionInfo = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/institution/${id}`, {
        headers: getAuthHeaders(),
      });
      const res = await response.json();
      if (res.data && res.data.invite_code) {
        setTeacherData((prev: any) => ({
          ...prev,
          invite_code: res.data.invite_code
        }));
      }
    } catch (e) { console.error("Kurum bilgisi cekilemedi", e); }
  };

  const addToProgram = () => {
    if (!subject || !topic || !questionCount) return;
    const newItem = { id: Date.now(), day: selectedDay, subject, topic, questionCount };
    setProgramList([...programList, newItem]);
    setSubject('');
    setTopic('');
    setQuestionCount('');
  };

  const removeFromProgram = (id: number) => {
    setProgramList(prev => prev.filter(item => item.id !== id));
  };

  const saveAsTemplate = async () => {
    if (!newTemplateName || programList.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/teacher/create-template`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          teacher_id: teacherData.id,
          name: newTemplateName,
          items: programList
        }),
      });
      if (response.ok) {
        alert("Şablon başarıyla kaydedildi!");
        setShowTemplateSaveModal(false);
        setNewTemplateName('');
        fetchTemplates();
      }
    } catch (e) { console.error(e); }
  };

  const applyTemplate = (template: AssignmentTemplate) => {
    setProgramList(template.items);
  };

  const sendProgram = async () => {
    if (selectedStudentIds.length === 0 || programList.length === 0) return;
    setLoading(true);
    let successCount = 0;
    for (const studentId of selectedStudentIds) {
      try {
        const response = await fetch(`${API_URL}/teacher/assign-program`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ student_id: studentId, program: programList }),
        });
        if (response.ok) successCount++;
      } catch (e) { console.error(e); }
    }
    setLoading(false);
    if (successCount > 0) {
      alert(`${successCount} öğrenciye program başarıyla gönderildi!`);
      setProgramList([]);
      setSelectedStudentIds([]);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const toggleSelectAllStudents = () => {
    const activeStudents = students.filter(s => s.status !== 'pending');
    if (selectedStudentIds.length === activeStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(activeStudents.map(s => s.id));
    }
  };

  const fetchStudents = async (institutionId: string) => {
    try {
      const response = await fetch(`${API_URL}/teacher/students/${institutionId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        // Otomatik onayla veya sadece onaylıları göster (User isteği üzerine onaylama kalktı)
        setStudents(data);
      }
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

  const assignClassToStudent = async (classId: string | null, studentId: string) => {
    if (!studentId) return;

    try {
      const res = await fetch(`${API_URL}/teacher/assign-class`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ student_id: studentId, class_id: classId }),
      });
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, class_id: classId } : s));
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

  // ─── TAB: Overview ────────────────────────────
  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.welcomeCard}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.welcomeGradient}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Merhaba, {teacherData?.name || 'Hocam'} 👋</Text>
            <Text style={styles.welcomeSub}>Bugün öğrencileriniz için yeni fırsatlar yaratma zamanı.</Text>
            <TouchableOpacity style={styles.welcomeBtn} onPress={() => setActiveTab('students')}>
              <Text style={styles.welcomeBtnText}>Öğrencilere Göz At</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3429/3429113.png' }}
            style={styles.welcomeImage}
          />
        </LinearGradient>
      </View>

      <View style={styles.statsRow}>
        {[
          { icon: 'people', color: '#3B82F6', bg: '#DBEAFE', value: stats.totalStudents, label: 'Öğrenci' },
          { icon: 'layers', color: '#8B5CF6', bg: '#EDE9FE', value: stats.totalClasses, label: 'Sınıf' },
          { icon: 'trending-up', color: '#10B981', bg: '#D1FAE5', value: stats.avgNet || '-', label: 'Ort. Net' },
          { icon: 'time', color: '#F59E0B', bg: '#FEF3C7', value: stats.activeAssignments, label: 'Bekleyen' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon as any} size={24} color={s.color} />
            </View>
            <View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 24, marginTop: 8 }}>
        <View style={[styles.sectionCard, { flex: 1 }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Duyurular & Aktivite</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>Tümünü Gör</Text></TouchableOpacity>
          </View>
          {notifications.length > 0 ? (
            notifications.map(n => (
              <View key={n.id} style={styles.notifRow}>
                <View style={[styles.notifDot, { backgroundColor: n.type === 'success' ? '#10B981' : '#3B82F6' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifText} numberOfLines={1}>{n.message}</Text>
                </View>
                <Text style={styles.notifTime}>{n.time}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="notifications-off-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyActivityText}>Şu an için yeni bir bildirim yok.</Text>
            </View>
          )}
        </View>

        <View style={{ width: 300, gap: 20 }}>
          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Hızlı Erişim</Text>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/teacher/assignments')}>
              <View style={[styles.actionIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="add" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.actionText}>Ödev Programı Hazırla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => setActiveTab('classes')}>
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="layers" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.actionText}>Sınıfları Düzenle</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inviteCard}>
            <Text style={styles.inviteTitle}>Öğrenci Davet Et</Text>
            <Text style={styles.inviteSub}>Kurum kodunuzu paylaşarak öğrencilerinizi ekleyin.</Text>
            <View style={styles.codeBox}>
              <Text style={styles.inviteCode}>{teacherData?.invite_code || '---'}</Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => {
                  // Platform.OS === 'web' vs native control
                  if (teacherData?.invite_code) {
                    alert(`Kod kopyalandı: ${teacherData.invite_code}`);
                  }
                }}
              >
                <Ionicons name="copy-outline" size={18} color={COLORS.light.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );


  const renderStudents = () => {
    const filtered = students.filter(s =>
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (classFilter === 'ALL' || s.class_id === classFilter)
    );

    return (
      <View style={styles.tabContent}>
        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Öğrenci ismi veya e-posta ile ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.filterContainer}>
            <Ionicons name="filter" size={18} color="#6B7280" />
            <Text style={styles.filterLabel}>Sınıf:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 10 }}>
              <TouchableOpacity
                style={[styles.filterChip, classFilter === 'ALL' && styles.filterChipActive]}
                onPress={() => setClassFilter('ALL')}
              >
                <Text style={[styles.filterChipText, classFilter === 'ALL' && styles.filterChipTextActive]}>Tümü</Text>
              </TouchableOpacity>
              {classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.filterChip, classFilter === c.id && styles.filterChipActive]}
                  onPress={() => setClassFilter(c.id)}
                >
                  <Text style={[styles.filterChipText, classFilter === c.id && styles.filterChipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={item => item.id}
          columnWrapperStyle={{ gap: 20 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.studentCard} onPress={() => openStudentDetail(item)}>
              <View style={styles.studentCardHeader}>
                <LinearGradient colors={['#8B5CF6', '#6C3CE1']} style={styles.studentAvatar}>
                  <Text style={styles.studentAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
                <TouchableOpacity style={styles.moreBtn}>
                  <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.studentEmail} numberOfLines={1}>{item.email}</Text>
              <View style={styles.studentFooter}>
                <View style={styles.classBadge}>
                  <Text style={styles.classBadgeText}>
                    {classes.find(c => c.id === item.class_id)?.name || 'Sınıfsız'}
                  </Text>
                </View>
                <View style={styles.detailBtn}>
                  <Text style={styles.detailBtnText}>Görüntüle</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.light.primary} />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>Öğrenci Bulunamadı</Text>
              <Text style={styles.emptyStateSub}>Arama kriterlerinize uygun öğrenci yok.</Text>
            </View>
          }
        />
      </View>
    );
  };

  const renderClasses = () => {
    if (selectedClass) {
      const classStudents = students.filter(s => s.class_id === selectedClass.id);
      return (
        <View style={styles.tabContent}>
          <View style={styles.detailHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedClass(null)}>
              <Ionicons name="arrow-back" size={20} color="#374151" />
              <Text style={styles.backBtnText}>Sınıflara Dön</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleRow}>
              <Text style={styles.detailTitle}>{selectedClass.name}</Text>
              <View style={styles.memberCount}>
                <Text style={styles.memberCountText}>{classStudents.length} Öğrenci</Text>
              </View>
            </View>
          </View>

          <FlatList
            data={classStudents}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.studentRow} onPress={() => openStudentDetail(item)}>
                <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.rowAvatar}>
                  <Text style={styles.rowAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowEmail}>{item.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>Sınıf Boş</Text>
                <Text style={styles.emptyStateSub}>Bu sınıfa henüz öğrenci atanmamış.</Text>
              </View>
            }
          />
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.classHeader}>
          <Text style={styles.sectionTitle}>Sınıf Listesi</Text>
          {/* Sınıf oluşturma yetkisi sadece rehber/admin panellerinde ama burada da hızlı erişim için bırakıyoruz (logic aynı) */}
        </View>
        <View style={styles.classGrid}>
          {classes.map(c => {
            const count = students.filter(s => s.class_id === c.id).length;
            return (
              <TouchableOpacity key={c.id} style={styles.classCard} onPress={() => setSelectedClass(c)}>
                <View style={styles.classIconBg}>
                  <Ionicons name="school" size={28} color={COLORS.light.primary} />
                </View>
                <Text style={styles.className}>{c.name}</Text>
                <Text style={styles.classCount}>{count} Öğrenci Kayıtlı</Text>
                <View style={styles.classCardFooter}>
                  <Text style={styles.viewClassText}>Detayları Gör</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.light.primary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPlaceholder = (title: string, sub: string, icon: any) => (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateSub}>{sub}</Text>
    </View>
  );

  const renderAssignments = () => {
    const activeStudents = students.filter(s => s.status !== 'pending');

    return (
      <View style={[styles.tabContent, { flexDirection: 'row', gap: 20 }]}>
        {/* Sol Panel: Öğrenci Seçimi */}
        <View style={{ flex: 1.5, backgroundColor: '#fff', borderRadius: 20, padding: 20, ...COLORS.light.cardShadow }}>
          <View style={styles.paneHeader}>
            <Text style={styles.paneTitle}>Öğrenci Seçimi</Text>
            <TouchableOpacity onPress={toggleSelectAllStudents}>
              <Text style={styles.linkText}>
                {selectedStudentIds.length === activeStudents.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={activeStudents}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
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
                  <Text style={[styles.studentName, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Sağ Panel: Program Hazırlama */}
        <View style={{ flex: 2, gap: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, ...COLORS.light.cardShadow }}>
            <Text style={styles.paneTitle}>Program Hazırlat</Text>

            {/* Gün Seçimi */}
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

            {/* Giriş Alanları */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <TextInput
                style={[styles.modalInput, { flex: 2 }]}
                placeholder="Ders (Matematik...)"
                value={subject}
                onChangeText={setSubject}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Soru"
                keyboardType="numeric"
                value={questionCount}
                onChangeText={setQuestionCount}
              />
            </View>
            <TextInput
              style={[styles.modalInput, { marginBottom: 15 }]}
              placeholder="Konu (Logaritma...)"
              value={topic}
              onChangeText={setTopic}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, justifyContent: 'center' }]} onPress={addToProgram}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Listeye Ekle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                onPress={() => setShowTemplateSaveModal(true)}
              >
                <Ionicons name="save-outline" size={20} color="#16A34A" />
                <Text style={[styles.secondaryBtnText, { color: '#16A34A' }]}>Şablon Yap</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Şablonlar */}
          {assignmentTemplates.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, ...COLORS.light.cardShadow }}>
              <Text style={[styles.paneTitle, { fontSize: 14 }]}>Kayıtlı Şablonlar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {assignmentTemplates.map(t => (
                  <TouchableOpacity key={t.id} style={styles.templateChip} onPress={() => applyTemplate(t)}>
                    <Ionicons name="bookmarks-outline" size={16} color={COLORS.light.primary} />
                    <Text style={styles.templateChipText}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Önizleme Listesi */}
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 20, ...COLORS.light.cardShadow }}>
            <View style={styles.paneHeader}>
              <Text style={styles.paneTitle}>Program Önizleme ({programList.length})</Text>
              {programList.length > 0 && (
                <TouchableOpacity onPress={() => setProgramList([])}>
                  <Text style={{ color: COLORS.danger, fontWeight: '600' }}>Temizle</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={programList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.programItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.programDayText}>{item.day}</Text>
                    <Text style={styles.programDetailText}>{item.subject} - {item.topic}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.questionBadge}><Text style={styles.questionBadgeText}>{item.questionCount} Soru</Text></View>
                    <TouchableOpacity onPress={() => removeFromProgram(item.id)}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 20, height: 50, justifyContent: 'center' }, (selectedStudentIds.length === 0 || programList.length === 0) && { opacity: 0.5 }]}
              disabled={selectedStudentIds.length === 0 || programList.length === 0}
              onPress={sendProgram}
            >
              <Text style={[styles.primaryBtnText, { fontSize: 16 }]}>Programı Seçili Öğrencilere Gönder ({selectedStudentIds.length})</Text>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Şablon Kaydetme Modalı */}
        <Modal visible={showTemplateSaveModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Şablon Olarak Kaydet</Text>
              <TextInput
                style={[styles.modalInput, { marginTop: 15 }]}
                placeholder="Şablon İsmi (Örn: TYT Kampı)"
                value={newTemplateName}
                onChangeText={setNewTemplateName}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowTemplateSaveModal(false)}>
                  <Text style={styles.secondaryBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={saveAsTemplate}>
                  <Text style={styles.primaryBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Yeni Duyuru Modalı */}
        <Modal visible={showAnnouncementModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Yeni Duyuru Oluştur</Text>
              <View style={{ gap: 12, marginTop: 15 }}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Duyuru Başlığı"
                  value={newAnnouncement.title}
                  onChangeText={(t) => setNewAnnouncement(prev => ({ ...prev, title: t }))}
                />
                <TextInput
                  style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Duyuru İçeriği..."
                  multiline
                  value={newAnnouncement.content}
                  onChangeText={(t) => setNewAnnouncement(prev => ({ ...prev, content: t }))}
                />
                <Text style={styles.modalLabel}>Hedef Sınıf (Boş bırakılırsa tüm kurum)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.filterChip, !newAnnouncement.class_id && styles.filterChipActive]}
                    onPress={() => setNewAnnouncement(prev => ({ ...prev, class_id: '' }))}
                  >
                    <Text style={[styles.filterChipText, !newAnnouncement.class_id && styles.filterChipTextActive]}>Tüm Kurum</Text>
                  </TouchableOpacity>
                  {classes.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.filterChip, newAnnouncement.class_id === c.id && styles.filterChipActive]}
                      onPress={() => setNewAnnouncement(prev => ({ ...prev, class_id: c.id }))}
                    >
                      <Text style={[styles.filterChipText, newAnnouncement.class_id === c.id && styles.filterChipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowAnnouncementModal(false)}>
                  <Text style={styles.secondaryBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={createAnnouncement}>
                  <Text style={styles.primaryBtnText}>Duyuruyu Yayınla</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };
  const renderMessages = () => (
    <View style={styles.tabContent}>
      <View style={styles.paneHeader}>
        <Text style={styles.paneTitle}>Mesaj Merkezi & Duyurular</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowAnnouncementModal(true)}>
          <Ionicons name="megaphone-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Yeni Duyuru</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', gap: 20, flex: 1 }}>
        {/* Sol: Duyuru Listesi */}
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 20, ...COLORS.light.cardShadow }}>
          <Text style={styles.sectionHeader}>Son Duyurular</Text>
          <FlatList
            data={announcements}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <Text style={styles.announcementTitle}>{item.title}</Text>
                  <Text style={styles.announcementDate}>
                    {item.created_at?._seconds ? new Date(item.created_at._seconds * 1000).toLocaleDateString('tr-TR') : 'Bugün'}
                  </Text>
                </View>
                <Text style={styles.announcementContent}>{item.content}</Text>
                {item.class_id && (
                  <View style={styles.classLabel}>
                    <Text style={styles.classLabelText}>
                      {classes.find(c => c.id === item.class_id)?.name || 'Sınıf Bazlı'}
                    </Text>
                  </View>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Henüz duyuru yayınlanmamış.</Text>
              </View>
            }
          />
        </View>

        {/* Sağ: Hızlı Mesajlaşma Placeholder */}
        <View style={{ width: 350, backgroundColor: '#fff', borderRadius: 24, padding: 20, ...COLORS.light.cardShadow }}>
          <Text style={styles.sectionHeader}>Hızlı Mesaj Gönder</Text>
          <Text style={styles.sectionSub}>Bir öğrenci seçip hızlıca mesaj gönderebilirsiniz.</Text>

          <TouchableOpacity
            style={[styles.modalInput, { marginTop: 20, justifyContent: 'center' }]}
            onPress={() => setActiveTab('students')}
          >
            <Text style={{ color: '#9CA3AF' }}>Öğrenci Seçmek İçin Tıklayın...</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 'auto', alignItems: 'center', padding: 20 }}>
            <Ionicons name="chatbubbles-outline" size={64} color="#F3F4F6" />
            <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 10 }}>
              Mesajlaşma özelliği mobil uygulama üzerinde anlık bildirimlerle desteklenmektedir.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMaterials = () => (
    <View style={styles.tabContent}>
      <View style={styles.paneHeader}>
        <View>
          <Text style={styles.paneTitle}>Eğitim Materyalleri (Drive)</Text>
          <Text style={styles.sectionSub}>Öğrencilerinizle PDF, Video ve faydalı linkler paylaşın.</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowMaterialModal(true)}>
          <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Yeni Materyal Ekle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={materials}
        numColumns={3}
        keyExtractor={item => item.id}
        columnWrapperStyle={{ gap: 20 }}
        renderItem={({ item }) => (
          <View style={styles.materialCard}>
            <View style={[styles.materialIcon, { backgroundColor: item.type === 'pdf' ? '#FEE2E2' : item.type === 'video' ? '#E0E7FF' : '#DCFCE7' }]}>
              <Ionicons
                name={item.type === 'pdf' ? 'document-text' : item.type === 'video' ? 'play-circle' : 'link'}
                size={32}
                color={item.type === 'pdf' ? '#EF4444' : item.type === 'video' ? '#4F46E5' : '#16A34A'}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.materialTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.materialType}>{item.type.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.downloadBtn}>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>Materyal Yok</Text>
            <Text style={styles.emptyStateSub}>Henüz hiç dosya veya link paylaşmamışsınız.</Text>
          </View>
        }
      />

      {/* Materyal Ekleme Modalı */}
      <Modal visible={showMaterialModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Materyal Paylaş</Text>
            <View style={{ gap: 12, marginTop: 15 }}>
              <TextInput
                style={styles.modalInput}
                placeholder="Başlık (Örn: Logaritma Fasikülü)"
                value={newMaterial.title}
                onChangeText={t => setNewMaterial(prev => ({ ...prev, title: t }))}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Dosya URL veya Video Linki"
                value={newMaterial.file_url}
                onChangeText={t => setNewMaterial(prev => ({ ...prev, file_url: t }))}
              />
              <Text style={styles.modalLabel}>Materyal Tipi</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['pdf', 'video', 'link'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, newMaterial.type === type && styles.typeChipActive]}
                    onPress={() => setNewMaterial(prev => ({ ...prev, type: type as any }))}
                  >
                    <Text style={[styles.typeChipText, newMaterial.type === type && styles.typeChipTextActive]}>{type.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.modalLabel}>Hedef Sınıf (İsteğe Bağlı)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.filterChip, !newMaterial.class_id && styles.filterChipActive]}
                  onPress={() => setNewMaterial(prev => ({ ...prev, class_id: '' }))}
                >
                  <Text style={[styles.filterChipText, !newMaterial.class_id && styles.filterChipTextActive]}>Tümü</Text>
                </TouchableOpacity>
                {classes.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.filterChip, newMaterial.class_id === c.id && styles.filterChipActive]}
                    onPress={() => setNewMaterial(prev => ({ ...prev, class_id: c.id }))}
                  >
                    <Text style={[styles.filterChipText, newMaterial.class_id === c.id && styles.filterChipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowMaterialModal(false)}>
                <Text style={styles.secondaryBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={addMaterial}>
                <Text style={styles.primaryBtnText}>Paylaş</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
  const renderGamification = () => (
    <View style={styles.tabContent}>
      <View style={styles.paneHeader}>
        <View>
          <Text style={styles.paneTitle}>Liderlik Tablosu & Başarılar</Text>
          <Text style={styles.sectionSub}>Öğrenci başarı sıralamaları ve rozet sistemi.</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 24 }}>
        <View style={{ flex: 1.5, backgroundColor: '#fff', borderRadius: 24, padding: 24, ...COLORS.light.cardShadow }}>
          <Text style={styles.sectionHeader}>En Başarılı Öğrenciler</Text>
          <FlatList
            data={leaderboard}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.leaderboardRow}>
                <View style={[styles.rankBadge, index === 0 && { backgroundColor: '#FCD34D' }, index === 1 && { backgroundColor: '#D1D5DB' }, index === 2 && { backgroundColor: '#F97316' }]}>
                  <Text style={[styles.rankText, index < 3 && { color: '#fff' }]}>{item.rank}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.leaderName}>{item.name}</Text>
                </View>
                <View style={styles.avgBadge}>
                  <Text style={styles.avgText}>{item.avg_net} Net Ort.</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyActivity}>
                <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Veri toplanıyor...</Text>
              </View>
            }
          />
        </View>

        <View style={{ flex: 1, gap: 20 }}>
          <View style={[styles.sectionCard, { backgroundColor: '#4F46E5' }]}>
            <Ionicons name="sparkles" size={32} color="#fff" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Haftanın Yıldızı</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>Netlerini en çok artıran öğrenci için otomatik rozet atanır.</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Rozetler</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 }}>
              {['Hızlı Okur', 'Net Canavarı', 'Düzenli Çalışan', 'Sabah Kuşu'].map((b, i) => (
                <View key={i} style={styles.badgeItem}>
                  <Ionicons name="ribbon" size={20} color={COLORS.light.primary} />
                  <Text style={styles.badgeItemText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCalendar = () => (
    <View style={styles.tabContent}>
      <View style={styles.paneHeader}>
        <View>
          <Text style={styles.paneTitle}>Deneme Takvimi & Planlayıcı</Text>
          <Text style={styles.sectionSub}>Kurumsal sınavlar ve önemli tarihleri takip edin.</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowEventModal(true)}>
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Etkinlik Ekle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.calendarRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{item.date.split('-')[2]}</Text>
              <Text style={styles.dateMonth}>{item.date.split('-')[1]}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <View style={[styles.typeTag, { backgroundColor: item.type === 'trial' ? '#DBEAFE' : '#F3F4F6' }]}>
                  <Text style={[styles.typeTagText, { color: item.type === 'trial' ? '#2563EB' : '#6B7280' }]}>
                    {item.type === 'trial' ? 'DENEME' : item.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.eventDesc}>{item.description}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>Takvim Boş</Text>
            <Text style={styles.emptyStateSub}>Henüz bir sınav veya etkinlik eklenmemiş.</Text>
          </View>
        }
      />

      <Modal visible={showEventModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Takvime Ekle</Text>
            <View style={{ gap: 12, marginTop: 15 }}>
              <TextInput
                style={styles.modalInput}
                placeholder="Etkinlik Başlığı"
                value={newEvent.title}
                onChangeText={t => setNewEvent(prev => ({ ...prev, title: t }))}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Tarih (YYYY-MM-DD)"
                value={newEvent.date}
                onChangeText={t => setNewEvent(prev => ({ ...prev, date: t }))}
              />
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Açıklama (İsteğe Bağlı)"
                multiline
                value={newEvent.description}
                onChangeText={t => setNewEvent(prev => ({ ...prev, description: t }))}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowEventModal(false)}>
                <Text style={styles.secondaryBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={addEvent}>
                <Text style={styles.primaryBtnText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
          style={[styles.menuItem, activeTab === 'overview' && styles.menuItemActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons name="grid-outline" size={20} color={activeTab === 'overview' ? "#fff" : "#9CA3AF"} />
          <Text style={[styles.menuText, activeTab === 'overview' && styles.menuTextActive]}>Genel Bakış</Text>
        </TouchableOpacity>

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

        <TouchableOpacity
          style={[styles.menuItem, activeTab === 'assignments' && styles.menuItemActive]}
          onPress={() => setActiveTab('assignments')}
        >
          <Ionicons name="create-outline" size={20} color={activeTab === 'assignments' ? "#fff" : "#9CA3AF"} />
          <Text style={[styles.menuText, activeTab === 'assignments' && styles.menuTextActive]}>Ödevler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeTab === 'messages' && styles.menuItemActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={activeTab === 'messages' ? "#fff" : "#9CA3AF"} />
          <Text style={[styles.menuText, activeTab === 'messages' && styles.menuTextActive]}>Mesajlar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeTab === 'materials' && styles.menuItemActive]}
          onPress={() => setActiveTab('materials')}
        >
          <Ionicons name="folder-open-outline" size={20} color={activeTab === 'materials' ? "#fff" : "#9CA3AF"} />
          <Text style={[styles.menuText, activeTab === 'materials' && styles.menuTextActive]}>Materyaller</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeTab === 'gamification' && styles.menuItemActive]}
          onPress={() => setActiveTab('gamification')}
        >
          <Ionicons name="trophy-outline" size={20} color={activeTab === 'gamification' ? "#fff" : "#9CA3AF"} />
          <Text style={[styles.menuText, activeTab === 'gamification' && styles.menuTextActive]}>Oyunlaştırma</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, activeTab === 'calendar' && styles.menuItemActive]}
          onPress={() => setActiveTab('calendar')}
        >
          <Ionicons name="calendar-outline" size={20} color={activeTab === 'calendar' ? "#fff" : "#9CA3AF"} />
          <Text style={[styles.menuText, activeTab === 'calendar' && styles.menuTextActive]}>Takvim</Text>
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
              {activeTab === 'overview' ? 'Kontrol Paneli' :
                activeTab === 'students' ? 'Öğrenci Listesi' :
                  activeTab === 'classes' ? 'Sınıf Yönetimi' :
                    activeTab === 'assignments' ? 'Ödev Merkezi' :
                      activeTab === 'messages' ? 'Mesajlar' :
                        activeTab === 'materials' ? 'Materyaller & Drive' :
                          activeTab === 'gamification' ? 'Başarı & Oyunlaştırma' : 'Takvim & Ajanda'}
            </Text>
            <Text style={styles.headerDate}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color="#6B7280" />
              {notifications.some(n => n.type === 'warning') && <View style={styles.headerNotifDot} />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'students' && renderStudents()}
          {activeTab === 'classes' && renderClasses()}
          {activeTab === 'assignments' && renderAssignments()}
          {activeTab === 'messages' && renderMessages()}
          {activeTab === 'materials' && renderMaterials()}
          {activeTab === 'gamification' && renderGamification()}
          {activeTab === 'calendar' && renderCalendar()}
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
                onPress={() => studentToAssign && assignClassToStudent(null, studentToAssign.id)}
              >
                <Text style={[styles.optionText, !studentToAssign?.class_id && { color: COLORS.light.primary, fontWeight: 'bold' }]}>Sınıfsız</Text>
                {!studentToAssign?.class_id && <Ionicons name="checkmark" size={18} color={COLORS.light.primary} />}
              </TouchableOpacity>
              {classes.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.optionRow, studentToAssign?.class_id === c.id && styles.optionRowActive]}
                  onPress={() => studentToAssign && assignClassToStudent(c.id, studentToAssign.id)}
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
  headerNotifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },

  content: { flex: 1, padding: 32 },

  // ─── OVERVIEW COMPONENTS ──────────────────────
  welcomeCard: {
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    ...COLORS.light.cardShadow,
  },
  welcomeGradient: {
    padding: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    maxWidth: '80%',
  },
  welcomeBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  welcomeBtnText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 14,
  },
  welcomeImage: {
    width: 140,
    height: 140,
    opacity: 0.9,
  },

  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 32 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...COLORS.light.cardShadow,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    ...COLORS.light.cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light.primary,
  },

  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notifText: {
    fontSize: 13,
    color: '#6B7280',
  },
  notifTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyActivity: {
    alignItems: 'center',
    padding: 40,
  },
  emptyActivityText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },

  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  inviteCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#312E81',
    marginBottom: 4,
  },
  inviteSub: {
    fontSize: 13,
    color: '#4338CA',
    marginBottom: 16,
    lineHeight: 18,
  },
  codeBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 1,
  },
  copyBtn: {
    padding: 4,
  },

  // ─── STUDENTS TAB ───────────────────────────
  toolbar: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 200,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#F3E8FF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#8B5CF6',
  },

  studentCard: {
    flex: 0.5,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    ...COLORS.light.cardShadow,
  },
  studentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  moreBtn: {
    padding: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  classBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.light.primary,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateSub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },

  // ─── CLASSES TAB ────────────────────────────
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  classCard: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    ...COLORS.light.cardShadow,
  },
  classIconBg: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  classCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  classCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewClassText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.light.primary,
  },

  detailHeader: {
    marginBottom: 32,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  memberCount: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberCountText: {
    color: '#8B5CF6',
    fontWeight: '700',
    fontSize: 13,
  },

  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  rowEmail: {
    fontSize: 13,
    color: '#6B7280',
  },

  // ─── LEGACY & UTILS ──────────────────────────
  tabContent: { flex: 1 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  sectionSub: { fontSize: 14, color: '#6B7280' },
  sectionHeader: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12, marginTop: 24 },

  cardItem: { backgroundColor: '#fff', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, ...COLORS.light.cardShadow },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#374151', fontWeight: '600' },

  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  emptyState: { width: '100%', alignItems: 'center', padding: 40 },
  emptyText: { color: '#9CA3AF', marginTop: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: 450, maxWidth: '90%', ...COLORS.light.cardShadow },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  closeIcon: { padding: 4 },

  modalSection: { marginBottom: 20, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' },
  modalValueBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalValue: { fontSize: 16, fontWeight: '600', color: '#111827' },

  analizRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  analizScore: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  analizScoreText: { color: '#2563EB', fontWeight: 'bold' },
  analizName: { color: '#111827', fontWeight: '600' },
  analizDate: { color: '#6B7280', fontSize: 12 },

  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },

  // SEARCH & BAR UTILS
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  searchBar: { flex: 1, height: 48, backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, borderWidth: 1, borderColor: '#E5E7EB' },

  // MODAL UTILS
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },

  // BUTTON UTILS
  primaryBtn: { backgroundColor: COLORS.light.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secondaryBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  secondaryBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },

  // OPTION UTILS
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, backgroundColor: '#F9FAFB', marginBottom: 8 },
  optionRowActive: { backgroundColor: '#EFF6FF', borderColor: COLORS.light.primary, borderWidth: 1 },
  optionText: { color: '#374151', fontSize: 14 },

  // --- ASSIGNMENT SYSTEM UTILS ---
  paneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  paneTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  linkText: { color: COLORS.light.primary, fontWeight: '600' },
  studentCardActive: { backgroundColor: '#EFF6FF', borderColor: COLORS.light.primary },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', marginRight: 10 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F3F4F6', marginRight: 8 },
  dayChipActive: { backgroundColor: COLORS.light.primary },
  dayChipText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  dayChipTextActive: { color: '#fff' },
  templateChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F3FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#DDD6FE' },
  templateChipText: { color: COLORS.light.primary, fontWeight: '600', fontSize: 13 },
  programItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 8 },
  programDayText: { fontSize: 11, fontWeight: '700', color: COLORS.light.primary, textTransform: 'uppercase', marginBottom: 2 },
  programDetailText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  questionBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  questionBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.light.primary },

  // --- COMMUNICATION & ANNOUNCEMENT STYLES ---
  announcementCard: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  announcementHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  announcementTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  announcementDate: { fontSize: 12, color: '#9CA3AF' },
  announcementContent: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  classLabel: { alignSelf: 'flex-start', backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 10 },
  classLabelText: { fontSize: 11, fontWeight: '700', color: '#8B5CF6' },

  // --- MATERIALS (DRIVE) STYLES ---
  materialCard: { width: '31%', backgroundColor: '#fff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  materialIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  materialTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  materialType: { fontSize: 11, fontWeight: '800', color: '#9CA3AF' },
  downloadBtn: { padding: 8 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F3F4F6', marginRight: 10 },
  typeChipActive: { backgroundColor: COLORS.light.primary },
  typeChipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  typeChipTextActive: { color: '#fff' },

  // --- GAMIFICATION STYLES ---
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: '800', color: '#6B7280' },
  leaderName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  avgBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  avgText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  badgeItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  badgeItemText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },

  // --- CALENDAR STYLES ---
  calendarRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 16, ...COLORS.light.cardShadow },
  dateBox: { width: 60, height: 60, backgroundColor: '#F3F4F6', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dateDay: { fontSize: 20, fontWeight: '800', color: COLORS.light.primary },
  dateMonth: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  typeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeTagText: { fontSize: 10, fontWeight: '800' },
  eventDesc: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});
