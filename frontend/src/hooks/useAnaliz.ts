import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analizService } from '../services/analizService';

export const useAnaliz = () => {
  const [analizler, setAnalizler] = useState<any[]>([]);
  const [aiYorum, setAiYorum] = useState('Verileriniz analiz ediliyor...');
  const [loading, setLoading] = useState(false);

  const refreshAnaliz = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('@SınavımAI_UserId');
      if (!userId) return;

      // getAll ve getAIYorum artık userId parametresi almalı
      const data = await analizService.getAll(parseInt(userId));
      setAnalizler(data);
      
      const yorum = await analizService.getAIYorum(parseInt(userId));
      setAiYorum(yorum);
    } catch (e) {
      console.error("Analiz yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  const addAnaliz = async (ad: string, net: string) => {
    const userId = await AsyncStorage.getItem('@SınavımAI_UserId');
    if (!userId) return false;

    // add fonksiyonuna user_id'yi de gönderiyoruz
    const success = await analizService.add(ad, net, parseInt(userId));
    if (success) refreshAnaliz();
    return success;
  };

  const deleteAnaliz = async (id: number) => {
    const success = await analizService.delete(id);
    if (success) refreshAnaliz();
    return success;
  };

  return { analizler, aiYorum, loading, refreshAnaliz, addAnaliz, deleteAnaliz };
};