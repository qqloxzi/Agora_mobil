import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, TouchableOpacity, Platform, Switch } from 'react-native';
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
      className="flex-1 bg-neutral-50 dark:bg-dark-bg px-6"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      >
      <View className="mb-8">
        <Text className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-slate-100">Merhaba,</Text>
        <Text className="text-primary-blue dark:text-accent-blue text-3xl font-extrabold tracking-tight mb-2">
           {displayTitle}
        </Text>
        <Text className="text-neutral-500 dark:text-slate-400">{user.email}</Text>
      </View>

      <GrowthJourneyShowcase
         answers={{
           ...answers,
           target_league_level:
             profileFields.targetLeagueLevel || answers?.target_league_level || '',
         }}
         onUpdateClick={handleUpdateClick}
         variant="profilePage"
         gameStats={stats}
         profileFields={profileFields}
      />

      <AtolyeProgressChart progress={atolyeProgress} />

      <SettingsSection />

      <View className="mt-6 pt-6 border-t border-slate-200 dark:border-dark-border">
        <Pressable
          onPress={onSignOut}
          className="w-full rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 py-4 items-center active:opacity-80">
          <Text className="text-base font-semibold text-red-600 dark:text-red-400">Çıkış Yap</Text>
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
    <View className="mt-8 rounded-3xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-5">
      <View className="mb-5 flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[11px] font-extrabold uppercase tracking-widest text-primary-blue dark:text-accent-blue">
            Atölye İlerlemesi
          </Text>
          <Text className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Ders tamamlama grafiği
          </Text>
        </View>
        <Text className="text-sm font-bold text-slate-500 dark:text-slate-400">
          %{overallPct} · {totals.completed}/{totals.total}
        </Text>
      </View>

      {progress.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-slate-200 dark:border-dark-border px-4 py-6">
          <Text className="text-center text-sm text-slate-500 dark:text-slate-400">
            Henüz tamamlanmış Atölye dersi yok.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          {progress.map((item) => (
            <View key={item.id}>
              <View className="mb-1.5 flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  %{item.pct} · {item.completed}/{item.total}
                </Text>
              </View>
              <View className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <View
                  className="h-full rounded-full bg-primary-blue dark:bg-accent-blue"
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
    <View className="mt-8 rounded-3xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-5">
      {/* Başlık */}
      <Text className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-primary-blue dark:text-accent-blue">
        Uygulama
      </Text>
      <Text className="mb-5 text-xl font-extrabold text-slate-900 dark:text-slate-100">Ayarlar &amp; Tercihler</Text>

      {/* ─── Tema ─── */}
      <View className="mb-5">
        <View className="mb-3 flex-row items-center gap-2">
          <Ionicons name="color-palette-outline" size={16} color="#64748b" />
          <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Tema</Text>
        </View>

        {/* Segment butonlar */}
        <View
          className="flex-row rounded-2xl overflow-hidden"
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
                className="flex-1 items-center justify-center py-3 gap-1 active:opacity-80"
                style={{
                  backgroundColor: isActive ? '#1d4ed8' : 'transparent',
                  borderRightWidth: idx < THEME_OPTIONS.length - 1 ? 1 : 0,
                  borderRightColor: themeMode === 'dark' ? '#334155' : '#e2e8f0',
                }}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={18}
                  color={isActive ? '#ffffff' : '#64748b'}
                />
                <Text
                  className="text-xs font-bold"
                  style={{ color: isActive ? '#ffffff' : '#64748b' }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ─── Separator ─── */}
      <View className="mb-5 h-px bg-slate-100 dark:bg-slate-700" />

      {/* ─── Bildirimler ─── */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <View
            className="h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: notificationsEnabled ? '#eff6ff' : '#f8fafc' }}
          >
            <Ionicons
              name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'}
              size={18}
              color={notificationsEnabled ? '#1d4ed8' : '#94a3b8'}
            />
          </View>
          <View>
            <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Bildirimler</Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500">
              {notificationsEnabled ? 'Açık — push bildirimleri etkin' : 'Kapalı'}
            </Text>
          </View>
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


