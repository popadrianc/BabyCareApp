import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ACTIVE_TIMER_KEY = 'active_sleep_timer';

export interface ActiveTimer {
  babyId: string;
  babyName: string;
  sleepType: 'nap' | 'night';
  startTime: string; // ISO string
  notificationId?: string;
}

export async function getActiveTimer(): Promise<ActiveTimer | null> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_TIMER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.log('Failed to get active timer:', error);
  }
  return null;
}

export async function startSleepTimer(
  babyId: string,
  babyName: string,
  sleepType: 'nap' | 'night'
): Promise<ActiveTimer> {
  const startTime = new Date().toISOString();
  
  const timer: ActiveTimer = {
    babyId,
    babyName,
    sleepType,
    startTime,
  };

  // Start persistent notification on mobile
  if (Platform.OS !== 'web') {
    try {
      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('sleep-timer', {
          name: 'Sleep Timer',
          importance: Notifications.AndroidImportance.LOW,
          sound: undefined,
          vibrationPattern: undefined,
          enableVibrate: false,
        });
      }

      // Schedule an ongoing notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${babyName} is sleeping`,
          body: `${sleepType === 'nap' ? 'Nap' : 'Night sleep'} started just now`,
          data: { type: 'sleep_timer', babyId, startTime },
          sticky: true,
          autoDismiss: false,
        },
        trigger: null, // Send immediately
      });
      
      timer.notificationId = notificationId;
    } catch (error) {
      console.log('Failed to create notification:', error);
    }
  }

  // Save timer to storage
  await AsyncStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(timer));
  
  return timer;
}

export async function stopSleepTimer(): Promise<{ startTime: string; endTime: string; durationMinutes: number } | null> {
  try {
    const timer = await getActiveTimer();
    if (!timer) return null;

    const endTime = new Date();
    const startTime = new Date(timer.startTime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    // Cancel the notification
    if (timer.notificationId && Platform.OS !== 'web') {
      try {
        await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
      } catch (error) {
        console.log('Failed to cancel notification:', error);
      }
    }

    // Clear the timer
    await AsyncStorage.removeItem(ACTIVE_TIMER_KEY);

    return {
      startTime: timer.startTime,
      endTime: endTime.toISOString(),
      durationMinutes,
    };
  } catch (error) {
    console.log('Failed to stop timer:', error);
    return null;
  }
}

export async function cancelSleepTimer(): Promise<void> {
  try {
    const timer = await getActiveTimer();
    if (timer?.notificationId && Platform.OS !== 'web') {
      await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
    }
    await AsyncStorage.removeItem(ACTIVE_TIMER_KEY);
  } catch (error) {
    console.log('Failed to cancel timer:', error);
  }
}

export function formatTimerDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

export async function updateTimerNotification(timer: ActiveTimer): Promise<void> {
  if (Platform.OS === 'web' || !timer.notificationId) return;

  try {
    const duration = formatTimerDuration(timer.startTime);
    
    // Cancel old notification and create new one with updated time
    await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
    
    const newNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${timer.babyName} is sleeping`,
        body: `${timer.sleepType === 'nap' ? 'Nap' : 'Night sleep'} - ${duration}`,
        data: { type: 'sleep_timer', babyId: timer.babyId, startTime: timer.startTime },
        sticky: true,
        autoDismiss: false,
      },
      trigger: null,
    });

    // Update stored timer with new notification ID
    timer.notificationId = newNotificationId;
    await AsyncStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(timer));
  } catch (error) {
    console.log('Failed to update notification:', error);
  }
}
