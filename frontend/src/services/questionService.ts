import { API_URL, API_HEADERS } from '../config/api';
import { BaseResponse, Question } from '../types';

export const questionService = {
    // 1. Soru Ekle (Image + Data)
    addQuestion: async (userId: string, imageUri: string, lesson: string, topic: string = '', notes: string = ''): Promise<BaseResponse> => {
        try {
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('lesson', lesson);
            formData.append('topic', topic);
            formData.append('notes', notes);

            const filename = imageUri.split('/').pop() || 'question.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('image', {
                uri: imageUri,
                name: filename,
                type: type,
            } as any);

            const response = await fetch(`${API_URL}/questions/add`, {
                method: 'POST',
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                },
                body: formData,
            });

            const responseText = await response.text();
            try {
                return JSON.parse(responseText);
            } catch (e) {
                console.error("JSON Parse Hatası. Gelen yanıt:", responseText);
                return { status: 'error', message: 'Sunucudan geçersiz yanıt geldi.' };
            }
        } catch (error) {
            console.error("Soru ekleme hatasi:", error);
            return { status: 'error', message: 'Sunucu hatası' };
        }
    },

    // 2. Sorulari Getir
    getQuestions: async (userId: string, lesson?: string | null, status?: 'solved' | 'unsolved' | null): Promise<Question[]> => {
        try {
            let url = `${API_URL}/questions/${userId}`;
            const params = new URLSearchParams();
            if (lesson) params.append('lesson', lesson);
            if (status) params.append('status', status);

            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, { headers: API_HEADERS as HeadersInit });
            const result = await response.json();

            if (result.status === 'success' && result.data && Array.isArray(result.data.questions)) {
                return result.data.questions;
            }
            // Eski API formatı veya hata durumu için fallback
            return Array.isArray(result) ? result : (result.questions || []);
        } catch (error) {
            console.error("Soru getirme hatasi:", error);
            return [];
        }
    },

    // 3. Durum Guncelle
    updateStatus: async (userId: string, questionId: string, solved: boolean): Promise<BaseResponse> => {
        try {
            const response = await fetch(`${API_URL}/questions/${questionId}/status`, {
                method: 'PUT',
                headers: API_HEADERS as HeadersInit,
                body: JSON.stringify({ user_id: userId, solved }),
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: 'Hata oluştu' };
        }
    },

    // 4. Sil
    deleteQuestion: async (userId: string, questionId: string): Promise<BaseResponse> => {
        try {
            const response = await fetch(`${API_URL}/questions/${questionId}?user_id=${userId}`, {
                method: 'DELETE',
                headers: API_HEADERS as HeadersInit,
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: 'Hata oluştu' };
        }
    }
};

