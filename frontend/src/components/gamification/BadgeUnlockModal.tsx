import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    Animated, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge } from '../../hooks/useGamification';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Confetti Piece ────────────────────────────────
const ConfettiPiece = ({ delay, color, startX }: { delay: number; color: string; startX: number }) => {
    const fallAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const swayAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fallAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(swayAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(swayAnim, { toValue: -1, duration: 400, useNativeDriver: true }),
                    ])
                ),
            ]).start();
        }, delay);
        return () => clearTimeout(timeout);
    }, []);

    const translateY = fallAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 700] });
    const translateX = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: [-20, 20] });
    const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });
    const opacity = fallAnim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

    return (
        <Animated.View
            style={[
                styles.confetti,
                {
                    left: startX,
                    backgroundColor: color,
                    transform: [{ translateY }, { translateX }, { rotate }],
                    opacity,
                },
            ]}
        />
    );
};

// ─── Main Modal ────────────────────────────────────
interface Props {
    visible: boolean;
    badge: Badge | null;
    onDismiss: () => void;
}

export const BadgeUnlockModal = ({ visible, badge, onDismiss }: Props) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const textAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && badge) {
            scaleAnim.setValue(0);
            glowAnim.setValue(0);
            textAnim.setValue(0);

            Animated.sequence([
                Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
                Animated.parallel([
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                            Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
                        ])
                    ),
                    Animated.spring(textAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
                ]),
            ]).start();
        }
    }, [visible, badge]);

    if (!badge) return null;

    const confettiColors = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F97316'];
    const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        delay: Math.random() * 800,
        color: confettiColors[i % confettiColors.length],
        startX: Math.random() * SCREEN_WIDTH,
    }));

    const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
    const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                {/* Confetti */}
                {confettiPieces.map(p => (
                    <ConfettiPiece key={p.id} delay={p.delay} color={p.color} startX={p.startX} />
                ))}

                {/* Badge Card */}
                <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={['#1E0A3C', '#2D1B69']}
                        style={styles.cardGrad}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                        {/* Glow ring */}
                        <Animated.View style={[styles.glowRing, { backgroundColor: badge.color + '30', transform: [{ scale: glowScale }], opacity: glowOpacity }]} />

                        {/* Badge icon */}
                        <Animated.View style={[styles.badgeCircle, { backgroundColor: badge.color + '25', borderColor: badge.color + '50' }]}>
                            <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                        </Animated.View>

                        {/* Title */}
                        <Text style={styles.unlockTitle}>🎉 Rozet Kazanıldı!</Text>

                        <Animated.View style={{ opacity: textAnim, transform: [{ scale: textAnim }] }}>
                            <Text style={[styles.badgeName, { color: badge.color }]}>{badge.name}</Text>
                            <Text style={styles.badgeDesc}>{badge.description}</Text>
                        </Animated.View>

                        {/* XP reward */}
                        <View style={[styles.xpBadge, { backgroundColor: badge.color + '20' }]}>
                            <Text style={[styles.xpText, { color: badge.color }]}>+50 XP</Text>
                        </View>

                        {/* Close button */}
                        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: badge.color }]} onPress={onDismiss} activeOpacity={0.8}>
                            <Text style={styles.closeBtnText}>Harika! 🎊</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confetti: {
        position: 'absolute',
        top: 0,
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    card: {
        width: SCREEN_WIDTH * 0.82,
        borderRadius: 32,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    cardGrad: {
        padding: 32,
        alignItems: 'center',
    },
    glowRing: {
        position: 'absolute',
        top: 40,
        width: 160,
        height: 160,
        borderRadius: 80,
    },
    badgeCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    badgeEmoji: {
        fontSize: 48,
    },
    unlockTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 8,
    },
    badgeName: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 4,
    },
    badgeDesc: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 16,
    },
    xpBadge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 14,
        marginBottom: 20,
    },
    xpText: {
        fontSize: 16,
        fontWeight: '800',
    },
    closeBtn: {
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 18,
        width: '100%',
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
