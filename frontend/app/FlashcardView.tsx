import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
    Dimensions, Animated, Alert, StatusBar, Modal, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@RCSinavim_Flashcards';

const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe'];
const ACCENT_COLORS = ['#6C3CE1', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];

interface Flashcard {
    id: string;
    front: string;
    back: string;
    subject: string;
    createdAt: string;
    lastReviewed?: string;
    confidence: number; // 0-3 (0=hard, 3=easy)
}

export const FlashcardView = ({ onBack, theme }: any) => {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('Matematik');
    const [filterSubject, setFilterSubject] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'study' | 'manage'>('study');
    const flipAnim = useRef(new Animated.Value(0)).current;
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setCards(JSON.parse(raw));
    };

    const saveCards = async (newCards: Flashcard[]) => {
        setCards(newCards);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCards));
    };

    const addCard = () => {
        if (!front.trim() || !back.trim()) {
            Alert.alert('Eksik', 'Ön ve arka yüzü doldurun.');
            return;
        }
        const newCard: Flashcard = {
            id: Date.now().toString(),
            front: front.trim(),
            back: back.trim(),
            subject: selectedSubject,
            createdAt: new Date().toISOString(),
            confidence: 0,
        };
        saveCards([newCard, ...cards]);
        setFront('');
        setBack('');
        setModalVisible(false);
    };

    const deleteCard = (id: string) => {
        Alert.alert('Sil', 'Bu kartı silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => saveCards(cards.filter(c => c.id !== id)) },
        ]);
    };

    const flipCard = () => {
        Animated.spring(flipAnim, {
            toValue: isFlipped ? 0 : 1,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
        setIsFlipped(!isFlipped);
    };

    const nextCard = (confidence: number) => {
        const filtered = getFilteredCards();
        if (filtered.length === 0) return;
        const updatedCards = cards.map(c => {
            if (c.id === filtered[currentIndex]?.id) {
                return { ...c, confidence, lastReviewed: new Date().toISOString() };
            }
            return c;
        });
        saveCards(updatedCards);
        setIsFlipped(false);
        flipAnim.setValue(0);
        setCurrentIndex(prev => (prev + 1) % filtered.length);
    };

    const getFilteredCards = () =>
        filterSubject ? cards.filter(c => c.subject === filterSubject) : cards;

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });
    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const filteredCards = getFilteredCards();
    const currentCard = filteredCards[currentIndex];

    const getSubjectColor = (subject: string) => {
        const i = SUBJECTS.indexOf(subject);
        return ACCENT_COLORS[i >= 0 ? i : 0];
    };

    return (
        <View style={[s.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <LinearGradient
                    colors={isDark ? ['#4C1D95', '#3B0764'] : ['#8B5CF6', '#6C3CE1']}
                    style={s.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity onPress={onBack} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Flashcard</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={[s.modeBtn, viewMode === 'study' && s.modeBtnActive]}
                            onPress={() => setViewMode('study')}
                        >
                            <Ionicons name="book" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.modeBtn, viewMode === 'manage' && s.modeBtnActive]}
                            onPress={() => setViewMode('manage')}
                        >
                            <Ionicons name="list" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Subject Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
                    <TouchableOpacity
                        style={[s.filterChip, !filterSubject && { backgroundColor: theme.primary }]}
                        onPress={() => { setFilterSubject(null); setCurrentIndex(0); }}
                    >
                        <Text style={[s.filterChipText, !filterSubject && { color: '#fff' }, filterSubject && { color: theme.textSecondary }]}>
                            Tümü ({cards.length})
                        </Text>
                    </TouchableOpacity>
                    {SUBJECTS.filter(sub => cards.some(c => c.subject === sub)).map(sub => (
                        <TouchableOpacity
                            key={sub}
                            style={[
                                s.filterChip,
                                filterSubject === sub
                                    ? { backgroundColor: getSubjectColor(sub) }
                                    : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }
                            ]}
                            onPress={() => { setFilterSubject(sub); setCurrentIndex(0); }}
                        >
                            <Text style={[s.filterChipText, filterSubject === sub ? { color: '#fff' } : { color: theme.textSecondary }]}>
                                {sub} ({cards.filter(c => c.subject === sub).length})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {viewMode === 'study' ? (
                    <View style={s.studyArea}>
                        {currentCard ? (
                            <>
                                <Text style={[s.cardCounter, { color: theme.textSecondary }]}>
                                    {currentIndex + 1} / {filteredCards.length}
                                </Text>
                                <TouchableOpacity activeOpacity={0.9} onPress={flipCard} style={s.cardTouchable}>
                                    {/* Front */}
                                    <Animated.View style={[s.card, { backgroundColor: theme.surface, transform: [{ rotateY: frontInterpolate }] }, theme.cardShadow]}>
                                        <View style={[s.cardLabel, { backgroundColor: getSubjectColor(currentCard.subject) + '20' }]}>
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: getSubjectColor(currentCard.subject) }}>{currentCard.subject}</Text>
                                        </View>
                                        <Text style={[s.cardFace, { color: theme.text }]}>{currentCard.front}</Text>
                                        <Text style={[s.tapHint, { color: theme.textSecondary }]}>Çevirmek için dokun</Text>
                                    </Animated.View>
                                    {/* Back */}
                                    <Animated.View style={[s.card, s.cardBack, { backgroundColor: theme.surface, transform: [{ rotateY: backInterpolate }] }, theme.cardShadow]}>
                                        <Text style={[s.cardFace, { color: theme.text }]}>{currentCard.back}</Text>
                                    </Animated.View>
                                </TouchableOpacity>

                                {isFlipped && (
                                    <View style={s.confidenceRow}>
                                        {[
                                            { label: 'Zor', color: '#EF4444', value: 0 },
                                            { label: 'Orta', color: '#F59E0B', value: 1 },
                                            { label: 'Kolay', color: '#10B981', value: 2 },
                                            { label: 'Biliyorum', color: '#3B82F6', value: 3 },
                                        ].map(item => (
                                            <TouchableOpacity
                                                key={item.value}
                                                style={[s.confBtn, { backgroundColor: item.color + '15' }]}
                                                onPress={() => nextCard(item.value)}
                                            >
                                                <Text style={{ fontSize: 12, fontWeight: '700', color: item.color }}>{item.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        ) : (
                            <View style={s.emptyState}>
                                <Ionicons name="albums-outline" size={48} color={theme.textSecondary} />
                                <Text style={[s.emptyTitle, { color: theme.text }]}>Henüz Kart Yok</Text>
                                <Text style={[s.emptySub, { color: theme.textSecondary }]}>+ butonuyla yeni kart ekle</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={filteredCards}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[s.manageList, filteredCards.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
                        ListEmptyComponent={
                            <View style={s.emptyState}>
                                <Ionicons name="albums-outline" size={48} color={theme.textSecondary} />
                                <Text style={[s.emptyTitle, { color: theme.text }]}>Kart Yok</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={[s.manageCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                                <View style={[s.manageAccent, { backgroundColor: getSubjectColor(item.subject) }]} />
                                <View style={s.manageContent}>
                                    <Text style={[s.manageFront, { color: theme.text }]} numberOfLines={1}>{item.front}</Text>
                                    <Text style={{ fontSize: 12, color: theme.textSecondary }} numberOfLines={1}>{item.back}</Text>
                                </View>
                                <TouchableOpacity onPress={() => deleteCard(item.id)} style={s.manageDelete}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}

                {/* FAB */}
                <TouchableOpacity
                    style={[s.fab, { backgroundColor: theme.primary }]}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Add Modal */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View style={s.modalOverlay}>
                        <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                            <Text style={[s.modalTitle, { color: theme.text }]}>Yeni Kart</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                {SUBJECTS.map(sub => (
                                    <TouchableOpacity
                                        key={sub}
                                        style={[s.subjectChip, selectedSubject === sub && { backgroundColor: getSubjectColor(sub), borderColor: getSubjectColor(sub) }, selectedSubject !== sub && { borderColor: theme.border }]}
                                        onPress={() => setSelectedSubject(sub)}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: selectedSubject === sub ? '#fff' : theme.textSecondary }}>{sub}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Soru / Ön Yüz"
                                value={front}
                                onChangeText={setFront}
                                placeholderTextColor={theme.textSecondary}
                                multiline
                            />
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background, minHeight: 80 }]}
                                placeholder="Cevap / Arka Yüz"
                                value={back}
                                onChangeText={setBack}
                                placeholderTextColor={theme.textSecondary}
                                multiline
                            />
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={[s.modalBtn, { backgroundColor: theme.border }]} onPress={() => setModalVisible(false)}>
                                    <Text style={{ color: theme.text, fontWeight: '700' }}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.modalBtn, { backgroundColor: theme.primary, flex: 1 }]} onPress={addCard}>
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
    header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', flex: 1, marginLeft: 14 },
    modeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
    modeBtnActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
    filterRow: { marginVertical: 14 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
    filterChipText: { fontSize: 12, fontWeight: '600' },
    studyArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    cardCounter: { fontSize: 13, fontWeight: '600', marginBottom: 14 },
    cardTouchable: { width: width - 48, height: 260 },
    card: {
        width: '100%', height: 260, borderRadius: 24, padding: 28, justifyContent: 'center', alignItems: 'center',
        backfaceVisibility: 'hidden', position: 'absolute',
    },
    cardBack: { position: 'absolute', top: 0 },
    cardLabel: { position: 'absolute', top: 16, left: 16, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
    cardFace: { fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26 },
    tapHint: { position: 'absolute', bottom: 18, fontSize: 12, fontWeight: '500' },
    confidenceRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
    confBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
    emptyState: { alignItems: 'center', gap: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptySub: { fontSize: 13, fontWeight: '500' },
    manageList: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
    manageCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
    manageAccent: { width: 4, height: '100%' },
    manageContent: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 4 },
    manageFront: { fontSize: 14, fontWeight: '700' },
    manageDelete: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    subjectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginRight: 8 },
    input: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, fontSize: 15, fontWeight: '500', marginBottom: 12, minHeight: 48 },
    modalBtn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: 'center' },
});
