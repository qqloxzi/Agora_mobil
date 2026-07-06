import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Award, Crosshair, Sparkles, Target, Zap, Shield, User } from 'lucide-react-native';
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

type ProfileStatTileProps = {
  icon: any;
  iconBgClass: string;
  iconColor: string;
  value: string | null;
  label: string;
};

function ProfileStatTile({ icon: Icon, iconBgClass, iconColor, value, label }: ProfileStatTileProps) {
  const display = value != null && String(value).trim() !== '' ? String(value) : '—';
  return (
    <View className="flex-row items-center gap-4 rounded-2xl border border-primary-blue/10 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 w-full mb-4">
      <View className={`h-11 w-11 items-center justify-center rounded-xl ${iconBgClass}`}>
        <Icon size={24} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-slate-900 dark:text-white">{display}</Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
      </View>
    </View>
  );
}

function WeeklyRing({ percent, centerLabel, sublabel }: { percent: number; centerLabel: string; sublabel: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <View className="relative h-36 w-36 items-center justify-center">
      <Svg viewBox="0 0 120 120" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#93c5fd" />
            <Stop offset="50%" stopColor="#e0f2fe" />
            <Stop offset="100%" stopColor="#ffffff" />
          </LinearGradient>
        </Defs>
        <Circle cx="60" cy="60" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
        <Circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </Svg>
      <View className="items-center px-2">
        <Text className="text-base font-bold text-slate-900 dark:text-white text-center">
          {centerLabel}
        </Text>
        <Text className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-slate-500 dark:text-slate-400 text-center">
          {sublabel}
        </Text>
      </View>
    </View>
  );
}

function JourneyPath({ fromLabel, targetLabel }: { fromLabel: string; targetLabel: string }) {
  return (
    <View className="w-full py-4 flex-row items-center justify-between relative px-2">
       <View className="absolute left-[20%] right-[20%] top-1/2 h-0.5 bg-slate-200 dark:bg-slate-700" style={{ transform: [{ translateY: -1 }] }} />
       <View className="items-center z-10 bg-white dark:bg-slate-900 p-1">
          <View className="h-4 w-4 rounded-full border-2 border-accent-blue bg-white dark:bg-slate-900 mb-2" />
          <Text className="font-bold text-xs text-slate-900 dark:text-white">{fromLabel}</Text>
          <Text className="text-[9px] uppercase tracking-widest text-slate-500">Mevcut</Text>
       </View>
       <View className="items-center z-10 bg-white dark:bg-slate-900 p-1">
          <View className="h-10 w-10 items-center justify-center rounded-full border border-amber-400/50 bg-amber-400/20 mb-2">
             <Target size={20} color="#f59e0b" />
          </View>
          <Text className="font-bold text-xs text-slate-900 dark:text-white">{targetLabel}</Text>
          <Text className="text-[9px] uppercase tracking-widest text-slate-500">Hedef</Text>
       </View>
    </View>
  );
}

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
  const onProfilePage = variant === 'profilePage';
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

  if (onProfilePage) {
    const preferredNameVal =
      pf.preferredName != null && String(pf.preferredName).trim() !== ''
        ? String(pf.preferredName).trim()
        : null;
    const xpVal =
      pf.xp != null && typeof pf.xp === 'number'
        ? pf.xp
        : gs.xp != null && typeof gs.xp === 'number'
          ? gs.xp
          : null;
    const rankVal = gs.rank != null && String(gs.rank).trim() !== '' ? String(gs.rank).trim() : null;
    const targetDisplay = heroTargetLabel ?? (leagueLevelRaw || null);
    const hasDetail = (hoursLabel && hoursLabel !== '—') || playingLabel || difficulties.length > 0 || internalGoals.length > 0;

    return (
      <View className="w-full flex-col gap-6">
        <Text className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Gelişim Özeti
        </Text>

        <View className="flex-col w-full">
          <ProfileStatTile
            icon={User}
            iconBgClass="bg-violet-100 dark:bg-violet-900/40"
            iconColor="#7c3aed"
            value={preferredNameVal}
            label="Tercih edilen isim"
          />
          <ProfileStatTile
            icon={Zap}
            iconBgClass="bg-accent-blue/15 dark:bg-accent-blue/25"
            iconColor="#0ea5e9"
            value={xpVal != null ? xpVal.toLocaleString('tr-TR') : null}
            label="Toplam XP"
          />
          <ProfileStatTile
            icon={Target}
            iconBgClass="bg-amber-100 dark:bg-amber-900/40"
            iconColor="#d97706"
            value={targetDisplay}
            label="Hedef lig seviyesi"
          />
          <ProfileStatTile
            icon={Award}
            iconBgClass="bg-slate-100 dark:bg-slate-800"
            iconColor="#475569"
            value={levelLabel !== '—' ? levelLabel : null}
            label="Mevcut seviye"
          />
          <ProfileStatTile
            icon={Shield}
            iconBgClass="bg-primary-blue/10 dark:bg-primary-blue/25"
            iconColor="#2563eb"
            value={rankVal}
            label="Mevcut lig"
          />
        </View>

        {hasDetail && (
          <View className="rounded-2xl border border-primary-blue/10 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {hoursLabel && hoursLabel !== '—' && (
              <Text className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <Text className="font-semibold text-slate-900 dark:text-white">Haftalık çalışma: </Text>
                {hoursLabel}
              </Text>
            )}
            {playingLabel && (
              <Text className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <Text className="font-semibold text-slate-900 dark:text-white">Go deneyimi: </Text>
                {playingLabel}
              </Text>
            )}
            {difficulties.length > 0 && (
              <Text className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <Text className="font-semibold text-slate-900 dark:text-white">Odak alanları: </Text>
                {difficulties.map((d) => getDifficultyLabel(d)).join(', ')}
              </Text>
            )}
            {internalGoals.length > 0 && (
              <Text className="text-sm text-slate-600 dark:text-slate-400">
                <Text className="font-semibold text-slate-900 dark:text-white">İçsel hedefler: </Text>
                {internalGoals.map((g) => getInternalGoalLabel(g)).join(', ')}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // default / full variant
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

         <View className="rounded-3xl border border-primary-blue/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 items-center">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Haftalık Hedef</Text>
            <WeeklyRing percent={pct} centerLabel={hoursLabel} sublabel="Haftalık Şçalışma" />
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
               <JourneyPath fromLabel={levelLabel} targetLabel={leagueTargetParsed.label} />
            ) : legacyTarget ? (
               <JourneyPath fromLabel={levelLabel} targetLabel={legacyTarget.label} />
            ) : (
               <Text className="text-sm text-center text-slate-500">Hedef seçimi yapılmamış.</Text>
            )}
         </View>
      </View>
    </View>
  );
}
