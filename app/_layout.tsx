import { Stack } from 'expo-router';
import React from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '../src/context/AuthContext';
import { OnboardingProvider } from '../src/context/OnboardingContext';
import { SettingsProvider } from '../src/context/SettingsContext';
import { AuthDeepLinkHandler } from '../src/components/AuthDeepLinkHandler';
import { RootNavigationGate } from '../src/screens/RootNavigationGate';

import "../global.css";


export { ErrorBoundary } from 'expo-router';

/** Prefer login for cold start; gate still redirects if session exists. */
export const unstable_settings = { initialRouteName: '(auth)' };

export default function RootLayout() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <OnboardingProvider>
          <AuthDeepLinkHandler />
          <RootNavigationGate>
            <Stack screenOptions={{ headerShown: false }} initialRouteName="(auth)">
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
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
          </RootNavigationGate>
        </OnboardingProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
