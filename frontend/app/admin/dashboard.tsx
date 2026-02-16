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
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../src/config/api';

const { width } = Dimensions.get('window');
const ADMIN_COLORS = {
    primary: '#F59E0B',
    secondary: '#EF4444',
    bg: '#F3F4F6',
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

export default function AdminDashboard() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminData, setAdminData] = useState<any>(null);

    // Create Teacher Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const stored = sessionStorage.getItem('admin_data');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setAdminData(parsed);
                    loadTeachers(parsed.id);
                    return;
                }
            }
        } catch (e) { /* ignore */ }
        router.replace('/admin/login');
    }, []);

    const loadTeachers = async (overrideId?: string) => {
        const aid = overrideId || adminData?.id;
        if (!aid) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/teachers?admin_id=${aid}`);
            const data = await res.json();
            if (data.teachers) setTeachers(data.teachers);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const createTeacher = async () => {
        if (!newName) {
            Alert.alert("Hata", "Lütfen öğretmen adını girin.");
            return;
        }
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/admin/create-teacher`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: adminData?.id, name: newName }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                Alert.alert("Başarılı", "Öğretmen oluşturuldu! Kayıt linkini kopyalayın.");
                setShowCreateModal(false);
                setNewName('');
                loadTeachers();
            } else {
                Alert.alert("Hata", data.message || "Bir hata oluştu.");
            }
        } catch (e) {
            Alert.alert("Hata", "Sunucuya bağlanılamadı.");
        } finally {
            setCreating(false);
        }
    };

    const deleteTeacher = (id: string, name: string) => {
        Alert.alert(
            "Öğretmen Sil",
            `"${name}" öğretmenini silmek istediğinize emin misiniz?`,
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_URL}/admin/delete-teacher`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ teacher_id: id, admin_id: adminData?.id }),
                            });
                            const data = await res.json();
                            if (data.status === 'success') {
                                loadTeachers();
                            } else {
                                Alert.alert("Hata", data.message || "Silinemedi.");
                            }
                        } catch (e) {
                            Alert.alert("Hata", "Sunucuya bağlanılamadı.");
                        }
                    },
                },
            ]
        );
    };

    const copyRegLink = (token: string) => {
        const link = `${API_URL}/admin/register/${token}`;
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(link);
            Alert.alert("Kopyalandı", "Kayıt linki panoya kopyalandı!");
        } else {
            Alert.alert("Kayıt Linki", link);
        }
    };

    const registeredCount = teachers.filter(t => t.is_registered).length;
    const pendingCount = teachers.filter(t => !t.is_registered).length;

    const renderTeacherCard = (teacher: Teacher) => (
        <View key={teacher.id} style={styles.teacherCard}>
            <View style={styles.teacherTop}>
                <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.teacherAvatar}>
                    <Text style={styles.avatarText}>{teacher.name.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                    <Text style={styles.teacherName}>{teacher.name}</Text>
                    <Text style={styles.teacherEmail}>{teacher.email}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteTeacher(teacher.id, teacher.name)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.metaRow}>
                <View style={[styles.badge, teacher.is_registered ? styles.badgeGreen : styles.badgeYellow]}>
                    <Text style={[styles.badgeText, teacher.is_registered ? styles.badgeTextGreen : styles.badgeTextYellow]}>
                        {teacher.is_registered ? '✅ Kayıtlı' : '⏳ Kayıt Bekliyor'}
                    </Text>
                </View>
                <View style={[styles.badge, styles.badgePurple]}>
                    <Text style={styles.badgeTextPurple}>🔑 {teacher.invite_code}</Text>
                </View>
            </View>

            {!teacher.is_registered && teacher.registration_token && (
                <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => copyRegLink(teacher.registration_token!)}
                >
                    <Ionicons name="copy-outline" size={16} color="#F59E0B" />
                    <Text style={styles.copyBtnText}>Kayıt Linkini Kopyala</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Sidebar */}
            <LinearGradient colors={['#1F2937', '#111827']} style={styles.sidebar}>
                <View style={styles.brand}>
                    <View style={styles.brandLogo}>
                        <Text style={styles.brandLogoText}>RC</Text>
                    </View>
                    <Text style={styles.brandTitle}>Yönetici Paneli</Text>
                </View>

                <TouchableOpacity style={[styles.menuItem, styles.menuItemActive]}>
                    <Ionicons name="people-outline" size={20} color="#fff" />
                    <Text style={[styles.menuText, styles.menuTextActive]}>Öğretmenler</Text>
                </TouchableOpacity>

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
                        if (typeof window !== 'undefined') sessionStorage.removeItem('admin_data');
                        router.replace('/admin/login');
                    }}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Main Content */}
            <View style={styles.main}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>{adminData?.name || 'Kurum'} Öğretmenleri</Text>
                        <Text style={styles.headerDate}>
                            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.createBtnText}>Yeni Öğretmen</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="people" size={24} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{teachers.length}</Text>
                                <Text style={styles.statLabel}>Toplam Öğretmen</Text>
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                                <Ionicons name="checkmark-circle" size={24} color="#059669" />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{registeredCount}</Text>
                                <Text style={styles.statLabel}>Kayıtlı</Text>
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="time" size={24} color="#D97706" />
                            </View>
                            <View>
                                <Text style={styles.statValue}>{pendingCount}</Text>
                                <Text style={styles.statLabel}>Kayıt Bekleyen</Text>
                            </View>
                        </View>
                    </View>

                    {/* Teachers List */}
                    {loading ? (
                        <ActivityIndicator size="large" color={ADMIN_COLORS.primary} style={{ marginTop: 40 }} />
                    ) : teachers.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="school-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Henüz öğretmen oluşturulmadı.</Text>
                            <Text style={styles.emptySubText}>"Yeni Öğretmen" butonuna tıklayarak başlayın.</Text>
                        </View>
                    ) : (
                        <View style={styles.teacherGrid}>
                            {teachers.map(renderTeacherCard)}
                        </View>
                    )}

                    <View style={{ height: 50 }} />
                </ScrollView>
            </View>

            {/* Create Teacher Modal */}
            <Modal visible={showCreateModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Yeni Öğretmen Oluştur</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Öğretmen Adı</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Örn: Ahmet Yılmaz"
                            placeholderTextColor="#9CA3AF"
                            value={newName}
                            onChangeText={setNewName}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                                <Text style={styles.cancelBtnText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitBtn, creating && { opacity: 0.5 }]}
                                onPress={createTeacher}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Oluştur</Text>
                                )}
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
    header: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
    headerDate: { color: '#6B7280', fontSize: 14, marginTop: 4 },
    createBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#F59E0B', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
    createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    content: { flex: 1, padding: 32 },

    // STATS
    statsRow: { flexDirection: 'row', gap: 20, marginBottom: 32 },
    statCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    statIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
    statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

    // TEACHER GRID
    teacherGrid: { gap: 16 },
    teacherCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    teacherTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
    teacherAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
    teacherName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    teacherEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 14 },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    badgeGreen: { backgroundColor: '#D1FAE5' },
    badgeYellow: { backgroundColor: '#FEF3C7' },
    badgePurple: { backgroundColor: '#EDE9FE' },
    badgeText: { fontSize: 12, fontWeight: '600' },
    badgeTextGreen: { color: '#059669' },
    badgeTextYellow: { color: '#D97706' },
    badgeTextPurple: { color: '#7C3AED' },
    copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
    copyBtnText: { color: '#F59E0B', fontWeight: '600', fontSize: 13 },

    // EMPTY
    emptyState: { alignItems: 'center', padding: 60 },
    emptyText: { color: '#6B7280', marginTop: 16, fontSize: 16, fontWeight: '600' },
    emptySubText: { color: '#9CA3AF', marginTop: 4, fontSize: 14 },

    // MODAL
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: 440, maxWidth: '90%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    modalLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
    modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 28 },
    cancelBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    cancelBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
    submitBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
