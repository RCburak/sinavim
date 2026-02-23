import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { auth } from '../services/firebaseConfig';
import { analizService } from '../services/analizService';
import { Analiz } from '../types';

export const useAnaliz = () => {
  const [analizler, setAnalizler] = useState<Analiz[]>([]);
  const [aiYorum, setAiYorum] = useState('Verileriniz analiz ediliyor...');
  const [loading, setLoading] = useState(false);

  const getUserId = (): string | null => {
    return auth.currentUser?.uid || null;
  };

  const lastFetchedUser = useRef<string | null>(null);

  const refreshAnaliz = useCallback(async (force = false) => {
    const userId = getUserId();
    if (!userId) {
      setAnalizler([]);
      setLoading(false);
      return;
    }

    // Prevent redundant fetches for the same user unless forced
    if (!force && lastFetchedUser.current === userId && analizler.length > 0) {
      return;
    }

    setLoading(true);
    try {
      const data = await analizService.getAll(userId);
      setAnalizler(data || []);

      const yorum = await analizService.getAIYorum(userId);
      setAiYorum(yorum || 'Henüz analiz yorumu oluşturulmadı.');

      lastFetchedUser.current = userId;
    } catch (e) {
      console.error("Analiz yükleme hatası:", e);
    } finally {
      setLoading(false);
    }
  }, [analizler.length]);

  useEffect(() => {
    // Auth state değiştiğinde analizleri yükle
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        refreshAnaliz();
      } else {
        lastFetchedUser.current = null;
        setAnalizler([]);
      }
    });
    return () => unsubscribe();
  }, [refreshAnaliz]);

  const addAnaliz = async (ad: string, net: string, type: string = "Diğer", date: string | null = null) => {
    try {
      const userId = getUserId();
      if (!userId) {
        Alert.alert("Hata", "Oturum bulunamadı. Lütfen tekrar giriş yapın.");
        return false;
      }

      const success = await analizService.add(ad, net, userId, type, date);
      if (success) await refreshAnaliz();
      return success;
    } catch (e) {
      console.error("Analiz ekleme hatası:", e);
      return false;
    }
  };

  const deleteAnaliz = async (id: number | string) => {
    try {
      const userId = getUserId();
      if (!userId) {
        Alert.alert("Hata", "Oturum bulunamadı. Silme işlemi yapılamaz.");
        return false;
      }
      const success = await analizService.delete(id, userId);
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