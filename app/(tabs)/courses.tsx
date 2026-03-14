import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  useWindowDimensions,
  ListRenderItem,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { CourseListItem } from '../../src/types/course';
import { getLigCourses } from '../../src/lib/courses';
import { getKyuRangeLabel } from '../../src/lib/courses';

function CourseCard({
  item,
  onPress,
  cardWidth,
}: {
  item: CourseListItem;
  onPress: () => void;
  cardWidth: number;
}) {
  const kyuBadge = getKyuRangeLabel(item.level);
  return (
    <Pressable
      onPress={onPress}
      className="rounded-t-2xl overflow-hidden bg-white border border-gray-200 active:opacity-95 mb-4"
      style={{ width: cardWidth }}>
      <View className="relative w-full bg-gray-200" style={{ aspectRatio: 16 / 9 }}>
        <View className="absolute inset-0 items-center justify-center bg-gray-300">
          <View className="w-16 h-16 rounded-full bg-white/80 items-center justify-center">
            <Text className="text-3xl text-gray-600">囲</Text>
          </View>
        </View>
        <View className="absolute top-3 right-3 rounded bg-white/95 px-2 py-1 shadow-sm">
          <Text className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">{kyuBadge}</Text>
        </View>
      </View>
      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {item.provider || 'Agora Academy'}
          </Text>
          <Text className="text-base font-bold text-gray-900" numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLigCourses().then(({ data, error: err }) => {
      setLoading(false);
      if (err) setError(err.message);
      else setCourses(data);
    });
  }, []);

  const numColumns = width >= 600 ? 2 : 1;
  const padding = 16;
  const gap = 12;
  const cardWidth = numColumns === 1 ? width - padding * 2 : (width - padding * 2 - gap) / 2;

  const renderItem: ListRenderItem<CourseListItem> = ({ item }) => (
    <View style={numColumns > 1 ? { width: cardWidth, marginRight: gap, marginBottom: 0 } : { width: cardWidth }}>
      <CourseCard
        item={item}
        cardWidth={cardWidth}
        onPress={() => router.push(`/course-detail/${item.slug}`)}
      />
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="mt-3 text-gray-500">Kurslar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Kurslar</Text>
        <Text className="mt-1 text-gray-500">
          Temel Taşlar, Gelişim ve Aydınlanma ligleri.
        </Text>
      </View>
      {error ? (
        <View className="px-4 py-6">
          <Text className="text-amber-600 mb-2">Veri yüklenemedi: {error}</Text>
          <Text className="text-gray-500 text-sm">Supabase bağlantısını kontrol edin.</Text>
        </View>
      ) : courses.length === 0 ? (
        <View className="px-4 py-8 items-center">
          <Text className="text-gray-500">Henüz lig kaydı bulunmuyor.</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={numColumns > 1 ? { paddingHorizontal: padding, marginBottom: gap, gap } : undefined}
          contentContainerStyle={{
            paddingHorizontal: numColumns > 1 ? 0 : padding,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
