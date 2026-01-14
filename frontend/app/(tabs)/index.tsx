import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBaby } from '../../src/contexts/BabyContext';
import { timelineApi, sleepApi, statsApi } from '../../src/services/api';
import { TimelineEntry, SleepPrediction, DailyStats } from '../../src/types';
import { formatTime, formatRelativeTime, formatDuration, calculateAge, getToday } from '../../src/utils/dateUtils';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user, isLoading: authLoading, isAuthenticated, login } = useAuth();
  const { baby, babies, isLoading: babyLoading } = useBaby();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [prediction, setPrediction] = useState<SleepPrediction | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!baby) return;
    
    try {
      setLoading(true);
      const [timelineData, predictionData, statsData] = await Promise.all([
        timelineApi.get(baby.baby_id),
        sleepApi.getPrediction(baby.baby_id).catch(() => null),
        statsApi.get(baby.baby_id),
      ]);
      
      setTimeline(timelineData);
      setPrediction(predictionData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (baby) {
      loadData();
    }
  }, [baby]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [baby]);

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <View style={styles.logoContainer}>
            <Ionicons name="heart" size={80} color="#7C3AED" />
          </View>
          <Text style={styles.appTitle}>Baby Day Book</Text>
          <Text style={styles.appSubtitle}>
            Track your baby's feeding, sleep, diapers & more
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={login}>
            <Ionicons name="logo-google" size={20} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (babyLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!baby) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noBabyContainer}>
          <Ionicons name="happy-outline" size={80} color="#7C3AED" />
          <Text style={styles.noBabyTitle}>Welcome!</Text>
          <Text style={styles.noBabyText}>
            Let's add your baby's profile to get started
          </Text>
          <TouchableOpacity
            style={styles.addBabyButton}
            onPress={() => router.push('/add-baby')}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.addBabyButtonText}>Add Baby Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const babyAge = calculateAge(baby.birth_date);

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'feeding':
        return 'restaurant';
      case 'sleep':
        return 'moon';
      case 'diaper':
        return 'water';
      case 'growth':
        return 'trending-up';
      default:
        return 'ellipse';
    }
  };

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'feeding':
        return '#F59E0B';
      case 'sleep':
        return '#6366F1';
      case 'diaper':
        return '#10B981';
      case 'growth':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  const getEntryDescription = (entry: TimelineEntry) => {
    const data = entry.data;
    switch (entry.entry_type) {
      case 'feeding':
        const feeding = data as any;
        if (feeding.feeding_type === 'bottle') {
          return `Bottle ${feeding.amount_ml ? `(${feeding.amount_ml}ml)` : ''}`;
        } else if (feeding.feeding_type === 'solid') {
          return `Solid food${feeding.food_type ? ` - ${feeding.food_type}` : ''}`;
        } else {
          return `Breastfeeding (${feeding.feeding_type === 'breast_left' ? 'Left' : 'Right'})`;
        }
      case 'sleep':
        const sleep = data as any;
        return `${sleep.sleep_type === 'nap' ? 'Nap' : 'Night sleep'}${sleep.duration_minutes ? ` - ${formatDuration(sleep.duration_minutes)}` : ''}`;
      case 'diaper':
        const diaper = data as any;
        return `Diaper change (${diaper.diaper_type})`;
      case 'growth':
        const growth = data as any;
        const parts = [];
        if (growth.weight_kg) parts.push(`${growth.weight_kg}kg`);
        if (growth.height_cm) parts.push(`${growth.height_cm}cm`);
        return `Growth: ${parts.join(', ')}`;
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity
            style={styles.babyAvatar}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.babyInitial}>{baby.name[0]}</Text>
          </TouchableOpacity>
        </View>

        {/* Baby Card */}
        <View style={styles.babyCard}>
          <View style={styles.babyInfo}>
            <Text style={styles.babyName}>{baby.name}</Text>
            <Text style={styles.babyAge}>{babyAge.text} old</Text>
          </View>
          {babies.length > 1 && (
            <TouchableOpacity style={styles.switchBaby}>
              <Ionicons name="swap-horizontal" size={20} color="#7C3AED" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sleep Prediction */}
        {prediction && (
          <View style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <Ionicons name="moon" size={24} color="#6366F1" />
              <Text style={styles.predictionTitle}>Sleep Prediction</Text>
            </View>
            <Text style={styles.predictionTime}>
              Next nap around {formatTime(prediction.next_nap_time)}
            </Text>
            <View style={styles.predictionDetails}>
              <View style={styles.predictionDetail}>
                <Text style={styles.predictionLabel}>Wake Window</Text>
                <Text style={styles.predictionValue}>{formatDuration(prediction.wake_window_minutes)}</Text>
              </View>
              <View style={styles.predictionDetail}>
                <Text style={styles.predictionLabel}>Recommended</Text>
                <Text style={styles.predictionValue}>{formatDuration(prediction.recommended_duration_minutes)}</Text>
              </View>
              <View style={styles.predictionDetail}>
                <Text style={styles.predictionLabel}>Confidence</Text>
                <Text style={styles.predictionValue}>{Math.round(prediction.confidence * 100)}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Daily Stats Summary */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="restaurant" size={20} color="#F59E0B" />
              <Text style={styles.statValue}>{stats.feeding.count}</Text>
              <Text style={styles.statLabel}>Feedings</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="moon" size={20} color="#6366F1" />
              <Text style={styles.statValue}>{stats.sleep.total_hours}h</Text>
              <Text style={styles.statLabel}>Sleep</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="water" size={20} color="#10B981" />
              <Text style={styles.statValue}>{stats.diaper.total}</Text>
              <Text style={styles.statLabel}>Diapers</Text>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          {loading && !refreshing ? (
            <ActivityIndicator style={styles.timelineLoader} color="#7C3AED" />
          ) : timeline.length === 0 ? (
            <View style={styles.emptyTimeline}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No activities recorded today</Text>
              <Text style={styles.emptySubtext}>Tap the Track button to log an activity</Text>
            </View>
          ) : (
            timeline.slice(0, 10).map((entry, index) => (
              <View key={entry.entry_id} style={styles.timelineItem}>
                <View style={[styles.timelineIcon, { backgroundColor: getEntryColor(entry.entry_type) + '20' }]}>
                  <Ionicons
                    name={getEntryIcon(entry.entry_type) as any}
                    size={18}
                    color={getEntryColor(entry.entry_type)}
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDescription}>
                    {getEntryDescription(entry)}
                  </Text>
                  <Text style={styles.timelineTime}>
                    {formatRelativeTime(entry.time)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F4FF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noBabyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noBabyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noBabyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  addBabyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addBabyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  babyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  babyInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  babyCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  babyInfo: {
    flex: 1,
  },
  babyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  babyAge: {
    fontSize: 14,
    color: '#7C3AED',
    marginTop: 2,
  },
  switchBaby: {
    padding: 8,
  },
  predictionCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338CA',
  },
  predictionTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  predictionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  predictionDetail: {
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4338CA',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  timelineSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  timelineLoader: {
    marginTop: 24,
  },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  timelineDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  timelineTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
