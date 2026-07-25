import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../common/Button';
import { Ionicons } from '@expo/vector-icons';
import { shadowStyle } from '../../lib/shadowStyle';
import {
  fallbackSeasonSettings,
  fetchActiveSeasonSettings,
} from '../../data/seasonSettings';

const LEAGUES = [
  { id: 'temel-taslar', name: 'Temel Taşlar Ligi', level: '17–12 Kyu' },
  { id: 'gelisim', name: 'Gelişim Ligi', level: '11–6 Kyu' },
  { id: 'aydinlanma', name: 'Aydınlanma Ligi', level: '5–1 Kyu' },
];

export function HeroSection() {
  const router = useRouter();
  const [seasonSettings, setSeasonSettings] = React.useState(fallbackSeasonSettings);

  React.useEffect(() => {
    let active = true;
    fetchActiveSeasonSettings()
      .then((settings) => { if (active) setSeasonSettings(settings); })
      .catch((error) => { console.warn('Sezon ayarları yüklenemedi, yerel değerler kullanılıyor:', error); });
    return () => { active = false; };
  }, []);

  return (
    <View className="mb-10 mt-4 items-center">
      {/* Announcement Card — Yeni sezon duyurusu */}
      <View
        className="w-full rounded-[30px] bg-white dark:bg-dark-card p-6 border border-slate-200/50 dark:border-dark-border mb-4"
        style={shadowStyle({ width: 0, height: 10 }, 30, 0.05, '#000', 8)}
      >
        <View className="self-start rounded-full bg-accent-blue/10 border border-accent-blue/20 px-4 py-1.5 mb-5 flex-row items-center">
          <View className="w-1.5 h-1.5 rounded-full bg-accent-blue mr-2" />
          <Text className="text-[10px] font-bold tracking-widest text-accent-blue uppercase">
            {seasonSettings.heroEyebrow}
          </Text>
        </View>

        <Text className="text-2xl font-black text-ink dark:text-slate-100 leading-8 mb-6">
          {seasonSettings.heroTitle}
        </Text>

        <View className="mb-6">
          {LEAGUES.map((league, index) => (
            <Pressable
              key={league.id}
              onPress={() => router.push(`/course-detail/${league.id}`)}
              className={`flex-row items-center justify-between py-4 active:bg-gray-50/50 dark:active:bg-slate-700/50 rounded-2xl px-2 ${index !== LEAGUES.length - 1 ? 'border-b border-slate-100 dark:border-dark-border' : ''}`}
            >
              <View>
                <Text className="text-[17px] font-bold text-ink dark:text-slate-100 mb-1">{league.name}</Text>
                <Text className="text-[13px] font-medium text-ink/50 dark:text-slate-500">{league.level}</Text>
              </View>
              <View className="rounded-full bg-ink dark:bg-accent-blue px-4 py-2">
                <Text className="text-[11px] font-bold text-white">Kayıtlar Açık</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Button
          title="Eğitim Programları"
          onPress={() => router.push('/(tabs)/courses')}
          icon={<Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />}
        />
      </View>
    </View>
  );
}
