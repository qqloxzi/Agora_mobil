import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PROTOCOLS = [
  {
    step: "01",
    title: "Teori",
    desc: "3 Lig için her hafta odaklanılan başka bir konu başlığı.",
    details: "6 haftalık eğitimimiz, seviyenize özel oyun görüşü ve temel teknikleri kazandırır. Bu aşamadan sonra asıl yolculuk, öğrendiklerinizi tahtada kendi özgür seçimlerinize dönüştürmekle başlar.",
    iconName: "book" as const
  },
  {
    step: "02",
    title: "Pratik",
    desc: "Özel liglerde rekabet.",
    details: "Gerçek öğrenme pratikte yapılan hamlelerin farkındalığı ile başlar. Çünkü tahtaya konan her taş, kalıplaşmış doğruları değil; sizin düşünce yapınızı, seçimlerinizi ve vazgeçtiklerinizi yansıtır.",
    iconName: "game-controller" as const
  },
  {
    step: "03",
    title: "Analiz",
    desc: "Haftalık özel analizler.",
    details: "Hamlelerin arkasındaki düşünce sürecini, tahtaya olan etkilerini ve oyununuzu nasıl ileri taşıyacağınızı birlikte analiz ediyoruz.",
    iconName: "analytics" as const
  }
];

export function ProtocolSection() {
  return (
    <View className="py-16 bg-ice-white dark:bg-dark-bg">
      <View className="mb-12 items-center px-6">
        <Text className="text-4xl font-black tracking-tight text-ink dark:text-slate-100 mb-2">
          Yol Haritası
        </Text>
        <Text className="text-lg font-medium text-ink/70 dark:text-slate-400">Adım adım...</Text>
      </View>

      <View className="px-6 gap-8">
        {PROTOCOLS.map((protocol) => (
          <View
            key={protocol.step}
            className="rounded-[32px] bg-white dark:bg-dark-card p-6 shadow-sm border border-slate-100 dark:border-dark-border"
          >
            <View className="flex-row items-center gap-4 mb-6 pb-4 border-b border-accent-blue/10 dark:border-accent-blue/20">
              <Text className="text-xl font-bold text-accent-blue">{protocol.step}</Text>
              <View className="w-10 h-10 rounded-full bg-primary-blue dark:bg-accent-blue items-center justify-center">
                <Ionicons name={protocol.iconName} size={20} color="white" />
              </View>
            </View>

            <Text className="text-3xl font-black text-ink dark:text-slate-100 mb-2">{protocol.title}</Text>
            <Text className="text-[16px] font-bold text-ink/80 dark:text-slate-300 mb-6">{protocol.desc}</Text>

            <View className="rounded-2xl bg-primary-blue/5 dark:bg-accent-blue/10 p-5 border border-primary-blue/10 dark:border-accent-blue/20">
              <Text className="text-[14px] leading-relaxed text-ink/70 dark:text-slate-400">
                {protocol.details}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
