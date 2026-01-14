import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useBaby } from '../src/contexts/BabyContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { isLoading: babyLoading } = useBaby();

  if (authLoading || babyLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F4FF',
  },
});
