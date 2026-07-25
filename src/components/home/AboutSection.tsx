import React, { useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { instructorsData, type InstructorProfile } from '../../data/gravityContent';

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('');
}

function InstructorAvatar({ instructor }: { instructor: InstructorProfile }) {
  if (instructor.avatar) {
    return (
      <Image
        source={instructor.avatar}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View className="h-full w-full items-center justify-center bg-blue-100 dark:bg-slate-600">
      <Text className="text-4xl font-extrabold text-primary-blue dark:text-slate-100">
        {getInitials(instructor.name)}
      </Text>
    </View>
  );
}

function InstructorCard({
  instructor,
  cardWidth,
}: {
  instructor: InstructorProfile;
  cardWidth: number;
}) {
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
        <InstructorAvatar instructor={instructor} />
      </View>

      <View className="items-center">
        <Text className="text-center text-2xl font-extrabold text-gray-900 dark:text-slate-100">
          {instructor.name}
        </Text>
        <Text className="mb-4 mt-1 text-base font-extrabold text-blue-600 dark:text-accent-blue">
          {instructor.title}
        </Text>
        <Text
          className="mb-5 text-center text-sm leading-6 text-gray-500 dark:text-slate-400"
          numberOfLines={3}
        >
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
  const [pageWidth, setPageWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(Math.max(0, Math.min(index, instructorsData.length - 1)));
  };

  return (
    <View className="mx-auto w-full max-w-[720px] py-8">
      <View className="mb-8 items-center px-4">
        <Text className="mb-4 text-center text-4xl font-extrabold tracking-tight text-primary-blue dark:text-slate-100">
          Hakkımızda
        </Text>
        <Text className="text-center text-lg leading-8 text-gray-600 dark:text-slate-400">
          Agora Go Akademisi olarak vizyonumuz, her seviyedeki oyuncunun gelişimine katkı
          sağlamak, go kültürünü yaymak ve oyunun Türkiye&apos;de daha geniş kitlelere
          ulaşmasını sağlamaktır.
        </Text>
      </View>

      <View className="mb-6 items-center">
        <Text className="text-sm font-extrabold uppercase tracking-widest text-blue-500 dark:text-accent-blue">
          Takımımız
        </Text>
      </View>

      <View
        onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
        className="overflow-hidden"
      >
        {pageWidth > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
          >
            {instructorsData.map((instructor) => (
              <View
                key={instructor.id}
                style={{ width: pageWidth }}
                className="items-center px-1"
              >
                <InstructorCard instructor={instructor} cardWidth={pageWidth - 8} />
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View className="mt-5 flex-row items-center justify-center gap-1.5">
        {instructorsData.map((instructor, index) => (
          <View
            key={instructor.id}
            className={`h-1.5 rounded-full ${
              index === activeIndex
                ? 'w-4 bg-accent-blue'
                : 'w-1.5 bg-slate-200 dark:bg-slate-600'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
