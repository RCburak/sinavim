const API_URL = 'https://sam-unsublimed-unoptimistically.ngrok-free.dev';
const headers = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
};

export const analizService = {
  // Tüm analizleri getir
  getAll: async () => {
    const res = await fetch(`${API_URL}/analizler`, { headers });
    return await res.json();
  },

  // Yeni analiz ekle
  add: async (ad: string, net: string) => {
    const yeni = { 
      ad, 
      net: parseFloat(net), 
      tarih: new Date().toLocaleDateString('tr-TR') 
    };
    const res = await fetch(`${API_URL}/analiz-ekle`, {
      method: 'POST',
      headers,
      body: JSON.stringify(yeni),
    });
    return res.ok;
  },

  // Analiz sil
  delete: async (id: number) => {
    const res = await fetch(`${API_URL}/analiz-sil/${id}`, { 
      method: 'DELETE', 
      headers 
    });
    return res.ok;
  },

  // AI Yorumu al
  getAIYorum: async () => {
    const res = await fetch(`${API_URL}/ai-yorumla`, { headers });
    const data = await res.json();
    return data.yorum;
  }
};