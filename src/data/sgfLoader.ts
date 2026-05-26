/**
 * SGF Loader — Agora Mobil
 *
 * SGF içerikleri `inlineSgf.ts` dosyasına doğrudan gömülmüştür.
 * Bu sayede expo-asset / fetch() zinciri gerekmez; Expo Go dahil
 * tüm ortamlarda senkron + güvenilir çalışır.
 *
 * Agora_gravity sgfLoader.ts ile aynı `GoProblem[]` array'ini export eder.
 */
import { parseSgfToProblem, categoryFromPath, hashIdForSgf } from '../lib/sgfParse';
import type { GoProblem } from '../types/goProblem';
import { INLINE_SGF_MAP } from './inlineSgf';

/* ─── Problem Listesi (senkron) ────────────────────────────── */
function buildProblems(): GoProblem[] {
  const results: GoProblem[] = [];

  for (const [relativePath, raw] of Object.entries(INLINE_SGF_MAP)) {
    const filename = relativePath.split('/').pop() ?? 'unknown.sgf';
    const id       = hashIdForSgf(relativePath, raw);
    const category = categoryFromPath(relativePath);

    const problem = parseSgfToProblem(raw, { relativePath, filename, id, category });
    results.push(problem);
  }

  // Agora_gravity ile aynı sıralama: kategori → dosya adı
  results.sort((a, b) => {
    const ca = (a.category ?? '').localeCompare(b.category ?? '', 'tr');
    if (ca !== 0) return ca;
    return (a.sgf ?? a.id).localeCompare(b.sgf ?? b.id, 'tr');
  });

  return results;
}

/** Tüm SGF problemleri — senkron, Expo Go'da da güvenilir */
export const problems: GoProblem[] = buildProblems();

/** async wrapper — curriculumSeed uyumluluğu için */
export async function loadProblems(): Promise<GoProblem[]> {
  return problems;
}

/** Dosya adına göre tek problem bul */
export function findProblemBySgfBasename(
  list: GoProblem[],
  base: string
): GoProblem | null {
  const norm = (s: string) =>
    s.toLowerCase()
      .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  const want = norm(base);
  return (
    list.find(
      (p) => norm(p.sgf ?? '') === want || norm(p.sgf ?? '').endsWith(want)
    ) ?? null
  );
}

/** Kategori adına göre problem listesi */
export function problemsByCategory(category: string): GoProblem[] {
  return problems.filter((p) => p.category === category);
}
