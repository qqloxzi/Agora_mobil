import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const GO_PROGRESS_KEY = 'goProgress';

/** Yerel + Supabase birleşik tamamlanan topic_id listesi */
export async function getCompletedTopicIds(userId: string | null): Promise<string[]> {
  const localRaw = await AsyncStorage.getItem(GO_PROGRESS_KEY);
  const localData: string[] = localRaw ? JSON.parse(localRaw) : [];

  if (!userId) return localData;

  const { data, error } = await supabase
    .from('user_progress')
    .select('topic_id')
    .eq('user_id', userId);

  if (error) return localData;
  const dbIds = (data ?? []).map((r: { topic_id: string }) => r.topic_id);
  return [...new Set([...localData, ...dbIds])];
}

/** Tamamlanan konuyu yerel + (giriş yapılmışsa) Supabase'e yazar */
export async function markTopicCompleted(
  topicId: string,
  userId: string | null,
  currentCompleted: string[]
): Promise<{ completed: string[]; error: Error | null }> {
  if (currentCompleted.includes(topicId)) {
    return { completed: currentCompleted, error: null };
  }
  const next = [...currentCompleted, topicId];
  await AsyncStorage.setItem(GO_PROGRESS_KEY, JSON.stringify(next));

  if (userId) {
    const { error } = await supabase
      .from('user_progress')
      .insert([{ user_id: userId, topic_id: topicId }]);
    if (error && error.code !== '23505') {
      return { completed: next, error };
    }
  }
  return { completed: next, error: null };
}
