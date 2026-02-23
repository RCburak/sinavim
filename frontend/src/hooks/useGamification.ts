import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@RCSinavim_Gamification';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // emoji
    color: string;
    unlocked: boolean;
    unlockedAt?: string;
    condition: string; // human-readable
}

export interface DailyTask {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    completed: boolean;
    type: 'analiz' | 'study' | 'flashcard' | 'note' | 'pomodoro';
}

export interface GamificationData {
    xp: number;
    level: number;
    totalBadges: number;
    badges: Badge[];
    dailyTasks: DailyTask[];
    dailyTaskDate: string;
    completedTaskIds: string[];
}

const LEVEL_THRESHOLDS = [
    0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000,
    5000, 6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000,
];

const LEVEL_NAMES = [
    'Çaylak', 'Acemi', 'Öğrenci', 'Çalışkan', 'Düzenli',
    'Kararlı', 'Azimli', 'Başarılı', 'Uzman', 'Usta',
    'Lider', 'Efsane', 'Deha', 'Dahi', 'Bilge',
    'Sınav Savaşçısı', 'YKS Gazisi', 'Derece Avcısı', 'Şampiyon', 'Efsanevi',
];

const ALL_BADGES: Badge[] = [
    { id: 'first_analiz', name: 'İlk Adım', description: 'İlk analizini ekle', icon: '🎯', color: '#3B82F6', unlocked: false, condition: 'İlk analiz kaydı' },
    { id: 'streak_3', name: '3 Gün Serisi', description: '3 gün üst üste çalış', icon: '🔥', color: '#EF4444', unlocked: false, condition: '3 günlük seri' },
    { id: 'streak_7', name: 'Haftalık Savaşçı', description: '7 gün üst üste çalış', icon: '⚔️', color: '#F59E0B', unlocked: false, condition: '7 günlük seri' },
    { id: 'streak_30', name: 'Ay Ustası', description: '30 gün üst üste çalış', icon: '🏆', color: '#10B981', unlocked: false, condition: '30 günlük seri' },
    { id: 'flashcard_10', name: 'Kart Koleksiyoncusu', description: '10 flashcard oluştur', icon: '🃏', color: '#8B5CF6', unlocked: false, condition: '10 flashcard' },
    { id: 'note_5', name: 'Not Defteri Uzmanı', description: '5 not yaz', icon: '📝', color: '#EC4899', unlocked: false, condition: '5 not' },
    { id: 'analiz_10', name: 'Analiz Canavarı', description: '10 analiz sonucu ekle', icon: '📊', color: '#14B8A6', unlocked: false, condition: '10 analiz' },
    { id: 'pomodoro_5', name: 'Zamanlayıcı', description: '5 pomodoro tamamla', icon: '⏱️', color: '#6366F1', unlocked: false, condition: '5 pomodoro' },
    { id: 'level_5', name: 'Seviye 5', description: 'Seviye 5\'e ulaş', icon: '⭐', color: '#F59E0B', unlocked: false, condition: 'Seviye 5' },
    { id: 'level_10', name: 'Çift Haneli', description: 'Seviye 10\'a ulaş', icon: '💎', color: '#3B82F6', unlocked: false, condition: 'Seviye 10' },
    { id: 'daily_complete', name: 'Tam Gün', description: 'Tüm günlük görevleri bitir', icon: '✅', color: '#10B981', unlocked: false, condition: 'Tüm günlük görevler' },
    { id: 'net_100', name: 'Yüz Net', description: 'Bir denemede 100+ net yap', icon: '💯', color: '#EF4444', unlocked: false, condition: '100+ net' },
];

const generateDailyTasks = (): DailyTask[] => {
    const allTasks: DailyTask[] = [
        { id: 'daily_analiz', title: 'Analiz Ekle', description: 'Bir deneme sonucu gir', xpReward: 20, completed: false, type: 'analiz' },
        { id: 'daily_flashcard', title: 'Flashcard Çalış', description: '5 flashcard tekrar et', xpReward: 15, completed: false, type: 'flashcard' },
        { id: 'daily_note', title: 'Not Al', description: 'Bir not ekle', xpReward: 10, completed: false, type: 'note' },
        { id: 'daily_pomodoro', title: 'Pomodoro', description: 'Bir pomodoro tamamla', xpReward: 25, completed: false, type: 'pomodoro' },
        { id: 'daily_study', title: '30 Dk Çalış', description: '30 dakika çalış', xpReward: 30, completed: false, type: 'study' },
    ];
    // Pick 3 random tasks
    const shuffled = allTasks.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
};

const getLevel = (xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
    }
    return 1;
};

const getXpForNextLevel = (level: number): number => {
    if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 10000;
    return LEVEL_THRESHOLDS[level]; // next level threshold
};

const getXpForCurrentLevel = (level: number): number => {
    if (level <= 1) return 0;
    return LEVEL_THRESHOLDS[level - 1];
};

export const useGamification = () => {
    const [data, setData] = useState<GamificationData>({
        xp: 0, level: 1, totalBadges: 0, badges: [...ALL_BADGES],
        dailyTasks: [], dailyTaskDate: '', completedTaskIds: [],
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed: GamificationData = JSON.parse(raw);
                // Check if daily tasks need refresh
                const today = new Date().toISOString().split('T')[0];
                if (parsed.dailyTaskDate !== today) {
                    parsed.dailyTasks = generateDailyTasks();
                    parsed.dailyTaskDate = today;
                    parsed.completedTaskIds = [];
                }
                // Ensure all badges exist
                const existingIds = parsed.badges.map(b => b.id);
                ALL_BADGES.forEach(b => {
                    if (!existingIds.includes(b.id)) {
                        parsed.badges.push(b);
                    }
                });
                setData(parsed);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            } else {
                const initial: GamificationData = {
                    xp: 0, level: 1, totalBadges: 0,
                    badges: [...ALL_BADGES],
                    dailyTasks: generateDailyTasks(),
                    dailyTaskDate: new Date().toISOString().split('T')[0],
                    completedTaskIds: [],
                };
                setData(initial);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
            }
        } catch { }
    };

    const save = async (newData: GamificationData) => {
        setData(newData);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    };

    const addXp = async (amount: number) => {
        const newXp = data.xp + amount;
        const newLevel = getLevel(newXp);
        const updated = { ...data, xp: newXp, level: newLevel };
        // Check level badges
        if (newLevel >= 5) unlockBadge('level_5', updated);
        if (newLevel >= 10) unlockBadge('level_10', updated);
        await save(updated);
        return { levelUp: newLevel > data.level, newLevel };
    };

    const unlockBadge = (id: string, d?: GamificationData) => {
        const target = d || { ...data };
        const badge = target.badges.find(b => b.id === id);
        if (badge && !badge.unlocked) {
            badge.unlocked = true;
            badge.unlockedAt = new Date().toISOString();
            target.totalBadges = target.badges.filter(b => b.unlocked).length;
            if (!d) save(target);
        }
        return target;
    };

    const completeTask = async (taskId: string) => {
        if (data.completedTaskIds.includes(taskId)) return;
        const task = data.dailyTasks.find(t => t.id === taskId);
        if (!task) return;

        const updated = { ...data };
        updated.completedTaskIds = [...updated.completedTaskIds, taskId];
        updated.dailyTasks = updated.dailyTasks.map(t =>
            t.id === taskId ? { ...t, completed: true } : t
        );
        updated.xp += task.xpReward;
        updated.level = getLevel(updated.xp);

        // Check if all daily tasks completed
        if (updated.dailyTasks.every(t => t.completed)) {
            unlockBadge('daily_complete', updated);
            updated.xp += 20; // bonus
        }
        if (updated.level >= 5) unlockBadge('level_5', updated);
        if (updated.level >= 10) unlockBadge('level_10', updated);

        await save(updated);
    };

    const recordAction = async (action: string, count?: number) => {
        const updated = { ...data };
        switch (action) {
            case 'analiz_add':
                unlockBadge('first_analiz', updated);
                if ((count || 0) >= 10) unlockBadge('analiz_10', updated);
                updated.xp += 15;
                break;
            case 'flashcard_create':
                if ((count || 0) >= 10) unlockBadge('flashcard_10', updated);
                updated.xp += 5;
                break;
            case 'flashcard_duel_win':
                updated.xp += 30 + (count || 0); // Bonus based on score
                break;
            case 'note_create':
                if ((count || 0) >= 5) unlockBadge('note_5', updated);
                updated.xp += 5;
                break;
            case 'pomodoro_complete':
                if ((count || 0) >= 5) unlockBadge('pomodoro_5', updated);
                updated.xp += 20;
                break;
            case 'streak_update':
                if ((count || 0) >= 3) unlockBadge('streak_3', updated);
                if ((count || 0) >= 7) unlockBadge('streak_7', updated);
                if ((count || 0) >= 30) unlockBadge('streak_30', updated);
                break;
            case 'net_100':
                unlockBadge('net_100', updated);
                updated.xp += 50;
                break;
        }
        updated.level = getLevel(updated.xp);
        if (updated.level >= 5) unlockBadge('level_5', updated);
        if (updated.level >= 10) unlockBadge('level_10', updated);
        await save(updated);
    };

    return {
        ...data,
        addXp,
        unlockBadge: (id: string) => { unlockBadge(id); },
        completeTask,
        recordAction,
        levelName: LEVEL_NAMES[Math.min(data.level - 1, LEVEL_NAMES.length - 1)],
        xpForNextLevel: getXpForNextLevel(data.level),
        xpForCurrentLevel: getXpForCurrentLevel(data.level),
        xpProgress: data.level >= LEVEL_THRESHOLDS.length ? 1 :
            (data.xp - getXpForCurrentLevel(data.level)) / (getXpForNextLevel(data.level) - getXpForCurrentLevel(data.level)),
    };
};
