import React, { useEffect } from 'react';
import { useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

/**
 * Cold start / deep-link auth gate.
 * Unauthenticated users must land on (auth); authenticated users leave (auth).
 * Allows auth/callback while OAuth exchange is in progress.
 *
 * Always renders `children` (the root Stack) so navigation can mount;
 * redirects run only after the navigator is ready.
 */
export function RootNavigationGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const navReady = Boolean(navigationState?.key);

  useEffect(() => {
    if (loading || !navReady) return;

    const root = segments[0];
    const inAuthGroup = root === '(auth)';
    const inAuthCallback = root === 'auth';

    if (!user && !inAuthGroup && !inAuthCallback) {
      router.replace('/(auth)');
      return;
    }

    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, navReady, segments, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
