import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = '@RCSinavim_Streak';

interface StreakData {
    currentStreak: number;
    lastActiveDate: string | null;  // YYYY-MM-DD
    longestStreak: number;
    totalActiveDays: number;
}

const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useStreak = (userId: string | undefined) => {
    const [streak, setStreak] = useState<StreakData>({
        currentStreak: 0,
        lastActiveDate: null,
        longestStreak: 0,
        totalActiveDays: 0,
    });

    const storageKey = `${STREAK_KEY}_${userId}`;

    const loadStreak = useCallback(async () => {
        if (!userId) return;
        try {
            const raw = await AsyncStorage.getItem(storageKey);
            if (raw) {
                const data: StreakData = JSON.parse(raw);
                const today = getToday();
                const yesterday = getYesterday();

                // If last active was before yesterday, streak is broken
                if (data.lastActiveDate && data.lastActiveDate !== today && data.lastActiveDate !== yesterday) {
                    data.currentStreak = 0;
                }

                setStreak(data);
            }
        } catch (e) {
            console.error('Streak yükleme hatası:', e);
        }
    }, [userId, storageKey]);

    useEffect(() => {
        loadStreak();
    }, [loadStreak]);

    // Call this when user completes any activity (pomodoro, task, analiz, etc.)
    const recordActivity = useCallback(async () => {
        if (!userId) return;
        try {
            const today = getToday();
            const yesterday = getYesterday();

            setStreak(prev => {
                let newStreak = { ...prev };

                if (prev.lastActiveDate === today) {
                    // Already recorded today
                    return prev;
                }

                if (prev.lastActiveDate === yesterday) {
                    // Consecutive day
                    newStreak.currentStreak = prev.currentStreak + 1;
                } else {
                    // New streak or first day
                    newStreak.currentStreak = 1;
                }

                newStreak.lastActiveDate = today;
                newStreak.totalActiveDays = prev.totalActiveDays + 1;
                newStreak.longestStreak = Math.max(newStreak.currentStreak, prev.longestStreak);

                // Save async
                AsyncStorage.setItem(storageKey, JSON.stringify(newStreak)).catch(console.error);

                return newStreak;
            });
        } catch (e) {
            console.error('Streak kaydetme hatası:', e);
        }
    }, [userId, storageKey]);

    return {
        ...streak,
        recordActivity,
        refreshStreak: loadStreak,
    };
};
