import React from 'react';
import { View, Text, StyleSheet, StatusBar, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Theme, AppView } from '../src/types';

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
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

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
            </LinearGradient>

            <View style={styles.content}>
                <View style={[styles.comingSoonCard, { backgroundColor: theme.surface }, styles.shadow]}>
                    <LinearGradient
                        colors={[theme.primary + '15', 'transparent']}
                        style={styles.comingSoonGrad}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="construct-outline" size={48} color={theme.primary} />
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>Çok Yakında!</Text>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>
                            Arkadaş ekleme, beraber çalışma ve çalışma grupları özelliği geliştirme aşamasında. Takipte kal!
                        </Text>
                    </LinearGradient>
                </View>
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 100,
    },
    comingSoonCard: {
        width: '100%',
        borderRadius: 24,
        overflow: 'hidden',
    },
    comingSoonGrad: {
        padding: 30,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
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
