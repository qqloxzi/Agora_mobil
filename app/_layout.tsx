import { Stack } from 'expo-router';
import React from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '../src/context/AuthContext';

import "../global.css";

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="course-detail/[slug]" options={{ presentation: 'card' }} />
        <Stack.Screen name="go-tree/problem" options={{ presentation: 'card' }} />
      </Stack>
    </AuthProvider>
  );
}