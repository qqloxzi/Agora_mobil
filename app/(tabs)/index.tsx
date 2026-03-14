import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LIGLER = [
  { label: 'Temel Taşlar Ligi', slug: 'temel-taslar' },
  { label: 'Gelişim Ligi', slug: 'gelisim' },
  { label: 'Aydınlanma Ligi', slug: 'aydinlanma' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-[#F9FAFB]" // Daha temiz bir arka plan gri tonu
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 24,
      }}
      showsVerticalScrollIndicator={false}>
      
      {/* Hero Section */}
      <View className="mb-10 mt-4">
        <Text className="text-[34px] font-black text-gray-900 leading-[42px] mb-3">
          Çevrimiçi <Text className="text-blue-600">Go</Text>{"\n"}Eğitim Platformu
        </Text>
        <Text className="text-lg text-gray-500 font-medium leading-6">
          Stratejik derinliğinizi artırın.
        </Text>
      </View>

      {/* Duyuru Kartı (image_214e9c.png Referanslı) */}
      <View
        className="w-full rounded-[40px] bg-white p-8 mb-8"
        style={styles.cardShadow}>
        
        <View className="mb-6">
          <View className="self-start rounded-full bg-gray-100 px-4 py-1.5 mb-5">
            <Text className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              Yeni Sezon Duyurusu
            </Text>
          </View>
          <Text className="text-[26px] font-black text-gray-900 leading-8">
            2. Sezon 13 Nisan'da Başlıyor: Kayıtlar Açık!
          </Text>
        </View>

        {/* Lig Listesi (Temiz Liste Yapısı) — tıklanınca detay sayfasına gider */}
        <View className="mb-8">
          {LIGLER.map((lig, index) => (
            <Pressable
              key={lig.slug}
              onPress={() => router.push(`/course-detail/${lig.slug}`)}
              className={`flex-row items-center justify-between py-5 active:opacity-80 ${index !== LIGLER.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <Text className="text-[17px] font-bold text-gray-900">{lig.label}</Text>
              <View className="rounded-full bg-black px-4 py-2">
                <Text className="text-[11px] font-bold text-white">Kayıtlar Açık</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Ana Buton */}
        <Pressable
          onPress={() => router.push('/(tabs)/courses')}
          className="flex-row items-center justify-center gap-3 rounded-full bg-black py-5 active:opacity-90"
        >
          <Text className="text-lg font-bold text-white">Eğitim Programları</Text>
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 8,
  },
});