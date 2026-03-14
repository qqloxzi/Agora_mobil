import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const onSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Oturum açmamış: giriş ekranına yönlendiren CTA
  if (!user) {
    return (
      <View
        className="flex-1 bg-neutral-50 px-6"
        style={{ paddingTop: insets.top + 24 }}>
        <Text className="text-2xl font-bold text-neutral-800 mb-2">Profilim</Text>
        <Text className="text-neutral-500 mb-8">
          İlerlemenizi kaydetmek ve profilinizi görmek için giriş yapın.
        </Text>
        <Pressable
          onPress={() => router.push('/(auth)')}
          className="w-full flex-row items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3.5 active:opacity-90">
          <Ionicons name="logo-google" size={20} color="#1f2937" />
          <Text className="text-base font-semibold text-neutral-800">Google ile Devam Et</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(auth)')}
          className="w-full rounded-xl bg-neutral-700 py-3.5 items-center mt-4 active:opacity-90">
          <Text className="text-base font-semibold text-white">E-posta ile Giriş Yap</Text>
        </Pressable>
      </View>
    );
  }

  // Oturum açmış: profil içeriği
  return (
    <View
      className="flex-1 bg-neutral-50 px-6"
      style={{ paddingTop: insets.top + 24 }}>
      <Text className="text-2xl font-bold text-neutral-800 mb-2">Profilim</Text>
      <Text className="text-neutral-500 mb-6">{user.email}</Text>

      <View className="mb-8 rounded-xl bg-white border border-neutral-200 p-4">
        <Text className="text-sm text-neutral-500 mb-1">Seviye</Text>
        <Text className="text-lg font-semibold text-neutral-800">5</Text>
        <Text className="text-xs text-neutral-400 mt-1">Gamification metrikleri buraya gelecek.</Text>
      </View>

      <Pressable
        onPress={onSignOut}
        className="w-full rounded-xl border border-red-200 bg-red-50 py-3 items-center active:opacity-90">
        <Text className="text-base font-semibold text-red-600">Çıkış Yap</Text>
      </Pressable>
    </View>
  );
}
