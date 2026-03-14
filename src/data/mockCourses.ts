export type Difficulty = 'Başlangıç' | 'Orta' | 'İleri';

export type Course = {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  imagePlaceholder?: string;
};

export const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Go\'ya İlk Adım',
    description: 'Tahtayı, taşları ve temel kuralları öğrenin. İlk partinize hazırlanın.',
    difficulty: 'Başlangıç',
  },
  {
    id: '2',
    title: 'Temel Canlı Gruplar',
    description: 'Canlı gruplar, ko ve tesuji kavramlarına giriş.',
    difficulty: 'Başlangıç',
  },
  {
    id: '3',
    title: 'Açılış Teorisi',
    description: 'Klasik ve modern açılışlar, fuseki prensipleri.',
    difficulty: 'Orta',
  },
  {
    id: '4',
    title: 'Orta Seviye Taktikler',
    description: 'Kesme, bağlama, hayat-ölüm problemleri.',
    difficulty: 'Orta',
  },
  {
    id: '5',
    title: 'İleri Seviye Oyun',
    description: 'Profesyonel oyun analizi ve strateji derinleştirme.',
    difficulty: 'İleri',
  },
];
