import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import {
  logSupabaseError,
  saveOnboardingToProfile,
  verifyOnboardingSaveRow,
} from './profileOnboarding';

export const PENDING_ONBOARDING_KEY = 'pending_onboarding';
const LEGACY_PENDING_KEY = 'pending_onboarding_data';
const MS_24H = 24 * 60 * 60 * 1000;

function parseCreatedAtMs(parsed: any) {
  if (parsed == null || typeof parsed !== 'object') return null;
  if (typeof parsed.createdAt === 'number' && !Number.isNaN(parsed.createdAt)) {
    return parsed.createdAt;
  }
  if (parsed.savedAt) {
    const t = new Date(parsed.savedAt).getTime();
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

export async function cleanupExpiredPendingOnboarding() {
  for (const key of [PENDING_ONBOARDING_KEY, LEGACY_PENDING_KEY]) {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const p = JSON.parse(raw);
      const data = p.data ?? p.answers;
      if (!data) {
        await AsyncStorage.removeItem(key);
        continue;
      }
      const t = parseCreatedAtMs(p);
      if (t != null && Date.now() - t > MS_24H) {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }
}

export async function savePendingOnboardingData(answers: Record<string, unknown>) {
  try {
    await cleanupExpiredPendingOnboarding();
    const payload = JSON.stringify({
      data: answers,
      createdAt: Date.now(),
    });
    await AsyncStorage.setItem(PENDING_ONBOARDING_KEY, payload);
    try {
      await AsyncStorage.removeItem(LEGACY_PENDING_KEY);
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
}

export async function loadPendingOnboardingData(): Promise<{ answers: any; createdAt: number | null; version?: number } | null> {
  await cleanupExpiredPendingOnboarding();
  try {
    let raw = await AsyncStorage.getItem(PENDING_ONBOARDING_KEY);
    if (!raw) raw = await AsyncStorage.getItem(LEGACY_PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    const answers = p.data ?? p.answers;
    if (!answers || typeof answers !== 'object') return null;
    const createdAt = parseCreatedAtMs(p);
    return {
      answers,
      createdAt,
      version: p.version,
    };
  } catch {
    return null;
  }
}

export async function clearPendingOnboardingData() {
  try {
    await AsyncStorage.removeItem(PENDING_ONBOARDING_KEY);
    await AsyncStorage.removeItem(LEGACY_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export async function hasPendingOnboardingInStorage(): Promise<boolean> {
  await cleanupExpiredPendingOnboarding();
  const data = await loadPendingOnboardingData();
  return data != null;
}

export async function flushPendingOnboardingToSupabase(client = supabase): Promise<{ ok: boolean; error?: unknown }> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false };

  const pending = await loadPendingOnboardingData();
  if (!pending?.answers) return { ok: false };

  const { data, error } = await saveOnboardingToProfile(client, user.id, pending.answers);
  if (error) {
    logSupabaseError('[flushPendingOnboardingToSupabase] save failed', error);
    return { ok: false, error };
  }
  if (!verifyOnboardingSaveRow(data, pending.answers)) {
    console.error('[flushPendingOnboardingToSupabase] doğrulama başarısız (onboarding_completed_at / weaknesses)', {
      data,
      difficultiesSent: pending.answers?.difficulties,
    });
    return { ok: false, error: new Error('Onboarding satırı doğrulanamadı') };
  }

  await clearPendingOnboardingData();
  return { ok: true };
}
