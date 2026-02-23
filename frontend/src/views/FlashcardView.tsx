import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
    Dimensions, Animated, Alert, StatusBar, Modal, ScrollView, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { flashcardService } from '../services/flashcardService';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../hooks/useGamification';
import { DrawingCanvas } from '../components/flashcard/DrawingCanvas';
import { PremiumCard } from '../components/flashcard/PremiumCard';
import { BattleHud } from '../components/flashcard/BattleHud';
import { BlurView } from 'expo-blur';
import { API_URL } from '../config/api';

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
    drawingPath?: string;
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
    const [viewMode, setViewMode] = useState<'study' | 'manage' | 'duels' | 'duel-active' | 'deck-builder' | 'hub'>('hub');
    const [duels, setDuels] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [friendModalVisible, setFriendModalVisible] = useState(false);
    const [activeDuel, setActiveDuel] = useState<any>(null);
    const [battleState, setBattleState] = useState<any>(null);
    const [duelResults, setDuelResults] = useState({ correct: 0, total: 0, score: 0 });
    const [duelStartTime, setDuelStartTime] = useState<number>(0);
    const [isDamagePulse, setIsDamagePulse] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [duelWinner, setDuelWinner] = useState<any>(null);
    const [currentHP, setCurrentHP] = useState(100);
    const { user } = useAuth();
    const { addXp, recordAction } = useGamification();
    const [draftDrawing, setDraftDrawing] = useState('');
    const [isReferee, setIsReferee] = useState(false);
    const [mastery, setMastery] = useState(0);
    const [energy, setEnergy] = useState(5);
    const flipAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    useEffect(() => {
        loadCards();
        if (user) {
            loadDuels();
            loadFriends();
        }
    }, [user]);

    useEffect(() => {
        if (viewMode === 'duel-active' && activeDuel?.id) {
            const unsub = flashcardService.subscribeToDuel(activeDuel.id, (data) => {
                setBattleState(data);

                // If I'm the player and referee has judged my answer
                if (!isReferee && data.live_stats?.[user.uid]?.judgment && data.live_stats[user.uid].judgment !== 'pending') {
                    const judgment = data.live_stats[user.uid].judgment;
                    if (judgment === 'correct') {
                        triggerGlow();
                        setTimeout(() => nextDuelCard(3), 1500);
                    } else if (judgment === 'wrong') {
                        triggerShake();
                        setTimeout(() => nextDuelCard(0), 1500);
                    }
                }
            });
            return () => unsub();
        }
    }, [viewMode, activeDuel?.id, isReferee]);

    const loadFriends = async () => {
        try {
            const resp = await fetch(`${API_URL}/friends/${user.uid}/list`);
            const data = await resp.json();
            setFriends(data.friends || []);
        } catch (e) { console.error("Load friends error:", e); }
    };

    const loadDuels = async () => {
        try {
            const data = await flashcardService.getUserDuels(user.uid);
            setDuels(data.duels || []);
        } catch (e) {
            console.error("Load duels error:", e);
        }
    };

    const shareDeck = async () => {
        if (!user) return;
        if (!filterSubject) {
            Alert.alert('Hata', 'Paylaşmak için önce bir konu seçmelisiniz.');
            return;
        }
        const subjectCards = cards.filter(c => c.subject === filterSubject);
        if (subjectCards.length === 0) {
            Alert.alert('Hata', 'Bu konuda hiç kartınız yok.');
            return;
        }

        setIsSyncing(true);
        try {
            const res = await flashcardService.createSharedDeck({
                creator_id: user.uid,
                title: `${filterSubject} Destesi`,
                subject: filterSubject,
                cards: subjectCards.map(c => ({ front: c.front, back: c.back, subject: c.subject }))
            });
            Alert.alert('Paylaşım', `Deste paylaşıldı! Şimdi bir arkadaşına meydan oku?`, [
                { text: 'Sadece Paylaş', style: 'cancel' },
                {
                    text: 'Meydan Oku', onPress: () => {
                        setSelectedDeckId(res.deck_id);
                        setFriendModalVisible(true);
                    }
                }
            ]);
        } catch (e) {
            Alert.alert('Hata', 'Deste paylaşılırken bir sorun oluştu.');
        } finally {
            setIsSyncing(false);
        }
    };

    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

    const inviteToDuel = async (friendId: string) => {
        if (!selectedDeckId) return;
        try {
            await flashcardService.challengeFriend({
                challenger_id: user.uid,
                opponent_id: friendId,
                deck_id: selectedDeckId
            });
            Alert.alert('Başarılı', 'Davet gönderildi!');
            setFriendModalVisible(false);
            loadDuels();
        } catch (e) {
            Alert.alert('Hata', 'Davet gönderilemedi.');
        }
    };

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const triggerGlow = () => {
        Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
    };

    const startDuel = async (duel: any) => {
        setIsSyncing(true);
        try {
            const deck = await flashcardService.getDeck(duel.deck_id);
            setCards(deck.cards.map((c: any, i: number) => ({ ...c, id: i.toString() })));
            setActiveDuel(duel);
            setCurrentHP(100);
            setIsReferee(duel.challenger_id === user.uid);

            // Initialize live stats if not exist
            await flashcardService.updateBattleStats(duel.id, user.uid, {
                hp: 100,
                progress: 0,
                current_score: 0,
                judgment: 'pending'
            });

            setViewMode('duel-active');
            setCurrentIndex(0);
            setIsFlipped(false);
            setDuelResults({ correct: 0, total: deck.cards.length, score: 0 });
            setDuelStartTime(Date.now());
        } catch (e) {
            Alert.alert('Hata', 'Deste yüklenemedi.');
        } finally {
            setIsSyncing(false);
        }
    };

    const nextDuelCard = async (confidence: number) => {
        const isCorrect = confidence >= 2;
        const newHP = isCorrect ? currentHP : Math.max(0, currentHP - 15);
        if (!isCorrect) triggerShake();
        if (confidence === 3) triggerGlow();

        const newScore = duelResults.score + (confidence === 3 ? 10 : confidence === 2 ? 8 : confidence === 1 ? 4 : 0);
        const newCorrect = duelResults.correct + (isCorrect ? 1 : 0);
        const progress = Math.floor(((currentIndex + 1) / cards.length) * 100);

        setCurrentHP(newHP);
        setDuelResults(prev => ({ ...prev, correct: newCorrect, score: newScore }));

        // Update Battle Stats in Firestore
        flashcardService.updateBattleStats(activeDuel.id, user.uid, {
            hp: newHP,
            progress: progress,
            current_score: newScore
        });

        if (currentIndex + 1 >= cards.length) {
            finishDuel(newScore, newCorrect);
        } else {
            setIsFlipped(false);
            flipAnim.setValue(0);
            setCurrentIndex(currentIndex + 1);
            setDraftDrawing(''); // Clear drawing for next card
            setEnergy(prev => Math.min(5, prev + 1)); // Recharge energy
        }
    };

    const judgeOpponent = async (isCorrect: boolean) => {
        if (!activeDuel || !battleState) return;
        const oppId = activeDuel.challenger_id === user.uid ? activeDuel.opponent_id : activeDuel.challenger_id;
        const oppStats = battleState.live_stats?.[oppId];

        if (!oppStats) return;

        const newScore = isCorrect ? oppStats.current_score + 10 : oppStats.current_score;
        const newHP = isCorrect ? oppStats.hp : Math.max(0, oppStats.hp - 15);

        await flashcardService.updateBattleStats(activeDuel.id, user.uid, {
            judgment: isCorrect ? 'correct' : 'wrong',
            current_score: newScore,
            hp: newHP,
            progress: oppStats.progress // Keep same progress
        });
    };

    const submitAnswer = async (drawing: string) => {
        await flashcardService.updateBattleStats(activeDuel.id, user.uid, {
            progress: Math.floor(((currentIndex + 1) / cards.length) * 100),
            current_score: duelResults.score,
            current_answer: drawing,
            judgment: 'pending'
        });
        // Wait for referee...
    };

    const finishDuel = async (finalScore: number, finalCorrect: number) => {
        const timeSpent = Math.floor((Date.now() - duelStartTime) / 1000);
        setIsSyncing(true);
        try {
            await flashcardService.completeDuel({
                duel_id: activeDuel.id,
                user_id: user.uid,
                score: finalScore,
                correct_count: finalCorrect,
                total_count: cards.length,
                time_spent: timeSpent
            });

            // Add XP Reward
            await addXp(50 + finalScore);
            await recordAction('flashcard_duel_win', finalScore);

            setShowResultModal(true);
        } catch (e) {
            Alert.alert('Hata', 'Sonuç kaydedilemedi.');
        } finally {
            setIsSyncing(false);
        }
    };

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
            drawingPath: draftDrawing || undefined
        };
        saveCards([newCard, ...cards]);
        setFront('');
        setBack('');
        setDraftDrawing('');
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

    const filteredCards = getFilteredCards();
    const currentCard = filteredCards[currentIndex];

    const getSubjectColor = (subject: string) => {
        const i = SUBJECTS.indexOf(subject);
        return ACCENT_COLORS[i >= 0 ? i : 0];
    };

    const renderDeckHub = () => (
        <View style={s.deckHub}>
            <View style={s.hubHeader}>
                <Text style={s.hubTitle}>DESTELERİN</Text>
                <Text style={s.hubSub}>Dünyanı seç ve öğrenmeye başla</Text>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.hubScroll}
                snapToInterval={width * 0.7 + 20}
                snapToAlignment="start"
                decelerationRate="fast"
            >
                {SUBJECTS.map((sub, idx) => {
                    const count = cards.filter(c => c.subject === sub).length;
                    return (
                        <View key={sub} style={[s.deckCard, { borderLeftColor: ACCENT_COLORS[idx] }]}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                                style={StyleSheet.absoluteFill}
                            />
                            <Ionicons name="albums" size={32} color={ACCENT_COLORS[idx]} />
                            <View style={s.deckInfo}>
                                <Text style={s.deckName}>{sub}</Text>
                                <Text style={s.deckCount}>{count} KART</Text>
                            </View>
                            <View style={s.deckProgress}>
                                <TouchableOpacity
                                    style={[s.forgeBtn, { backgroundColor: ACCENT_COLORS[idx] }]}
                                    onPress={() => {
                                        setFilterSubject(sub);
                                        setViewMode('deck-builder');
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="hammer" size={14} color="#FFF" />
                                        <Text style={s.forgeBtnText}>FORGE</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[s.forgeBtn, { backgroundColor: '#F59E0B' }]}
                                    onPress={() => {
                                        setFilterSubject(sub);
                                        shareDeck();
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="people" size={14} color="#FFF" />
                                        <Text style={s.forgeBtnText}>INVITE</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={s.deckEnterBtn}
                                onPress={() => {
                                    setFilterSubject(sub);
                                    setViewMode('study');
                                    setCurrentIndex(0);
                                }}
                            >
                                <Ionicons name="play" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    );
                })}
                {/* Empty space at the end to allow scrolling last card into view properly */}
                <View style={{ width: 40 }} />
            </ScrollView>

            <View style={s.quickActions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => setViewMode('duels')}>
                    <Ionicons name="flash" size={24} color="#F59E0B" />
                    <Text style={s.actionText}>DÜELLOLAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.actionBtnMain]} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => setViewMode('manage')}>
                    <Ionicons name="settings" size={24} color="#8B5CF6" />
                    <Text style={s.actionText}>YÖNET</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[s.container, { backgroundColor: '#0F0F1A' }]}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Immersive Header */}
                <View style={s.premiumHeader}>
                    <TouchableOpacity
                        onPress={() => viewMode === 'hub' ? onBack() : setViewMode('hub')}
                        style={s.pBackBtn}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={s.pTitle}>ARENA</Text>
                    <TouchableOpacity style={s.pProfileBtn}>
                        <Ionicons name="person-circle" size={28} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                </View>

                {viewMode === 'study' ? (
                    <View style={s.immersionView}>
                        <BattleHud
                            hp={100}
                            mastery={mastery}
                            energy={energy}
                            playerName="SEN"
                        />
                        <View style={s.cardWrapper}>
                            {currentCard ? (
                                <PremiumCard
                                    card={currentCard}
                                    isFlipped={isFlipped}
                                    onFlip={() => setIsFlipped(!isFlipped)}
                                    onSwipeLeft={() => nextCard(0)}
                                    onSwipeRight={() => nextCard(3)}
                                    onSwipeUp={() => {
                                        setMastery(m => m + 5);
                                        nextCard(3);
                                    }}
                                />
                            ) : (
                                <View style={s.emptyImmersion}>
                                    <Text style={s.emptyImmersionText}>Bu destede kart kalmadı!</Text>
                                    <TouchableOpacity style={s.backToHub} onPress={() => setViewMode('hub')}>
                                        <Text style={s.backToHubText}>HUB'A DÖN</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                ) : viewMode === 'duel-active' ? (
                    <View style={s.immersionView}>
                        <BattleHud
                            hp={currentHP}
                            mastery={duelResults.score}
                            energy={energy}
                            playerName="SEN"
                            opponentHp={battleState?.live_stats ? (Object.values(battleState.live_stats).find((s: any) => s.last_update) as any)?.hp : 100}
                        />
                        <View style={s.cardWrapper}>
                            {isReferee ? (
                                <View style={s.refereeOverlay}>
                                    <Text style={s.refereeTitle}>HAKEM MODU</Text>
                                    <View style={s.oppAnswerBox}>
                                        {(() => {
                                            const oppId = Object.keys(battleState?.live_stats || {}).find(id => id !== user.uid);
                                            const oppStats = oppId ? battleState.live_stats[oppId] : null;
                                            return oppStats?.current_answer ? (
                                                <DrawingCanvas readOnly initialPath={oppStats.current_answer} height={250} width={width - 40} />
                                            ) : (
                                                <Text style={{ color: "rgba(255,255,255,0.4)" }}>Rakip çiziyor...</Text>
                                            );
                                        })()}
                                    </View>
                                    <View style={s.refActions}>
                                        <TouchableOpacity style={[s.refBtn, { backgroundColor: '#EF4444' }]} onPress={() => judgeOpponent(false)}>
                                            <Ionicons name="close" size={32} color="#FFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[s.refBtn, { backgroundColor: '#10B981' }]} onPress={() => judgeOpponent(true)}>
                                            <Ionicons name="checkmark" size={32} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                currentCard ? (
                                    <PremiumCard
                                        card={currentCard}
                                        isFlipped={isFlipped}
                                        onFlip={() => setIsFlipped(!isFlipped)}
                                        onSwipeLeft={() => submitAnswer('pass')}
                                        onSwipeRight={() => submitAnswer('hit')}
                                        onSwipeUp={() => submitAnswer('critical')}
                                    />
                                ) : (
                                    <View style={s.emptyImmersion}>
                                        <Text style={s.emptyImmersionText}>Tüm kartları bitirdin!</Text>
                                        <TouchableOpacity style={[s.backToHub, { marginTop: 10 }]} onPress={() => setViewMode('hub')}>
                                            <Text style={s.backToHubText}>HUB'A DÖN</Text>
                                        </TouchableOpacity>
                                    </View>
                                )
                            )}
                        </View>
                    </View>
                ) : viewMode === 'manage' ? (
                    <FlatList
                        data={filteredCards}
                        keyExtractor={item => item.id}
                        contentContainerStyle={s.manageList}
                        renderItem={({ item }) => (
                            <View style={s.pManageCard}>
                                <Text style={s.pManageText}>{item.front}</Text>
                                <TouchableOpacity onPress={() => deleteCard(item.id)}>
                                    <Ionicons name="trash" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                ) : viewMode === 'duels' ? (
                    <FlatList
                        data={duels}
                        keyExtractor={item => item.id}
                        contentContainerStyle={s.manageList}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={s.pDuelCard} onPress={() => startDuel(item)}>
                                <View style={s.pDuelAvatar}>
                                    <Text style={s.pDuelAvatarText}>{item.opponent_name[0]}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 15 }}>
                                    <Text style={s.pDuelName}>{item.opponent_name}</Text>
                                    <Text style={s.pDuelMeta}>{item.deck_title}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>
                        )}
                    />
                ) : viewMode === 'deck-builder' ? (
                    <View style={s.deckHub}>
                        <View style={s.hubHeader}>
                            <Text style={s.hubTitle}>DESTEYİ DÖV</Text>
                            <Text style={s.hubSub}>{filterSubject} için yeni kartlar ekle</Text>
                        </View>

                        {/* Quick Add Form */}
                        <BlurView intensity={20} tint="light" style={s.forgeMatrix}>
                            <TextInput
                                style={s.pInput}
                                placeholder="Soru / Ön Yüz"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={front}
                                onChangeText={setFront}
                            />
                            <TextInput
                                style={s.pInput}
                                placeholder="Cevap / Arka Yüz"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={back}
                                onChangeText={setBack}
                            />
                            <TouchableOpacity style={[s.pModalBtn, s.pModalBtnPrimary, { height: 50 }]} onPress={addCard}>
                                <Text style={s.pModalBtnText}>KARTI DÖV (EKLE)</Text>
                            </TouchableOpacity>
                        </BlurView>

                        <Text style={[s.hubSub, { marginLeft: 25, marginTop: 20, marginBottom: 10 }]}>MEVCUT KARTLAR ({filteredCards.length})</Text>

                        <FlatList
                            data={filteredCards}
                            keyExtractor={item => item.id}
                            contentContainerStyle={s.manageList}
                            renderItem={({ item }) => (
                                <View style={s.pManageCard}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.pManageText} numberOfLines={1}>{item.front}</Text>
                                        <Text style={[s.pDuelMeta, { marginTop: 4 }]} numberOfLines={1}>{item.back}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => deleteCard(item.id)}>
                                        <Ionicons name="trash" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />

                        <TouchableOpacity
                            style={[s.backToHub, { alignSelf: 'center', marginBottom: 30 }]}
                            onPress={() => setViewMode('hub')}
                        >
                            <Text style={s.backToHubText}>KARTLARI HAZIRLADIM, ŞİMDİ ARKADAŞLARIMA MEYDAN OKUYACAĞIM</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    renderDeckHub()
                )}

                {/* Modals & Sync stays same but styled */}
                <Modal visible={modalVisible} transparent animationType="slide">
                    <View style={s.modalOverlay}>
                        <BlurView intensity={80} tint="dark" style={s.pModalContent}>
                            <Text style={s.pModalTitle}>YENİ KART</Text>
                            <TextInput
                                style={s.pInput}
                                placeholder="Ön Yüz"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={front}
                                onChangeText={setFront}
                            />
                            <TextInput
                                style={s.pInput}
                                placeholder="Arka Yüz"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={back}
                                onChangeText={setBack}
                            />
                            <View style={s.pModalActions}>
                                <TouchableOpacity style={s.pModalBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={s.pModalBtnText}>İPTAL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.pModalBtn, s.pModalBtnPrimary]} onPress={addCard}>
                                    <Text style={s.pModalBtnText}>EKLE</Text>
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    </View>
                </Modal>

                {friendModalVisible && (
                    <Modal transparent animationType="slide">
                        <View style={s.modalOverlay}>
                            <BlurView intensity={95} tint="dark" style={s.pModalContent}>
                                <Text style={s.pModalTitle}>RKİP SEÇ</Text>
                                <FlatList
                                    data={friends}
                                    keyExtractor={item => item.id}
                                    style={{ maxHeight: 300, marginBottom: 20 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={s.pDuelCard} onPress={() => inviteToDuel(item.id)}>
                                            <View style={s.pDuelAvatar}>
                                                <Text style={s.pDuelAvatarText}>{(item.name || item.email || "U")[0].toUpperCase()}</Text>
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 15 }}>
                                                <Text style={s.pDuelName}>{item.name || item.email}</Text>
                                            </View>
                                            <Ionicons name="send" size={20} color="#8B5CF6" />
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={<Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Arkadaş bulunamadı.</Text>}
                                />
                                <TouchableOpacity
                                    style={[s.pModalBtn, { width: '100%' }]}
                                    onPress={() => setFriendModalVisible(false)}
                                >
                                    <Text style={s.pModalBtnText}>KAPAT (İPTAL)</Text>
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                    </Modal>
                )}

                {showResultModal && (
                    <Modal transparent animationType="fade">
                        <View style={s.modalOverlay}>
                            <BlurView intensity={90} tint="dark" style={s.resultCard}>
                                <Ionicons name="trophy" size={80} color="#F59E0B" />
                                <Text style={s.resultTitle}>ZAFER!</Text>
                                <Text style={s.resultScore}>{duelResults.score} PUAN</Text>
                                <TouchableOpacity style={s.resultBtn} onPress={() => setShowResultModal(false)}>
                                    <Text style={s.resultBtnText}>DEVAM ET</Text>
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                    </Modal>
                )}

                {isSyncing && (
                    <View style={s.syncOverlay}>
                        <ActivityIndicator size="large" color="#8B5CF6" />
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

// ─── STYLES ────────────────────────────────────────
// ─── STYLES ────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1 },
    premiumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
    },
    pBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 4,
    },
    pProfileBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Deck Hub Styles
    deckHub: {
        flex: 1,
        paddingTop: 20,
    },
    hubHeader: {
        paddingHorizontal: 25,
        marginBottom: 30,
    },
    hubTitle: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 2,
    },
    hubSub: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 5,
    },
    hubScroll: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 20,
    },
    deckCard: {
        width: width * 0.7,
        height: width * 0.9,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 30,
        padding: 25,
        justifyContent: 'space-between',
        borderLeftWidth: 4,
        overflow: 'hidden',
    },
    deckInfo: {
        marginTop: 10,
    },
    deckName: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
    },
    deckCount: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
    deckProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    progressText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },

    quickActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
        paddingBottom: 40,
    },
    actionBtn: {
        alignItems: 'center',
        gap: 8,
    },
    actionBtnMain: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowRadius: 15,
        shadowOpacity: 0.5,
        elevation: 10,
    },
    actionText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: '800',
    },

    // Immersion View
    immersionView: {
        flex: 1,
    },
    cardWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyImmersion: {
        alignItems: 'center',
    },
    emptyImmersionText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
    },
    backToHub: {
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    backToHubText: {
        color: '#8B5CF6',
        fontWeight: '900',
    },

    // Manage & Duel Lists
    manageList: {
        padding: 20,
    },
    pManageCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        marginBottom: 10,
    },
    pManageText: {
        color: '#FFF',
        fontWeight: '600',
    },
    pDuelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 25,
        marginBottom: 15,
    },
    pDuelAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pDuelAvatarText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 18,
    },
    pDuelName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    pDuelMeta: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    forgeMatrix: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 10,
    },

    forgeBtn: {
        width: 80,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    forgeBtnText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    deckEnterBtn: {
        position: 'absolute',
        right: 25,
        bottom: 25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },
    pModalContent: {
        width: '100%',
        padding: 30,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    pModalTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 25,
        textAlign: 'center',
    },
    pInput: {
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 15,
        paddingHorizontal: 20,
        color: '#FFF',
        fontSize: 16,
        marginBottom: 15,
    },
    pModalActions: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 10,
    },
    pModalBtn: {
        flex: 1,
        height: 55,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    pModalBtnPrimary: {
        backgroundColor: '#8B5CF6',
    },
    pModalBtnText: {
        color: '#FFF',
        fontWeight: '800',
        letterSpacing: 1,
    },

    // Results
    resultCard: {
        width: '100%',
        padding: 40,
        borderRadius: 40,
        alignItems: 'center',
        overflow: 'hidden',
    },
    resultTitle: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
        marginTop: 20,
    },
    resultScore: {
        color: '#F59E0B',
        fontSize: 24,
        fontWeight: '800',
        marginVertical: 10,
    },
    resultBtn: {
        marginTop: 30,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 20,
        backgroundColor: '#FFF',
    },
    resultBtnText: {
        color: '#000',
        fontWeight: '900',
    },

    // Battle Overlays
    refereeOverlay: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refereeTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 20,
    },
    oppAnswerBox: {
        width: width - 40,
        height: 300,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 30,
    },
    refActions: {
        flexDirection: 'row',
        gap: 30,
    },
    refBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 10,
        shadowOpacity: 0.5,
    },
    syncOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15,15,26,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
});
