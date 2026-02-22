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
    Dimensions,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../src/config/api';

const { width } = Dimensions.get('window');

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('teacher_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const showAlert = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(`${title}\n${msg}`);
};

const COLORS = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    success: '#059669',
    warning: '#F59E0B',
    danger: '#EF4444',
};

interface Student {
    id: string;
    name: string;
    email?: string;
    status?: string;
    class_id?: string;
    teacher_institution_id?: string;
}

interface ClassItem {
    id: string;
    name: string;
}

type TabType = 'overview' | 'students' | 'classes' | 'performance' | 'notifications';

export default function RehberDashboard() {
    const router = useRouter();
    const [teacherData, setTeacherData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);

    // Data
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');

    // Performance
    const [performance, setPerformance] = useState<any>(null);
    const [perfLoading, setPerfLoading] = useState(false);

    // Class Management
    const [showClassModal, setShowClassModal] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [creatingClass, setCreatingClass] = useState(false);

    // Student Detail Modal
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [studentAnaliz, setStudentAnaliz] = useState<any[]>([]);
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Program Modal
    const [showProgramModal, setShowProgramModal] = useState(false);
    const [programStudent, setProgramStudent] = useState<Student | null>(null);
    const [programList, setProgramList] = useState<any[]>([]);
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [questionCount, setQuestionCount] = useState('');
    const [day, setDay] = useState('Pazartesi');

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const stored = sessionStorage.getItem('teacher_data');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.teacher_type !== 'rehber') {
                        router.replace('/teacher/dashboard');
                        return;
                    }
                    setTeacherData(parsed);
                    const institutionId = parsed.admin_id || parsed.id;
                    fetchAllData(institutionId, parsed.admin_id);
                    return;
                }
            }
        } catch (e) { /* ignore */ }
        router.replace('/staff/login');
    }, []);

    useEffect(() => {
        if (!teacherData?.id) return;
        if (activeTab === 'performance') loadPerformance();
    }, [activeTab, teacherData]);

    const fetchAllData = async (institutionId: string, adminId: string) => {
        setLoading(true);
        await Promise.all([
            fetchStudents(institutionId, adminId),
            fetchClasses(institutionId),
        ]);
        setLoading(false);
    };

    const fetchStudents = async (institutionId: string, adminId?: string) => {
        try {
            const aid = adminId || teacherData?.admin_id;
            const response = await fetch(
                `${API_URL}/teacher/students/${institutionId}?teacher_type=rehber&admin_id=${aid}`,
                { headers: getAuthHeaders() }
            );
            const data = await response.json();
            if (Array.isArray(data)) setStudents(data);
        } catch (e) { console.error(e); }
    };

    const fetchClasses = async (institutionId: string) => {
        try {
            const response = await fetch(`${API_URL}/teacher/classes/${institutionId}`, { headers: getAuthHeaders() });
            const data = await response.json();
            if (Array.isArray(data)) setClasses(data);
        } catch (e) { console.error(e); }
    };

    const loadPerformance = async () => {
        setPerfLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/performance?admin_id=${teacherData.admin_id || teacherData.id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.status === 'success') setPerformance(data);
        } catch (e) { console.error(e); }
        finally { setPerfLoading(false); }
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

    const openStudentDetail = async (student: Student) => {
        setSelectedStudent(student);
        setModalVisible(true);
        setLoadingDetail(true);
        try {
            const [analizRes, historyRes] = await Promise.all([
                fetch(`${API_URL}/analizler/${student.id}`, { headers: getAuthHeaders() }),
                fetch(`${API_URL}/get-history/${student.id}`, { headers: getAuthHeaders() }),
            ]);
            const analizData = await analizRes.json();
            const historyData = await historyRes.json();
            setStudentAnaliz(Array.isArray(analizData) ? analizData : []);
            setStudentHistory(Array.isArray(historyData) ? historyData : []);
        } catch (e) {
            console.error(e);
            setStudentAnaliz([]);
            setStudentHistory([]);
        } finally { setLoadingDetail(false); }
    };

    const openProgramModal = (student: Student) => {
        setProgramStudent(student);
        setProgramList([]);
        setSubject('');
        setTopic('');
        setQuestionCount('');
        setShowProgramModal(true);
    };

    const addToProgram = () => {
        if (!subject || !topic || !questionCount) {
            showAlert("Eksik", "Lütfen tüm alanları doldurun.");
            return;
        }
        setProgramList(prev => [...prev, { gun: day, subject, topic, task: `${subject} - ${topic}`, duration: "45 dk", questions: parseInt(questionCount) || 0 }]);
        setSubject('');
        setTopic('');
        setQuestionCount('');
    };

    const sendProgram = async () => {
        if (!programStudent || programList.length === 0) return;
        try {
            const res = await fetch(`${API_URL}/teacher/assign-program`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ student_id: programStudent.id, program: programList }),
            });
            if (res.ok) {
                showAlert("Başarılı", `${programStudent.name}'e program gönderildi!`);
                setShowProgramModal(false);
            }
        } catch (e) { showAlert("Hata", "Gönderim başarısız."); }
    };

    const createClass = async () => {
        const instId = teacherData?.admin_id || teacherData?.id;
        if (!newClassName || !instId) return;
        setCreatingClass(true);
        try {
            const res = await fetch(`${API_URL}/teacher/create-class`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    institution_id: instId,
                    name: newClassName,
                    teacher_type: 'rehber'
                }),
            });
            const data = await res.json();
            if (data.id) {
                setClasses(prev => [...prev, data]);
                setNewClassName("");
                setShowClassModal(false);
            } else {
                showAlert("Hata", data.message || "Sınıf oluşturulamadı.");
            }
        } catch (e) { console.error(e); }
        finally { setCreatingClass(false); }
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
                body: JSON.stringify({
                    institution_id: instId,
                    class_id: classId,
                    teacher_type: 'rehber'
                }),
            });
            if (res.ok) {
                setClasses(prev => prev.filter(c => c.id !== classId));
                setStudents(prev => prev.map(s => s.class_id === classId ? { ...s, class_id: undefined } : s));
                showAlert("Başarılı", "Sınıf silindi.");
            } else {
                showAlert("Hata", "Sınıf silinemedi.");
            }
        } catch (e) { console.error(e); }
    };

    // Stats calculations
    const approvedCount = students.filter(s => s.status === 'approved').length;
    const pendingCount = students.filter(s => s.status === 'pending').length;
    const totalClasses = classes.length;

    const filteredStudents = students.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()));
        if (filterStatus === 'all') return matchSearch;
        return matchSearch && s.status === filterStatus;
    });

    // ─── TAB: Overview ─────────────────────────────
    const renderOverview = () => (
        <>
            <View style={styles.tabHeader}>
                <Text style={styles.headerTitle}>📊 Kurum Genel Bakış</Text>
                <Text style={styles.headerSub}>
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
            </View>
            <View style={styles.statsRow}>
                {[
                    { icon: 'people', color: '#3B82F6', bg: '#DBEAFE', value: students.length, label: 'Toplam Öğrenci' },
                    { icon: 'checkmark-circle', color: '#059669', bg: '#D1FAE5', value: approvedCount, label: 'Onaylı' },
                    { icon: 'time', color: '#F59E0B', bg: '#FEF3C7', value: pendingCount, label: 'Bekleyen' },
                    { icon: 'layers', color: '#8B5CF6', bg: '#EDE9FE', value: totalClasses, label: 'Sınıf' },
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

            {/* Pending approvals */}
            {pendingCount > 0 && (
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>⏳ Onay Bekleyen Öğrenciler</Text>
                    {students.filter(s => s.status === 'pending').map(student => (
                        <View key={student.id} style={styles.pendingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.pendingName}>{student.name}</Text>
                                <Text style={styles.pendingEmail}>{student.email || '—'}</Text>
                            </View>
                            <TouchableOpacity style={styles.approveBtn} onPress={() => approveStudent(student.id)}>
                                <Ionicons name="checkmark" size={18} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectStudent(student.id)}>
                                <Ionicons name="close" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Class summary */}
            {classes.length > 0 && (
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>📚 Sınıf Dağılımı</Text>
                    {classes.map(c => {
                        const count = students.filter(s => s.class_id === c.id).length;
                        return (
                            <View key={c.id} style={styles.classRow}>
                                <Ionicons name="school" size={18} color={COLORS.secondary} />
                                <Text style={styles.className}>{c.name}</Text>
                                <Text style={styles.classCount}>{count} öğrenci</Text>
                            </View>
                        );
                    })}
                    <View style={styles.classRow}>
                        <Ionicons name="help-circle" size={18} color="#9CA3AF" />
                        <Text style={[styles.className, { color: '#9CA3AF' }]}>Sınıfsız</Text>
                        <Text style={styles.classCount}>{students.filter(s => !s.class_id).length} öğrenci</Text>
                    </View>
                </View>
            )}
        </>
    );

    // ─── TAB: Students ─────────────────────────────
    const renderStudents = () => (
        <>
            <View style={styles.tabHeader}>
                <Text style={styles.headerTitle}>👥 Tüm Öğrenciler</Text>
                <Text style={styles.headerSub}>{students.length} öğrenci</Text>
            </View>

            {/* Filters */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={[styles.searchBar, { flex: 1 }]}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Öğrenci ara..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                    {(['all', 'approved', 'pending'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterBtn, filterStatus === f && styles.filterBtnActive]}
                            onPress={() => setFilterStatus(f)}
                        >
                            <Text style={[styles.filterBtnText, filterStatus === f && { color: '#fff' }]}>
                                {f === 'all' ? 'Tümü' : f === 'approved' ? 'Onaylı' : 'Bekleyen'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Student List */}
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : filteredStudents.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Öğrenci bulunamadı.</Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {filteredStudents.map(student => (
                        <TouchableOpacity key={student.id} style={styles.studentCard} onPress={() => openStudentDetail(student)}>
                            <View style={styles.cardTop}>
                                <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.avatar}>
                                    <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
                                </LinearGradient>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardName}>{student.name}</Text>
                                    <Text style={styles.cardEmail}>{student.email || '—'}</Text>
                                </View>
                            </View>
                            <View style={styles.cardBottom}>
                                <View style={[styles.badge, student.status === 'approved' ? styles.badgeGreen : styles.badgeYellow]}>
                                    <Text style={[styles.badgeText, { color: student.status === 'approved' ? '#059669' : '#D97706' }]}>
                                        {student.status === 'approved' ? '✅ Onaylı' : '⏳ Bekliyor'}
                                    </Text>
                                </View>
                                {student.status === 'pending' && (
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        <TouchableOpacity style={styles.approveBtn} onPress={(e) => { e.stopPropagation(); approveStudent(student.id); }}>
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.rejectBtn} onPress={(e) => { e.stopPropagation(); rejectStudent(student.id); }}>
                                            <Ionicons name="close" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {student.status === 'approved' && (
                                    <TouchableOpacity style={styles.programBtn} onPress={(e) => { e.stopPropagation(); openProgramModal(student); }}>
                                        <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                                        <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>Ödev</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </>
    );

    // ─── TAB: Classes ──────────────────────────────
    const renderClasses = () => (
        <>
            <View style={styles.tabHeader}>
                <View>
                    <Text style={styles.headerTitle}>📚 Sınıf Yönetimi</Text>
                    <Text style={styles.headerSub}>{classes.length} aktif sınıf</Text>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowClassModal(true)}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Yeni Sınıf</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                {classes.map(c => {
                    const studentCount = students.filter(s => s.class_id === c.id).length;
                    return (
                        <View key={c.id} style={[styles.studentCard, { width: 280 }]}>
                            <View style={[styles.cardTop, { justifyContent: 'space-between' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={[styles.avatar, { backgroundColor: '#EDE9FE' }]}>
                                        <Ionicons name="school" size={20} color={COLORS.secondary} />
                                    </View>
                                    <View>
                                        <Text style={styles.cardName}>{c.name}</Text>
                                        <Text style={styles.cardEmail}>{studentCount} Öğrenci</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => deleteClass(c.id, c.name)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
                {classes.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="school-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Henüz hiç sınıf oluşturulmadı.</Text>
                    </View>
                )}
            </View>
        </>
    );

    // ─── TAB: Performance ──────────────────────────
    const renderPerformance = () => (
        <>
            <View style={styles.tabHeader}>
                <Text style={styles.headerTitle}>📈 Performans Raporu</Text>
            </View>
            {perfLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
            ) : performance ? (
                <>
                    {/* Summary */}
                    <View style={styles.statsRow}>
                        {[
                            { icon: 'school', color: '#3B82F6', bg: '#DBEAFE', value: performance.total_students, label: 'Öğrenci' },
                            { icon: 'document-text', color: '#8B5CF6', bg: '#EDE9FE', value: performance.total_exams, label: 'Deneme' },
                            { icon: 'people', color: '#059669', bg: '#D1FAE5', value: performance.students_with_exams, label: 'Aktif' },
                        ].map((s, i) => (
                            <View key={i} style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                                    <Ionicons name={s.icon as any} size={24} color={s.color} />
                                </View>
                                <View>
                                    <Text style={styles.statValue}>{s.value ?? 0}</Text>
                                    <Text style={styles.statLabel}>{s.label}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Exam Type Stats */}
                    {performance.exam_type_stats && Object.keys(performance.exam_type_stats).length > 0 && (
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Deneme Türü Dağılımı</Text>
                            {Object.entries(performance.exam_type_stats).map(([type, s]: any, i: number) => (
                                <View key={i} style={styles.typeRow}>
                                    <View style={styles.typeLabel}>
                                        <View style={[styles.typeDot, { backgroundColor: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#059669'][i % 5] }]} />
                                        <Text style={styles.typeText}>{type}</Text>
                                    </View>
                                    <Text style={styles.typeCount}>{s.count} deneme</Text>
                                    <Text style={styles.typeAvg}>Ort: {s.avg_net} net</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Ranking */}
                    {performance.student_rankings && performance.student_rankings.length > 0 && (
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>🏆 Öğrenci Sıralaması</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator>
                                <View>
                                    <View style={[styles.tableHeader, { minWidth: 800 }]}>
                                        <Text style={[styles.tableCell, { flex: 0.4 }]}>#</Text>
                                        <Text style={[styles.tableCell, { flex: 2 }]}>Öğrenci</Text>
                                        <Text style={styles.tableCell}>Deneme</Text>
                                        <Text style={[styles.tableCell, { color: '#3B82F6' }]}>TYT</Text>
                                        <Text style={[styles.tableCell, { color: '#8B5CF6' }]}>AYT</Text>
                                        <Text style={[styles.tableCell, { color: '#EC4899' }]}>YDT</Text>
                                        <Text style={[styles.tableCell, { color: '#F59E0B' }]}>LGS</Text>
                                        <Text style={[styles.tableCell, { color: '#059669' }]}>Genel</Text>
                                    </View>
                                    {performance.student_rankings.map((s: any, i: number) => (
                                        <View key={i} style={[styles.tableRow, { minWidth: 800 }, i % 2 === 0 && { backgroundColor: '#F9FAFB' }]}>
                                            <Text style={[styles.tableCellValue, { flex: 0.4 }]}>
                                                {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}
                                            </Text>
                                            <Text style={[styles.tableCellValue, { flex: 2, fontWeight: '600' }]}>{s.name}</Text>
                                            <Text style={styles.tableCellValue}>{s.exam_count}</Text>
                                            <Text style={[styles.tableCellValue, { color: '#3B82F6' }]}>{s.tyt_avg ?? '—'}</Text>
                                            <Text style={[styles.tableCellValue, { color: '#8B5CF6' }]}>{s.ayt_avg ?? '—'}</Text>
                                            <Text style={[styles.tableCellValue, { color: '#EC4899' }]}>{s.ydt_avg ?? '—'}</Text>
                                            <Text style={[styles.tableCellValue, { color: '#F59E0B' }]}>{s.lgs_avg ?? '—'}</Text>
                                            <Text style={[styles.tableCellValue, { color: '#059669', fontWeight: '700' }]}>{s.overall_avg}</Text>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="analytics-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Performans verisi yok.</Text>
                </View>
            )}
        </>
    );

    // ─── TAB: Notifications ────────────────────────
    const renderNotifications = () => {
        const recentPending = students.filter(s => s.status === 'pending');
        const recentApproved = students.filter(s => s.status === 'approved').slice(0, 10);

        return (
            <>
                <View style={styles.tabHeader}>
                    <Text style={styles.headerTitle}>🔔 Bildirimler</Text>
                </View>

                {recentPending.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>⏳ Onay Bekleyenler ({recentPending.length})</Text>
                        {recentPending.map(s => (
                            <View key={s.id} style={styles.pendingRow}>
                                <Ionicons name="person-add" size={18} color={COLORS.warning} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.pendingName}>{s.name}</Text>
                                    <Text style={styles.pendingEmail}>{s.email || '—'}</Text>
                                </View>
                                <TouchableOpacity style={styles.approveBtn} onPress={() => approveStudent(s.id)}>
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectStudent(s.id)}>
                                    <Ionicons name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>✅ Son Onaylanan Öğrenciler</Text>
                    {recentApproved.length === 0 ? (
                        <Text style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>Henüz onaylı öğrenci yok.</Text>
                    ) : (
                        recentApproved.map(s => (
                            <View key={s.id} style={styles.pendingRow}>
                                <Ionicons name="person" size={18} color={COLORS.success} />
                                <Text style={[styles.pendingName, { flex: 1 }]}>{s.name}</Text>
                                <Text style={{ color: '#059669', fontSize: 12 }}>Onaylı</Text>
                            </View>
                        ))
                    )}
                </View>
            </>
        );
    };

    // ─── SIDEBAR ───────────────────────────────────
    const menuItems: { id: TabType; icon: string; label: string }[] = [
        { id: 'overview', icon: 'grid-outline', label: 'Genel Bakış' },
        { id: 'students', icon: 'people-outline', label: 'Tüm Öğrenciler' },
        { id: 'classes', icon: 'layers-outline', label: 'Sınıflar' },
        { id: 'performance', icon: 'trending-up-outline', label: 'Performans' },
        { id: 'notifications', icon: 'notifications-outline', label: 'Bildirimler' },
    ];

    if (loading && !teacherData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Sidebar */}
            <LinearGradient colors={['#1E3A5F', '#0F2744']} style={styles.sidebar}>
                <View style={styles.brand}>
                    <View style={styles.brandLogo}><Text style={styles.brandLogoText}>RC</Text></View>
                    <Text style={styles.brandTitle}>Rehber Paneli</Text>
                </View>

                {menuItems.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.menuItem, activeTab === item.id && styles.menuItemActive]}
                        onPress={() => setActiveTab(item.id)}
                    >
                        <Ionicons name={item.icon as any} size={20} color={activeTab === item.id ? '#fff' : '#94A3B8'} />
                        <Text style={[styles.menuText, activeTab === item.id && styles.menuTextActive]}>{item.label}</Text>
                        {item.id === 'notifications' && pendingCount > 0 && (
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeText}>{pendingCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push('/teacher/assignments' as any)}
                >
                    <Ionicons name="create-outline" size={20} color="#94A3B8" />
                    <Text style={styles.menuText}>Ödev Atama</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <View style={styles.userProfile}>
                    <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.userAvatar}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                            {teacherData?.name?.slice(0, 1).toUpperCase() || 'R'}
                        </Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userName} numberOfLines={1}>{teacherData?.name || 'Rehber'}</Text>
                        <Text style={styles.userRole}>Rehber Öğretmen</Text>
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
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 32, paddingBottom: 60 }}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'students' && renderStudents()}
                {activeTab === 'classes' && renderClasses()}
                {activeTab === 'performance' && renderPerformance()}
                {activeTab === 'notifications' && renderNotifications()}
            </ScrollView>

            {/* ─── Student Detail Modal ──────────────── */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { width: 520 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📋 Öğrenci Detayı</Text>
                            <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedStudent(null); }}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        {loadingDetail ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 40 }} />
                        ) : selectedStudent ? (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                                    <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={[styles.avatar, { width: 52, height: 52, borderRadius: 16 }]}>
                                        <Text style={[styles.avatarText, { fontSize: 20 }]}>{selectedStudent.name.charAt(0).toUpperCase()}</Text>
                                    </LinearGradient>
                                    <View>
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{selectedStudent.name}</Text>
                                        <Text style={{ fontSize: 13, color: '#6B7280' }}>{selectedStudent.email || '—'}</Text>
                                    </View>
                                </View>
                                {studentAnaliz.length > 0 && (
                                    <View style={styles.sectionCard}>
                                        <Text style={styles.sectionTitle}>Deneme Sonuçları</Text>
                                        {studentAnaliz.map((a: any, i: number) => (
                                            <View key={i} style={styles.analizRow}>
                                                <View style={styles.analizScore}>
                                                    <Text style={styles.analizScoreText}>{a.net ?? '—'}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontWeight: '600', color: '#111827' }}>{a.lesson_name || a.ad || 'Deneme'}</Text>
                                                    <Text style={{ fontSize: 12, color: '#6B7280' }}>{a.type || 'Diğer'}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* ─── Program Modal ─────────────────────── */}
            <Modal visible={showProgramModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { width: 480 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📝 Ödev Ata — {programStudent?.name}</Text>
                            <TouchableOpacity onPress={() => setShowProgramModal(false)}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 10, marginBottom: 16 }}>
                            <TextInput style={styles.formInput} placeholder="Ders (örn: Matematik)" placeholderTextColor="#9CA3AF" value={subject} onChangeText={setSubject} />
                            <TextInput style={styles.formInput} placeholder="Konu (örn: Türev)" placeholderTextColor="#9CA3AF" value={topic} onChangeText={setTopic} />
                            <TextInput style={styles.formInput} placeholder="Soru sayısı" placeholderTextColor="#9CA3AF" value={questionCount} onChangeText={setQuestionCount} keyboardType="numeric" />
                            <TouchableOpacity style={[styles.filterBtn, styles.filterBtnActive, { alignSelf: 'flex-start' }]} onPress={addToProgram}>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>+ Ekle</Text>
                            </TouchableOpacity>
                        </View>

                        {programList.length > 0 && (
                            <View style={{ marginBottom: 16 }}>
                                {programList.map((p, i) => (
                                    <View key={i} style={styles.pendingRow}>
                                        <Text style={{ flex: 1, color: '#111827' }}>{p.task} ({p.questions} soru)</Text>
                                        <TouchableOpacity onPress={() => setProgramList(prev => prev.filter((_, j) => j !== i))}>
                                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowProgramModal(false)}>
                                <Text style={{ color: '#6B7280', fontWeight: '600' }}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, programList.length === 0 && { opacity: 0.4 }]} onPress={sendProgram} disabled={programList.length === 0}>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Gönder</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ─── Class Modal ───────────────────────── */}
            <Modal visible={showClassModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { width: 400 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📚 Yeni Sınıf Oluştur</Text>
                            <TouchableOpacity onPress={() => setShowClassModal(false)}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 16, marginBottom: 24 }}>
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>Sınıf Adı</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Örn: 12-A Sayısal"
                                    placeholderTextColor="#9CA3AF"
                                    value={newClassName}
                                    onChangeText={setNewClassName}
                                />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowClassModal(false)}>
                                <Text style={{ color: '#6B7280', fontWeight: '600' }}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryBtn, (!newClassName || creatingClass) && { opacity: 0.5 }]}
                                onPress={createClass}
                                disabled={!newClassName || creatingClass}
                            >
                                {creatingClass ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Oluştur</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#F3F4F6' },
    sidebar: { width: 260, paddingVertical: 24, paddingHorizontal: 16 },
    brand: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 12 },
    brandLogo: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
    brandLogoText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    brandTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 4 },
    menuItemActive: { backgroundColor: 'rgba(59,130,246,0.2)' },
    menuText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
    menuTextActive: { color: '#fff', fontWeight: '600' },
    notifBadge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 'auto' },
    notifBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    userProfile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    userAvatar: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    userName: { color: '#fff', fontSize: 13, fontWeight: '600' },
    userRole: { color: '#94A3B8', fontSize: 11 },
    main: { flex: 1 },

    // TABS
    tabHeader: { marginBottom: 24 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
    headerSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },

    // STATS
    statsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginBottom: 24 },
    statCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, minWidth: 180 },
    statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
    statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

    // SECTION
    sectionCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },

    // PENDING
    pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    pendingName: { fontSize: 14, fontWeight: '600', color: '#111827' },
    pendingEmail: { fontSize: 12, color: '#6B7280' },
    approveBtn: { backgroundColor: '#059669', width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rejectBtn: { backgroundColor: '#EF4444', width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

    // CLASS
    classRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    className: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
    classCount: { fontSize: 13, color: '#6B7280' },

    // SEARCH
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

    // FILTER
    filterBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
    filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

    // GRID
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },

    // CARD
    studentCard: { width: 260, backgroundColor: '#fff', borderRadius: 18, padding: 18 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    cardEmail: { fontSize: 12, color: '#6B7280' },
    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    avatar: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeGreen: { backgroundColor: '#D1FAE5' },
    badgeYellow: { backgroundColor: '#FEF3C7' },
    badgeText: { fontSize: 11, fontWeight: '600' },
    programBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#DBEAFE', backgroundColor: '#EFF6FF' },

    // PERFORMANCE
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    typeLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeDot: { width: 10, height: 10, borderRadius: 5 },
    typeText: { fontSize: 14, fontWeight: '600', color: '#111827' },
    typeCount: { fontSize: 13, color: '#6B7280', width: 90 },
    typeAvg: { fontSize: 13, color: '#059669', fontWeight: '600', width: 100 },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#E5E7EB' },
    tableCell: { flex: 1, fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    tableCellValue: { flex: 1, fontSize: 14, color: '#111827' },

    // ANALIZ
    analizRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 10 },
    analizScore: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
    analizScoreText: { color: '#2563EB', fontWeight: 'bold', fontSize: 13 },

    // EMPTY
    emptyState: { alignItems: 'center', padding: 60 },
    emptyText: { color: '#6B7280', marginTop: 16, fontSize: 16, fontWeight: '600' },

    // MODAL
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: 440, maxWidth: '90%', maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    formInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
    cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6' },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.primary },
    primaryBtnText: { color: '#fff', fontWeight: '600' },
});
