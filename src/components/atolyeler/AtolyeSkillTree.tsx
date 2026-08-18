/**
 * AtolyeSkillTree — Straight academic timeline, blue theme.
 *
 * LOCKING RULES:
 *  - The FIRST course of each section (Temel / Gelişim / Aydınlanma) is
 *    always accessible so high-level users can jump straight to their level.
 *  - Within a section, subsequent courses unlock sequentially as you complete
 *    the previous one.
 */
import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';
import type { Course } from '../../lib/education/fetchCurriculum';
import { flattenLessons } from '../../lib/education/fetchCurriculum';
import { ATOLYELER_SECTIONS } from '../../lib/education/atolyelerSections';
import { AtolyeSkillNode, type NodeState } from './AtolyeSkillNode';
import { AtolyeSectionBanner, type SectionStyle } from './AtolyeSectionBanner';

const SECTION_STYLE_MAP: Record<string, SectionStyle> = {
  'temel-taslar': 'temel',
  gelisim:        'gelisim',
  aydinlanma:     'aydinlanma',
};

const TREE_THEME = {
  dark: {
    screenBg:        '#080F1F',
    emptyIcon:       '#1E3A5F',
    emptyText:       '#334155',
    endLineBg:       '#0D1E36',
    endCircleBg:     '#080F1F',
    endCircleBorder: '#1E3A5F',
    endIconColor:    '#1E3A5F',
    endLabelColor:   '#334155',
  },
  light: {
    screenBg:        '#F0F4FF',
    emptyIcon:       '#BFDBFE',
    emptyText:       '#93C5FD',
    endLineBg:       '#DBEAFE',
    endCircleBg:     '#EFF6FF',
    endCircleBorder: '#BFDBFE',
    endIconColor:    '#BFDBFE',
    endLabelColor:   '#93C5FD',
  },
} as const;

// ─── Locking logic ────────────────────────────────────────────────────────────

type CourseWithMeta = {
  course: Course;
  sectionId: string;
  nodeState: NodeState;
  progress: number;
  completedLessons: number;
  totalLessons: number;
};

function isCompleted(course: Course, completedIds: Set<string>): boolean {
  const lessons = flattenLessons([course]);
  return lessons.length > 0 && lessons.every((l) => completedIds.has(l.id));
}

function computeCoursesMeta(courses: Course[], completedIds: Set<string>): CourseWithMeta[] {
  // Build per-section course lists (in the order they appear in `courses`)
  const sectionMap: Record<string, Course[]> = {};
  for (const section of ATOLYELER_SECTIONS) {
    sectionMap[section.id] = courses.filter(
      (c) => ATOLYELER_SECTIONS.find(
        (s) => s.levelBand === (c.levelBand ?? '17-12-kyu')
      )?.id === section.id
    );
  }

  return courses.map((course) => {
    const lessons = flattenLessons([course]);
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter((l) => completedIds.has(l.id)).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const done = totalLessons > 0 && completedLessons === totalLessons;

    const section = ATOLYELER_SECTIONS.find(
      (s) => s.levelBand === (course.levelBand ?? '17-12-kyu')
    );
    const sectionId = section?.id ?? 'temel-taslar';
    const sectionCourses = sectionMap[sectionId] ?? [];
    const indexInSection = sectionCourses.findIndex((c) => c.id === course.id);

    let nodeState: NodeState;

    if (done) {
      // Always mark as completed
      nodeState = 'completed';
    } else if (indexInSection === 0) {
      // ✅ FIRST of every section is always accessible (never locked)
      nodeState = 'current';
    } else {
      // Unlock if ALL preceding courses in this section are completed
      const preceding = sectionCourses.slice(0, indexInSection);
      const allPrecedingDone = preceding.every((c) => isCompleted(c, completedIds));
      nodeState = allPrecedingDone ? 'current' : 'locked';
    }

    return { course, sectionId, nodeState, progress, completedLessons, totalLessons };
  });
}

type SectionGroup = {
  section: (typeof ATOLYELER_SECTIONS)[number];
  courses: CourseWithMeta[];
  completedInSection: number;
};

function groupBySection(coursesMeta: CourseWithMeta[]): SectionGroup[] {
  return ATOLYELER_SECTIONS.map((section) => {
    const courses = coursesMeta.filter((c) => c.sectionId === section.id);
    return {
      section,
      courses,
      completedInSection: courses.filter((c) => c.nodeState === 'completed').length,
    };
  }).filter((g) => g.courses.length > 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  courses: Course[];
  completedIds: Set<string>;
  onPressCourse: (course: Course) => void;
};

export function AtolyeSkillTree({ courses, completedIds, onPressCourse }: Props) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useSettings();
  const isDark = resolvedTheme === 'dark';
  const t = TREE_THEME[isDark ? 'dark' : 'light'];

  const coursesMeta  = useMemo(() => computeCoursesMeta(courses, completedIds), [courses, completedIds]);
  const sectionGroups = useMemo(() => groupBySection(coursesMeta), [coursesMeta]);

  if (courses.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Ionicons name="document-text-outline" size={48} color={t.emptyIcon} />
        <Text style={{ color: t.emptyText, marginTop: 12, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
          Henüz atölye içeriği yok.
        </Text>
      </View>
    );
  }

  let globalStep = 1;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
    >
      {sectionGroups.map(({ section, courses: sectionCourses, completedInSection }, sectionIdx) => {
        const sectionStyle = SECTION_STYLE_MAP[section.id] ?? 'temel';

        return (
          <View key={section.id}>
            <AtolyeSectionBanner
              stage={sectionIdx + 1}
              title={section.title}
              subtitle={section.subtitle}
              style={sectionStyle}
              courseCount={sectionCourses.length}
              completedCount={completedInSection}
            />

            {sectionCourses.map((meta, idxInSection) => {
              const stepNum = globalStep++;
              const isFirst = idxInSection === 0;
              const isLast  = idxInSection === sectionCourses.length - 1;

              return (
                <AtolyeSkillNode
                  key={meta.course.id}
                  title={meta.course.title}
                  subtitle={meta.course.summary ?? meta.course.description}
                  state={meta.nodeState}
                  stepNumber={stepNum}
                  progress={meta.progress}
                  lessonCount={meta.totalLessons}
                  completedCount={meta.completedLessons}
                  onPress={() => onPressCourse(meta.course)}
                  showConnector={!isFirst}
                  isLastInSection={isLast}
                />
              );
            })}
          </View>
        );
      })}

      {/* End marker */}
      <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 8 }}>
        <View style={{ width: 1, height: 32, backgroundColor: t.endLineBg }} />
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: t.endCircleBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: t.endCircleBorder,
          }}
        >
          <Ionicons name="flag-outline" size={20} color={t.endIconColor} />
        </View>
        <Text style={{ color: t.endLabelColor, marginTop: 8, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Yol Sonu
        </Text>
      </View>
    </ScrollView>
  );
}
