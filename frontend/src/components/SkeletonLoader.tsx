import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
    theme: any;
}

export const SkeletonBox = ({ width = '100%', height = 20, borderRadius = 12, style, theme }: SkeletonProps) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const backgroundColor = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: isDark
            ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.12)']
            : ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.10)'],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor,
                },
                style,
            ]}
        />
    );
};

// Skeleton for a single card
export const SkeletonCard = ({ theme }: { theme: any }) => {
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    return (
        <View style={[styles.card, { backgroundColor: theme.surface }, theme.cardShadow]}>
            <View style={styles.cardRow}>
                <SkeletonBox width={44} height={44} borderRadius={14} theme={theme} />
                <View style={styles.cardTexts}>
                    <SkeletonBox width="70%" height={16} theme={theme} />
                    <SkeletonBox width="40%" height={12} theme={theme} style={{ marginTop: 8 }} />
                </View>
            </View>
            <SkeletonBox width="100%" height={14} theme={theme} style={{ marginTop: 14 }} />
            <SkeletonBox width="60%" height={14} theme={theme} style={{ marginTop: 6 }} />
        </View>
    );
};

// Skeleton for stat boxes
export const SkeletonStat = ({ theme }: { theme: any }) => (
    <View style={[styles.statBox, { backgroundColor: theme.surface }, theme.cardShadow]}>
        <SkeletonBox width={48} height={48} borderRadius={16} theme={theme} />
        <SkeletonBox width={50} height={24} theme={theme} style={{ marginTop: 10 }} />
        <SkeletonBox width={70} height={12} theme={theme} style={{ marginTop: 6 }} />
    </View>
);

// Skeleton for a menu card (dashboard)
export const SkeletonMenuCard = ({ theme }: { theme: any }) => (
    <View style={[styles.menuCard, { backgroundColor: theme.surface }, theme.cardShadow]}>
        <SkeletonBox width={48} height={48} borderRadius={16} theme={theme} />
        <SkeletonBox width="80%" height={16} theme={theme} style={{ marginTop: 14 }} />
        <SkeletonBox width="50%" height={12} theme={theme} style={{ marginTop: 6 }} />
    </View>
);

// Skeleton for profile view
export const SkeletonProfile = ({ theme }: { theme: any }) => (
    <View style={styles.profileSkeleton}>
        <SkeletonBox width={88} height={88} borderRadius={28} theme={theme} />
        <SkeletonBox width={160} height={22} theme={theme} style={{ marginTop: 16 }} />
        <SkeletonBox width={120} height={14} theme={theme} style={{ marginTop: 8 }} />
    </View>
);

// Skeleton for a list of items
export const SkeletonList = ({ count = 3, theme }: { count?: number; theme: any }) => (
    <View style={styles.listContainer}>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} theme={theme} />
        ))}
    </View>
);

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        marginHorizontal: 20,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTexts: {
        flex: 1,
        marginLeft: 14,
    },
    statBox: {
        flex: 1,
        padding: 18,
        borderRadius: 20,
        alignItems: 'center',
    },
    menuCard: {
        width: '47%',
        padding: 20,
        borderRadius: 20,
        marginBottom: 14,
    },
    profileSkeleton: {
        alignItems: 'center',
        paddingVertical: 28,
    },
    listContainer: {
        paddingTop: 12,
    },
});
