import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Platform, Dimensions, ScrollView, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StudyMode, FOCUS_PRESETS, BREAK_PRESETS, LESSONS } from '../hooks/usePomodoro';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;
const STROKE_WIDTH = 10;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── MODE COLORS ───────────────────────────────────
const MODE_THEMES: Record<string, { gradient: string[]; accent: string; label: string; icon: string }> = {
  focus: { gradient: ['#1A0A3C', '#2D1B69', '#4C1D95'], accent: '#7C3AED', label: 'ODAKLANMA', icon: 'book' },
  shortBreak: { gradient: ['#0A2E1C', '#064E3B', '#065F46'], accent: '#10B981', label: 'KISA MOLA', icon: 'cafe' },
  longBreak: { gradient: ['#0A1E3C', '#1E3A5F', '#1E40AF'], accent: '#3B82F6', label: 'UZUN MOLA', icon: 'moon' },
};

// ─── LESSON COLORS ─────────────────────────────────
const LESSON_COLORS: Record<string, string> = {
  'Matematik': '#3B82F6', 'Fizik': '#EF4444', 'Kimya': '#10B981',
  'Biyoloji': '#F59E0B', 'Türkçe': '#EC4899', 'Tarih': '#8B5CF6',
  'Coğrafya': '#14B8A6', 'Felsefe': '#6366F1', 'İngilizce': '#F97316',
  'Geometri': '#06B6D4', 'Diğer': '#6B7280',
};

export const PomodoroView = ({ onBack, theme, ...pomodoro }: any) => {
  const {
    timer, isActive, mode, progress, formatTime,
    focusDuration, breakDuration, setFocusDuration, setBreakDuration,
    selectedLesson, setSelectedLesson,
    completedSessions, todayStudyMinutes,
    toggleTimer, resetTimer, changeMode,
  } = pomodoro;

  const [settingsVisible, setSettingsVisible] = useState(false);
  const modeTheme = MODE_THEMES[mode] || MODE_THEMES.focus;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={s.container}>
      <LinearGradient colors={modeTheme.gradient as any} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* ═══ TOP BAR ═══ */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.topTitle}>Çalışma Saati</Text>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={s.settingsBtn}>
            <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* ═══ MODE TABS ═══ */}
        <View style={s.modeTabs}>
          {(['focus', 'shortBreak', 'longBreak'] as StudyMode[]).map(m => {
            const active = mode === m;
            const mt = MODE_THEMES[m];
            return (
              <TouchableOpacity
                key={m}
                style={[s.modeTab, active && { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => changeMode(m)}
                disabled={isActive}
              >
                <Ionicons name={mt.icon as any} size={16} color={active ? '#fff' : 'rgba(255,255,255,0.4)'} />
                <Text style={[s.modeTabText, active && { color: '#fff', fontWeight: '800' }]}>{mt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ═══ LESSON CHIP ═══ */}
        {mode === 'focus' && (
          <View style={s.lessonRow}>
            <View style={[s.lessonChip, { backgroundColor: (LESSON_COLORS[selectedLesson] || '#6B7280') + '25' }]}>
              <View style={[s.lessonDot, { backgroundColor: LESSON_COLORS[selectedLesson] || '#6B7280' }]} />
              <Text style={[s.lessonText, { color: '#fff' }]}>{selectedLesson}</Text>
            </View>
          </View>
        )}

        {/* ═══ CIRCULAR CLOCK ═══ */}
        <View style={s.clockContainer}>
          {/* SVG Ring */}
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={s.svgRing}>
            {/* Background ring */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress ring */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={modeTheme.accent}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg>

          {/* Timer Display */}
          <View style={s.timerCenter}>
            <Text style={s.timerText}>{formatTime(timer)}</Text>
            <Text style={s.timerLabel}>{modeTheme.label}</Text>
          </View>
        </View>

        {/* ═══ CONTROLS ═══ */}
        <View style={s.controls}>
          <TouchableOpacity style={s.controlBtn} onPress={resetTimer}>
            <Ionicons name="refresh" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.playBtn, { backgroundColor: modeTheme.accent }]}
            onPress={toggleTimer}
            activeOpacity={0.8}
          >
            <Ionicons name={isActive ? 'pause' : 'play'} size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.controlBtn} onPress={() => changeMode(mode === 'focus' ? 'shortBreak' : 'focus')}>
            <Ionicons name="swap-horizontal" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* ═══ TODAY STATS ═══ */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Ionicons name="flame" size={18} color="#F59E0B" />
            <Text style={s.statValue}>{completedSessions}</Text>
            <Text style={s.statLabel}>Oturum</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Ionicons name="time" size={18} color="#10B981" />
            <Text style={s.statValue}>{todayStudyMinutes}dk</Text>
            <Text style={s.statLabel}>Bugün</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Ionicons name="book" size={18} color="#3B82F6" />
            <Text style={s.statValue}>{focusDuration}dk</Text>
            <Text style={s.statLabel}>Hedef</Text>
          </View>
        </View>

      </SafeAreaView>

      {/* ═══ SETTINGS MODAL ═══ */}
      <Modal visible={settingsVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
            <View style={s.modalHandle} />
            <Text style={[s.modalTitle, { color: theme.text }]}>Çalışma Ayarları</Text>

            {/* Focus Duration */}
            <Text style={[s.settingLabel, { color: theme.textSecondary }]}>
              <Ionicons name="book" size={14} color="#7C3AED" />  Odaklanma Süresi
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.presetsScroll}>
              {FOCUS_PRESETS.map(min => (
                <TouchableOpacity
                  key={min}
                  style={[s.presetChip, focusDuration === min && { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }, focusDuration !== min && { borderColor: theme.border }]}
                  onPress={() => setFocusDuration(min)}
                >
                  <Text style={[s.presetText, { color: focusDuration === min ? '#fff' : theme.text }]}>{min}dk</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Break Duration */}
            <Text style={[s.settingLabel, { color: theme.textSecondary }]}>
              <Ionicons name="cafe" size={14} color="#10B981" />  Mola Süresi
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.presetsScroll}>
              {BREAK_PRESETS.map(min => (
                <TouchableOpacity
                  key={min}
                  style={[s.presetChip, breakDuration === min && { backgroundColor: '#10B981', borderColor: '#10B981' }, breakDuration !== min && { borderColor: theme.border }]}
                  onPress={() => setBreakDuration(min)}
                >
                  <Text style={[s.presetText, { color: breakDuration === min ? '#fff' : theme.text }]}>{min}dk</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Lesson Selection */}
            <Text style={[s.settingLabel, { color: theme.textSecondary }]}>
              <Ionicons name="school" size={14} color="#3B82F6" />  Çalışılan Ders
            </Text>
            <View style={s.lessonGrid}>
              {LESSONS.map(lesson => {
                const active = selectedLesson === lesson;
                const color = LESSON_COLORS[lesson] || '#6B7280';
                return (
                  <TouchableOpacity
                    key={lesson}
                    style={[s.lessonBtn, active && { backgroundColor: color, borderColor: color }, !active && { borderColor: theme.border }]}
                    onPress={() => setSelectedLesson(lesson)}
                  >
                    <Text style={[s.lessonBtnText, { color: active ? '#fff' : theme.text }]}>{lesson}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Close */}
            <TouchableOpacity
              style={[s.closeModalBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => setSettingsVisible(false)}
            >
              <Text style={s.closeModalText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── STYLES ────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // Top Bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  settingsBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

  // Mode Tabs
  modeTabs: { flexDirection: 'row', marginHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 4, marginBottom: 8 },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
  modeTabText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },

  // Lesson
  lessonRow: { alignItems: 'center', marginBottom: 4 },
  lessonChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, gap: 8 },
  lessonDot: { width: 8, height: 8, borderRadius: 4 },
  lessonText: { fontSize: 13, fontWeight: '700' },

  // Clock
  clockContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  svgRing: { position: 'absolute' },
  timerCenter: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, justifyContent: 'center', alignItems: 'center' },
  timerText: { color: '#fff', fontSize: 64, fontWeight: '200', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-thin' },
  timerLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700', letterSpacing: 4, marginTop: 4 },

  // Controls
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 8 },
  controlBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },

  // Stats
  statsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 32, marginTop: 24, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingVertical: 16 },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  settingLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 16 },
  presetsScroll: { marginBottom: 8, flexGrow: 0 },
  presetChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, marginRight: 10 },
  presetText: { fontSize: 14, fontWeight: '700' },
  lessonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  lessonBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
  lessonBtnText: { fontSize: 12, fontWeight: '600' },
  closeModalBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  closeModalText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});