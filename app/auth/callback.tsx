import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { completeSupabaseSessionFromUrl } from '../../src/lib/authSessionFromUrl';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const url =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.href
          : (await Linking.getInitialURL()) ?? '';

      if (!url) {
        if (!cancelled) router.replace('/(auth)');
        return;
      }

      const { error: sessionError } = await completeSupabaseSessionFromUrl(url);
      if (cancelled) return;

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/');
      }

      router.replace('/(tabs)');
    }

    void finishAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {error ? (
        <Text className="text-center text-red-500">{error}</Text>
      ) : (
        <ActivityIndicator color="#3b82f6" size="large" />
      )}
    </View>
  );
}
