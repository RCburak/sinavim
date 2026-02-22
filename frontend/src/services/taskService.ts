import { API_URL } from '../config/api';

export const taskService = {
  // Öğrencinin ödevlerini getir
  getStudentTasks: async (studentId: string) => {
    try {
      if (!API_URL) return [];
      const response = await fetch(`${API_URL}/student/tasks/${studentId}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      console.error("Ödev getirme hatası:", e);
      return [];
    }
  }
};