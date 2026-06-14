/**
 * fetchCurriculum — Agora Mobil
 * Agora_gravity src/lib/education/fetchCurriculum.js'nin TypeScript + Expo portu.
 * localStorage → AsyncStorage, DOM bağımlılıkları kaldırıldı.
 *
 * Agora_gravity ile aynı şekilde Atölyeler müfredatı `go_problems`
 * tablosundaki SGF'lerden üretilir.
 */
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
  levelLabel?: string | null;
  modules: CourseModule[];
}

function normalizeLevelBand(v: unknown): CourseLevelBand {
  const allowed: CourseLevelBand[] = ['17-12-kyu', '11-6-kyu', '5kyu-1dan'];
  const s = typeof v === 'string' ? v.trim() : '';
  if (s === 'beginner') return '17-12-kyu';
  if (allowed.includes(s as CourseLevelBand)) return s as CourseLevelBand;
  return '17-12-kyu';
}

/**
 * Supabase problem_json'u uygulama GoProblem tipine çevirir.
 * Agora_gravity fetchCurriculum.js problemFromJson() ile aynı mantık:
 * id ve category alanlarını güvence altına alır.
 */
const SLUG_ALIASES: Record<string, string> = {
  'tas-gelisimi': 'oyun-yonu',
  'seed-course-tas-gelisimi': 'seed-course-oyun-yonu',
};

export async function fetchCurriculum(): Promise<{ courses: Course[]; source: 'supabase' | 'seed' }> {
  const seed = await buildSeedCurriculum();
  return { courses: seed.courses, source: 'seed' };
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
  const normalized = SLUG_ALIASES[slugOrId] || slugOrId;
  return courses.find((c) => c.slug === normalized || c.id === normalized) ?? null;
}

export function getNextLesson(ordered: Lesson[], currentId: string): Lesson | null {
  const i = ordered.findIndex((l) => l.id === currentId);
  if (i < 0 || i >= ordered.length - 1) return null;
  return ordered[i + 1] ?? null;
}
