/**
 * curriculumSeed — Agora Mobil
 * Agora_gravity curriculumSeed.js'nin async portu.
 *
 * Supabase edu_courses boş/erişilemez olduğunda SGF dosyalarından
 * üretilmiş örnek kursları döner. Agora_gravity ile birebir aynı kurs
 * ve ders yapısı.
 */
import { loadProblems, findProblemBySgfBasename } from '../../data/sgfLoader';
import type { Course } from './fetchCurriculum';
import type { GoProblem } from '../../types/goProblem';

type CourseLevelBand = '17-12-kyu' | '11-6-kyu' | '5kyu-1dan';

const COVERS = ['/go4.png', '/go5.png', '/go6.png'];

function pickProblem(list: GoProblem[], index: number): GoProblem | null {
  if (!list.length) return null;
  return list[index % list.length]!;
}

function seedProblem(list: GoProblem[], index: number): GoProblem | null {
  const p = pickProblem(list, index);
  if (!p) return null;
  return { ...p, id: `edu-seed-p${index}-${p.id}`, category: 'Egitim' };
}

interface CourseDef {
  id: string; slug: string; title: string;
  description: string; summary: string;
  levelBand: CourseLevelBand; durationMinutes: number;
}

const COURSE_DEFS: CourseDef[] = [
  {
    id: 'seed-course-tas-gelisimi',
    slug: 'tas-gelisimi',
    title: 'Taş Gelişimi',
    description: 'Taşların açılışta ve oyun ortasında doğru yönlere gelişimi.',
    summary: 'Taş gelişimi prensipleri ile sağlam temeller atın.',
    levelBand: '17-12-kyu',
    durationMinutes: 45,
  },
  {
    id: 'seed-course-buyuk-acil',
    slug: 'buyuk-acil-hamleler',
    title: 'Büyük & Acil Hamleler',
    description: 'Grupların durumuna göre büyük hamle ve aciliyet okuma.',
    summary: 'Atari, kikashi ve kritik noktaları tahta üzerinde uygulayın.',
    levelBand: '11-6-kyu',
    durationMinutes: 95,
  },
  {
    id: 'seed-course-oyun-sonu',
    slug: 'oyun-sonu',
    title: 'Oyun Sonu',
    description: 'Sınırları kesinleştirme ve puanlama.',
    summary: 'Yose ve bitiş: sınırları netleştirme, ko ve puan bilinci.',
    levelBand: '5kyu-1dan',
    durationMinutes: 110,
  },
];

/**
 * SGF'lerden seed kurs listesi üretir.
 * fetchCurriculum tarafından Supabase boşken fallback olarak çağrılır.
 */
export async function buildSeedCurriculum(): Promise<{ courses: Course[] }> {
  let list: GoProblem[] = [];
  try {
    list = await loadProblems();
  } catch (e) {
    console.warn('[seed] SGF yüklenemedi', e);
  }

  if (list.length === 0) return { courses: [] };

  const courses: Course[] = COURSE_DEFS.map((d, sortOrder) => {
    const isTasGelisimi = d.id === 'seed-course-tas-gelisimi';

    // Taş Gelişimi kursuna özgü SGF'ler
    const tasGelisim1 = isTasGelisimi
      ? findProblemBySgfBasename(list, 'tas-gelisim-1.sgf')
      : null;
    const tasGelisim2 = isTasGelisimi
      ? findProblemBySgfBasename(list, 'tas-gelisim-2.sgf')
      : null;

    // Diğer kurslar: tas-gelisim olmayan problemler
    const otherProblems = list.filter(
      (p) => !((p.sgf ?? '').toLowerCase().includes('tas-gelisim'))
    );
    const fallbackProblem = seedProblem(
      otherProblems.length ? otherProblems : list,
      sortOrder
    );

    const lessons = isTasGelisimi
      ? [
          {
            id: `${d.id}-lesson-1`,
            title: 'Alıştırma 1 — Taş Gelişimi',
            body: 'Taş gelişimi prensiplerini bu diyagram üzerinde inceleyin.',
            sortOrder: 0,
            problem: tasGelisim1 ? seedProblem([tasGelisim1], 0) : fallbackProblem,
          },
          {
            id: `${d.id}-lesson-2`,
            title: 'Alıştırma 2 — Taş Gelişimi',
            body: 'Taş gelişimini farklı bir pozisyondan ele alın.',
            sortOrder: 1,
            problem: tasGelisim2 ? seedProblem([tasGelisim2], 1) : fallbackProblem,
          },
        ]
      : [
          {
            id: `${d.id}-lesson-1`,
            title: 'Alıştırma 1',
            body: 'Verilen pozisyonda doğru devamı bularak tahtayı tamamlayın.',
            sortOrder: 0,
            problem: fallbackProblem,
          },
        ];

    return {
      id: d.id,
      title: d.title,
      slug: d.slug,
      description: d.description,
      sortOrder,
      coverImageUrl: COVERS[sortOrder % COVERS.length]!,
      levelBand: d.levelBand,
      durationMinutes: d.durationMinutes,
      summary: d.summary,
      modules: [
        {
          id: `${d.id}-mod-1`,
          title: 'Modül 1 — Uygulama',
          description: 'Tahta alıştırması',
          sortOrder: 0,
          lessons,
        },
      ],
    };
  });

  return { courses };
}
