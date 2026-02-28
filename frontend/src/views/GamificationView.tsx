import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    StatusBar, Platform, Dimensions, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { API_URL, API_HEADERS } from '../config/api';
import { Theme, AppView } from '../types';
import { BadgeUnlockModal } from '../components/gamification/BadgeUnlockModal';
import { BadgeCategory } from '../hooks/useGamification';

const { width } = Dimensions.get('window');

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    all: { label: 'Tümü', icon: 'grid', color: '#7C3AED' },
    analiz: { label: 'Analiz', icon: 'analytics', color: '#3B82F6' },
    study: { label: 'Çalışma', icon: 'time', color: '#6366F1' },
    productivity: { label: 'Üretkenlik', icon: 'create', color: '#EC4899' },
    level: { label: 'Seviye', icon: 'star', color: '#F59E0B' },
    streak: { label: 'Seri', icon: 'flame', color: '#EF4444' },
};

// ─── BOTTOM TAB BAR ────────────────────────────────
const BottomTabBar = ({ setView, theme }: { setView: (view: AppView) => void; theme: Theme }) => {
    const tabs = [
        { key: 'dashboard', label: 'Anasayfa', icon: 'home', iconOutline: 'home-outline' },
        { key: 'announcements', label: 'Duyurular', icon: 'notifications', iconOutline: 'notifications-outline' },
        { key: 'friends', label: 'Arkadaşlar', icon: 'people', iconOutline: 'people-outline' },
        { key: 'gamification', label: 'Başarılarım', icon: 'trophy', iconOutline: 'trophy-outline' },
        { key: 'profile', label: 'Profilim', icon: 'person', iconOutline: 'person-outline' },
    ];
    return (
        <View style={[s.bottomBar, { backgroundColor: theme.surface }]}>
            {tabs.map((tab) => {
                const isActive = tab.key === 'gamification';
                return (
                    <TouchableOpacity key={tab.key} style={s.tabItem} onPress={() => setView(tab.key as AppView)} activeOpacity={0.8}>
                        <View style={[s.activeIndicator, isActive && { backgroundColor: theme.primary }]} />
                        <Ionicons name={(isActive ? tab.icon : tab.iconOutline) as any} size={22} color={isActive ? theme.primary : theme.textSecondary} />
                        <Text style={[s.tabText, { color: isActive ? theme.primary : theme.textSecondary, fontWeight: isActive ? '700' : '500' }]}>{tab.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// ─── MAIN VIEW ─────────────────────────────────────
export const GamificationView = ({ setView, theme, gamification, streak }: any) => {
    const {
        xp, level, levelName, badges, dailyTasks,
        xpForNextLevel, xpForCurrentLevel, xpProgress,
        completeTask, totalBadges, lastUnlockedBadge,
        showBadgeModal, dismissBadgeModal, getBadgesByCategory,
    } = gamification;

    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
    const completedTasks = dailyTasks.filter((t: any) => t.completed).length;

    // Badge category filter
    const [selectedCategory, setSelectedCategory] = useState('all');
    const filteredBadges = getBadgesByCategory(selectedCategory);
    const unlockedFiltered = filteredBadges.filter((b: any) => b.unlocked);
    const lockedFiltered = filteredBadges.filter((b: any) => !b.unlocked);

    // Performance stats
    const [perfStats, setPerfStats] = useState({ total_hours: 0, total_tasks: 0 });
    const [perfLoading, setPerfLoading] = useState(true);

    // Friend leaderboard
    const [friends, setFriends] = useState<any[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) { setPerfLoading(false); setFriendsLoading(false); return; }

        // Fetch performance
        fetch(`${API_URL}/user-stats/${user.uid}`, { headers: API_HEADERS as HeadersInit })
            .then(r => r.json())
            .then(d => setPerfStats({ total_hours: d.total_hours || 0, total_tasks: d.total_tasks || 0 }))
            .catch(() => { })
            .finally(() => setPerfLoading(false));

        // Fetch friends for leaderboard
        fetch(`${API_URL}/friends/${user.uid}/list`, { headers: API_HEADERS as HeadersInit })
            .then(r => r.json())
            .then(d => setFriends(d.friends || []))
            .catch(() => { })
            .finally(() => setFriendsLoading(false));
    }, []);

    const progressPercent = Math.min(xpProgress * 100, 100);
    const xpInLevel = xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    // Streak warning logic
    const streakWarning = streak && streak.currentStreak > 0 && !streak.isActiveToday;

    return (
        <View style={[s.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Badge Unlock Modal */}
            <BadgeUnlockModal
                visible={showBadgeModal}
                badge={lastUnlockedBadge}
                onDismiss={dismissBadgeModal}
            />

            {/* ═══ HERO HEADER ═══ */}
            <LinearGradient
                colors={isDark ? ['#1E0A3C', '#2D1B69', '#4C1D95'] : ['#5B21B6', '#7C3AED', '#A78BFA']}
                style={s.heroHeader}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={[s.decorCircle, { top: -30, right: -20, width: 120, height: 120, opacity: 0.08 }]} />
                <View style={[s.decorCircle, { top: 40, left: -40, width: 100, height: 100, opacity: 0.06 }]} />
                <View style={[s.decorCircle, { bottom: -10, right: 60, width: 60, height: 60, opacity: 0.1 }]} />

                <View style={s.heroContent}>
                    {/* Level Ring */}
                    <View style={s.levelRingOuter}>
                        <LinearGradient
                            colors={['#F59E0B', '#EF4444', '#EC4899']}
                            style={s.levelRingGrad}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <View style={[s.levelRingInner, { backgroundColor: isDark ? '#1E0A3C' : '#5B21B6' }]}>
                                <Text style={s.levelNumHero}>{level}</Text>
                                <Text style={s.levelLabel}>SEVİYE</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <Text style={s.levelNameHero}>{levelName}</Text>

                    {/* XP Progress */}
                    <View style={s.xpProgressContainer}>
                        <View style={s.xpProgressTrack}>
                            <LinearGradient
                                colors={['#F59E0B', '#EF4444']}
                                style={[s.xpProgressFill, { width: `${progressPercent}%` }]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            />
                        </View>
                        <Text style={s.xpProgressText}>{xpInLevel} / {xpNeeded} XP</Text>
                    </View>

                    {/* Stats Row */}
                    <View style={s.heroStatsRow}>
                        <View style={s.heroStatItem}>
                            <Text style={s.heroStatValue}>{xp}</Text>
                            <Text style={s.heroStatLabel}>Toplam XP</Text>
                        </View>
                        <View style={s.heroStatDivider} />
                        <View style={s.heroStatItem}>
                            <Text style={s.heroStatValue}>{totalBadges}</Text>
                            <Text style={s.heroStatLabel}>Rozet</Text>
                        </View>
                        <View style={s.heroStatDivider} />
                        <View style={s.heroStatItem}>
                            <Text style={s.heroStatValue}>{completedTasks}/{dailyTasks.length}</Text>
                            <Text style={s.heroStatLabel}>Görev</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* ═══ STREAK WARNING ═══ */}
                {streakWarning && (
                    <TouchableOpacity style={s.streakWarning} activeOpacity={0.8}>
                        <LinearGradient colors={['#EF444420', '#F59E0B10']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                        <View style={s.streakWarningIcon}>
                            <Ionicons name="warning" size={22} color="#EF4444" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.streakWarningTitle, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
                                🔥 {streak.currentStreak} günlük serini kaybetme!
                            </Text>
                            <Text style={[s.streakWarningDesc, { color: isDark ? '#FCA5A580' : '#DC262690' }]}>
                                Bugün henüz çalışma kaydetmedin. Serini korumak için bir aktivite tamamla!
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* ═══ STREAK CARD ═══ */}
                {streak && (
                    <View style={[s.streakCard, { backgroundColor: isDark ? '#1A1623' : '#FFFBEB' }]}>
                        <LinearGradient colors={['#F59E0B20', '#EF444410']} style={s.streakGradBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                        <View style={s.streakContent}>
                            <View style={s.streakFireBox}>
                                <Text style={{ fontSize: 36 }}>🔥</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.streakMainText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                                    {streak.currentStreak > 0 ? `${streak.currentStreak} Gün Seri!` : 'Bugün çalışmaya başla!'}
                                </Text>
                                <View style={s.streakMetaRow}>
                                    <View style={[s.streakMiniTag, { backgroundColor: isDark ? '#F59E0B15' : '#FEF3C7' }]}>
                                        <Ionicons name="flame" size={11} color="#F59E0B" />
                                        <Text style={[s.streakMiniText, { color: '#F59E0B' }]}>En uzun: {streak.longestStreak}</Text>
                                    </View>
                                    <View style={[s.streakMiniTag, { backgroundColor: isDark ? '#10B98115' : '#D1FAE5' }]}>
                                        <Ionicons name="calendar" size={11} color="#10B981" />
                                        <Text style={[s.streakMiniText, { color: '#10B981' }]}>Toplam: {streak.totalActiveDays} gün</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* ═══ PERFORMANS ═══ */}
                <View style={s.sectionHeader}>
                    <Ionicons name="stats-chart" size={18} color={theme.primary} />
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Çalışma Performansım</Text>
                </View>
                <View style={s.perfRow}>
                    {[
                        { icon: 'time', color: '#7C3AED', value: perfLoading ? '...' : `${perfStats.total_hours}s`, label: 'Toplam Süre' },
                        { icon: 'checkmark-done-circle', color: '#10B981', value: perfLoading ? '...' : `${perfStats.total_tasks}`, label: 'Biten Görev' },
                        { icon: 'trophy', color: '#F59E0B', value: `${level}`, label: 'Seviye' },
                    ].map((item, i) => (
                        <View key={i} style={[s.perfCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                            <LinearGradient colors={[item.color + '15', item.color + '05']} style={s.perfCardGrad}>
                                <View style={[s.perfIconBox, { backgroundColor: item.color + '18' }]}>
                                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                                </View>
                                <Text style={[s.perfValue, { color: theme.text }]}>{item.value}</Text>
                                <Text style={[s.perfLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                            </LinearGradient>
                        </View>
                    ))}
                </View>

                {/* ═══ GÜNLÜK GÖREVLER ═══ */}
                <View style={s.sectionHeader}>
                    <Ionicons name="rocket" size={18} color="#F59E0B" />
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Günlük Görevler</Text>
                    <View style={[s.taskCountBadge, { backgroundColor: completedTasks === dailyTasks.length ? '#10B98120' : '#F59E0B15' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: completedTasks === dailyTasks.length ? '#10B981' : '#F59E0B' }}>
                            {completedTasks}/{dailyTasks.length}
                        </Text>
                    </View>
                </View>
                {dailyTasks.map((task: any) => (
                    <TouchableOpacity
                        key={task.id}
                        style={[s.taskCard, { backgroundColor: theme.surface }, theme.cardShadow, task.completed && { borderLeftColor: '#10B981', borderLeftWidth: 3 }]}
                        onPress={() => !task.completed && completeTask(task.id)}
                        disabled={task.completed}
                        activeOpacity={0.7}
                    >
                        <View style={[s.taskCheckbox, task.completed && s.taskCheckboxDone]}>
                            {task.completed ? (
                                <Ionicons name="checkmark" size={14} color="#fff" />
                            ) : (
                                <View style={s.taskCheckboxInner} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.taskTitle, { color: theme.text }, task.completed && s.taskDoneText]}>{task.title}</Text>
                            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{task.description}</Text>
                        </View>
                        <LinearGradient
                            colors={task.completed ? ['#10B98120', '#10B98110'] : ['#7C3AED15', '#7C3AED08']}
                            style={s.xpRewardTag}
                        >
                            <Text style={{ fontSize: 11, fontWeight: '800', color: task.completed ? '#10B981' : '#7C3AED' }}>
                                +{task.xpReward} XP
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}

                {/* ═══ ARKADAŞ KARŞILAŞTIRMASI ═══ */}
                {friends.length > 0 && (
                    <>
                        <View style={s.sectionHeader}>
                            <Ionicons name="people" size={18} color="#3B82F6" />
                            <Text style={[s.sectionTitle, { color: theme.text }]}>Arkadaş Sıralaması</Text>
                        </View>
                        <View style={[s.leaderboardCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                            {/* Current user */}
                            <View style={[s.leaderRow, { backgroundColor: theme.primary + '10', borderLeftWidth: 3, borderLeftColor: theme.primary }]}>
                                <View style={[s.leaderAvatar, { backgroundColor: theme.primary + '20' }]}>
                                    <Ionicons name="person" size={18} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[s.leaderName, { color: theme.text }]}>Sen</Text>
                                </View>
                                <View style={[s.leaderBadge, { backgroundColor: '#F59E0B20' }]}>
                                    <Text style={[s.leaderBadgeText, { color: '#F59E0B' }]}>Lv.{level}</Text>
                                </View>
                                <View style={[s.leaderBadge, { backgroundColor: '#7C3AED20' }]}>
                                    <Text style={[s.leaderBadgeText, { color: '#7C3AED' }]}>{xp} XP</Text>
                                </View>
                            </View>
                            {/* Friends */}
                            {friends.slice(0, 5).map((friend: any, i: number) => (
                                <View key={friend.id || i} style={s.leaderRow}>
                                    <View style={[s.leaderAvatar, { backgroundColor: '#E5E7EB' }]}>
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#6B7280' }}>
                                            {friend.name?.[0]?.toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[s.leaderName, { color: theme.text }]}>{friend.name}</Text>
                                    </View>
                                    <View style={[s.leaderBadge, { backgroundColor: '#E5E7EB' }]}>
                                        <Ionicons name="person" size={12} color="#9CA3AF" />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* ═══ ROZETLER — KATEGORİ FİLTRE ═══ */}
                <View style={s.sectionHeader}>
                    <Ionicons name="ribbon" size={18} color="#EC4899" />
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Rozetler</Text>
                    <View style={[s.taskCountBadge, { backgroundColor: '#EC489920' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#EC4899' }}>
                            {badges.filter((b: any) => b.unlocked).length}/{badges.length}
                        </Text>
                    </View>
                </View>

                {/* Category Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryScroll} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
                    {Object.entries(CATEGORY_LABELS).map(([key, cat]) => {
                        const isActive = selectedCategory === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                style={[s.categoryTab, isActive && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                                onPress={() => setSelectedCategory(key)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={cat.icon as any} size={14} color={isActive ? cat.color : theme.textSecondary} />
                                <Text style={[s.categoryTabText, { color: isActive ? cat.color : theme.textSecondary }]}>{cat.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Unlocked Badges */}
                {unlockedFiltered.length > 0 && (
                    <View style={s.badgeGrid}>
                        {unlockedFiltered.map((badge: any) => (
                            <View key={badge.id} style={[s.badgeCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                                <LinearGradient colors={[badge.color + '20', badge.color + '08']} style={s.badgeIconGrad}>
                                    <Text style={{ fontSize: 26 }}>{badge.icon}</Text>
                                </LinearGradient>
                                <Text style={[s.badgeName, { color: theme.text }]} numberOfLines={1}>{badge.name}</Text>
                                <Text style={{ fontSize: 9, color: theme.textSecondary, textAlign: 'center' }} numberOfLines={2}>{badge.description}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Locked Badges */}
                {lockedFiltered.length > 0 && (
                    <>
                        {unlockedFiltered.length > 0 && (
                            <View style={[s.sectionHeader, { marginTop: 16 }]}>
                                <Ionicons name="lock-closed" size={16} color={theme.textSecondary} />
                                <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>Kilitli</Text>
                                <View style={[s.taskCountBadge, { backgroundColor: theme.border + '20' }]}>
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textSecondary }}>{lockedFiltered.length}</Text>
                                </View>
                            </View>
                        )}
                        <View style={s.badgeGrid}>
                            {lockedFiltered.map((badge: any) => (
                                <View key={badge.id} style={[s.badgeCard, { backgroundColor: theme.surface, opacity: 0.55 }]}>
                                    <View style={[s.badgeIconGrad, { backgroundColor: theme.border + '20' }]}>
                                        <Text style={{ fontSize: 22 }}>🔒</Text>
                                    </View>
                                    <Text style={[s.badgeName, { color: theme.textSecondary }]} numberOfLines={1}>{badge.name}</Text>
                                    <Text style={{ fontSize: 9, color: theme.textSecondary + '80', textAlign: 'center' }} numberOfLines={2}>{badge.condition}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Empty state */}
                {unlockedFiltered.length === 0 && lockedFiltered.length === 0 && (
                    <View style={[s.emptyBadgeBox, { backgroundColor: theme.surface }, theme.cardShadow]}>
                        <View style={s.emptyBadgeIcon}>
                            <Ionicons name="lock-open-outline" size={28} color={theme.textSecondary + '60'} />
                        </View>
                        <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '500' }}>Bu kategoride henüz rozet yok.</Text>
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>

            <BottomTabBar setView={setView} theme={theme} />
        </View>
    );
};

// ─── STYLES ────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1 },

    // Hero Header
    heroHeader: {
        paddingTop: Platform.OS === 'android' ? 48 : 58,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
    },
    decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
    heroContent: { alignItems: 'center', paddingHorizontal: 20 },
    levelRingOuter: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
    levelRingGrad: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
    levelRingInner: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },
    levelNumHero: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 32 },
    levelLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', letterSpacing: 2 },
    levelNameHero: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 12 },
    xpProgressContainer: { width: '80%', marginBottom: 16 },
    xpProgressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
    xpProgressFill: { height: '100%', borderRadius: 3 },
    xpProgressText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 6 },
    heroStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20, width: '100%' },
    heroStatItem: { flex: 1, alignItems: 'center' },
    heroStatValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
    heroStatLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600', marginTop: 2 },
    heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)' },

    // Streak Warning
    streakWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 16,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#EF444430',
        overflow: 'hidden',
        gap: 12,
    },
    streakWarningIcon: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: '#EF444415',
        justifyContent: 'center', alignItems: 'center',
    },
    streakWarningTitle: { fontSize: 14, fontWeight: '800' },
    streakWarningDesc: { fontSize: 11, fontWeight: '500', marginTop: 2 },

    // Streak Card
    streakCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 22, overflow: 'hidden' },
    streakGradBg: { ...StyleSheet.absoluteFillObject, borderRadius: 22 },
    streakContent: { flexDirection: 'row', alignItems: 'center', padding: 18 },
    streakFireBox: { width: 58, height: 58, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.12)', justifyContent: 'center', alignItems: 'center' },
    streakMainText: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
    streakMetaRow: { flexDirection: 'row', gap: 8 },
    streakMiniTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
    streakMiniText: { fontSize: 10, fontWeight: '700' },

    // Section
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 14, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
    taskCountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },

    // Performance
    perfRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10 },
    perfCard: { flex: 1, borderRadius: 20, overflow: 'hidden' },
    perfCardGrad: { padding: 16, alignItems: 'center', gap: 6 },
    perfIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    perfValue: { fontSize: 22, fontWeight: '900' },
    perfLabel: { fontSize: 11, fontWeight: '600' },

    // Daily Tasks
    taskCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, padding: 15, borderRadius: 18, gap: 12 },
    taskCheckbox: { width: 28, height: 28, borderRadius: 10, borderWidth: 2.5, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
    taskCheckboxDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
    taskCheckboxInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
    taskTitle: { fontSize: 14, fontWeight: '700' },
    taskDoneText: { textDecorationLine: 'line-through', opacity: 0.45 },
    xpRewardTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },

    // Leaderboard
    leaderboardCard: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden' },
    leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F620' },
    leaderAvatar: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    leaderName: { fontSize: 14, fontWeight: '700' },
    leaderBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    leaderBadgeText: { fontSize: 11, fontWeight: '800' },

    // Category Tabs
    categoryScroll: { marginBottom: 14 },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'transparent',
        gap: 6,
    },
    categoryTabText: { fontSize: 12, fontWeight: '700' },

    // Badges
    emptyBadgeBox: { marginHorizontal: 20, padding: 28, borderRadius: 22, alignItems: 'center', gap: 10 },
    emptyBadgeIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F3F4F620', justifyContent: 'center', alignItems: 'center' },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, gap: 10 },
    badgeCard: { width: (width - 60) / 3, paddingVertical: 16, paddingHorizontal: 8, borderRadius: 20, alignItems: 'center', gap: 6 },
    badgeIconGrad: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    badgeName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

    // Bottom Bar
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', height: Platform.OS === 'ios' ? 85 : 70, paddingBottom: Platform.OS === 'ios' ? 20 : 0, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, justifyContent: 'space-around', alignItems: 'center' },
    tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%', gap: 3 },
    activeIndicator: { width: 20, height: 3, borderRadius: 2, marginBottom: 4 },
    tabText: { fontSize: 11 },
});
