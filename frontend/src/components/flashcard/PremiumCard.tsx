import React, { useMemo } from 'react';
import { StyleSheet, Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    interpolate,
    Extrapolation,
    runOnJS,
    withTiming
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const UP_THRESHOLD = -150;

interface Flashcard {
    id: string;
    front: string;
    back: string;
    subject: string;
    drawingPath?: string;
}

interface PremiumCardProps {
    card: Flashcard;
    isFlipped: boolean;
    onFlip: () => void;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    onSwipeUp: () => void;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
    card,
    isFlipped,
    onFlip,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp
}) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotateZ = useSharedValue(0);
    const tiltX = useSharedValue(0);
    const tiltY = useSharedValue(0);
    const flipRotation = useSharedValue(isFlipped ? 180 : 0);

    // Sync flip state from props
    React.useEffect(() => {
        flipRotation.value = withSpring(isFlipped ? 180 : 0, { damping: 15 });
    }, [isFlipped]);

    // Reset position when card changes (if it was swiped but not unmounted)
    React.useEffect(() => {
        translateX.value = 0;
        translateY.value = 0;
        rotateZ.value = 0;
        tiltX.value = 0;
        tiltY.value = 0;
    }, [card.id]);

    const gesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
            rotateZ.value = interpolate(
                event.translationX,
                [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
                [-15, 15]
            );
            // 3D Tilt effect
            tiltY.value = interpolate(event.translationX, [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2], [10, -10]);
            tiltX.value = interpolate(event.translationY, [-SCREEN_HEIGHT / 2, SCREEN_HEIGHT / 2], [-10, 10]);
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD) {
                translateX.value = withTiming(SCREEN_WIDTH * 1.5, {}, () => runOnJS(onSwipeRight)());
            } else if (event.translationX < -SWIPE_THRESHOLD) {
                translateX.value = withTiming(-SCREEN_WIDTH * 1.5, {}, () => runOnJS(onSwipeLeft)());
            } else if (event.translationY < UP_THRESHOLD && Math.abs(event.translationX) < SWIPE_THRESHOLD) {
                translateY.value = withTiming(-SCREEN_HEIGHT * 1.5, {}, () => runOnJS(onSwipeUp)());
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                rotateZ.value = withSpring(0);
                tiltX.value = withSpring(0);
                tiltY.value = withSpring(0);
            }
        });

    const tapGesture = Gesture.Tap().onEnd(() => {
        runOnJS(onFlip)();
    });

    const composed = Gesture.Race(gesture, tapGesture);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { perspective: 1000 },
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotateZ: `${rotateZ.value}deg` },
                { rotateX: `${tiltX.value}deg` },
                { rotateY: `${tiltY.value}deg` },
            ] as any,
        };
    });

    const frontStyle = useAnimatedStyle(() => ({
        transform: [{ perspective: 1000 }, { rotateY: `${flipRotation.value}deg` }] as any,
    }));

    const backStyle = useAnimatedStyle(() => ({
        transform: [{ perspective: 1000 }, { rotateY: `${flipRotation.value - 180}deg` }] as any,
    }));

    const shadowStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            Math.abs(translateX.value),
            [0, SWIPE_THRESHOLD],
            [0, 0.4],
            Extrapolation.CLAMP
        );
        const color = translateX.value > 0 ? '#10B981' : '#EF4444';
        return {
            backgroundColor: color,
            opacity,
            borderRadius: 30,
            ...StyleSheet.absoluteFillObject,
        };
    });

    return (
        <GestureDetector gesture={composed}>
            <Animated.View style={[styles.cardContainer, animatedStyle]}>
                {/* Glow Overlay when swiping */}
                <Animated.View style={shadowStyle} />

                {/* Front Side */}
                <Animated.View style={[styles.cardContent, frontStyle, { position: 'absolute', backfaceVisibility: 'hidden' }]}>
                    <BlurView intensity={20} tint="light" style={styles.glass}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{card.subject}</Text>
                        </View>
                        <Text style={styles.cardText}>{card.front}</Text>
                        <View style={styles.footer}>
                            <Ionicons name="finger-print" size={24} color="rgba(255,255,255,0.4)" />
                            <Text style={styles.footerText}>Çevirmek için dokun</Text>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* Back Side */}
                <Animated.View style={[styles.cardContent, backStyle, { position: 'absolute', backfaceVisibility: 'hidden' }]}>
                    <BlurView intensity={30} tint="dark" style={[styles.glass, styles.glassBack]}>
                        <Text style={[styles.cardText, { color: '#FFF' }]}>{card.back}</Text>
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Biliyor musun? Sağa kaydır!</Text>
                        </View>
                    </BlurView>
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: SCREEN_WIDTH - 60,
        height: SCREEN_HEIGHT * 0.6,
        borderRadius: 30,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardContent: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 30,
        overflow: 'hidden',
        backfaceVisibility: 'hidden',
    },
    glass: {
        flex: 1,
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    glassBack: {
        backgroundColor: 'rgba(15,15,26,0.8)',
        borderColor: 'rgba(139,92,246,0.3)',
    },
    cardText: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        color: '#FFF',
        lineHeight: 38,
    },
    badge: {
        position: 'absolute',
        top: 25,
        left: 25,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        alignItems: 'center',
    },
    footerText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
    }
});
