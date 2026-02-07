import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analizService } from '../services/analizService';

export const useAnaliz = () => {
  const [analizler, setAnalizler] = useState<any[]>([]);
  const [aiYorum, setAiYorum] = useState('Verileriniz analiz ediliyor...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshAnaliz();
  }, []);

  const refreshAnaliz = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('@SınavımAI_UserId');
      if (!userId) {
        setLoading(false);
        return;
      }

      const data = await analizService.getAll(userId);
      setAnalizler(data || []);
      
      const yorum = await analizService.getAIYorum(userId);
      setAiYorum(yorum || 'Henüz analiz yorumu oluşturulmadı.');
    } catch (e) {
      console.error("Analiz yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  const addAnaliz = async (ad: string, net: string) => {
    try {
      const userId = await AsyncStorage.getItem('@SınavımAI_UserId');
      if (!userId) return false;

      const success = await analizService.add(ad, net, userId);
      if (success) await refreshAnaliz();
      return success;
    } catch (e) {
      return false;
    }
  };

  const deleteAnaliz = async (id: number) => {
    try {
      // Önce bir onay kutusu çıkaralım (isteğe bağlı ama güvenli)
      const success = await analizService.delete(id);
      if (success) {
        // State'i anında güncelle (Sayfa yenilenmeden listeden silinsin)
        setAnalizler(prev => prev.filter(item => item.id !== id));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Silme hatası:", e);
      return false;
    }
  };

  return { analizler, aiYorum, loading, refreshAnaliz, addAnaliz, deleteAnaliz };
};