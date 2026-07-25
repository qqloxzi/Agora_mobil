import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { COURSE_BRAND, getLevelBandMeta, type LevelBandKey } from '../courses';
import type { AtolyelerSection } from '../../lib/education/atolyelerSections';

type Props = {
  sections: AtolyelerSection[];
  activeId: string;
  counts: Record<string, number>;
  onSelect: (sectionId: string) => void;
};

/** Path-stage filter chips — Temel / Gelişim / Aydınlanma. */
export function AtolyePathChips({ sections, activeId, counts, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {sections.map((section) => {
        const active = activeId === section.id;
        const meta = getLevelBandMeta(section.levelBand as LevelBandKey);
        const count = counts[section.id] ?? 0;

        return (
          <Pressable
            key={section.id}
            onPress={() => onSelect(section.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className="active:opacity-85"
            style={{
              borderRadius: 16,
              borderWidth: 1,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: active ? COURSE_BRAND.primary : '#fff',
              borderColor: active ? COURSE_BRAND.primary : COURSE_BRAND.accentBorder,
              minWidth: 118,
            }}
          >
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? COURSE_BRAND.accentBright : COURSE_BRAND.accentSoft,
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : COURSE_BRAND.accent,
                    fontSize: 11,
                    fontWeight: '800',
                  }}
                >
                  {meta.stage}
                </Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  style={{
                    color: active ? '#fff' : COURSE_BRAND.ink,
                    fontSize: 13,
                    fontWeight: '800',
                  }}
                  numberOfLines={1}
                >
                  {section.title}
                </Text>
                <Text
                  style={{
                    color: active ? 'rgba(255,255,255,0.72)' : COURSE_BRAND.muted,
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 1,
                  }}
                >
                  {count} atölye · {meta.seviyeLabel}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
