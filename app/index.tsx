import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) setIsReady(true);
  }, [loading]);

  if (!isReady || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  // If already authenticated, go directly to tabs
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View className="flex-1 bg-[#f9fafb] relative">
      <View className="flex-1 items-center pt-[30%]">
        <Image 
          source={require('../public/background.png')} 
          style={{ width: 140, height: 140 }} 
          resizeMode="contain" 
        />
      </View>

      <View 
        className="w-full bg-white rounded-t-[40px] px-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
        style={{ paddingTop: 40, paddingBottom: Math.max(insets.bottom + 20, 40) }}
      >
        <Text className="text-3xl font-extrabold text-center text-[#2D3748] mb-4">
          Çevrimiçi <Text className="text-blue-500">Go Eğitim</Text>{"\n"}Platformu
        </Text>
        <Text className="text-[15px] font-medium text-gray-500 text-center mb-10 px-2 leading-relaxed">
          Stratejik düşüncenizi geliştirin ve Go dünyasını keşfedin.
        </Text>

        <Pressable 
          className="w-full bg-blue-500 rounded-2xl py-4 items-center mb-4 active:opacity-90"
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text className="text-white font-bold text-lg">Başla</Text>
        </Pressable>

        <Pressable 
          className="w-full bg-gray-100 rounded-2xl py-4 items-center active:opacity-90"
          onPress={() => router.push('/(auth)')}
        >
          <Text className="text-gray-700 font-bold text-lg">Zaten hesabım var</Text>
        </Pressable>
      </View>
    </View>
  );
}
