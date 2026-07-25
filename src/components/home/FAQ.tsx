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
    <View className="py-6 px-4 mb-4">
      <View className="mb-4">
        <Text className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
          Soru işaretlerin kalmasın
        </Text>
        <Text className="text-lg font-extrabold text-primary-blue dark:text-slate-100 leading-tight">
          Sıkça sorulan sorular
        </Text>
      </View>

      <View className="overflow-hidden rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card">
        {faqs.map((item, index) => {
          const isOpen = openId === item.id;
          return (
            <View
              key={item.id}
              className={`${index > 0 ? 'border-t border-slate-100 dark:border-dark-border' : ''}`}
            >
              <Pressable
                onPress={() => toggle(item.id)}
                className="flex-row items-center justify-between px-3.5 py-3"
              >
                <Text className="flex-1 text-[13px] font-semibold text-slate-700 dark:text-slate-200 mr-3">
                  {item.question}
                </Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#94a3b8"
                />
              </Pressable>

              {isOpen && (
                <View className="px-3.5 pb-3 pt-0">
                  <Text className="text-[12px] leading-5 text-slate-500 dark:text-slate-400">
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
