// frontend/src/services/taskService.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL;

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