import { useState, useEffect, useRef } from 'react';
import { Alert, Vibration } from 'react-native';
import { PomodoroMode, PomodoroHook } from '../types';

const DURATIONS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const usePomodoro = (): PomodoroHook => {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timer, setTimer] = useState(DURATIONS.focus);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isActive) {
      handleTimerComplete();
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, timer]);

  const handleTimerComplete = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    Vibration.vibrate([500, 500, 500]); // 3 kez titret

    if (mode === 'focus') {
      setCompletedSessions((prev) => prev + 1);
      Alert.alert("Harika İş! 🎉", "Odaklanma süresi bitti. Bir molayı hak ettin!", [
        { text: "Kısa Mola Başlat", onPress: () => changeMode('shortBreak') },
        { text: "Uzun Mola Başlat", onPress: () => changeMode('longBreak') },
        { text: "Tamam" }
      ]);
    } else {
      Alert.alert("Mola Bitti! ☕", "Hadi tekrar odaklanalım!", [
        { text: "Çalışmaya Başla", onPress: () => changeMode('focus') },
        { text: "Tamam" }
      ]);
    }
  };

  const changeMode = (newMode: PomodoroMode) => {
    setMode(newMode);
    setTimer(DURATIONS[newMode]);
    setIsActive(false);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimer(DURATIONS[mode]);
  };

  const formatTime = (s: number) => {
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // İlerleme yüzdesi (Progress Bar için)
  const progress = (DURATIONS[mode] - timer) / DURATIONS[mode];

  return {
    timer,
    isActive,
    mode,
    completedSessions,
    progress,
    toggleTimer,
    resetTimer,
    changeMode,
    formatTime
  };
};