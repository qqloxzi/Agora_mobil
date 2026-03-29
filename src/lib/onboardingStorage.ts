import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_STORAGE_KEY = 'agora_onboarding_v1';

export async function loadOnboardingPersisted(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export async function clearOnboardingStorage() {
  try {
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function saveOnboardingPersisted(payload: any) {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ version: 1, ...payload }));
  } catch {
    /* ignore quota */
  }
}
