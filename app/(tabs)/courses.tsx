import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';

interface EduCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  summary: string | null;
  level_band: string | null;
  duration_minutes: number | null;
  cover_image_url: string | null;
  sort_order: number;
}

const LOCAL_COVERS: Record<string, any> = {
  '/go4.png': require('../../assets/courses/go4.png'),
  '/go5.png': require('../../assets/courses/go5.png'),
  '/go6.png': require('../../assets/courses/go6.png'),
};
const COVER_CYCLE = ['/go4.png', '/go5.png', '/go6.png'];

function getCoverSource(url: string | null, index: number) {
  if (!url) return LOCAL_COVERS[COVER_CYCLE[index % 3]];
  if (LOCAL_COVERS[url]) return LOCAL_COVERS[url];
  if (url.startsWith('http')) return { uri: url };
  return LOCAL_COVERS[COVER_CYCLE[index % 3]];
}

const LEVEL_LABELS: Record<string, string> = {
  '17-12-kyu': '17–12 Kyu · Temel Taşlar',
  '11-6-kyu': '11–6 Kyu · Gelişim',
  '5kyu-1dan': '5 Kyu – 1 Dan · Aydınlanma',
};
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  '17-12-kyu': { bg: '#fef3c7', text: '#92400e' },
  '11-6-kyu': { bg: '#dbeafe', text: '#1e40af' },
  '5kyu-1dan': { bg: '#f3e8ff', text: '#6b21a8' },
};

function formatDuration(min: number | null) {
  if (!min) return null;
  const h = Math.floor(min / 60), m = min % 60;
  return h ? (m ? `${h} sa ${m} dk` : `${h} saat`) : `${min} dk`;
}

function CourseCard({ item, index, onPress, cardWidth }: {
  item: EduCourse; index: number; onPress: () => void; cardWidth: number;
}) {
  const lk = item.level_band ?? '17-12-kyu';
  const lc = LEVEL_COLORS[lk] ?? { bg: '#f3f4f6', text: '#374151' };
  return (
    <Pressable onPress={onPress}
      style={{ width: cardWidth, marginBottom: 16 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 active:opacity-90">
      <Image source={getCoverSource(item.cover_image_url, index)}
        style={{ width: '100%', aspectRatio: 16 / 9 }} resizeMode="cover" />
      <View style={{ backgroundColor: lc.bg, position: 'absolute', top: 12, left: 12 }}
        className="rounded-md px-2 py-1">
        <Text style={{ fontSize: 10, fontWeight: '700', color: lc.text }}>
          {LEVEL_LABELS[lk] ?? lk}
        </Text>
      </View>
      <View className="p-4">
        <Text className="text-xs text-gray-400 uppercase tracking-wide mb-1">Agora Go Akademisi</Text>
        <Text className="text-base font-bold text-gray-900 leading-snug" numberOfLines={2}>{item.title}</Text>
        {item.summary ? (
          <Text className="text-sm text-gray-500 mt-1.5 leading-relaxed" numberOfLines={2}>{item.summary}</Text>
        ) : item.description ? (
          <Text className="text-sm text-gray-500 mt-1.5 leading-relaxed" numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50">
          {formatDuration(item.duration_minutes) ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400">{formatDuration(item.duration_minutes)}</Text>
            </View>
          ) : <View />}
          <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
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

      // Önce edu_courses tablosunu dene
      const { data, error } = await supabase
        .from('edu_courses')
        .select('id, title, slug, description, summary, level_band, duration_minutes, cover_image_url, sort_order')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setCourses(data as EduCourse[]);
        setLoading(false);
        return;
      }

      // Fallback: eski courses tablosu
      const { data: fallback, error: err2 } = await supabase
        .from('courses')
        .select('id, title, slug, description, level, image_url')
        .order('created_at', { ascending: false });

      if (!err2 && fallback && fallback.length > 0) {
        // Eski şemayı yeni şemaya çevir
        const mapped: EduCourse[] = fallback.map((c: any, i: number) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description ?? null,
          summary: null,
          level_band: c.level?.toLowerCase().includes('temel') ? '17-12-kyu'
            : c.level?.toLowerCase().includes('gelişim') ? '11-6-kyu'
            : c.level?.toLowerCase().includes('aydın') ? '5kyu-1dan'
            : '17-12-kyu',
          duration_minutes: null,
          cover_image_url: c.image_url ?? null,
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

  const numColumns = width >= 600 ? 2 : 1;
  const padding = 16;
  const gap = 12;
  const cardWidth = numColumns === 1 ? width - padding * 2 : (width - padding * 2 - gap) / 2;

  const renderItem: ListRenderItem<EduCourse> = ({ item, index }) => (
    <View style={numColumns > 1 ? { marginRight: index % 2 === 0 ? gap : 0 } : {}}>
      <CourseCard item={item} index={index} cardWidth={cardWidth}
        onPress={() => router.push(`/course-detail/${item.slug}`)} />
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="mt-3 text-gray-400 text-sm">Kurslar yükleniyor…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Kurslar</Text>
        <Text className="mt-1 text-gray-500 text-sm">Temel Taşlar · Gelişim · Aydınlanma</Text>
      </View>

      {errorMsg ? (
        <View className="px-4 py-6 items-center">
          <Ionicons name="cloud-offline-outline" size={40} color="#d1d5db" />
          <Text className="text-gray-500 mt-2 text-sm text-center">{errorMsg}</Text>
        </View>
      ) : courses.length === 0 ? (
        <View className="px-4 py-12 items-center">
          <Ionicons name="school-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-400 mt-3">Henüz kurs bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={numColumns}
          key={String(numColumns)}
          contentContainerStyle={{ paddingHorizontal: padding, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
