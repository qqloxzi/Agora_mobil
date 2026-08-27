import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'expo-router';
import { onboardingQuestions } from '../data/onboardingQuestions';
import {
  clearOnboardingStorage,
  loadOnboardingPersisted,
  saveOnboardingPersisted,
} from '../lib/onboardingStorage';
import {
  fetchProfileOnboarding,
  logSupabaseError,
  mapProfileRowToAnswers,
  profileRowHasOnboardingContent,
  saveOnboardingToProfile,
  verifyOnboardingSaveRow,
} from '../lib/profileOnboarding';
import {
  savePendingOnboardingData,
  flushPendingOnboardingToSupabase,
  clearPendingOnboardingData,
  cleanupExpiredPendingOnboarding,
} from '../lib/pendingOnboarding';
import { supabase } from '../lib/supabase';

export type OnboardingAnswers = {
  preferredName: string;
  clubMembership: string;
  playingDuration: string;
  level: string;
  internalGoals: string[];
  difficulties: string[];
  trainingMethods: string[];
  weeklyHours: string;
  target_league_level: string;
  targetGoal: string;
  motivation?: string;
  tournament?: string;
};

type OnboardingContextType = {
  answers: OnboardingAnswers;
  currentStep: number;
  totalSteps: number;
  status: 'active' | 'saving' | 'done';
  completedAt: string | null;
  hasCompletedOnboarding: boolean;
  saveError: string | null;
  questions: typeof onboardingQuestions;
  isInitialized: boolean;
  pickSingle: (value: string) => void;
  toggleMulti: (value: string) => void;
  confirmMulti: () => void;
  setAnswerField: (key: keyof OnboardingAnswers, value: any) => void;
  confirmTextStep: () => void;
  confirmTargetLeagueStep: () => void;
  resetOnboarding: () => void;
  clearSaveError: () => void;
  syncOnboardingFromRemote: (row: any) => void;
  hydrateForEdit: (partialAnswers: Partial<OnboardingAnswers>) => void;
  enterEditModeUi: () => void;
  isCompleted: boolean;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function initialOnboardingAnswers(): OnboardingAnswers {
  return {
    preferredName: '',
    clubMembership: '',
    playingDuration: '',
    level: '',
    internalGoals: [],
    difficulties: [],
    trainingMethods: [],
    weeklyHours: '',
    target_league_level: '',
    targetGoal: '',
  };
}

function mergeAnswers(partial: any): OnboardingAnswers {
  const base = initialOnboardingAnswers();
  if (!partial || typeof partial !== 'object') return base;
  return {
    ...base,
    ...partial,
    difficulties: Array.isArray(partial.difficulties) ? partial.difficulties : [],
    internalGoals: Array.isArray(partial.internalGoals) ? partial.internalGoals : [],
    trainingMethods: Array.isArray(partial.trainingMethods) ? partial.trainingMethods : [],
  };
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isInitialized, setIsInitialized] = useState(false);
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialOnboardingAnswers());
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<'active' | 'saving' | 'done'>('active');
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const answersRef = useRef(answers);
  const currentStepRef = useRef(currentStep);

  answersRef.current = answers;
  currentStepRef.current = currentStep;

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    if (isInitialized) {
      saveOnboardingPersisted({
        answers,
        currentStep,
        status,
        completedAt,
      });
    }
  }, [answers, currentStep, status, completedAt, isInitialized]);

  const totalSteps = onboardingQuestions.length;

  const clearSaveError = useCallback(() => setSaveError(null), []);

  const resetOnboarding = useCallback(() => {
    clearOnboardingStorage();
    clearPendingOnboardingData();
    setAnswers(initialOnboardingAnswers());
    setCurrentStep(0);
    setStatus('active');
    setCompletedAt(null);
    setSaveError(null);
  }, []);

  const syncOnboardingFromRemote = useCallback((row: any) => {
    if (!row) return;
    const mapped = mapProfileRowToAnswers(row);
    if (!mapped) return;

    answersRef.current = mapped as any;
    setAnswers(mapped as any);
    setSaveError(null);

    if (row.onboarding_completed_at) {
      setCompletedAt(row.onboarding_completed_at);
      setStatus('done');
      saveOnboardingPersisted({
        answers: mapped,
        currentStep: totalSteps - 1,
        status: 'done',
        completedAt: row.onboarding_completed_at,
      });
      return;
    }

    if (profileRowHasOnboardingContent(row)) {
      setCompletedAt(null);
      setStatus('active');
      saveOnboardingPersisted({
        answers: mapped,
        currentStep: currentStepRef.current,
        status: 'active',
        completedAt: null,
      });
    }
  }, [totalSteps]);

  const hydrateOnboardingFromServer = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await fetchProfileOnboarding(supabase, user.id);
    if (error || !data) return;

    if (data.onboarding_completed_at || profileRowHasOnboardingContent(data)) {
      syncOnboardingFromRemote(data);
    }
  }, [syncOnboardingFromRemote]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const persisted = await loadOnboardingPersisted();
      if (!mounted) return;

      setAnswers(mergeAnswers(persisted?.answers));
      setCurrentStep(Number(persisted?.currentStep ?? 0));
      setStatus((persisted?.status as any) ?? 'active');
      setCompletedAt((persisted?.completedAt as string) ?? null);

      await hydrateOnboardingFromServer();

      if (mounted) setIsInitialized(true);
    }

    void init();
    cleanupExpiredPendingOnboarding();
    void flushPendingOnboardingToSupabase(supabase);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        cleanupExpiredPendingOnboarding();
        void flushPendingOnboardingToSupabase(supabase);
        void hydrateOnboardingFromServer();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateOnboardingFromServer]);

  const hydrateForEdit = useCallback((partialAnswers: any) => {
    const merged = mergeAnswers(partialAnswers);
    answersRef.current = merged;
    setAnswers(merged);
    setCurrentStep(0);
    setStatus('active');
    setSaveError(null);
  }, []);

  const enterEditModeUi = useCallback(() => {
    setStatus('active');
    setSaveError(null);
  }, []);

  const finishSurvey = useCallback(async () => {
    setSaveError(null);
    setStatus('saving');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const snapshot = { ...answersRef.current };

      if (!user) {
        await savePendingOnboardingData(snapshot);
        const at = new Date().toISOString();
        answersRef.current = snapshot;
        setCompletedAt(at);
        await saveOnboardingPersisted({
          answers: snapshot,
          currentStep: currentStepRef.current,
          status: 'done',
          completedAt: at,
        });
        setStatus('done');
        router.replace('/(auth)');
        return;
      }

      const { error, data: savedRow } = await saveOnboardingToProfile(supabase, user.id, snapshot);

      if (error) {
        logSupabaseError('[finishSurvey] saveOnboardingToProfile', error);
        setSaveError(
          error.message || 'Veriler kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.'
        );
        setStatus('active');
        return;
      }

      if (savedRow && !verifyOnboardingSaveRow(savedRow, snapshot)) {
        console.error('[finishSurvey] kayıt doğrulanamadı', { savedRow, snapshot });
        setSaveError('Kayıt doğrulanamadı. Lütfen tekrar deneyin.');
        setStatus('active');
        return;
      }

      await clearPendingOnboardingData();

      if (savedRow) {
        syncOnboardingFromRemote(savedRow);
        setCompletedAt(savedRow.onboarding_completed_at);
        setStatus('done');
      } else {
        const at = new Date().toISOString();
        answersRef.current = snapshot;
        setCompletedAt(at);
        await saveOnboardingPersisted({
          answers: snapshot,
          currentStep: currentStepRef.current,
          status: 'done',
          completedAt: at,
        });
        setStatus('done');
      }

      router.replace('/');
    } catch (err: any) {
      console.error('[finishSurvey] beklenmeyen hata', err);
      logSupabaseError('[finishSurvey]', err);
      setSaveError(
        err instanceof Error ? err.message : 'Veriler kaydedilemedi. Lütfen tekrar deneyin.'
      );
      setStatus('active');
    }
  }, [router, syncOnboardingFromRemote]);

  const pickSingle = useCallback(
    (value: string) => {
      const step = currentStepRef.current;
      const q = onboardingQuestions[step];
      if (!q || q.type !== 'single') return;

      const key = q.answerKey;
      const next = { ...answersRef.current, [key]: value };
      answersRef.current = next;
      setAnswers(next);

      if (step < totalSteps - 1) {
        setCurrentStep(step + 1);
      } else {
        void finishSurvey();
      }
    },
    [totalSteps, finishSurvey]
  );

  const toggleMulti = useCallback((value: string) => {
    const step = currentStepRef.current;
    const q = onboardingQuestions[step];
    if (!q || q.type !== 'multi') return;
    const key = q.answerKey as keyof OnboardingAnswers;
    setAnswers((prev) => {
      const prevArr = Array.isArray(prev[key]) ? (prev[key] as unknown as string[]) : [];
      const arr = prevArr.includes(value)
        ? prevArr.filter((x) => x !== value)
        : [...prevArr, value];
      const next = { ...prev, [key]: arr };
      answersRef.current = next;
      return next;
    });
  }, []);

  const confirmMulti = useCallback(() => {
    const step = currentStepRef.current;
    const q = onboardingQuestions[step];
    if (!q || q.type !== 'multi') return;
    if (step < totalSteps - 1) {
      setCurrentStep(step + 1);
    } else {
      void finishSurvey();
    }
  }, [totalSteps, finishSurvey]);

  const setAnswerField = useCallback((key: keyof OnboardingAnswers, value: any) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      answersRef.current = next;
      return next;
    });
  }, []);

  const confirmTextStep = useCallback(() => {
    const step = currentStepRef.current;
    const q = onboardingQuestions[step];
    if (!q || q.type !== 'text') return;
    if (step < totalSteps - 1) {
      setCurrentStep(step + 1);
    } else {
      void finishSurvey();
    }
  }, [totalSteps, finishSurvey]);

  const confirmTargetLeagueStep = useCallback(() => {
    const raw = answersRef.current.target_league_level;
    if (raw == null || String(raw).trim() === '') return;
    void finishSurvey();
  }, [finishSurvey]);

  const hasCompletedOnboarding = Boolean(completedAt);

  const value = useMemo(
    () => ({
      answers,
      currentStep,
      totalSteps,
      status,
      completedAt,
      hasCompletedOnboarding,
      saveError,
      questions: onboardingQuestions,
      isInitialized,
      pickSingle,
      toggleMulti,
      confirmMulti,
      setAnswerField,
      confirmTextStep,
      confirmTargetLeagueStep,
      resetOnboarding,
      clearSaveError,
      syncOnboardingFromRemote,
      hydrateForEdit,
      enterEditModeUi,
      isCompleted: status === 'done' || Boolean(completedAt),
    }),
    [
      answers,
      currentStep,
      totalSteps,
      status,
      completedAt,
      hasCompletedOnboarding,
      saveError,
      isInitialized,
      pickSingle,
      toggleMulti,
      confirmMulti,
      setAnswerField,
      confirmTextStep,
      confirmTargetLeagueStep,
      resetOnboarding,
      clearSaveError,
      syncOnboardingFromRemote,
      hydrateForEdit,
      enterEditModeUi,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
