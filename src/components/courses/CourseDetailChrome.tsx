import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CourseLevelBadge, CourseStageMarker } from './CourseLevelBadge';
import { COURSE_BRAND, getLevelBandMeta } from './courseTheme';

type HeaderProps = {
  title?: string;
  topInset: number;
  onBack: () => void;
};

export function CourseDetailHeader({ title = 'Kurs Detayı', topInset, onBack }: HeaderProps) {
  return (
    <View
      className="flex-row items-center justify-between border-b border-slate-200/80 bg-white px-4 pb-3 dark:border-dark-border dark:bg-dark-surface"
      style={{ paddingTop: topInset + 10 }}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        className="min-w-[72px] flex-row items-center gap-1.5 py-2 active:opacity-70"
      >
        <Ionicons name="arrow-back" size={22} color="#64748b" />
        <Text className="font-medium text-slate-500 dark:text-slate-400">Geri</Text>
      </Pressable>
      <Text className="text-base font-bold text-ink dark:text-slate-100">{title}</Text>
      <View style={{ width: 72 }} />
    </View>
  );
}

type HeroProps = {
  title: string;
  levelLabel?: string;
  description?: string | null;
  levelBand?: string | null;
  level?: string | null;
  stage?: number;
};

/** Text-first hero — path stage framing, no cover photo. */
export function CourseDetailHero({
  title,
  description,
  levelBand,
  level,
  stage,
}: HeroProps) {
  const meta = getLevelBandMeta(levelBand, level);
  const stageNum = stage ?? meta.stage;

  return (
    <View>
      <View
        style={{ backgroundColor: COURSE_BRAND.accentSoft, borderColor: COURSE_BRAND.accentBorder }}
        className="mb-5 overflow-hidden rounded-2xl border px-4 py-4"
      >
        <View className="flex-row items-center gap-3.5">
          <CourseStageMarker stage={stageNum} size="lg" />
          <View className="min-w-0 flex-1">
            <Text
              style={{ color: COURSE_BRAND.accent }}
              className="text-[10px] font-extrabold uppercase tracking-widest"
            >
              Go Akademisi · Aşama {stageNum}
            </Text>
            <Text className="mt-1 text-sm font-bold text-ink dark:text-slate-100">
              {meta.pathName} yolu
            </Text>
            <View className="mt-2.5 flex-row flex-wrap gap-2">
              <CourseLevelBadge band={levelBand} level={level} variant="rank" size="md" />
              <CourseLevelBadge band={levelBand} level={level} variant="seviye" size="md" />
            </View>
          </View>
        </View>

        {/* Soft path track */}
        <View className="mt-4 flex-row items-center gap-1.5">
          {[1, 2, 3].map((n) => (
            <View key={n} className="flex-1 flex-row items-center gap-1.5">
              <View
                style={{
                  height: 4,
                  flex: 1,
                  borderRadius: 999,
                  backgroundColor:
                    n <= stageNum ? COURSE_BRAND.accentBright : 'rgba(15, 118, 110, 0.18)',
                }}
              />
            </View>
          ))}
        </View>
        <Text className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Lig yolu · {meta.fullLabel}
        </Text>
      </View>

      <Text
        style={{ color: COURSE_BRAND.accent }}
        className="mb-2 text-[10px] font-extrabold uppercase tracking-widest"
      >
        Agora Go Akademisi
      </Text>
      <Text className="mb-3 text-2xl font-extrabold leading-tight text-ink dark:text-slate-100">
        {title}
      </Text>
      {description ? (
        <Text className="mb-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </Text>
      ) : null}
    </View>
  );
}

type SectionProps = {
  children: React.ReactNode;
  className?: string;
};

/** Shared surface for meta blocks, summary bars, lists. */
export function CourseSectionCard({ children, className = '' }: SectionProps) {
  return (
    <View
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-dark-border dark:bg-dark-card ${className}`}
    >
      {children}
    </View>
  );
}

type MetaTileProps = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: boolean;
};

export function CourseMetaTile({ label, value, icon, accent }: MetaTileProps) {
  return (
    <View
      className={`min-w-[140px] flex-1 flex-row items-center gap-3 rounded-2xl border p-3.5 ${
        accent
          ? 'border-teal-700/25 bg-teal-700/5 dark:border-teal-400/30 dark:bg-teal-400/10'
          : 'border-slate-200/80 bg-slate-50 dark:border-dark-border dark:bg-dark-surface'
      }`}
    >
      {icon ? (
        <View
          className={`h-10 w-10 items-center justify-center rounded-full ${
            accent ? 'bg-teal-700/15' : 'bg-slate-200/80 dark:bg-slate-700'
          }`}
        >
          <Ionicons name={icon} size={18} color={accent ? COURSE_BRAND.accent : '#64748b'} />
        </View>
      ) : null}
      <View className="min-w-0 flex-1">
        <Text
          className="mb-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ color: accent ? COURSE_BRAND.accent : '#94a3b8' }}
        >
          {label}
        </Text>
        <Text className="font-bold text-ink dark:text-slate-100" numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

type SummaryItem = { label: string; value: string };

export function CourseSummaryBar({ items }: { items: SummaryItem[] }) {
  return (
    <CourseSectionCard className="flex-row flex-wrap justify-between gap-y-3 px-3 py-4">
      {items.map((item) => (
        <View key={item.label} className="min-w-[70px] flex-1 items-center px-1">
          <Text className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {item.label}
          </Text>
          <Text
            className="text-center text-sm font-semibold text-ink dark:text-slate-100"
            numberOfLines={2}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </CourseSectionCard>
  );
}

export function CourseSectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-3 text-lg font-bold text-ink dark:text-slate-100">{children}</Text>
  );
}

export function CourseOutcomeItem({ text, index }: { text: string; index?: number }) {
  const step = (index ?? 0) + 1;
  return (
    <View className="mb-2.5 flex-row items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-dark-border dark:bg-dark-card">
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: COURSE_BRAND.accentSoft, borderWidth: 1, borderColor: COURSE_BRAND.accentBorder }}
      >
        {index != null ? (
          <Text style={{ color: COURSE_BRAND.accent, fontWeight: '800', fontSize: 12 }}>{step}</Text>
        ) : (
          <Ionicons name="checkmark" size={15} color={COURSE_BRAND.accent} />
        )}
      </View>
      <Text className="flex-1 text-[15px] font-medium leading-snug text-slate-800 dark:text-slate-200">
        {text}
      </Text>
      <Ionicons name="checkmark-circle" size={18} color={COURSE_BRAND.accentBright} />
    </View>
  );
}

type CtaProps = {
  title: string;
  onPress: () => void;
};

export function CoursePrimaryCta({ title, onPress }: CtaProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="w-full items-center rounded-2xl py-4 active:opacity-90"
      style={{ backgroundColor: COURSE_BRAND.primary }}
    >
      <Text className="text-base font-bold text-white">{title}</Text>
    </Pressable>
  );
}
