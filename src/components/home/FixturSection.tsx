import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import {
  fallbackLeagueData,
  fetchLeagueData,
  type League,
  type LeagueMatch,
} from '../../data/leagueData';

export function FixturSection() {
  const router = useRouter();
  const [leagues, setLeagues] = React.useState<League[]>(() =>
    [...fallbackLeagueData].sort((a, b) => b.id - a.id)
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedWeeks, setSelectedWeeks] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    let active = true;
    fetchLeagueData()
      .then((remoteLeagues) => {
        if (!active || remoteLeagues.length === 0) return;
        setLeagues([...remoteLeagues].sort((a, b) => b.id - a.id));
      })
      .catch(() => {
        // yerel veri kullanılmaya devam eder
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const getWeek = (leagueId: number) => selectedWeeks[leagueId] ?? 1;

  const setWeek = (leagueId: number, week: number) =>
    setSelectedWeeks((prev) => ({ ...prev, [leagueId]: week }));

  const getStandings = (league: League) => {
    const stats = new Map<string, { name: string; wins: number; losses: number; sos: number }>();
    const defeated = new Map<string, Set<string>>();

    league.players.forEach((p) => {
      stats.set(p.id, { name: p.name, wins: 0, losses: 0, sos: 0 });
      defeated.set(p.id, new Set());
    });

    league.matches.forEach((m) => {
      if (!m.winnerId) return;
      const loserId = m.winnerId === m.p1Id ? m.p2Id : m.p1Id;
      const w = stats.get(m.winnerId);
      const l = stats.get(loserId);
      if (w) w.wins++;
      if (l) l.losses++;
      defeated.get(m.winnerId)?.add(loserId);
    });

    stats.forEach((entry, pid) => {
      entry.sos = Array.from(defeated.get(pid) ?? []).reduce(
        (sum, opp) => sum + (stats.get(opp)?.wins ?? 0),
        0
      );
    });

    return Array.from(stats.values()).sort((a, b) =>
      b.wins !== a.wins ? b.wins - a.wins : b.sos - a.sos
    );
  };

  return (
    <View className="mt-6 mb-2">
      {/* Başlık */}
      <View className="flex-row items-center justify-between mb-4 px-1">
        <View>
          <Text className="text-xl font-extrabold text-primary-blue">Lig Fikstürü</Text>
          <Text className="text-xs text-gray-400 mt-0.5">Güncel puan durumu ve maç sonuçları</Text>
        </View>
        <Pressable
          onPress={() => router.push('/fikstur')}
          className="bg-primary-blue/10 px-3 py-1.5 rounded-full"
        >
          <Text className="text-xs font-bold text-primary-blue">Tümü →</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="bg-white rounded-3xl border border-gray-100 p-6 items-center">
          <ActivityIndicator size="small" color="#1d4ed8" />
          <Text className="text-sm text-gray-400 mt-2">Lig verileri yükleniyor…</Text>
        </View>
      ) : (
        leagues.map((league) => {
          const currentWeek = getWeek(league.id);
          const weekMatches = league.matches.filter((m) => m.week === currentWeek);
          const standings = getStandings(league);
          const maxWeek = Math.max(...league.matches.map((m) => m.week), 1);

          return (
            <View
              key={league.id}
              className="bg-white rounded-3xl border border-gray-100 p-4 mb-4 shadow-sm"
            >
              {/* Lig başlığı */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-base font-extrabold text-gray-900" numberOfLines={1}>
                    {league.name}
                  </Text>
                  <Text className="text-xs font-semibold text-blue-600">{league.sub}</Text>
                </View>
                <StatusBadge status={league.status} />
              </View>

              {/* Puan Tablosu */}
              <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Puan Durumu
              </Text>
              <View className="bg-gray-50 rounded-2xl p-3 mb-3">
                {/* Tablo başlığı */}
                <View className="flex-row mb-1">
                  <Text className="w-7 text-[10px] font-bold text-gray-400 text-center">#</Text>
                  <Text className="flex-1 text-[10px] font-bold text-gray-400">Oyuncu</Text>
                  <Text className="w-8 text-[10px] font-bold text-emerald-600 text-center">G</Text>
                  <Text className="w-8 text-[10px] font-bold text-rose-500 text-center">M</Text>
                  <Text className="w-10 text-[10px] font-bold text-gray-400 text-center">SOS</Text>
                </View>
                {standings.map((row, i) => (
                  <View
                    key={row.name}
                    className="flex-row items-center py-1.5 border-t border-gray-100"
                  >
                    <Text className="w-7 text-[11px] text-gray-400 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </Text>
                    <Text className="flex-1 text-[12px] font-semibold text-gray-800" numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text className="w-8 text-[12px] font-bold text-emerald-600 text-center">
                      {row.wins}
                    </Text>
                    <Text className="w-8 text-[12px] font-bold text-rose-500 text-center">
                      {row.losses}
                    </Text>
                    <Text className="w-10 text-[12px] text-gray-500 text-center">{row.sos}</Text>
                  </View>
                ))}
              </View>

              {/* Hafta seçici */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Hafta Maçları
                </Text>
                <View className="flex-row items-center gap-1">
                  <Pressable
                    onPress={() => setWeek(league.id, Math.max(1, currentWeek - 1))}
                    className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Text className="text-gray-600 text-xs font-bold">‹</Text>
                  </Pressable>
                  <Text className="text-xs font-bold text-primary-blue px-1">{currentWeek}. Hafta</Text>
                  <Pressable
                    onPress={() => setWeek(league.id, Math.min(maxWeek, currentWeek + 1))}
                    className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Text className="text-gray-600 text-xs font-bold">›</Text>
                  </Pressable>
                </View>
              </View>

              {/* Maçlar */}
              {weekMatches.length === 0 ? (
                <Text className="text-xs italic text-gray-400 text-center py-3">
                  Bu hafta için fikstür belirlenmedi.
                </Text>
              ) : (
                weekMatches.map((m) => (
                  <MatchRow key={m.id} match={m} league={league} />
                ))
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isStarted = status === 'Ligler Başladı';
  const isOpen = status === 'Kayıtlar Devam Ediyor';
  const colorClass = isStarted
    ? 'bg-yellow-50 border-yellow-200'
    : isOpen
    ? 'bg-emerald-50 border-emerald-200'
    : 'bg-gray-50 border-gray-200';
  const textClass = isStarted
    ? 'text-yellow-700'
    : isOpen
    ? 'text-emerald-700'
    : 'text-gray-600';

  return (
    <View className={`px-2 py-1 rounded-full border ${colorClass}`}>
      <Text className={`text-[10px] font-bold ${textClass}`}>{status}</Text>
    </View>
  );
}

function MatchRow({ match, league }: { match: LeagueMatch; league: League }) {
  const p1 = league.players.find((p) => p.id === match.p1Id)?.name ?? '-';
  const p2 = league.players.find((p) => p.id === match.p2Id)?.name ?? '-';
  const winner = match.winnerId
    ? league.players.find((p) => p.id === match.winnerId)?.name
    : null;

  return (
    <View className="py-2 border-t border-gray-50">
      <View className="flex-row items-center">
        <Text
          className={`flex-1 text-right text-xs ${
            match.winnerId === match.p1Id
              ? 'font-extrabold text-gray-900'
              : 'font-medium text-gray-500'
          }`}
          numberOfLines={1}
        >
          {p1}
        </Text>
        <Text className="text-[10px] font-bold text-gray-400 px-2">vs</Text>
        <Text
          className={`flex-1 text-xs ${
            match.winnerId === match.p2Id
              ? 'font-extrabold text-gray-900'
              : 'font-medium text-gray-500'
          }`}
          numberOfLines={1}
        >
          {p2}
        </Text>
      </View>
      {winner ? (
        <Text className="text-center text-[10px] text-emerald-600 font-semibold mt-0.5">
          ✓ {winner}
        </Text>
      ) : (
        <Text className="text-center text-[10px] text-gray-400 mt-0.5">Bekleniyor</Text>
      )}
    </View>
  );
}
