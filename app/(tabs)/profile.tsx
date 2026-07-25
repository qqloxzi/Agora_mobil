import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Switch,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { useSettings, type ThemeMode } from '../../src/context/SettingsContext';
import { GrowthJourneyShowcase } from '../../src/components/Profile/GrowthJourneyShowcase';
import { Sparkles } from 'lucide-react-native';
import {
  fetchCurriculum,
  flattenLessons,
  type Course,
} from '../../src/lib/education/fetchCurriculum';
import {
  fetchAtolyeProgressRows,
  type AtolyeProgressRow,
} from '../../src/lib/education/progressStorage';
import {
  extractProfileDisplayFields,
  fetchProfileOnboarding,
} from '../../src/lib/profileOnboarding';
import { signInWithGoogle } from '../../src/lib/googleSignIn';

type ProfileFields = {
  preferredName: string | null;
  targetLeagueLevel: string | null;
  xp: number | null;
};

type AtolyeProgressSummary = {
  id: string;
  title: string;
  completed: number;
  total: number;
  pct: number;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const {
    isInitialized,
    hasCompletedOnboarding,
    answers,
    enterEditModeUi,
    resetOnboarding
  } = useOnboarding();

  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<{ xp?: number | null; rank?: string | null; username?: string | null }>({});
  const [profileFields, setProfileFields] = useState<ProfileFields>({
    preferredName: null,
    targetLeagueLevel: null,
    xp: null,
  });
  const [atolyeProgress, setAtolyeProgress] = useState<AtolyeProgressSummary[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadStats() {
      setLoadingStats(true);
      const [{ data: profRow }, agResult] = await Promise.all([
        fetchProfileOnboarding(supabase, user!.id),
        supabase.from('agorasusers').select('username, xp, rank').eq('id', user!.id).maybeSingle(),
      ]);

      if (cancelled) return;

      const profileSnapshot = extractProfileDisplayFields(profRow);
      setProfileFields(profileSnapshot);

      const aXp = agResult.data?.xp;
      const aRank = agResult.data?.rank;
      const aUsername =
        typeof agResult.data?.username === 'string' ? agResult.data.username.trim() : '';

      const mergedXp =
        profileSnapshot.xp != null
          ? profileSnapshot.xp
          : typeof aXp === 'number'
            ? aXp
            : null;
      const mergedRank = typeof aRank === 'string' ? aRank : null;

      setStats({ xp: mergedXp, rank: mergedRank, username: aUsername || null });

      const [{ courses }, progressRows] = await Promise.all([
        fetchCurriculum(),
        fetchAtolyeProgressRows(user!.id),
      ]);
      if (!cancelled) {
        setAtolyeProgress(buildAtolyeProgressSummary(courses, progressRows));
      }
      setLoadingStats(false);
    }
    
    loadStats();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
       loadStats();
    });
    
    return () => {
       cancelled = true;
       subscription.unsubscribe();
    };
  }, [user]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    resetOnboarding();
  };

  const handleUpdateClick = () => {
    enterEditModeUi();
    router.push({ pathname: '/onboarding', params: { edit: '1' } });
  };

  if (!isInitialized) {
     return (
       <View className="flex-1 bg-neutral-50  items-center justify-center">
         <ActivityIndicator size="large" color="#0ea5e9" />
       </View>
     );
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      if (Platform.OS !== 'web') {
        setGoogleLoading(false);
      }
    }
  };

  // Oturum açmamış
  if (!user) {
    return (
      <View
        className="flex-1 bg-neutral-50 dark:bg-dark-bg px-6"
        style={{ paddingTop: insets.top + 24 }}>
        <Text className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-slate-100 mb-2">Profilim</Text>
        <Text className="text-neutral-500 dark:text-slate-400 mb-8">
          İlerlemenizi kaydetmek, gelişiminizi görmek ve özel anketinizi tamamlamak için giriş yapın.
        </Text>
        
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex-row items-center justify-center gap-2 rounded-2xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-card py-4 active:opacity-80 mb-4">
          {googleLoading ? (
            <ActivityIndicator color="#3b82f6" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#3b82f6" />
              <Text className="text-base font-semibold text-neutral-800 dark:text-slate-100">Google ile Devam Et</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => router.push('/(auth)')}
          className="w-full rounded-2xl bg-neutral-900 dark:bg-accent-blue py-4 items-center active:opacity-80">
          <Text className="text-base font-semibold text-white">E-posta ile Giriş Yap</Text>
        </Pressable>
      </View>
    );
  }

  // Oturum açmış ama anketi tamamlamamış
  if (!hasCompletedOnboarding) {
     return (
        <View
          className="flex-1 bg-neutral-50 dark:bg-dark-bg px-6"
          style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-slate-100 mb-2">Kurulum</Text>
          <Text className="text-neutral-500 dark:text-slate-400 mb-8">
            Profilinizi ve gelişim planınızı oluşturmak için başlangıç anketini tamamlayın.
          </Text>
          <View className="rounded-3xl border border-primary-blue/20 dark:border-accent-blue/30 bg-primary-blue/5 dark:bg-accent-blue/10 p-6 mb-8 items-center">
             <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-blue/20 dark:bg-accent-blue/20 mb-4">
                <Sparkles size={32} color="#0ea5e9" />
             </View>
             <Text className="text-lg font-bold text-slate-900 dark:text-slate-100 text-center mb-2">Başlangıç Anketi</Text>
             <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                Size uygun içerik ve seviyeyi belirlememiz için bu kısa anketi tamamlamanız gerekiyor. Sadece 1 dakikanızı alacak.
             </Text>
             <TouchableOpacity
               onPress={() => router.push('/onboarding')}
               className="w-full rounded-2xl bg-primary-blue dark:bg-accent-blue py-4 items-center mt-2 active:opacity-80">
               <Text className="text-base font-bold text-white uppercase tracking-wider">Hemen Başla</Text>
             </TouchableOpacity>
          </View>
          <View className="flex-1 justify-end pb-8">
            <Pressable
              onPress={onSignOut}
              className="w-full rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 py-4 items-center active:opacity-80">
              <Text className="text-base font-semibold text-red-600 dark:text-red-400">Çıkış Yap</Text>
            </Pressable>
          </View>
        </View>
     );
  }

  const preferredName = answers?.preferredName != null ? String(answers.preferredName).trim() : '';
  const displayTitle =
    profileFields.preferredName || preferredName || stats.username || user.email?.split('@')[0] || 'Oyuncu';

  // Oturum açmış ve anket tamamlanmış
  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-dark-bg px-5"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Compact Header ── */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-full bg-accent-blue items-center justify-center">
            <Text className="text-white font-bold text-base">
              {(displayTitle?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-base font-bold text-slate-900 dark:text-slate-100" numberOfLines={1}>
              {displayTitle}
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500" numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleUpdateClick}
          className="rounded-full border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-1.5 active:opacity-70"
        >
          <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">Düzenle</Text>
        </Pressable>
      </View>

      {/* ── Gelişim Özeti ── */}
      <GrowthJourneyShowcase
        answers={{
          ...answers,
          target_league_level:
            profileFields.targetLeagueLevel || answers?.target_league_level || '',
        }}
        variant="profilePage"
        gameStats={stats}
        profileFields={profileFields}
      />

      {/* ── Atölye Progress ── */}
      <AtolyeProgressChart progress={atolyeProgress} />

      {/* ── Settings ── */}
      <SettingsSection />

      {/* ── Planlar ── */}
      <PlansSection />

      {/* ── Sign Out ── */}
      <View className="mt-4">
        <Pressable
          onPress={onSignOut}
          className="w-full rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 py-3 items-center active:opacity-80"
        >
          <Text className="text-sm font-semibold text-red-500 dark:text-red-400">Çıkış Yap</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function buildAtolyeProgressSummary(
  courses: Course[],
  progressRows: AtolyeProgressRow[]
): AtolyeProgressSummary[] {
  const completedLessonIds = new Set(progressRows.map((row) => String(row.lesson_id)));

  return courses
    .map((course) => {
      const lessons = flattenLessons([course]);
      const total = lessons.length;
      const completed = lessons.filter((lesson) => completedLessonIds.has(String(lesson.id))).length;

      return {
        id: course.id,
        title: course.title,
        completed,
        total,
        pct: total ? Math.round((completed / total) * 100) : 0,
      };
    })
    .filter((item) => item.total > 0);
}

function AtolyeProgressChart({ progress }: { progress: AtolyeProgressSummary[] }) {
  const totals = progress.reduce(
    (acc, item) => ({
      completed: acc.completed + item.completed,
      total: acc.total + item.total,
    }),
    { completed: 0, total: 0 }
  );
  const overallPct = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;

  return (
    <View className="mt-3 rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[10px] font-extrabold uppercase tracking-widest text-accent-blue">Atölye</Text>
        <Text className="text-[10px] font-bold text-slate-400">
          %{overallPct} · {totals.completed}/{totals.total}
        </Text>
      </View>

      {progress.length === 0 ? (
        <Text className="text-xs text-center text-slate-400 py-3">
          Henüz tamamlanmış ders yok.
        </Text>
      ) : (
        <View className="gap-2.5">
          {progress.map((item) => (
            <View key={item.id}>
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-[10px] font-bold text-slate-400 ml-2">%{item.pct}</Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <View
                  className="h-full rounded-full bg-accent-blue"
                  style={{ width: `${Math.max(item.pct, item.completed > 0 ? 4 : 0)}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function SettingsSection() {
  const { themeMode, notificationsEnabled, setThemeMode, setNotificationsEnabled } = useSettings();

  const THEME_OPTIONS: { label: string; value: ThemeMode; icon: string }[] = [
    { label: 'Açık', value: 'light', icon: 'sunny-outline' },
    { label: 'Koyu', value: 'dark', icon: 'moon-outline' },
    { label: 'Sistem', value: 'system', icon: 'phone-portrait-outline' },
  ];

  return (
    <View className="mt-3 rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4">
      {/* Header */}
      <Text className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-accent-blue">Ayarlar</Text>

      {/* Tema segment */}
      <View
        className="flex-row rounded-xl overflow-hidden mb-3"
        style={{
          backgroundColor: themeMode === 'dark' ? '#1e293b' : '#f1f5f9',
          borderWidth: 1,
          borderColor: themeMode === 'dark' ? '#334155' : '#e2e8f0',
        }}
      >
        {THEME_OPTIONS.map((opt, idx) => {
          const isActive = themeMode === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setThemeMode(opt.value)}
              className="flex-1 items-center justify-center py-2.5 gap-0.5 active:opacity-80"
              style={{
                backgroundColor: isActive ? '#1d4ed8' : 'transparent',
                borderRightWidth: idx < THEME_OPTIONS.length - 1 ? 1 : 0,
                borderRightColor: themeMode === 'dark' ? '#334155' : '#e2e8f0',
              }}
            >
              <Ionicons name={opt.icon as any} size={15} color={isActive ? '#ffffff' : '#64748b'} />
              <Text className="text-[10px] font-bold" style={{ color: isActive ? '#ffffff' : '#64748b' }}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Bildirimler */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons
            name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'}
            size={16}
            color={notificationsEnabled ? '#1d4ed8' : '#94a3b8'}
          />
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bildirimler</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
          thumbColor={notificationsEnabled ? '#1d4ed8' : '#94a3b8'}
        />
      </View>
    </View>
  );
}

const PLANS = [
  {
    id: 'yalnizca-atolyeler',
    name: 'Yalnızca atölyeler',
    level: 'Tek seferlik erişim',
    features: [
      'Tüm atölye içeriklerine tek seferlik erişim',
      'Kendi hızında ilerleme ve tahta üzeri alıştırmalar',
      'Problem çözümü ve kısa ders metinleri',
      'Lig ve mentörlük dahil değil',
    ],
  },
  {
    id: 'temel-taslar',
    name: 'Temel Taşlar',
    level: '17–12 Kyu · 6 haftalık paket',
    features: [
      'Atölye içeriklerine erişim',
      '6 haftalık Temel Taşlar ligi (17–12 kyu)',
      'Seviyeye özel teori dersleri',
      'Haftalık oyun analizi',
      'Başlangıç seviyesinde mentörlük desteği',
    ],
  },
  {
    id: 'gelisim',
    name: 'Gelişim',
    level: '11–6 Kyu · 6 haftalık paket',
    features: [
      'Atölye içeriklerine erişim',
      '6 haftalık Gelişim ligi (11–6 kyu)',
      'Orta seviye strateji ve teknik dersleri',
      'Haftalık bireysel oyun analizi',
      'Canlı ders kayıtlarına erişim',
      'Düzenli mentörlük ve geri bildirim',
    ],
  },
  {
    id: 'aydinlanma',
    name: 'Aydınlanma',
    level: '5–1 Kyu · 6 haftalık paket',
    features: [
      'Atölye içeriklerine tam erişim',
      '6 haftalık Aydınlanma ligi (5–1 kyu)',
      'İleri seviye teori ve derinlemesine incelemeler',
      'Haftalık detaylı oyun analizi',
      'Canlı dersler ve kayıt arşivi',
      'Öncelikli mentörlük ve kişisel gelişim planı',
    ],
  },
] as const;

function PlansSection() {
  const [pageWidth, setPageWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(Math.max(0, Math.min(index, PLANS.length - 1)));
  };

  return (
    <View className="mt-3 rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4">
      <Text className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-accent-blue">
        Planlar
      </Text>

      <View
        onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
        className="overflow-hidden"
      >
        {pageWidth > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
          >
            {PLANS.map((plan) => (
              <View key={plan.id} style={{ width: pageWidth }} className="pr-0">
                <View className="flex-row items-start justify-between gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {plan.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {plan.level}
                    </Text>
                  </View>
                  <View className="rounded-full border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 px-3 py-1.5">
                    <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Satın al
                    </Text>
                  </View>
                </View>

                <View className="gap-2">
                  {plan.features.map((feature) => (
                    <View key={feature} className="flex-row items-start gap-2">
                      <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-blue" />
                      <Text className="flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View className="mt-4 flex-row items-center justify-center gap-1.5">
        {PLANS.map((plan, index) => (
          <View
            key={plan.id}
            className={`h-1.5 rounded-full ${
              index === activeIndex ? 'w-4 bg-accent-blue' : 'w-1.5 bg-slate-200 dark:bg-slate-600'
            }`}
          />
        ))}
      </View>
    </View>
  );
}


