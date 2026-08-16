import type { ImageSourcePropType } from 'react-native';

export type InstructorCourse = {
  title: string;
  slug: string;
  level: string;
};

export type InstructorProfile = {
  id: string;
  name: string;
  title: string;
  avatar?: ImageSourcePropType;
  location: string;
  email: string;
  about: string;
  courses: InstructorCourse[];
};

export const instructorsData: InstructorProfile[] = [
  {
    id: 'tugkaneren',
    name: 'Tuğkan Eren',
    title: '4 Dan',
    avatar: require('../../assets/instructorphotos/tugkaneren.jpeg'),
    location: 'İzmir, Türkiye',
    email: 'tugkan@agorago.com',
    about: 'Go alanında 15 yılı aşkın tecrübeye sahiptir ve Türkiye Go Milli Takımı oyuncusudur.',
    courses: [{ title: 'Aydınlanma Ligi', slug: 'aydinlanma', level: '5–1 Kyu' }],
  },
  {
    id: 'oguzerdogan',
    name: 'Oğuz Erdoğan',
    title: '1 Dan',
    avatar: require('../../assets/instructorphotos/oguzerdogan.png'),
    location: 'İzmir, Türkiye',
    email: 'oguz@agorago.com',
    about: "4 yıldır go oynuyor. Hem Goizm'de hem de İytego'da başkanlık yapmış ve hâlâ İytego'da aktif eğitimler veriyor.",
    courses: [{ title: 'Gelişim Ligi', slug: 'gelisim', level: '11–6 Kyu' }],
  },
  {
    id: 'alikarakaya',
    name: 'Ali Karakaya',
    title: '5 Kyu',
    avatar: require('../../assets/instructorphotos/alikarakaya.png'),
    location: 'İzmir, Türkiye',
    email: 'ali@agorago.com',
    about: "2 yıllık Go deneyimiyle Ali, Goizm ve İyitego topluluklarında aktif rol almakta ve özellikle başlangıç seviyesindeki oyuncuların sağlam bir temel oluşturmasına odaklanmaktadır.",
    courses: [{ title: 'Temel Taşlar Ligi', slug: 'temel-taslar', level: '17–12 Kyu' }],
  },
  {
    id: 'doganergezen',
    name: 'Doğan Ergezen',
    title: '3 Kyu',
    avatar: require('../../assets/instructorphotos/doganergezen.jpeg'),
    location: 'İzmir, Türkiye',
    email: 'dogan@agorago.com',
    about: 'Yapay zeka mühendisi, Atölyeler ve tsumegoların oluşturulmasından sorumlu',
    courses: [],
  },
];

export type BlogEntry = {
  slug: string;
  title: string;
  category: string;
  author: string;
  date: string;
  snippet: string;
  sections: { title: string; body: string }[];
};

export const blogEntries: BlogEntry[] = [
  {
    slug: 'goya-baslarken',
    title: "Go'ya Başlarken",
    category: 'Rehber',
    author: 'Ali Karakaya',
    date: '2024-12-02',
    snippet: 'Go oyununa yeni başlayanlar için sunucular, uygulamalar ve kitap önerileri.',
    sections: [
      {
        title: 'Go Sunucuları',
        body: 'OGS, KGS ve Fox gibi platformlar farklı oyuncu havuzları ve arayüzleriyle Go oynamaya başlamak için iyi seçeneklerdir.',
      },
      {
        title: 'Tsumego ve Problem Platformları',
        body: 'Tsumego Hero ve Go Problems gibi kaynaklar, okuma gücünü ve şekil bilgisini düzenli olarak geliştirmek için kullanılabilir.',
      },
      {
        title: 'Android ve iOS Uygulamaları',
        body: 'BadukPop, WeiqiHub, Surround ve Tsumego Pro gibi uygulamalar mobilde düzenli çalışma alışkanlığı kazandırır.',
      },
    ],
  },
];

export type League = {
  id: number;
  name: string;
  sub: string;
  status: string;
  players: string[];
  results: { week: number; winner: string; loser: string }[];
};

export const leagueData: League[] = [
  {
    id: 1,
    name: 'Temel Taşlar Ligi',
    sub: '17–12 Kyu',
    status: 'Ligler Başladı',
    players: ['Umut Persil', 'Kaan Gençalp', 'Muhammed Altın', 'Ali Karakaya'],
    results: [
      { week: 1, winner: 'Ali Karakaya', loser: 'Umut Persil' },
      { week: 1, winner: 'Kaan Gençalp', loser: 'Muhammed Altın' },
      { week: 2, winner: 'Umut Persil', loser: 'Muhammed Altın' },
      { week: 2, winner: 'Ali Karakaya', loser: 'Kaan Gençalp' },
      { week: 3, winner: 'Kaan Gençalp', loser: 'Umut Persil' },
      { week: 3, winner: 'Ali Karakaya', loser: 'Muhammed Altın' },
    ],
  },
  {
    id: 2,
    name: 'Gelişim Ligi',
    sub: '11–6 Kyu',
    status: 'Ligler Başladı',
    players: ['Murat Özbay', 'Umut Can Dumlupınar', 'Tufan Baran Ilıcalı', 'Samed Karapınar', 'Nesibe Şenveli', 'Güçlü Yılmaz', 'Hüseyin boyacı', 'Altay Didikoğlu'],
    results: [
      { week: 1, winner: 'Murat Özbay', loser: 'Güçlü Yılmaz' },
      { week: 1, winner: 'Umut Can Dumlupınar', loser: 'Nesibe Şenveli' },
      { week: 1, winner: 'Samed Karapınar', loser: 'Tufan Baran Ilıcalı' },
      { week: 1, winner: 'Altay Didikoğlu', loser: 'Hüseyin boyacı' },
      { week: 2, winner: 'Hüseyin boyacı', loser: 'Güçlü Yılmaz' },
      { week: 2, winner: 'Altay Didikoğlu', loser: 'Nesibe Şenveli' },
    ],
  },
  {
    id: 3,
    name: 'Aydınlanma Ligi',
    sub: '5–1 Kyu',
    status: 'Ligler Başladı',
    players: ['Aren Denktaş', 'Doğan Ergezen', 'Bilge Göze', 'Semih Bilki'],
    results: [
      { week: 1, winner: 'Doğan Ergezen', loser: 'Bilge Göze' },
      { week: 1, winner: 'Semih Bilki', loser: 'Aren Denktaş' },
      { week: 2, winner: 'Aren Denktaş', loser: 'Bilge Göze' },
      { week: 2, winner: 'Semih Bilki', loser: 'Doğan Ergezen' },
    ],
  },
];
