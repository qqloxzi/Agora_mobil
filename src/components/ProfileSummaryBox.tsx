import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { getLevelLabel } from '../utils/onboardingDisplay';

type ProfileSummaryBoxProps = {
  variant?: 'default' | 'compact';
};

export function ProfileSummaryBox({ variant = 'default' }: ProfileSummaryBoxProps) {
  const [loading, setLoading] = useState(true);
  const [kyuLabel, setKyuLabel] = useState('—');
  const [xp, setXp] = useState<number | null>(null);
  const [barPct, setBarPct] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) {
            setKyuLabel('Misafir');
            setXp(null);
            setBarPct(0);
          }
          return;
        }

        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!cancelled && prof && !profErr) {
          const k = prof.kyu_level;
          if (typeof k === 'number' && !Number.isNaN(k)) {
            const xpVal = typeof prof.xp === 'number' ? prof.xp : 0;
            setKyuLabel(`${k} Kyu`);
            setXp(xpVal);
            setBarPct(Math.min(100, xpVal <= 100 ? xpVal : (xpVal / 5000) * 100));
            return;
          }
          const obLevel = prof.current_level ?? prof.onboarding_level;
          if (obLevel) {
            const xpVal = typeof prof.xp === 'number' ? prof.xp : 0;
            setKyuLabel(getLevelLabel(String(obLevel)));
            setXp(xpVal);
            setBarPct(Math.min(100, xpVal <= 100 ? xpVal : (xpVal / 5000) * 100));
            return;
          }
        }

        const { data: ag } = await supabase
          .from('agorasusers')
          .select('rank, xp')
          .eq('id', user.id)
          .maybeSingle();

        if (!cancelled && ag) {
          const rankText = typeof ag.rank === 'string' ? ag.rank.trim() : '';
          const xpVal = typeof ag.xp === 'number' ? ag.xp : 0;
          setKyuLabel(rankText || '—');
          setXp(xpVal);
          setBarPct(Math.min(100, xpVal > 0 ? (xpVal <= 100 ? xpVal : (xpVal / 5000) * 100) : 0));
        } else if (!cancelled) {
          setKyuLabel('—');
          setXp(0);
          setBarPct(0);
        }
      } catch {
        if (!cancelled) {
          setKyuLabel('—');
          setXp(null);
          setBarPct(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const xpDisplay = loading ? '…' : xp === null ? '—' : xp.toLocaleString('tr-TR');

  if (variant === 'compact') {
    return (
      <View className="flex-col gap-1 rounded-lg border border-slate-200/50 bg-white/50 px-3 py-2 shadow-sm w-[216px] dark:border-slate-700/50 dark:bg-slate-800/50">
        <View className="flex-row items-center justify-between">
          {loading ? (
             <ActivityIndicator size="small" color="#d97706" className="mr-2" />
          ) : (
             <Text className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100 flex-1" numberOfLines={1}>
                {kyuLabel}
             </Text>
          )}
          <Text className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums ml-2">
            {xpDisplay} XP
          </Text>
        </View>
        <View className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <View
            className="h-full bg-amber-500 rounded-full"
            style={{ width: `${loading ? 0 : barPct}%` }}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
      <Text className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Profil Özeti
      </Text>
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] uppercase tracking-widest text-slate-400">Seviye</Text>
          <Text className="text-sm font-semibold text-primary-blue dark:text-white">
            {loading ? '…' : kyuLabel}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] uppercase tracking-widest text-slate-400">XP</Text>
          <Text className="text-sm font-semibold text-amber-600 dark:text-amber-500">
            {xpDisplay}
          </Text>
        </View>
      </View>
      <View className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <View
          className="h-full bg-amber-500 rounded-full"
          style={{ width: `${loading ? 0 : barPct}%` }}
        />
      </View>
    </View>
  );
}
