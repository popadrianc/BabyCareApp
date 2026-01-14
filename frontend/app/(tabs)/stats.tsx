import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBaby } from '../../src/contexts/BabyContext';
import { statsApi, feedingApi, sleepApi, diaperApi, growthApi } from '../../src/services/api';
import { DailyStats, GrowthRecord } from '../../src/types';
import { formatDate, getToday } from '../../src/utils/dateUtils';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { isAuthenticated } = useAuth();
  const { baby } = useBaby();
  const router = useRouter();

  const [stats, setStats] = useState<DailyStats | null>(null);
  const [weekStats, setWeekStats] = useState<DailyStats[]>([]);
  const [growthData, setGrowthData] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'today' | 'week' | 'growth'>('today');

  const loadData = async () => {
    if (!baby) return;

    try {
      setLoading(true);

      // Load today's stats
      const todayStats = await statsApi.get(baby.baby_id);
      setStats(todayStats);

      // Load week stats
      const weekData: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        try {
          const dayStats = await statsApi.get(baby.baby_id, dateStr);
          weekData.push(dayStats);
        } catch {
          weekData.push({
            date: dateStr,
            feeding: { count: 0, total_minutes: 0, total_bottle_ml: 0 },
            sleep: { count: 0, total_minutes: 0, total_hours: 0 },
            diaper: { total: 0, wet: 0, dirty: 0, mixed: 0 },
          });
        }
      }
      setWeekStats(weekData);

      // Load growth data
      const growth = await growthApi.getByBaby(baby.baby_id);
      setGrowthData(growth);
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>Please sign in to view statistics</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!baby) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="stats-chart" size={64} color="#D1D5DB" />
          <Text style={styles.messageText}>Add a baby profile to see statistics</Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxSleepHours = Math.max(...weekStats.map(s => s.sleep.total_hours), 1);
  const maxFeedings = Math.max(...weekStats.map(s => s.feeding.count), 1);
  const maxDiapers = Math.max(...weekStats.map(s => s.diaper.total), 1);

  const renderTodayStats = () => (
    <View style={styles.todayContainer}>
      {/* Feeding Card */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="restaurant" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statCardTitle}>Feeding</Text>
        </View>
        <View style={styles.statCardContent}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.feeding.count || 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.feeding.total_minutes || 0}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.feeding.total_bottle_ml || 0}</Text>
            <Text style={styles.statLabel}>ml (bottle)</Text>
          </View>
        </View>
      </View>

      {/* Sleep Card */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={[styles.statIcon, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="moon" size={24} color="#6366F1" />
          </View>
          <Text style={styles.statCardTitle}>Sleep</Text>
        </View>
        <View style={styles.statCardContent}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.sleep.count || 0}</Text>
            <Text style={styles.statLabel}>Naps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.sleep.total_hours || 0}</Text>
            <Text style={styles.statLabel}>Hours Total</Text>
          </View>
        </View>
      </View>

      {/* Diaper Card */}
      <View style={styles.statCard}>
        <View style={styles.statCardHeader}>
          <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="water" size={24} color="#10B981" />
          </View>
          <Text style={styles.statCardTitle}>Diapers</Text>
        </View>
        <View style={styles.statCardContent}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.diaper.wet || 0}</Text>
            <Text style={styles.statLabel}>Wet</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.diaper.dirty || 0}</Text>
            <Text style={styles.statLabel}>Dirty</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.diaper.mixed || 0}</Text>
            <Text style={styles.statLabel}>Mixed</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderWeekStats = () => (
    <View style={styles.weekContainer}>
      {/* Sleep Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Sleep (hours)</Text>
        <View style={styles.barChart}>
          {weekStats.map((day, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(day.sleep.total_hours / maxSleepHours) * 100}%`,
                      backgroundColor: '#6366F1',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
              </Text>
              <Text style={styles.barValue}>{day.sleep.total_hours}h</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Feeding Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Feedings</Text>
        <View style={styles.barChart}>
          {weekStats.map((day, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(day.feeding.count / maxFeedings) * 100}%`,
                      backgroundColor: '#F59E0B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
              </Text>
              <Text style={styles.barValue}>{day.feeding.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Diaper Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Diapers</Text>
        <View style={styles.barChart}>
          {weekStats.map((day, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(day.diaper.total / maxDiapers) * 100}%`,
                      backgroundColor: '#10B981',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
              </Text>
              <Text style={styles.barValue}>{day.diaper.total}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderGrowthStats = () => (
    <View style={styles.growthContainer}>
      {growthData.length === 0 ? (
        <View style={styles.emptyGrowth}>
          <Ionicons name="trending-up" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No growth data recorded yet</Text>
          <TouchableOpacity
            style={styles.addGrowthButton}
            onPress={() => router.push('/(tabs)/add')}
          >
            <Text style={styles.addGrowthButtonText}>Record Growth</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Latest Growth */}
          {growthData[0] && (
            <View style={styles.latestGrowth}>
              <Text style={styles.latestTitle}>Latest Measurement</Text>
              <Text style={styles.latestDate}>{formatDate(growthData[0].date)}</Text>
              <View style={styles.growthStats}>
                {growthData[0].weight_kg && (
                  <View style={styles.growthStat}>
                    <Text style={styles.growthValue}>{growthData[0].weight_kg}</Text>
                    <Text style={styles.growthUnit}>kg</Text>
                  </View>
                )}
                {growthData[0].height_cm && (
                  <View style={styles.growthStat}>
                    <Text style={styles.growthValue}>{growthData[0].height_cm}</Text>
                    <Text style={styles.growthUnit}>cm</Text>
                  </View>
                )}
                {growthData[0].head_circumference_cm && (
                  <View style={styles.growthStat}>
                    <Text style={styles.growthValue}>{growthData[0].head_circumference_cm}</Text>
                    <Text style={styles.growthUnit}>cm (head)</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Growth History */}
          <Text style={styles.historyTitle}>History</Text>
          {growthData.slice(0, 10).map((record) => (
            <View key={record.growth_id} style={styles.historyItem}>
              <Text style={styles.historyDate}>{formatDate(record.date)}</Text>
              <View style={styles.historyValues}>
                {record.weight_kg && <Text style={styles.historyValue}>{record.weight_kg} kg</Text>}
                {record.height_cm && <Text style={styles.historyValue}>{record.height_cm} cm</Text>}
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
        <Text style={styles.headerSubtitle}>{baby.name}'s activity overview</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        {(['today', 'week', 'growth'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <ActivityIndicator style={styles.loader} size="large" color="#7C3AED" />
        ) : (
          <>
            {selectedTab === 'today' && renderTodayStats()}
            {selectedTab === 'week' && renderWeekStats()}
            {selectedTab === 'growth' && renderGrowthStats()}
          </>
        )}
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
    padding: 24,
  },
  messageText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  loader: {
    marginTop: 40,
  },
  // Today Stats Styles
  todayContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  // Week Stats Styles
  weekContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 80,
    width: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 12,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
  barValue: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Growth Stats Styles
  growthContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyGrowth: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 20,
  },
  addGrowthButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addGrowthButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  latestGrowth: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  latestTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  latestDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  growthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  growthStat: {
    alignItems: 'center',
  },
  growthValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#7C3AED',
  },
  growthUnit: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    color: '#374151',
  },
  historyValues: {
    flexDirection: 'row',
    gap: 16,
  },
  historyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
  },
});
