import React from 'react';
import { View, Text, ScrollView } from 'react-native';

const CARDS = [
  {
    title: '6 Haftalık Ligler',
    description: 'Lig sistemimizde 8 kişilik özel gruplarda kendi seviyenizdeki oyuncularla eşleşebilir ve düzenli maçlar yapabilirsiniz.',
    id: '1'
  },
  {
    title: 'Derinlemesine İncelemeler',
    description: 'Her seviye aralığındaki temel teknikler ve stratejiler anlatılır.',
    id: '2'
  },
  {
    title: 'Haftalık Analiz',
    description: 'Her hafta oynadığınız oyunların analizleri yapılır ve her oyuncuya özel öneriler yapılır.',
    id: '3'
  }
];

export function FeaturesSection() {
  return (
    <View className="py-16 px-6 bg-ice-white rounded-3xl mb-8">
      <View className="mb-8 border-b border-accent-blue/20 pb-6">
        <Text className="text-[10px] font-bold tracking-widest text-accent-blue uppercase mb-2">
          Eğitim Dokuları
        </Text>
        <Text className="text-3xl font-black text-ink leading-tight">
          İnteraktif Eğitim{"\n"}
          <Text className="font-normal italic text-accent-blue">Peki nasıl?</Text>
        </Text>
      </View>

      <View className="gap-6">
        {CARDS.map((card) => (
          <View 
            key={card.id} 
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden"
          >
            {/* Visual Placeholder inspired by web animations */}
            <View className="h-32 w-full bg-slate-50 items-center justify-center rounded-2xl mb-6 border border-slate-100">
               <Text className="text-xl font-bold text-slate-300">{card.title} Görsel</Text>
            </View>

            <Text className="text-2xl font-black text-ink mb-2">{card.title}</Text>
            <Text className="text-[15px] font-medium text-slate-500 leading-relaxed">
              {card.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
