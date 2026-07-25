import React from 'react';
import { Text, View } from 'react-native';
import { COURSE_BRAND, getLevelBandMeta, type LevelBandKey } from './courseTheme';

type Variant = 'rank' | 'seviye' | 'full';

type Props = {
  /** Full label override (legacy); prefer band + variant */
  label?: string;
  band?: string | null;
  level?: string | null;
  variant?: Variant;
  size?: 'sm' | 'md';
};

/** Rank / seviye chips — game-academy chrome for Kurslar. */
export function CourseLevelBadge({
  label,
  band,
  level,
  variant = 'full',
  size = 'sm',
}: Props) {
  const meta = getLevelBandMeta(band, level);
  const isMd = size === 'md';

  let text = label ?? meta.fullLabel;
  let bg: string = COURSE_BRAND.accentSoft;
  let border: string = COURSE_BRAND.accentBorder;
  let color: string = COURSE_BRAND.accent;

  if (variant === 'rank') {
    text = meta.difficulty;
    bg = COURSE_BRAND.rankSoft;
    border = COURSE_BRAND.rankBorder;
    color = COURSE_BRAND.rank;
  } else if (variant === 'seviye') {
    text = meta.seviyeLabel;
    bg = COURSE_BRAND.accentSoft;
    border = COURSE_BRAND.accentBorder;
    color = COURSE_BRAND.accent;
  } else if (!label) {
    text = `${meta.difficulty} · ${meta.pathName}`;
  }

  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: isMd ? 14 : 10,
        paddingVertical: isMd ? 6 : 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color,
          fontWeight: '700',
          fontSize: isMd ? 12 : 10,
          letterSpacing: 0.2,
        }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

type StageProps = {
  stage: number;
  size?: 'sm' | 'md' | 'lg';
  band?: LevelBandKey | string | null;
};

/** Numbered path-stage marker (board / level metaphor). */
export function CourseStageMarker({ stage, size = 'md' }: StageProps) {
  const dim = size === 'lg' ? 48 : size === 'md' ? 40 : 32;
  const fontSize = size === 'lg' ? 18 : size === 'md' ? 15 : 13;

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: COURSE_BRAND.primary,
        borderWidth: 2,
        borderColor: COURSE_BRAND.accentBright,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel={`Aşama ${stage}`}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize }}>{stage}</Text>
    </View>
  );
}
