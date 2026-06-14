import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { leagueData } from '../src/data/gravityContent';

export default function FiksturScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-ice-white"
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 18, paddingBottom: insets.bottom + 36 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center gap-3 mb-6">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100">
          <Ionicons name="arrow-back" size={18} color="#0a2540" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-extrabold text-primary-blue">Fikstür</Text>
          <Text className="text-sm text-gray-500">Gravity lig akışı mobil görünüme uyarlandı.</Text>
        </View>
      </View>

      {leagueData.map((league) => (
        <View key={league.id} className="bg-white rounded-3xl border border-gray-100 p-5 mb-5">
          <View className="flex-row items-start justify-between gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xl font-extrabold text-gray-900">{league.name}</Text>
              <Text className="text-sm font-semibold text-blue-600 mt-1">{league.sub}</Text>
            </View>
            <Text className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">{league.status}</Text>
          </View>

          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Oyuncular</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {league.players.map((player) => (
              <Text key={player} className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">{player}</Text>
            ))}
          </View>

          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sonuçlar</Text>
          {league.results.map((result, index) => (
            <View key={`${league.id}-${index}`} className="flex-row items-center justify-between py-2 border-b border-gray-50">
              <Text className="text-xs font-bold text-gray-400">Hafta {result.week}</Text>
              <Text className="text-sm text-gray-800 flex-1 text-right">
                <Text className="font-bold text-emerald-700">{result.winner}</Text>  -  {result.loser}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
