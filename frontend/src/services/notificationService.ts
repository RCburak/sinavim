import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_KEY = '@RCSinavim_Reminders';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export interface Reminder {
    id: string;
    title: string;
    body: string;
    hour: number;
    minute: number;
    weekdays: number[]; // 1=Mon, 7=Sun
    enabled: boolean;
    notificationIds: string[];
}

export const NotificationService = {
    // Request permission
    async requestPermission(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Bildirim İzni', 'Bildirimler için izin vermeniz gerekiyor.');
            return false;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Varsayılan',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
            });
        }

        return true;
    },

    // Schedule a daily reminder
    async scheduleReminder(title: string, body: string, hour: number, minute: number, weekdays: number[]): Promise<string[]> {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) return [];

        const notificationIds: string[] = [];

        for (const weekday of weekdays) {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: 'default',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    weekday,
                    hour,
                    minute,
                },
            });
            notificationIds.push(id);
        }

        return notificationIds;
    },

    // Cancel specific notifications
    async cancelNotifications(ids: string[]) {
        for (const id of ids) {
            await Notifications.cancelScheduledNotificationAsync(id);
        }
    },

    // Send an instant notification (for new announcements)
    async sendInstant(title: string, body: string) {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) return;

        await Notifications.scheduleNotificationAsync({
            content: { title, body, sound: 'default' },
            trigger: null,
        });
    },

    // Save reminders to AsyncStorage
    async saveReminders(reminders: Reminder[]) {
        await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    },

    // Load stored reminders
    async loadReminders(): Promise<Reminder[]> {
        try {
            const raw = await AsyncStorage.getItem(REMINDERS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    // Cancel all scheduled notifications
    async cancelAll() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    },
};
