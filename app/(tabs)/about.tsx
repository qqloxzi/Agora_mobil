import React from 'react';
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { instructorsData, type InstructorProfile } from '../../src/data/gravityContent';

function InstructorCard({ instructor, cardWidth }: { instructor: InstructorProfile; cardWidth: number }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/instructor/${instructor.id}`)}
      className="items-center rounded-3xl bg-white p-6 active:opacity-90"
      style={{
        width: cardWidth,
        borderWidth: 1,
        borderColor: 'rgba(10,37,64,0.05)',
        boxShadow: '0px 10px 24px rgba(10,37,64,0.08)',
      } as any}
      accessibilityRole="button"
    >
      <View
        className="mb-6 overflow-hidden rounded-full bg-blue-50"
        style={{
          width: 176,
          height: 176,
          borderWidth: 4,
          borderColor: '#f8fbff',
        }}
      >
        <Image
          source={instructor.avatar}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      <View className="items-center">
        <Text className="text-center text-2xl font-extrabold text-gray-900">{instructor.name}</Text>
        <Text className="mb-4 mt-1 text-base font-extrabold text-blue-600">{instructor.title}</Text>
        <Text className="mb-5 text-center text-sm leading-6 text-gray-500" numberOfLines={3}>
          {instructor.about}
        </Text>

        <View className="w-full flex-row items-center justify-center gap-1 border-t border-blue-50 pt-4">
          <Text className="text-xs font-bold text-gray-400">Detaylar</Text>
          <Ionicons name="arrow-forward" size={12} color="#9ca3af" />
        </View>
      </View>
    </Pressable>
  );
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const cardWidth = isWide ? Math.min((width - 64) / 2, 320) : width - 40;

  return (
    <ScrollView
      className="flex-1 bg-ice-white"
      contentContainerStyle={{
        paddingTop: insets.top + 36,
        paddingBottom: insets.bottom + 80,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mx-auto mb-16 max-w-[720px] items-center">
        <Text className="mb-6 text-center text-4xl font-extrabold tracking-tight text-primary-blue">
          Hakkımızda
        </Text>
        <Text className="text-center text-lg leading-8 text-gray-600">
          Agora Go Akademisi olarak vizyonumuz, her seviyedeki oyuncunun gelişimine katkı
          sağlamak, go kültürünü yaymak ve oyunun Türkiye&apos;de daha geniş kitlelere
          ulaşmasını sağlamaktır.
        </Text>
      </View>

      <View className="mb-10 items-center">
        <Text className="mb-2 text-sm font-extrabold uppercase tracking-widest text-blue-500">
          Takımımız
        </Text>
        <Text className="text-center text-3xl font-extrabold tracking-tight text-primary-blue">
          Eğitmenlerimiz
        </Text>
      </View>

      <View
        className="items-center"
        style={{
          flexDirection: isWide ? 'row' : 'column',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        {instructorsData.map((instructor) => (
          <InstructorCard key={instructor.id} instructor={instructor} cardWidth={cardWidth} />
        ))}
      </View>
    </ScrollView>
  );
}
