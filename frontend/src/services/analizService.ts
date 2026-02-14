import { API_URL, API_HEADERS } from '../config/api';

const defaultHeaders = API_HEADERS;

export const analizService = {
  // 1. Kullanıcıya özel analizleri çeker
  getAll: async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/analizler/${userId}`, {
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
  getAIYorum: async (userId: string) => {
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

  // 3. Yeni analiz ekler
  add: async (ad: string, net: string, userId: string) => {
    try {
      const response = await fetch(`${API_URL}/analiz-ekle`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          user_id: userId,
          ad: ad,
          net: parseFloat(net),
          tarih: new Date().toLocaleDateString('tr-TR')
        }),
      });
      return response.ok;
    } catch (e) {
      console.error("Analiz ekleme hatası:", e);
      return false;
    }
  },

  // 4. Analiz siler (DÜZELTİLDİ)
  delete: async (id: number | string) => {
    try {
      console.log(`Silme isteği gönderiliyor: ID = ${id}`);
      
      const response = await fetch(`${API_URL}/analiz-sil/${id}`, {
        method: 'DELETE', // Backend tarafında methods=['DELETE'] tanımlı olmalı
        headers: defaultHeaders
      });

      // Eğer response 405 (Method Not Allowed) dönüyorsa backend'de DELETE kapalıdır
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