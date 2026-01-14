// User Types
export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  created_at: string;
}

// Baby Types
export interface Baby {
  baby_id: string;
  user_id: string;
  shared_with: string[];
  name: string;
  birth_date: string;
  gender?: 'male' | 'female' | 'other';
  photo?: string;
  created_at: string;
  updated_at: string;
}

export interface BabyCreate {
  name: string;
  birth_date: string;
  gender?: string;
  photo?: string;
}

// Feeding Types
export interface FeedingRecord {
  feeding_id: string;
  baby_id: string;
  user_id: string;
  feeding_type: 'breast_left' | 'breast_right' | 'bottle' | 'solid';
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  amount_ml?: number;
  notes?: string;
  food_type?: string;
  created_at: string;
}

export interface FeedingCreate {
  baby_id: string;
  feeding_type: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  amount_ml?: number;
  notes?: string;
  food_type?: string;
}

// Sleep Types
export interface SleepRecord {
  sleep_id: string;
  baby_id: string;
  user_id: string;
  sleep_type: 'nap' | 'night';
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  quality?: 'good' | 'fair' | 'poor';
  notes?: string;
  created_at: string;
}

export interface SleepCreate {
  baby_id: string;
  sleep_type: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  quality?: string;
  notes?: string;
}

export interface SleepPrediction {
  next_nap_time: string;
  confidence: number;
  recommended_duration_minutes: number;
  wake_window_minutes: number;
}

// Diaper Types
export interface DiaperRecord {
  diaper_id: string;
  baby_id: string;
  user_id: string;
  diaper_type: 'wet' | 'dirty' | 'mixed';
  time: string;
  notes?: string;
  created_at: string;
}

export interface DiaperCreate {
  baby_id: string;
  diaper_type: string;
  time: string;
  notes?: string;
}

// Growth Types
export interface GrowthRecord {
  growth_id: string;
  baby_id: string;
  user_id: string;
  date: string;
  weight_kg?: number;
  height_cm?: number;
  head_circumference_cm?: number;
  notes?: string;
  created_at: string;
}

export interface GrowthCreate {
  baby_id: string;
  date: string;
  weight_kg?: number;
  height_cm?: number;
  head_circumference_cm?: number;
  notes?: string;
}

// Timeline Types
export interface TimelineEntry {
  entry_id: string;
  entry_type: 'feeding' | 'sleep' | 'diaper' | 'growth';
  time: string;
  data: FeedingRecord | SleepRecord | DiaperRecord | GrowthRecord;
  created_by: string;
}

// Stats Types
export interface DailyStats {
  date: string;
  feeding: {
    count: number;
    total_minutes: number;
    total_bottle_ml: number;
  };
  sleep: {
    count: number;
    total_minutes: number;
    total_hours: number;
  };
  diaper: {
    total: number;
    wet: number;
    dirty: number;
    mixed: number;
  };
}

// Share Invite Types
export interface ShareInvite {
  invite_id: string;
  baby_id: string;
  inviter_user_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  baby_name?: string;
  inviter_name?: string;
}

// Reminder Types
export interface Reminder {
  reminder_id: string;
  baby_id: string;
  user_id: string;
  reminder_type: 'feeding' | 'sleep' | 'diaper' | 'medicine';
  time: string;
  message: string;
  is_active: boolean;
  created_at: string;
}
