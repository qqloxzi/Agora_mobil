import { fetchProblemsFromSupabase } from '../../data/sgfSupabase';
import type { GoProblem } from '../../types/goProblem';
import type { Course } from './fetchCurriculum';

const COVERS = ['/go4.png', '/go5.png', '/go6.png'];

const K17 = '17-12-kyu' as const;
const K11 = '11-6-kyu' as const;
const K5 = '5kyu-1dan' as const;

type CourseDef = {
  id: string;
  slug: string;
  title: string;
  description: string;
  summary: string;
  levelBand: typeof K17 | typeof K11 | typeof K5;
  durationMinutes: number;
  levelLabel?: string;
  lessonSource?: 'tas-gelisim';
  comingSoon?: boolean;
};

function pickProblem(list: GoProblem[], index: number) {
  if (!list.length) return null;
  return list[index % list.length]!;
}

function normSgfName(name: string | undefined) {
  return (name || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function normKey(value: string | undefined | null) {
  return normSgfName(value || '')
    .replace(/&/g, ' ve ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function problemMatchesCourse(problem: GoProblem, def: CourseDef) {
  if (problem.courseSlug) return normKey(problem.courseSlug) === normKey(def.slug);
  const category = normKey(problem.category);
  return category.split('-').join(' ').includes(normKey(def.title).split('-').join(' '));
}

function problemsForCourse(list: GoProblem[], def: CourseDef) {
  return list
    .filter((problem) => problemMatchesCourse(problem, def))
    .sort((a, b) => {
      const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return normSgfName(a.sgf).localeCompare(normSgfName(b.sgf), 'tr', { numeric: true });
    });
}

function findProblemBySgfBasename(list: GoProblem[], base: string) {
  const want = normSgfName(base);
  return list.find((p) => normSgfName(p.sgf).endsWith(want) || normSgfName(p.sgf) === want) ?? null;
}

export function findTasGelisimProblems(list: GoProblem[]) {
  return list
    .filter((p) => normSgfName(p.sgf).includes('tas-gelisim'))
    .sort((a, b) => normSgfName(a.sgf).localeCompare(normSgfName(b.sgf), 'tr', { numeric: true }));
}

function seedProblem(list: GoProblem[], index: number): GoProblem {
  const p = pickProblem(list, index);
  if (!p) throw new Error('No Go problems available for curriculum seed.');
  return { ...p, id: `edu-seed-p${index}-${p.id}`, category: 'Egitim' };
}

const COURSE_DEFS: CourseDef[] = [
  {
    id: 'seed-course-oyun-yonu',
    slug: 'oyun-yonu',
    title: 'Oyun Yönü',
    levelLabel: '11 kyu – 5 kyu',
    description: 'Tahta üzerinde doğru yön seçimi ve genel oyun akışı.',
    summary: 'Oyun yönü prensipleri ile sağlam temeller atın.',
    levelBand: K17,
    durationMinutes: 45,
    lessonSource: 'tas-gelisim',
  },
  {
    id: 'seed-course-temel-josekiler',
    slug: 'temel-josekiler',
    title: 'Temel Josekiler',
    description: 'Köşe mücadelelerinde temel joseki kalıpları.',
    summary: 'Sık karşılaşılan josekileri tahta üzerinde uygulayın.',
    levelBand: K17,
    durationMinutes: 50,
  },
  {
    id: 'seed-course-iyi-kotu-sekiller',
    slug: 'iyi-ve-kotu-sekiller',
    title: 'İyi ve Kötü Şekiller',
    description: 'Verimli ve verimsiz taş formlarını ayırt etme.',
    summary: 'Şekil bilgisini problem çözerek pekiştirin.',
    levelBand: K17,
    durationMinutes: 55,
  },
  {
    id: 'seed-course-saldiri',
    slug: 'saldiri',
    title: 'Saldırı',
    description: 'Zayıf gruplara baskı ve saldırı teknikleri.',
    summary: 'Saldırı fırsatlarını okuyup doğru hamleyi bulun.',
    levelBand: K17,
    durationMinutes: 50,
  },
  {
    id: 'seed-course-oyun-yonu-gelisim',
    slug: 'oyun-yonu-gelisim',
    title: 'Oyun Yönü',
    description: 'Orta seviye oyun yönü ve büyük resim okuma.',
    summary: 'Hamleleri genel stratejiyle uyumlu seçin.',
    levelBand: K11,
    durationMinutes: 60,
  },
  {
    id: 'seed-course-overplayi-cezalandirmak',
    slug: 'overplayi-cezalandirmak',
    title: "Overplay'i Cezalandırmak",
    description: 'Aşırı oynayan rakibi cezalandırma taktikleri.',
    summary: 'Overplay fırsatlarını yakalayıp avantaj elde edin.',
    levelBand: K11,
    durationMinutes: 65,
  },
  {
    id: 'seed-course-isgal-savunma',
    slug: 'isgal-ve-savunma',
    title: 'İşgal & Savunma',
    description: 'Bölge işgali ve grup savunması dengesi.',
    summary: 'İşgal ve savunma kararlarını tahta üzerinde çalışın.',
    levelBand: K11,
    durationMinutes: 70,
  },
  {
    id: 'seed-course-oyun-sonu-gelisim',
    slug: 'oyun-sonu',
    title: 'Oyun Sonu',
    description: 'Sınırları kesinleştirme ve yose okuma.',
    summary: 'Oyun sonu hamlelerinde doğru değerlendirme yapın.',
    levelBand: K11,
    durationMinutes: 75,
  },
  {
    id: 'seed-course-oyun-yonu-ileri',
    slug: 'oyun-yonu-ileri',
    title: 'Oyun Yönü',
    levelLabel: '5 kyu+',
    description: 'İleri seviye oyun yönü ve planlama.',
    summary: 'Yüksek seviyede doğru yön ve tempo seçimi.',
    levelBand: K5,
    durationMinutes: 80,
  },
  {
    id: 'seed-course-hamlelerin-degerleri',
    slug: 'hamlelerin-degerleri',
    title: 'Hamlelerin Değerleri',
    description: 'Hamle büyüklüğü ve değer karşılaştırması.',
    summary: 'Büyük hamle ile acil hamle arasında doğru tercih.',
    levelBand: K5,
    durationMinutes: 85,
  },
  {
    id: 'seed-course-aydinlanma-yakinda-3',
    slug: 'aydinlanma-atolye-3',
    title: 'Atölye 3 — Yakında',
    description: 'Bu atölye içeriği yakında eklenecek.',
    summary: 'Yakında — ileri seviye içerik hazırlanıyor.',
    levelBand: K5,
    durationMinutes: 90,
    comingSoon: true,
  },
  {
    id: 'seed-course-aydinlanma-yakinda-4',
    slug: 'aydinlanma-atolye-4',
    title: 'Atölye 4 — Yakında',
    description: 'Bu atölye içeriği yakında eklenecek.',
    summary: 'Yakında — ileri seviye içerik hazırlanıyor.',
    levelBand: K5,
    durationMinutes: 90,
    comingSoon: true,
  },
];

function buildLessons(def: CourseDef, list: GoProblem[]) {
  let problems = problemsForCourse(list, def);

  if (problems.length === 0 && def.lessonSource === 'tas-gelisim') {
    problems =
      findTasGelisimProblems(list).length > 0
        ? findTasGelisimProblems(list)
        : ([
            findProblemBySgfBasename(list, 'tas-gelisim-1.sgf'),
            findProblemBySgfBasename(list, 'tas-gelisim-2.sgf'),
          ].filter(Boolean) as GoProblem[]);
  }

  return problems.map((problem, i) => {
    const seeded = seedProblem([problem], i);
    return {
      id: `${def.id}-lesson-${i + 1}`,
      title: problem.lessonTitle || `Alıştırma ${i + 1} — ${def.title}`,
      body:
        seeded.initialDescription?.trim() ||
        'Verilen pozisyonda doğru devamı bularak tahtayı tamamlayın.',
      sortOrder: typeof problem.sortOrder === 'number' ? problem.sortOrder : i,
      problem: seeded,
    };
  });
}

export async function buildSeedCurriculum(): Promise<{ courses: Course[] }> {
  const list = await fetchProblemsFromSupabase();
  const p0 = pickProblem(list, 0);
  if (!p0) return { courses: [] };

  const courses: Course[] = COURSE_DEFS.map((def, sortOrder) => ({
    id: def.id,
    title: def.title,
    slug: def.slug,
    description: def.description,
    sortOrder,
    coverImageUrl: COVERS[sortOrder % COVERS.length]!,
    levelBand: def.levelBand,
    levelLabel: def.levelLabel ?? null,
    durationMinutes: def.durationMinutes,
    summary: def.summary,
    modules: [
      {
        id: `${def.id}-mod-1`,
        title: 'Modül 1 — Uygulama',
        description: 'Tahta alıştırması',
        sortOrder: 0,
        lessons: buildLessons(def, list),
      },
    ],
  }));

  return { courses };
}
