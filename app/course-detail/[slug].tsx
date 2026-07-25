import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getCourseBySlug,
  getKyuRangeLabel,
  parseOutcomes,
  formatDateRange,
} from '../../src/lib/courses';
import type { CourseDetail } from '../../src/types/course';
import {
  CourseDetailHeader,
  CourseDetailHero,
  CourseMetaTile,
  CourseSummaryBar,
  CourseSectionTitle,
  CourseOutcomeItem,
  CoursePrimaryCta,
  COURSE_BRAND,
  courseCardLayout,
  getLevelBandMeta,
  levelBandFromLevel,
} from '../../src/components/courses';

export default function CourseDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { padding } = courseCardLayout(width);

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
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <ActivityIndicator size="large" color={COURSE_BRAND.accent} />
        <Text className="mt-3 text-slate-500 dark:text-slate-400">Aşama bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6 dark:bg-dark-bg">
        <Text className="mb-4 text-center text-red-500">{error ?? 'Lig bulunamadı.'}</Text>
        <CoursePrimaryCta title="Geri Dön" onPress={() => router.back()} />
      </View>
    );
  }

  const band = levelBandFromLevel(course.level);
  const meta = getLevelBandMeta(band, course.level);
  const kyuLabel = getKyuRangeLabel(course.level);
  const outcomes = parseOutcomes(course.outcomes);
  const providerName = course.provider || 'Agora Academy';

  return (
    <View className="flex-1 bg-gray-50 dark:bg-dark-bg">
      <CourseDetailHeader topInset={insets.top} onBack={() => router.back()} title="Aşama Detayı" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: padding }} className="pt-5">
          <CourseDetailHero
            title={course.title}
            description={course.description}
            levelBand={band}
            level={course.level}
            stage={meta.stage}
          />

          <View className="mb-5 mt-6 flex-row flex-wrap gap-3">
            <CourseMetaTile label="Eğitmen" value={providerName} icon="person-outline" />
            <CourseMetaTile
              label="Tarih Aralığı"
              value={formatDateRange(course.course_start, course.course_end)}
              icon="calendar-outline"
              accent
            />
          </View>

          <View className="mb-6">
            <CoursePrimaryCta
              title="Yola Gir · Kayıt Ol"
              onPress={() => {
                const link = course.shopier_link;
                if (link) {
                  Linking.openURL(link).catch(() =>
                    Alert.alert('Hata', 'Kayıt sayfası açılamadı.')
                  );
                } else {
                  Alert.alert(
                    'Bilgi',
                    'Kayıt için lütfen giriş yapın veya bizimle iletişime geçin.'
                  );
                }
              }}
            />
          </View>

          <View className="mb-6">
            <CourseSummaryBar
              items={[
                { label: 'Eğitmen', value: providerName },
                { label: 'Durum', value: course.status || 'Kayıtlar Açık' },
                { label: 'Seviye', value: meta.seviyeLabel },
                { label: 'Lig', value: course.level || kyuLabel },
                { label: 'Süre', value: course.duration || 'Esnek' },
              ]}
            />
          </View>

          <CourseSectionTitle>Kazanımlar · Hedefler</CourseSectionTitle>
          {outcomes.length > 0 ? (
            outcomes.map((item, i) => (
              <CourseOutcomeItem key={`${i}-${item.slice(0, 24)}`} text={item} index={i} />
            ))
          ) : (
            <Text className="py-4 italic text-slate-500 dark:text-slate-400">
              Detaylı kazanım bilgisi eklenmemiş.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
