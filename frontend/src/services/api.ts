import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Baby,
  BabyCreate,
  FeedingRecord,
  FeedingCreate,
  SleepRecord,
  SleepCreate,
  SleepPrediction,
  DiaperRecord,
  DiaperCreate,
  GrowthRecord,
  GrowthCreate,
  TimelineEntry,
  DailyStats,
  ShareInvite,
  Reminder,
} from '../types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token storage helpers
const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem('session_token');
    }
    return await SecureStore.getItemAsync('session_token');
  } catch {
    return null;
  }
};

const setToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem('session_token', token);
    } else {
      await SecureStore.setItemAsync('session_token', token);
    }
  } catch (e) {
    console.error('Failed to save token', e);
  }
};

const removeToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem('session_token');
    } else {
      await SecureStore.deleteItemAsync('session_token');
    }
  } catch (e) {
    console.error('Failed to remove token', e);
  }
};

// Add auth header to requests
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  exchangeSession: async (sessionId: string) => {
    const response = await api.post('/auth/session', {}, {
      headers: { 'X-Session-ID': sessionId },
    });
    if (response.data.session_token) {
      await setToken(response.data.session_token);
    }
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    await removeToken();
  },

  getToken,
  setToken,
  removeToken,
};

// Baby API
export const babyApi = {
  create: async (data: BabyCreate): Promise<Baby> => {
    const response = await api.post('/baby', data);
    return response.data;
  },

  getAll: async (): Promise<Baby[]> => {
    const response = await api.get('/baby');
    return response.data;
  },

  getById: async (babyId: string): Promise<Baby> => {
    const response = await api.get(`/baby/${babyId}`);
    return response.data;
  },

  update: async (babyId: string, data: Partial<BabyCreate>): Promise<Baby> => {
    const response = await api.put(`/baby/${babyId}`, data);
    return response.data;
  },

  delete: async (babyId: string): Promise<void> => {
    await api.delete(`/baby/${babyId}`);
  },
};

// Feeding API
export const feedingApi = {
  create: async (data: FeedingCreate): Promise<FeedingRecord> => {
    const response = await api.post('/feeding', data);
    return response.data;
  },

  getByBaby: async (babyId: string, date?: string): Promise<FeedingRecord[]> => {
    const params = date ? { date } : {};
    const response = await api.get(`/feeding/${babyId}`, { params });
    return response.data;
  },

  delete: async (feedingId: string): Promise<void> => {
    await api.delete(`/feeding/${feedingId}`);
  },
};

// Sleep API
export const sleepApi = {
  create: async (data: SleepCreate): Promise<SleepRecord> => {
    const response = await api.post('/sleep', data);
    return response.data;
  },

  getByBaby: async (babyId: string, date?: string): Promise<SleepRecord[]> => {
    const params = date ? { date } : {};
    const response = await api.get(`/sleep/${babyId}`, { params });
    return response.data;
  },

  update: async (sleepId: string, data: SleepCreate): Promise<SleepRecord> => {
    const response = await api.put(`/sleep/${sleepId}`, data);
    return response.data;
  },

  delete: async (sleepId: string): Promise<void> => {
    await api.delete(`/sleep/${sleepId}`);
  },

  getPrediction: async (babyId: string): Promise<SleepPrediction> => {
    const response = await api.get(`/sleep/prediction/${babyId}`);
    return response.data;
  },
};

// Diaper API
export const diaperApi = {
  create: async (data: DiaperCreate): Promise<DiaperRecord> => {
    const response = await api.post('/diaper', data);
    return response.data;
  },

  getByBaby: async (babyId: string, date?: string): Promise<DiaperRecord[]> => {
    const params = date ? { date } : {};
    const response = await api.get(`/diaper/${babyId}`, { params });
    return response.data;
  },

  delete: async (diaperId: string): Promise<void> => {
    await api.delete(`/diaper/${diaperId}`);
  },
};

// Growth API
export const growthApi = {
  create: async (data: GrowthCreate): Promise<GrowthRecord> => {
    const response = await api.post('/growth', data);
    return response.data;
  },

  getByBaby: async (babyId: string): Promise<GrowthRecord[]> => {
    const response = await api.get(`/growth/${babyId}`);
    return response.data;
  },

  delete: async (growthId: string): Promise<void> => {
    await api.delete(`/growth/${growthId}`);
  },
};

// Timeline API
export const timelineApi = {
  get: async (babyId: string, date?: string): Promise<TimelineEntry[]> => {
    const params = date ? { date } : {};
    const response = await api.get(`/timeline/${babyId}`, { params });
    return response.data;
  },
};

// Stats API
export const statsApi = {
  get: async (babyId: string, date?: string): Promise<DailyStats> => {
    const params = date ? { date } : {};
    const response = await api.get(`/stats/${babyId}`, { params });
    return response.data;
  },
};

// Share API
export const shareApi = {
  invite: async (babyId: string, email: string): Promise<ShareInvite> => {
    const response = await api.post('/share/invite', {
      baby_id: babyId,
      invitee_email: email,
    });
    return response.data;
  },

  getPendingInvites: async (): Promise<ShareInvite[]> => {
    const response = await api.get('/share/invites/pending');
    return response.data;
  },

  acceptInvite: async (inviteId: string): Promise<void> => {
    await api.post(`/share/invite/${inviteId}/accept`);
  },

  declineInvite: async (inviteId: string): Promise<void> => {
    await api.post(`/share/invite/${inviteId}/decline`);
  },

  removeAccess: async (babyId: string, userId: string): Promise<void> => {
    await api.delete(`/share/${babyId}/${userId}`);
  },
};

// Reminder API
export const reminderApi = {
  create: async (data: { baby_id: string; reminder_type: string; time: string; message: string }): Promise<Reminder> => {
    const response = await api.post('/reminder', data);
    return response.data;
  },

  getByBaby: async (babyId: string): Promise<Reminder[]> => {
    const response = await api.get(`/reminder/${babyId}`);
    return response.data;
  },

  delete: async (reminderId: string): Promise<void> => {
    await api.delete(`/reminder/${reminderId}`);
  },
};

export default api;
