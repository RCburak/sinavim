import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    Dimensions, Modal, TextInput, ActivityIndicator,
    Alert, StatusBar, ScrollView, Platform
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/theme';
import { useQuestions } from '../hooks/useQuestions';

const { width, height } = Dimensions.get('window');
const FlashListComponent = FlashList as any;

const LESSONS = ["Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Tarih", "Coğrafya", "Felsefe", "Din", "İngilizce"];
const LESSON_COLORS: Record<string, string> = {
    'Matematik': '#3B82F6', 'Geometri': '#06B6D4', 'Fizik': '#EF4444',
    'Kimya': '#10B981', 'Biyoloji': '#F59E0B', 'Türkçe': '#EC4899',
    'Tarih': '#8B5CF6', 'Coğrafya': '#14B8A6', 'Felsefe': '#6366F1',
    'Din': '#F97316', 'İngilizce': '#D946EF',
};

export const QuestionPoolView = ({ onBack, theme = COLORS.light, onRecordAction }: any) => {
    const {
        questions, loading, filterLesson, setFilterLesson,
        filterStatus, setFilterStatus, addQuestion, toggleSolved, deleteQuestion
    } = useQuestions();

    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newImage, setNewImage] = useState<string | null>(null);
    const [newLesson, setNewLesson] = useState(LESSONS[0]);
    const [newTopic, setNewTopic] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [adding, setAdding] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    const pickImage = async (source: 'camera' | 'gallery') => {
        try {
            let result;
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') { Alert.alert("İzin Gerekli", "Kamera izni vermelisiniz."); return; }
                result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, allowsEditing: true });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') { Alert.alert("İzin Gerekli", "Galeri izni vermelisiniz."); return; }
                result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, allowsEditing: true });
            }
            if (!result.canceled && result.assets[0].uri) setNewImage(result.assets[0].uri);
        } catch { Alert.alert("Hata", "Resim seçilemedi."); }
    };

    const handleSave = async () => {
        if (!newImage) { Alert.alert("Eksik", "Lütfen bir fotoğraf ekleyin."); return; }
        setAdding(true);
        const success = await addQuestion(newImage, newLesson, newTopic, newNotes);
        setAdding(false);
        if (success) {
            setAddModalVisible(false);
            setNewImage(null); setNewTopic(''); setNewNotes('');
            if (onRecordAction) onRecordAction('question_add', (questions?.length || 0) + 1);
        }
    };

    const unsolvedCount = questions?.filter((q: any) => !q.solved).length || 0;
    const solvedCount = questions?.filter((q: any) => q.solved).length || 0;

    const renderItem = ({ item }: any) => {
        const color = LESSON_COLORS[item.lesson] || '#6B7280';
        return (
            <TouchableOpacity
                style={[s.card, { backgroundColor: theme.surface }, theme.cardShadow]}
                onPress={() => setSelectedQuestion(item)}
                activeOpacity={0.8}
            >
                <Image source={{ uri: item.image_url }} style={s.cardImage} resizeMode="cover" />

                {/* Status */}
                <LinearGradient
                    colors={item.solved ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
                    style={s.statusBadge}
                >
                    <Ionicons name={item.solved ? "checkmark" : "close"} size={12} color="#fff" />
                </LinearGradient>

                <View style={s.cardContent}>
                    <View style={[s.lessonTag, { backgroundColor: color + '15' }]}>
                        <View style={[s.lessonDot, { backgroundColor: color }]} />
                        <Text style={{ fontSize: 10, fontWeight: '800', color }}>{item.lesson}</Text>
                    </View>
                    <Text style={[s.cardTopic, { color: theme.text }]} numberOfLines={1}>
                        {item.topic || 'Konusuz'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[s.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* ═══ HEADER ═══ */}
            <LinearGradient
                colors={isDark ? ['#2D0A3C', '#4C1D95', '#5B21B6'] : ['#EC4899', '#DB2777', '#BE185D']}
                style={s.header}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={[s.decorCircle, { top: -30, right: -20, width: 100, height: 100 }]} />
                <View style={[s.decorCircle, { bottom: -10, left: -25, width: 70, height: 70 }]} />
                <SafeAreaView style={s.headerContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={onBack} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={{ marginLeft: 14 }}>
                            <Text style={s.headerTitle}>Soru Havuzu</Text>
                            <Text style={s.headerSub}>{unsolvedCount} yapamadığın, {solvedCount} çözdüğün</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => setAddModalVisible(true)} style={s.addBtn}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </SafeAreaView>
            </LinearGradient>

            {/* ═══ FILTERS ═══ */}
            <View style={s.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, gap: 8 }}>
                    <TouchableOpacity
                        style={[s.filterChip, !filterLesson && { backgroundColor: theme.primary }]}
                        onPress={() => setFilterLesson(null)}
                    >
                        <Text style={[s.filterText, { color: !filterLesson ? '#fff' : theme.textSecondary }]}>Tümü</Text>
                    </TouchableOpacity>
                    {LESSONS.map(l => (
                        <TouchableOpacity
                            key={l}
                            style={[s.filterChip, filterLesson === l ? { backgroundColor: LESSON_COLORS[l] || theme.primary } : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                            onPress={() => setFilterLesson(l === filterLesson ? null : l)}
                        >
                            <View style={[s.filterDot, { backgroundColor: LESSON_COLORS[l] || '#6B7280' }]} />
                            <Text style={[s.filterText, { color: filterLesson === l ? '#fff' : theme.textSecondary }]}>{l}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Status Tabs */}
                <View style={[s.statusTabs, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity
                        style={[s.statusTab, filterStatus === 'unsolved' && { backgroundColor: '#EF444420' }]}
                        onPress={() => setFilterStatus('unsolved')}
                    >
                        <Ionicons name="close-circle" size={16} color={filterStatus === 'unsolved' ? '#EF4444' : theme.textSecondary} />
                        <Text style={{ color: filterStatus === 'unsolved' ? '#EF4444' : theme.textSecondary, fontWeight: '700', fontSize: 12 }}>Yapamadıklarım</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.statusTab, filterStatus === 'solved' && { backgroundColor: '#10B98120' }]}
                        onPress={() => setFilterStatus('solved')}
                    >
                        <Ionicons name="checkmark-circle" size={16} color={filterStatus === 'solved' ? '#10B981' : theme.textSecondary} />
                        <Text style={{ color: filterStatus === 'solved' ? '#10B981' : theme.textSecondary, fontWeight: '700', fontSize: 12 }}>Çözdüklerim</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ═══ GRID ═══ */}
            {loading ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlashListComponent
                    data={questions}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id}
                    numColumns={2}
                    contentContainerStyle={s.listContent}
                    showsVerticalScrollIndicator={false}
                    estimatedItemSize={220}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50, gap: 12 }}>
                            <View style={[s.emptyIcon, { backgroundColor: theme.surface }]}>
                                <Ionicons name="camera-outline" size={32} color={theme.textSecondary + '50'} />
                            </View>
                            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>
                                {filterStatus === 'solved' ? 'Çözülmüş soru yok' : 'Harika! Yapamadığın soru yok'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* ═══ ADD MODAL ═══ */}
            <Modal visible={addModalVisible} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={[s.modalContainer, { backgroundColor: theme.surface }]}>
                        <View style={s.modalHandle} />
                        <View style={s.modalHeader}>
                            <Text style={[s.modalTitle, { color: theme.text }]}>Yeni Soru Ekle</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)} style={[s.modalCloseBtn, { backgroundColor: theme.background }]}>
                                <Ionicons name="close" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            {/* Image */}
                            <View style={s.imagePickerContainer}>
                                {newImage ? (
                                    <Image source={{ uri: newImage }} style={s.previewImage} resizeMode="contain" />
                                ) : (
                                    <View style={[s.placeholderImage, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                        <Ionicons name="image-outline" size={40} color={theme.textSecondary + '60'} />
                                        <Text style={{ color: theme.textSecondary, marginTop: 8, fontWeight: '500' }}>Fotoğraf Ekle</Text>
                                    </View>
                                )}
                                <View style={s.pickerBtns}>
                                    <TouchableOpacity style={[s.pickerBtn, { backgroundColor: '#EC4899' }]} onPress={() => pickImage('camera')}>
                                        <Ionicons name="camera" size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Kamera</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.pickerBtn, { backgroundColor: '#6366F1' }]} onPress={() => pickImage('gallery')}>
                                        <Ionicons name="images" size={18} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Galeri</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Lesson */}
                            <Text style={[s.label, { color: theme.textSecondary }]}>Ders</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15, flexGrow: 0 }}>
                                {LESSONS.map(l => {
                                    const active = newLesson === l;
                                    const color = LESSON_COLORS[l] || theme.primary;
                                    return (
                                        <TouchableOpacity key={l}
                                            style={[s.lessonChip, active && { backgroundColor: color, borderColor: color }, !active && { borderColor: theme.border }]}
                                            onPress={() => setNewLesson(l)}
                                        >
                                            <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '600', fontSize: 12 }}>{l}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <Text style={[s.label, { color: theme.textSecondary }]}>Konu (Opsiyonel)</Text>
                            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Örn: Türev" placeholderTextColor={theme.textSecondary} value={newTopic} onChangeText={setNewTopic} />

                            <Text style={[s.label, { color: theme.textSecondary }]}>Notlar</Text>
                            <TextInput style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, height: 80, textAlignVertical: 'top' }]}
                                placeholder="Sorudaki püf noktası..." placeholderTextColor={theme.textSecondary} value={newNotes} onChangeText={setNewNotes} multiline />

                            <TouchableOpacity
                                style={[s.saveBtn, { opacity: adding ? 0.7 : 1 }]}
                                onPress={handleSave} disabled={adding}
                            >
                                <LinearGradient colors={['#EC4899', '#DB2777']} style={s.saveBtnGrad}>
                                    {adding ? <ActivityIndicator color="#fff" /> : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                            <Text style={s.saveBtnText}>Kaydet</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ═══ DETAIL MODAL ═══ */}
            <Modal visible={!!selectedQuestion} animationType="fade" transparent>
                {selectedQuestion && (
                    <View style={s.fullScreenModal}>
                        <TouchableOpacity style={s.closeDetailBtn} onPress={() => setSelectedQuestion(null)}>
                            <Ionicons name="close-circle" size={40} color="#fff" />
                        </TouchableOpacity>
                        <Image source={{ uri: selectedQuestion.image_url }} style={s.fullImage} resizeMode="contain" />
                        <View style={[s.detailControls, { backgroundColor: theme.surface }]}>
                            <View style={{ flex: 1 }}>
                                <View style={[s.lessonTag, { backgroundColor: (LESSON_COLORS[selectedQuestion.lesson] || '#6B7280') + '15', marginBottom: 6 }]}>
                                    <View style={[s.lessonDot, { backgroundColor: LESSON_COLORS[selectedQuestion.lesson] || '#6B7280' }]} />
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: LESSON_COLORS[selectedQuestion.lesson] || '#6B7280' }}>{selectedQuestion.lesson}</Text>
                                </View>
                                <Text style={[s.detailTopic, { color: theme.text }]}>{selectedQuestion.topic || 'Konusuz'}</Text>
                                {selectedQuestion.notes ? <Text style={{ color: theme.textSecondary, marginTop: 4, fontSize: 13 }}>{selectedQuestion.notes}</Text> : null}
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    style={[s.actionBtn, { backgroundColor: selectedQuestion.solved ? '#EF4444' : '#10B981' }]}
                                    onPress={() => { toggleSolved(selectedQuestion); setSelectedQuestion(null); }}
                                >
                                    <Ionicons name={selectedQuestion.solved ? "close-circle" : "checkmark-circle"} size={24} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.actionBtn, { backgroundColor: '#EF4444' }]}
                                    onPress={() => { deleteQuestion(selectedQuestion.id); setSelectedQuestion(null); }}
                                >
                                    <Ionicons name="trash" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </Modal>
        </View>
    );
};

export default QuestionPoolView;

const s = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: Platform.OS === 'android' ? 10 : 0, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
    decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', marginTop: 2 },
    addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    filterSection: { marginVertical: 12 },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
    filterDot: { width: 6, height: 6, borderRadius: 3 },
    filterText: { fontWeight: '700', fontSize: 12 },
    statusTabs: { flexDirection: 'row', marginHorizontal: 15, marginTop: 10, borderRadius: 16, padding: 4, gap: 4 },
    statusTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },

    emptyIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 10, paddingBottom: 50 },
    card: { flex: 1, margin: 6, borderRadius: 20, overflow: 'hidden', height: 220 },
    cardImage: { width: '100%', height: 150, backgroundColor: '#eee' },
    statusBadge: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cardContent: { padding: 10 },
    lessonTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
    lessonDot: { width: 5, height: 5, borderRadius: 3 },
    cardTopic: { fontSize: 13, fontWeight: '700', marginTop: 4 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { height: '85%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 0 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    modalCloseBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    imagePickerContainer: { alignItems: 'center', marginBottom: 20 },
    previewImage: { width: '100%', height: 200, borderRadius: 16 },
    placeholderImage: { width: '100%', height: 150, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    pickerBtns: { flexDirection: 'row', marginTop: 12, gap: 12 },
    pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14 },
    label: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 10 },
    input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14 },
    lessonChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginRight: 8, borderWidth: 1.5 },
    saveBtn: { marginTop: 24, borderRadius: 18, overflow: 'hidden' },
    saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    fullScreenModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
    fullImage: { width, height: height * 0.7 },
    closeDetailBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    detailControls: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 20, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    detailTopic: { fontSize: 16, fontWeight: '700' },
    actionBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});
