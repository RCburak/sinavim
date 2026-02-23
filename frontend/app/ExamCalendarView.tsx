import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const getDaysUntil = (dateStr: string) => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / 86400000);
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' });
};

export const ExamCalendarView = ({ onBack, theme }: any) => {
    const [exams, setExams] = useState<ExamEvent[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<ExamEvent['type']>('TYT');
    const [note, setNote] = useState('');
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    useEffect(() => { loadExams(); }, []);

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
        <View style={[st.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <LinearGradient
                    colors={isDark ? ['#1E3A5F', '#0D2B4A'] : ['#3B82F6', '#2563EB']}
                    style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity onPress={onBack} style={st.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={st.headerTitle}>Deneme Takvimi</Text>
                </LinearGradient>

                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {nextExam && (
                        <View style={[st.heroCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                            <View style={st.heroTop}>
                                <View style={[st.heroBadge, { backgroundColor: TYPE_COLORS[nextExam.type] + '20' }]}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: TYPE_COLORS[nextExam.type] }}>{nextExam.type}</Text>
                                </View>
                                <Text style={[st.heroTitle, { color: theme.text }]}>{nextExam.title}</Text>
                            </View>
                            <View style={st.heroCountdown}>
                                <View style={st.countdownBox}>
                                    <Text style={[st.countdownNum, { color: TYPE_COLORS[nextExam.type] }]}>{getDaysUntil(nextExam.date)}</Text>
                                    <Text style={[st.countdownLabel, { color: theme.textSecondary }]}>Gün</Text>
                                </View>
                                <View style={st.countdownBox}>
                                    <Text style={[st.countdownNum, { color: TYPE_COLORS[nextExam.type] }]}>{Math.floor(getDaysUntil(nextExam.date) / 7)}</Text>
                                    <Text style={[st.countdownLabel, { color: theme.textSecondary }]}>Hafta</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: '500', textAlign: 'center' }}>{formatDate(nextExam.date)}</Text>
                        </View>
                    )}

                    <Text style={[st.sectionTitle, { color: theme.text }]}>Gelecek Sınavlar ({upcoming.length})</Text>
                    {upcoming.length === 0 ? (
                        <View style={[st.emptyBox, { backgroundColor: theme.surface }]}>
                            <Ionicons name="calendar-outline" size={40} color={theme.textSecondary} />
                            <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: '500', marginTop: 8 }}>Yaklaşan sınav yok</Text>
                        </View>
                    ) : (
                        upcoming.map(exam => (
                            <View key={exam.id} style={[st.examCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                                <View style={[st.examAccent, { backgroundColor: TYPE_COLORS[exam.type] }]} />
                                <View style={st.examContent}>
                                    <View style={st.examTop}>
                                        <View style={[st.examTypeBadge, { backgroundColor: TYPE_COLORS[exam.type] + '15' }]}>
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: TYPE_COLORS[exam.type] }}>{exam.type}</Text>
                                        </View>
                                        <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '500' }}>{getDaysUntil(exam.date)} gün</Text>
                                    </View>
                                    <Text style={[st.examTitle, { color: theme.text }]}>{exam.title}</Text>
                                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>{formatDate(exam.date)}</Text>
                                </View>
                                <TouchableOpacity onPress={() => deleteExam(exam.id)} style={st.examDelete}>
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}

                    {past.length > 0 && (
                        <>
                            <Text style={[st.sectionTitle, { color: theme.textSecondary }]}>Geçmiş ({past.length})</Text>
                            {past.map(exam => (
                                <View key={exam.id} style={[st.examCard, { backgroundColor: theme.surface, opacity: 0.6 }]}>
                                    <View style={[st.examAccent, { backgroundColor: theme.textSecondary }]} />
                                    <View style={st.examContent}>
                                        <Text style={[st.examTitle, { color: theme.textSecondary }]}>{exam.title}</Text>
                                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>{formatDate(exam.date)}</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>

                <TouchableOpacity style={[st.fab, { backgroundColor: '#3B82F6' }]} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>

                <Modal visible={modalVisible} transparent animationType="slide">
                    <View style={st.modalOverlay}>
                        <View style={[st.modalContent, { backgroundColor: theme.surface }]}>
                            <Text style={[st.modalTitle, { color: theme.text }]}>Sınav Ekle</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                {(['TYT', 'AYT', 'YDT', 'LGS', 'Diğer'] as ExamEvent['type'][]).map(t => (
                                    <TouchableOpacity key={t}
                                        style={[st.typeChip, type === t ? { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] } : { borderColor: theme.border }]}
                                        onPress={() => setType(t)}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: type === t ? '#fff' : theme.textSecondary }}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TextInput style={[st.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Sınav Adı" value={title} onChangeText={setTitle} placeholderTextColor={theme.textSecondary} />
                            <TextInput style={[st.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Tarih (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholderTextColor={theme.textSecondary} />
                            <TextInput style={[st.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Not (Opsiyonel)" value={note} onChangeText={setNote} placeholderTextColor={theme.textSecondary} />
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={[st.modalBtn, { backgroundColor: theme.border }]} onPress={() => setModalVisible(false)}>
                                    <Text style={{ color: theme.text, fontWeight: '700' }}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[st.modalBtn, { backgroundColor: '#3B82F6', flex: 1 }]} onPress={addExam}>
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

const st = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginLeft: 14 },
    heroCard: { margin: 20, padding: 24, borderRadius: 24, alignItems: 'center' },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
    heroBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    heroTitle: { fontSize: 17, fontWeight: '800' },
    heroCountdown: { flexDirection: 'row', gap: 24, marginBottom: 14 },
    countdownBox: { alignItems: 'center', gap: 2 },
    countdownNum: { fontSize: 36, fontWeight: '900', letterSpacing: -2 },
    countdownLabel: { fontSize: 12, fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 20, marginBottom: 12, marginTop: 8 },
    emptyBox: { marginHorizontal: 20, padding: 30, borderRadius: 20, alignItems: 'center' },
    examCard: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 10, borderRadius: 18, overflow: 'hidden', alignItems: 'center' },
    examAccent: { width: 4, height: '100%' },
    examContent: { flex: 1, padding: 14 },
    examTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    examTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    examTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    examDelete: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8 },
    input: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, fontSize: 14, fontWeight: '500', marginBottom: 12 },
    modalBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center' },
});
