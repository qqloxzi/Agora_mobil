import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoBoard from '../../src/components/GoBoard';
import { courseArticles, type CourseArticleBlock } from '../../src/data/courseArticles';
import {
  fetchCurriculum,
  findCourseBySlug,
  flattenLessons,
  type Course,
} from '../../src/lib/education/fetchCurriculum';

const LEVEL_LABELS: Record<string, string> = {
  '17-12-kyu': '17-12 kyu',
  '11-6-kyu': '11-6 kyu',
  '5kyu-1dan': '5 kyu - 1 dan',
};

function formatDuration(minutes: number | null | undefined) {
  if (minutes == null || Number.isNaN(minutes)) return '-';
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} sa ${m} dk` : `${h} saat`;
}

function TextBlock({ content }: { content: string }) {
  const parts = content.split('\n\n');
  const hasSubtitle = parts.length >= 2 && parts[0]?.trim() && !parts[0].includes('\n');
  if (hasSubtitle) {
    return (
      <View className="my-4">
        <Text className="text-xl font-extrabold text-gray-900">{parts[0]?.trim()}</Text>
        <Text className="mt-3 text-base leading-7 text-gray-600">{parts.slice(1).join('\n\n').trim()}</Text>
      </View>
    );
  }
  return <Text className="my-4 text-base leading-7 text-gray-600">{content}</Text>;
}

function StaticBoardBlock({ course }: { course: Course }) {
  const { width } = useWindowDimensions();
  const firstLesson = flattenLessons([course]).find((lesson) => lesson.problem);
  const problem = firstLesson?.problem;
  if (!problem) return null;

  return (
    <View className="my-5 rounded-3xl bg-white p-4 border border-gray-100">
      <GoBoard
        size={problem.size ?? 19}
        boardSizePx={Math.min(width - 68, 320)}
        initialState={problem.initialState}
        startTurn={problem.turn === 'white' ? 'white' : 'black'}
        problem={problem}
        readOnly
        hideTurnIndicator
      />
      <Text className="mt-3 text-sm leading-6 text-gray-500">
        Tahta örneği: alıştırmalara başlamadan önce ana fikri görsel olarak inceleyin.
      </Text>
    </View>
  );
}

function ArticleBlockRenderer({ block, course }: { block: CourseArticleBlock; course: Course }) {
  if (block.type === 'text') return <TextBlock content={block.content} />;
  return (
    <View>
      <StaticBoardBlock course={course} />
      {block.description ? <Text className="mb-4 text-sm leading-6 text-gray-500">{block.description}</Text> : null}
    </View>
  );
}

export default function AtolyelerCourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { courses: loadedCourses } = await fetchCurriculum();
      if (!cancelled) {
        setCourses(loadedCourses);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const course = useMemo(() => (slug ? findCourseBySlug(courses, slug) : null), [courses, slug]);
  const lessonCount = course ? flattenLessons([course]).length : 0;
  const article = course ? courseArticles[course.slug] : null;
  const levelLabel = course?.levelLabel || LEVEL_LABELS[course?.levelBand || '17-12-kyu'] || LEVEL_LABELS['17-12-kyu'];

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-ice-white" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="mt-3 text-gray-400">Atölye yükleniyor...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View className="flex-1 items-center justify-center bg-ice-white px-6" style={{ paddingTop: insets.top }}>
        <Text className="text-center text-lg font-bold text-gray-900">Atölye bulunamadı.</Text>
        <Pressable onPress={() => router.back()} className="mt-5 rounded-full bg-primary-blue px-6 py-3">
          <Text className="font-bold text-white">Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  const blocks: CourseArticleBlock[] =
    article?.blocks ??
    [
      {
        type: 'text',
        content:
          `${course.title}\n\n${course.description || course.summary || 'Bu atölye için giriş yazısı yakında eklenecek.'}`,
      },
      { type: 'board', description: 'Bu atölyenin ilk alıştırmasına ait statik konum.' },
    ];

  return (
    <ScrollView
      className="flex-1 bg-ice-white"
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 18, paddingBottom: insets.bottom + 36 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} className="mb-6 flex-row items-center gap-2">
        <Ionicons name="arrow-back" size={18} color="#64748b" />
        <Text className="text-sm font-semibold text-gray-500">Atölyelere dön</Text>
      </Pressable>

      <Text className="text-3xl font-extrabold leading-tight text-gray-900">
        {article?.title ?? course.title}
      </Text>
      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        <Text className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{levelLabel}</Text>
        <Text className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{lessonCount} ders</Text>
        <Text className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{formatDuration(course.durationMinutes)}</Text>
      </View>

      <View className="my-7 h-px bg-gray-200" />

      {blocks.map((block, index) => (
        <ArticleBlockRenderer key={index} block={block} course={course} />
      ))}

      <Pressable
        onPress={() => router.push(`/atolyeler/${course.slug || course.id}`)}
        className="mt-8 flex-row items-center justify-center gap-3 rounded-full bg-blue-600 px-8 py-4"
      >
        <Ionicons name="play" size={18} color="#fff" />
        <Text className="text-base font-extrabold text-white">Alıştırmalara başla</Text>
      </Pressable>
    </ScrollView>
  );
}
