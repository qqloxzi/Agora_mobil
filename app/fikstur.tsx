import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fallbackLeagueData,
  fetchLeagueData,
  type League,
  type LeagueMatch,
} from '../src/data/leagueData';

export default function FiksturScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [leagues, setLeagues] = React.useState<League[]>(fallbackLeagueData);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    fetchLeagueData()
      .then((remoteLeagues) => {
        if (!active || remoteLeagues.length === 0) return;
        setLeagues(remoteLeagues);
        setErrorMsg(null);
      })
      .catch((error) => {
        console.warn('Supabase lig verisi yüklenemedi, yerel veri kullanılıyor:', error);
        setErrorMsg('Lig verisi Supabase üzerinden yüklenemedi. Geçici olarak yerel kayıtlar gösteriliyor.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
          <Text className="text-sm text-gray-500">Lig verileri Supabase üzerinden yüklenir.</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="bg-white rounded-3xl border border-gray-100 p-6 mb-5 items-center">
          <ActivityIndicator size="small" color="#1d4ed8" />
          <Text className="text-sm text-gray-500 mt-3">Lig kayıtları yükleniyor...</Text>
        </View>
      ) : null}

      {errorMsg ? (
        <View className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-5">
          <Text className="text-sm font-semibold text-amber-700">{errorMsg}</Text>
        </View>
      ) : null}

      {leagues.map((league) => (
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
              <Text key={player.id} className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">{player.name}</Text>
            ))}
          </View>

          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Maç Fikstürü</Text>
          {league.matches.length === 0 ? (
            <Text className="text-sm italic text-gray-400">Fikstür için en az iki oyuncu gerekli.</Text>
          ) : (
            groupMatchesByWeek(league.matches).map(([week, matches]) => (
              <View key={`${league.id}-${week}`} className="mb-3">
                <Text className="text-xs font-bold text-blue-600 mb-1">Hafta {week}</Text>
                {matches.map((match) => (
                  <View key={match.id} className="flex-row items-center justify-between py-2 border-b border-gray-50">
                    <Text className="text-sm text-gray-800 flex-1 text-right" numberOfLines={1}>
                      {getPlayerName(league, match.p1Id)}
                    </Text>
                    <Text className="text-xs font-bold text-gray-400 px-3">vs</Text>
                    <Text className="text-sm text-gray-800 flex-1" numberOfLines={1}>
                      {getPlayerName(league, match.p2Id)}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function getPlayerName(league: League, playerId: string): string {
  return league.players.find((player) => player.id === playerId)?.name ?? '-';
}

function groupMatchesByWeek(matches: LeagueMatch[]): Array<[number, LeagueMatch[]]> {
  const grouped = new Map<number, LeagueMatch[]>();

  matches.forEach((match) => {
    const weekMatches = grouped.get(match.week) ?? [];
    weekMatches.push(match);
    grouped.set(match.week, weekMatches);
  });

  return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
}
