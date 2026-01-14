import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBaby } from '../../src/contexts/BabyContext';
import { feedingApi, sleepApi, diaperApi, growthApi } from '../../src/services/api';
import { useRouter } from 'expo-router';

type TrackType = 'feeding' | 'sleep' | 'diaper' | 'growth';

export default function AddScreen() {
  const { isAuthenticated } = useAuth();
  const { baby } = useBaby();
  const router = useRouter();
  
  const [selectedType, setSelectedType] = useState<TrackType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Feeding state
  const [feedingType, setFeedingType] = useState<string>('bottle');
  const [feedingAmount, setFeedingAmount] = useState('');
  const [feedingDuration, setFeedingDuration] = useState('');
  const [feedingNotes, setFeedingNotes] = useState('');
  const [foodType, setFoodType] = useState('');
  
  // Sleep state
  const [sleepType, setSleepType] = useState<string>('nap');
  const [sleepDuration, setSleepDuration] = useState('');
  const [sleepQuality, setSleepQuality] = useState<string>('good');
  const [sleepNotes, setSleepNotes] = useState('');
  
  // Diaper state
  const [diaperType, setDiaperType] = useState<string>('wet');
  const [diaperNotes, setDiaperNotes] = useState('');
  
  // Growth state
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [growthNotes, setGrowthNotes] = useState('');

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.messageText}>Please sign in to track activities</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!baby) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="happy-outline" size={64} color="#7C3AED" />
          <Text style={styles.messageText}>Add a baby profile first</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-baby')}
          >
            <Text style={styles.addButtonText}>Add Baby</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const openModal = (type: TrackType) => {
    setSelectedType(type);
    resetForm();
    setModalVisible(true);
  };

  const resetForm = () => {
    setFeedingType('bottle');
    setFeedingAmount('');
    setFeedingDuration('');
    setFeedingNotes('');
    setFoodType('');
    setSleepType('nap');
    setSleepDuration('');
    setSleepQuality('good');
    setSleepNotes('');
    setDiaperType('wet');
    setDiaperNotes('');
    setWeight('');
    setHeight('');
    setHeadCircumference('');
    setGrowthNotes('');
  };

  const handleSubmit = async () => {
    if (!baby) return;
    
    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      switch (selectedType) {
        case 'feeding':
          await feedingApi.create({
            baby_id: baby.baby_id,
            feeding_type: feedingType,
            start_time: now,
            duration_minutes: feedingDuration ? parseInt(feedingDuration) : undefined,
            amount_ml: feedingAmount ? parseInt(feedingAmount) : undefined,
            notes: feedingNotes || undefined,
            food_type: foodType || undefined,
          });
          break;
          
        case 'sleep':
          const endTime = new Date();
          const startTime = new Date(endTime.getTime() - (parseInt(sleepDuration || '0') * 60000));
          await sleepApi.create({
            baby_id: baby.baby_id,
            sleep_type: sleepType,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_minutes: sleepDuration ? parseInt(sleepDuration) : undefined,
            quality: sleepQuality,
            notes: sleepNotes || undefined,
          });
          break;
          
        case 'diaper':
          await diaperApi.create({
            baby_id: baby.baby_id,
            diaper_type: diaperType,
            time: now,
            notes: diaperNotes || undefined,
          });
          break;
          
        case 'growth':
          await growthApi.create({
            baby_id: baby.baby_id,
            date: now.split('T')[0],
            weight_kg: weight ? parseFloat(weight) : undefined,
            height_cm: height ? parseFloat(height) : undefined,
            head_circumference_cm: headCircumference ? parseFloat(headCircumference) : undefined,
            notes: growthNotes || undefined,
          });
          break;
      }
      
      Alert.alert('Success', 'Activity recorded successfully!');
      setModalVisible(false);
      router.push('/(tabs)');
    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert('Error', 'Failed to save activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const trackOptions = [
    {
      type: 'feeding' as TrackType,
      icon: 'restaurant',
      label: 'Feeding',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
    {
      type: 'sleep' as TrackType,
      icon: 'moon',
      label: 'Sleep',
      color: '#6366F1',
      bgColor: '#E0E7FF',
    },
    {
      type: 'diaper' as TrackType,
      icon: 'water',
      label: 'Diaper',
      color: '#10B981',
      bgColor: '#D1FAE5',
    },
    {
      type: 'growth' as TrackType,
      icon: 'trending-up',
      label: 'Growth',
      color: '#EC4899',
      bgColor: '#FCE7F3',
    },
  ];

  const renderFeedingForm = () => (
    <View style={styles.formContent}>
      <Text style={styles.formLabel}>Type</Text>
      <View style={styles.optionRow}>
        {[
          { value: 'bottle', label: 'Bottle', icon: 'wine' },
          { value: 'breast_left', label: 'Left', icon: 'ellipse' },
          { value: 'breast_right', label: 'Right', icon: 'ellipse' },
          { value: 'solid', label: 'Solid', icon: 'nutrition' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              feedingType === option.value && styles.optionButtonActive,
            ]}
            onPress={() => setFeedingType(option.value)}
          >
            <Ionicons
              name={option.icon as any}
              size={20}
              color={feedingType === option.value ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[
                styles.optionText,
                feedingType === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {feedingType === 'bottle' && (
        <>
          <Text style={styles.formLabel}>Amount (ml)</Text>
          <TextInput
            style={styles.input}
            value={feedingAmount}
            onChangeText={setFeedingAmount}
            keyboardType="numeric"
            placeholder="e.g., 120"
            placeholderTextColor="#9CA3AF"
          />
        </>
      )}
      
      {(feedingType === 'breast_left' || feedingType === 'breast_right') && (
        <>
          <Text style={styles.formLabel}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={feedingDuration}
            onChangeText={setFeedingDuration}
            keyboardType="numeric"
            placeholder="e.g., 15"
            placeholderTextColor="#9CA3AF"
          />
        </>
      )}
      
      {feedingType === 'solid' && (
        <>
          <Text style={styles.formLabel}>Food Type</Text>
          <TextInput
            style={styles.input}
            value={foodType}
            onChangeText={setFoodType}
            placeholder="e.g., Puree, Cereal"
            placeholderTextColor="#9CA3AF"
          />
        </>
      )}
      
      <Text style={styles.formLabel}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={feedingNotes}
        onChangeText={setFeedingNotes}
        placeholder="Any additional notes..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderSleepForm = () => (
    <View style={styles.formContent}>
      <Text style={styles.formLabel}>Type</Text>
      <View style={styles.optionRow}>
        {[
          { value: 'nap', label: 'Nap' },
          { value: 'night', label: 'Night Sleep' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              styles.wideOption,
              sleepType === option.value && styles.optionButtonActive,
            ]}
            onPress={() => setSleepType(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                sleepType === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.formLabel}>Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        value={sleepDuration}
        onChangeText={setSleepDuration}
        keyboardType="numeric"
        placeholder="e.g., 45"
        placeholderTextColor="#9CA3AF"
      />
      
      <Text style={styles.formLabel}>Quality</Text>
      <View style={styles.optionRow}>
        {['good', 'fair', 'poor'].map((quality) => (
          <TouchableOpacity
            key={quality}
            style={[
              styles.optionButton,
              sleepQuality === quality && styles.optionButtonActive,
            ]}
            onPress={() => setSleepQuality(quality)}
          >
            <Text
              style={[
                styles.optionText,
                sleepQuality === quality && styles.optionTextActive,
              ]}
            >
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.formLabel}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={sleepNotes}
        onChangeText={setSleepNotes}
        placeholder="Any additional notes..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderDiaperForm = () => (
    <View style={styles.formContent}>
      <Text style={styles.formLabel}>Type</Text>
      <View style={styles.optionRow}>
        {[
          { value: 'wet', label: 'Wet', icon: 'water' },
          { value: 'dirty', label: 'Dirty', icon: 'ellipse' },
          { value: 'mixed', label: 'Mixed', icon: 'layers' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              diaperType === option.value && styles.optionButtonActive,
            ]}
            onPress={() => setDiaperType(option.value)}
          >
            <Ionicons
              name={option.icon as any}
              size={20}
              color={diaperType === option.value ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[
                styles.optionText,
                diaperType === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.formLabel}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={diaperNotes}
        onChangeText={setDiaperNotes}
        placeholder="Any additional notes..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderGrowthForm = () => (
    <View style={styles.formContent}>
      <Text style={styles.formLabel}>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="e.g., 5.5"
        placeholderTextColor="#9CA3AF"
      />
      
      <Text style={styles.formLabel}>Height (cm)</Text>
      <TextInput
        style={styles.input}
        value={height}
        onChangeText={setHeight}
        keyboardType="decimal-pad"
        placeholder="e.g., 60"
        placeholderTextColor="#9CA3AF"
      />
      
      <Text style={styles.formLabel}>Head Circumference (cm)</Text>
      <TextInput
        style={styles.input}
        value={headCircumference}
        onChangeText={setHeadCircumference}
        keyboardType="decimal-pad"
        placeholder="e.g., 38"
        placeholderTextColor="#9CA3AF"
      />
      
      <Text style={styles.formLabel}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={growthNotes}
        onChangeText={setGrowthNotes}
        placeholder="Any additional notes..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Activity</Text>
        <Text style={styles.headerSubtitle}>What would you like to log for {baby.name}?</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsGrid}>
          {trackOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[styles.optionCard, { backgroundColor: option.bgColor }]}
              onPress={() => openModal(option.type)}
            >
              <View style={[styles.iconCircle, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon as any} size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedType && trackOptions.find(o => o.type === selectedType)?.label}
            </Text>
            <View style={{ width: 28 }} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedType === 'feeding' && renderFeedingForm()}
            {selectedType === 'sleep' && renderSleepForm()}
            {selectedType === 'diaper' && renderDiaperForm()}
            {selectedType === 'growth' && renderGrowthForm()}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  content: {
    flex: 1,
    padding: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  optionCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  formContent: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  wideOption: {
    flex: 1,
    justifyContent: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#7C3AED',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
