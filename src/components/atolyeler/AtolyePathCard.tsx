import React from 'react';
import { Pressable, Text, View, type DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadowStyle } from '../../lib/shadowStyle';
import {
  COURSE_BRAND,
  CourseLevelBadge,
  CourseStageMarker,
  formatCourseDuration,
  getLevelBandMeta,
} from '../courses';

export type AtolyePathCardItem = {
  id: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  levelBand?: string | null;
  levelLabel?: string | null;
  durationMinutes?: number | null;
};

type Progress = {
  completed: number;
  total: number;
  pct: number;
};

type Props = {
  item: AtolyePathCardItem;
  index: number;
  /** Card width inside the paging page (usually pageWidth − horizontal padding). */
  cardWidth: number;
  progress: Progress;
  ratingAvg?: number;
  onPress: () => void;
};

/** Full-bleed path card for the Atölyeler swipe chooser — no cover photo. */
export function AtolyePathCard({
  item,
  index: _index,
  cardWidth,
  progress,
  ratingAvg = 0,
  onPress,
}: Props) {
  const meta = getLevelBandMeta(item.levelBand, item.levelLabel);
  const stage = meta.stage;
  const duration = formatCourseDuration(item.durationMinutes ?? null);
  const blurb = item.summary || item.description;
  const progressWidth = `${Math.max(progress.pct, progress.total > 0 ? 2 : 0)}%` as DimensionValue;
  const hasProgress = progress.total > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, aşama ${stage}`}
      style={[
        { width: cardWidth },
        shadowStyle({ width: 0, height: 6 }, 16, 0.08, COURSE_BRAND.primary, 4),
      ]}
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:border-dark-border dark:bg-dark-card active:opacity-92"
    >
      <View
        style={{ backgroundColor: COURSE_BRAND.accentSoft }}
        className="flex-row items-center gap-3 border-b border-teal-700/10 px-4 py-3.5 dark:border-teal-400/15"
      >
        <CourseStageMarker stage={stage} size="md" />
        <View className="min-w-0 flex-1">
          <Text
            style={{ color: COURSE_BRAND.accent }}
            className="text-[10px] font-extrabold uppercase tracking-widest"
          >
            Atölye · Aşama {stage}
          </Text>
          <Text
            className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
            numberOfLines={1}
          >
            {meta.pathName} yolu
          </Text>
        </View>
        <CourseLevelBadge band={meta.band} variant="rank" />
      </View>

      <View className="px-4 pb-4 pt-3.5">
        <View className="mb-2.5 flex-row flex-wrap items-center gap-2">
          <CourseLevelBadge band={meta.band} variant="seviye" />
          {ratingAvg > 0 ? (
            <View
              className="flex-row items-center gap-1 rounded-full border px-2.5 py-1"
              style={{
                backgroundColor: COURSE_BRAND.rankSoft,
                borderColor: COURSE_BRAND.rankBorder,
              }}
            >
              <Ionicons name="star" size={11} color={COURSE_BRAND.rank} />
              <Text style={{ color: COURSE_BRAND.rank, fontSize: 10, fontWeight: '700' }}>
                {ratingAvg.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          className="text-[20px] font-extrabold leading-snug text-ink dark:text-slate-100"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {blurb ? (
          <Text
            className="mt-2 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400"
            numberOfLines={3}
          >
            {blurb}
          </Text>
        ) : null}

        {hasProgress ? (
          <View className="mt-4">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                İlerleme
              </Text>
              <Text style={{ color: COURSE_BRAND.accent }} className="text-xs font-extrabold">
                %{progress.pct} · {progress.completed}/{progress.total}
              </Text>
            </View>
            <View
              className="h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: COURSE_BRAND.pathTrack }}
            >
              <View
                style={{
                  width: progressWidth,
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: COURSE_BRAND.accentBright,
                }}
              />
            </View>
          </View>
        ) : null}

        <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3.5 dark:border-dark-border">
          {duration ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={15} color="#94a3b8" />
              <Text className="text-sm font-medium text-slate-400 dark:text-slate-500">
                {duration}
              </Text>
            </View>
          ) : (
            <Text className="text-sm font-semibold" style={{ color: COURSE_BRAND.accent }}>
              Atölyeye gir
            </Text>
          )}
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2.5"
            style={{ backgroundColor: COURSE_BRAND.primary }}
          >
            <Text className="text-xs font-extrabold text-white">Derse Git</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
