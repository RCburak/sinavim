import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    children: React.ReactNode;
    theme?: any;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="warning-outline" size={48} color="#F59E0B" />
                    </View>
                    <Text style={styles.title}>Bir Şeyler Ters Gitti</Text>
                    <Text style={styles.subtitle}>
                        Uygulama beklenmedik bir hata ile karşılaştı.{'\n'}
                        Lütfen tekrar dene.
                    </Text>
                    {__DEV__ && this.state.error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText} numberOfLines={5}>
                                {this.state.error.message}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={this.handleReset}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="refresh" size={18} color="#fff" />
                        <Text style={styles.retryBtnText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F1A',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 30,
        backgroundColor: 'rgba(245,158,11,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#F1F5F9',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
        marginBottom: 20,
    },
    errorBox: {
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        width: '100%',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6C3CE1',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 16,
        gap: 8,
    },
    retryBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
