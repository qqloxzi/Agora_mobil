/**
 * Atölyeler Ana Ekranı — Agora Mobil
 * Agora_gravity Atolyeler.jsx'in React Native portu.
 *
 * Supabase edu_courses tablosundan kursları çeker,
 * ATOLYELER_SECTIONS ile seviye bantlarına gruplar,
 * CourseCard'larla listeler.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, Image,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchCurriculum, flattenLessons,
  type Course,
} from '../../src/lib/education/fetchCurriculum';
import {
  ATOLYELER_SECTIONS, coursesInLevelBand,
  type CourseLevelBand,
} from '../../src/lib/education/atolyelerSections';
import { loadLocalCompletedIds } from '../../src/lib/education/progressStorage';
import { supabase } from '../../src/lib/supabase';

/* ─── Yerel kapak fotoğrafları ─────────────────────────────── */
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

/* ─── Seviye bant renkleri ─────────────────────────────────── */
const BAND_COLORS: Record<CourseLevelBand, { bg: string; text: string }> = {
  '17-12-kyu': { bg: '#fef3c7', text: '#92400e' },
  '11-6-kyu':  { bg: '#dbeafe', text: '#1e40af' },
  '5kyu-1dan': { bg: '#f3e8ff', text: '#6b21a8' },
};

/* ─── İlerleme hesabı ──────────────────────────────────────── */
function courseProgress(course: Course, completedIds: Set<string>) {
  const lessons = flattenLessons([course]);
  const total = lessons.length;
  const completed = lessons.filter((l) => completedIds.has(l.id)).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { completed, total, pct };
}

/* ─── CourseCard ───────────────────────────────────────────── */
function CourseCard({
  course, index, completedIds, rating, onPress,
}: {
  course: Course; index: number;
  completedIds: Set<string>;
  rating: { avg: number; count: number };
  onPress: () => void;
}) {
  const { completed, total, pct } = courseProgress(course, completedIds);
  const bc = BAND_COLORS[course.levelBand] ?? { bg: '#f3f4f6', text: '#374151' };

  return (
    <Pressable onPress={onPress}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4 active:opacity-90 shadow-sm">
      {/* Kapak */}
      <Image
        source={getCoverSource(course.coverImageUrl, index)}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        resizeMode="cover"
      />
      {/* Level rozeti */}
      <View style={{ backgroundColor: bc.bg, position: 'absolute', top: 10, left: 10 }}
        className="rounded-md px-2 py-1">
        <Text style={{ fontSize: 10, fontWeight: '700', color: bc.text }}>
          {course.levelBand.replace('kyu', ' kyu').replace('-', '–')}
        </Text>
      </View>

      <View className="p-4">
        <Text className="text-base font-bold text-gray-900 leading-snug mb-1" numberOfLines={2}>
          {course.title}
        </Text>
        {(course.summary || course.description) && (
          <Text className="text-sm text-gray-500 leading-relaxed mb-3" numberOfLines={2}>
            {course.summary || course.description}
          </Text>
        )}

        {/* İlerleme çubuğu */}
        {total > 0 && (
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs text-gray-400">{completed}/{total} ders</Text>
              <Text className="text-xs font-semibold text-blue-600">%{pct}</Text>
            </View>
            <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <View style={{ width: `${pct}%` }} className="h-full bg-blue-500 rounded-full" />
            </View>
          </View>
        )}

        {/* Alt satır */}
        <View className="flex-row items-center justify-between border-t border-gray-50 pt-3">
          <View className="flex-row items-center gap-1">
            {rating.count > 0 && (
              <>
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text className="text-xs text-gray-500">
                  {rating.avg.toFixed(1)} ({rating.count})
                </Text>
              </>
            )}
          </View>
          <View className="flex-row items-center gap-1.5 bg-blue-600 rounded-full px-3 py-1.5">
            <Text className="text-xs font-bold text-white">Derse Git</Text>
            <Ionicons name="arrow-forward" size={12} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ─── Section (Seviye Grubu) ───────────────────────────────── */
function SectionBlock({
  section, courses, completedIds, ratings, globalIndex, onPressCourse,
}: {
  section: typeof ATOLYELER_SECTIONS[0];
  courses: Course[];
  completedIds: Set<string>;
  ratings: Record<string, { avg: number; count: number }>;
  globalIndex: number;
  onPressCourse: (course: Course) => void;
}) {
  const bc = BAND_COLORS[section.levelBand];

  return (
    <View className="mb-8 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
      {/* Section başlık */}
      <View style={{ backgroundColor: bc.bg }} className="px-5 py-4 border-b border-gray-100">
        <Text style={{ color: bc.text }} className="text-xl font-extrabold">{section.title}</Text>
        <Text style={{ color: bc.text, opacity: 0.8 }} className="text-xs font-semibold mt-0.5">
          {section.subtitle}
        </Text>
        <Text className="text-sm text-gray-500 leading-relaxed mt-2">{section.intro}</Text>
      </View>

      {courses.length === 0 ? (
        <View className="px-5 py-8 items-center">
          <Ionicons name="hourglass-outline" size={32} color="#d1d5db" />
          <Text className="text-gray-400 text-sm mt-2 text-center">
            Bu seviyede henüz kurs yok.
          </Text>
        </View>
      ) : (
        <View className="p-4">
          {courses.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              index={globalIndex + i}
              completedIds={completedIds}
              rating={ratings[`kursdetay-${course.slug || course.id}`] ?? { avg: 0, count: 0 }}
              onPress={() => onPressCourse(course)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── Ana Ekran ─────────────────────────────────────────────── */
export default function AtolyelerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      // İlerleme yükle
      const ids = await loadLocalCompletedIds();
      if (!cancelled) setCompletedIds(ids);

      // Kursları çek
      const { courses: c } = await fetchCurriculum();
      if (cancelled) return;
      setCourses(c);
      setLoading(false);

      // Rating'leri çek
      const slugs = c.map((course) => `kursdetay-${course.slug || course.id}`);
      if (slugs.length === 0) return;
      const { data: ratingRows } = await supabase
        .from('comments')
        .select('post_id, rating')
        .in('post_id', slugs)
        .gt('rating', 0);
      if (cancelled || !ratingRows) return;

      const map: Record<string, { sum: number; count: number }> = {};
      for (const row of ratingRows as any[]) {
        if (!map[row.post_id]) map[row.post_id] = { sum: 0, count: 0 };
        map[row.post_id]!.sum += row.rating;
        map[row.post_id]!.count += 1;
      }
      const result: Record<string, { avg: number; count: number }> = {};
      for (const [pid, val] of Object.entries(map)) {
        result[pid] = { avg: parseFloat((val.sum / val.count).toFixed(1)), count: val.count };
      }
      setRatings(result);
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePressCourse = (course: Course) => {
    router.push(`/atolyeler/${course.slug}`);
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Başlık */}
      <View className="px-5 pt-5 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Atölyeler</Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          Yapılandırılmış Go atölyeleri — adım adım ilerle.
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1d4ed8" />
          <Text className="text-gray-400 text-sm mt-3">Kurslar yükleniyor…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {ATOLYELER_SECTIONS.map((section, si) => {
            const sectionCourses = coursesInLevelBand(courses, section.levelBand);
            const globalIndex = ATOLYELER_SECTIONS.slice(0, si)
              .reduce((acc, s) => acc + coursesInLevelBand(courses, s.levelBand).length, 0);
            return (
              <SectionBlock
                key={section.id}
                section={section}
                courses={sectionCourses}
                completedIds={completedIds}
                ratings={ratings}
                globalIndex={globalIndex}
                onPressCourse={handlePressCourse}
              />
            );
          })}

          {courses.length === 0 && !loading && (
            <View className="items-center py-16">
              <Ionicons name="school-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-center">
                Henüz kurs bulunamadı.{'\n'}Supabase bağlantısını kontrol edin.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
