import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
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
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
    } else {
        const { Alert } = require('react-native');
        Alert.alert(title, message);
    }
};

interface Teacher {
    id: string;
    name: string;
    email: string;
    invite_code: string;
    registration_token?: string;
    is_registered: boolean;
    created_at: string;
}

type TabType = 'teachers' | 'stats' | 'notifications' | 'settings' | 'performance';

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('teachers');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminData, setAdminData] = useState<any>(null);

    // Create Teacher Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    // Invite Code Modal
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [newInviteCode, setNewInviteCode] = useState('');
    const [updatingCode, setUpdatingCode] = useState(false);

    // Teacher Detail Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [teacherDetail, setTeacherDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Stats
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState<any[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);

    // Settings
    const [settingsData, setSettingsData] = useState({ name: '', contact_email: '', phone: '', address: '' });
    const [savingSettings, setSavingSettings] = useState(false);

    // Performance
    const [performance, setPerformance] = useState<any>(null);
    const [perfLoading, setPerfLoading] = useState(false);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const stored = sessionStorage.getItem('admin_data');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setAdminData(parsed);
                    setSettingsData({
                        name: parsed.name || '',
                        contact_email: parsed.contact_email || '',
                        phone: parsed.phone || '',
                        address: parsed.address || '',
                    });
                    loadTeachers(parsed.id);
                    return;
                }
            }
        } catch (e) { /* ignore */ }
        router.replace('/staff/login');
    }, []);

    useEffect(() => {
        if (!adminData?.id) return;
        if (activeTab === 'stats') loadStats();
        if (activeTab === 'notifications') loadNotifications();
        if (activeTab === 'performance') loadPerformance();
    }, [activeTab, adminData]);

    // ─── Data Loading ─────────────────────────────────────
    const loadTeachers = async (overrideId?: string) => {
        const aid = overrideId || adminData?.id;
        if (!aid) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/teachers?admin_id=${aid}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.teachers) setTeachers(data.teachers);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadStats = async () => {
        setStatsLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/dashboard-stats?admin_id=${adminData.id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.status === 'success') setStats(data);
        } catch (e) { console.error(e); }
        finally { setStatsLoading(false); }
    };

    const loadNotifications = async () => {
        setNotifLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/notifications?admin_id=${adminData.id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.notifications) setNotifications(data.notifications);
        } catch (e) { console.error(e); }
        finally { setNotifLoading(false); }
    };

    const loadPerformance = async () => {
        setPerfLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/performance?admin_id=${adminData.id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.status === 'success') setPerformance(data);
        } catch (e) { console.error(e); }
        finally { setPerfLoading(false); }
    };

    const loadTeacherDetail = async (teacherId: string) => {
        setDetailLoading(true);
        setShowDetailModal(true);
        try {
            const res = await fetch(`${API_URL}/admin/teacher-detail/${teacherId}?admin_id=${adminData.id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.teacher) setTeacherDetail(data.teacher);
        } catch (e) { console.error(e); }
        finally { setDetailLoading(false); }
    };

    // ─── Actions ──────────────────────────────────────────
    const createTeacher = async () => {
        if (!newName) { showAlert("Hata", "Lütfen öğretmen adını girin."); return; }
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/admin/create-teacher`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ admin_id: adminData?.id, name: newName }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                showAlert("Başarılı", "Öğretmen oluşturuldu!");
                setShowCreateModal(false);
                setNewName('');
                loadTeachers();
            } else { showAlert("Hata", data.message || "Bir hata oluştu."); }
        } catch (e) { showAlert("Hata", "Sunucuya bağlanılamadı."); }
        finally { setCreating(false); }
    };

    const deleteTeacher = async (id: string, name: string) => {
        const confirmed = Platform.OS === 'web'
            ? window.confirm(`"${name}" öğretmenini silmek istediğinize emin misiniz?`)
            : true;
        if (!confirmed) return;
        try {
            const res = await fetch(`${API_URL}/admin/delete-teacher`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ teacher_id: id, admin_id: adminData?.id }),
            });
            const data = await res.json();
            if (data.status === 'success') { loadTeachers(); }
            else { showAlert("Hata", data.message || "Silinemedi."); }
        } catch (e) { showAlert("Hata", "Sunucuya bağlanılamadı."); }
    };

    const copyRegLink = (token: string) => {
        const link = `${API_URL}/admin/register/${token}`;
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(link);
            showAlert("Kopyalandı", "Kayıt linki panoya kopyalandı!");
        } else { showAlert("Kayıt Linki", link); }
    };

    const copyInviteCode = () => {
        const code = adminData?.invite_code;
        if (!code) { showAlert("Bilgi", "Henüz bir davet kodu oluşturulmadı."); return; }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(code);
            showAlert("Kopyalandı", `Kurum kodu "${code}" kopyalandı!`);
        }
    };

    const updateInviteCode = async () => {
        if (!newInviteCode || newInviteCode.length < 3) {
            showAlert("Hata", "Kod en az 3 karakter olmalıdır."); return;
        }
        setUpdatingCode(true);
        try {
            const res = await fetch(`${API_URL}/admin/update-invite-code`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ teacher_id: adminData?.id, admin_id: adminData?.id, new_code: newInviteCode }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                const updated = { ...adminData, invite_code: newInviteCode };
                setAdminData(updated);
                if (typeof window !== 'undefined') sessionStorage.setItem('admin_data', JSON.stringify(updated));
                setShowCodeModal(false);
                showAlert("Başarılı", "Kurum davet kodu güncellendi!");
            } else { showAlert("Hata", data.message || "Kod güncellenemedi."); }
        } catch (e) { showAlert("Hata", "Sunucuya bağlanılamadı."); }
        finally { setUpdatingCode(false); }
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch(`${API_URL}/admin/update-settings`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ admin_id: adminData?.id, ...settingsData }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                const updated = { ...adminData, ...settingsData };
                setAdminData(updated);
                if (typeof window !== 'undefined') sessionStorage.setItem('admin_data', JSON.stringify(updated));
                showAlert("Başarılı", "Ayarlar kaydedildi!");
            } else { showAlert("Hata", data.message || "Ayarlar kaydedilemedi."); }
        } catch (e) { showAlert("Hata", "Sunucuya bağlanılamadı."); }
        finally { setSavingSettings(false); }
    };

    // ─── Computed ─────────────────────────────────────────
    const registeredCount = teachers.filter(t => t.is_registered).length;
    const pendingCount = teachers.filter(t => !t.is_registered).length;
    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // ─── Tab: Teachers ────────────────────────────────────
    const renderTeachersTab = () => (
        <>
            {/* Header */}
            <View style={styles.tabHeader}>
                <View>
                    <Text style={styles.headerTitle}>{adminData?.name || 'Kurum'} Öğretmenleri</Text>
                    <Text style={styles.headerDate}>
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <View style={styles.inviteCodeBox}>
                        <Ionicons name="key-outline" size={18} color="#7C3AED" />
                        <Text style={styles.inviteCodeLabel}>Kurum Kodu:</Text>
                        <Text style={styles.inviteCodeValue}>{adminData?.invite_code || '—'}</Text>
                        <TouchableOpacity onPress={copyInviteCode} style={styles.inviteAction}>
                            <Ionicons name="copy-outline" size={16} color="#7C3AED" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setNewInviteCode(adminData?.invite_code || ''); setShowCodeModal(true); }} style={styles.inviteAction}>
                            <Ionicons name="create-outline" size={16} color="#7C3AED" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowCreateModal(true)}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.primaryBtnText}>Yeni Öğretmen</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Mini Stats */}
            <View style={styles.statsRow}>
                {[
                    { icon: 'people', color: '#F59E0B', bg: '#FEF3C7', value: teachers.length, label: 'Toplam' },
                    { icon: 'checkmark-circle', color: '#059669', bg: '#D1FAE5', value: registeredCount, label: 'Kayıtlı' },
                    { icon: 'time', color: '#D97706', bg: '#FEF3C7', value: pendingCount, label: 'Bekleyen' },
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

            {/* Search */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Öğretmen ara..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Teacher List */}
            {loading ? (
                <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 40 }} />
            ) : filteredTeachers.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="school-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>{searchQuery ? 'Eşleşen öğretmen bulunamadı.' : 'Henüz öğretmen yok.'}</Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {filteredTeachers.map(teacher => (
                        <TouchableOpacity key={teacher.id} style={styles.card} onPress={() => loadTeacherDetail(teacher.id)}>
                            <View style={styles.cardTop}>
                                <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.avatar}>
                                    <Text style={styles.avatarText}>{teacher.name.charAt(0).toUpperCase()}</Text>
                                </LinearGradient>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{teacher.name}</Text>
                                    <Text style={styles.cardSub}>{teacher.email || 'Kayıt bekleniyor'}</Text>
                                </View>
                                <TouchableOpacity style={styles.deleteBtn} onPress={(e) => { e.stopPropagation(); deleteTeacher(teacher.id, teacher.name); }}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.badgeRow}>
                                <View style={[styles.badge, teacher.is_registered ? styles.badgeGreen : styles.badgeYellow]}>
                                    <Text style={[styles.badgeText, { color: teacher.is_registered ? '#059669' : '#D97706' }]}>
                                        {teacher.is_registered ? '✅ Kayıtlı' : '⏳ Bekliyor'}
                                    </Text>
                                </View>
                            </View>
                            {!teacher.is_registered && teacher.registration_token && (
                                <TouchableOpacity style={styles.linkBtn} onPress={(e) => { e.stopPropagation(); copyRegLink(teacher.registration_token!); }}>
                                    <Ionicons name="copy-outline" size={16} color="#F59E0B" />
                                    <Text style={styles.linkBtnText}>Kayıt Linkini Kopyala</Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </>
    );

    // ─── Tab: Stats ───────────────────────────────────────
    const renderStatsTab = () => (
        <>
            <View style={styles.tabHeader}>
                <Text style={styles.headerTitle}>📊 Kurum İstatistikleri</Text>
            </View>
            {statsLoading ? (
                <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 60 }} />
            ) : stats ? (
                <View style={styles.statsGrid}>
                    {[
                        { icon: 'people', color: '#F59E0B', bg: '#FEF3C7', value: stats.total_teachers, label: 'Toplam Öğretmen' },
                        { icon: 'checkmark-circle', color: '#059669', bg: '#D1FAE5', value: stats.registered_teachers, label: 'Kayıtlı Öğretmen' },
                        { icon: 'school', color: '#3B82F6', bg: '#DBEAFE', value: stats.total_students, label: 'Toplam Öğrenci' },
                        { icon: 'person-add', color: '#8B5CF6', bg: '#EDE9FE', value: stats.approved_students, label: 'Onaylı Öğrenci' },
                        { icon: 'time', color: '#D97706', bg: '#FEF3C7', value: stats.pending_students, label: 'Onay Bekleyen' },
                        { icon: 'layers', color: '#EC4899', bg: '#FCE7F3', value: stats.total_classes, label: 'Toplam Sınıf' },
                    ].map((s, i) => (
                        <View key={i} style={styles.bigStatCard}>
                            <View style={[styles.bigStatIcon, { backgroundColor: s.bg }]}>
                                <Ionicons name={s.icon as any} size={32} color={s.color} />
                            </View>
                            <Text style={styles.bigStatValue}>{s.value ?? 0}</Text>
                            <Text style={styles.bigStatLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>İstatistik verisi yüklenemedi.</Text>
                </View>
            )}
        </>
    );

    // ─── Tab: Notifications ───────────────────────────────
    const renderNotificationsTab = () => (
        <>
            <View style={styles.tabHeader}>
                <Text style={styles.headerTitle}>🔔 Bildirimler</Text>
            </View>
            {notifLoading ? (
                <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 60 }} />
            ) : notifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Henüz bildirim yok.</Text>
                </View>
            ) : (
                <View style={styles.notifList}>
                    {notifications.map((n, i) => (
                        <View key={i} style={styles.notifCard}>
                            <View style={[styles.notifIcon, {
                                backgroundColor: n.type === 'student_joined' ? '#DBEAFE'
                                    : n.type === 'teacher_registered' ? '#D1FAE5' : '#FEF3C7'
                            }]}>
                                <Ionicons
                                    name={n.type === 'student_joined' ? 'school' : 'person-add'}
                                    size={20}
                                    color={n.type === 'student_joined' ? '#3B82F6'
                                        : n.type === 'teacher_registered' ? '#059669' : '#D97706'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.notifMessage}>{n.message}</Text>
                                {n.date && (
                                    <Text style={styles.notifDate}>
                                        {new Date(n.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </>
    );

    // ─── Tab: Settings ────────────────────────────────────
    const renderSettingsTab = () => (
        <>
            <View style={styles.tabHeader}>
                <Text style={styles.headerTitle}>⚙️ Kurum Ayarları</Text>
            </View>
            <View style={styles.settingsForm}>
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Kurum Adı</Text>
                    <TextInput
                        style={styles.formInput}
                        value={settingsData.name}
                        onChangeText={v => setSettingsData(p => ({ ...p, name: v }))}
                        placeholder="Kurumunuzun adı"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>İletişim E-postası</Text>
                    <TextInput
                        style={styles.formInput}
                        value={settingsData.contact_email}
                        onChangeText={v => setSettingsData(p => ({ ...p, contact_email: v }))}
                        placeholder="iletisim@kurum.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                    />
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Telefon</Text>
                    <TextInput
                        style={styles.formInput}
                        value={settingsData.phone}
                        onChangeText={v => setSettingsData(p => ({ ...p, phone: v }))}
                        placeholder="0555 123 4567"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Adres</Text>
                    <TextInput
                        style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                        value={settingsData.address}
                        onChangeText={v => setSettingsData(p => ({ ...p, address: v }))}
                        placeholder="Kurumunuzun adresi"
                        placeholderTextColor="#9CA3AF"
                        multiline
                    />
                </View>
                <TouchableOpacity
                    style={[styles.primaryBtn, { alignSelf: 'flex-start', marginTop: 8 }, savingSettings && { opacity: 0.5 }]}
                    onPress={saveSettings}
                    disabled={savingSettings}
                >
                    {savingSettings ? <ActivityIndicator color="#fff" size="small" /> : (
                        <>
                            <Ionicons name="save" size={18} color="#fff" />
                            <Text style={styles.primaryBtnText}>Kaydet</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </>
    );

    // ─── Tab: Performance ─────────────────────────────────
    const renderPerformanceTab = () => (
        <>
            <View style={styles.tabHeader}>
                <Text style={styles.headerTitle}>📈 Performans Raporu</Text>
            </View>
            {perfLoading ? (
                <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 60 }} />
            ) : performance ? (
                <>
                    {/* Summary Row */}
                    <View style={styles.statsRow}>
                        {[
                            { icon: 'school', color: '#3B82F6', bg: '#DBEAFE', value: performance.total_students, label: 'Toplam Öğrenci' },
                            { icon: 'document-text', color: '#8B5CF6', bg: '#EDE9FE', value: performance.total_exams, label: 'Toplam Deneme' },
                            { icon: 'trending-up', color: '#059669', bg: '#D1FAE5', value: performance.overall_avg_net, label: 'Ortalama Net' },
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
                            <Text style={styles.sectionTitle}>🏆 Öğrenci Sıralaması (Ortalama Net)</Text>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCell, { flex: 0.5 }]}>#</Text>
                                <Text style={[styles.tableCell, { flex: 2 }]}>Öğrenci</Text>
                                <Text style={styles.tableCell}>Deneme</Text>
                                <Text style={styles.tableCell}>Ort. Net</Text>
                                <Text style={styles.tableCell}>En İyi</Text>
                            </View>
                            {performance.student_rankings.map((s: any, i: number) => (
                                <View key={i} style={[styles.tableRow, i % 2 === 0 && { backgroundColor: '#F9FAFB' }]}>
                                    <Text style={[styles.tableCellValue, { flex: 0.5 }]}>
                                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`}
                                    </Text>
                                    <Text style={[styles.tableCellValue, { flex: 2, fontWeight: '600' }]}>{s.name}</Text>
                                    <Text style={styles.tableCellValue}>{s.exam_count}</Text>
                                    <Text style={[styles.tableCellValue, { color: '#059669', fontWeight: '700' }]}>{s.avg_net}</Text>
                                    <Text style={[styles.tableCellValue, { color: '#3B82F6' }]}>{s.best_net}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="analytics-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Performans verisi yüklenemedi.</Text>
                </View>
            )}
        </>
    );

    // ─── Sidebar Menu Items ───────────────────────────────
    const menuItems: { id: TabType; icon: string; label: string }[] = [
        { id: 'teachers', icon: 'people-outline', label: 'Öğretmenler' },
        { id: 'stats', icon: 'stats-chart-outline', label: 'İstatistikler' },
        { id: 'performance', icon: 'trending-up-outline', label: 'Performans' },
        { id: 'notifications', icon: 'notifications-outline', label: 'Bildirimler' },
        { id: 'settings', icon: 'settings-outline', label: 'Ayarlar' },
    ];

    return (
        <View style={styles.container}>
            {/* Sidebar */}
            <LinearGradient colors={['#1F2937', '#111827']} style={styles.sidebar}>
                <View style={styles.brand}>
                    <View style={styles.brandLogo}><Text style={styles.brandLogoText}>RC</Text></View>
                    <Text style={styles.brandTitle}>Yönetici Paneli</Text>
                </View>

                {menuItems.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.menuItem, activeTab === item.id && styles.menuItemActive]}
                        onPress={() => setActiveTab(item.id)}
                    >
                        <Ionicons name={item.icon as any} size={20} color={activeTab === item.id ? '#fff' : '#9CA3AF'} />
                        <Text style={[styles.menuText, activeTab === item.id && styles.menuTextActive]}>{item.label}</Text>
                    </TouchableOpacity>
                ))}

                <View style={{ flex: 1 }} />

                <View style={styles.userProfile}>
                    <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.userAvatar}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                            {adminData?.name?.slice(0, 1).toUpperCase() || 'A'}
                        </Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userName} numberOfLines={1}>{adminData?.name || 'Admin'}</Text>
                        <Text style={styles.userRole}>Yönetici</Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                        if (typeof window !== 'undefined') {
                            sessionStorage.removeItem('admin_data');
                            sessionStorage.removeItem('admin_token');
                        }
                        router.replace('/staff/login');
                    }}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Main Content */}
            <ScrollView style={styles.main} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 32, paddingBottom: 60 }}>
                {activeTab === 'teachers' && renderTeachersTab()}
                {activeTab === 'stats' && renderStatsTab()}
                {activeTab === 'notifications' && renderNotificationsTab()}
                {activeTab === 'settings' && renderSettingsTab()}
                {activeTab === 'performance' && renderPerformanceTab()}
            </ScrollView>

            {/* ─── Modals ──────────────────────────────────── */}

            {/* Create Teacher */}
            <Modal visible={showCreateModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Yeni Öğretmen Oluştur</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.formLabel}>Öğretmen Adı</Text>
                        <TextInput style={styles.formInput} placeholder="Örn: Ahmet Yılmaz" placeholderTextColor="#9CA3AF" value={newName} onChangeText={setNewName} />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                                <Text style={styles.cancelBtnText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, creating && { opacity: 0.5 }]} onPress={createTeacher} disabled={creating}>
                                {creating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryBtnText}>Oluştur</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Invite Code */}
            <Modal visible={showCodeModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Kurum Davet Kodunu Düzenle</Text>
                            <TouchableOpacity onPress={() => setShowCodeModal(false)}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.formLabel}>Davet Kodu</Text>
                        <TextInput style={styles.formInput} placeholder="Örn: KURUM2024" placeholderTextColor="#9CA3AF" value={newInviteCode} onChangeText={setNewInviteCode} autoCapitalize="characters" />
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>Öğrenciler bu kodu kullanarak kurumunuza katılabilir.</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCodeModal(false)}>
                                <Text style={styles.cancelBtnText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryBtn, updatingCode && { opacity: 0.5 }]} onPress={updateInviteCode} disabled={updatingCode}>
                                {updatingCode ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryBtnText}>Kaydet</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Teacher Detail */}
            <Modal visible={showDetailModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { width: 560 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📋 Öğretmen Detayı</Text>
                            <TouchableOpacity onPress={() => { setShowDetailModal(false); setTeacherDetail(null); }}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        {detailLoading ? (
                            <ActivityIndicator size="large" color="#F59E0B" style={{ marginVertical: 40 }} />
                        ) : teacherDetail ? (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                                    <LinearGradient colors={['#F59E0B', '#EF4444']} style={[styles.avatar, { width: 56, height: 56, borderRadius: 18 }]}>
                                        <Text style={[styles.avatarText, { fontSize: 22 }]}>{teacherDetail.name?.charAt(0).toUpperCase()}</Text>
                                    </LinearGradient>
                                    <View>
                                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>{teacherDetail.name}</Text>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>{teacherDetail.email || 'Kayıt bekleniyor'}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
                                    <View style={[styles.miniStat, { backgroundColor: '#DBEAFE' }]}>
                                        <Text style={[styles.miniStatValue, { color: '#3B82F6' }]}>{teacherDetail.student_count}</Text>
                                        <Text style={styles.miniStatLabel}>Öğrenci</Text>
                                    </View>
                                    <View style={[styles.miniStat, { backgroundColor: '#FCE7F3' }]}>
                                        <Text style={[styles.miniStatValue, { color: '#EC4899' }]}>{teacherDetail.class_count}</Text>
                                        <Text style={styles.miniStatLabel}>Sınıf</Text>
                                    </View>
                                </View>
                                {teacherDetail.students?.length > 0 && (
                                    <>
                                        <Text style={styles.sectionTitle}>Öğrenciler</Text>
                                        {teacherDetail.students.map((s: any) => (
                                            <View key={s.id} style={styles.detailRow}>
                                                <Ionicons name="person" size={16} color="#6B7280" />
                                                <Text style={styles.detailRowText}>{s.name}</Text>
                                                <View style={[styles.badge, s.status === 'approved' ? styles.badgeGreen : styles.badgeYellow]}>
                                                    <Text style={[styles.badgeText, { color: s.status === 'approved' ? '#059669' : '#D97706', fontSize: 11 }]}>
                                                        {s.status === 'approved' ? 'Onaylı' : 'Bekliyor'}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </>
                                )}
                                {teacherDetail.classes?.length > 0 && (
                                    <>
                                        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Sınıflar</Text>
                                        {teacherDetail.classes.map((c: any) => (
                                            <View key={c.id} style={styles.detailRow}>
                                                <Ionicons name="layers" size={16} color="#6B7280" />
                                                <Text style={styles.detailRowText}>{c.name}</Text>
                                            </View>
                                        ))}
                                    </>
                                )}
                            </>
                        ) : null}
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
    brandLogo: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' },
    brandLogoText: { color: '#fff', fontWeight: '900', fontSize: 16 },
    brandTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 5, gap: 12 },
    menuItemActive: { backgroundColor: 'rgba(245,158,11,0.15)' },
    menuText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
    menuTextActive: { color: '#fff', fontWeight: 'bold' },
    userProfile: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, gap: 12 },
    userAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    userName: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    userRole: { color: '#9CA3AF', fontSize: 11 },

    // MAIN
    main: { flex: 1 },
    tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
    headerDate: { color: '#6B7280', fontSize: 14, marginTop: 4 },

    // INVITE CODE
    inviteCodeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EDE9FE', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
    inviteCodeLabel: { fontSize: 13, color: '#7C3AED', fontWeight: '500' },
    inviteCodeValue: { fontSize: 15, color: '#7C3AED', fontWeight: '800', letterSpacing: 1 },
    inviteAction: { padding: 4, borderRadius: 6, backgroundColor: 'rgba(124,58,237,0.1)' },

    // BUTTONS
    primaryBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    cancelBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    cancelBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },

    // STATS
    statsRow: { flexDirection: 'row', gap: 20, marginBottom: 24 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
    statIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
    statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    bigStatCard: { width: '30%', backgroundColor: '#fff', padding: 28, borderRadius: 20, alignItems: 'center', gap: 12 },
    bigStatIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    bigStatValue: { fontSize: 32, fontWeight: '900', color: '#111827' },
    bigStatLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },

    miniStat: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
    miniStatValue: { fontSize: 28, fontWeight: '900' },
    miniStatLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },

    // SEARCH
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, height: 48, gap: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },

    // CARDS
    grid: { gap: 16 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 20 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
    avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    deleteBtn: { padding: 8, borderRadius: 10, backgroundColor: '#FEE2E2' },
    badgeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 14 },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    badgeGreen: { backgroundColor: '#D1FAE5' },
    badgeYellow: { backgroundColor: '#FEF3C7' },
    badgeText: { fontSize: 12, fontWeight: '600' },
    linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
    linkBtnText: { color: '#F59E0B', fontWeight: '600', fontSize: 13 },

    // NOTIFICATIONS
    notifList: { gap: 12 },
    notifCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#fff', padding: 18, borderRadius: 16 },
    notifIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    notifMessage: { fontSize: 14, color: '#111827', fontWeight: '500' },
    notifDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

    // SETTINGS
    settingsForm: { backgroundColor: '#fff', padding: 28, borderRadius: 20, maxWidth: 560 },
    formGroup: { marginBottom: 20 },
    formLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
    formInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },

    // PERFORMANCE
    sectionCard: { backgroundColor: '#fff', padding: 24, borderRadius: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
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

    // DETAIL
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    detailRowText: { flex: 1, fontSize: 14, color: '#111827' },

    // EMPTY & MODAL
    emptyState: { alignItems: 'center', padding: 60 },
    emptyText: { color: '#6B7280', marginTop: 16, fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: 440, maxWidth: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 28 },
});
