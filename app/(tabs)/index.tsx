import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroSection } from '../../src/components/home/HeroSection';
import { FixturSection } from '../../src/components/home/FixturSection';
import FAQ from '../../src/components/home/FAQ';
import { AboutSection } from '../../src/components/home/AboutSection';
import { HomeUserChip } from '../../src/components/home/HomeUserChip';
import { useAuth } from '../../src/context/AuthContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const chipTop = insets.top + 8;
  const contentTop = user ? chipTop + 44 : insets.top + 20;

  return (
    <View className="flex-1 bg-ice-white dark:bg-dark-bg">
      {user ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: chipTop,
            left: 16,
            zIndex: 20,
          }}
        >
          <HomeUserChip />
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: contentTop,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}>
        <HeroSection />

        <FixturSection />

        <AboutSection />

        <FAQ />
      </ScrollView>
    </View>
  );
}
