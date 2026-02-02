const API_URL = 'https://sam-unsublimed-unoptimistically.ngrok-free.dev';

export const programService = {
  generateProgram: async (goal: string, hours: number) => {
    const response = await fetch(`${API_URL}/generate-program`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'ngrok-skip-browser-warning': 'true' 
      },
      body: JSON.stringify({ goal, hours }),
    });

    if (!response.ok) throw new Error(`Sunucu Hatası: ${response.status}`);
    
    const data = await response.json();
    
    if (!data.program || !Array.isArray(data.program)) {
      throw new Error("AI geçerli bir program döndüremedi.");
    }

    // Veriyi uygulama formatına burada sokuyoruz (Data Mapping)
    return data.program.map((item: any) => ({ 
      day: item.day || item.gün || "Belirtilmedi",
      task: item.task || item.görev || "Çalışma",
      duration: item.duration || item.süre || "2 Saat",
      completed: false 
    }));
  }
};