import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert, Modal, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@RCSinavim_ExamCalendar';

interface ExamEvent {
    id: string;
    title: string;
    date: string;
    type: 'TYT' | 'AYT' | 'YDT' | 'LGS' | 'Diğer';
    note?: string;
}

const TYPE_COLORS: Record<string, string> = {
    'TYT': '#3B82F6', 'AYT': '#EF4444', 'YDT': '#F59E0B', 'LGS': '#10B981', 'Diğer': '#6B7280',
};
const TYPE_ICONS: Record<string, string> = {
    'TYT': 'school', 'AYT': 'rocket', 'YDT': 'language', 'LGS': 'book', 'Diğer': 'document',
};

const getDaysUntil = (dateStr: string) => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / 86400000);
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' });
};

export const ExamCalendar = ({ onBack, theme, institution }: any) => {
    const [exams, setExams] = useState<ExamEvent[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<ExamEvent['type']>('TYT');
    const [note, setNote] = useState('');
    const [instExams, setInstExams] = useState<ExamEvent[]>([]);
    const [loadingInst, setLoadingInst] = useState(false);
    const [activeTab, setActiveTab] = useState<'personal' | 'institutional'>('personal');
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    useEffect(() => {
        loadExams();
        if (institution?.id) fetchInstitutionalExams(institution.id);
    }, [institution?.id]);

    const fetchInstitutionalExams = async (instId: string) => {
        setLoadingInst(true);
        try {
            const response = await fetch(`${API_URL}/events/${instId}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                // Convert backend format to ExamEvent format
                const mapped: ExamEvent[] = data.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    type: (e.type === 'trial' ? 'TYT' : 'Diğer') as any, // Simple mapping
                    note: e.description,
                    isInstitutional: true
                }));
                setInstExams(mapped);
            }
        } catch (e) {
            console.error("Institutional exams fetch error:", e);
        } finally {
            setLoadingInst(false);
        }
    };

    const loadExams = async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setExams(JSON.parse(raw));
    };

    const saveExams = async (list: ExamEvent[]) => {
        setExams(list);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    };

    const addExam = () => {
        if (!title.trim() || !date.trim()) { Alert.alert('Eksik', 'Başlık ve tarih giriniz.'); return; }
        const n: ExamEvent = { id: Date.now().toString(), title: title.trim(), date, type, note: note.trim() };
        saveExams([...exams, n].sort((a, b) => a.date.localeCompare(b.date)));
        setTitle(''); setDate(new Date().toISOString().split('T')[0]); setNote('');
        setModalVisible(false);
    };

    const deleteExam = (id: string) => {
        Alert.alert('Sil', 'Bu sınavı silmek istiyor musun?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => saveExams(exams.filter(e => e.id !== id)) },
        ]);
    };

    const upcoming = exams.filter(e => getDaysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
    const past = exams.filter(e => getDaysUntil(e.date) < 0).sort((a, b) => b.date.localeCompare(a.date));
    const nextExam = upcoming[0];

    return (
        <View style={[s.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                {/* ═══ HEADER ═══ */}
                <LinearGradient
                    colors={isDark ? ['#0F1B3C', '#1E3A5F', '#1E40AF'] : ['#3B82F6', '#2563EB', '#1D4ED8']}
                    style={s.header}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                    <View style={[s.decorCircle, { top: -30, right: -20, width: 100, height: 100 }]} />
                    <View style={[s.decorCircle, { bottom: -10, left: -30, width: 80, height: 80 }]} />
                    <View style={s.headerRow}>
                        <TouchableOpacity onPress={onBack} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={s.headerTitle}>Deneme Takvimi</Text>
                        <View style={s.headerBadge}>
                            <Text style={s.headerBadgeText}>{activeTab === 'personal' ? upcoming.length : instExams.length}</Text>
                        </View>
                    </View>

                    {/* Tab Switcher */}
                    <View style={s.tabBar}>
                        <TouchableOpacity
                            style={[s.tabItem, activeTab === 'personal' && s.tabItemActive]}
                            onPress={() => setActiveTab('personal')}
                        >
                            <Ionicons name="person" size={16} color={activeTab === 'personal' ? (isDark ? '#3B82F6' : '#2563EB') : '#fff'} />
                            <Text style={[s.tabText, activeTab === 'personal' && s.tabTextActive, { color: activeTab === 'personal' ? (isDark ? '#3B82F6' : '#2563EB') : '#fff' }]}>Kişisel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.tabItem, activeTab === 'institutional' && s.tabItemActive]}
                            onPress={() => setActiveTab('institutional')}
                        >
                            <Ionicons name="business" size={16} color={activeTab === 'institutional' ? (isDark ? '#3B82F6' : '#2563EB') : '#fff'} />
                            <Text style={[s.tabText, activeTab === 'institutional' && s.tabTextActive, { color: activeTab === 'institutional' ? (isDark ? '#3B82F6' : '#2563EB') : '#fff' }]}>Kurumsal</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {activeTab === 'personal' ? (
                        <>
                            {/* ═══ HERO COUNTDOWN (Personal) ═══ */}
                            {nextExam && (
                                <View style={[s.heroCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                                    <LinearGradient
                                        colors={[TYPE_COLORS[nextExam.type] + '10', TYPE_COLORS[nextExam.type] + '05']}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    />
                                    <View style={s.heroHeader}>
                                        <LinearGradient
                                            colors={[TYPE_COLORS[nextExam.type], TYPE_COLORS[nextExam.type] + 'CC']}
                                            style={s.heroIcon}
                                        >
                                            <Ionicons name={(TYPE_ICONS[nextExam.type] || 'document') as any} size={22} color="#fff" />
                                        </LinearGradient>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 11, color: TYPE_COLORS[nextExam.type], fontWeight: '700' }}>SIRADA</Text>
                                            <Text style={[s.heroTitle, { color: theme.text }]}>{nextExam.title}</Text>
                                        </View>
                                    </View>

                                    <View style={s.heroCountdown}>
                                        {[
                                            { value: getDaysUntil(nextExam.date), label: 'Gün' },
                                            { value: Math.floor(getDaysUntil(nextExam.date) / 7), label: 'Hafta' },
                                            { value: Math.floor(getDaysUntil(nextExam.date) / 30), label: 'Ay' },
                                        ].map((item, i) => (
                                            <View key={i} style={s.countdownItem}>
                                                <View style={[s.countdownNumBox, { backgroundColor: TYPE_COLORS[nextExam.type] + '12' }]}>
                                                    <Text style={[s.countdownNum, { color: TYPE_COLORS[nextExam.type] }]}>{item.value}</Text>
                                                </View>
                                                <Text style={[s.countdownLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={[s.heroDateRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                        <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                                        <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '600' }}>{formatDate(nextExam.date)}</Text>
                                    </View>
                                </View>
                            )}

                            {/* ═══ UPCOMING EXAMS (Personal) ═══ */}
                            <View style={s.sectionHeader}>
                                <View style={[s.sectionDot, { backgroundColor: '#3B82F6' }]} />
                                <Text style={[s.sectionTitle, { color: theme.text }]}>Kişisel Sınavlarım</Text>
                                <View style={[s.sectionCount, { backgroundColor: '#3B82F620' }]}>
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#3B82F6' }}>{upcoming.length}</Text>
                                </View>
                            </View>

                            {upcoming.length === 0 ? (
                                <View style={[s.emptyBox, { backgroundColor: theme.surface }, theme.cardShadow]}>
                                    <View style={s.emptyIcon}>
                                        <Ionicons name="calendar-outline" size={32} color={theme.textSecondary + '60'} />
                                    </View>
                                    <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '600' }}>Yaklaşan sınav yok</Text>
                                    <Text style={{ fontSize: 12, color: theme.textSecondary + '80', fontWeight: '500', marginTop: 4 }}>+ butonuyla sınav ekle</Text>
                                </View>
                            ) : (
                                upcoming.map(exam => {
                                    const days = getDaysUntil(exam.date);
                                    const urgency = days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : '#10B981';
                                    return (
                                        <TouchableOpacity key={exam.id} style={[s.examCard, { backgroundColor: theme.surface }, theme.cardShadow]} activeOpacity={0.85}>
                                            <LinearGradient
                                                colors={[TYPE_COLORS[exam.type], TYPE_COLORS[exam.type] + 'BB']}
                                                style={s.examIconBox}
                                            >
                                                <Ionicons name={(TYPE_ICONS[exam.type] || 'document') as any} size={18} color="#fff" />
                                            </LinearGradient>
                                            <View style={{ flex: 1 }}>
                                                <View style={s.examTopRow}>
                                                    <View style={[s.examTypeBadge, { backgroundColor: TYPE_COLORS[exam.type] + '15' }]}>
                                                        <Text style={{ fontSize: 10, fontWeight: '800', color: TYPE_COLORS[exam.type] }}>{exam.type}</Text>
                                                    </View>
                                                    <View style={[s.examDaysTag, { backgroundColor: urgency + '15' }]}>
                                                        <Text style={{ fontSize: 10, fontWeight: '800', color: urgency }}>{days} gün</Text>
                                                    </View>
                                                </View>
                                                <Text style={[s.examTitle, { color: theme.text }]}>{exam.title}</Text>
                                                <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '500' }}>{formatDate(exam.date)}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => deleteExam(exam.id)} style={s.examDeleteBtn}>
                                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    );
                                })
                            )}

                            {/* ═══ PAST EXAMS (Personal) ═══ */}
                            {past.length > 0 && (
                                <>
                                    <View style={s.sectionHeader}>
                                        <View style={[s.sectionDot, { backgroundColor: theme.textSecondary }]} />
                                        <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>Geçmiş</Text>
                                        <View style={[s.sectionCount, { backgroundColor: theme.border + '30' }]}>
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textSecondary }}>{past.length}</Text>
                                        </View>
                                    </View>
                                    {past.map(exam => (
                                        <View key={exam.id} style={[s.examCard, { backgroundColor: theme.surface, opacity: 0.5 }]}>
                                            <View style={[s.examIconBox, { backgroundColor: theme.textSecondary + '20' }]}>
                                                <Ionicons name="checkmark-done" size={18} color={theme.textSecondary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[s.examTitle, { color: theme.textSecondary }]}>{exam.title}</Text>
                                                <Text style={{ fontSize: 11, color: theme.textSecondary + '80' }}>{formatDate(exam.date)}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {/* ═══ INSTITUTIONAL EXAMS ═══ */}
                            {institution?.id ? (
                                <>
                                    <View style={s.sectionHeader}>
                                        <View style={[s.sectionDot, { backgroundColor: '#8B5CF6' }]} />
                                        <Text style={[s.sectionTitle, { color: theme.text }]}>Kurumsal Denemeler ({institution.name})</Text>
                                        {loadingInst && <ActivityIndicator size="small" color="#8B5CF6" />}
                                    </View>

                                    {instExams.length === 0 && !loadingInst ? (
                                        <View style={[s.emptyBox, { backgroundColor: theme.surface }, theme.cardShadow]}>
                                            <View style={s.emptyIcon}>
                                                <Ionicons name="business-outline" size={32} color={theme.textSecondary + '60'} />
                                            </View>
                                            <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }}>Bu kurum için henüz deneme takvimi girilmemiş.</Text>
                                        </View>
                                    ) : (
                                        instExams.map(exam => {
                                            const days = getDaysUntil(exam.date);
                                            const urgency = days <= 7 ? '#EF4444' : days <= 30 ? '#F59E0B' : '#10B981';
                                            return (
                                                <View key={exam.id} style={[s.examCard, { backgroundColor: theme.surface, borderColor: '#8B5CF630', borderWidth: 1 }, theme.cardShadow]}>
                                                    <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={s.examIconBox}>
                                                        <Ionicons name="business" size={18} color="#fff" />
                                                    </LinearGradient>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={s.examTopRow}>
                                                            <View style={[s.examTypeBadge, { backgroundColor: '#8B5CF615' }]}>
                                                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#8B5CF6' }}>KURUMSAL</Text>
                                                            </View>
                                                            <View style={[s.examDaysTag, { backgroundColor: urgency + '15' }]}>
                                                                <Text style={{ fontSize: 10, fontWeight: '800', color: urgency }}>{days} gün</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={[s.examTitle, { color: theme.text }]}>{exam.title}</Text>
                                                        <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '500' }}>{formatDate(exam.date)}</Text>
                                                    </View>
                                                </View>
                                            );
                                        })
                                    )}
                                </>
                            ) : (
                                <View style={[s.emptyBox, { backgroundColor: theme.surface }, theme.cardShadow]}>
                                    <View style={s.emptyIcon}>
                                        <Ionicons name="lock-closed-outline" size={32} color={theme.textSecondary + '60'} />
                                    </View>
                                    <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '600' }}>Kurum Kaydı Gerekli</Text>
                                    <Text style={{ fontSize: 12, color: theme.textSecondary + '80', fontWeight: '500', textAlign: 'center', paddingHorizontal: 20 }}>
                                        Kurumsal denemeleri görmek için bir eğitim kurumuna kayıtlı olmalısın.
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>

                {/* FAB */}
                {activeTab === 'personal' && (
                    <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
                        <LinearGradient colors={['#3B82F6', '#2563EB']} style={s.fabGrad}>
                            <Ionicons name="add" size={28} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* ═══ ADD MODAL ═══ */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View style={s.modalOverlay}>
                        <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                            <View style={s.modalHandle} />
                            <Text style={[s.modalTitle, { color: theme.text }]}>Sınav Ekle</Text>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14, flexGrow: 0 }}>
                                {(['TYT', 'AYT', 'YDT', 'LGS', 'Diğer'] as ExamEvent['type'][]).map(t => (
                                    <TouchableOpacity key={t}
                                        style={[s.typeChip, type === t ? { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] } : { borderColor: theme.border }]}
                                        onPress={() => setType(t)}>
                                        <Ionicons name={(TYPE_ICONS[t] || 'document') as any} size={14} color={type === t ? '#fff' : theme.textSecondary} />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: type === t ? '#fff' : theme.textSecondary }}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Sınav Adı" value={title} onChangeText={setTitle} placeholderTextColor={theme.textSecondary} />
                            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Tarih (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholderTextColor={theme.textSecondary} />
                            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Not (Opsiyonel)" value={note} onChangeText={setNote} placeholderTextColor={theme.textSecondary} />
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                                <TouchableOpacity style={[s.modalBtn, { backgroundColor: theme.border }]} onPress={() => setModalVisible(false)}>
                                    <Text style={{ color: theme.text, fontWeight: '700' }}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.modalBtn, { backgroundColor: '#3B82F6', flex: 1 }]} onPress={addExam}>
                                    <Ionicons name="add-circle" size={18} color="#fff" />
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>Ekle</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
    decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', flex: 1, marginLeft: 14, marginBottom: 12 },
    headerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 12 },
    headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

    tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 4, marginHorizontal: 4 },
    tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
    tabItemActive: { backgroundColor: '#fff' },
    tabText: { fontSize: 14, fontWeight: '700' },
    tabTextActive: {},

    // Hero
    heroCard: { margin: 20, padding: 20, borderRadius: 24, overflow: 'hidden' },
    heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
    heroIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    heroTitle: { fontSize: 17, fontWeight: '800' },
    heroCountdown: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
    countdownItem: { alignItems: 'center', gap: 6 },
    countdownNumBox: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    countdownNum: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
    countdownLabel: { fontSize: 11, fontWeight: '700' },
    heroDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 12 },

    // Section
    sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 14, gap: 8 },
    sectionDot: { width: 6, height: 6, borderRadius: 3 },
    sectionTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
    sectionCount: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

    // Empty
    emptyBox: { marginHorizontal: 20, padding: 32, borderRadius: 22, alignItems: 'center', gap: 8 },
    emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(128,128,128,0.08)', justifyContent: 'center', alignItems: 'center' },

    // Exam Card
    examCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 20, gap: 14 },
    examIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    examTopRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    examTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    examDaysTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    examTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
    examDeleteBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FEE2E215', justifyContent: 'center', alignItems: 'center' },

    // FAB
    fab: { position: 'absolute', bottom: 30, right: 24, borderRadius: 18, elevation: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    fabGrad: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
    typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, marginRight: 8 },
    input: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, fontSize: 14, fontWeight: '500', marginBottom: 12 },
    modalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16 },
});
