/** Shared Kurslar visual language — Go academy / path-stage chrome (no cover photos). */
export const COURSE_BRAND = {
  /** Teal board-path accent — distinct from app accent-blue */
  accent: '#0F766E',
  accentBright: '#14B8A6',
  accentSoft: 'rgba(15, 118, 110, 0.12)',
  accentBorder: 'rgba(15, 118, 110, 0.28)',
  /** Warm rank gold for seviye chips */
  rank: '#B45309',
  rankSoft: 'rgba(180, 83, 9, 0.12)',
  rankBorder: 'rgba(180, 83, 9, 0.28)',
  primary: '#0A2540',
  ink: '#1A1A1A',
  muted: '#64748b',
  pathTrack: '#CCFBF1',
} as const;

export type LevelBandKey = '17-12-kyu' | '11-6-kyu' | '5kyu-1dan';

export type LevelBandMeta = {
  band: LevelBandKey;
  /** Path stage index (1–3) */
  stage: number;
  /** Short rank band for chips */
  difficulty: 'Başlangıç' | 'Orta' | 'İleri';
  /** Rank band chip label (e.g. 17–12 Kyu) */
  seviyeLabel: string;
  /** Full lig label */
  fullLabel: string;
  /** Short path name */
  pathName: string;
};

export const LEVEL_BAND_META: Record<LevelBandKey, LevelBandMeta> = {
  '17-12-kyu': {
    band: '17-12-kyu',
    stage: 1,
    difficulty: 'Başlangıç',
    seviyeLabel: '17–12 Kyu',
    fullLabel: '17–12 Kyu · Temel Taşlar',
    pathName: 'Temel Taşlar',
  },
  '11-6-kyu': {
    band: '11-6-kyu',
    stage: 2,
    difficulty: 'Orta',
    seviyeLabel: '11–6 Kyu',
    fullLabel: '11–6 Kyu · Gelişim',
    pathName: 'Gelişim',
  },
  '5kyu-1dan': {
    band: '5kyu-1dan',
    stage: 3,
    difficulty: 'İleri',
    seviyeLabel: '5–1 Kyu',
    fullLabel: '5–1 Kyu · Aydınlanma',
    pathName: 'Aydınlanma',
  },
};

const STAGE_BAND_KEYS: LevelBandKey[] = ['17-12-kyu', '11-6-kyu', '5kyu-1dan'];

/** Path chrome for ordered lists: aşama 1=Temel Taşlar, 2=Gelişim, 3=Aydınlanma. */
export function pathMetaFromStage(stage: number): LevelBandMeta {
  const clamped = Math.min(3, Math.max(1, Math.round(stage)));
  return LEVEL_BAND_META[STAGE_BAND_KEYS[clamped - 1]];
}

/** @deprecated Prefer LEVEL_BAND_META — kept for callers expecting string labels */
export const LEVEL_BAND_LABELS: Record<string, string> = {
  '17-12-kyu': LEVEL_BAND_META['17-12-kyu'].fullLabel,
  '11-6-kyu': LEVEL_BAND_META['11-6-kyu'].fullLabel,
  '5kyu-1dan': LEVEL_BAND_META['5kyu-1dan'].fullLabel,
};

export function formatCourseDuration(min: number | null | undefined): string | null {
  if (min == null || Number.isNaN(min) || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h) return m ? `${h} sa ${m} dk` : `${h} saat`;
  return `${min} dk`;
}

/** Responsive card width for Kurslar grid. */
export function courseCardLayout(screenWidth: number) {
  const padding = screenWidth >= 768 ? 24 : 16;
  const gap = 14;
  const maxContent = 920;
  const contentWidth = Math.min(screenWidth, maxContent);
  const numColumns = screenWidth >= 700 ? 2 : 1;
  const cardWidth =
    numColumns === 1
      ? contentWidth - padding * 2
      : (contentWidth - padding * 2 - gap) / 2;

  return { padding, gap, numColumns, cardWidth, contentWidth };
}

export function levelBandFromLevel(level: string | null | undefined): LevelBandKey {
  if (!level) return '17-12-kyu';
  const l = level.toLowerCase();
  if (l.includes('aydın') || l.includes('aydin') || l.includes('dan')) return '5kyu-1dan';
  if (l.includes('gelişim') || l.includes('gelisim')) return '11-6-kyu';
  if (l.includes('temel') || l.includes('taş') || l.includes('tas')) return '17-12-kyu';
  if (l.includes('5kyu') || l.includes('5-kyu') || l.includes('1dan')) return '5kyu-1dan';
  if (l.includes('11-6') || l.includes('11–6')) return '11-6-kyu';
  if (l.includes('17-12') || l.includes('17–12')) return '17-12-kyu';
  return '17-12-kyu';
}

export function resolveLevelBand(
  levelBand: string | null | undefined,
  level?: string | null
): LevelBandKey {
  if (levelBand && levelBand in LEVEL_BAND_META) return levelBand as LevelBandKey;
  return levelBandFromLevel(level ?? levelBand);
}

export function getLevelBandMeta(
  levelBand: string | null | undefined,
  level?: string | null
): LevelBandMeta {
  return LEVEL_BAND_META[resolveLevelBand(levelBand, level)];
}

export function levelLabelFromBandOrLevel(
  levelBand: string | null | undefined,
  level?: string | null
): string {
  return getLevelBandMeta(levelBand, level).fullLabel;
}

/** Stage number when courses are shown as an ordered path (sort_order / index). */
export function pathStageFromIndex(index: number): number {
  return Math.max(1, index + 1);
}
