/**
 * progressStorage — Agora Mobil
 * Agora_gravity progressStorage.js'nin portu.
 * localStorage → AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import type { Course, Lesson } from './fetchCurriculum';

const LS_KEY = 'edu_completed_lessons';
const PROGRESS_TABLE = 'atolye_lesson_progress';

export type AtolyeProgressRow = {
  course_id: string;
  course_slug: string;
  course_title: string;
  level_band: string | null;
  lesson_id: string;
  lesson_title: string;
  completed_at: string;
};

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
    .from(PROGRESS_TABLE)
    .select('lesson_id')
    .eq('user_id', userId);
  if (error) {
    console.warn('[atolyeler] progress fetch failed:', error.message);
    return new Set();
  }
  return new Set((data || []).map((r: any) => String(r.lesson_id)));
}

export async function fetchAtolyeProgressRows(userId: string): Promise<AtolyeProgressRow[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from(PROGRESS_TABLE)
    .select('course_id, course_slug, course_title, level_band, lesson_id, lesson_title, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.warn('[atolyeler] progress rows fetch failed:', error.message);
    return [];
  }

  return (data ?? []) as AtolyeProgressRow[];
}

export async function markLessonCompleted(
  userId: string | null,
  lessonId: string,
  context?: { course?: Course | null; lesson?: Lesson | null }
): Promise<void> {
  const local = await loadLocalCompletedIds();
  local.add(lessonId);
  await saveLocalCompletedIds(local);
  if (!userId) return;

  const course = context?.course;
  const lesson = context?.lesson;
  const { error } = await supabase
    .from(PROGRESS_TABLE)
    .upsert(
      {
        user_id: userId,
        course_id: String(course?.id || course?.slug || 'unknown-course'),
        course_slug: String(course?.slug || course?.id || 'unknown-course'),
        course_title: String(course?.title || 'Atölye'),
        level_band: course?.levelBand ?? null,
        lesson_id: lessonId,
        lesson_title: String(lesson?.title || 'Atölye dersi'),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );

  if (error) {
    console.warn('[atolyeler] progress upsert failed:', error.message);
  }
}

export async function syncLocalCompletedIdsToRemote(userId: string, ids: Set<string>): Promise<void> {
  if (!userId || ids.size === 0) return;

  const now = new Date().toISOString();
  const rows = [...ids].map((lessonId) => ({
    user_id: userId,
    course_id: 'legacy-local',
    course_slug: 'legacy-local',
    course_title: 'Eski yerel kayıt',
    lesson_id: String(lessonId),
    lesson_title: String(lessonId),
    completed_at: now,
    updated_at: now,
    metadata: { source: 'legacy-local-sync' },
  }));

  const { error } = await supabase
    .from(PROGRESS_TABLE)
    .upsert(rows, { onConflict: 'user_id,lesson_id' });

  if (error) {
    console.warn('[atolyeler] local progress sync failed:', error.message);
  }
}
