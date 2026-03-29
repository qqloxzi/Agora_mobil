import { supabase } from './supabase';

export function logSupabaseError(prefix: string, error: any) {
  if (error == null) return;
  const o =
    typeof error === 'object' && error !== null
      ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      : { raw: error };
  console.error(prefix, o);
}

function rowWeaknesses(row: any) {
  if (!row || typeof row !== 'object') return null;
  const w = row.weaknesses ?? row.onboarding_difficulties;
  return w;
}

function rowCurrentLevel(row: any) {
  if (!row || typeof row !== 'object') return '';
  const v = row.current_level ?? row.onboarding_level;
  return v != null ? String(v) : '';
}

function rowWeeklyStudyHours(row: any) {
  if (!row || typeof row !== 'object') return '';
  const v = row.weekly_study_hours ?? row.onboarding_weekly_hours;
  return v != null ? String(v) : '';
}

function rowInnerGoals(row: any) {
  if (!row || typeof row !== 'object') return null;
  const ig = row.inner_goals;
  if (Array.isArray(ig)) return ig.map(String);
  return null;
}

function rowStudyMethods(row: any) {
  if (!row || typeof row !== 'object') return null;
  const sm = row.study_methods;
  if (Array.isArray(sm)) return sm.map(String);
  return null;
}

function rowTargetLeagueLevel(row: any) {
  if (!row || typeof row !== 'object') return '';
  const v = row.target_league_level ?? row.onboarding_target_league_level;
  return v != null ? String(v) : '';
}

export function profileRowHasOnboardingContent(row: any) {
  if (!row || typeof row !== 'object') return false;
  const w = rowWeaknesses(row);
  return Boolean(
    row.onboarding_completed_at ||
      row.current_level ||
      row.onboarding_level ||
      row.preferred_name ||
      row.onboarding_motivation ||
      row.club_membership ||
      row.onboarding_tournament ||
      row.weekly_study_hours ||
      row.onboarding_weekly_hours ||
      row.onboarding_target_goal ||
      row.target_league_level ||
      row.onboarding_target_league_level ||
      row.playing_duration ||
      row.experience_duration ||
      (Array.isArray(w) && w.length > 0) ||
      (Array.isArray(row.inner_goals) && row.inner_goals.length > 0) ||
      (Array.isArray(row.study_methods) && row.study_methods.length > 0)
  );
}

export function parseOnboardingTargetGoalColumn(raw: any) {
  const empty = {
    playingDuration: '',
    internalGoals: [] as string[],
    trainingMethods: [] as string[],
    legacyTargetGoal: '',
  };
  if (raw == null || raw === '') return empty;
  const s = String(raw).trim();
  if (s.startsWith('{')) {
    try {
      const o = JSON.parse(s);
      if (o && o.v === 2) {
        return {
          playingDuration: typeof o.pd === 'string' ? o.pd : '',
          internalGoals: Array.isArray(o.ig) ? o.ig.map(String) : [],
          trainingMethods: Array.isArray(o.tm) ? o.tm.map(String) : [],
          legacyTargetGoal: '',
        };
      }
    } catch {
      return empty;
    }
  }
  return { ...empty, legacyTargetGoal: s };
}

export function serializeOnboardingTargetGoalExtras(extras: any) {
  const pd = extras.playingDuration != null ? String(extras.playingDuration) : '';
  const ig = Array.isArray(extras.internalGoals)
    ? extras.internalGoals.map((x: any) => String(x))
    : [];
  const tm = Array.isArray(extras.trainingMethods)
    ? extras.trainingMethods.map((x: any) => String(x))
    : [];
  return JSON.stringify({ v: 2, pd, ig, tm });
}

export function answersHaveOnboardingContent(answers: any) {
  if (!answers || typeof answers !== 'object') return false;
  return Boolean(
    answers.level ||
      answers.preferredName ||
      answers.clubMembership ||
      answers.playingDuration ||
      answers.motivation ||
      answers.tournament ||
      answers.weeklyHours ||
      answers.targetGoal ||
      (Array.isArray(answers.difficulties) && answers.difficulties.length > 0) ||
      (Array.isArray(answers.internalGoals) && answers.internalGoals.length > 0) ||
      (Array.isArray(answers.trainingMethods) && answers.trainingMethods.length > 0) ||
      (answers.target_league_level != null && String(answers.target_league_level).trim() !== '')
  );
}

export function mapProfileRowToAnswers(row: any) {
  if (!row) return null;
  const difficultiesRaw = rowWeaknesses(row);
  const difficulties = Array.isArray(difficultiesRaw)
    ? difficultiesRaw.map((x) => String(x))
    : [];

  let innerFromCols = rowInnerGoals(row);
  let methodsFromCols = rowStudyMethods(row);
  const extras = parseOnboardingTargetGoalColumn(row.onboarding_target_goal);

  if (!innerFromCols || innerFromCols.length === 0) {
    innerFromCols =
      extras.internalGoals.length > 0 ? extras.internalGoals : [];
  }
  if (!methodsFromCols || methodsFromCols.length === 0) {
    methodsFromCols =
      extras.trainingMethods.length > 0 ? extras.trainingMethods : [];
  }

  const playingDuration =
    row.experience_duration != null && String(row.experience_duration).trim() !== ''
      ? String(row.experience_duration).trim()
      : row.playing_duration != null && String(row.playing_duration).trim() !== ''
        ? String(row.playing_duration).trim()
        : extras.playingDuration;

  return {
    preferredName:
      row.preferred_name != null
        ? String(row.preferred_name)
        : row.onboarding_motivation != null
          ? String(row.onboarding_motivation)
          : '',
    clubMembership:
      row.club_membership != null
        ? String(row.club_membership)
        : row.onboarding_tournament != null
          ? String(row.onboarding_tournament)
          : '',
    level: rowCurrentLevel(row),
    difficulties,
    weeklyHours: rowWeeklyStudyHours(row),
    playingDuration,
    internalGoals: innerFromCols,
    trainingMethods: methodsFromCols,
    targetGoal: extras.legacyTargetGoal,
    target_league_level: rowTargetLeagueLevel(row),
    motivation: '',
    tournament: '',
  };
}

export function mapAnswersToSupabaseProfilesPayload(answers: any, completedAtIso: string) {
  const difficulties = Array.isArray(answers.difficulties)
    ? answers.difficulties.map((x: any) => String(x))
    : [];
  const innerGoals = Array.isArray(answers.internalGoals)
    ? answers.internalGoals.map((x: any) => String(x))
    : [];
  const studyMethods = Array.isArray(answers.trainingMethods)
    ? answers.trainingMethods.map((x: any) => String(x))
    : [];

  const levelRaw = answers.level;
  const current_level =
    levelRaw != null && String(levelRaw).trim() !== '' ? String(levelRaw).trim() : null;

  const weeklyRaw = answers.weeklyHours;

  const nameRaw = answers.preferredName;
  const clubRaw = answers.clubMembership;
  const experienceRaw = answers.playingDuration;

  const targetLeagueRaw = answers.target_league_level;
  const target_league_level =
    targetLeagueRaw != null && String(targetLeagueRaw).trim() !== ''
      ? String(targetLeagueRaw).trim()
      : null;

  const preferred_name =
    nameRaw != null && String(nameRaw).trim() !== '' ? String(nameRaw).trim() : null;
  const club_membership =
    clubRaw != null && String(clubRaw).trim() !== '' ? String(clubRaw).trim() : null;
  const experience_duration =
    experienceRaw != null && String(experienceRaw).trim() !== ''
      ? String(experienceRaw).trim()
      : null;

  return {
    current_level,
    weaknesses: difficulties.length > 0 ? difficulties : null,
    inner_goals: innerGoals.length > 0 ? innerGoals : null,
    study_methods: studyMethods.length > 0 ? studyMethods : null,
    weekly_study_hours:
      weeklyRaw != null && String(weeklyRaw).trim() !== '' ? String(weeklyRaw).trim() : null,
    preferred_name,
    club_membership,
    experience_duration,
    target_league_level,
    onboarding_completed_at: completedAtIso,
  };
}

export function mapAnswersToProfilePayload(answers: any, completedAtIso: string) {
  return mapAnswersToSupabaseProfilesPayload(answers, completedAtIso);
}

export function buildOnboardingUpsertRow(userId: string, answers: any, completedAtIso: string) {
  return {
    id: userId,
    ...mapAnswersToSupabaseProfilesPayload(answers, completedAtIso),
  };
}

export const ONBOARDING_PROFILE_DB_COLUMNS = [
  'current_level',
  'weaknesses',
  'inner_goals',
  'study_methods',
  'weekly_study_hours',
  'preferred_name',
  'club_membership',
  'experience_duration',
  'target_league_level',
  'onboarding_completed_at',
] as const;

export const PROFILE_ONBOARDING_SELECT = [
  'id',
  ...ONBOARDING_PROFILE_DB_COLUMNS,
  'kyu_level',
  'xp',
].join(', ');

const UPSERT_RETURN_SELECT = '*';

export async function fetchProfileOnboarding(client = supabase, userId: string): Promise<{ data: any | null, error: Error | null }> {
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    logSupabaseError('[fetchProfileOnboarding]', error);
    return { data: null, error: error as any };
  }
  return { data, error: null };
}

export async function saveOnboardingToProfile(client = supabase, userId: string, answers: any): Promise<{ data: any | null, error: Error | null }> {
  try {
    const completedAtIso = new Date().toISOString();
    const row = buildOnboardingUpsertRow(userId, answers, completedAtIso);

    const { data, error } = await client
      .from('profiles')
      .upsert(row, { onConflict: 'id' as any })
      .select(UPSERT_RETURN_SELECT)
      .maybeSingle();

    if (error) {
      logSupabaseError('[saveOnboardingToProfile] upsert failed', error);
      return { data: null, error: error as any };
    }
    return { data: data ?? null, error: null };
  } catch (err) {
    console.error('[saveOnboardingToProfile] unexpected throw', err);
    const e = err instanceof Error ? err : new Error(String(err));
    return { data: null, error: e };
  }
}

function normalizeDifficultyList(raw: any) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map((x) => String(x));
    } catch {
      /* single value */
    }
    return raw.trim() === '' ? [] : [raw];
  }
  return [String(raw)];
}

function normalizeLevel(value: any) {
  if (value == null) return '';
  return String(value).trim();
}

function savedWeaknessesList(data: any) {
  if (!data || typeof data !== 'object') return [];
  const w = data.weaknesses ?? data.onboarding_difficulties;
  return normalizeDifficultyList(w);
}

function savedCurrentLevel(data: any) {
  if (!data || typeof data !== 'object') return '';
  return normalizeLevel(data.current_level ?? data.onboarding_level);
}

function savedTargetLeague(data: any) {
  if (!data || typeof data !== 'object') return '';
  return normalizeLevel(data.target_league_level ?? data.onboarding_target_league_level);
}

export function verifyOnboardingSaveRow(data: any, answers: any) {
  if (!data || typeof data !== 'object') return false;
  if (!data.onboarding_completed_at) return false;
  const wantLevel = normalizeLevel(answers?.level);
  const gotLevel = savedCurrentLevel(data);
  if (wantLevel !== gotLevel) return false;
  const a = normalizeDifficultyList(answers?.difficulties)
    .sort()
    .join('\0');
  const b = savedWeaknessesList(data)
    .sort()
    .join('\0');
  if (a !== b) return false;
  const wantLeague = normalizeLevel(answers?.target_league_level);
  if (wantLeague !== '') {
    const gotLeague = savedTargetLeague(data);
    if (wantLeague !== gotLeague) return false;
  }
  return true;
}

export async function profileOnboardingIsComplete(client = supabase, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[profiles] Onboarding kontrolü atlandı:', error.message);
    return true;
  }
  if (!data) return false;
  return Boolean(data.onboarding_completed_at);
}
