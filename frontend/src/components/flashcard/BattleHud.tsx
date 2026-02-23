import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BattleHudProps {
    hp: number;
    mastery: number;
    energy: number;
    playerName: string;
    opponentName?: string;
    opponentHp?: number;
}

export const BattleHud: React.FC<BattleHudProps> = ({
    hp,
    mastery,
    energy,
    playerName,
    opponentName = "RAKİP",
    opponentHp = 100
}) => {
    const hpStyle = useAnimatedStyle(() => ({
        width: withSpring(`${hp}%`),
        backgroundColor: interpolateColor(
            hp,
            [20, 50, 100],
            ['#EF4444', '#F59E0B', '#10B981']
        )
    }));

    const oppHpStyle = useAnimatedStyle(() => ({
        width: withSpring(`${opponentHp}%`),
    }));

    const energyStyle = useAnimatedStyle(() => ({
        width: withSpring(`${(energy / 5) * 100}%`),
    }));

    return (
        <View style={styles.container}>
            {/* Top Bar: Player Stats */}
            <View style={styles.statsRow}>
                <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{playerName}</Text>
                    <View style={styles.barContainer}>
                        <Animated.View style={[styles.barFill, hpStyle]} />
                    </View>
                    <View style={styles.xpRow}>
                        <Ionicons name="flash" size={12} color="#F59E0B" />
                        <Text style={styles.xpText}>{mastery} Mastery</Text>
                    </View>
                </View>

                <View style={styles.vsContainer}>
                    <LinearGradient
                        colors={['#8B5CF6', '#06B6D4']}
                        style={styles.vsCircle}
                    >
                        <Text style={styles.vsText}>VS</Text>
                    </LinearGradient>
                </View>

                <View style={[styles.playerInfo, styles.opponentSide]}>
                    <Text style={styles.playerName}>{opponentName}</Text>
                    <View style={styles.barContainer}>
                        <Animated.View style={[styles.barFill, styles.oppBarFill, oppHpStyle]} />
                    </View>
                </View>
            </View>

            {/* Bottom Energy Bar */}
            <View style={styles.energyHud}>
                <View style={styles.energyHeader}>
                    <Text style={styles.energyLabel}>ENERJİ</Text>
                    <View style={styles.energyPoints}>
                        {[1, 2, 3, 4, 5].map(p => (
                            <View
                                key={p}
                                style={[styles.energyDot, energy >= p && styles.energyDotActive]}
                            />
                        ))}
                    </View>
                </View>
                <View style={styles.energyTrack}>
                    <Animated.View style={[styles.energyFill, energyStyle]}>
                        <LinearGradient
                            colors={['#06B6D4', '#3B82F6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    playerInfo: {
        flex: 1,
    },
    opponentSide: {
        alignItems: 'flex-end',
    },
    playerName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    barContainer: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    oppBarFill: {
        backgroundColor: '#10B981',
    },
    xpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    xpText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: '700',
    },
    vsContainer: {
        paddingHorizontal: 15,
    },
    vsCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    vsText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    energyHud: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    energyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    energyLabel: {
        color: '#06B6D4',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    energyPoints: {
        flexDirection: 'row',
        gap: 6,
    },
    energyDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    energyDotActive: {
        backgroundColor: '#06B6D4',
        shadowColor: '#06B6D4',
        shadowRadius: 4,
        shadowOpacity: 1,
    },
    energyTrack: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    energyFill: {
        height: '100%',
        borderRadius: 2,
    }
});
