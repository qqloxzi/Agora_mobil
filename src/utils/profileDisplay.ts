import { getLevelLabel } from './onboardingDisplay';

export function resolveDisplayRank(profilesRow: any, agorasRankText: string | null | undefined) {
  const kyu = profilesRow?.kyu_level;
  if (typeof kyu === 'number' && !Number.isNaN(kyu)) {
    const pct = Math.max(0, Math.min(100, ((30 - kyu) / 30) * 100));
    const next = Math.max(1, kyu - 1);
    return {
      primaryLabel: `${kyu} Kyu`,
      detail: 'Kayıtlı Kyu (profiles)',
      nextRank: `${next} Kyu`,
      masterPercent: pct,
      showMasterBar: true,
      source: 'profiles_kyu',
    };
  }

  const rankStr = typeof agorasRankText === 'string' ? agorasRankText.trim() : '';
  if (rankStr) {
    const m = rankStr.match(/(\d+)\s*Kyu/i);
    if (m) {
      const kyuValue = parseInt(m[1], 10);
      const pct = Math.max(0, Math.min(100, ((30 - kyuValue) / 30) * 100));
      return {
        primaryLabel: rankStr,
        detail: 'Lig / kayıt (agorasusers)',
        nextRank: `${Math.max(1, kyuValue - 1)} Kyu`,
        masterPercent: pct,
        showMasterBar: true,
        source: 'agoras_rank',
      };
    }
    if (rankStr.toLowerCase().includes('dan')) {
      return {
        primaryLabel: rankStr,
        detail: 'Lig / kayıt (agorasusers)',
        nextRank: '—',
        masterPercent: 100,
        showMasterBar: true,
        source: 'agoras_rank',
      };
    }
  }

  const ob = profilesRow?.current_level ?? profilesRow?.onboarding_level;
  if (ob) {
    return {
      primaryLabel: getLevelLabel(String(ob)),
      detail: 'Anket — seviye aralığı (tek başına Kyu yerine geçmez)',
      nextRank: '—',
      masterPercent: null,
      showMasterBar: false,
      source: 'onboarding_only',
    };
  }

  return {
    primaryLabel: '—',
    detail: null,
    nextRank: '—',
    masterPercent: null,
    showMasterBar: false,
    source: 'none',
  };
}

export function resolveXpDisplay(profilesXp: any, agorasXp: any) {
  const x = typeof profilesXp === 'number' && !Number.isNaN(profilesXp) ? profilesXp : null;
  const y = typeof agorasXp === 'number' && !Number.isNaN(agorasXp) ? agorasXp : null;
  const value = x ?? y ?? 0;
  const barPercent = value <= 100 ? value : Math.min(100, (value / 5000) * 100);
  return { value, barPercent };
}
