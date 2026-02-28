import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@RCSinavim_Gamification';

// ─── TYPES ─────────────────────────────────────────
export type BadgeCategory = 'analiz' | 'study' | 'productivity' | 'level' | 'streak';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    unlocked: boolean;
    unlockedAt?: string;
    condition: string;
    category: BadgeCategory;
}

export interface DailyTask {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    completed: boolean;
    type: 'analiz' | 'study' | 'note' | 'pomodoro' | 'question';
}

export interface GamificationData {
    xp: number;
    level: number;
    totalBadges: number;
    badges: Badge[];
    dailyTasks: DailyTask[];
    dailyTaskDate: string;
    completedTaskIds: string[];
    lastUnlockedBadge: Badge | null;
    showBadgeModal: boolean;
}

// ─── LEVEL SYSTEM ──────────────────────────────────
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

// ─── BADGES ────────────────────────────────────────
const ALL_BADGES: Badge[] = [
    // 📊 Analiz
    { id: 'first_analiz', name: 'İlk Adım', description: 'İlk analizini ekle', icon: '🎯', color: '#3B82F6', unlocked: false, condition: 'İlk analiz kaydı', category: 'analiz' },
    { id: 'analiz_10', name: 'Analiz Canavarı', description: '10 analiz sonucu ekle', icon: '📊', color: '#14B8A6', unlocked: false, condition: '10 analiz', category: 'analiz' },
    { id: 'analiz_25', name: 'Veri Bilimci', description: '25 analiz sonucu ekle', icon: '🔬', color: '#6366F1', unlocked: false, condition: '25 analiz', category: 'analiz' },
    { id: 'net_100', name: 'Yüz Net', description: 'Bir denemede 100+ net yap', icon: '💯', color: '#EF4444', unlocked: false, condition: '100+ net', category: 'analiz' },
    { id: 'net_200', name: 'İki Yüz Net', description: 'Bir denemede 200+ net yap', icon: '🏅', color: '#F59E0B', unlocked: false, condition: '200+ net', category: 'analiz' },

    // ⏱️ Çalışkanlık
    { id: 'pomodoro_5', name: 'Zamanlayıcı', description: '5 pomodoro tamamla', icon: '⏱️', color: '#6366F1', unlocked: false, condition: '5 pomodoro', category: 'study' },
    { id: 'pomodoro_25', name: 'Odak Ustası', description: '25 pomodoro tamamla', icon: '🧘', color: '#8B5CF6', unlocked: false, condition: '25 pomodoro', category: 'study' },
    { id: 'pomodoro_100', name: 'Çalışma Makinesi', description: '100 pomodoro tamamla', icon: '🤖', color: '#7C3AED', unlocked: false, condition: '100 pomodoro', category: 'study' },

    // 📝 Üretkenlik
    { id: 'note_5', name: 'Not Uzmanı', description: '5 not yaz', icon: '📝', color: '#EC4899', unlocked: false, condition: '5 not', category: 'productivity' },
    { id: 'note_20', name: 'Yazı Ustası', description: '20 not yaz', icon: '✍️', color: '#D946EF', unlocked: false, condition: '20 not', category: 'productivity' },
    { id: 'question_10', name: 'Soru Koleksiyoncusu', description: '10 soru havuzuna ekle', icon: '📸', color: '#F43F5E', unlocked: false, condition: '10 soru', category: 'productivity' },
    { id: 'question_50', name: 'Soru Bankası', description: '50 soru havuzuna ekle', icon: '🏦', color: '#E11D48', unlocked: false, condition: '50 soru', category: 'productivity' },
    { id: 'program_complete', name: 'Plan Tamamlayıcı', description: 'Bir programı tamamla', icon: '✅', color: '#10B981', unlocked: false, condition: 'Program tamamla', category: 'productivity' },

    // ⭐ Seviye
    { id: 'level_5', name: 'Seviye 5', description: 'Seviye 5\'e ulaş', icon: '⭐', color: '#F59E0B', unlocked: false, condition: 'Seviye 5', category: 'level' },
    { id: 'level_10', name: 'Çift Haneli', description: 'Seviye 10\'a ulaş', icon: '💎', color: '#3B82F6', unlocked: false, condition: 'Seviye 10', category: 'level' },
    { id: 'level_15', name: 'Efsane', description: 'Seviye 15\'e ulaş', icon: '👑', color: '#8B5CF6', unlocked: false, condition: 'Seviye 15', category: 'level' },
    { id: 'daily_complete', name: 'Tam Gün', description: 'Tüm günlük görevleri bitir', icon: '🌟', color: '#10B981', unlocked: false, condition: 'Tüm günlük görevler', category: 'level' },

    // 🔥 Seri
    { id: 'streak_3', name: '3 Gün Serisi', description: '3 gün üst üste çalış', icon: '🔥', color: '#EF4444', unlocked: false, condition: '3 günlük seri', category: 'streak' },
    { id: 'streak_7', name: 'Haftalık Savaşçı', description: '7 gün üst üste çalış', icon: '⚔️', color: '#F59E0B', unlocked: false, condition: '7 günlük seri', category: 'streak' },
    { id: 'streak_30', name: 'Ay Ustası', description: '30 gün üst üste çalış', icon: '🏆', color: '#10B981', unlocked: false, condition: '30 günlük seri', category: 'streak' },
    { id: 'streak_100', name: 'Yüz Gün Efsanesi', description: '100 gün üst üste çalış', icon: '🐉', color: '#7C3AED', unlocked: false, condition: '100 günlük seri', category: 'streak' },
];

// ─── DAILY TASKS ───────────────────────────────────
const generateDailyTasks = (): DailyTask[] => {
    const allTasks: DailyTask[] = [
        { id: 'daily_analiz', title: 'Analiz Ekle', description: 'Bir deneme sonucu gir', xpReward: 20, completed: false, type: 'analiz' },
        { id: 'daily_note', title: 'Not Al', description: 'Bir not ekle', xpReward: 10, completed: false, type: 'note' },
        { id: 'daily_pomodoro', title: 'Pomodoro', description: 'Bir pomodoro tamamla', xpReward: 25, completed: false, type: 'pomodoro' },
        { id: 'daily_study', title: '30 Dk Çalış', description: '30 dakika çalış', xpReward: 30, completed: false, type: 'study' },
        { id: 'daily_question', title: 'Soru Ekle', description: 'Soru havuzuna bir soru ekle', xpReward: 15, completed: false, type: 'question' },
    ];
    const shuffled = allTasks.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
};

// ─── HELPERS ───────────────────────────────────────
const getLevel = (xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
    }
    return 1;
};

const getXpForNextLevel = (level: number): number => {
    if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 10000;
    return LEVEL_THRESHOLDS[level];
};

const getXpForCurrentLevel = (level: number): number => {
    if (level <= 1) return 0;
    return LEVEL_THRESHOLDS[level - 1];
};

// ─── HOOK ──────────────────────────────────────────
export const useGamification = () => {
    const [data, setData] = useState<GamificationData>({
        xp: 0, level: 1, totalBadges: 0, badges: [...ALL_BADGES],
        dailyTasks: [], dailyTaskDate: '', completedTaskIds: [],
        lastUnlockedBadge: null, showBadgeModal: false,
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed: GamificationData = JSON.parse(raw);
                const today = new Date().toISOString().split('T')[0];
                if (parsed.dailyTaskDate !== today) {
                    parsed.dailyTasks = generateDailyTasks();
                    parsed.dailyTaskDate = today;
                    parsed.completedTaskIds = [];
                }
                // Ensure all badges exist (merge new ones)
                const existingIds = parsed.badges.map(b => b.id);
                ALL_BADGES.forEach(b => {
                    if (!existingIds.includes(b.id)) {
                        parsed.badges.push(b);
                    }
                });
                // Remove deleted badges (flashcard etc)
                const validIds = ALL_BADGES.map(b => b.id);
                parsed.badges = parsed.badges.filter(b => validIds.includes(b.id));
                // Ensure category field exists
                parsed.badges = parsed.badges.map(b => {
                    const template = ALL_BADGES.find(t => t.id === b.id);
                    return { ...b, category: b.category || template?.category || 'level' };
                });
                parsed.lastUnlockedBadge = parsed.lastUnlockedBadge || null;
                parsed.showBadgeModal = false; // reset on load
                setData(parsed);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            } else {
                const initial: GamificationData = {
                    xp: 0, level: 1, totalBadges: 0,
                    badges: [...ALL_BADGES],
                    dailyTasks: generateDailyTasks(),
                    dailyTaskDate: new Date().toISOString().split('T')[0],
                    completedTaskIds: [],
                    lastUnlockedBadge: null,
                    showBadgeModal: false,
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
        if (newLevel >= 5) unlockBadge('level_5', updated);
        if (newLevel >= 10) unlockBadge('level_10', updated);
        if (newLevel >= 15) unlockBadge('level_15', updated);
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
            // Trigger modal
            target.lastUnlockedBadge = { ...badge };
            target.showBadgeModal = true;
            if (!d) save(target);
        }
        return target;
    };

    const dismissBadgeModal = () => {
        save({ ...data, showBadgeModal: false, lastUnlockedBadge: null });
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

        if (updated.dailyTasks.every(t => t.completed)) {
            unlockBadge('daily_complete', updated);
            updated.xp += 20;
        }
        if (updated.level >= 5) unlockBadge('level_5', updated);
        if (updated.level >= 10) unlockBadge('level_10', updated);
        if (updated.level >= 15) unlockBadge('level_15', updated);

        await save(updated);
    };

    const recordAction = async (action: string, count?: number) => {
        const updated = { ...data };
        switch (action) {
            case 'analiz_add':
                unlockBadge('first_analiz', updated);
                if ((count || 0) >= 10) unlockBadge('analiz_10', updated);
                if ((count || 0) >= 25) unlockBadge('analiz_25', updated);
                updated.xp += 15;
                // Auto-complete daily task
                if (!updated.completedTaskIds.includes('daily_analiz')) {
                    const task = updated.dailyTasks.find(t => t.id === 'daily_analiz');
                    if (task) {
                        task.completed = true;
                        updated.completedTaskIds.push('daily_analiz');
                        updated.xp += task.xpReward;
                    }
                }
                break;
            case 'net_100':
                unlockBadge('net_100', updated);
                updated.xp += 50;
                break;
            case 'net_200':
                unlockBadge('net_200', updated);
                updated.xp += 100;
                break;
            case 'note_create':
                if ((count || 0) >= 5) unlockBadge('note_5', updated);
                if ((count || 0) >= 20) unlockBadge('note_20', updated);
                updated.xp += 5;
                if (!updated.completedTaskIds.includes('daily_note')) {
                    const task = updated.dailyTasks.find(t => t.id === 'daily_note');
                    if (task) {
                        task.completed = true;
                        updated.completedTaskIds.push('daily_note');
                        updated.xp += task.xpReward;
                    }
                }
                break;
            case 'pomodoro_complete':
                if ((count || 0) >= 5) unlockBadge('pomodoro_5', updated);
                if ((count || 0) >= 25) unlockBadge('pomodoro_25', updated);
                if ((count || 0) >= 100) unlockBadge('pomodoro_100', updated);
                updated.xp += 20;
                if (!updated.completedTaskIds.includes('daily_pomodoro')) {
                    const task = updated.dailyTasks.find(t => t.id === 'daily_pomodoro');
                    if (task) {
                        task.completed = true;
                        updated.completedTaskIds.push('daily_pomodoro');
                        updated.xp += task.xpReward;
                    }
                }
                break;
            case 'question_add':
                if ((count || 0) >= 10) unlockBadge('question_10', updated);
                if ((count || 0) >= 50) unlockBadge('question_50', updated);
                updated.xp += 10;
                if (!updated.completedTaskIds.includes('daily_question')) {
                    const task = updated.dailyTasks.find(t => t.id === 'daily_question');
                    if (task) {
                        task.completed = true;
                        updated.completedTaskIds.push('daily_question');
                        updated.xp += task.xpReward;
                    }
                }
                break;
            case 'program_complete':
                unlockBadge('program_complete', updated);
                updated.xp += 30;
                break;
            case 'streak_update':
                if ((count || 0) >= 3) unlockBadge('streak_3', updated);
                if ((count || 0) >= 7) unlockBadge('streak_7', updated);
                if ((count || 0) >= 30) unlockBadge('streak_30', updated);
                if ((count || 0) >= 100) unlockBadge('streak_100', updated);
                break;
        }
        // Check daily all-complete
        if (updated.dailyTasks.every(t => t.completed) && !updated.completedTaskIds.includes('_all_done')) {
            unlockBadge('daily_complete', updated);
            updated.xp += 20;
            updated.completedTaskIds.push('_all_done');
        }
        updated.level = getLevel(updated.xp);
        if (updated.level >= 5) unlockBadge('level_5', updated);
        if (updated.level >= 10) unlockBadge('level_10', updated);
        if (updated.level >= 15) unlockBadge('level_15', updated);
        await save(updated);
    };

    return {
        ...data,
        addXp,
        unlockBadge: (id: string) => { unlockBadge(id); },
        completeTask,
        recordAction,
        dismissBadgeModal,
        levelName: LEVEL_NAMES[Math.min(data.level - 1, LEVEL_NAMES.length - 1)],
        xpForNextLevel: getXpForNextLevel(data.level),
        xpForCurrentLevel: getXpForCurrentLevel(data.level),
        xpProgress: data.level >= LEVEL_THRESHOLDS.length ? 1 :
            (data.xp - getXpForCurrentLevel(data.level)) / (getXpForNextLevel(data.level) - getXpForCurrentLevel(data.level)),
        badgeCategories: ['all', 'analiz', 'study', 'productivity', 'level', 'streak'] as const,
        getBadgesByCategory: (cat: string) => {
            if (cat === 'all') return data.badges;
            return data.badges.filter(b => b.category === cat);
        },
    };
};
