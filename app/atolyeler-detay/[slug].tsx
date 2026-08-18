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
import {
  COURSE_BRAND,
  CourseDetailHeader,
  CourseDetailHero,
  CourseLevelBadge,
  CourseMetaTile,
  CoursePrimaryCta,
  CourseSectionCard,
  CourseSectionTitle,
  courseCardLayout,
  formatCourseDuration,
  getLevelBandMeta,
} from '../../src/components/courses';
import { courseArticles, type CourseArticleBlock } from '../../src/data/courseArticles';
import {
  fetchCurriculum,
  findCourseBySlug,
  flattenLessons,
  type Course,
} from '../../src/lib/education/fetchCurriculum';

function TextBlock({ content }: { content: string }) {
  const parts = content.split('\n\n');
  const hasSubtitle = parts.length >= 2 && parts[0]?.trim() && !parts[0].includes('\n');
  if (hasSubtitle) {
    return (
      <View className="my-4">
        <Text className="text-xl font-extrabold text-ink dark:text-slate-100">
          {parts[0]?.trim()}
        </Text>
        <Text className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-400">
          {parts.slice(1).join('\n\n').trim()}
        </Text>
      </View>
    );
  }
  return (
    <Text className="my-4 text-base leading-7 text-slate-600 dark:text-slate-400">
      {content}
    </Text>
  );
}

function StaticBoardBlock({ course }: { course: Course }) {
  const { width } = useWindowDimensions();
  const firstLesson = flattenLessons([course]).find((lesson) => lesson.problem);
  const problem = firstLesson?.problem;
  if (!problem) return null;

  return (
    <CourseSectionCard className="my-5">
      <GoBoard
        size={problem.size ?? 19}
        boardSizePx={Math.min(width - 68, 320)}
        initialState={problem.initialState}
        startTurn={problem.turn === 'white' ? 'white' : 'black'}
        problem={problem}
        readOnly
        hideTurnIndicator
      />
      <Text className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Tahta örneği: alıştırmalara başlamadan önce ana fikri görsel olarak inceleyin.
      </Text>
    </CourseSectionCard>
  );
}

function ArticleBlockRenderer({ block, course }: { block: CourseArticleBlock; course: Course }) {
  if (block.type === 'text') return <TextBlock content={block.content} />;
  return (
    <View>
      <StaticBoardBlock course={course} />
      {block.description ? (
        <Text className="mb-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {block.description}
        </Text>
      ) : null}
    </View>
  );
}

export default function AtolyelerCourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { padding } = courseCardLayout(width);
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
  const meta = getLevelBandMeta(course?.levelBand, course?.levelLabel);
  const duration = formatCourseDuration(course?.durationMinutes ?? null);

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-bg"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-3 text-slate-400 dark:text-slate-500">Atölye yükleniyor…</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View
        className="flex-1 items-center justify-center bg-gray-50 px-6 dark:bg-dark-bg"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-center text-lg font-bold text-ink dark:text-slate-100">
          Atölye bulunamadı.
        </Text>
        <View className="mt-5 w-full max-w-xs">
          <CoursePrimaryCta title="Geri Dön" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const blocks: CourseArticleBlock[] =
    article?.blocks ??
    [
      {
        type: 'text',
        content: `${course.title}\n\n${
          course.description || course.summary || 'Bu atölye için giriş yazısı yakında eklenecek.'
        }`,
      },
      { type: 'board', description: 'Bu atölyenin ilk alıştırmasına ait statik konum.' },
    ];

  // ── Blue accent colours for the detail page ──
  const BLUE = {
    accent:     '#1D4ED8',
    accentSoft: 'rgba(29, 78, 216, 0.1)',
    accentBorder:'rgba(29, 78, 216, 0.28)',
    rank:       '#1D4ED8',
    rankSoft:   'rgba(29, 78, 216, 0.1)',
    rankBorder: 'rgba(29, 78, 216, 0.25)',
    primary:    '#1D4ED8',
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: '#EFF6FF' }} className="dark:bg-dark-bg">
      <CourseDetailHeader
        title="Atölye Detayı"
        topInset={insets.top}
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: padding,
          paddingTop: 18,
          paddingBottom: insets.bottom + 36,
        }}
        showsVerticalScrollIndicator={false}
      >
        <CourseDetailHero
          title={article?.title ?? course.title}
          description={course.summary || course.description}
          levelBand={course.levelBand}
          level={course.levelLabel}
          stage={meta.stage}
        />

        <View className="mb-5 mt-5 flex-row flex-wrap gap-3">
          <CourseMetaTile
            label="Seviye"
            value={meta.seviyeLabel}
            icon="ribbon-outline"
            accent
          />
          <CourseMetaTile
            label="Ders"
            value={`${lessonCount} alıştırma`}
            icon="book-outline"
          />
        </View>

        <View className="mb-6 flex-row flex-wrap items-center gap-2">
          <CourseLevelBadge band={course.levelBand} level={course.levelLabel} variant="rank" size="md" />
          <CourseLevelBadge band={course.levelBand} level={course.levelLabel} variant="seviye" size="md" />
          {duration ? (
            <View
              className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
              style={{
                backgroundColor: BLUE.rankSoft,
                borderColor: BLUE.rankBorder,
              }}
            >
              <Ionicons name="time-outline" size={13} color={BLUE.rank} />
              <Text style={{ color: BLUE.rank, fontSize: 12, fontWeight: '700' }}>
                {duration}
              </Text>
            </View>
          ) : null}
        </View>

        <CourseSectionTitle>Atölye içeriği</CourseSectionTitle>
        <CourseSectionCard className="mb-6">
          {blocks.map((block, index) => (
            <ArticleBlockRenderer key={index} block={block} course={course} />
          ))}
        </CourseSectionCard>

        <Pressable
          onPress={() => router.push(`/atolyeler/${course.slug || course.id}`)}
          accessibilityRole="button"
          className="w-full items-center rounded-2xl py-4 active:opacity-90"
          style={{ backgroundColor: BLUE.primary }}
        >
          <Text className="text-base font-bold text-white">Alıştırmalara başla</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
