import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroSection } from '../../src/components/home/HeroSection';
import { FeaturesSection } from '../../src/components/home/FeaturesSection';
import { PhilosophySection } from '../../src/components/home/PhilosophySection';
import { ProtocolSection } from '../../src/components/home/ProtocolSection';
import { FixturSection } from '../../src/components/home/FixturSection';
import FAQ from '../../src/components/home/FAQ';
import { AboutSection } from '../../src/components/home/AboutSection';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-ice-white dark:bg-dark-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}>
      <HeroSection />
      <FeaturesSection />

      <View className="px-2">
        <PhilosophySection />
      </View>

      <ProtocolSection />

      <FixturSection />

      <FAQ />

      <AboutSection />
    </ScrollView>
  );
}
