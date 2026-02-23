import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    StatusBar, Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { API_URL, API_HEADERS } from '../config/api';
import { Theme, AppView } from '../types';

const { width } = Dimensions.get('window');

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
        completeTask, totalBadges,
    } = gamification;

    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
    const unlockedBadges = badges.filter((b: any) => b.unlocked);
    const lockedBadges = badges.filter((b: any) => !b.unlocked);
    const completedTasks = dailyTasks.filter((t: any) => t.completed).length;

    // ─── Study Performance Stats ────────────────────
    const [perfStats, setPerfStats] = useState({ total_hours: 0, total_tasks: 0 });
    const [perfLoading, setPerfLoading] = useState(true);

    useEffect(() => {
        const fetchPerf = async () => {
            const user = auth.currentUser;
            if (!user) { setPerfLoading(false); return; }
            try {
                const res = await fetch(`${API_URL}/user-stats/${user.uid}`, { headers: API_HEADERS as HeadersInit });
                const data = await res.json();
                setPerfStats({ total_hours: data.total_hours || 0, total_tasks: data.total_tasks || 0 });
            } catch { /* silently fail */ }
            finally { setPerfLoading(false); }
        };
        fetchPerf();
    }, []);

    const progressPercent = Math.min(xpProgress * 100, 100);
    const xpInLevel = xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    return (
        <View style={[s.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* ═══ PREMIUM HERO HEADER ═══ */}
            <LinearGradient
                colors={isDark ? ['#1E0A3C', '#2D1B69', '#4C1D95'] : ['#5B21B6', '#7C3AED', '#A78BFA']}
                style={s.heroHeader}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                {/* Decorative circles */}
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

                    {/* Level Info */}
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
                        <Text style={s.xpProgressText}>
                            {xpInLevel} / {xpNeeded} XP
                        </Text>
                    </View>

                    {/* Quick Stats Row */}
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

                {/* ═══ STREAK CARD ═══ */}
                {streak && (
                    <View style={[s.streakCard, { backgroundColor: isDark ? '#1A1623' : '#FFFBEB' }]}>
                        <LinearGradient
                            colors={['#F59E0B20', '#EF444410']}
                            style={s.streakGradBg}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
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

                {/* ═══ ÇALIŞMA PERFORMANSI ═══ */}
                <View style={s.sectionHeader}>
                    <Ionicons name="stats-chart" size={18} color={theme.primary} />
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Çalışma Performansım</Text>
                </View>
                <View style={s.perfRow}>
                    <View style={[s.perfCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                        <LinearGradient colors={['#7C3AED15', '#7C3AED05']} style={s.perfCardGrad}>
                            <View style={[s.perfIconBox, { backgroundColor: '#7C3AED18' }]}>
                                <Ionicons name="time" size={22} color="#7C3AED" />
                            </View>
                            {perfLoading ? (
                                <ActivityIndicator size="small" color="#7C3AED" style={{ marginVertical: 8 }} />
                            ) : (
                                <Text style={[s.perfValue, { color: theme.text }]}>{perfStats.total_hours}s</Text>
                            )}
                            <Text style={[s.perfLabel, { color: theme.textSecondary }]}>Toplam Süre</Text>
                        </LinearGradient>
                    </View>
                    <View style={[s.perfCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                        <LinearGradient colors={['#10B98115', '#10B98105']} style={s.perfCardGrad}>
                            <View style={[s.perfIconBox, { backgroundColor: '#10B98118' }]}>
                                <Ionicons name="checkmark-done-circle" size={22} color="#10B981" />
                            </View>
                            {perfLoading ? (
                                <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 8 }} />
                            ) : (
                                <Text style={[s.perfValue, { color: theme.text }]}>{perfStats.total_tasks}</Text>
                            )}
                            <Text style={[s.perfLabel, { color: theme.textSecondary }]}>Biten Görev</Text>
                        </LinearGradient>
                    </View>
                    <View style={[s.perfCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                        <LinearGradient colors={['#F59E0B15', '#F59E0B05']} style={s.perfCardGrad}>
                            <View style={[s.perfIconBox, { backgroundColor: '#F59E0B18' }]}>
                                <Ionicons name="trophy" size={22} color="#F59E0B" />
                            </View>
                            <Text style={[s.perfValue, { color: theme.text }]}>{level}</Text>
                            <Text style={[s.perfLabel, { color: theme.textSecondary }]}>Seviye</Text>
                        </LinearGradient>
                    </View>
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

                {/* ═══ ROZETLER - KAZANILAN ═══ */}
                <View style={s.sectionHeader}>
                    <Ionicons name="ribbon" size={18} color="#EC4899" />
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Kazanılan Rozetler</Text>
                    <View style={[s.taskCountBadge, { backgroundColor: '#EC489920' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#EC4899' }}>{unlockedBadges.length}</Text>
                    </View>
                </View>
                {unlockedBadges.length === 0 ? (
                    <View style={[s.emptyBadgeBox, { backgroundColor: theme.surface }, theme.cardShadow]}>
                        <View style={s.emptyBadgeIcon}>
                            <Ionicons name="lock-open-outline" size={28} color={theme.textSecondary + '60'} />
                        </View>
                        <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '500' }}>Rozet kazanmak için görevleri tamamla!</Text>
                    </View>
                ) : (
                    <View style={s.badgeGrid}>
                        {unlockedBadges.map((badge: any) => (
                            <View key={badge.id} style={[s.badgeCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
                                <LinearGradient
                                    colors={[badge.color + '20', badge.color + '08']}
                                    style={s.badgeIconGrad}
                                >
                                    <Text style={{ fontSize: 26 }}>{badge.icon}</Text>
                                </LinearGradient>
                                <Text style={[s.badgeName, { color: theme.text }]} numberOfLines={1}>{badge.name}</Text>
                                <Text style={{ fontSize: 9, color: theme.textSecondary, textAlign: 'center' }} numberOfLines={2}>{badge.description}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ═══ ROZETLER - KİLİTLİ ═══ */}
                {lockedBadges.length > 0 && (
                    <>
                        <View style={s.sectionHeader}>
                            <Ionicons name="lock-closed" size={16} color={theme.textSecondary} />
                            <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>Kilitli Rozetler</Text>
                            <View style={[s.taskCountBadge, { backgroundColor: theme.border + '20' }]}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textSecondary }}>{lockedBadges.length}</Text>
                            </View>
                        </View>
                        <View style={s.badgeGrid}>
                            {lockedBadges.map((badge: any) => (
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
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: '#fff',
    },
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

    // Streak
    streakCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 22, overflow: 'hidden' },
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
