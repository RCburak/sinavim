import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    Platform,
    RefreshControl,
    ActivityIndicator,
    Animated as RNAnimated,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_HEADERS } from '../src/config/api';
import { auth } from '../src/services/firebaseConfig';
import { Theme } from '../src/types';

const { width } = Dimensions.get('window');

// --- BOTTOM TAB BAR (3 tab) ---
const BottomTabBar = ({
    setView,
    theme,
    currentView,
}: {
    setView: (view: string) => void;
    theme: Theme;
    currentView: string;
}) => {
    const tabs = [
        { key: 'dashboard', label: 'Anasayfa', icon: 'home', iconOutline: 'home-outline' },
        { key: 'announcements', label: 'Duyurular', icon: 'notifications', iconOutline: 'notifications-outline' },
        { key: 'profile', label: 'Profilim', icon: 'person', iconOutline: 'person-outline' },
    ];

    return (
        <View style={[styles.bottomBar, { backgroundColor: theme.surface }]}>
            {tabs.map((tab) => {
                const isActive = currentView === tab.key;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.tabItem}
                        onPress={() => setView(tab.key)}
                        activeOpacity={0.8}
                    >
                        <View
                            style={[
                                styles.activeIndicator,
                                isActive && { backgroundColor: theme.primary },
                            ]}
                        />
                        <Ionicons
                            name={isActive ? tab.icon as any : tab.iconOutline as any}
                            size={22}
                            color={isActive ? theme.primary : theme.textSecondary}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                {
                                    color: isActive ? theme.primary : theme.textSecondary,
                                    fontWeight: isActive ? '700' : '500',
                                },
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// --- TAB SELECTOR ---
const TabSelector = ({
    activeTab,
    onTabChange,
    theme,
    announcementCount,
    archiveCount,
}: {
    activeTab: 'active' | 'archive';
    onTabChange: (tab: 'active' | 'archive') => void;
    theme: Theme;
    announcementCount: number;
    archiveCount: number;
}) => {
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    return (
        <View style={[styles.tabSelectorContainer, { backgroundColor: isDark ? '#1E1E36' : '#F0EAFF' }]}>
            <TouchableOpacity
                style={[
                    styles.tabSelectorBtn,
                    activeTab === 'active' && {
                        backgroundColor: theme.primary,
                    },
                ]}
                onPress={() => onTabChange('active')}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="megaphone"
                    size={16}
                    color={activeTab === 'active' ? '#fff' : theme.textSecondary}
                />
                <Text
                    style={[
                        styles.tabSelectorText,
                        {
                            color: activeTab === 'active' ? '#fff' : theme.textSecondary,
                            fontWeight: activeTab === 'active' ? '700' : '500',
                        },
                    ]}
                >
                    Duyurular
                </Text>
                {announcementCount > 0 && (
                    <View
                        style={[
                            styles.tabBadge,
                            {
                                backgroundColor: activeTab === 'active' ? 'rgba(255,255,255,0.25)' : theme.primary,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.tabBadgeText,
                                { color: activeTab === 'active' ? '#fff' : '#fff' },
                            ]}
                        >
                            {announcementCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.tabSelectorBtn,
                    activeTab === 'archive' && {
                        backgroundColor: theme.primary,
                    },
                ]}
                onPress={() => onTabChange('archive')}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="archive"
                    size={16}
                    color={activeTab === 'archive' ? '#fff' : theme.textSecondary}
                />
                <Text
                    style={[
                        styles.tabSelectorText,
                        {
                            color: activeTab === 'archive' ? '#fff' : theme.textSecondary,
                            fontWeight: activeTab === 'archive' ? '700' : '500',
                        },
                    ]}
                >
                    Arşiv
                </Text>
                {archiveCount > 0 && (
                    <View
                        style={[
                            styles.tabBadge,
                            {
                                backgroundColor: activeTab === 'archive' ? 'rgba(255,255,255,0.25)' : '#9CA3AF',
                            },
                        ]}
                    >
                        <Text style={styles.tabBadgeText}>{archiveCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

// --- ANNOUNCEMENT CARD ---
const AnnouncementCard = ({
    item,
    theme,
    onArchive,
    onDelete,
    isArchived,
    index,
}: {
    item: any;
    theme: Theme;
    onArchive?: () => void;
    onDelete?: () => void;
    isArchived: boolean;
    index: number;
}) => {
    const swipeableRef = useRef<Swipeable>(null);
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    const renderRightActions = (
        progress: RNAnimated.AnimatedInterpolation<number>,
        dragX: RNAnimated.AnimatedInterpolation<number>
    ) => {
        const translateX = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [0, 100],
            extrapolate: 'clamp',
        });

        const opacity = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        });

        if (isArchived) {
            return (
                <RNAnimated.View style={[styles.swipeAction, { transform: [{ translateX }], opacity }]}>
                    <TouchableOpacity
                        style={[styles.swipeBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => {
                            swipeableRef.current?.close();
                            onDelete?.();
                        }}
                    >
                        <Ionicons name="trash" size={22} color="#fff" />
                        <Text style={styles.swipeBtnText}>Sil</Text>
                    </TouchableOpacity>
                </RNAnimated.View>
            );
        }

        return (
            <RNAnimated.View style={[styles.swipeAction, { transform: [{ translateX }], opacity }]}>
                <TouchableOpacity
                    style={[styles.swipeBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={() => {
                        swipeableRef.current?.close();
                        onArchive?.();
                    }}
                >
                    <Ionicons name="archive" size={22} color="#fff" />
                    <Text style={styles.swipeBtnText}>Arşivle</Text>
                </TouchableOpacity>
            </RNAnimated.View>
        );
    };

    const formattedDate = item.created_at
        ? new Date(item.created_at).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        : '';

    const accentColors = ['#6C3CE1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
    const accent = accentColors[index % accentColors.length];

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            overshootRight={false}
            friction={2}
        >
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: theme.surface,
                        borderLeftColor: accent,
                    },
                    theme.cardShadow,
                ]}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.cardIconCircle, { backgroundColor: accent + '18' }]}>
                        <Ionicons name="megaphone" size={18} color={accent} />
                    </View>
                    <View style={styles.cardHeaderText}>
                        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                            {item.title || 'Duyuru'}
                        </Text>
                        {formattedDate ? (
                            <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
                                {formattedDate}
                            </Text>
                        ) : null}
                    </View>
                    {isArchived && (
                        <View style={[styles.archivedBadge, { backgroundColor: '#9CA3AF20' }]}>
                            <Ionicons name="archive-outline" size={12} color="#9CA3AF" />
                        </View>
                    )}
                </View>
                <Text style={[styles.cardContent, { color: theme.textSecondary }]} numberOfLines={3}>
                    {item.content || ''}
                </Text>
                <View style={styles.cardFooter}>
                    <Text style={[styles.swipeHint, { color: theme.textSecondary + '80' }]}>
                        ← {isArchived ? 'Silmek için kaydır' : 'Arşivlemek için kaydır'}
                    </Text>
                </View>
            </View>
        </Swipeable>
    );
};

// --- EMPTY STATE ---
const EmptyState = ({
    theme,
    isArchive,
}: {
    theme: Theme;
    isArchive: boolean;
}) => {
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    return (
        <View style={styles.emptyContainer}>
            <View
                style={[
                    styles.emptyIconCircle,
                    { backgroundColor: isDark ? '#1E1E36' : '#F0EAFF' },
                ]}
            >
                <Ionicons
                    name={isArchive ? 'archive-outline' : 'notifications-off-outline'}
                    size={48}
                    color={theme.primary + '60'}
                />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {isArchive ? 'Arşiv Boş' : 'Duyuru Yok'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {isArchive
                    ? 'Arşivlediğin duyurular burada görünecek.'
                    : 'Kurumundan yeni duyurular geldiğinde\nburada göreceksin.'}
            </Text>
        </View>
    );
};

// --- MAIN VIEW ---
interface AnnouncementsViewProps {
    theme: Theme;
    setView: (view: string) => void;
    institution: any;
}

export const AnnouncementsView = ({ theme, setView, institution }: AnnouncementsViewProps) => {
    const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [archivedIds, setArchivedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';
    const userId = auth.currentUser?.uid;

    // Load archived IDs from AsyncStorage
    const loadArchivedIds = useCallback(async () => {
        if (!userId) return;
        try {
            const raw = await AsyncStorage.getItem(`archived_announcements_${userId}`);
            if (raw) setArchivedIds(JSON.parse(raw));
        } catch (e) {
            console.error('Arşiv yükleme hatası:', e);
        }
    }, [userId]);

    // Save archived IDs to AsyncStorage
    const saveArchivedIds = async (ids: string[]) => {
        if (!userId) return;
        try {
            await AsyncStorage.setItem(`archived_announcements_${userId}`, JSON.stringify(ids));
        } catch (e) {
            console.error('Arşiv kaydetme hatası:', e);
        }
    };

    // Fetch announcements from API
    const fetchAnnouncements = useCallback(async () => {
        if (!institution?.id) {
            setAnnouncements([]);
            setLoading(false);
            return;
        }
        try {
            const resp = await fetch(`${API_URL}/announcements/${institution.id}`, {
                headers: API_HEADERS as HeadersInit,
            });
            const data = await resp.json();
            if (Array.isArray(data)) {
                // Sort by created_at descending
                const sorted = data.sort((a: any, b: any) => {
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return dateB - dateA;
                });
                setAnnouncements(sorted);
            }
        } catch (e) {
            console.error('Duyurular alınamadı:', e);
        } finally {
            setLoading(false);
        }
    }, [institution?.id]);

    useEffect(() => {
        loadArchivedIds();
        fetchAnnouncements();
    }, [loadArchivedIds, fetchAnnouncements]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAnnouncements();
        setRefreshing(false);
    }, [fetchAnnouncements]);

    // Archive an announcement
    const handleArchive = (id: string) => {
        const newIds = [...archivedIds, id];
        setArchivedIds(newIds);
        saveArchivedIds(newIds);
    };

    // Delete from archive
    const handleDeleteFromArchive = (id: string) => {
        const newIds = archivedIds.filter((aid) => aid !== id);
        setArchivedIds(newIds);
        saveArchivedIds(newIds);
    };

    // Filter announcements based on tab
    const activeAnnouncements = announcements.filter((a) => !archivedIds.includes(a.id));
    const archivedAnnouncements = announcements.filter((a) => archivedIds.includes(a.id));
    const currentList = activeTab === 'active' ? activeAnnouncements : archivedAnnouncements;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <LinearGradient
                colors={isDark ? ['#1A1A2E', '#16213E'] : ['#6C3CE1', '#4A1DB5']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <Ionicons name="notifications" size={24} color="#fff" />
                        <Text style={styles.headerTitle}>Duyurular</Text>
                    </View>
                    <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* TAB SELECTOR */}
            <View style={styles.tabArea}>
                <TabSelector
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    theme={theme}
                    announcementCount={activeAnnouncements.length}
                    archiveCount={archivedAnnouncements.length}
                />
            </View>

            {/* CONTENT */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                        Duyurular yükleniyor...
                    </Text>
                </View>
            ) : !institution ? (
                <View style={styles.emptyContainer}>
                    <View
                        style={[
                            styles.emptyIconCircle,
                            { backgroundColor: isDark ? '#1E1E36' : '#F0EAFF' },
                        ]}
                    >
                        <Ionicons name="school-outline" size={48} color={theme.primary + '60'} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                        Kuruma Bağlı Değilsin
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                        Duyuruları görmek için bir kuruma bağlanman gerekiyor.
                    </Text>
                    <TouchableOpacity
                        style={[styles.connectBtn, { backgroundColor: theme.primary }]}
                        onPress={() => setView('profile')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#fff" />
                        <Text style={styles.connectBtnText}>Kuruma Bağlan</Text>
                    </TouchableOpacity>
                </View>
            ) : currentList.length === 0 ? (
                <EmptyState theme={theme} isArchive={activeTab === 'archive'} />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.listContent}
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
                    {currentList.map((item, index) => (
                        <AnnouncementCard
                            key={item.id || index}
                            item={item}
                            theme={theme}
                            index={index}
                            isArchived={activeTab === 'archive'}
                            onArchive={() => handleArchive(item.id)}
                            onDelete={() => handleDeleteFromArchive(item.id)}
                        />
                    ))}
                    <View style={{ height: 90 }} />
                </ScrollView>
            )}

            {/* BOTTOM TAB BAR */}
            <BottomTabBar setView={setView} theme={theme} currentView="announcements" />
        </View>
    );
};

export default AnnouncementsView;

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 60,
        paddingBottom: 18,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    headerBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Tab Selector
    tabArea: {
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 6,
    },
    tabSelectorContainer: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 4,
    },
    tabSelectorBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 13,
        gap: 6,
    },
    tabSelectorText: {
        fontSize: 14,
    },
    tabBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },

    // Cards
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    card: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderLeftWidth: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    cardDate: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    archivedBadge: {
        width: 28,
        height: 28,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 52,
    },
    cardFooter: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
    swipeHint: {
        fontSize: 11,
        fontWeight: '500',
        fontStyle: 'italic',
    },

    // Swipe Actions
    swipeAction: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 14,
    },
    swipeBtn: {
        width: 80,
        height: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        gap: 4,
    },
    swipeBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 20,
    },
    connectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        marginTop: 20,
        gap: 8,
    },
    connectBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },

    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        height: Platform.OS === 'ios' ? 85 : 70,
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        borderTopWidth: 0,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        gap: 3,
    },
    activeIndicator: {
        width: 20,
        height: 3,
        borderRadius: 2,
        marginBottom: 4,
    },
    tabText: {
        fontSize: 11,
    },
});
