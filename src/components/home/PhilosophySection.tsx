import React from 'react';
import { View, Text } from 'react-native';

export function PhilosophySection() {
  return (
    <View className="py-20 px-8 bg-[#64748B] rounded-[40px] mb-12 shadow-md">
      <View className="items-center mb-8">
        <Text className="text-[10px] font-bold uppercase tracking-[3px] text-slate-200/70 mb-4">
          Manifesto
        </Text>
      </View>

      <Text className="text-[28px] font-light leading-snug text-slate-100 text-center mb-8">
        Kalıplaşmış eğitim anlayışının uzağında:{"\n"}
        <Text className="font-bold text-white">Ezber ve mutlak varsayımlar olmadan.</Text>
      </Text>

      <Text className="text-[32px] font-light leading-snug text-slate-200 text-center mb-12">
        Doğru veya yanlış yoktur:{"\n"}
        <Text className="font-medium text-white italic">
          Her hamle bir tercih ve aynı zamanda bir vazgeçiştir.
        </Text>
      </Text>

      <View className="self-center h-16 w-[1px] bg-slate-200/40" />
    </View>
  );
}
