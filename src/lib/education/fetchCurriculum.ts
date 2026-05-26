/**
 * fetchCurriculum — Agora Mobil
 * Agora_gravity src/lib/education/fetchCurriculum.js'nin TypeScript + Expo portu.
 * localStorage → AsyncStorage, DOM bağımlılıkları kaldırıldı.
 *
 * Supabase edu_courses boş/erişilemez → curriculumSeed (SGF kaynaklı) kullanılır.
 */
import { supabase } from '../supabase';
import { buildSeedCurriculum } from './curriculumSeed';

export type CourseLevelBand = '17-12-kyu' | '11-6-kyu' | '5kyu-1dan';

export interface Lesson {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
  problem: any | null;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  sortOrder: number;
  coverImageUrl: string | null;
  durationMinutes: number | null;
  summary: string | null;
  levelBand: CourseLevelBand;
  modules: CourseModule[];
}

function normalizeLevelBand(v: unknown): CourseLevelBand {
  const allowed: CourseLevelBand[] = ['17-12-kyu', '11-6-kyu', '5kyu-1dan'];
  const s = typeof v === 'string' ? v.trim() : '';
  if (s === 'beginner') return '17-12-kyu';
  if (allowed.includes(s as CourseLevelBand)) return s as CourseLevelBand;
  return '17-12-kyu';
}

function mapCourseRow(row: any): Course {
  const mods: CourseModule[] = ((row.edu_modules || []) as any[])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description ?? '',
      sortOrder: m.sort_order ?? 0,
      lessons: ((m.edu_lessons || []) as any[])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((l) => ({
          id: l.id,
          title: l.title,
          body: l.body ?? '',
          sortOrder: l.sort_order ?? 0,
          problem: l.problem_json
            ? typeof l.problem_json === 'string'
              ? JSON.parse(l.problem_json)
              : l.problem_json
            : null,
        })),
    }));

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? '',
    sortOrder: row.sort_order ?? 0,
    coverImageUrl: row.cover_image_url ?? null,
    durationMinutes: row.duration_minutes ?? null,
    summary: row.summary ?? null,
    levelBand: normalizeLevelBand(row.level_band),
    modules: mods,
  };
}

export async function fetchCurriculum(): Promise<{ courses: Course[]; source: 'supabase' | 'seed' }> {
  try {
    const { data, error } = await supabase
      .from('edu_courses')
      .select(
        `id, title, slug, description, sort_order,
         cover_image_url, duration_minutes, summary, level_band,
         edu_modules (
           id, title, description, sort_order,
           edu_lessons ( id, title, body, problem_json, sort_order )
         )`
      )
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const courses = (data as any[]).map(mapCourseRow).sort((a, b) => a.sortOrder - b.sortOrder);
      return { courses, source: 'supabase' };
    }

    // Supabase boş / erişilemez → SGF seed'den kurs üret
    console.warn('[education] Supabase edu_courses boş, seed kullanılıyor. Hata:', error?.message ?? 'empty');
    const seed = await buildSeedCurriculum();
    return { courses: seed.courses, source: 'seed' };
  } catch (e) {
    console.warn('[education] fetchCurriculum error, seed fallback:', e);
    const seed = await buildSeedCurriculum();
    return { courses: seed.courses, source: 'seed' };
  }
}

export function flattenLessons(courses: Course[]): Lesson[] {
  const out: Lesson[] = [];
  for (const c of courses)
    for (const m of c.modules)
      for (const l of m.lessons) out.push(l);
  return out;
}

export function flattenLessonsForCourse(courses: Course[], courseSlugOrId: string): Lesson[] {
  const c = findCourseBySlug(courses, courseSlugOrId);
  return c ? flattenLessons([c]) : [];
}

export function findCourseBySlug(courses: Course[], slugOrId: string): Course | null {
  return courses.find((c) => c.slug === slugOrId || c.id === slugOrId) ?? null;
}

export function getNextLesson(ordered: Lesson[], currentId: string): Lesson | null {
  const i = ordered.findIndex((l) => l.id === currentId);
  if (i < 0 || i >= ordered.length - 1) return null;
  return ordered[i + 1] ?? null;
}
