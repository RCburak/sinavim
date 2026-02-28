export interface User {
    id: string;
    email: string | null;
    name: string | null;
}

export interface BaseResponse {
    status: 'success' | 'error';
    message?: string;
    data?: any;
}

export interface AuthResponse extends BaseResponse {
    user?: User;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface ScheduleItem {
    gun: string;
    task: string;
    duration: string;
    completed: boolean;
    questions: number;
}

export interface Question {
    id: string;
    image_url: string;
    lesson: string;
    topic?: string;
    notes?: string;
    solved: boolean;
    created_at?: string;
}

export interface Analiz {
    id: string | number;
    ad: string;
    net: number;
    type: string;
    date: string;
    [key: string]: any; // Allow extensibility for now
}

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroHook {
    timer: number;
    isActive: boolean;
    mode: PomodoroMode;
    completedSessions: number;
    progress: number;
    toggleTimer: () => void;
    resetTimer: () => void;
    changeMode: (newMode: PomodoroMode) => void;
    formatTime: (s: number) => string;
}

export interface Theme {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    cardShadow?: any;
    [key: string]: any;
}

export interface DashboardViewProps {
    username: string | null;
    onLogout: () => void;
    setView: (view: string) => void;
    schedule: ScheduleItem[];
    analiz: {
        analizler: Analiz[];
        aiYorum: string;
        loading: boolean;
        refreshAnaliz: () => Promise<void>;
        addAnaliz: (ad: string, net: string, type?: string, date?: string | null) => Promise<boolean>;
        deleteAnaliz: (id: number | string) => Promise<boolean>;
    };
    pomodoro: PomodoroHook;
    theme: Theme;
    institution: any; // Keep specific any for now or define if known
    refreshInstitution: () => void;
}

export type AppView =
    | "dashboard"
    | "manual_setup"
    | "pomodoro"
    | "program"
    | "analiz"
    | "profile"
    | "history"
    | "question_pool"
    | "announcements"
    | "friends"
    | "notebook"
    | "exam_calendar"
    | "gamification";
