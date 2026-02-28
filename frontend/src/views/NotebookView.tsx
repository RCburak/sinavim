import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
    StatusBar, Alert, Modal, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@RCSinavim_Notes';
const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe', 'Genel'];
const COLORS_MAP: Record<string, string> = {
    'Matematik': '#3B82F6', 'Fizik': '#EF4444', 'Kimya': '#10B981',
    'Biyoloji': '#F59E0B', 'Türkçe': '#EC4899', 'Tarih': '#8B5CF6',
    'Coğrafya': '#14B8A6', 'Felsefe': '#6366F1', 'Genel': '#6B7280',
};
const SUBJECT_ICONS: Record<string, string> = {
    'Matematik': 'calculator', 'Fizik': 'flash', 'Kimya': 'flask',
    'Biyoloji': 'leaf', 'Türkçe': 'text', 'Tarih': 'hourglass',
    'Coğrafya': 'globe', 'Felsefe': 'bulb', 'Genel': 'bookmark',
};

interface Note {
    id: string;
    title: string;
    content: string;
    subject: string;
    createdAt: string;
    updatedAt: string;
    pinned: boolean;
}

export const NotebookView = ({ onBack, theme, onRecordAction }: any) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [subject, setSubject] = useState('Genel');
    const [filterSubject, setFilterSubject] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    useEffect(() => { loadNotes(); }, []);

    const loadNotes = async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setNotes(JSON.parse(raw));
    };

    const saveNotes = async (newNotes: Note[]) => {
        setNotes(newNotes);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
    };

    const openAddModal = () => {
        setEditingNote(null);
        setTitle(''); setContent(''); setSubject('Genel');
        setModalVisible(true);
    };

    const openEditModal = (note: Note) => {
        setEditingNote(note);
        setTitle(note.title); setContent(note.content); setSubject(note.subject);
        setModalVisible(true);
    };

    const saveNote = () => {
        if (!title.trim()) { Alert.alert('Eksik', 'Başlık giriniz.'); return; }
        const now = new Date().toISOString();
        if (editingNote) {
            saveNotes(notes.map(n => n.id === editingNote.id ? { ...n, title: title.trim(), content: content.trim(), subject, updatedAt: now } : n));
        } else {
            const newNote: Note = { id: Date.now().toString(), title: title.trim(), content: content.trim(), subject, createdAt: now, updatedAt: now, pinned: false };
            saveNotes([newNote, ...notes]);
            if (onRecordAction) onRecordAction('note_create', notes.length + 1);
        }
        setModalVisible(false);
    };

    const deleteNote = (id: string) => {
        Alert.alert('Sil', 'Bu notu silmek istiyor musun?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => saveNotes(notes.filter(n => n.id !== id)) },
        ]);
    };

    const togglePin = (id: string) => {
        saveNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    };

    const filteredNotes = notes
        .filter(n => !filterSubject || n.subject === filterSubject)
        .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

    return (
        <View style={[s.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                {/* ═══ HEADER ═══ */}
                <LinearGradient
                    colors={isDark ? ['#064E3B', '#065F46', '#047857'] : ['#10B981', '#059669', '#047857']}
                    style={s.header}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                    <View style={[s.decorCircle, { top: -25, right: -15, width: 100, height: 100 }]} />
                    <View style={[s.decorCircle, { bottom: 5, left: -30, width: 70, height: 70 }]} />
                    <View style={s.headerRow}>
                        <TouchableOpacity onPress={onBack} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={s.headerTitle}>Not Defteri</Text>
                            <Text style={s.headerSub}>{notes.length} not</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* ═══ SEARCH ═══ */}
                <View style={[s.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="search" size={18} color={theme.textSecondary} />
                    <TextInput
                        style={[s.searchInput, { color: theme.text }]}
                        placeholder="Not ara..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={theme.textSecondary}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* ═══ FILTER ═══ */}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[null, ...SUBJECTS.filter(sub => notes.some(n => n.subject === sub))]}
                    keyExtractor={(item, i) => item || 'all'}
                    style={s.filterList}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                    renderItem={({ item }) => {
                        const isActive = filterSubject === item || (!filterSubject && !item);
                        const color = item ? COLORS_MAP[item] : theme.primary;
                        return (
                            <TouchableOpacity
                                style={[s.filterChip, isActive ? { backgroundColor: color } : { backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border }]}
                                onPress={() => setFilterSubject(item)}
                            >
                                {item && <Ionicons name={(SUBJECT_ICONS[item] || 'bookmark') as any} size={12} color={isActive ? '#fff' : theme.textSecondary} />}
                                <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : theme.textSecondary }}>{item || 'Tümü'}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />

                {/* ═══ NOTES GRID ═══ */}
                <FlatList
                    data={filteredNotes}
                    numColumns={2}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[s.notesList, filteredNotes.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
                    columnWrapperStyle={{ gap: 12 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', gap: 12 }}>
                            <View style={[s.emptyIcon, { backgroundColor: theme.surface }]}>
                                <Ionicons name="document-text-outline" size={36} color={theme.textSecondary + '50'} />
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Not Yok</Text>
                            <Text style={{ fontSize: 13, color: theme.textSecondary }}>+ butonuyla not ekle</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const color = COLORS_MAP[item.subject] || '#6B7280';
                        return (
                            <TouchableOpacity
                                style={[s.noteCard, { backgroundColor: theme.surface }, theme.cardShadow]}
                                onPress={() => openEditModal(item)}
                                onLongPress={() => togglePin(item.id)}
                                activeOpacity={0.7}
                            >
                                {/* Accent gradient top */}
                                <LinearGradient colors={[color, color + '80']} style={s.noteAccent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

                                {item.pinned && (
                                    <View style={[s.pinBadge, { backgroundColor: '#F59E0B20' }]}>
                                        <Ionicons name="pin" size={12} color="#F59E0B" />
                                    </View>
                                )}

                                <View style={[s.noteSubjectIcon, { backgroundColor: color + '15' }]}>
                                    <Ionicons name={(SUBJECT_ICONS[item.subject] || 'bookmark') as any} size={16} color={color} />
                                </View>

                                <Text style={[s.noteTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                                <Text style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 16 }} numberOfLines={3}>{item.content || 'İçerik yok'}</Text>

                                <View style={s.noteFooter}>
                                    <View style={[s.noteSubjectTag, { backgroundColor: color + '12' }]}>
                                        <Text style={{ fontSize: 9, color, fontWeight: '700' }}>{item.subject}</Text>
                                    </View>
                                    <Text style={{ fontSize: 9, color: theme.textSecondary }}>{formatDate(item.updatedAt)}</Text>
                                </View>

                                <TouchableOpacity style={s.noteDeleteBtn} onPress={() => deleteNote(item.id)}>
                                    <Ionicons name="trash-outline" size={13} color="#EF4444" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    }}
                />

                {/* FAB */}
                <TouchableOpacity style={s.fab} onPress={openAddModal} activeOpacity={0.85}>
                    <LinearGradient colors={['#10B981', '#059669']} style={s.fabGrad}>
                        <Ionicons name="add" size={28} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* ═══ ADD/EDIT MODAL ═══ */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                        <View style={s.modalOverlay}>
                            <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                                <View style={s.modalHandle} />
                                <Text style={[s.modalTitle, { color: theme.text }]}>{editingNote ? 'Notu Düzenle' : 'Yeni Not'}</Text>

                                <FlatList
                                    horizontal showsHorizontalScrollIndicator={false}
                                    data={SUBJECTS}
                                    keyExtractor={item => item}
                                    style={{ marginBottom: 14, flexGrow: 0 }}
                                    contentContainerStyle={{ gap: 8 }}
                                    renderItem={({ item }) => {
                                        const active = subject === item;
                                        const color = COLORS_MAP[item];
                                        return (
                                            <TouchableOpacity
                                                style={[s.subChip, active && { backgroundColor: color, borderColor: color }, !active && { borderColor: theme.border }]}
                                                onPress={() => setSubject(item)}
                                            >
                                                <Ionicons name={(SUBJECT_ICONS[item] || 'bookmark') as any} size={12} color={active ? '#fff' : theme.textSecondary} />
                                                <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#fff' : theme.textSecondary }}>{item}</Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                                <TextInput
                                    style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Başlık" value={title} onChangeText={setTitle} placeholderTextColor={theme.textSecondary}
                                />
                                <TextInput
                                    style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, minHeight: 120, textAlignVertical: 'top' }]}
                                    placeholder="Not içeriği..." value={content} onChangeText={setContent} placeholderTextColor={theme.textSecondary} multiline
                                />
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity style={[s.modalBtn, { backgroundColor: theme.border }]} onPress={() => setModalVisible(false)}>
                                        <Text style={{ color: theme.text, fontWeight: '700' }}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.modalBtn, { backgroundColor: '#10B981', flex: 1 }]} onPress={saveNote}>
                                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700' }}>Kaydet</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
    decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
    headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginTop: 2 },

    searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1, gap: 10 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
    filterList: { marginVertical: 12, flexGrow: 0 },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },

    emptyIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

    notesList: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 100 },
    noteCard: { flex: 1, padding: 14, borderRadius: 20, marginBottom: 12, minHeight: 160, maxWidth: '48%' as any, overflow: 'hidden' },
    noteAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    pinBadge: { position: 'absolute', top: 10, right: 10, padding: 4, borderRadius: 8 },
    noteSubjectIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8, marginTop: 4 },
    noteTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4, lineHeight: 18 },
    noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' as any, paddingTop: 10 },
    noteSubjectTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    noteDeleteBtn: { position: 'absolute', bottom: 10, right: 10, padding: 6, borderRadius: 8 },

    fab: { position: 'absolute', bottom: 30, right: 24, borderRadius: 18, elevation: 8, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    fabGrad: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
    subChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
    input: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, fontSize: 14, fontWeight: '500', marginBottom: 12 },
    modalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16 },
});
