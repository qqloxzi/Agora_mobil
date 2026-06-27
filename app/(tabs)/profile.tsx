import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { useOnboarding } from '../../src/context/OnboardingContext';
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
  const [stats, setStats] = useState<{ xp?: number | null; rank?: string | null }>({});
  const [atolyeProgress, setAtolyeProgress] = useState<AtolyeProgressSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadStats() {
      setLoadingStats(true);
      const [r1, r2] = await Promise.all([
        supabase.from('profiles').select('xp').eq('id', user!.id).maybeSingle(),
        supabase.from('agorasusers').select('xp, rank').eq('id', user!.id).maybeSingle()
      ]);

      if (cancelled) return;

      const pXp = r1.data?.xp;
      const aXp = r2.data?.xp;
      const aRank = r2.data?.rank;

      const mergedXp = typeof pXp === 'number' ? pXp : (typeof aXp === 'number' ? aXp : null);
      const mergedRank = typeof aRank === 'string' ? aRank : null;

      setStats({ xp: mergedXp, rank: mergedRank });

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

  // Oturum açmamış
  if (!user) {
    return (
      <View
        className="flex-1 bg-neutral-50  px-6"
        style={{ paddingTop: insets.top + 24 }}>
        <Text className="text-3xl font-bold tracking-tight text-neutral-900  mb-2">Profilim</Text>
        <Text className="text-neutral-500  mb-8">
          İlerlemenizi kaydetmek, gelişiminizi görmek ve özel anketinizi tamamlamak için giriş yapın.
        </Text>
        
        <Pressable
          onPress={() => router.push('/(auth)')}
          className="w-full flex-row items-center justify-center gap-2 rounded-2xl border border-neutral-200  bg-white  py-4 active:opacity-80 mb-4">
          <Ionicons name="logo-google" size={20} color="#3b82f6" />
          <Text className="text-base font-semibold text-neutral-800 ">Google ile Devam Et</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(auth)')}
          className="w-full rounded-2xl bg-neutral-900  py-4 items-center active:opacity-80">
          <Text className="text-base font-semibold text-white ">E-posta ile Giriş Yap</Text>
        </Pressable>
      </View>
    );
  }

  // Oturum açmış ama anketi tamamlamamış
  if (!hasCompletedOnboarding) {
     return (
        <View
          className="flex-1 bg-neutral-50  px-6"
          style={{ paddingTop: insets.top + 24 }}>
          <Text className="text-3xl font-bold tracking-tight text-neutral-900  mb-2">Kurulum</Text>
          <Text className="text-neutral-500  mb-8">
            Profilinizi ve gelişim planınızı oluşturmak için başlangıç anketini tamamlayın.
          </Text>
          <View className="rounded-3xl border border-primary-blue/20 bg-primary-blue/5 p-6 mb-8 items-center text-center">
             <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-blue/20 mb-4">
                <Sparkles size={32} color="#0ea5e9" />
             </View>
             <Text className="text-lg font-bold text-slate-900  text-center mb-2">Başlangıç Anketi</Text>
             <Text className="text-sm text-slate-500  text-center mb-6">
                Size uygun içerik ve seviyeyi belirlememiz için bu kısa anketi tamamlamanız gerekiyor. Sadece 1 dakikanızı alacak.
             </Text>
             <TouchableOpacity
               onPress={() => router.push('/onboarding')}
               className="w-full rounded-2xl bg-primary-blue py-4 items-center mt-2 focus:opacity-80 active:opacity-80">
               <Text className="text-base font-bold text-white uppercase tracking-wider">Hemen Başla</Text>
             </TouchableOpacity>
          </View>
          <View className="flex-1 justify-end pb-8">
            <Pressable
              onPress={onSignOut}
              className="w-full rounded-2xl border border-red-200  bg-red-50  py-4 items-center active:opacity-80">
              <Text className="text-base font-semibold text-red-600 ">Çıkış Yap</Text>
            </Pressable>
          </View>
        </View>
     );
  }

  // Oturum açmış ve anket tamamlanmış
  return (
    <ScrollView
      className="flex-1 bg-neutral-50  px-6"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      >
      <View className="mb-8">
        <Text className="text-3xl font-bold tracking-tight text-neutral-900 ">Merhaba,</Text>
        <Text className="text-primary-blue text-3xl font-extrabold tracking-tight mb-2">
           {answers?.preferredName || user.email?.split('@')[0]}
        </Text>
        <Text className="text-neutral-500 ">{user.email}</Text>
      </View>

      <GrowthJourneyShowcase
         answers={answers}
         onUpdateClick={handleUpdateClick}
         variant="profilePage"
         gameStats={stats}
      />

      <AtolyeProgressChart progress={atolyeProgress} />

      <View className="mt-8 pt-8 border-t border-slate-200 ">
        <Pressable
          onPress={onSignOut}
          className="w-full rounded-2xl border border-red-200  bg-red-50  py-4 items-center active:opacity-80">
          <Text className="text-base font-semibold text-red-600 ">Çıkış Yap</Text>
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
    <View className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">
      <View className="mb-5 flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[11px] font-extrabold uppercase tracking-widest text-primary-blue">
            Atölye İlerlemesi
          </Text>
          <Text className="mt-1 text-xl font-extrabold text-slate-900">
            Ders tamamlama grafiği
          </Text>
        </View>
        <Text className="text-sm font-bold text-slate-500">
          %{overallPct} · {totals.completed}/{totals.total}
        </Text>
      </View>

      {progress.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-slate-200 px-4 py-6">
          <Text className="text-center text-sm text-slate-500">
            Henüz tamamlanmış Atölye dersi yok.
          </Text>
        </View>
      ) : (
        <View className="gap-4">
          {progress.map((item) => (
            <View key={item.id}>
              <View className="mb-1.5 flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-sm font-bold text-slate-700" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-xs font-bold text-slate-500">
                  %{item.pct} · {item.completed}/{item.total}
                </Text>
              </View>
              <View className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <View
                  className="h-full rounded-full bg-primary-blue"
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
