/**
 * AtolyeSkillNode — Academic timeline node.
 * Blue theme: completed=emerald, current=blue, locked=grey.
 * No animations. Straight spine layout.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';

export type NodeState = 'completed' | 'current' | 'locked';

export type AtolyeSkillNodeProps = {
  title: string;
  subtitle?: string | null;
  state: NodeState;
  stepNumber: number;
  progress?: number;
  lessonCount?: number;
  completedCount?: number;
  onPress: () => void;
  showConnector?: boolean;
  isLastInSection?: boolean;
};

// ─── Blue palette ─────────────────────────────────────────────────────────────

const NODE_THEME = {
  dark: {
    spineLine:           '#1E3A5F',
    spineLineDone:       '#1D4ED8',
    spineLineCurrent:    '#2563EB',

    circleBg_completed:  '#059669',
    circleBg_current:    '#1D4ED8',
    circleBg_locked:     '#0D1E36',
    circleBorder_completed: '#10B981',
    circleBorder_current:   '#3B82F6',
    circleBorder_locked:    '#1E3A5F',
    circleText_completed:   '#D1FAE5',
    circleText_current:     '#BFDBFE',
    circleText_locked:      '#334155',

    cardBg_completed:    '#042918',
    cardBg_current:      '#0D1B3E',
    cardBg_locked:       '#080F1F',
    cardBorder_completed:'#059669',
    cardBorder_current:  '#1D4ED8',
    cardBorder_locked:   '#1E293B',
    cardTitle_completed: '#A7F3D0',
    cardTitle_current:   '#BFDBFE',
    cardTitle_locked:    '#334155',
    cardSub_completed:   '#6EE7B7',
    cardSub_current:     '#93C5FD',
    cardSub_locked:      '#1E3A5F',
    statText_completed:  '#34D399',
    statText_current:    '#60A5FA',
    statText_locked:     '#1E3A5F',
    tagBg_completed:     'rgba(5, 150, 105, 0.2)',
    tagBg_current:       'rgba(29, 78, 216, 0.25)',
    tagBg_locked:        'rgba(14, 29, 56, 0.6)',
    tagText_completed:   '#34D399',
    tagText_current:     '#93C5FD',
    tagText_locked:      '#334155',
    progressTrack:       '#0D1E36',
    progressFill_completed: '#059669',
    progressFill_current:   '#2563EB',
  },
  light: {
    spineLine:           '#CBD5E1',
    spineLineDone:       '#059669',
    spineLineCurrent:    '#2563EB',

    circleBg_completed:  '#059669',
    circleBg_current:    '#1D4ED8',
    circleBg_locked:     '#EFF6FF',
    circleBorder_completed: '#10B981',
    circleBorder_current:   '#2563EB',
    circleBorder_locked:    '#BFDBFE',
    circleText_completed:   '#FFFFFF',
    circleText_current:     '#FFFFFF',
    circleText_locked:      '#93C5FD',

    cardBg_completed:    '#ECFDF5',
    cardBg_current:      '#EFF6FF',
    cardBg_locked:       '#F8FAFF',
    cardBorder_completed:'#A7F3D0',
    cardBorder_current:  '#BFDBFE',
    cardBorder_locked:   '#DBEAFE',
    cardTitle_completed: '#065F46',
    cardTitle_current:   '#1E3A8A',
    cardTitle_locked:    '#93C5FD',
    cardSub_completed:   '#059669',
    cardSub_current:     '#1D4ED8',
    cardSub_locked:      '#BFDBFE',
    statText_completed:  '#059669',
    statText_current:    '#1D4ED8',
    statText_locked:     '#BFDBFE',
    tagBg_completed:     'rgba(5, 150, 105, 0.12)',
    tagBg_current:       'rgba(29, 78, 216, 0.1)',
    tagBg_locked:        'rgba(191, 219, 254, 0.4)',
    tagText_completed:   '#059669',
    tagText_current:     '#1D4ED8',
    tagText_locked:      '#93C5FD',
    progressTrack:       '#DBEAFE',
    progressFill_completed: '#059669',
    progressFill_current:   '#2563EB',
  },
} as const;

const CIRCLE_SIZE = 36;

export function AtolyeSkillNode({
  title,
  subtitle,
  state,
  stepNumber,
  progress = 0,
  lessonCount = 0,
  completedCount = 0,
  onPress,
  showConnector = false,
  isLastInSection = false,
}: AtolyeSkillNodeProps) {
  const { resolvedTheme } = useSettings();
  const isDark = resolvedTheme === 'dark';
  const t = NODE_THEME[isDark ? 'dark' : 'light'];

  const isLocked = state === 'locked';

  const circleBg     = t[`circleBg_${state}`];
  const circleBorder = t[`circleBorder_${state}`];
  const circleText   = t[`circleText_${state}`];
  const cardBg       = t[`cardBg_${state}`];
  const cardBorder   = t[`cardBorder_${state}`];
  const cardTitle    = t[`cardTitle_${state}`];
  const cardSub      = t[`cardSub_${state}`];
  const statText     = t[`statText_${state}`];
  const tagBg        = t[`tagBg_${state}`];
  const tagText      = t[`tagText_${state}`];

  const spineColor   =
    state === 'completed' ? t.spineLineDone
    : state === 'current' ? t.spineLineCurrent
    : t.spineLine;

  const progressFill =
    state === 'completed' ? t.progressFill_completed : t.progressFill_current;

  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
      {/* ── Spine + circle ─────────────────────────────── */}
      <View style={{ alignItems: 'center', width: CIRCLE_SIZE + 8 }}>
        {showConnector
          ? <View style={{ width: 2, height: 16, backgroundColor: spineColor }} />
          : <View style={{ height: 16 }} />
        }

        <View
          style={{
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            backgroundColor: circleBg,
            borderWidth: 2,
            borderColor: circleBorder,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: state !== 'locked' ? circleBorder : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            elevation: state !== 'locked' ? 4 : 0,
          }}
        >
          {state === 'completed' ? (
            <Ionicons name="checkmark" size={18} color={circleText} />
          ) : state === 'locked' ? (
            <Ionicons name="lock-closed" size={14} color={circleText} />
          ) : (
            <Text style={{ fontSize: 13, fontWeight: '800', color: circleText }}>
              {stepNumber}
            </Text>
          )}
        </View>

        {!isLastInSection && (
          <View style={{ flex: 1, width: 2, backgroundColor: t.spineLine, minHeight: 20 }} />
        )}
      </View>

      {/* ── Content card ──────────────────────────────── */}
      <View style={{ flex: 1, paddingLeft: 12, paddingBottom: 20 }}>
        <Pressable
          onPress={isLocked ? undefined : onPress}
          accessibilityRole="button"
          accessibilityLabel={`${title}${isLocked ? ' (kilitli)' : ''}`}
          style={({ pressed }) => ({
            opacity: pressed && !isLocked ? 0.88 : 1,
            borderRadius: 12,
          })}
        >
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: cardBorder,
              backgroundColor: cardBg,
              padding: 14,
            }}
          >
            {/* State tag + step */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: tagBg }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: tagText, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {state === 'completed' ? 'Tamamlandı' : state === 'current' ? 'Devam Ediyor' : 'Kilitli'}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: statText, fontWeight: '600', letterSpacing: 0.5 }}>
                Atölye {stepNumber}
              </Text>
            </View>

            {/* Title */}
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: cardTitle, letterSpacing: 0.1, lineHeight: 21 }}
              numberOfLines={2}
            >
              {title}
            </Text>

            {/* Subtitle */}
            {subtitle && !isLocked ? (
              <Text style={{ fontSize: 12, color: cardSub, marginTop: 5, lineHeight: 17 }} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}

            {/* Progress bar */}
            {lessonCount > 0 && !isLocked && (
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, color: statText, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    İlerleme
                  </Text>
                  <Text style={{ fontSize: 10, color: statText, fontWeight: '700' }}>
                    {completedCount} / {lessonCount} ders
                  </Text>
                </View>
                <View style={{ height: 4, backgroundColor: t.progressTrack, borderRadius: 2, overflow: 'hidden' }}>
                  <View
                    style={{
                      width: `${Math.max(progress, progress > 0 ? 3 : 0)}%`,
                      height: '100%',
                      backgroundColor: progressFill,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            )}

            {/* CTA */}
            {!isLocked && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: statText }}>
                    {state === 'completed' ? 'Tekrarla' : 'Devam Et'}
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color={statText} />
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}
