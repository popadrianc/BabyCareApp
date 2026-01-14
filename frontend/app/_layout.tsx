import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { BabyProvider } from '../src/contexts/BabyContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BabyProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F8F4FF' },
            }}
          />
        </BabyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
