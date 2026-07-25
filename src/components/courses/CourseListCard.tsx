import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadowStyle } from '../../lib/shadowStyle';
import { CourseLevelBadge, CourseStageMarker } from './CourseLevelBadge';
import {
  COURSE_BRAND,
  formatCourseDuration,
  pathMetaFromStage,
  pathStageFromIndex,
} from './courseTheme';

export type CourseListCardItem = {
  id: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  level_band?: string | null;
  level?: string | null;
  duration_minutes?: number | null;
};

type Props = {
  item: CourseListCardItem;
  index: number;
  cardWidth: number;
  onPress: () => void;
};

export function CourseListCard({ item, index, cardWidth, onPress }: Props) {
  // Lig yolu by list order: aşama 1=Temel Taşlar, 2=Gelişim, 3=Aydınlanma
  const meta = pathMetaFromStage(pathStageFromIndex(index));
  const stage = meta.stage;
  const duration = formatCourseDuration(item.duration_minutes ?? null);
  const blurb = item.summary || item.description;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        { width: cardWidth, marginBottom: 16 },
        shadowStyle({ width: 0, height: 4 }, 14, 0.07, COURSE_BRAND.primary, 3),
      ]}
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:border-dark-border dark:bg-dark-card active:opacity-90"
    >
      {/* Path chrome strip */}
      <View
        style={{ backgroundColor: COURSE_BRAND.accentSoft }}
        className="flex-row items-center gap-3 border-b border-teal-700/10 px-4 py-3 dark:border-teal-400/15"
      >
        <CourseStageMarker stage={stage} size="sm" />
        <View className="min-w-0 flex-1">
          <Text
            style={{ color: COURSE_BRAND.accent }}
            className="text-[10px] font-extrabold uppercase tracking-widest"
          >
            Aşama {stage} · Yol haritası
          </Text>
          <Text
            className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
            numberOfLines={1}
          >
            {meta.pathName}
          </Text>
        </View>
        <CourseLevelBadge band={meta.band} variant="rank" />
      </View>

      <View className="px-4 pb-4 pt-3.5">
        <View className="mb-2.5 flex-row flex-wrap items-center gap-2">
          <CourseLevelBadge band={meta.band} variant="seviye" />
        </View>

        <Text
          className="text-[17px] font-bold leading-snug text-ink dark:text-slate-100"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {blurb ? (
          <Text
            className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
            numberOfLines={2}
          >
            {blurb}
          </Text>
        ) : null}

        <View className="mt-3.5 flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-dark-border">
          {duration ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={14} color="#94a3b8" />
              <Text className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {duration}
              </Text>
            </View>
          ) : (
            <Text className="text-xs font-semibold" style={{ color: COURSE_BRAND.accent }}>
              Yola gir
            </Text>
          )}
          <View
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: COURSE_BRAND.primary }}
          >
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
