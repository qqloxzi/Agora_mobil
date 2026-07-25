/**
 * Atölyeler Ana Ekranı — path-stage theme + swipeable workshop chooser.
 * Cover photos removed; visual language shared with Kurslar (COURSE_BRAND).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AtolyePageDots,
  AtolyePathCard,
  AtolyePathChips,
} from '../../src/components/atolyeler';
import { COURSE_BRAND, getLevelBandMeta } from '../../src/components/courses';
import {
  fetchCurriculum,
  flattenLessons,
  type Course,
} from '../../src/lib/education/fetchCurriculum';
import {
  ATOLYELER_SECTIONS,
  coursesInLevelBand,
} from '../../src/lib/education/atolyelerSections';
import {
  fetchRemoteCompletedLessonIds,
  loadLocalCompletedIds,
  saveLocalCompletedIds,
  syncLocalCompletedIdsToRemote,
} from '../../src/lib/education/progressStorage';
import { supabase } from '../../src/lib/supabase';

function courseProgress(course: Course, completedIds: Set<string>) {
  const lessons = flattenLessons([course]);
  const total = lessons.length;
  const completed = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { completed, total, pct };
}

export default function AtolyelerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(ATOLYELER_SECTIONS[0]?.id ?? '');
  const [pageIndex, setPageIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  const pageWidth = width;
  const cardWidth = Math.min(width - 32, 420);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const ids = await loadLocalCompletedIds();
      if (!cancelled) setCompletedIds(ids);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      if (uid) {
        const remoteIds = await fetchRemoteCompletedLessonIds(uid);
        if (!cancelled) {
          const merged = new Set([...ids, ...remoteIds]);
          setCompletedIds(merged);
          saveLocalCompletedIds(merged);
          syncLocalCompletedIdsToRemote(uid, ids);
        }
      }

      const { courses: loadedCourses } = await fetchCurriculum();
      if (cancelled) return;
      setCourses(loadedCourses);
      setLoading(false);

      const slugs = loadedCourses.map((course) => `kursdetay-${course.slug || course.id}`);
      if (slugs.length === 0) return;
      const { data: ratingRows } = await supabase
        .from('comments')
        .select('post_id, rating')
        .in('post_id', slugs)
        .gt('rating', 0);
      if (cancelled || !ratingRows) return;

      const map: Record<string, { sum: number; count: number }> = {};
      for (const row of ratingRows as { post_id: string; rating: number }[]) {
        if (!map[row.post_id]) map[row.post_id] = { sum: 0, count: 0 };
        map[row.post_id]!.sum += row.rating;
        map[row.post_id]!.count += 1;
      }

      const nextRatings: Record<string, { avg: number; count: number }> = {};
      for (const [postId, val] of Object.entries(map)) {
        nextRatings[postId] = {
          avg: parseFloat((val.sum / val.count).toFixed(1)),
          count: val.count,
        };
      }
      setRatings(nextRatings);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const section of ATOLYELER_SECTIONS) {
      counts[section.id] = coursesInLevelBand(courses, section.levelBand).length;
    }
    return counts;
  }, [courses]);

  const activeSectionMeta = useMemo(
    () => ATOLYELER_SECTIONS.find((s) => s.id === activeSection) ?? ATOLYELER_SECTIONS[0],
    [activeSection]
  );

  const visibleCourses = useMemo(() => {
    if (!activeSectionMeta) return courses;
    return coursesInLevelBand(courses, activeSectionMeta.levelBand);
  }, [courses, activeSectionMeta]);

  useEffect(() => {
    if (pageIndex >= visibleCourses.length) {
      setPageIndex(0);
    }
  }, [visibleCourses.length, pageIndex]);

  const bandMeta = getLevelBandMeta(activeSectionMeta?.levelBand);

  const handlePressCourse = useCallback(
    (course: Course) => {
      router.push({
        pathname: '/atolyeler-detay/[slug]',
        params: { slug: course.slug || course.id },
      } as unknown as Href);
    },
    [router]
  );

  const handleSelectSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    setPageIndex(0);
    requestAnimationFrame(() => {
      pagerRef.current?.scrollTo({ x: 0, animated: false });
    });
  }, []);

  const onPagerScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / Math.max(pageWidth, 1));
      if (next !== pageIndex && next >= 0 && next < visibleCourses.length) {
        setPageIndex(next);
      }
    },
    [pageIndex, pageWidth, visibleCourses.length]
  );

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-bg"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color={COURSE_BRAND.accent} />
        <Text className="mt-3 text-sm text-slate-400 dark:text-slate-500">
          Atölye yolu yükleniyor…
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-gray-50 dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        {/* Hero */}
        <View className="px-4 pb-3 pt-5">
          <Text
            style={{ color: COURSE_BRAND.accent }}
            className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest"
          >
            Go Akademisi · Atölye Yolu
          </Text>
          <Text className="text-[28px] font-extrabold tracking-tight text-ink dark:text-slate-100">
            Atölyeler
          </Text>
          <Text className="mt-1.5 max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
            Kaydırarak atölye seç. Makaleyi oku, tahta alıştırmalarıyla pekiştir.
          </Text>
        </View>

        {courses.length === 0 ? (
          <View className="items-center px-6 py-14">
            <Ionicons name="map-outline" size={48} color="#cbd5e1" />
            <Text className="mt-3 text-slate-400 dark:text-slate-500">
              Henüz atölye içeriği yok.
            </Text>
          </View>
        ) : (
          <>
            {/* Path filter chips */}
            <View className="mt-1 mb-4">
              <AtolyePathChips
                sections={ATOLYELER_SECTIONS}
                activeId={activeSection}
                counts={sectionCounts}
                onSelect={handleSelectSection}
              />
            </View>

            {/* Active path chrome */}
            <View className="mx-4 mb-4 overflow-hidden rounded-2xl border px-4 py-3.5"
              style={{
                backgroundColor: COURSE_BRAND.accentSoft,
                borderColor: COURSE_BRAND.accentBorder,
              }}
            >
              <View className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text
                    style={{ color: COURSE_BRAND.accent }}
                    className="text-[10px] font-extrabold uppercase tracking-widest"
                  >
                    Aşama {bandMeta.stage} · {bandMeta.seviyeLabel}
                  </Text>
                  <Text className="mt-1 text-base font-bold text-ink dark:text-slate-100">
                    {activeSectionMeta?.title}
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {activeSectionMeta?.subtitle}
                  </Text>
                </View>
                <Text
                  style={{ color: COURSE_BRAND.accent }}
                  className="text-xs font-extrabold"
                >
                  {pageIndex + 1}/{Math.max(visibleCourses.length, 1)}
                </Text>
              </View>
              <View className="mt-3 flex-row items-center gap-1.5">
                {[1, 2, 3].map((n) => (
                  <View
                    key={n}
                    style={{
                      height: 4,
                      flex: 1,
                      borderRadius: 999,
                      backgroundColor:
                        n <= bandMeta.stage
                          ? COURSE_BRAND.accentBright
                          : 'rgba(15, 118, 110, 0.18)',
                    }}
                  />
                ))}
              </View>
            </View>

            {visibleCourses.length === 0 ? (
              <View className="mx-4 items-center rounded-2xl border border-dashed border-slate-200 py-12 dark:border-dark-border">
                <Text className="text-sm font-semibold text-slate-400">
                  Bu kategoride henüz atölye yok.
                </Text>
              </View>
            ) : (
              <View>
                <Text className="mb-3 px-4 text-center text-[11px] font-semibold text-slate-400">
                  Kaydırarak seç · dokunarak aç
                </Text>

                {/* Swipeable workshop chooser */}
                <ScrollView
                  ref={pagerRef}
                  horizontal
                  pagingEnabled
                  nestedScrollEnabled
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onPagerScrollEnd}
                  onScrollEndDrag={onPagerScrollEnd}
                >
                  {visibleCourses.map((course, index) => {
                    const progress = courseProgress(course, completedIds);
                    const ratingKey = `kursdetay-${course.slug || course.id}`;
                    return (
                      <View
                        key={course.id}
                        style={{ width: pageWidth }}
                        className="items-center px-4"
                      >
                        <AtolyePathCard
                          item={{
                            id: course.id,
                            title: course.title,
                            summary: course.summary,
                            description: course.description,
                            levelBand: course.levelBand,
                            levelLabel: course.levelLabel,
                            durationMinutes: course.durationMinutes,
                          }}
                          index={index}
                          cardWidth={cardWidth}
                          progress={progress}
                          ratingAvg={ratings[ratingKey]?.avg ?? 0}
                          onPress={() => handlePressCourse(course)}
                        />
                      </View>
                    );
                  })}
                </ScrollView>

                <AtolyePageDots count={visibleCourses.length} activeIndex={pageIndex} />

                {activeSectionMeta?.intro ? (
                  <Text className="mx-6 mt-5 text-center text-[13px] leading-5 text-slate-400 dark:text-slate-500">
                    {activeSectionMeta.intro}
                  </Text>
                ) : null}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
