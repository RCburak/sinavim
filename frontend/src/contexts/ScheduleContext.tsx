import React, { createContext, useContext, useState, useCallback } from "react";
import { auth } from "../services/firebaseConfig";
import { API_URL, API_HEADERS } from "../config/api";

import { ScheduleItem } from '../types';

interface ScheduleContextType {
  schedule: ScheduleItem[];
  loadProgram: (uid: string) => Promise<void>;
  saveScheduleToCloud: (newSchedule: ScheduleItem[]) => Promise<Response | void>;
  toggleTask: (index: number) => Promise<void>;
  updateQuestions: (index: number, count: string) => Promise<void>;
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
}

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

  const loadProgram = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      const response = await fetch(`${API_URL}/get-program/${uid}`, {
        headers: API_HEADERS as HeadersInit,
      });
      if (response.status === 404) {
        setSchedule([]);
        return;
      }
      const cloudProg = await response.json();
      if (cloudProg && Array.isArray(cloudProg)) {
        setSchedule(
          cloudProg.map((item: any) => ({
            gun: item.gun || "Pazartesi",
            task: item.task || "Ders",
            duration: item.duration || "1 Saat",
            completed: item.completed === 1 || item.completed === true,
            questions: item.questions || 0,
          }))
        );
      }
    } catch {
      setSchedule([]);
    }
  }, []);

  const saveScheduleToCloud = useCallback(
    async (newSchedule: ScheduleItem[]) => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        return await fetch(`${API_URL}/save-program`, {
          method: "POST",
          headers: API_HEADERS as HeadersInit,
          body: JSON.stringify({ user_id: user.uid, program: newSchedule }),
        });
      } catch (e) {
        console.error("Buluta kaydetme hatası:", e);
      }
    },
    []
  );

  const toggleTask = useCallback(
    async (index: number) => {
      const newSchedule = [...schedule];
      if (!newSchedule[index]) return;
      newSchedule[index].completed = !newSchedule[index].completed;
      setSchedule(newSchedule);
      await saveScheduleToCloud(newSchedule);
    },
    [schedule, saveScheduleToCloud]
  );

  const updateQuestions = useCallback(
    async (index: number, count: string) => {
      if (index === undefined || index === null) return;
      const qCount = parseInt(count, 10) || 0;
      const newSchedule = [...schedule];
      if (!newSchedule[index]) return;
      newSchedule[index].questions = qCount;
      setSchedule(newSchedule);
      await saveScheduleToCloud(newSchedule);
    },
    [schedule, saveScheduleToCloud]
  );

  return (
    <ScheduleContext.Provider
      value={{
        schedule,
        setSchedule,
        loadProgram,
        saveScheduleToCloud,
        toggleTask,
        updateQuestions,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
  return ctx;
}
