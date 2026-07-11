import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Award, Target, Zap, Shield, Clock, BookOpen, Crosshair } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  getDifficultyLabel,
  getInternalGoalLabel,
  getLevelLabel,
  getPlayingDurationLabel,
  getWeeklyHoursLabel,
  parseTargetGoal,
  weeklyHoursToPercent,
} from '../../utils/onboardingDisplay';

// ─── XP Progress Bar ────────────────────────────────────────────────────────
function XpBar({ xp }: { xp: number | null }) {
  const MAX_XP = 1000;
  const pct = xp != null ? Math.min(Math.round((xp / MAX_XP) * 100), 100) : 0;
  return (
    <View className="w-full">
      <View className="flex-row justify-between mb-1">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">XP</Text>
        <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {xp != null ? xp.toLocaleString('tr-TR') : '—'} / {MAX_XP.toLocaleString('tr-TR')}
        </Text>
      </View>
      <View className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <View
          className="h-full rounded-full bg-accent-blue"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}

// ─── Compact Chip ────────────────────────────────────────────────────────────
function Chip({ icon: Icon, iconColor, label, value }: {
  icon: any; iconColor: string; label: string; value: string | null;
}) {
  const display = value && value.trim() !== '' ? value : '—';
  return (
    <View className="flex-row items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2 flex-1">
      <Icon size={14} color={iconColor} />
      <View className="flex-1">
        <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</Text>
        <Text className="text-xs font-bold text-slate-800 dark:text-white" numberOfLines={1}>{display}</Text>
      </View>
    </View>
  );
}

// ─── Stat Row ────────────────────────────────────────────────────────────────
function StatRow({ icon: Icon, iconColor, text }: { icon: any; iconColor: string; text: string }) {
  return (
    <View className="flex-row items-center gap-2 py-1.5">
      <Icon size={13} color={iconColor} />
      <Text className="text-xs text-slate-600 dark:text-slate-300 flex-1">{text}</Text>
    </View>
  );
}

// ─── Weekly Ring (mini) ──────────────────────────────────────────────────────
function MiniRing({ percent }: { percent: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44" style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx="22" cy="22" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="5" />
      <Circle
        cx="22" cy="22" r={r} fill="none"
        stroke="#0ea5e9" strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
      />
    </Svg>
  );
}

// ─── Journey Path (compact) ──────────────────────────────────────────────────
function CompactJourneyPath({ from, to }: { from: string; to: string }) {
  return (
    <View className="flex-row items-center gap-2 mt-1">
      <View className="flex-1 items-center">
        <View className="h-2 w-2 rounded-full bg-accent-blue mb-1" />
        <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Mevcut</Text>
        <Text className="text-xs font-bold text-slate-800 dark:text-white">{from}</Text>
      </View>
      <View className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      <View className="flex-1 items-center">
        <View className="h-2 w-2 rounded-full bg-amber-400 mb-1" />
        <Text className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Hedef</Text>
        <Text className="text-xs font-bold text-amber-500 dark:text-amber-400">{to}</Text>
      </View>
    </View>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function GrowthJourneyShowcase({
  answers,
  onUpdateClick,
  variant = 'default',
  gameStats,
  profileFields,
}: {
  answers: any;
  onUpdateClick?: () => void;
  variant?: 'default' | 'profilePage';
  gameStats?: { xp?: number | null; rank?: string | null };
  profileFields?: {
    preferredName?: string | null;
    targetLeagueLevel?: string | null;
    xp?: number | null;
  };
}) {
  const gs = gameStats ?? {};
  const pf = profileFields ?? {};
  const levelLabel = getLevelLabel(answers.level);
  const difficulties: string[] = answers.difficulties ?? [];
  const internalGoals: string[] = Array.isArray(answers.internalGoals) ? answers.internalGoals : [];
  const pct = weeklyHoursToPercent(answers.weeklyHours);
  const hoursLabel = getWeeklyHoursLabel(answers.weeklyHours);
  const playingLabel = answers.playingDuration ? getPlayingDurationLabel(String(answers.playingDuration)) : null;

  const legacyTarget = answers.targetGoal ? parseTargetGoal(answers.targetGoal) : null;
  const leagueLevelRaw =
    pf.targetLeagueLevel != null && String(pf.targetLeagueLevel).trim() !== ''
      ? String(pf.targetLeagueLevel).trim()
      : answers.target_league_level != null
        ? String(answers.target_league_level).trim()
        : '';
  const leagueTargetParsed = leagueLevelRaw ? parseTargetGoal(leagueLevelRaw) : null;
  const heroTargetLabel = leagueTargetParsed?.label ?? (legacyTarget ? legacyTarget.label : null);

  const xpVal =
    pf.xp != null && typeof pf.xp === 'number'
      ? pf.xp
      : gs.xp != null && typeof gs.xp === 'number'
        ? gs.xp
        : null;
  const rankVal = gs.rank != null && String(gs.rank).trim() !== '' ? String(gs.rank).trim() : null;
  const targetDisplay = heroTargetLabel ?? (leagueLevelRaw || null);

  if (variant === 'profilePage') {
    const detailRows: { icon: any; iconColor: string; text: string }[] = [];
    if (hoursLabel && hoursLabel !== '—') detailRows.push({ icon: Clock, iconColor: '#0ea5e9', text: `Haftalık çalışma: ${hoursLabel}` });
    if (playingLabel) detailRows.push({ icon: BookOpen, iconColor: '#7c3aed', text: `Go deneyimi: ${playingLabel}` });
    if (difficulties.length > 0) detailRows.push({ icon: Crosshair, iconColor: '#d97706', text: `Odak: ${difficulties.map((d) => getDifficultyLabel(d)).join(', ')}` });
    if (internalGoals.length > 0) detailRows.push({ icon: Target, iconColor: '#10b981', text: internalGoals.map((g) => getInternalGoalLabel(g)).join(', ') });

    return (
      <View className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-dark-card p-4 mb-0">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Zap size={14} color="#0ea5e9" />
            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-accent-blue">Gelişim Özeti</Text>
          </View>
          {onUpdateClick && (
            <TouchableOpacity
              onPress={onUpdateClick}
              className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1"
            >
              <Text className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Güncelle</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* XP Bar */}
        <XpBar xp={xpVal} />

        {/* Chips row */}
        <View className="flex-row gap-2 mt-3">
          <Chip icon={Award} iconColor="#f59e0b" label="Seviye" value={levelLabel !== '—' ? levelLabel : null} />
          <Chip icon={Shield} iconColor="#2563eb" label="Lig" value={rankVal} />
        </View>

        {/* Target row */}
        {(levelLabel !== '—' || targetDisplay) && (
          <View className="mt-3">
            <CompactJourneyPath
              from={levelLabel !== '—' ? levelLabel : '—'}
              to={targetDisplay ?? '—'}
            />
          </View>
        )}

        {/* Detail rows */}
        {detailRows.length > 0 && (
          <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            {detailRows.map((row, i) => (
              <StatRow key={i} icon={row.icon} iconColor={row.iconColor} text={row.text} />
            ))}
          </View>
        )}
      </View>
    );
  }

  // ── default / full variant ──────────────────────────────────────────────
  return (
    <View className="mb-12 w-full">
      <View className="flex-row items-center justify-between w-full mb-8">
        <View className="flex-1">
          <Text className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Gelişim Yolculuğum
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            Anket sırasında paylaştığınız tercihler.
          </Text>
        </View>
        {onUpdateClick && (
          <TouchableOpacity onPress={onUpdateClick} className="ml-4 rounded-full bg-slate-900 dark:bg-white px-4 py-2">
            <Text className="text-white dark:text-slate-900 text-xs font-bold">Güncelle</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-col gap-5">
        <View className="rounded-3xl border border-primary-blue/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Mevcut Seviye</Text>
              <Text className="text-3xl font-extrabold text-slate-900 dark:text-white">{levelLabel}</Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20">
              <Award size={24} color="#f59e0b" />
            </View>
          </View>
        </View>

        <View className="rounded-3xl border border-primary-blue/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <View className="flex-row items-center gap-2 mb-4">
            <Crosshair size={20} color="#0ea5e9" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Odak Alanlarım</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {difficulties.length === 0 ? (
              <Text className="text-sm text-slate-400">Henüz seçim yok</Text>
            ) : (
              difficulties.map((d) => (
                <View key={d} className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3 py-1.5">
                  <Text className="text-xs font-semibold text-slate-900 dark:text-white">{getDifficultyLabel(d)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View className="rounded-3xl border border-primary-blue/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 flex-row items-center gap-5">
          <MiniRing percent={pct} />
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Haftalık Hedef</Text>
            <Text className="text-base font-bold text-slate-900 dark:text-white">{hoursLabel}</Text>
          </View>
        </View>

        <View className="rounded-3xl border border-primary-blue/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <View className="flex-row items-center justify-center gap-2 mb-6">
            <Target size={20} color="#f59e0b" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hedefiniz</Text>
          </View>
          {internalGoals.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 justify-center">
              {internalGoals.map((g) => (
                <View key={g} className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3 py-1.5">
                  <Text className="text-xs font-semibold text-slate-900 dark:text-white text-center">{getInternalGoalLabel(g)}</Text>
                </View>
              ))}
            </View>
          ) : leagueTargetParsed ? (
            <CompactJourneyPath from={levelLabel} to={leagueTargetParsed.label} />
          ) : legacyTarget ? (
            <CompactJourneyPath from={levelLabel} to={legacyTarget.label} />
          ) : (
            <Text className="text-sm text-center text-slate-500">Hedef seçimi yapılmamış.</Text>
          )}
        </View>
      </View>
    </View>
  );
}
