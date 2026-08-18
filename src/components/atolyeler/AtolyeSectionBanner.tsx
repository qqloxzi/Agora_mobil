/**
 * AtolyeSectionBanner — Academic chapter heading, blue palette.
 * All three sections use shades of blue (deep → vivid → electric).
 */
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';

export type SectionStyle = 'temel' | 'gelisim' | 'aydinlanma';

type Props = {
  stage: number;
  title: string;
  subtitle: string;
  style: SectionStyle;
  courseCount: number;
  completedCount: number;
};

// Three shades of blue, increasing intensity
const SECTION_DEF: Record<SectionStyle, { accent: string; softBg: { dark: string; light: string }; icon: string; rankLabel: string }> = {
  temel: {
    accent:  '#2563EB',   // blue-600
    softBg:  { dark: 'rgba(37, 99, 235, 0.15)', light: 'rgba(37, 99, 235, 0.07)' },
    icon:    'library-outline',
    rankLabel: '17–12 Kyu',
  },
  gelisim: {
    accent:  '#1D4ED8',   // blue-700
    softBg:  { dark: 'rgba(29, 78, 216, 0.15)', light: 'rgba(29, 78, 216, 0.07)' },
    icon:    'school-outline',
    rankLabel: '11–6 Kyu',
  },
  aydinlanma: {
    accent:  '#1E3A8A',   // blue-900 / deep navy
    softBg:  { dark: 'rgba(30, 58, 138, 0.2)', light: 'rgba(30, 58, 138, 0.07)' },
    icon:    'telescope-outline',
    rankLabel: '5–1 Kyu',
  },
};

const BANNER_THEME = {
  dark: {
    bg:              '#080F1F',
    borderTop:       '#1E3A5F',
    chapterLabel:    '#334155',
    titleColor:      '#E2E8F0',
    subtitleColor:   '#475569',
    pillBg:          '#0D1B3E',
    pillBorder:      '#1E3A5F',
    trackBg:         '#0D1E36',
    countColor:      '#334155',
  },
  light: {
    bg:              '#FFFFFF',
    borderTop:       '#DBEAFE',
    chapterLabel:    '#93C5FD',
    titleColor:      '#0F172A',
    subtitleColor:   '#64748B',
    pillBg:          '#EFF6FF',
    pillBorder:      '#BFDBFE',
    trackBg:         '#DBEAFE',
    countColor:      '#93C5FD',
  },
} as const;

export function AtolyeSectionBanner({ stage, title, subtitle, style, courseCount, completedCount }: Props) {
  const { resolvedTheme } = useSettings();
  const isDark = resolvedTheme === 'dark';
  const t = BANNER_THEME[isDark ? 'dark' : 'light'];
  const def = SECTION_DEF[style];

  const pct = courseCount > 0 ? Math.round((completedCount / courseCount) * 100) : 0;
  const isComplete = completedCount === courseCount && courseCount > 0;

  return (
    <View
      style={{
        marginTop: 28,
        marginBottom: 4,
        backgroundColor: t.bg,
        borderTopWidth: 1,
        borderTopColor: t.borderTop,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
      }}
    >
      {/* Chapter label row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {/* Accent line */}
        <View style={{ width: 3, height: 20, borderRadius: 2, backgroundColor: def.accent }} />

        <Text style={{ fontSize: 10, fontWeight: '700', color: t.chapterLabel, letterSpacing: 2, textTransform: 'uppercase' }}>
          Bölüm {stage}
        </Text>

        <View style={{ flex: 1 }} />

        {/* Rank pill */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: t.pillBg,
            borderWidth: 1,
            borderColor: t.pillBorder,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Ionicons name={def.icon as any} size={12} color={def.accent} />
          <Text style={{ fontSize: 10, color: def.accent, fontWeight: '700', letterSpacing: 0.5 }}>
            {def.rankLabel}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={{ fontSize: 20, fontWeight: '800', color: t.titleColor, letterSpacing: -0.3, marginBottom: 4 }}>
        {title}
      </Text>

      {/* Subtitle */}
      <Text style={{ fontSize: 13, color: t.subtitleColor, lineHeight: 18 }}>
        {subtitle}
      </Text>

      {/* Progress footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <View style={{ flex: 1, height: 3, backgroundColor: t.trackBg, borderRadius: 2, overflow: 'hidden' }}>
          <View
            style={{
              width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`,
              height: '100%',
              backgroundColor: def.accent,
              borderRadius: 2,
            }}
          />
        </View>

        {isComplete ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-circle" size={14} color={def.accent} />
            <Text style={{ fontSize: 11, color: def.accent, fontWeight: '700' }}>Tamamlandı</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 11, color: t.countColor, fontWeight: '600' }}>
            {completedCount}/{courseCount} atölye
          </Text>
        )}
      </View>
    </View>
  );
}
