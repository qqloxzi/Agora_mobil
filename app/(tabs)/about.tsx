import React from 'react';
import { View, Text, ScrollView, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

function TeamRow({ member }: { member: TeamMember }) {
  return (
    <View className="flex-row items-center w-full mb-8">
      <View className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mr-5">
        <Image source={{ uri: member.avatarUri }} className="w-full h-full" resizeMode="cover" />
      </View>
      <View className="flex-1">
        <Text className="text-xl font-bold text-gray-900">{member.name}</Text>
        <Text className="text-sm font-medium tracking-wide text-blue-600 mb-2">{member.level}</Text>
        <Text className="text-gray-600 text-base leading-relaxed">{member.bio}</Text>
      </View>
    </View>
  );
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        paddingTop: insets.top + 32,
        paddingBottom: insets.bottom + 64,
        paddingHorizontal: 24,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={false}>
      
      <View className="w-full max-w-2xl">
        {/* Header */}
        <Text className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4 text-center">
          Hakkımızda
        </Text>
        <Text className="text-lg text-gray-500 leading-8 mb-16 text-center">
          Agora Go Akademisi olarak vizyonumuz, her seviyedeki oyuncunun gelişimine katkı sağlamak, go kültürünü yaymak ve oyunun Türkiye'de daha geniş kitlelere ulaşmasını sağlamaktır.
        </Text>

        <Text className="text-2xl font-bold text-gray-800 mb-8 border-b border-gray-100 pb-2">
          Ekibimiz
        </Text>

        {/* Ekip listesi */}
        <View className="flex-col w-full">
          {TEAM.map((member) => (
            <TeamRow key={member.name} member={member} />
          ))}
        </View>
      </View>

    </ScrollView>
  );
}
