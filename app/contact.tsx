import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openMail = () => Linking.openURL('mailto:info@agorago.com');

  return (
    <ScrollView
      className="flex-1 bg-ice-white"
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 18, paddingBottom: insets.bottom + 36 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center gap-3 mb-8">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100">
          <Ionicons name="arrow-back" size={18} color="#0a2540" />
        </Pressable>
        <Text className="text-2xl font-extrabold text-primary-blue">İletişim</Text>
      </View>

      <View className="bg-white rounded-3xl border border-gray-100 p-6">
        <Text className="text-3xl font-extrabold text-gray-900 mb-3">Agora ile iletişime geç</Text>
        <Text className="text-base leading-7 text-gray-600 mb-6">
          Dersler, atölyeler, ligler veya hesap süreçleri hakkında bize ulaşabilirsiniz.
        </Text>

        <Pressable onPress={openMail} className="bg-primary-blue rounded-2xl py-4 px-5 flex-row items-center justify-center gap-2">
          <Ionicons name="mail" size={18} color="#fff" />
          <Text className="text-white font-extrabold">info@agorago.com</Text>
        </Pressable>

        <View className="mt-6 gap-3">
          <InfoRow icon="school" title="Eğitim" text="Seviyene göre kurs ve atölye seçimi." />
          <InfoRow icon="trophy" title="Ligler" text="Fikstür ve lig katılım süreçleri." />
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View className="flex-row gap-3 rounded-2xl bg-gray-50 p-4">
      <Ionicons name={icon} size={20} color="#1d4ed8" />
      <View className="flex-1">
        <Text className="font-bold text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-500 mt-1">{text}</Text>
      </View>
    </View>
  );
}
