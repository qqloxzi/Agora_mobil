import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';

function Stones20_18() {
  return (
    <Svg viewBox="0 0 80 80" width={60} height={60}>
      <Defs>
        <RadialGradient id="w20" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
          <Stop offset="0%" stopColor="#f8fafc" />
          <Stop offset="100%" stopColor="#cbd5e1" />
        </RadialGradient>
        <RadialGradient id="b20" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
          <Stop offset="0%" stopColor="#475569" />
          <Stop offset="100%" stopColor="#0f172a" />
        </RadialGradient>
      </Defs>
      <Circle cx="38" cy="36" r="18" fill="url(#b20)" />
      <Circle cx="48" cy="48" r="18" fill="url(#w20)" stroke="#94a3b8" strokeWidth="1" />
    </Svg>
  );
}

function Stones17_12() {
  return (
    <Svg viewBox="0 0 80 80" width={60} height={60}>
      <Defs>
        <RadialGradient id="w17" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
          <Stop offset="0%" stopColor="#f8fafc" />
          <Stop offset="100%" stopColor="#cbd5e1" />
        </RadialGradient>
        <RadialGradient id="b17" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
          <Stop offset="0%" stopColor="#475569" />
          <Stop offset="100%" stopColor="#0f172a" />
        </RadialGradient>
      </Defs>
      <Circle cx="28" cy="32" r="14" fill="url(#b17)" />
      <Circle cx="52" cy="32" r="14" fill="url(#w17)" stroke="#94a3b8" strokeWidth="0.8" />
      <Circle cx="40" cy="54" r="14" fill="url(#b17)" />
    </Svg>
  );
}

function Stones11_6() {
  return (
    <Svg viewBox="0 0 80 80" width={60} height={60}>
      <Defs>
        <RadialGradient id="w11" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
          <Stop offset="0%" stopColor="#f8fafc" />
          <Stop offset="100%" stopColor="#cbd5e1" />
        </RadialGradient>
        <RadialGradient id="b11" cx="35%" cy="35%" r="65%" fx="35%" fy="35%">
          <Stop offset="0%" stopColor="#475569" />
          <Stop offset="100%" stopColor="#0f172a" />
        </RadialGradient>
      </Defs>
      {[0, 1, 2, 3].map((i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const cx = 26 + col * 28;
        const cy = 26 + row * 28;
        const fill = i % 2 === 0 ? 'url(#b11)' : 'url(#w11)';
        return <Circle key={i} cx={cx} cy={cy} r="12" fill={fill} stroke="#94a3b8" strokeWidth="0.6" />;
      })}
    </Svg>
  );
}

function Stones5_1() {
  return (
    <Svg viewBox="0 0 80 80" width={60} height={60}>
      <Defs>
        <RadialGradient id="b5" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
          <Stop offset="0%" stopColor="#64748b" />
          <Stop offset="100%" stopColor="#020617" />
        </RadialGradient>
      </Defs>
      <Circle cx="40" cy="40" r="22" fill="url(#b5)" opacity="0.95" />
      <Circle cx="40" cy="40" r="8" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
    </Svg>
  );
}

const LEVEL_ART: Record<string, () => React.JSX.Element> = {
  '20-18': Stones20_18,
  beginner: Stones20_18,
  '17-12': Stones17_12,
  '11-6': Stones11_6,
  '5-1': Stones5_1,
  '1d-plus': Stones5_1,
};

type LevelSelectionProps = {
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

export function LevelSelection({ options, selectedValue, onSelect }: LevelSelectionProps) {
  return (
    <View className="flex-col gap-4">
      {options.map((opt) => {
        const selected = selectedValue === opt.value;
        const Art = LEVEL_ART[opt.value] ?? Stones20_18;

        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            className={`w-full p-5 rounded-3xl border flex-row items-center gap-4 ${
              selected
                ? 'border-accent-blue bg-accent-blue/10 dark:bg-accent-blue/15'
                : 'border-primary-blue/20 dark:border-white/10 bg-slate-50 dark:bg-white/5'
            }`}
          >
            <View
              className={`rounded-2xl p-2 items-center justify-center ${
                selected ? 'bg-accent-blue/20' : 'bg-white/50 dark:bg-white/10'
              }`}
            >
              <Art />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {opt.label}
              </Text>
              <Text className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                Seviye aralığı
              </Text>
            </View>
            {selected && (
              <View className="h-6 w-6 items-center justify-center rounded-full bg-accent-blue">
                <View className="w-2 h-2 rounded-full bg-white" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
