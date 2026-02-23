import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
    StatusBar, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@RCSinavim_Notes';
const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe', 'Genel'];
const COLORS_MAP: Record<string, string> = {
    'Matematik': '#3B82F6', 'Fizik': '#EF4444', 'Kimya': '#10B981',
    'Biyoloji': '#F59E0B', 'Türkçe': '#EC4899', 'Tarih': '#8B5CF6',
    'Coğrafya': '#14B8A6', 'Felsefe': '#6366F1', 'Genel': '#6B7280',
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

export const NotebookView = ({ onBack, theme }: any) => {
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
        setTitle('');
        setContent('');
        setSubject('Genel');
        setModalVisible(true);
    };

    const openEditModal = (note: Note) => {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content);
        setSubject(note.subject);
        setModalVisible(true);
    };

    const saveNote = () => {
        if (!title.trim()) { Alert.alert('Eksik', 'Başlık giriniz.'); return; }
        const now = new Date().toISOString();
        if (editingNote) {
            const updated = notes.map(n => n.id === editingNote.id ? { ...n, title: title.trim(), content: content.trim(), subject, updatedAt: now } : n);
            saveNotes(updated);
        } else {
            const newNote: Note = { id: Date.now().toString(), title: title.trim(), content: content.trim(), subject, createdAt: now, updatedAt: now, pinned: false };
            saveNotes([newNote, ...notes]);
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

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    return (
        <View style={[st.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <LinearGradient
                    colors={isDark ? ['#065F46', '#064E3B'] : ['#10B981', '#059669']}
                    style={st.header}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity onPress={onBack} style={st.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={st.headerTitle}>Not Defteri</Text>
                    <View style={st.headerBadge}>
                        <Text style={st.headerBadgeText}>{notes.length}</Text>
                    </View>
                </LinearGradient>

                {/* Search */}
                <View style={[st.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="search" size={18} color={theme.textSecondary} />
                    <TextInput
                        style={[st.searchInput, { color: theme.text }]}
                        placeholder="Not ara..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>

                {/* Subject Filter */}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[null, ...SUBJECTS.filter(sub => notes.some(n => n.subject === sub))]}
                    keyExtractor={(item, i) => item || 'all'}
                    style={st.filterList}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[st.filterChip, filterSubject === item ? { backgroundColor: item ? COLORS_MAP[item] : theme.primary } : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, !filterSubject && !item && { backgroundColor: theme.primary }]}
                            onPress={() => setFilterSubject(item)}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '600', color: (filterSubject === item || (!filterSubject && !item)) ? '#fff' : theme.textSecondary }}>
                                {item || 'Tümü'}
                            </Text>
                        </TouchableOpacity>
                    )}
                />

                {/* Notes Grid */}
                <FlatList
                    data={filteredNotes}
                    numColumns={2}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[st.notesList, filteredNotes.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
                    columnWrapperStyle={{ gap: 12 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', gap: 10 }}>
                            <Ionicons name="document-text-outline" size={48} color={theme.textSecondary} />
                            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Not Yok</Text>
                            <Text style={{ fontSize: 13, color: theme.textSecondary }}>+ butonuyla not ekle</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[st.noteCard, { backgroundColor: theme.surface }, theme.cardShadow]}
                            onPress={() => openEditModal(item)}
                            onLongPress={() => togglePin(item.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[st.noteAccent, { backgroundColor: COLORS_MAP[item.subject] || '#6B7280' }]} />
                            {item.pinned && (
                                <View style={st.pinBadge}>
                                    <Ionicons name="pin" size={12} color="#F59E0B" />
                                </View>
                            )}
                            <Text style={[st.noteTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                            <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 16 }} numberOfLines={3}>{item.content || 'İçerik yok'}</Text>
                            <View style={st.noteFooter}>
                                <Text style={{ fontSize: 10, color: COLORS_MAP[item.subject], fontWeight: '600' }}>{item.subject}</Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary }}>{formatDate(item.updatedAt)}</Text>
                            </View>
                            <TouchableOpacity style={st.noteDelete} onPress={() => deleteNote(item.id)}>
                                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />

                {/* FAB */}
                <TouchableOpacity style={[st.fab, { backgroundColor: '#10B981' }]} onPress={openAddModal} activeOpacity={0.8}>
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Add/Edit Modal */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                        <View style={st.modalOverlay}>
                            <View style={[st.modalContent, { backgroundColor: theme.surface }]}>
                                <Text style={[st.modalTitle, { color: theme.text }]}>{editingNote ? 'Notu Düzenle' : 'Yeni Not'}</Text>
                                <FlatList
                                    horizontal showsHorizontalScrollIndicator={false}
                                    data={SUBJECTS}
                                    keyExtractor={item => item}
                                    style={{ marginBottom: 12, flexGrow: 0 }}
                                    contentContainerStyle={{ gap: 8 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[st.subChip, subject === item && { backgroundColor: COLORS_MAP[item], borderColor: COLORS_MAP[item] }, subject !== item && { borderColor: theme.border }]}
                                            onPress={() => setSubject(item)}
                                        >
                                            <Text style={{ fontSize: 11, fontWeight: '600', color: subject === item ? '#fff' : theme.textSecondary }}>{item}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                <TextInput
                                    style={[st.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="Başlık"
                                    value={title} onChangeText={setTitle}
                                    placeholderTextColor={theme.textSecondary}
                                />
                                <TextInput
                                    style={[st.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, minHeight: 120, textAlignVertical: 'top' }]}
                                    placeholder="Not içeriği..."
                                    value={content} onChangeText={setContent}
                                    placeholderTextColor={theme.textSecondary}
                                    multiline
                                />
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity style={[st.modalBtn, { backgroundColor: theme.border }]} onPress={() => setModalVisible(false)}>
                                        <Text style={{ color: theme.text, fontWeight: '700' }}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[st.modalBtn, { backgroundColor: '#10B981', flex: 1 }]} onPress={saveNote}>
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

const st = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', flex: 1, marginLeft: 14 },
    headerBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, gap: 8 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
    filterList: { marginVertical: 12, flexGrow: 0 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
    notesList: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 100 },
    noteCard: { flex: 1, padding: 16, borderRadius: 18, marginBottom: 12, minHeight: 140, maxWidth: '48%', overflow: 'hidden' },
    noteAccent: { width: 30, height: 3, borderRadius: 2, marginBottom: 10 },
    pinBadge: { position: 'absolute', top: 10, right: 10 },
    noteTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6, lineHeight: 18 },
    noteFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10 },
    noteDelete: { position: 'absolute', bottom: 10, right: 10, padding: 4 },
    fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    subChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    input: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, fontSize: 14, fontWeight: '500', marginBottom: 12 },
    modalBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center' },
});
