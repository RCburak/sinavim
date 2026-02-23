import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SUBJECTS = [
    {
        name: 'Matematik', icon: 'calculator', color: '#3B82F6', formulas: [
            { title: 'Alan Formülleri', items: ['Kare: a²', 'Dikdörtgen: a × b', 'Üçgen: (a × h) / 2', 'Daire: π × r²', 'Paralelkenar: a × h', 'Yamuk: (a + b) × h / 2'] },
            { title: 'Hacim Formülleri', items: ['Küp: a³', 'Dikdörtgen Prizma: a × b × c', 'Silindir: π × r² × h', 'Koni: (π × r² × h) / 3', 'Küre: (4/3) × π × r³'] },
            { title: 'Oran-Orantı', items: ['a/b = c/d → a×d = b×c', 'Doğru Orantı: x₁/y₁ = x₂/y₂', 'Ters Orantı: x₁×y₁ = x₂×y₂'] },
            { title: 'Olasılık', items: ['P(A) = n(A) / n(S)', 'P(A∪B) = P(A) + P(B) − P(A∩B)', 'P(A\') = 1 − P(A)', 'Bağımsız: P(A∩B) = P(A) × P(B)'] },
        ]
    },
    {
        name: 'Fizik', icon: 'flash', color: '#EF4444', formulas: [
            { title: 'Hareket', items: ['v = x / t', 'a = Δv / t', 'x = v₀t + ½at²', 'v² = v₀² + 2ax', 'x = (v₀ + v) × t / 2'] },
            { title: 'Kuvvet & Enerji', items: ['F = m × a', 'W = F × d × cos(θ)', 'Ek = ½mv²', 'Ep = mgh', 'P = W / t'] },
            { title: 'Elektrik', items: ['V = I × R', 'P = V × I', 'Q = I × t', 'R = ρ × L / A', 'Seri: Rt = R₁+R₂+...', 'Paralel: 1/Rt = 1/R₁+1/R₂+...'] },
        ]
    },
    {
        name: 'Kimya', icon: 'flask', color: '#10B981', formulas: [
            { title: 'Mol Hesapları', items: ['n = m / M', 'n = N / NA', 'NA = 6.022 × 10²³', 'PV = nRT', 'Molar Hacim (NŞA) = 22.4 L'] },
            { title: 'Çözelti', items: ['m/m% = (mçözünen/mçözelti) × 100', 'Molarite = n/V(L)', 'ppm = mg/L'] },
            { title: 'Denge', items: ['Kc = [Ürün]ⁿ / [Girişim]ᵐ', 'pH = −log[H⁺]', 'pOH = −log[OH⁻]', 'pH + pOH = 14'] },
        ]
    },
    {
        name: 'Biyoloji', icon: 'leaf', color: '#F59E0B', formulas: [
            { title: 'Genetik', items: ['Genotip oranı = çaprazlama tablosu', 'Bağımsız gen: 2ⁿ gamet', 'Hardy-Weinberg: p² + 2pq + q² = 1'] },
            { title: 'Hücre', items: ['Mitoz: 2n → 2n (2 hücre)', 'Mayoz: 2n → n (4 hücre)', 'ATP → ADP + Pi + Enerji'] },
        ]
    },
];

export const FormulaLibraryView = ({ onBack, theme }: any) => {
    const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
    const isDark = theme.background === '#0F0F1A' || theme.background === '#121212';

    return (
        <View style={[st.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={{ flex: 1 }}>
                <LinearGradient
                    colors={isDark ? ['#7C2D12', '#6B2010'] : ['#F97316', '#EA580C']}
                    style={st.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity onPress={onBack} style={st.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={st.headerTitle}>Formül Kütüphanesi</Text>
                </LinearGradient>

                {/* Subject Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={st.tabRow} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                    {SUBJECTS.map(sub => (
                        <TouchableOpacity
                            key={sub.name}
                            style={[st.tab, selectedSubject.name === sub.name
                                ? { backgroundColor: sub.color }
                                : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }
                            ]}
                            onPress={() => setSelectedSubject(sub)}
                        >
                            <Ionicons name={sub.icon as any} size={16}
                                color={selectedSubject.name === sub.name ? '#fff' : theme.textSecondary} />
                            <Text style={{
                                fontSize: 13, fontWeight: '700',
                                color: selectedSubject.name === sub.name ? '#fff' : theme.textSecondary
                            }}>{sub.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}>
                    {selectedSubject.formulas.map((section, i) => (
                        <View key={i} style={[st.section, { backgroundColor: theme.surface }, theme.cardShadow]}>
                            <View style={st.sectionHeader}>
                                <View style={[st.sectionDot, { backgroundColor: selectedSubject.color }]} />
                                <Text style={[st.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                            </View>
                            {section.items.map((formula, j) => (
                                <View key={j} style={[st.formulaRow, j < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border + '40' }]}>
                                    <Text style={[st.formulaText, { color: theme.text }]}>{formula}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const st = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginLeft: 14 },
    tabRow: { marginVertical: 16, flexGrow: 0 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 6 },
    section: { borderRadius: 20, padding: 18, marginBottom: 14 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionDot: { width: 8, height: 8, borderRadius: 4 },
    sectionTitle: { fontSize: 15, fontWeight: '800' },
    formulaRow: { paddingVertical: 10 },
    formulaText: { fontSize: 15, fontWeight: '600', fontFamily: 'monospace', letterSpacing: 0.5 },
});
