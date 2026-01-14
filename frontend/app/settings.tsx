import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import {
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  sendTestNotification,
  cancelAllNotifications,
} from '../src/services/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    sleepReminders: true,
    feedingReminders: true,
    diaperReminders: true,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    const stored = await getNotificationSettings();
    setSettings(stored);
  };

  const checkPermissions = async () => {
    if (Platform.OS !== 'web') {
      const granted = await requestNotificationPermissions();
      setPermissionGranted(granted);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
  };

  const handleTestNotification = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Push notifications are only available on mobile devices.');
      return;
    }
    
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
      return;
    }
    
    try {
      await sendTestNotification();
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const handleClearNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            Alert.alert('Success', 'All notifications cleared.');
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>Please sign in to access settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          
          {Platform.OS !== 'web' && !permissionGranted && (
            <View style={styles.permissionWarning}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <Text style={styles.permissionText}>
                Notifications are disabled. Enable them in your device settings.
              </Text>
            </View>
          )}
          
          {Platform.OS === 'web' && (
            <View style={styles.permissionWarning}>
              <Ionicons name="information-circle" size={20} color="#6366F1" />
              <Text style={styles.permissionText}>
                Push notifications are available on mobile devices only.
              </Text>
            </View>
          )}

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={22} color="#6366F1" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Sleep Reminders</Text>
                <Text style={styles.settingDescription}>
                  Get notified when it's time for baby's next nap
                </Text>
              </View>
            </View>
            <Switch
              value={settings.sleepReminders}
              onValueChange={() => handleToggle('sleepReminders')}
              trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="restaurant" size={22} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Feeding Reminders</Text>
                <Text style={styles.settingDescription}>
                  Reminder to check if baby is hungry
                </Text>
              </View>
            </View>
            <Switch
              value={settings.feedingReminders}
              onValueChange={() => handleToggle('feedingReminders')}
              trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="water" size={22} color="#10B981" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Diaper Reminders</Text>
                <Text style={styles.settingDescription}>
                  Periodic diaper check reminders
                </Text>
              </View>
            </View>
            <Switch
              value={settings.diaperReminders}
              onValueChange={() => handleToggle('diaperReminders')}
              trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
            <Ionicons name="notifications-outline" size={22} color="#7C3AED" />
            <Text style={styles.actionButtonText}>Send Test Notification</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleClearNotifications}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
              Clear All Scheduled Notifications
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#9CA3AF" />
          <Text style={styles.infoText}>
            Sleep reminders are automatically scheduled based on your baby's sleep patterns 
            and age-appropriate wake windows. The app will notify you 10 minutes before 
            the predicted nap time.
          </Text>
        </View>

        <View style={{ height: 100 }} />
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
  },
  messageText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  permissionText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
});
