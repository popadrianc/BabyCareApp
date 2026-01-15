import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export interface NotificationSettings {
  sleepReminders: boolean;
  feedingReminders: boolean;
  diaperReminders: boolean;
}

// Configure notification behavior - only on native platforms
let notificationHandlerSet = false;

export function setupNotificationHandler() {
  if (notificationHandlerSet || Platform.OS === 'web') return;
  
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerSet = true;
  } catch (error) {
    console.log('Failed to setup notification handler:', error);
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    setupNotificationHandler();
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.log('Failed to request notification permissions:', error);
    return false;
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.log('Failed to get notification settings:', error);
  }
  
  return {
    sleepReminders: true,
    feedingReminders: true,
    diaperReminders: true,
  };
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.log('Failed to save notification settings:', error);
  }
}

export async function scheduleSleepReminder(
  babyName: string,
  nextNapTime: Date,
  wakeWindowMinutes: number
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  
  try {
    const settings = await getNotificationSettings();
    if (!settings.sleepReminders) return null;

    // Cancel existing sleep reminders
    await cancelSleepReminders();

    // Schedule reminder 10 minutes before predicted nap time
    const reminderTime = new Date(nextNapTime.getTime() - 10 * 60 * 1000);
    
    // Only schedule if reminder time is in the future
    if (reminderTime <= new Date()) {
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Sleep Reminder',
        body: `${babyName} might be getting sleepy soon. It's been about ${wakeWindowMinutes} minutes since the last nap.`,
        data: { type: 'sleep_reminder' },
        sound: true,
      },
      trigger: {
        date: reminderTime,
      },
    });

    return id;
  } catch (error) {
    console.log('Failed to schedule sleep reminder:', error);
    return null;
  }
}

export async function cancelSleepReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'sleep_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.log('Failed to cancel sleep reminders:', error);
  }
}

export async function scheduleFeedingReminder(
  babyName: string,
  intervalHours: number = 3
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  
  try {
    const settings = await getNotificationSettings();
    if (!settings.feedingReminders) return null;

    // Cancel existing feeding reminders
    await cancelFeedingReminders();

    const reminderTime = new Date(Date.now() + intervalHours * 60 * 60 * 1000);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Feeding Reminder',
        body: `It's been ${intervalHours} hours. Time to check if ${babyName} is hungry!`,
        data: { type: 'feeding_reminder' },
        sound: true,
      },
      trigger: {
        date: reminderTime,
      },
    });

    return id;
  } catch (error) {
    console.log('Failed to schedule feeding reminder:', error);
    return null;
  }
}

export async function cancelFeedingReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.content.data?.type === 'feeding_reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.log('Failed to cancel feeding reminders:', error);
  }
}

export async function sendTestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'Baby Day Book notifications are working!',
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.log('Failed to send test notification:', error);
    throw error;
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Failed to cancel all notifications:', error);
  }
}
