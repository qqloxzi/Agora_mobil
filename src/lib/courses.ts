import { supabase } from './supabase';
import type { CourseDetail, CourseListItem } from '../types/course';
import { LIG_SLUGS } from '../types/course';

export async function getCourseBySlug(slug: string): Promise<{ data: CourseDetail | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) return { data: null, error };
    return { data: data as CourseDetail, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

/** Sadece Temel Taşlar, Gelişim, Aydınlanma liglerini getirir */
export async function getLigCourses(): Promise<{ data: CourseListItem[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, slug, level, provider, image_url')
      .in('slug', LIG_SLUGS)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error };
    return { data: (data ?? []) as CourseListItem[], error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export function getKyuRangeLabel(level: string | null): string {
  if (!level) return 'Lig';
  const l = level.toLowerCase();
  if (l.includes('temel') || l.includes('taş')) return '17–12 Kyu';
  if (l.includes('gelişim')) return '11–6 Kyu';
  if (l.includes('aydınlanma')) return '5–1 Kyu';
  return level;
}

export function parseOutcomes(outcomes: string | null): string[] {
  if (!outcomes || !outcomes.trim()) return [];
  return outcomes
    .split(/\r\n|\r|\n|(?=\d+-)/)
    .map((s) => s.replace(/^\d+-\s*/, '').trim())
    .filter((s) => s.length > 2);
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return 'Yakında Açıklanacak';
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const startStr = new Date(start).toLocaleDateString('tr-TR', opts);
  if (!end) return startStr;
  const endStr = new Date(end).toLocaleDateString('tr-TR', opts);
  return `${startStr} - ${endStr}`;
}
