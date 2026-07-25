import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { supabase } from '../../lib/supabase';
import {
  extractProfileDisplayFields,
  fetchProfileOnboarding,
} from '../../lib/profileOnboarding';

function metaString(meta: User['user_metadata'], key: string): string | null {
  const v = meta?.[key];
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t !== '' ? t : null;
}

function resolveAvatarUrl(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return (
    metaString(meta, 'avatar_url') ||
    metaString(meta, 'picture') ||
    metaString(meta, 'photo') ||
    metaString(meta, 'avatar')
  );
}

function resolveAuthDisplayName(user: User): string | null {
  return (
    metaString(user.user_metadata, 'full_name') ||
    metaString(user.user_metadata, 'name') ||
    (user.email ? user.email.split('@')[0] : null) ||
    null
  );
}

export function HomeUserChip() {
  const { user } = useAuth();
  const { answers } = useOnboarding();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      return;
    }

    let cancelled = false;

    async function load() {
      const [{ data: profRow }, agResult] = await Promise.all([
        fetchProfileOnboarding(supabase, user!.id),
        supabase.from('agorasusers').select('username').eq('id', user!.id).maybeSingle(),
      ]);
      if (cancelled) return;

      const profileSnapshot = extractProfileDisplayFields(profRow);
      const onboardingName =
        answers?.preferredName != null ? String(answers.preferredName).trim() : '';
      const aUsername =
        typeof agResult.data?.username === 'string' ? agResult.data.username.trim() : '';

      setDisplayName(
        profileSnapshot.preferredName ||
          onboardingName ||
          aUsername ||
          resolveAuthDisplayName(user!) ||
          'Oyuncu'
      );
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, answers?.preferredName]);

  if (!user) return null;

  const name = displayName || resolveAuthDisplayName(user) || 'Oyuncu';
  const avatarUrl = resolveAvatarUrl(user);
  const initial = (name[0] ?? '?').toUpperCase();

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/profile')}
      className="flex-row items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 py-1.5 pl-1.5 pr-3 active:opacity-80 dark:border-slate-600/80 dark:bg-slate-800/90"
      style={{ maxWidth: 220 }}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700"
        />
      ) : (
        <View className="h-8 w-8 items-center justify-center rounded-full bg-accent-blue">
          <Text className="text-sm font-bold text-white">{initial}</Text>
        </View>
      )}
      <Text
        className="flex-shrink text-sm font-semibold text-slate-800 dark:text-slate-100"
        numberOfLines={1}
      >
        {name}
      </Text>
    </Pressable>
  );
}
