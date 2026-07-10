import React from 'react';
import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { instructorsData, type InstructorProfile } from '../../data/gravityContent';

function InstructorCard({ instructor, cardWidth }: { instructor: InstructorProfile; cardWidth: number }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/instructor/${instructor.id}`)}
      className="items-center rounded-3xl bg-white dark:bg-dark-card p-6 active:opacity-90 border border-slate-100 dark:border-dark-border"
      style={{ width: cardWidth } as any}
      accessibilityRole="button"
    >
      <View
        className="mb-6 overflow-hidden rounded-full bg-blue-50 dark:bg-slate-700"
        style={{ width: 176, height: 176, borderWidth: 4, borderColor: '#f8fbff' }}
      >
        <Image
          source={instructor.avatar}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      <View className="items-center">
        <Text className="text-center text-2xl font-extrabold text-gray-900 dark:text-slate-100">{instructor.name}</Text>
        <Text className="mb-4 mt-1 text-base font-extrabold text-blue-600 dark:text-accent-blue">{instructor.title}</Text>
        <Text className="mb-5 text-center text-sm leading-6 text-gray-500 dark:text-slate-400" numberOfLines={3}>
          {instructor.about}
        </Text>

        <View className="w-full flex-row items-center justify-center gap-1 border-t border-blue-50 dark:border-dark-border pt-4">
          <Text className="text-xs font-bold text-gray-400 dark:text-slate-500">Detaylar</Text>
          <Ionicons name="arrow-forward" size={12} color="#9ca3af" />
        </View>
      </View>
    </Pressable>
  );
}

export function AboutSection() {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const cardWidth = isWide ? Math.min((width - 64) / 2, 320) : width - 40;

  return (
    <View className="mx-auto w-full max-w-[720px] py-8">
      {/* Başlık */}
      <View className="mb-10 items-center px-4">
        <Text className="mb-6 text-center text-4xl font-extrabold tracking-tight text-primary-blue dark:text-slate-100">
          Hakkımızda
        </Text>
        <Text className="text-center text-lg leading-8 text-gray-600 dark:text-slate-400">
          Agora Go Akademisi olarak vizyonumuz, her seviyedeki oyuncunun gelişimine katkı
          sağlamak, go kültürünü yaymak ve oyunun Türkiye&apos;de daha geniş kitlelere
          ulaşmasını sağlamaktır.
        </Text>
      </View>

      {/* Eğitmenler başlığı */}
      <View className="mb-8 items-center">
        <Text className="mb-2 text-sm font-extrabold uppercase tracking-widest text-blue-500 dark:text-accent-blue">
          Takımımız
        </Text>
        <Text className="text-center text-3xl font-extrabold tracking-tight text-primary-blue dark:text-slate-100">
          Eğitmenlerimiz
        </Text>
      </View>

      {/* Eğitmen kartları */}
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
    </View>
  );
}
