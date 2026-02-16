import { API_URL, API_HEADERS } from '../config/api';
import { Analiz, BaseResponse } from '../types';

const defaultHeaders = API_HEADERS as HeadersInit;

export const analizService = {
  // 1. Kullanıcıya özel analizleri çeker
  getAll: async (userId: string): Promise<Analiz[]> => {
    try {
      const url = `${API_URL}/analizler/${userId}`;
      console.log("Fetching Analiz URL:", url);
      const response = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders
      });
      if (!response.ok) throw new Error("Veri çekilemedi");
      const data = await response.json();
      return Array.isArray(data) ? data : (data.analizler || []);
    } catch (e) {
      console.error("Analizler çekilemedi:", e);
      return [];
    }
  },

  // 2. Kullanıcıya özel AI yorumunu çeker
  getAIYorum: async (userId: string): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}/ai-yorumla/${userId}`, {
        method: 'GET',
        headers: defaultHeaders
      });
      const data = await response.json();
      return data.yorum || "Verileriniz analiz ediliyor...";
    } catch (e) {
      return "Analiz şu an yapılamıyor.";
    }
  },

  // 3. Yeni analiz ekler (Gelişmiş)
  add: async (ad: string, net: string, userId: string, type: string = "Diğer", date: string | null = null): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/analiz-ekle`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          user_id: userId,
          ad: ad,
          net: parseFloat(net),
          type: type,
          date: date || new Date().toISOString()
        }),
      });
      return response.ok;
    } catch (e) {
      console.error("Analiz ekleme hatası:", e);
      return false;
    }
  },

  // 4. Analiz siler (DÜZELTİLDİ + user_id eklendi)
  delete: async (id: number | string, userId: string): Promise<boolean> => {
    try {
      console.log(`Silme isteği gönderiliyor: ID = ${id}, UserID = ${userId}`);

      const response = await fetch(`${API_URL}/analiz-sil/${id}?user_id=${userId}`, {
        method: 'DELETE',
        headers: defaultHeaders
      });

      if (response.status === 405) {
        console.error("Hata: Backend 'DELETE' metoduna izin vermiyor.");
      }

      console.log(`Silme yanıtı: ${response.status}`);
      return response.ok;
    } catch (e) {
      console.error("Analiz silme servisinde teknik hata:", e);
      return false;
    }
  }
};