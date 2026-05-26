import React, { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const faqs = [
  {
    id: 'lig-seviyesi',
    question: 'Liglere katılmak için hangi seviyede olmalıyım?',
    answer: "Liglerimiz seviyelere göre ayrılmıştır. 17 Kyu'dan Dan seviyesine kadar her oyuncu için uygun bir ligimiz mevcuttur.",
  },
  {
    id: 'canli-ders-kayit',
    question: 'Canlı derslere sonradan erişebilir miyim?',
    answer: 'Derslerimiz Google Meet üzerinden canlı ve interaktif olarak yapılmaktadır. Ancak kaçırdığınız dersleri daha sonra izleyebilmeniz için kayıt altına alıp Youtube kanalımıza yüklüyoruz.',
  },
  {
    id: 'odeme-sistemi',
    question: 'Ödeme ve abonelik sistemi nasıl çalışıyor?',
    answer: '6 haftalık kurs planı ile çalışıyoruz. Dolayısıyla satın aldığınız hizmet 6 haftalık eğitim ve mentörlüğü kapsar.',
  },
  {
    id: 'oyun-analizi',
    question: 'Bireysel oyun analizleri nasıl yapılıyor?',
    answer: 'Her oyuncu o hafta oynadığı oyunun analizini eğitmenle birlikte belirlenen günde herkesle birlikte katılabilir.',
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <View className="py-12 bg-primary-blue rounded-3xl px-6 mb-10 overflow-hidden relative">
      <View className="mb-10">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">
          Soru işaretlerin kalmasın
        </Text>
        <Text className="text-3xl font-black text-white leading-tight mb-4">
          Sıkça sorulan sorular
        </Text>
        <Text className="text-[15px] font-medium text-white/80 leading-relaxed mb-6">
          En çok merak edilen konuları kısaca topladık. Daha fazlası için her zaman bizimle iletişime geçebilirsin.
        </Text>
      </View>

      <View className="bg-black/15 rounded-2xl border border-white/20 overflow-hidden">
        {faqs.map((item, index) => {
          const isOpen = openId === item.id;
          return (
            <View
              key={item.id}
              className={`${index > 0 ? 'border-t border-white/10' : ''}`}
            >
              <Pressable
                onPress={() => toggle(item.id)}
                className="flex-row items-center justify-between p-5"
              >
                <Text className="flex-1 text-[15px] font-bold text-white mr-4">
                  {item.question}
                </Text>
                <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center border border-white/20">
                  <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="white" />
                </View>
              </Pressable>
              
              {isOpen && (
                <View className="px-5 pb-5 pt-0">
                  <Text className="text-[14px] leading-relaxed text-white/80">
                    {item.answer}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
