import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, StatusBar, TouchableOpacity, Dimensions,
    Platform, RefreshControl, ActivityIndicator, Animated as RNAnimated,
    Modal, Pressable,
} from 'react-native';
import { ScrollView, Swipeable, TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_HEADERS } from '../src/config/api';
import { auth } from '../src/services/firebaseConfig';
import { Theme } from '../src/types';

const { width } = Dimensions.get('window');

// ─── BOTTOM TAB BAR ────────────────────────────────
const BottomTabBar = ({ setView, theme }: { setView: (view: string) => void; theme: Theme }) => {
    const tabs = [
        { key: 'dashboard', label: 'Anasayfa', icon: 'home', iconOutline: 'home-outline' },
        { key: 'announcements', label: 'Duyurular', icon: 'notifications', iconOutline: 'notifications-outline' },
        { key: 'gamification', label: 'Başarılarım', icon: 'trophy', iconOutline: 'trophy-outline' },
        { key: 'profile', label: 'Profilim', icon: 'person', iconOutline: 'person-outline' },
    ];
    return (
        <View style={[s.bottomBar, { backgroundColor: theme.surface }]}>
            {tabs.map((tab) => {
                const isActive = tab.key === 'announcements';
                return (
                    <TouchableOpacity key={tab.key} style={s.tabItem} onPress={() => setView(tab.key)} activeOpacity={0.8}>
                        <View style={[s.activeIndicator, isActive && { backgroundColor: theme.primary }]} />
                        <Ionicons name={(isActive ? tab.icon : tab.iconOutline) as any} size={22} color={isActive ? theme.primary : theme.textSecondary} />
                        <Text style={[s.tabText, { color: isActive ? theme.primary : theme.textSecondary, fontWeight: isActive ? '700' : '500' }]}>{tab.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// ─── PREMIUM TAB SELECTOR ──────────────────────────
const TabSelector = ({ activeTab, onTabChange, theme, announcementCount, archiveCount }: {
    activeTab: 'active' | 'archive';
    onTabChange: (tab: 'active' | 'archive') => void;
    theme: Theme;
    announcementCount: number;
    archiveCount: number;
}) => {
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
    return (
        <View style={[s.tabSelector, { backgroundColor: isDark ? '#1A1630' : '#F0EAFF' }]}>
            {(['active', 'archive'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const count = tab === 'active' ? announcementCount : archiveCount;
                const icon = tab === 'active' ? 'megaphone' : 'archive';
                const label = tab === 'active' ? 'Duyurular' : 'Arşiv';
                return (
                    <TouchableOpacity
                        key={tab}
                        style={[s.tabBtn, isActive && { backgroundColor: theme.primary }]}
                        onPress={() => onTabChange(tab)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name={icon} size={15} color={isActive ? '#fff' : theme.textSecondary} />
                        <Text style={[s.tabBtnText, { color: isActive ? '#fff' : theme.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                            {label}
                        </Text>
                        {count > 0 && (
                            <View style={[s.tabBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : (tab === 'active' ? theme.primary : '#9CA3AF') }]}>
                                <Text style={s.tabBadgeText}>{count}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// ─── PREMIUM ANNOUNCEMENT CARD ─────────────────────
const AnnouncementCard = ({ item, theme, onArchive, onDelete, isArchived, index, onPress }: {
    item: any; theme: Theme; onArchive?: () => void; onDelete?: () => void; isArchived: boolean; index: number; onPress?: () => void;
}) => {
    const swipeableRef = useRef<Swipeable>(null);
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    const accentColors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
    const accent = accentColors[index % accentColors.length];

    const formattedDate = item.created_at
        ? new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';

    const timeAgo = item.created_at ? getTimeAgo(new Date(item.created_at)) : '';

    const renderRightActions = (
        progress: RNAnimated.AnimatedInterpolation<number>,
        dragX: RNAnimated.AnimatedInterpolation<number>
    ) => {
        const translateX = dragX.interpolate({ inputRange: [-160, 0], outputRange: [0, 160], extrapolate: 'clamp' });
        const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

        return (
            <RNAnimated.View style={[s.swipeActionRow, { transform: [{ translateX }], opacity }]}>
                {/* Archive button (only for active) */}
                {!isArchived && (
                    <TouchableOpacity
                        style={[s.swipeBtn, { backgroundColor: '#F59E0B' }]}
                        onPress={() => { swipeableRef.current?.close(); onArchive?.(); }}
                    >
                        <LinearGradient colors={['#F59E0B', '#D97706']} style={s.swipeBtnGrad}>
                            <Ionicons name="archive" size={20} color="#fff" />
                            <Text style={s.swipeBtnText}>Arşivle</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
                {/* Delete button (always) */}
                <TouchableOpacity
                    style={[s.swipeBtn, { backgroundColor: '#EF4444' }]}
                    onPress={() => { swipeableRef.current?.close(); onDelete?.(); }}
                >
                    <LinearGradient colors={['#EF4444', '#DC2626']} style={s.swipeBtnGrad}>
                        <Ionicons name="trash" size={20} color="#fff" />
                        <Text style={s.swipeBtnText}>Sil</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </RNAnimated.View>
        );
    };

    return (
        <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
            <GHTouchableOpacity activeOpacity={0.85} onPress={onPress}>
                <View style={[s.card, { backgroundColor: theme.surface }, theme.cardShadow]}>
                    {/* Accent gradient top bar */}
                    <LinearGradient
                        colors={[accent, accent + '60']}
                        style={s.cardAccentBar}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                    <View style={s.cardInner}>
                        {/* Header */}
                        <View style={s.cardHeader}>
                            <View style={[s.cardIconCircle, { backgroundColor: accent + '12' }]}>
                                <Ionicons name="megaphone" size={18} color={accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[s.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.title || 'Duyuru'}</Text>
                                <View style={s.cardMetaRow}>
                                    {formattedDate ? (
                                        <View style={s.cardMetaTag}>
                                            <Ionicons name="calendar-outline" size={10} color={theme.textSecondary} />
                                            <Text style={[s.cardMetaText, { color: theme.textSecondary }]}>{formattedDate}</Text>
                                        </View>
                                    ) : null}
                                    {timeAgo ? (
                                        <View style={[s.cardMetaTag, { backgroundColor: accent + '10' }]}>
                                            <Ionicons name="time-outline" size={10} color={accent} />
                                            <Text style={[s.cardMetaText, { color: accent }]}>{timeAgo}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                            {isArchived && (
                                <View style={[s.archivedBadge, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                                    <Ionicons name="archive" size={12} color="#9CA3AF" />
                                </View>
                            )}
                        </View>

                        {/* Content */}
                        <Text style={[s.cardContent, { color: theme.textSecondary }]} numberOfLines={3}>
                            {item.content || ''}
                        </Text>

                        {/* Footer */}
                        <View style={s.cardFooter}>
                            <View style={[s.readMoreTag, { backgroundColor: isDark ? '#7C3AED15' : '#F0EAFF' }]}>
                                <Text style={[s.readMoreText, { color: theme.primary }]}>Devamını oku</Text>
                                <Ionicons name="chevron-forward" size={12} color={theme.primary} />
                            </View>
                        </View>
                    </View>
                </View>
            </GHTouchableOpacity>
        </Swipeable>
    );
};

// ─── DETAIL MODAL ──────────────────────────────────
const AnnouncementDetailModal = ({ item, theme, visible, onClose }: {
    item: any; theme: Theme; visible: boolean; onClose: () => void;
}) => {
    if (!item) return null;
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
    const accentColors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
    const accent = accentColors[0];

    const formattedDate = item.created_at
        ? new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={s.modalOverlay} onPress={onClose}>
                <Pressable style={[s.modalCard, { backgroundColor: theme.surface }]} onPress={() => { }}>
                    {/* Accent bar */}
                    <LinearGradient
                        colors={[accent, '#EC4899', '#F59E0B']}
                        style={s.modalAccentBar}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />

                    {/* Close button */}
                    <TouchableOpacity style={[s.modalCloseBtn, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]} onPress={onClose}>
                        <Ionicons name="close" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={s.modalHeader}>
                        <View style={[s.modalIconCircle, { backgroundColor: accent + '12' }]}>
                            <Ionicons name="megaphone" size={24} color={accent} />
                        </View>
                        <Text style={[s.modalTitle, { color: theme.text }]}>{item.title || 'Duyuru'}</Text>
                        {formattedDate ? (
                            <View style={s.modalDateRow}>
                                <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                                <Text style={[s.modalDateText, { color: theme.textSecondary }]}>{formattedDate}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Divider */}
                    <View style={[s.modalDivider, { backgroundColor: theme.border + '30' }]} />

                    {/* Scrollable content */}
                    <ScrollView style={s.modalContentScroll} showsVerticalScrollIndicator={false}>
                        <Text style={[s.modalContentText, { color: theme.text }]}>
                            {item.content || 'İçerik bulunamadı.'}
                        </Text>
                    </ScrollView>

                    {/* Bottom action */}
                    <TouchableOpacity style={[s.modalDoneBtn, { backgroundColor: theme.primary }]} onPress={onClose} activeOpacity={0.8}>
                        <Text style={s.modalDoneBtnText}>Tamam</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

// ─── PREMIUM EMPTY STATE ───────────────────────────
const EmptyState = ({ theme, isArchive }: { theme: Theme; isArchive: boolean }) => {
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
    return (
        <View style={s.emptyContainer}>
            <View style={[s.emptyIconOuter, { backgroundColor: isDark ? '#1E1E36' : '#F0EAFF' }]}>
                <LinearGradient
                    colors={[theme.primary + '20', theme.primary + '08']}
                    style={s.emptyIconGrad}
                >
                    <Ionicons
                        name={isArchive ? 'archive-outline' : 'notifications-off-outline'}
                        size={44}
                        color={theme.primary + '70'}
                    />
                </LinearGradient>
            </View>
            <Text style={[s.emptyTitle, { color: theme.text }]}>
                {isArchive ? 'Arşiv Boş' : 'Henüz Duyuru Yok'}
            </Text>
            <Text style={[s.emptySubtitle, { color: theme.textSecondary }]}>
                {isArchive
                    ? 'Arşivlediğin duyurular burada\ngörünecek.'
                    : 'Kurumundan yeni duyurular\ngeldiğinde burada göreceksin.'}
            </Text>
        </View>
    );
};

// ─── NOT CONNECTED STATE ───────────────────────────
const NotConnectedState = ({ theme, setView }: { theme: Theme; setView: (view: string) => void }) => {
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
    return (
        <View style={s.emptyContainer}>
            <View style={[s.emptyIconOuter, { backgroundColor: isDark ? '#1E1E36' : '#F0EAFF' }]}>
                <LinearGradient
                    colors={['#F59E0B18', '#F59E0B08']}
                    style={s.emptyIconGrad}
                >
                    <Ionicons name="school-outline" size={44} color="#F59E0B90" />
                </LinearGradient>
            </View>
            <Text style={[s.emptyTitle, { color: theme.text }]}>Kuruma Bağlı Değilsin</Text>
            <Text style={[s.emptySubtitle, { color: theme.textSecondary }]}>
                Duyuruları görmek için bir{'\n'}kuruma bağlanman gerekiyor.
            </Text>
            <TouchableOpacity
                style={s.connectBtn}
                onPress={() => setView('profile')}
                activeOpacity={0.8}
            >
                <LinearGradient colors={[theme.primary, '#4C1D95']} style={s.connectBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={s.connectBtnText}>Kuruma Bağlan</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

// ─── HELPER: Time ago ──────────────────────────────
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} sa`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} gün`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} hafta`;
    return `${Math.floor(diffDays / 30)} ay`;
}

// ═══ MAIN VIEW ═════════════════════════════════════
interface AnnouncementsViewProps {
    theme: Theme;
    setView: (view: string) => void;
    institution: any;
}

export const AnnouncementsView = ({ theme, setView, institution }: AnnouncementsViewProps) => {
    const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [archivedIds, setArchivedIds] = useState<string[]>([]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
    const userId = auth.currentUser?.uid;

    // Load archived + deleted IDs
    const loadSavedIds = useCallback(async () => {
        if (!userId) return;
        try {
            const [archRaw, delRaw] = await Promise.all([
                AsyncStorage.getItem(`archived_announcements_${userId}`),
                AsyncStorage.getItem(`deleted_announcements_${userId}`),
            ]);
            if (archRaw) setArchivedIds(JSON.parse(archRaw));
            if (delRaw) setDeletedIds(JSON.parse(delRaw));
        } catch { /* silent */ }
    }, [userId]);

    const saveArchivedIds = async (ids: string[]) => {
        if (!userId) return;
        await AsyncStorage.setItem(`archived_announcements_${userId}`, JSON.stringify(ids)).catch(() => { });
    };

    const saveDeletedIds = async (ids: string[]) => {
        if (!userId) return;
        await AsyncStorage.setItem(`deleted_announcements_${userId}`, JSON.stringify(ids)).catch(() => { });
    };

    // Fetch announcements
    const fetchAnnouncements = useCallback(async () => {
        if (!institution?.id) { setAnnouncements([]); setLoading(false); return; }
        try {
            const resp = await fetch(`${API_URL}/announcements/${institution.id}`, { headers: API_HEADERS as HeadersInit });
            const data = await resp.json();
            if (Array.isArray(data)) {
                const sorted = data.sort((a: any, b: any) => {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return dateB - dateA;
                });
                setAnnouncements(sorted);
            }
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [institution?.id]);

    useEffect(() => { loadSavedIds(); fetchAnnouncements(); }, [loadSavedIds, fetchAnnouncements]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAnnouncements();
        setRefreshing(false);
    }, [fetchAnnouncements]);

    const handleArchive = (id: string) => { const n = [...archivedIds, id]; setArchivedIds(n); saveArchivedIds(n); };
    const handleDelete = (id: string) => {
        // Remove from archived if present, and add to deleted
        const newArch = archivedIds.filter((a) => a !== id);
        setArchivedIds(newArch); saveArchivedIds(newArch);
        const newDel = [...deletedIds, id];
        setDeletedIds(newDel); saveDeletedIds(newDel);
    };

    const visibleAnnouncements = announcements.filter((a) => !deletedIds.includes(a.id));
    const activeAnnouncements = visibleAnnouncements.filter((a) => !archivedIds.includes(a.id));
    const archivedAnnouncements = visibleAnnouncements.filter((a) => archivedIds.includes(a.id));
    const currentList = activeTab === 'active' ? activeAnnouncements : archivedAnnouncements;

    return (
        <View style={[s.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* ═══ PREMIUM HERO HEADER ═══ */}
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#6C3CE1', '#5B21B6', '#4C1D95']}
                style={s.heroHeader}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                {/* Decorative circles */}
                <View style={[s.decorCircle, { top: -25, right: -20, width: 120, height: 120, opacity: 0.06 }]} />
                <View style={[s.decorCircle, { bottom: 5, left: -30, width: 80, height: 80, opacity: 0.08 }]} />

                <View style={s.heroTopRow}>
                    <View style={s.heroTitleRow}>
                        <View style={s.heroIconBg}>
                            <Ionicons name="notifications" size={20} color="#fff" />
                        </View>
                        <Text style={s.heroTitle}>Duyurular</Text>
                    </View>
                    <TouchableOpacity onPress={onRefresh} style={s.heroRefreshBtn}>
                        <Ionicons name="refresh" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Stats Summary */}
                {institution && (
                    <View style={s.heroStatsRow}>
                        <View style={s.heroStatItem}>
                            <Text style={s.heroStatValue}>{activeAnnouncements.length}</Text>
                            <Text style={s.heroStatLabel}>Aktif</Text>
                        </View>
                        <View style={s.heroStatDivider} />
                        <View style={s.heroStatItem}>
                            <Text style={s.heroStatValue}>{archivedAnnouncements.length}</Text>
                            <Text style={s.heroStatLabel}>Arşiv</Text>
                        </View>
                        <View style={s.heroStatDivider} />
                        <View style={s.heroStatItem}>
                            <Text style={s.heroStatValue}>{announcements.length}</Text>
                            <Text style={s.heroStatLabel}>Toplam</Text>
                        </View>
                    </View>
                )}
            </LinearGradient>

            {/* ═══ TAB SELECTOR ═══ */}
            <View style={s.tabArea}>
                <TabSelector
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    theme={theme}
                    announcementCount={activeAnnouncements.length}
                    archiveCount={archivedAnnouncements.length}
                />
            </View>

            {/* ═══ CONTENT ═══ */}
            {loading ? (
                <View style={s.loadingContainer}>
                    <View style={[s.loadingSpinnerBg, { backgroundColor: theme.primary + '10' }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                    <Text style={[s.loadingText, { color: theme.textSecondary }]}>Duyurular yükleniyor...</Text>
                </View>
            ) : !institution ? (
                <NotConnectedState theme={theme} setView={setView} />
            ) : currentList.length === 0 ? (
                <EmptyState theme={theme} isArchive={activeTab === 'archive'} />
            ) : (
                <ScrollView
                    contentContainerStyle={s.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
                            colors={[theme.primary]}
                        />
                    }
                >
                    {/* Results count */}
                    <View style={s.resultsRow}>
                        <Text style={[s.resultsText, { color: theme.textSecondary }]}>
                            {currentList.length} {activeTab === 'active' ? 'duyuru' : 'arşiv'}
                        </Text>
                    </View>

                    {currentList.map((item, index) => (
                        <AnnouncementCard
                            key={item.id || index}
                            item={item}
                            theme={theme}
                            index={index}
                            isArchived={activeTab === 'archive'}
                            onArchive={() => handleArchive(item.id)}
                            onDelete={() => handleDelete(item.id)}
                            onPress={() => setSelectedAnnouncement(item)}
                        />
                    ))}
                    <View style={{ height: 90 }} />
                </ScrollView>
            )}

            <BottomTabBar setView={setView} theme={theme} />

            {/* Detail Modal */}
            <AnnouncementDetailModal
                item={selectedAnnouncement}
                theme={theme}
                visible={!!selectedAnnouncement}
                onClose={() => setSelectedAnnouncement(null)}
            />
        </View>
    );
};

export default AnnouncementsView;

// ─── STYLES ────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1 },

    // Hero Header
    heroHeader: {
        paddingTop: Platform.OS === 'android' ? 48 : 58,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
    },
    decorCircle: { position: 'absolute', borderRadius: 999, backgroundColor: '#fff' },
    heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heroIconBg: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
    heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    heroRefreshBtn: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    heroStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20, marginTop: 16 },
    heroStatItem: { flex: 1, alignItems: 'center' },
    heroStatValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
    heroStatLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '600', marginTop: 2 },
    heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)' },

    // Tab Selector
    tabArea: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    tabSelector: { flexDirection: 'row', borderRadius: 16, padding: 4 },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 13, gap: 6 },
    tabBtnText: { fontSize: 14 },
    tabBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
    tabBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    // Results
    resultsRow: { paddingBottom: 8 },
    resultsText: { fontSize: 12, fontWeight: '600' },

    // Cards
    listContent: { paddingHorizontal: 20, paddingTop: 10 },
    card: { borderRadius: 22, marginBottom: 14, overflow: 'hidden' },
    cardAccentBar: { height: 3, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
    cardInner: { padding: 18 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
    cardIconCircle: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, lineHeight: 22 },
    cardMetaRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
    cardMetaTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    cardMetaText: { fontSize: 10, fontWeight: '600' },
    archivedBadge: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cardContent: { fontSize: 14, lineHeight: 21, marginLeft: 54 },
    cardFooter: { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
    readMoreTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    readMoreText: { fontSize: 11, fontWeight: '700' },

    // Swipe Actions
    swipeActionRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'stretch', marginBottom: 14, gap: 6 },
    swipeBtn: { width: 72, borderRadius: 18, overflow: 'hidden' },
    swipeBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 3 },
    swipeBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    // Detail Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { width: '100%', maxHeight: '80%', borderRadius: 28, overflow: 'hidden' },
    modalAccentBar: { height: 4 },
    modalCloseBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    modalHeader: { alignItems: 'center', paddingTop: 28, paddingHorizontal: 24 },
    modalIconCircle: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', lineHeight: 26, marginBottom: 8 },
    modalDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    modalDateText: { fontSize: 12, fontWeight: '500' },
    modalDivider: { height: 1, marginHorizontal: 24, marginVertical: 16 },
    modalContentScroll: { paddingHorizontal: 24, maxHeight: 300 },
    modalContentText: { fontSize: 15, lineHeight: 24, fontWeight: '400' },
    modalDoneBtn: { marginHorizontal: 24, marginTop: 20, marginBottom: 24, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
    modalDoneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Empty / Not Connected
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: 80 },
    emptyIconOuter: { width: 100, height: 100, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyIconGrad: { width: 100, height: 100, borderRadius: 34, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 21 },
    connectBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    connectBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 28, gap: 8 },
    connectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Loading
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingSpinnerBg: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 14, fontWeight: '500' },

    // Bottom Bar
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', height: Platform.OS === 'ios' ? 85 : 70, paddingBottom: Platform.OS === 'ios' ? 20 : 0, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, justifyContent: 'space-around', alignItems: 'center' },
    tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%', gap: 3 },
    activeIndicator: { width: 20, height: 3, borderRadius: 2, marginBottom: 4 },
    tabText: { fontSize: 11 },
});
