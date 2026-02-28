import { useState, useEffect, useRef, useCallback } from 'react';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── TYPES ─────────────────────────────────────────
export type StudyMode = 'focus' | 'shortBreak' | 'longBreak';

export interface StudySession {
  id: string;
  lesson: string;
  duration: number;       // seconds studied
  targetDuration: number; // seconds target
  date: string;           // ISO date
}

export interface StudyTimerHook {
  // Timer state
  timer: number;
  isActive: boolean;
  mode: StudyMode;
  progress: number;

  // Custom duration (minutes)
  focusDuration: number;
  breakDuration: number;
  setFocusDuration: (min: number) => void;
  setBreakDuration: (min: number) => void;

  // Lesson tracking
  selectedLesson: string;
  setSelectedLesson: (lesson: string) => void;

  // Session stats
  completedSessions: number;
  todayStudyMinutes: number;
  sessions: StudySession[];

  // Controls
  toggleTimer: () => void;
  resetTimer: () => void;
  changeMode: (m: StudyMode) => void;
  formatTime: (s: number) => string;
}

// ─── PRESET DURATIONS ──────────────────────────────
export const FOCUS_PRESETS = [15, 25, 30, 45, 60, 90, 120];
export const BREAK_PRESETS = [5, 10, 15, 20];
export const LESSONS = [
  'Matematik', 'Fizik', 'Kimya', 'Biyoloji',
  'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe',
  'İngilizce', 'Geometri', 'Diğer',
];

const STORAGE_KEY = '@RCSinavim_StudySessions';

// ─── HOOK ──────────────────────────────────────────
export const usePomodoro = (): StudyTimerHook => {
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [selectedLesson, setSelectedLesson] = useState('Matematik');
  const [mode, setMode] = useState<StudyMode>('focus');
  const [timer, setTimer] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  const intervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  // Load sessions on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        const all: StudySession[] = JSON.parse(raw);
        setSessions(all);
        // Count today's completed sessions
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = all.filter(s => s.date.startsWith(today));
        setCompletedSessions(todaySessions.length);
      }
    }).catch(() => { });
  }, []);

  // Timer logic
  useEffect(() => {
    if (isActive && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0 && isActive) {
      handleTimerComplete();
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timer]);

  const handleTimerComplete = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    Vibration.vibrate([500, 500, 500]);

    if (mode === 'focus') {
      // Save completed session
      const session: StudySession = {
        id: Date.now().toString(),
        lesson: selectedLesson,
        duration: focusDuration * 60,
        targetDuration: focusDuration * 60,
        date: new Date().toISOString(),
      };

      const newSessions = [session, ...sessions];
      setSessions(newSessions);
      setCompletedSessions(prev => prev + 1);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions.slice(0, 200))).catch(() => { });

      // Auto-switch to break
      const breakTime = breakDuration * 60;
      setMode('shortBreak');
      setTimer(breakTime);
    } else {
      // Break finished — switch back to focus
      setMode('focus');
      setTimer(focusDuration * 60);
    }
  }, [mode, focusDuration, breakDuration, selectedLesson, sessions]);

  const changeMode = useCallback((newMode: StudyMode) => {
    setIsActive(false);
    clearInterval(intervalRef.current);
    setMode(newMode);
    if (newMode === 'focus') {
      setTimer(focusDuration * 60);
    } else if (newMode === 'shortBreak') {
      setTimer(breakDuration * 60);
    } else {
      setTimer(breakDuration * 2 * 60); // Long break = 2x break
    }
  }, [focusDuration, breakDuration]);

  const toggleTimer = useCallback(() => {
    if (!isActive) {
      startTimeRef.current = Date.now();
    }
    setIsActive(prev => !prev);
  }, [isActive]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    clearInterval(intervalRef.current);
    if (mode === 'focus') {
      setTimer(focusDuration * 60);
    } else {
      setTimer(breakDuration * 60);
    }
  }, [mode, focusDuration, breakDuration]);

  const formatTime = useCallback((s: number) => {
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Update timer when duration changes (only when not active)
  useEffect(() => {
    if (!isActive && mode === 'focus') {
      setTimer(focusDuration * 60);
    }
  }, [focusDuration, isActive, mode]);

  useEffect(() => {
    if (!isActive && mode !== 'focus') {
      setTimer(breakDuration * 60);
    }
  }, [breakDuration, isActive, mode]);

  // Calculate progress
  const totalDuration = mode === 'focus' ? focusDuration * 60 : breakDuration * 60;
  const progress = totalDuration > 0 ? (totalDuration - timer) / totalDuration : 0;

  // Calculate today's total study minutes
  const today = new Date().toISOString().split('T')[0];
  const todayStudyMinutes = sessions
    .filter(s => s.date.startsWith(today))
    .reduce((sum, s) => sum + Math.round(s.duration / 60), 0);

  return {
    timer,
    isActive,
    mode,
    progress,
    focusDuration,
    breakDuration,
    setFocusDuration,
    setBreakDuration,
    selectedLesson,
    setSelectedLesson,
    completedSessions,
    todayStudyMinutes,
    sessions,
    toggleTimer,
    resetTimer,
    changeMode,
    formatTime,
  };
};