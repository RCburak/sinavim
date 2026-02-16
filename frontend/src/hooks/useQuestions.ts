import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { questionService } from '../services/questionService';
import { auth } from '../services/firebaseConfig';
import { Question } from '../types';

export const useQuestions = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterLesson, setFilterLesson] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'solved' | 'unsolved' | null>('unsolved'); // Default unsolved

    const fetchQuestions = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) return;
        setLoading(true);
        const data = await questionService.getQuestions(user.uid, filterLesson, filterStatus);
        setQuestions(data);
        setLoading(false);
    }, [filterLesson, filterStatus]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const addQuestion = async (imageUri: string, lesson: string, topic: string, notes: string) => {
        const user = auth.currentUser;
        if (!user) return;
        setLoading(true);
        const result = await questionService.addQuestion(user.uid, imageUri, lesson, topic, notes);
        setLoading(false);

        if (result.status === 'success') {
            Alert.alert("Başarılı", "Soru havuza eklendi!");
            fetchQuestions();
            return true;
        } else {
            Alert.alert("Hata", result.message || "Ekleme başarısız.");
            return false;
        }
    };

    const toggleSolved = async (question: Question) => {
        const user = auth.currentUser;
        if (!user) return;

        // Optimistic Update
        const newStatus = !question.solved;
        setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, solved: newStatus } : q));

        const result = await questionService.updateStatus(user.uid, question.id, newStatus);
        if (result.status !== 'success') {
            // Revert callback
            setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, solved: !newStatus } : q));
            Alert.alert("Hata", "Durum güncellenemedi.");
        } else {
            // If we are filtering by status (e.g. only showing unsolved), remove it from view
            if (filterStatus) {
                fetchQuestions();
            }
        }
    };

    const deleteQuestion = async (id: string) => {
        const user = auth.currentUser;
        if (!user) return;

        Alert.alert("Sil", "Bu soruyu silmek istiyor musun?", [
            { text: "Vazgeç", style: "cancel" },
            {
                text: "Sil",
                style: "destructive",
                onPress: async () => {
                    const result = await questionService.deleteQuestion(user.uid, id);
                    if (result.status === 'success') {
                        setQuestions(prev => prev.filter(q => q.id !== id));
                    } else {
                        Alert.alert("Hata", "Silinemedi.");
                    }
                }
            }
        ]);
    };

    return {
        questions,
        loading,
        filterLesson,
        setFilterLesson,
        filterStatus,
        setFilterStatus,
        fetchQuestions,
        addQuestion,
        toggleSolved,
        deleteQuestion
    };
};
