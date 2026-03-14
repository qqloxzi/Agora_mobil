import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCourseBySlug, getKyuRangeLabel, parseOutcomes, formatDateRange } from '../../src/lib/courses';
import type { CourseDetail } from '../../src/types/course';

function OutcomeItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 mb-3" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
      <View className="w-6 h-6 rounded-full bg-emerald-100 items-center justify-center">
        <Ionicons name="checkmark" size={16} color="#059669" />
      </View>
      <Text className="flex-1 text-gray-800 text-base font-medium">{text}</Text>
    </View>
  );
}

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Kurs bulunamadı.');
      setLoading(false);
      return;
    }
    getCourseBySlug(slug).then(({ data, error: err }) => {
      setLoading(false);
      if (err) setError(err.message);
      else setCourse(data ?? null);
    });
  }, [slug]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="mt-3 text-gray-500">Lig bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-6">
        <Text className="text-red-500 text-center mb-4">{error ?? 'Lig bulunamadı.'}</Text>
        <Pressable onPress={() => router.back()} className="bg-gray-800 rounded-lg px-6 py-3">
          <Text className="text-white font-semibold">Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  const kyuLabel = getKyuRangeLabel(course.level);
  const outcomes = parseOutcomes(course.outcomes);
  const providerName = course.provider || 'Agora Academy';
  const avatarUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName)}&background=1e3a5f&color=fff&size=128&bold=true`;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}>
      {/* Üst: Lig Detayı başlığı + geri butonu */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200 bg-white" style={{ paddingTop: insets.top + 12 }}>
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2 py-2">
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
          <Text className="text-gray-600 font-medium">Geri</Text>
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Lig Detayı</Text>
        <View style={{ width: 80 }} />
      </View>

      <View className="px-4 pt-6">
        {/* Kurs adı + sarı badge (seviye aralığı) */}
        <View className="flex-row flex-wrap items-center gap-2 mb-4">
          <Text className="text-2xl font-extrabold text-gray-900 flex-1">{course.title}</Text>
          <View className="rounded-full bg-amber-100 border border-amber-200 px-3 py-1.5">
            <Text className="text-xs font-bold text-amber-800">{kyuLabel}</Text>
          </View>
        </View>

        {course.description ? (
          <Text className="text-gray-600 leading-relaxed mb-6">{course.description}</Text>
        ) : null}

        {/* Bilgi kartları: Eğitmen + Tarih aralığı */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="flex-row items-center gap-3 flex-1 min-w-[140] p-3 rounded-xl bg-gray-100 border border-gray-200">
            <Image source={{ uri: avatarUri }} className="w-10 h-10 rounded-full bg-gray-200" />
            <View>
              <Text className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Eğitmen</Text>
              <Text className="font-bold text-gray-900">{providerName}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3 flex-1 min-w-[140] p-3 rounded-xl bg-blue-50 border border-blue-100">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
              <Ionicons name="calendar-outline" size={20} color="#1d4ed8" />
            </View>
            <View>
              <Text className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Tarih Aralığı</Text>
              <Text className="font-bold text-gray-900">{formatDateRange(course.course_start, course.course_end)}</Text>
            </View>
          </View>
        </View>

        {/* CTA: Kayıt Ol */}
        <Pressable
          onPress={() => {
            const link = course.shopier_link;
            if (link) {
              Linking.openURL(link).catch(() => Alert.alert('Hata', 'Kayıt sayfası açılamadı.'));
            } else {
              Alert.alert('Bilgi', 'Kayıt için lütfen giriş yapın veya bizimle iletişime geçin.');
            }
          }}
          className="w-full rounded-xl py-4 items-center mb-6 active:opacity-90"
          style={{ backgroundColor: '#1e3a5f' }}>
          <Text className="text-base font-bold text-white">Kayıt Ol</Text>
        </Pressable>

        {/* Özet barı: Eğitmen, Kayıt Durumu, Seviye, Toplam Saat */}
        <View className="flex-row flex-wrap justify-between gap-2 py-4 px-4 rounded-xl bg-white border border-gray-200 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
          <View className="items-center min-w-[70]">
            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">Eğitmen</Text>
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{providerName}</Text>
          </View>
          <View className="items-center min-w-[70]">
            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">Kayıt Durumu</Text>
            <Text className="text-sm font-semibold text-gray-900">{course.status || 'Kayıtlar Açık'}</Text>
          </View>
          <View className="items-center min-w-[70]">
            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">Seviye</Text>
            <Text className="text-sm font-semibold text-gray-900">{course.level || '—'}</Text>
          </View>
          <View className="items-center min-w-[70]">
            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">Toplam Saat</Text>
            <Text className="text-sm font-semibold text-gray-900">{course.duration || 'Esnek'}</Text>
          </View>
        </View>

        {/* Kazanımlar */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Kazanımlar</Text>
        {outcomes.length > 0 ? (
          outcomes.map((item, i) => <OutcomeItem key={i} text={item} />)
        ) : (
          <Text className="text-gray-500 italic py-4">Detaylı kazanım bilgisi eklenmemiş.</Text>
        )}
      </View>
    </ScrollView>
  );
}
