import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBaby } from '../../src/contexts/BabyContext';
import { shareApi } from '../../src/services/api';
import { ShareInvite, User } from '../../src/types';
import { calculateAge, formatDate } from '../../src/utils/dateUtils';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, login } = useAuth();
  const { baby, babies, setBaby, refreshBabies } = useBaby();
  const router = useRouter();

  const [pendingInvites, setPendingInvites] = useState<ShareInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const loadInvites = async () => {
    try {
      const invites = await shareApi.getPendingInvites();
      setPendingInvites(invites);
    } catch (error) {
      console.error('Failed to load invites:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInvites();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await logout();
          setLoading(false);
        },
      },
    ]);
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      setLoading(true);
      await shareApi.acceptInvite(inviteId);
      await loadInvites();
      await refreshBabies();
      Alert.alert('Success', 'You now have access to this baby profile!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      setLoading(true);
      await shareApi.declineInvite(inviteId);
      await loadInvites();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline invite');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!baby || !inviteEmail.trim()) return;
    
    setSendingInvite(true);
    try {
      await shareApi.invite(baby.baby_id, inviteEmail.trim());
      Alert.alert('Success', `Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send invite');
    } finally {
      setSendingInvite(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#7C3AED" />
          <Text style={styles.notLoggedInTitle}>Sign In Required</Text>
          <Text style={styles.notLoggedInText}>
            Sign in to manage your baby's profile and sync across devices
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={login}>
            <Ionicons name="logo-google" size={20} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const babyAge = baby ? calculateAge(baby.birth_date) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>{user?.name?.[0] || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Baby Profile */}
        {baby && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Baby Profile</Text>
              <TouchableOpacity onPress={() => router.push('/edit-baby')}>
                <Ionicons name="pencil" size={20} color="#7C3AED" />
              </TouchableOpacity>
            </View>
            <View style={styles.babyCard}>
              <View style={styles.babyAvatar}>
                <Text style={styles.babyInitial}>{baby.name[0]}</Text>
              </View>
              <View style={styles.babyInfo}>
                <Text style={styles.babyName}>{baby.name}</Text>
                <Text style={styles.babyAge}>{babyAge?.text} old</Text>
                <Text style={styles.babyBirthdate}>
                  Born {formatDate(baby.birth_date)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Multiple Babies */}
        {babies.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Switch Baby</Text>
            {babies.map((b) => (
              <TouchableOpacity
                key={b.baby_id}
                style={[
                  styles.babyOption,
                  baby?.baby_id === b.baby_id && styles.babyOptionActive,
                ]}
                onPress={() => setBaby(b)}
              >
                <View style={styles.babyOptionAvatar}>
                  <Text style={styles.babyOptionInitial}>{b.name[0]}</Text>
                </View>
                <Text style={styles.babyOptionName}>{b.name}</Text>
                {baby?.baby_id === b.baby_id && (
                  <Ionicons name="checkmark-circle" size={24} color="#7C3AED" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Family Sharing */}
        {baby && baby.user_id === user?.user_id && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family Sharing</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Invite family members or caregivers to track {baby.name}'s activities
            </Text>
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => setInviteModalVisible(true)}
            >
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.inviteButtonText}>Invite Caregiver</Text>
            </TouchableOpacity>

            {baby.shared_with?.length > 0 && (
              <View style={styles.sharedWith}>
                <Text style={styles.sharedWithTitle}>
                  Shared with {baby.shared_with.length} caregiver(s)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Invites</Text>
            {pendingInvites.map((invite) => (
              <View key={invite.invite_id} style={styles.inviteCard}>
                <View style={styles.inviteInfo}>
                  <Text style={styles.inviteText}>
                    {invite.inviter_name} invited you to track {invite.baby_name}
                  </Text>
                </View>
                <View style={styles.inviteActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptInvite(invite.invite_id)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDeclineInvite(invite.invite_id)}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-baby')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#7C3AED" />
            <Text style={styles.actionButtonText}>Add New Baby</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#7C3AED" />
            <Text style={styles.actionButtonText}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
              <Ionicons name="close" size={28} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invite Caregiver</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Enter the email address of the person you want to invite. They'll need
              to sign up or log in with this email to accept the invite.
            </Text>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="email@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.sendInviteButton,
                !inviteEmail.trim() && styles.sendInviteButtonDisabled,
              ]}
              onPress={handleSendInvite}
              disabled={!inviteEmail.trim() || sendingInvite}
            >
              {sendingInvite ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sendInviteButtonText}>Send Invite</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      )}
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
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  notLoggedInText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
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
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  babyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  babyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  babyInitial: {
    fontSize: 28,
    fontWeight: '600',
    color: '#7C3AED',
  },
  babyInfo: {
    marginLeft: 16,
    flex: 1,
  },
  babyName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  babyAge: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
    marginTop: 2,
  },
  babyBirthdate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  babyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  babyOptionActive: {
    borderColor: '#7C3AED',
    borderWidth: 2,
  },
  babyOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  babyOptionInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  babyOptionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sharedWith: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
  },
  sharedWithTitle: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  inviteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  inviteInfo: {
    marginBottom: 12,
  },
  inviteText: {
    fontSize: 14,
    color: '#374151',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
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
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sendInviteButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendInviteButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendInviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
