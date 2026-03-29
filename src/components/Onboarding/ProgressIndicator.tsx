import React from 'react';
import { View, Text } from 'react-native';

type ProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const pct = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <View className="w-full max-w-md mx-auto mb-10">
      <View className="flex-row justify-between mb-2">
        <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Adım {currentStep + 1}
        </Text>
        <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Toplam {totalSteps}
        </Text>
      </View>
      <View
        className="h-2 w-full overflow-hidden rounded-full bg-primary-blue/10 dark:bg-white/10"
        accessibilityRole="progressbar"
        accessibilityValue={{ now: currentStep + 1, min: 1, max: totalSteps }}
      >
        <View
          className="h-full rounded-full bg-primary-blue"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
