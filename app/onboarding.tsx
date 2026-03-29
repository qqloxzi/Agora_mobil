import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOnboarding, OnboardingAnswers } from '../src/context/OnboardingContext';
import { QuestionCard } from '../src/components/Onboarding/QuestionCard';
import { ProgressIndicator } from '../src/components/Onboarding/ProgressIndicator';
import { fetchProfileOnboarding, mapProfileRowToAnswers } from '../src/lib/profileOnboarding';
import { supabase } from '../src/lib/supabase';

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditMode = params.edit === '1';

  const {
    questions,
    currentStep,
    totalSteps,
    status,
    answers,
    saveError,
    pickSingle,
    toggleMulti,
    confirmMulti,
    setAnswerField,
    confirmTextStep,
    confirmTargetLeagueStep,
    clearSaveError,
    hydrateForEdit,
    enterEditModeUi,
    completedAt,
    isInitialized
  } = useOnboarding();

  useEffect(() => {
    if (isEditMode && isInitialized) enterEditModeUi();
  }, [isEditMode, enterEditModeUi, isInitialized]);

  useEffect(() => {
    if (isEditMode || !isInitialized) return;
    if (status !== 'done' || !completedAt) return;

    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      router.replace('/(tabs)');
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, status, completedAt, router, isInitialized]);

  useEffect(() => {
    if (!isEditMode || !isInitialized) return;
    let cancelled = false;

    async function loadForEdit() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data, error } = await fetchProfileOnboarding(supabase, user.id);
      if (cancelled || error) return;

      const mapped = mapProfileRowToAnswers(data);
      if (mapped) hydrateForEdit(mapped as Partial<OnboardingAnswers>);
    }

    loadForEdit();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, hydrateForEdit, isInitialized]);

  if (!isInitialized) {
     return (
       <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
         <ActivityIndicator size="large" color="#0ea5e9" />
       </View>
     );
  }

  const question = questions[currentStep];

  if (status === 'saving') {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center px-6">
        <ActivityIndicator size="large" color="#0ea5e9" className="mb-6" />
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight text-center">
          Verileriniz kaydediliyor…
        </Text>
        <Text className="text-slate-600 dark:text-slate-400 text-sm p-4 text-center">
          Profilinize yazılıyor. Lütfen bekleyin.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 24, paddingBottom: 60, paddingTop: 60 }}>
      <View className="w-full max-w-lg mx-auto">
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 text-center">
            {isEditMode ? 'Hedeflerinizi ' : 'Sizi '}
            <Text className="text-primary-blue dark:text-cyan-400">
               {isEditMode ? 'güncelleyin' : 'tanıyalım'}
            </Text>
          </Text>
          <Text className="text-slate-600 dark:text-slate-400 text-sm text-center">
            {isEditMode
              ? 'Tercihlerinizi değiştirin; Kaydet ile profilinize yansıtın.'
              : 'Birkaç soruyla deneyiminizi kişiselleştireceğiz.'}
          </Text>
        </View>

        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {saveError && (
          <View className="mb-6 rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4">
            <Text className="text-sm text-red-700 dark:text-red-400 mb-3">{saveError}</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={clearSaveError}
                className="rounded-xl bg-red-600 px-4 py-2"
              >
                <Text className="text-white text-xs font-bold">Tekrar dene</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={clearSaveError}
                className="rounded-xl border border-red-500/40 px-4 py-2"
              >
                <Text className="text-red-600 dark:text-red-400 text-xs font-semibold">Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {question && (
           <QuestionCard
             question={question}
             answers={answers}
             pickSingle={pickSingle}
             toggleMulti={toggleMulti}
             confirmMulti={confirmMulti}
             setAnswerField={setAnswerField as any}
             confirmTextStep={confirmTextStep}
             confirmTargetLeagueStep={confirmTargetLeagueStep}
           />
        )}
      </View>
    </ScrollView>
  );
}
