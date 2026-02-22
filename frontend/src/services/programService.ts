import { API_URL, API_HEADERS } from '../config/api';
import { ScheduleItem } from '../types';

export const programService = {
  generateProgram: async (goal: string, hours: number): Promise<ScheduleItem[]> => {
    try {
      const response = await fetch(`${API_URL}/generate-program`, {
        method: 'POST',
        headers: API_HEADERS as HeadersInit,
        body: JSON.stringify({ goal, hours }),
      });

      const data = await response.json();

      if (data.status === "success" && Array.isArray(data.program)) {
        // AI'dan gelen veriyi frontend'in beklediği 'gun' formatına zorluyoruz
        return data.program.map((item: any): ScheduleItem => ({
          gun: item.gun || item.gün || item.day || "Pazartesi",
          task: item.task || item.görev || "Çalışma",
          duration: item.duration || item.süre || `${hours} Saat`,
          completed: false,
          questions: item.questions || 0
        }));
      }
      return [];
    } catch (error) {
      console.error("Program çekme hatası:", error);
      return [];
    }
  }
};