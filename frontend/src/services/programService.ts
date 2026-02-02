const API_URL = 'https://sam-unsublimed-unoptimistically.ngrok-free.dev';

export const programService = {
  generateProgram: async (goal: string, hours: number) => {
    try {
      const response = await fetch(`${API_URL}/generate-program`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'ngrok-skip-browser-warning': 'true' 
        },
        body: JSON.stringify({ goal, hours }),
      });

      const data = await response.json();
      
      if (data.status === "success" && Array.isArray(data.program)) {
        // AI'dan gelen veriyi frontend'in beklediği 'gun' formatına zorluyoruz
        return data.program.map((item: any) => ({ 
          gun: item.gun || item.gün || item.day || "Pazartesi", 
          task: item.task || item.görev || "Çalışma",
          duration: item.duration || item.süre || `${hours} Saat`,
          completed: false 
        }));
      }
      return [];
    } catch (error) {
      console.error("Program çekme hatası:", error);
      return [];
    }
  }
};