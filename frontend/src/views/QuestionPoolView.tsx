import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
    StatusBar,
    ScrollView,
    Platform
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useQuestions } from '../hooks/useQuestions';
import { Question, Theme } from '../types';

const { width, height } = Dimensions.get('window');
const FlashListComponent = FlashList as any;

const LESSONS = ["Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Tarih", "Coğrafya", "Felsefe", "Din", "İngilizce"];

export const QuestionPoolView = ({ onBack, theme = COLORS.light }: { onBack: () => void, theme: Theme }) => {
    const {
        questions,
        loading,
        filterLesson,
        setFilterLesson,
        filterStatus,
        setFilterStatus,
        addQuestion,
        toggleSolved,
        deleteQuestion
    } = useQuestions();

    // Add Question Modal State
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [newImage, setNewImage] = useState<string | null>(null);
    const [newLesson, setNewLesson] = useState(LESSONS[0]);
    const [newTopic, setNewTopic] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [adding, setAdding] = useState(false);

    // Detail Modal State
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    // --- Image Picker ---
    const pickImage = async (source: 'camera' | 'gallery') => {
        try {
            let result;
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert("İzin Gerekli", "Kamera izni vermelisiniz.");
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images, // Reverted to MediaTypeOptions
                    quality: 0.5,
                    allowsEditing: true,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert("İzin Gerekli", "Galeri izni vermelisiniz.");
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images, // Reverted to MediaTypeOptions
                    quality: 0.5,
                    allowsEditing: true,
                });
            }

            if (!result.canceled && result.assets[0].uri) {
                setNewImage(result.assets[0].uri);
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Hata", "Resim seçilemedi.");
        }
    };

    const handleSave = async () => {
        if (!newImage) {
            Alert.alert("Eksik", "Lütfen bir fotoğraf ekleyin.");
            return;
        }
        setAdding(true);
        const success = await addQuestion(newImage, newLesson, newTopic, newNotes);
        setAdding(false);
        if (success) {
            setAddModalVisible(false);
            // Reset form
            setNewImage(null);
            setNewTopic('');
            setNewNotes('');
        }
    };

    const renderItem = ({ item }: { item: Question }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface }, theme.cardShadow]}
            onPress={() => setSelectedQuestion(item)}
            activeOpacity={0.9}
        >
            <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: item.solved ? '#10B981' : '#EF4444' }]}>
                <Ionicons name={item.solved ? "checkmark" : "close"} size={12} color="#fff" />
            </View>

            <View style={styles.cardContent}>
                <Text style={[styles.cardLesson, { color: theme.primary }]}>{item.lesson}</Text>
                <Text style={[styles.cardTopic, { color: theme.text }]} numberOfLines={1}>
                    {item.topic || 'Konusuz'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={isDark ? ['#1A1A2E', '#16213E'] : ['#4F46E5', '#3730A3']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView style={styles.headerContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Soru Havuzu</Text>
                    </View>
                    <TouchableOpacity onPress={() => setAddModalVisible(true)} style={[styles.iconBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name="add" size={28} color="#fff" />
                    </TouchableOpacity>
                </SafeAreaView>
            </LinearGradient>

            {/* Filters */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
                    <TouchableOpacity
                        style={[styles.filterChip, !filterLesson && { backgroundColor: theme.primary }]}
                        onPress={() => setFilterLesson(null)}
                    >
                        <Text style={[styles.filterText, !filterLesson && { color: '#fff' }]}>Tümü</Text>
                    </TouchableOpacity>
                    {LESSONS.map((l) => (
                        <TouchableOpacity
                            key={l}
                            style={[
                                styles.filterChip,
                                filterLesson === l ? { backgroundColor: theme.primary } : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }
                            ]}
                            onPress={() => setFilterLesson(l === filterLesson ? null : l)}
                        >
                            <Text style={[styles.filterText, filterLesson === l ? { color: '#fff' } : { color: theme.textSecondary }]}>{l}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Status Filter Tabs */}
                <View style={styles.statusTabs}>
                    <TouchableOpacity
                        style={[styles.statusTab, filterStatus === 'unsolved' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                        onPress={() => setFilterStatus('unsolved')}
                    >
                        <Text style={[styles.statusText, { color: filterStatus === 'unsolved' ? theme.primary : theme.textSecondary }]}>Yapamadıklarım ❌</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.statusTab, filterStatus === 'solved' && { borderBottomColor: '#10B981', borderBottomWidth: 2 }]}
                        onPress={() => setFilterStatus('solved')}
                    >
                        <Text style={[styles.statusText, { color: filterStatus === 'solved' ? '#10B981' : theme.textSecondary }]}>Çözdüklerim ✅</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Grid */}
            {loading ? (
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlashListComponent
                    data={questions}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    estimatedItemSize={220}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Text style={{ color: theme.textSecondary }}> {filterStatus === 'solved' ? 'Henüz çözülmüş soru yok.' : 'Harika! Yapamadığın soru yok.'}</Text>
                        </View>
                    }
                />
            )}

            {/* ADD MODAL */}
            <Modal visible={addModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Yeni Soru Ekle</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            {/* Image Preview / Picker */}
                            <View style={styles.imagePickerContainer}>
                                {newImage ? (
                                    <Image source={{ uri: newImage }} style={styles.previewImage} resizeMode="contain" />
                                ) : (
                                    <View style={[styles.placeholderImage, { backgroundColor: theme.background }]}>
                                        <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
                                        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Fotoğraf Ekle</Text>
                                    </View>
                                )}
                                <View style={styles.pickerButtons}>
                                    <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: theme.primary }]} onPress={() => pickImage('camera')}>
                                        <Ionicons name="camera" size={20} color="#fff" />
                                        <Text style={{ color: '#fff', marginLeft: 5 }}>Kamera</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: theme.textSecondary }]} onPress={() => pickImage('gallery')}>
                                        <Ionicons name="images" size={20} color="#fff" />
                                        <Text style={{ color: '#fff', marginLeft: 5 }}>Galeri</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Lesson Picker (Simple Scroll) */}
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Ders</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                                {LESSONS.map(l => (
                                    <TouchableOpacity
                                        key={l}
                                        style={[styles.lessonChip, newLesson === l ? { backgroundColor: theme.primary } : { borderColor: theme.border, borderWidth: 1 }]}
                                        onPress={() => setNewLesson(l)}
                                    >
                                        <Text style={{ color: newLesson === l ? '#fff' : theme.text }}>{l}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Topic */}
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Konu (Opsiyonel)</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Örn: Türev"
                                placeholderTextColor={theme.textSecondary}
                                value={newTopic}
                                onChangeText={setNewTopic}
                            />

                            {/* Notes */}
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Notlar</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, height: 80, textAlignVertical: 'top' }]}
                                placeholder="Sorudaki püf noktası..."
                                placeholderTextColor={theme.textSecondary}
                                value={newNotes}
                                onChangeText={setNewNotes}
                                multiline
                            />

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: adding ? 0.7 : 1 }]}
                                onPress={handleSave}
                                disabled={adding}
                            >
                                {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* DETAIL MODAL */}
            <Modal visible={!!selectedQuestion} animationType="fade" transparent>
                {selectedQuestion && (
                    <View style={styles.fullScreenModal}>
                        <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setSelectedQuestion(null)}>
                            <Ionicons name="close-circle" size={36} color="#fff" />
                        </TouchableOpacity>

                        <Image source={{ uri: selectedQuestion.image_url }} style={styles.fullImage} resizeMode="contain" />

                        <View style={[styles.detailControls, { backgroundColor: theme.surface }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.detailLesson, { color: theme.primary }]}>{selectedQuestion.lesson}</Text>
                                <Text style={[styles.detailTopic, { color: theme.text }]}>{selectedQuestion.topic || 'Konusuz'}</Text>
                                {selectedQuestion.notes ? <Text style={{ color: theme.textSecondary, marginTop: 4 }}>{selectedQuestion.notes}</Text> : null}
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: selectedQuestion.solved ? '#EF4444' : '#10B981' }]}
                                    onPress={() => {
                                        toggleSolved(selectedQuestion);
                                        setSelectedQuestion(null); // Close to update list
                                    }}
                                >
                                    <Ionicons name={selectedQuestion.solved ? "close-circle" : "checkmark-circle"} size={24} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                                    onPress={() => {
                                        deleteQuestion(selectedQuestion.id);
                                        setSelectedQuestion(null);
                                    }}
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

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 0,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10
    },
    iconBtn: { padding: 8, borderRadius: 12 },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginLeft: 10 },

    filterSection: { marginVertical: 15 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    filterText: { fontWeight: '600', fontSize: 13 },
    statusTabs: { flexDirection: 'row', marginTop: 15, paddingHorizontal: 20, gap: 20 },
    statusTab: { paddingBottom: 8 },
    statusText: { fontWeight: '700', fontSize: 14 },

    listContent: { paddingHorizontal: 10, paddingBottom: 50 },
    card: {
        flex: 1,
        margin: 6,
        borderRadius: 16,
        overflow: 'hidden',
        height: 220,
    },
    cardImage: { width: '100%', height: 160, backgroundColor: '#eee' },
    statusBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
        borderRadius: 10,
    },
    cardContent: { padding: 10 },
    cardLesson: { fontSize: 12, fontWeight: '700' },
    cardTopic: { fontSize: 13, fontWeight: '600', marginTop: 2 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { height: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: '800' },

    imagePickerContainer: { alignItems: 'center', marginBottom: 20 },
    previewImage: { width: '100%', height: 200, borderRadius: 12 },
    placeholderImage: { width: '100%', height: 150, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    pickerButtons: { flexDirection: 'row', marginTop: 10, gap: 10 },
    pickerBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },

    label: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 10 },
    input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
    lessonChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginRight: 8 },
    saveBtn: { marginTop: 30, padding: 16, borderRadius: 16, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    // Full Screen Detail
    fullScreenModal: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
    fullImage: { width: width, height: height * 0.7 },
    closeDetailBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    detailControls: {
        position: 'absolute', bottom: 40, left: 20, right: 20,
        padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    detailLesson: { fontSize: 14, fontWeight: '700' },
    detailTopic: { fontSize: 16, fontWeight: '600' },
    actionBtn: { padding: 10, borderRadius: 12 }
});
