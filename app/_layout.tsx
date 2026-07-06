import { Stack } from 'expo-router';
import React from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '../src/context/AuthContext';
import { OnboardingProvider } from '../src/context/OnboardingContext';
import { AuthDeepLinkHandler } from '../src/components/AuthDeepLinkHandler';

import "../global.css";

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <AuthDeepLinkHandler />
        <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="course-detail/[slug]" options={{ presentation: 'card' }} />
          <Stack.Screen name="atolyeler-detay/[slug]" options={{ presentation: 'card' }} />
          <Stack.Screen name="atolyeler/[slug]" options={{ presentation: 'card' }} />
          <Stack.Screen name="fikstur" options={{ presentation: 'card' }} />
          <Stack.Screen name="contact" options={{ presentation: 'card' }} />
          <Stack.Screen name="blog/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="blog/[slug]" options={{ presentation: 'card' }} />
          <Stack.Screen name="instructor/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="instructor/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
        </Stack>
      </OnboardingProvider>
    </AuthProvider>
  );
}