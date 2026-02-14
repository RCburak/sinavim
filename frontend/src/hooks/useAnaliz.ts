import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { auth } from '../services/firebaseConfig';
import { analizService } from '../services/analizService';

export const useAnaliz = () => {
  const [analizler, setAnalizler] = useState<any[]>([]);
  const [aiYorum, setAiYorum] = useState('Verileriniz analiz ediliyor...');
  const [loading, setLoading] = useState(false);

  const getUserId = (): string | null => {
    return auth.currentUser?.uid || null;
  };

  const refreshAnaliz = useCallback(async () => {
    setLoading(true);
    try {
      const userId = getUserId();
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
  }, []);

  useEffect(() => {
    // Auth state değiştiğinde analizleri yükle
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        refreshAnaliz();
      } else {
        setAnalizler([]);
      }
    });
    return () => unsubscribe();
  }, [refreshAnaliz]);

  const addAnaliz = async (ad: string, net: string) => {
    try {
      const userId = getUserId();
      if (!userId) {
        Alert.alert("Hata", "Oturum bulunamadı. Lütfen tekrar giriş yapın.");
        return false;
      }

      const success = await analizService.add(ad, net, userId);
      if (success) await refreshAnaliz();
      return success;
    } catch (e) {
      console.error("Analiz ekleme hatası:", e);
      return false;
    }
  };

  const deleteAnaliz = async (id: number | string) => {
    try {
      const success = await analizService.delete(id);
      if (success) {
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