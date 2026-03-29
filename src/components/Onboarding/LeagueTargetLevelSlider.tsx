import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { buildLeagueTargetLevelSteps } from '../../data/leagueTargetLevels';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

type LeagueTargetLevelSliderProps = {
  value: string;
  onChange: (value: string) => void;
};

export function LeagueTargetLevelSlider({ value, onChange }: LeagueTargetLevelSliderProps) {
  const steps = useMemo(() => buildLeagueTargetLevelSteps(), []);
  const max = steps.length - 1;

  const index = useMemo(() => {
    const i = steps.findIndex((s) => s.value === value);
    return i >= 0 ? i : 0;
  }, [steps, value]);

  const selected = steps[index] ?? steps[0];

  const handlePrev = () => {
    if (index > 0) {
      onChange(steps[index - 1].value);
    }
  };

  const handleNext = () => {
    if (index < max) {
      onChange(steps[index + 1].value);
    }
  };

  return (
    <View className="w-full mt-4">
      <View className="items-center justify-center">
        <Text className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Seçilen hedef
        </Text>
        
        <View className="w-full flex-row items-center justify-between rounded-3xl border border-white/20 bg-[#001A4A]/10 dark:bg-[#001A4A]/30 p-4 py-8 px-6 shadow-sm">
          <TouchableOpacity onPress={handlePrev} disabled={index === 0} className="p-2 opacity-80 disabled:opacity-20 active:opacity-50">
             <ChevronLeft size={32} color="#00A3FF" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-3xl font-extrabold tracking-tight text-[#00A3FF] dark:text-cyan-400">
              {selected.label}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleNext} disabled={index === max} className="p-2 opacity-80 disabled:opacity-20 active:opacity-50">
             <ChevronRight size={32} color="#00A3FF" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-6 px-1">
        <View className="flex-row justify-between mb-2">
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            17 Kyu
          </Text>
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            1 Dan
          </Text>
        </View>
        <View className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
           <View 
             className="h-full bg-[#00A3FF] rounded-full" 
             style={{ width: `${(index / max) * 100}%` }} 
           />
        </View>
        <Text className="mt-4 text-center text-xs text-slate-500 dark:text-slate-500">
          Okları kullanarak hedefinizi seçin.
        </Text>
      </View>
    </View>
  );
}
