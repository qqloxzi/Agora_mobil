/**
 * progressStorage — Agora Mobil
 * Agora_gravity progressStorage.js'nin portu.
 * localStorage → AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const LS_KEY = 'edu_completed_lessons';

export async function loadLocalCompletedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

export async function saveLocalCompletedIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(LS_KEY, JSON.stringify([...ids]));
}

export async function fetchRemoteCompletedLessonIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from('edu_user_progress')
    .select('lesson_id')
    .eq('user_id', userId);
  if (error) return new Set();
  return new Set((data || []).map((r: any) => String(r.lesson_id)));
}

export async function markLessonCompleted(
  userId: string | null,
  lessonId: string
): Promise<void> {
  const local = await loadLocalCompletedIds();
  local.add(lessonId);
  await saveLocalCompletedIds(local);
  if (!userId) return;
  const { error } = await supabase
    .from('edu_user_progress')
    .insert({ user_id: userId, lesson_id: lessonId });
  if (error && error.code !== '23505') {
    console.warn('[education] progress insert', error.message);
  }
}
