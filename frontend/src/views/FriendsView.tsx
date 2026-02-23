import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform, Dimensions, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Theme, AppView } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { API_URL, API_HEADERS } from '../config/api';
import { flashcardService } from '../services/flashcardService';

const { width } = Dimensions.get('window');

const BottomTabBar = ({ setView, theme }: { setView: (view: AppView) => void; theme: Theme }) => {
    const tabs = [
        { key: 'dashboard', label: 'Anasayfa', icon: 'home', iconOutline: 'home-outline' },
        { key: 'announcements', label: 'Duyurular', icon: 'notifications', iconOutline: 'notifications-outline' },
        { key: 'friends', label: 'Arkadaşlar', icon: 'people', iconOutline: 'people-outline' },
        { key: 'gamification', label: 'Başarılarım', icon: 'trophy', iconOutline: 'trophy-outline' },
        { key: 'profile', label: 'Profilim', icon: 'person', iconOutline: 'person-outline' },
    ];

    return (
        <View style={[styles.bottomBar, { backgroundColor: theme.surface }]}>
            {tabs.map((tab) => {
                const isActive = tab.key === 'friends';
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.tabItem}
                        onPress={() => setView(tab.key as AppView)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.activeIndicator, isActive && { backgroundColor: theme.primary }]} />
                        <Ionicons
                            name={(isActive ? tab.icon : tab.iconOutline) as any}
                            size={22}
                            color={isActive ? theme.primary : theme.textSecondary}
                        />
                        <Text style={[styles.tabText, { color: isActive ? theme.primary : theme.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export const FriendsView = ({ theme, setView }: { theme: Theme; setView: (view: AppView) => void }) => {
    const { user } = useAuth();
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchFriends();
            fetchRequests();
        }
    }, [user]);

    const fetchFriends = async () => {
        if (!user) return;
        try {
            const resp = await fetch(`${API_URL}/friends/${user.uid}/list`, { headers: API_HEADERS });
            const data = await resp.json();
            if (resp.ok) setFriends(data.friends || []);
        } catch (e) { console.error(e); }
    };

    const fetchRequests = async () => {
        if (!user) return;
        try {
            const resp = await fetch(`${API_URL}/friends/requests/${user.uid}`, { headers: API_HEADERS });
            const data = await resp.json();
            if (resp.ok) setRequests(data.requests || []);
        } catch (e) { console.error(e); }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || !user) return;
        setLoading(true);
        try {
            const resp = await fetch(`${API_URL}/friends/search`, {
                method: 'POST',
                headers: API_HEADERS,
                body: JSON.stringify({ query: searchQuery.trim(), current_user_id: user.uid })
            });
            const data = await resp.json();
            if (resp.ok) setSearchResults(data.users || []);
            else Alert.alert('Hata', data.detail || 'Arama başarısız oldu.');
        } catch (e) {
            Alert.alert('Hata', 'Arama sırasında bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (receiverId: string) => {
        if (!user) return;
        try {
            const resp = await fetch(`${API_URL}/friends/request`, {
                method: 'POST',
                headers: API_HEADERS,
                body: JSON.stringify({ sender_id: user.uid, receiver_id: receiverId })
            });
            const data = await resp.json();
            if (resp.ok) {
                Alert.alert('Başarılı', 'Arkadaşlık isteği gönderildi.');
            } else {
                Alert.alert('Bilgi', data.detail || 'İstek gönderilemedi.');
            }
        } catch (e) {
            Alert.alert('Hata', 'İstek gönderilirken bir sorun oluştu.');
        }
    };

    const respondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
        try {
            const resp = await fetch(`${API_URL}/friends/request/respond`, {
                method: 'POST',
                headers: API_HEADERS,
                body: JSON.stringify({ request_id: requestId, action })
            });
            if (resp.ok) {
                fetchRequests();
                if (action === 'accept') fetchFriends();
            }
        } catch (e) { console.error(e); }
    };

    const removeFriend = async (friendId: string) => {
        if (!user) return;
        Alert.alert('Arkadaşı Sil', 'Bu arkadaşını silmek istediğine emin misin?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const resp = await fetch(`${API_URL}/friends/${user.uid}/remove/${friendId}`, {
                            method: 'DELETE',
                            headers: API_HEADERS
                        });
                        if (resp.ok) fetchFriends();
                    } catch (e) { console.error(e); }
                }
            }
        ]);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'friends':
                return (
                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {friends.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={64} color={theme.textSecondary + '40'} />
                                <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>Henüz arkadaşın yok</Text>
                                <TouchableOpacity
                                    style={[styles.emptyAction, { backgroundColor: theme.primary }]}
                                    onPress={() => setActiveTab('search')}
                                >
                                    <Text style={styles.emptyActionText}>Arkadaş Ara</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            friends.map(friend => (
                                <View key={friend.id} style={[styles.userCard, { backgroundColor: theme.surface }, styles.shadow]}>
                                    <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '20' }]}>
                                        <Text style={[styles.avatarText, { color: theme.primary }]}>{friend.name[0].toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={[styles.userName, { color: theme.text }]}>{friend.name}</Text>
                                        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{friend.email}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeFriend(friend.id)} style={styles.removeBtn}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => Alert.alert('Düello', 'Bu arkadaşına düello teklif etmek istiyor musun?', [
                                            { text: 'İptal', style: 'cancel' },
                                            { text: 'Davet Et', onPress: () => setView('flashcard' as any) } // Simplification: go to flashcards to select a deck
                                        ])}
                                        style={[styles.challengeBtn, { backgroundColor: theme.primary }]}
                                    >
                                        <Ionicons name="flash" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>
                );
            case 'requests':
                return (
                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {requests.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="mail-unread-outline" size={64} color={theme.textSecondary + '40'} />
                                <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>Bekleyen istek yok</Text>
                            </View>
                        ) : (
                            requests.map(req => (
                                <View key={req.id} style={[styles.userCard, { backgroundColor: theme.surface }, styles.shadow]}>
                                    <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '20' }]}>
                                        <Text style={[styles.avatarText, { color: theme.primary }]}>{req.sender.name[0].toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={[styles.userName, { color: theme.text }]}>{req.sender.name}</Text>
                                        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>Arkadaşlık isteği gönderdi</Text>
                                    </View>
                                    <View style={styles.requestActions}>
                                        <TouchableOpacity onPress={() => respondToRequest(req.id, 'accept')} style={[styles.actionBtn, { backgroundColor: '#10B981' }]}>
                                            <Ionicons name="checkmark" size={20} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => respondToRequest(req.id, 'decline')} style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}>
                                            <Ionicons name="close" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                );
            case 'search':
                return (
                    <View style={{ flex: 1 }}>
                        <View style={[styles.searchBar, { backgroundColor: theme.surface }, styles.shadow]}>
                            <Ionicons name="search" size={20} color={theme.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="İsim veya e-posta ara..."
                                placeholderTextColor={theme.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                            />
                            {loading ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <TouchableOpacity onPress={handleSearch}>
                                    <Ionicons name="arrow-forward" size={24} color={theme.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            {searchResults.length === 0 && searchQuery.trim() !== '' && !loading ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="search-outline" size={64} color={theme.textSecondary + '40'} />
                                    <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>Sonuç bulunamadı</Text>
                                </View>
                            ) : (
                                searchResults.map(result => (
                                    <View key={result.id} style={[styles.userCard, { backgroundColor: theme.surface }, styles.shadow]}>
                                        <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '20' }]}>
                                            <Text style={[styles.avatarText, { color: theme.primary }]}>{result.name[0].toUpperCase()}</Text>
                                        </View>
                                        <View style={styles.userInfo}>
                                            <Text style={[styles.userName, { color: theme.text }]}>{result.name}</Text>
                                            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{result.email}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => sendRequest(result.id)}
                                            style={[styles.addFriendBtn, { backgroundColor: theme.primary }]}
                                        >
                                            <Ionicons name="person-add" size={18} color="#fff" />
                                            <Text style={styles.addFriendText}>Ekle</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />

            {/* HERO HEADER */}
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#6C3CE1', '#5B21B6', '#4C1D95']}
                style={styles.heroHeader}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <View style={[styles.decorCircle, { top: -25, right: -20, width: 120, height: 120, opacity: 0.06 }]} />
                <View style={[styles.decorCircle, { bottom: 5, left: -30, width: 80, height: 80, opacity: 0.08 }]} />

                <View style={styles.heroTopRow}>
                    <View style={styles.heroTitleRow}>
                        <View style={styles.heroIconBg}>
                            <Ionicons name="people" size={20} color="#fff" />
                        </View>
                        <Text style={styles.heroTitle}>Arkadaşlar</Text>
                    </View>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabSwitcher}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'friends' && styles.activeTabButton]}
                        onPress={() => setActiveTab('friends')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'friends' && styles.activeTabButtonText]}>Arkadaşlarım</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'requests' && styles.activeTabButton]}
                        onPress={() => setActiveTab('requests')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.tabButtonText, activeTab === 'requests' && styles.activeTabButtonText]}>İstekler</Text>
                            {requests.length > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{requests.length}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'search' && styles.activeTabButton]}
                        onPress={() => setActiveTab('search')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'search' && styles.activeTabButtonText]}>Ara</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.mainContent}>
                {renderTabContent()}
            </View>

            <BottomTabBar setView={setView} theme={theme} />
        </View>
    );
};

export default FriendsView;

const styles = StyleSheet.create({
    container: { flex: 1 },
    heroHeader: {
        paddingTop: Platform.OS === 'android' ? 48 : 58,
        paddingBottom: 30,
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
    tabSwitcher: {
        flexDirection: 'row',
        marginTop: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 14,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTabButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    tabButtonText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '600',
    },
    activeTabButtonText: {
        color: '#fff',
    },
    badge: {
        backgroundColor: '#EF4444',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    scrollContent: {
        flex: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderRadius: 16,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '500',
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
    },
    userInfo: {
        flex: 1,
        marginLeft: 14,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
    userEmail: {
        fontSize: 13,
        marginTop: 2,
    },
    removeBtn: {
        padding: 10,
    },
    challengeBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addFriendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    addFriendText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyAction: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
    },
    emptyActionText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
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
