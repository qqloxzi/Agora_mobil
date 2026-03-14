import React from 'react';
import { View, Text } from 'react-native';

export default function SkillTreeScreen() {
  return (
    <View className="flex-1 bg-neutral-50 px-4 pt-16">
      <Text className="text-2xl font-bold text-neutral-800 mb-2">Skill Tree</Text>
      <Text className="text-neutral-500">
        Burada Supabase'ten aldığımız kurs ve problem verileriyle etkileşimli bir yetenek ağacı
        göstereceğiz. Şimdilik placeholder.
      </Text>
    </View>
  );
}

