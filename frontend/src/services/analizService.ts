const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

// Profesyonel Header Yapısı: Ngrok engellerini aşmak için
const defaultHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true' 
};

export const analizService = {
  // 1. Kullanıcıya özel analizleri çeker
  getAll: async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/analizler/${userId}`, {
        method: 'GET',
        headers: defaultHeaders
      });
      if (!response.ok) throw new Error("Veri çekilemedi");
      return await response.json();
    } catch (e) {
      console.error("Analizler çekilemedi:", e);
      return [];
    }
  },

  // 2. Kullanıcıya özel AI yorumunu çeker
  getAIYorum: async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/ai-yorumla/${userId}`, {
        method: 'GET',
        headers: defaultHeaders
      });
      const data = await response.json();
      return data.yorum || "Veri yetersiz.";
    } catch (e) {
      return "Analiz şu an yapılamıyor.";
    }
  },

  // 3. Yeni analiz ekler (user_id ile birlikte)
  add: async (ad: string, net: string, userId: number) => {
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

  // 4. Analiz siler
  delete: async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/analiz-sil/${id}`, {
        method: 'DELETE',
        headers: defaultHeaders
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
};