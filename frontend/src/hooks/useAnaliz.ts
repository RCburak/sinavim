import { useState } from 'react';
import { Alert } from 'react-native';
import { analizService } from '../services/analizService';

export const useAnaliz = () => {
  const [analizler, setAnalizler] = useState<any[]>([]);
  const [aiYorum, setAiYorum] = useState('Analiz ediliyor...');
  const [loading, setLoading] = useState(false);

  const refreshAnaliz = async () => {
    setLoading(true);
    try {
      const data = await analizService.getAll();
      setAnalizler(data);
      const yorum = await analizService.getAIYorum();
      setAiYorum(yorum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addAnaliz = async (ad: string, net: string) => {
    const success = await analizService.add(ad, net);
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