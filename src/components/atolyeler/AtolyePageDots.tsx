import React from 'react';
import { View } from 'react-native';
import { COURSE_BRAND } from '../courses';

type Props = {
  count: number;
  activeIndex: number;
};

/** Simple page indicator for the Atölyeler swipe chooser. */
export function AtolyePageDots({ count, activeIndex }: Props) {
  if (count <= 1) return null;

  return (
    <View
      className="mt-4 flex-row items-center justify-center gap-1.5"
      accessibilityRole="adjustable"
      accessibilityLabel={`Sayfa ${activeIndex + 1} / ${count}`}
    >
      {Array.from({ length: count }, (_, i) => {
        const active = i === activeIndex;
        return (
          <View
            key={i}
            style={{
              width: active ? 18 : 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: active ? COURSE_BRAND.accent : 'rgba(15, 118, 110, 0.22)',
            }}
          />
        );
      })}
    </View>
  );
}
