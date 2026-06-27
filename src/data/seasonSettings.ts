import { supabase } from '../lib/supabase';

export type SeasonSettings = {
  seasonNumber: number;
  seasonLabel: string;
  heroEyebrow: string;
  heroTitle: string;
  courseIntro: string;
  bannerBadge: string;
  bannerTitle: string;
  registrationDeadline: string | null;
  startDate: string | null;
};

export const fallbackSeasonSettings: SeasonSettings = {
  seasonNumber: 3,
  seasonLabel: '3. Sezon',
  heroEyebrow: 'YENİ SEZON DUYURUSU',
  heroTitle: "3. Sezon 22 Haziran'da Başlıyor: Kayıtlar Açık!",
  courseIntro:
    "Aşağıdaki programlardan seviyenize uygun olanı seçebilir ve Haziran'da başlayacak 3. sezon'a katılabilirsiniz.",
  bannerBadge: 'Kayıtlar Başladı',
  bannerTitle: '3. Sezona hazır mısınız?',
  registrationDeadline: '2026-06-20',
  startDate: '2026-06-22',
};

type SeasonSettingsRow = {
  season_number: number | null;
  season_label: string | null;
  hero_eyebrow: string | null;
  hero_title: string | null;
  course_intro: string | null;
  banner_badge: string | null;
  banner_title: string | null;
  registration_deadline: string | null;
  start_date: string | null;
};

function mapSeasonRow(row: SeasonSettingsRow): SeasonSettings {
  return {
    seasonNumber: row.season_number ?? fallbackSeasonSettings.seasonNumber,
    seasonLabel: row.season_label || fallbackSeasonSettings.seasonLabel,
    heroEyebrow: row.hero_eyebrow || fallbackSeasonSettings.heroEyebrow,
    heroTitle: row.hero_title || fallbackSeasonSettings.heroTitle,
    courseIntro: row.course_intro || fallbackSeasonSettings.courseIntro,
    bannerBadge: row.banner_badge || fallbackSeasonSettings.bannerBadge,
    bannerTitle: row.banner_title || fallbackSeasonSettings.bannerTitle,
    registrationDeadline:
      row.registration_deadline || fallbackSeasonSettings.registrationDeadline,
    startDate: row.start_date || fallbackSeasonSettings.startDate,
  };
}

export async function fetchActiveSeasonSettings(): Promise<SeasonSettings> {
  const { data, error } = await supabase
    .from('season_settings')
    .select(
      'season_number, season_label, hero_eyebrow, hero_title, course_intro, banner_badge, banner_title, registration_deadline, start_date'
    )
    .eq('active', true)
    .order('season_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapSeasonRow(data as SeasonSettingsRow) : fallbackSeasonSettings;
}
