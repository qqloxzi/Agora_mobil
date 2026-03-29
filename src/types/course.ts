/**
 * Supabase `courses` tablosu ile uyumlu tip tanımları.
 */
export interface CourseDetail {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  level: string | null;
  provider: string | null;
  duration: string | null;
  outcomes: string | null;
  image_url: string | null;
  course_start: string | null;
  course_end: string | null;
  status: string | null;
  shopier_link?: string | null;
  students_count?: number | null;
  teacher_id?: string | null;
  created_at?: string;
}

/** Kurs listesi (kartlarda kullanılan kısmi tip) */
export interface CourseListItem {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  level: string | null;
  provider: string | null;
  image_url: string | null;
}

/** Sadece 3 ligi listelemek için kullanılan slug'lar */
export const LIG_SLUGS = ['temel-taslar', 'gelisim', 'aydinlanma'] as const;
