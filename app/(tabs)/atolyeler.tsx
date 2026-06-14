/**
 * Atölyeler Ana Ekranı - Agora Mobil
 *
 * Agora_gravity `Atolyeler.jsx` sayfasının React Native uyarlaması:
 * hero, kategori gezintisi, seviye bölümleri, kompakt kurs kartları,
 * ilerleme ve rating bilgileri.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type DimensionValue,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchCurriculum,
  flattenLessons,
  type Course,
} from '../../src/lib/education/fetchCurriculum';
import {
  ATOLYELER_SECTIONS,
  coursesInLevelBand,
  type CourseLevelBand,
} from '../../src/lib/education/atolyelerSections';
import { loadLocalCompletedIds } from '../../src/lib/education/progressStorage';
import { supabase } from '../../src/lib/supabase';

const LOCAL_COVERS: Record<string, ImageSourcePropType> = {
  '/go4.png': require('../../assets/courses/go4.png'),
  '/go5.png': require('../../assets/courses/go5.png'),
  '/go6.png': require('../../assets/courses/go6.png'),
};
const COVER_CYCLE = ['/go4.png', '/go5.png', '/go6.png'];

const LEVEL_LABELS: Record<CourseLevelBand, string> = {
  '17-12-kyu': '17-12 kyu',
  '11-6-kyu': '11-6 kyu',
  '5kyu-1dan': '5 kyu - 1 dan',
};

const SECTION_ACCENTS: Record<string, { bg: string; border: string; text: string; chip: string }> = {
  'temel-taslar': {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#047857',
    chip: '#10b981',
  },
  gelisim: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
    chip: '#0ea5e9',
  },
  aydinlanma: {
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#b45309',
    chip: '#f59e0b',
  },
};

function getCoverSource(url: string | null, index: number): ImageSourcePropType {
  if (!url) return LOCAL_COVERS[COVER_CYCLE[index % COVER_CYCLE.length]!]!;
  if (LOCAL_COVERS[url]) return LOCAL_COVERS[url]!;
  if (url.startsWith('http')) return { uri: url };
  return LOCAL_COVERS[COVER_CYCLE[index % COVER_CYCLE.length]!]!;
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || Number.isNaN(minutes)) return '-';
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} sa ${m} dk` : `${h} saat`;
}

function courseProgress(course: Course, completedIds: Set<string>) {
  const lessons = flattenLessons([course]);
  const total = lessons.length;
  const completed = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { completed, total, pct };
}

function CourseCard({
  course,
  index,
  completedIds,
  rating,
  width,
  onPress,
}: {
  course: Course;
  index: number;
  completedIds: Set<string>;
  rating: { avg: number; count: number };
  width: number;
  onPress: () => void;
}) {
  const { completed, total, pct } = courseProgress(course, completedIds);
  const levelLabel = LEVEL_LABELS[course.levelBand] ?? LEVEL_LABELS['17-12-kyu'];
  const duration = formatDuration(course.durationMinutes);
  const progressWidth = `${Math.max(pct, total > 0 ? 2 : 0)}%` as DimensionValue;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.courseCard,
        { width },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.coverWrap}>
        <Image source={getCoverSource(course.coverImageUrl, index)} style={styles.cover} resizeMode="cover" />
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{levelLabel}</Text>
        </View>
        {rating.avg > 0 ? (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color="#78350f" />
            <Text style={styles.ratingBadgeText}>{rating.avg.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.courseSummary} numberOfLines={2}>
          {course.summary || course.description || '-'}
        </Text>

        <View style={styles.courseMetaRow}>
          <Text style={styles.durationText}>{duration}</Text>
          <Text style={styles.progressText}>
            %{pct} · {completed}/{total}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <View style={styles.cardCta}>
          <Text style={styles.cardCtaText}>Derse Git</Text>
          <Ionicons name="chevron-forward" size={14} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}

function SectionBlock({
  section,
  courses,
  completedIds,
  ratings,
  globalIndex,
  cardWidth,
  onPressCourse,
}: {
  section: (typeof ATOLYELER_SECTIONS)[0];
  courses: Course[];
  completedIds: Set<string>;
  ratings: Record<string, { avg: number; count: number }>;
  globalIndex: number;
  cardWidth: number;
  onPressCourse: (course: Course) => void;
}) {
  const accent = SECTION_ACCENTS[section.id] ?? SECTION_ACCENTS['temel-taslar']!;

  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { backgroundColor: accent.bg, borderColor: accent.border }]}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={[styles.sectionSubtitle, { color: accent.text }]}>{section.subtitle}</Text>
        <Text style={styles.sectionIntro}>{section.intro}</Text>
      </View>

      {courses.length === 0 ? (
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>Bu kategoride henüz atölye yok.</Text>
        </View>
      ) : (
        <View style={styles.cardGrid}>
          {courses.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              index={globalIndex + i}
              completedIds={completedIds}
              rating={ratings[`kursdetay-${course.slug || course.id}`] ?? { avg: 0, count: 0 }}
              width={cardWidth}
              onPress={() => onPressCourse(course)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function AtolyelerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(ATOLYELER_SECTIONS[0]?.id ?? '');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  const cardWidth = useMemo(() => {
    const horizontalPadding = 32;
    const gap = 12;
    return Math.floor((width - horizontalPadding - gap) / 2);
  }, [width]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const ids = await loadLocalCompletedIds();
      if (!cancelled) setCompletedIds(ids);

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

  const handlePressCourse = (course: Course) => {
    router.push({
      pathname: '/atolyeler-detay/[slug]',
      params: { slug: course.slug || course.id },
    } as unknown as Href);
  };

  const handlePressSection = (sectionId: string, index: number) => {
    setActiveSection(sectionId);
    // Native equivalent of gravity's anchor nav: jump near the selected section.
    scrollRef.current?.scrollTo({ y: 230 + index * 420, animated: true });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={loading || courses.length === 0 ? undefined : [1]}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Go Atölyeleri</Text>
          <Text style={styles.heroSubtitle}>
            Seviyene uygun atölyeyi seç, makaleyi oku ve tahta alıştırmalarıyla pekiştir.
          </Text>
        </View>

        {!loading && courses.length > 0 ? (
          <View style={styles.navWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navContent}>
              {ATOLYELER_SECTIONS.map((section, index) => {
                const count = coursesInLevelBand(courses, section.levelBand).length;
                const isActive = activeSection === section.id;
                return (
                  <Pressable
                    key={section.id}
                    onPress={() => handlePressSection(section.id, index)}
                    style={[styles.navPill, isActive && styles.navPillActive]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.navPillText, isActive && styles.navPillTextActive]}>
                      {section.title}
                    </Text>
                    <Text style={[styles.navPillCount, isActive && styles.navPillCountActive]}>
                      ({count})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <View />
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2f6fed" />
            <Text style={styles.loadingText}>Atölyeler yükleniyor…</Text>
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="school-outline" size={42} color="#94a3b8" />
            <Text style={styles.emptyBoxText}>Henüz atölye içeriği yok.</Text>
          </View>
        ) : (
          <View style={styles.sectionsWrap}>
            {ATOLYELER_SECTIONS.map((section, si) => {
              const sectionCourses = coursesInLevelBand(courses, section.levelBand);
              const globalIndex = ATOLYELER_SECTIONS.slice(0, si).reduce(
                (acc, prev) => acc + coursesInLevelBand(courses, prev.levelBand).length,
                0
              );
              return (
                <SectionBlock
                  key={section.id}
                  section={section}
                  courses={sectionCourses}
                  completedIds={completedIds}
                  ratings={ratings}
                  globalIndex={globalIndex}
                  cardWidth={cardWidth}
                  onPressCourse={handlePressCourse}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  content: {
    paddingHorizontal: 16,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 22,
  },
  heroTitle: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
    color: '#0a2540',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 12,
    maxWidth: 340,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(10,37,64,0.68)',
    textAlign: 'center',
  },
  navWrap: {
    marginHorizontal: -4,
    marginBottom: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingVertical: 8,
  },
  navContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  navPillActive: {
    backgroundColor: '#0a2540',
  },
  navPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(10,37,64,0.72)',
  },
  navPillTextActive: {
    color: '#fff',
  },
  navPillCount: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(10,37,64,0.42)',
  },
  navPillCountActive: {
    color: 'rgba(255,255,255,0.78)',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 14,
  },
  loadingText: {
    color: 'rgba(10,37,64,0.55)',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,37,64,0.18)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 48,
  },
  emptyBoxText: {
    marginTop: 12,
    color: 'rgba(10,37,64,0.55)',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionsWrap: {
    gap: 42,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    color: '#0f172a',
  },
  sectionSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  sectionIntro: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(15,23,42,0.62)',
  },
  emptySection: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,37,64,0.16)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptySectionText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(10,37,64,0.48)',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  courseCard: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.28)',
    backgroundColor: '#fff',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  coverWrap: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: '#e2e8f0',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  levelBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(15,23,42,0.86)',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  ratingBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(250,204,21,0.96)',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingBadgeText: {
    color: '#78350f',
    fontSize: 10,
    fontWeight: '900',
  },
  cardBody: {
    flex: 1,
    padding: 12,
  },
  courseTitle: {
    minHeight: 36,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
    color: '#0a2540',
  },
  courseSummary: {
    marginTop: 6,
    minHeight: 34,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(10,37,64,0.62)',
  },
  courseMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  durationText: {
    fontSize: 11,
    color: 'rgba(10,37,64,0.48)',
    fontWeight: '700',
  },
  progressText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '900',
  },
  progressTrack: {
    marginTop: 8,
    height: 6,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  cardCta: {
    marginTop: 10,
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: '#0a2540',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  cardCtaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
});
