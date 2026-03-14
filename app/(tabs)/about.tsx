import React from 'react';
import { View, Text, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shadowStyle } from '../../src/lib/shadowStyle';

interface TeamMember {
  name: string;
  level: string;
  bio: string;
  avatarUri: string;
}

const TEAM: TeamMember[] = [
  {
    name: 'Tuğkan Eren',
    level: '4 Dan',
    bio: 'Go alanında 15 yılı aşkın tecrübeye sahiptir ve Türkiye Go Milli Takımı oyuncusudur.',
    avatarUri: 'https://ui-avatars.com/api/?name=Tu%C4%9Fkan+Eren&size=256&background=1e3a5f&color=fff&bold=true',
  },
  {
    name: 'Oğuz Erdoğan',
    level: '1 Dan',
    bio: "4 yıldır go oynuyor. Hem Goizm'de hem de İytego'da başkanlık yapmış ve hâlâ İytego'da haftalık buluşmalarda dersler veriyor.",
    avatarUri: 'https://ui-avatars.com/api/?name=O%C4%9Fuz+Erdo%C4%9Fan&size=256&background=1e3a5f&color=fff&bold=true',
  },
  {
    name: 'Ali Karakaya',
    level: '5 Kyu',
    bio: "2 yıldır go oynuyor. Bu dönemde Goizm'de ve İytego'da aktif rol alıyor.",
    avatarUri: 'https://ui-avatars.com/api/?name=Ali+Karakaya&size=256&background=1e3a5f&color=fff&bold=true',
  },
];

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <View className="rounded-2xl bg-white border border-gray-200 overflow-hidden mb-6" style={shadowStyle({ width: 0, height: 2 }, 8, 0.06, '#000', 3)}>
      <View className="w-full aspect-square bg-gray-100">
        <Image source={{ uri: member.avatarUri }} className="w-full h-full" resizeMode="cover" />
      </View>
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900">{member.name}</Text>
        <Text className="text-sm font-semibold text-blue-600 mt-1">{member.level}</Text>
        <Text className="text-gray-600 text-sm leading-relaxed mt-2">{member.bio}</Text>
      </View>
    </View>
  );
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 600;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 24,
      }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text className="text-3xl font-extrabold text-gray-900 mb-3">Hakkımızda</Text>
      <Text className="text-base text-gray-600 leading-relaxed mb-8">
        Agora Go Akademisi olarak vizyonumuz, her seviyedeki oyuncunun gelişimine katkı sağlamak, go kültürünü yaymak ve oyunun Türkiye'de daha geniş kitlelere ulaşmasını sağlamaktır.
      </Text>

      {/* Ekip kartları: mobilde dikey, tablet/geniş ekranda yatay */}
      <View className={isWide ? 'flex-row flex-wrap gap-6' : ''}>
        {TEAM.map((member) => (
          <View key={member.name} style={isWide ? { flex: 1, minWidth: 180, maxWidth: 280 } : undefined}>
            <TeamCard member={member} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
