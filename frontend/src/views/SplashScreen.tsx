import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const SplashScreen = () => {
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslate = useRef(new Animated.Value(30)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const dotScale1 = useRef(new Animated.Value(0)).current;
    const dotScale2 = useRef(new Animated.Value(0)).current;
    const dotScale3 = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo animasyonu
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 20,
                    friction: 5,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            // Glow efekti
            Animated.timing(glowOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            // Başlık animasyonu
            Animated.parallel([
                Animated.timing(titleOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(titleTranslate, {
                    toValue: 0,
                    tension: 40,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
            // Alt yazı
            Animated.timing(subtitleOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();

        // Yükleniyor noktaları
        const dotAnim = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dotScale1, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dotScale2, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dotScale3, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.parallel([
                        Animated.timing(dotScale1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                        Animated.timing(dotScale2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                        Animated.timing(dotScale3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                    ]),
                ])
            ).start();
        };
        setTimeout(dotAnim, 1200);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#1A0533', '#2D1B69', '#4A1DB5', '#6C3CE1']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Dekoratif arka plan daireleri */}
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />

                <View style={styles.content}>
                    {/* Logo */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                transform: [{ scale: logoScale }],
                                opacity: logoOpacity,
                            },
                        ]}
                    >
                        {/* Glow efekti */}
                        <Animated.View
                            style={[
                                styles.glow,
                                { opacity: glowOpacity },
                            ]}
                        />
                        <View style={styles.logoInner}>
                            <Image
                                source={require('../../assets/images/icon.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                    </Animated.View>

                    {/* Başlık */}
                    <Animated.View
                        style={{
                            opacity: titleOpacity,
                            transform: [{ translateY: titleTranslate }],
                        }}
                    >
                        <Text style={styles.title}>
                            <Text style={styles.titleBold}>RC </Text>
                            <Text style={styles.titleLight}>Sınavım</Text>
                        </Text>
                    </Animated.View>

                    {/* Alt Yazı */}
                    <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
                        Hedefine bir adım daha yakın
                    </Animated.Text>

                    {/* Yükleniyor noktaları */}
                    <Animated.View style={[styles.dotsContainer, { opacity: subtitleOpacity }]}>
                        {[dotScale1, dotScale2, dotScale3].map((dot, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    { transform: [{ scale: dot }] },
                                ]}
                            />
                        ))}
                    </Animated.View>
                </View>

                {/* Footer */}
                <Animated.Text style={[styles.footer, { opacity: subtitleOpacity }]}>
                    © 2026 RC Sınavım
                </Animated.Text>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    // Dekoratif daireler
    circle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    circle1: {
        width: width * 1.2,
        height: width * 1.2,
        top: -width * 0.3,
        right: -width * 0.3,
    },
    circle2: {
        width: width * 0.8,
        height: width * 0.8,
        bottom: -width * 0.2,
        left: -width * 0.2,
    },
    circle3: {
        width: width * 0.5,
        height: width * 0.5,
        top: height * 0.4,
        right: -width * 0.1,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Logo
    logoContainer: {
        width: 120,
        height: 120,
        marginBottom: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(108, 60, 225, 0.4)',
        ...Platform.select({
            ios: {
                shadowColor: '#6C3CE1',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 40,
            },
            android: {
                elevation: 20,
            },
            web: {
                boxShadow: '0 0 60px rgba(108,60,225,0.6)',
            },
        }),
    },
    logoInner: {
        width: 100,
        height: 100,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    logo: {
        width: 70,
        height: 70,
        borderRadius: 16,
    },
    // Tipografi
    title: {
        fontSize: 38,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    titleBold: {
        fontWeight: '900',
        letterSpacing: -1,
    },
    titleLight: {
        fontWeight: '300',
        letterSpacing: 1,
        opacity: 0.95,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.55)',
        fontWeight: '500',
        letterSpacing: 0.5,
        marginBottom: 40,
    },
    // Yükleniyor
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    footer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 50 : 30,
        color: 'rgba(255,255,255,0.2)',
        fontSize: 11,
        fontWeight: '500',
    },
});

export default SplashScreen;
