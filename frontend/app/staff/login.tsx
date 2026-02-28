import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
    Dimensions,
    Animated,
    KeyboardAvoidingView,
    ScrollView,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/services/authService';
import { API_URL } from '../../src/config/api';
import { COLORS } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

type Role = 'teacher' | 'admin';

const ROLE_CONFIG = {
    teacher: {
        title: 'Öğretmen Girişi',
        icon: 'school' as const,
        gradient: [COLORS.light.primary, '#6C3CE1', '#4F46E5'] as const,
        buttonGradient: [COLORS.light.primary, '#7C3AED'] as [string, string],
        iconBg: '#EEF2FF',
        iconBorder: '#E0E7FF',
        iconColor: COLORS.light.primary,
        shadowColor: COLORS.light.primary,
    },
    admin: {
        title: 'Yönetici Girişi',
        icon: 'shield-checkmark' as const,
        gradient: ['#F59E0B', '#EF4444', '#DC2626'] as const,
        buttonGradient: ['#F59E0B', '#EF4444'] as [string, string],
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        iconColor: '#F59E0B',
        shadowColor: '#F59E0B',
    },
};

export default function StaffLogin() {
    const router = useRouter();
    const [role, setRole] = useState<Role>('teacher');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Animations
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const bgAnim = useRef(new Animated.Value(0)).current;

    const config = ROLE_CONFIG[role];

    useEffect(() => {
        const toValue = role === 'teacher' ? 0 : 1;
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue,
                useNativeDriver: true,
                tension: 60,
                friction: 10,
            }),
            Animated.timing(bgAnim, {
                toValue,
                duration: 400,
                useNativeDriver: false,
            }),
        ]).start();

        // Icon bounce
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }),
        ]).start();

        // Fade text
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 0.5,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [role]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);
        try {
            if (role === 'teacher') {
                const result = await authService.loginTeacher(email, password);
                if (result.status === 'success') {
                    try {
                        if (typeof window !== 'undefined') {
                            sessionStorage.setItem('teacher_data', JSON.stringify(result.teacher));
                            if (result.token) sessionStorage.setItem('teacher_token', result.token);
                        }
                    } catch (e) { /* ignore */ }
                    router.replace('/teacher/dashboard');
                } else {
                    Alert.alert('Giriş Başarısız', result.message || 'Hatalı e-posta veya şifre.');
                }
            } else {
                const response = await fetch(`${API_URL}/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                    body: JSON.stringify({ email, password }),
                });
                const result = await response.json();
                if (result.status === 'success') {
                    try {
                        if (typeof window !== 'undefined') {
                            sessionStorage.setItem('admin_data', JSON.stringify(result.admin));
                            if (result.token) sessionStorage.setItem('admin_token', result.token);
                        }
                    } catch (e) { /* ignore */ }
                    router.replace('/admin/dashboard');
                } else {
                    Alert.alert('Giriş Başarısız', result.message || 'Hatalı e-posta veya şifre.');
                }
            }
        } catch (e) {
            Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
        } finally {
            setLoading(false);
        }
    };

    const switchRole = (newRole: Role) => {
        if (newRole !== role) {
            setRole(newRole);
            setEmail('');
            setPassword('');
        }
    };

    // Interpolated background color
    const bgColor = bgAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#4F46E5', '#DC2626'],
    });

    const toggleTranslateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, (Platform.OS === 'web' ? 170 : width * 0.39)],
    });

    return (
        <View style={styles.container}>
            {/* Animated Background */}
            <Animated.View style={[styles.background, { backgroundColor: bgColor }]} />
            <LinearGradient
                colors={config.gradient as unknown as [string, string, ...string[]]}
                style={[styles.background, { opacity: 0.9 }]}
                key={role}
            />

            {/* Floating Shapes */}
            <View style={[styles.shape, styles.shape1]} />
            <View style={[styles.shape, styles.shape2]} />
            <View style={[styles.shape, styles.shape3]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo Area */}
                    <View style={styles.logoArea}>
                        <Image
                            source={require('../../assets/images/icon.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.logoText}>Sınavım</Text>
                        <Text style={styles.logoSubtext}>Yönetim Sistemi</Text>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        {/* Role Toggle */}
                        <View style={styles.toggleContainer}>
                            <Animated.View
                                style={[
                                    styles.toggleIndicator,
                                    {
                                        transform: [{ translateX: toggleTranslateX }],
                                        backgroundColor: role === 'teacher' ? COLORS.light.primary : '#F59E0B',
                                    },
                                ]}
                            />
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => switchRole('teacher')}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="school"
                                    size={16}
                                    color={role === 'teacher' ? '#fff' : '#6B7280'}
                                    style={styles.toggleIcon}
                                />
                                <Text style={[styles.toggleText, role === 'teacher' && styles.toggleTextActive]}>
                                    Öğretmen
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => switchRole('admin')}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="shield-checkmark"
                                    size={16}
                                    color={role === 'admin' ? '#fff' : '#6B7280'}
                                    style={styles.toggleIcon}
                                />
                                <Text style={[styles.toggleText, role === 'admin' && styles.toggleTextActive]}>
                                    Yönetici
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Icon & Title */}
                        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                            <Animated.View
                                style={[
                                    styles.iconContainer,
                                    {
                                        backgroundColor: config.iconBg,
                                        borderColor: config.iconBorder,
                                        transform: [{ scale: scaleAnim }],
                                    },
                                ]}
                            >
                                <Ionicons name={config.icon} size={36} color={config.iconColor} />
                            </Animated.View>
                            <Text style={styles.title}>{config.title}</Text>
                        </Animated.View>

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="E-Posta Adresi"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Şifre"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, { shadowColor: config.shadowColor }]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <View style={styles.buttonLoading}>
                                        <ActivityIndicator color="#fff" />
                                    </View>
                                ) : (
                                    <LinearGradient
                                        colors={config.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.buttonGradient}
                                    >
                                        <Text style={styles.buttonText}>Giriş Yap</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                    </LinearGradient>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <Text style={styles.footerText}>© 2025 Sınavım. Tüm hakları saklıdır.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    // Floating decorative shapes
    shape: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.12,
        backgroundColor: '#fff',
    },
    shape1: {
        width: 300,
        height: 300,
        top: -80,
        left: -80,
    },
    shape2: {
        width: 200,
        height: 200,
        bottom: 60,
        right: -60,
    },
    shape3: {
        width: 120,
        height: 120,
        top: '40%' as any,
        right: -30,
        opacity: 0.08,
    },
    // Logo
    logoArea: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoImage: {
        width: 60,
        height: 60,
        marginBottom: 10,
        borderRadius: 15,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    logoSubtext: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)',
        marginTop: 4,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    // Card
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        width: Platform.OS === 'web' ? 440 : '100%',
        maxWidth: 440,
        padding: 32,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
    },
    // Toggle
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
        marginBottom: 28,
        position: 'relative',
    },
    toggleIndicator: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: '48.5%' as any,
        height: '100%',
        borderRadius: 13,
        zIndex: 0,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        zIndex: 1,
        gap: 6,
    },
    toggleIcon: {
        // icon styling via props
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#fff',
    },
    // Header
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1.5,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
    },
    // Form
    form: {
        gap: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 54,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        height: '100%',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    } as any,
    // Button
    button: {
        marginTop: 6,
        borderRadius: 14,
        overflow: 'hidden',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        gap: 8,
    },
    buttonLoading: {
        paddingVertical: 15,
        alignItems: 'center',
        backgroundColor: '#9CA3AF',
        borderRadius: 14,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    // Footer
    footerText: {
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
});
