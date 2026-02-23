import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { API_URL, API_HEADERS } from '../config/api';

export interface FlashcardItem {
    front: string;
    back: string;
    subject: string;
}

export interface CreateDeckRequest {
    creator_id: string;
    title: string;
    subject: string;
    cards: FlashcardItem[];
}

export interface DuelChallengeRequest {
    challenger_id: string;
    opponent_id: string;
    deck_id: string;
}

export interface DuelSubmissionRequest {
    duel_id: string;
    user_id: string;
    score: number;
    correct_count: number;
    total_count: number;
    time_spent: number;
}

export const flashcardService = {
    createSharedDeck: async (data: CreateDeckRequest) => {
        try {
            const resp = await fetch(`${API_URL}/flashcards/deck`, {
                method: 'POST',
                headers: API_HEADERS,
                body: JSON.stringify(data)
            });
            return await resp.json();
        } catch (e) {
            console.error("Create shared deck error:", e);
            throw e;
        }
    },

    getDeck: async (deckId: string) => {
        try {
            const resp = await fetch(`${API_URL}/flashcards/deck/${deckId}`, {
                headers: API_HEADERS
            });
            return await resp.json();
        } catch (e) {
            console.error("Get deck error:", e);
            throw e;
        }
    },

    challengeFriend: async (data: DuelChallengeRequest) => {
        try {
            const resp = await fetch(`${API_URL}/flashcards/duel/challenge`, {
                method: 'POST',
                headers: API_HEADERS,
                body: JSON.stringify(data)
            });
            return await resp.json();
        } catch (e) {
            console.error("Challenge friend error:", e);
            throw e;
        }
    },

    getUserDuels: async (userId: string) => {
        try {
            const resp = await fetch(`${API_URL}/flashcards/duels/${userId}`, {
                headers: API_HEADERS
            });
            return await resp.json();
        } catch (e) {
            console.error("Get user duels error:", e);
            throw e;
        }
    },

    completeDuel: async (data: DuelSubmissionRequest) => {
        try {
            const resp = await fetch(`${API_URL}/flashcards/duel/complete`, {
                method: 'POST',
                headers: API_HEADERS,
                body: JSON.stringify(data)
            });
            return await resp.json();
        } catch (e) {
            console.error("Complete duel error:", e);
            throw e;
        }
    },

    // --- REAL-TIME BATTLE ARENA METHODS ---

    /**
     * Düello durumunu canlı olarak dinler (Skorlar, HP vb.)
     */
    subscribeToDuel: (duelId: string, onUpdate: (data: any) => void) => {
        const duelRef = doc(db, 'flashcard_duels', duelId);
        return onSnapshot(duelRef, (snapshot) => {
            if (snapshot.exists()) {
                onUpdate({ id: snapshot.id, ...snapshot.data() });
            }
        });
    },

    updateBattleStats: async (duelId: string, userId: string, stats: {
        hp?: number,
        progress: number,
        current_score: number,
        current_answer?: string,
        judgment?: 'correct' | 'wrong' | 'pending'
    }) => {
        try {
            const duelRef = doc(db, 'flashcard_duels', duelId);
            const duelSnap = await getDoc(duelRef);

            if (duelSnap.exists()) {
                const data = duelSnap.data();
                const liveStats = data.live_stats || {};

                // If judgment is provided, it might be the referee updating opponent's stats
                const targetId = (stats.judgment && stats.judgment !== 'pending')
                    ? Object.keys(liveStats).find(id => id !== userId) || userId
                    : userId;

                liveStats[targetId] = {
                    ...liveStats[targetId],
                    ...stats,
                    last_update: new Date().toISOString()
                };

                await updateDoc(duelRef, { live_stats: liveStats });
                return true;
            }
            return false;
        } catch (e) {
            console.error("Update battle stats error:", e);
            return false;
        }
    }
};
