const API_URL = "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

export const authService = {
  // Yeni kullanıcıyı backend veritabanına kaydeder
  register: async (userData: any) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (e) {
      return { status: "error", message: "Sunucuya bağlanılamadı." };
    }
  },

  // Kullanıcı bilgilerini backend'de doğrular
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    } catch (e) {
      return { status: "error", message: "Bağlantı hatası." };
    }
  }
};