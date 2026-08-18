/**
 * Atölyeler Ana Ekranı — Blue academic theme.
 * Light default; dark when user sets dark mode.
 */
import { useRouter, type Href } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AtolyeSkillTree } from '../../src/components/atolyeler';
import { useSettings } from '../../src/context/SettingsContext';
import {
  fetchCurriculum,
  flattenLessons,
  type Course,
} from '../../src/lib/education/fetchCurriculum';
import {
  fetchRemoteCompletedLessonIds,
  loadLocalCompletedIds,
  saveLocalCompletedIds,
  syncLocalCompletedIdsToRemote,
} from '../../src/lib/education/progressStorage';
import { supabase } from '../../src/lib/supabase';

// ─── Blue theme tokens ────────────────────────────────────────────────────────

const SCREEN_THEME = {
  dark: {
    screenBg:          '#080F1F',
    headerBg:          '#0D1B3E',
    headerBorder:      '#1E3A5F',
    eyebrowColor:      '#334155',
    titleColor:        '#E2E8F0',
    accentBar:         '#2563EB',
    subtitleColor:     '#475569',
    statBg:            '#0A1929',
    statBorder:        '#1E3A5F',
    statPctColor:      '#3B82F6',
    statLabelColor:    '#334155',
    trackBg:           '#0D1E36',
    trackFill:         '#2563EB',
    loadingIndicator:  '#2563EB',
    loadingText:       '#334155',
  },
  light: {
    screenBg:          '#F0F4FF',
    headerBg:          '#EFF6FF',
    headerBorder:      '#BFDBFE',
    eyebrowColor:      '#93C5FD',
    titleColor:        '#0F172A',
    accentBar:         '#2563EB',
    subtitleColor:     '#6B7280',
    statBg:            '#DBEAFE',
    statBorder:        '#BFDBFE',
    statPctColor:      '#1D4ED8',
    statLabelColor:    '#93C5FD',
    trackBg:           '#BFDBFE',
    trackFill:         '#2563EB',
    loadingIndicator:  '#2563EB',
    loadingText:       '#93C5FD',
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function overallProgress(courses: Course[], completedIds: Set<string>) {
  const all = flattenLessons(courses);
  const done = all.filter((l) => completedIds.has(l.id)).length;
  return { done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
}

// ─── Header ──────────────────────────────────────────────────────────────────

function AcademicHeader({
  topInset, done, total, pct, isDark,
}: { topInset: number; done: number; total: number; pct: number; isDark: boolean }) {
  const t = SCREEN_THEME[isDark ? 'dark' : 'light'];

  return (
    <View
      style={{
        backgroundColor: t.headerBg,
        borderBottomWidth: 1,
        borderBottomColor: t.headerBorder,
        paddingTop: topInset + 16,
        paddingHorizontal: 20,
        paddingBottom: 16,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '700', color: t.eyebrowColor, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>
        Go Akademisi · Müfredat
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: t.accentBar }} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: t.titleColor, letterSpacing: -0.5 }}>
            Atölyeler
          </Text>
        </View>

        {total > 0 && (
          <View
            style={{
              backgroundColor: t.statBg,
              borderWidth: 1,
              borderColor: t.statBorder,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: t.statPctColor }}>{pct}%</Text>
            <Text style={{ fontSize: 9, color: t.statLabelColor, fontWeight: '600', letterSpacing: 0.5 }}>
              {done}/{total} ders
            </Text>
          </View>
        )}
      </View>

      <Text style={{ fontSize: 12, color: t.subtitleColor, marginTop: 8, lineHeight: 18, letterSpacing: 0.1 }}>
        Her atölye bir makale ve tahta alıştırmalarından oluşur. Sırayla ilerleyin.
      </Text>

      {total > 0 && (
        <View style={{ marginTop: 14, height: 3, backgroundColor: t.trackBg, borderRadius: 2, overflow: 'hidden' }}>
          <View
            style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`, height: '100%', backgroundColor: t.trackFill, borderRadius: 2 }}
          />
        </View>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AtolyelerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resolvedTheme } = useSettings();
  const isDark = resolvedTheme === 'dark';
  const t = SCREEN_THEME[isDark ? 'dark' : 'light'];

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

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
    })();

    return () => { cancelled = true; };
  }, []);

  const handlePressCourse = useCallback(
    (course: Course) => {
      router.push({
        pathname: '/atolyeler-detay/[slug]',
        params: { slug: course.slug || course.id },
      } as unknown as Href);
    },
    [router]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.screenBg, paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={t.loadingIndicator} />
        <Text style={{ marginTop: 12, fontSize: 13, color: t.loadingText, letterSpacing: 0.3 }}>
          Müfredat yükleniyor…
        </Text>
      </View>
    );
  }

  const progress = overallProgress(courses, completedIds);

  return (
    <View style={{ flex: 1, backgroundColor: t.screenBg }}>
      <AcademicHeader
        topInset={insets.top}
        done={progress.done}
        total={progress.total}
        pct={progress.pct}
        isDark={isDark}
      />
      <AtolyeSkillTree
        courses={courses}
        completedIds={completedIds}
        onPressCourse={handlePressCourse}
      />
    </View>
  );
}
