export type CourseLevelBand = '17-12-kyu' | '11-6-kyu' | '5kyu-1dan';

export interface AtolyelerSection {
  id: string;
  title: string;
  subtitle: string;
  intro: string;
  levelBand: CourseLevelBand;
}

/** Agora_gravity atolyelerSections.js ile aynı veri */
export const ATOLYELER_SECTIONS: AtolyelerSection[] = [
  {
    id: 'temel-taslar',
    title: 'Temel Taşlar',
    subtitle: '17–12 kyu: temel taktik ve şekiller.',
    intro: 'Taş yerleştirme, bağlantı ve basit şekiller üzerinden ilerleyin. Her atölye kısa metin ve tahta üzerinde problem çözümüyle desteklenir.',
    levelBand: '17-12-kyu',
  },
  {
    id: 'gelisim',
    title: 'Gelişim',
    subtitle: '11–6 kyu: orta seviye strateji ve şekil bilgisi.',
    intro: 'Oyun yönü, orta oyun çatışmaları ve taktik derinliği için uygun içerikler. İlerledikçe menüde tamamladığınız dersler işaretlenir.',
    levelBand: '11-6-kyu',
  },
  {
    id: 'aydinlanma',
    title: 'Aydınlanma',
    subtitle: '5 kyu – 1 dan: ileri açılış ve yüksek seviye oyun.',
    intro: 'İleri açılış, joseki varyasyonları ve yüksek seviye okuma alıştırmaları. Kendi temponuzda dersten derse ilerleyebilirsiniz.',
    levelBand: '5kyu-1dan',
  },
];

export function coursesInLevelBand<T extends { levelBand?: string }>(
  courses: T[],
  band: CourseLevelBand
): T[] {
  return courses.filter((c) => (c.levelBand ?? '17-12-kyu') === band);
}
