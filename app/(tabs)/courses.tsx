import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import {
  CourseListCard,
  COURSE_BRAND,
  courseCardLayout,
  levelBandFromLevel,
  type CourseListCardItem,
} from '../../src/components/courses';

interface EduCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  summary: string | null;
  level_band: string | null;
  duration_minutes: number | null;
  sort_order: number;
}

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [courses, setCourses] = useState<EduCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from('edu_courses')
        .select('id, title, slug, description, summary, level_band, duration_minutes, sort_order')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setCourses(data as EduCourse[]);
        setLoading(false);
        return;
      }

      const { data: fallback, error: err2 } = await supabase
        .from('courses')
        .select('id, title, slug, description, level')
        .order('created_at', { ascending: false });

      if (!err2 && fallback && fallback.length > 0) {
        const mapped: EduCourse[] = fallback.map((c: any, i: number) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description ?? null,
          summary: null,
          level_band: levelBandFromLevel(c.level),
          duration_minutes: null,
          sort_order: i,
        }));
        setCourses(mapped);
      } else {
        setErrorMsg(error?.message ?? err2?.message ?? 'Kurslar yüklenemedi.');
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const { padding, gap, numColumns, cardWidth } = courseCardLayout(width);

  const renderItem: ListRenderItem<EduCourse> = ({ item, index }) => {
    const cardItem: CourseListCardItem = {
      id: item.id,
      title: item.title,
      summary: item.summary,
      description: item.description,
      level_band: item.level_band,
      duration_minutes: item.duration_minutes,
    };

    return (
      <View style={numColumns > 1 ? { marginRight: index % 2 === 0 ? gap : 0 } : undefined}>
        <CourseListCard
          item={cardItem}
          index={index}
          cardWidth={cardWidth}
          onPress={() => router.push(`/course-detail/${item.slug}`)}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-bg"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color={COURSE_BRAND.accent} />
        <Text className="mt-3 text-sm text-slate-400 dark:text-slate-500">Yol haritası yükleniyor…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 pb-2 pt-5" style={{ paddingHorizontal: padding }}>
        <Text
          style={{ color: COURSE_BRAND.accent }}
          className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest"
        >
          Go Akademisi · Lig Yolu
        </Text>
        <Text className="text-[28px] font-extrabold tracking-tight text-ink dark:text-slate-100">
          Kurslar
        </Text>
        <Text className="mt-1.5 max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          Üç aşamalı yol: Temel Taşlar → Gelişim → Aydınlanma. Seviyeni seç, yola gir.
        </Text>
      </View>

      {errorMsg ? (
        <View className="items-center px-6 py-10">
          <Ionicons name="cloud-offline-outline" size={40} color="#cbd5e1" />
          <Text className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
            {errorMsg}
          </Text>
        </View>
      ) : courses.length === 0 ? (
        <View className="items-center px-6 py-14">
          <Ionicons name="map-outline" size={48} color="#cbd5e1" />
          <Text className="mt-3 text-slate-400 dark:text-slate-500">Henüz kurs bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={numColumns}
          key={String(numColumns)}
          contentContainerStyle={{
            paddingHorizontal: padding,
            paddingTop: 12,
            paddingBottom: insets.bottom + 100,
            alignItems: numColumns === 1 ? 'stretch' : 'flex-start',
          }}
          columnWrapperStyle={
            numColumns > 1 ? { justifyContent: 'flex-start' } : undefined
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
