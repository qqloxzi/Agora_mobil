import type { GoProblem } from '../types/goProblem';
import { supabase } from '../lib/supabase';
import { hashIdForSgf, parseSgfToProblem } from '../lib/sgfParse';

interface GoProblemsRow {
  id: string;
  sgf_filename: string;
  category: string;
  sgf_raw: string;
  initial_description?: string | null;
  course_slug?: string | null;
  module_slug?: string | null;
  module_title?: string | null;
  lesson_title?: string | null;
  sort_order?: number | null;
}

let cached: GoProblem[] | null = null;

export function invalidateProblemsCache() {
  cached = null;
}

export async function fetchProblemsFromSupabase(): Promise<GoProblem[]> {
  if (cached) return cached; // Cache works in all environments — re-fetch only on invalidate()

  let rows: GoProblemsRow[] | null = null;

  const withPlacement = await supabase
    .from('go_problems')
    .select('id, sgf_filename, category, sgf_raw, initial_description, course_slug, module_slug, module_title, lesson_title, sort_order');

  if (!withPlacement.error && withPlacement.data) {
    rows = withPlacement.data as GoProblemsRow[];
  } else {
    const withIntro = await supabase
      .from('go_problems')
      .select('id, sgf_filename, category, sgf_raw, initial_description');

    if (!withIntro.error && withIntro.data) {
      rows = withIntro.data as GoProblemsRow[];
    } else {
      const fallback = await supabase
      .from('go_problems')
      .select('id, sgf_filename, category, sgf_raw');
      if (fallback.error || !fallback.data) {
        console.warn('[sgfSupabase] fetch failed or empty:', withPlacement.error?.message || withIntro.error?.message || fallback.error?.message);
        return [];
      }
      rows = fallback.data as GoProblemsRow[];
    }
  }

  if (!rows.length) return [];

  const problems = rows.map((row) => {
    const relativePath = `${row.category}/${row.sgf_filename}`;
    const id = hashIdForSgf(relativePath, row.sgf_raw);
    const initialDescription = row.initial_description?.trim() || undefined;
    return {
      ...parseSgfToProblem(row.sgf_raw, {
        relativePath,
        filename: row.sgf_filename,
        id,
        category: row.category,
      }),
      initialDescription,
      courseSlug: row.course_slug ?? null,
      moduleSlug: row.module_slug ?? null,
      moduleTitle: row.module_title ?? null,
      lessonTitle: row.lesson_title ?? null,
      sortOrder: row.sort_order ?? null,
    };
  });

  problems.sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category, 'tr');
    if (categoryCompare !== 0) return categoryCompare;
    const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return (a.sgf || a.id).localeCompare(b.sgf || b.id, 'tr');
  });

  cached = problems;
  return problems;
}
