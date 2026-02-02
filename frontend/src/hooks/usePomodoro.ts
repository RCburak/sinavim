import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export const usePomodoro = () => {
  const [timer, setTimer] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && timer > 0) {
      intervalRef.current = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      clearInterval(intervalRef.current);
      setIsActive(false);
      const nextMode = !isBreak;
      setIsBreak(nextMode);
      setTimer(nextMode ? 5 * 60 : 25 * 60);
      Alert.alert(nextMode ? "Mola Bitti! ☕" : "Çalışma Bitti! 💪");
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timer, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setTimer(isBreak ? 5 * 60 : 25 * 60);
    setIsActive(false);
  };

  const formatTime = (s: number) => 
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return { timer, isActive, isBreak, toggleTimer, resetTimer, formatTime };
};