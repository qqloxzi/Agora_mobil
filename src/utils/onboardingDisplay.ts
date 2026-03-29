import { onboardingQuestions } from '../data/onboardingQuestions';

const LEVEL_OPTIONS = onboardingQuestions.find((q) => q.id === 'level')?.options ?? [];
const DIFF_OPTIONS = onboardingQuestions.find((q) => q.id === 'difficulties')?.options ?? [];
const INTERNAL_GOAL_OPTIONS = onboardingQuestions.find((q) => q.id === 'internalGoals')?.options ?? [];
const TRAINING_OPTIONS = onboardingQuestions.find((q) => q.id === 'trainingMethods')?.options ?? [];
const CLUB_OPTIONS = onboardingQuestions.find((q) => q.id === 'clubMembership')?.options ?? [];
const PLAYING_DURATION_OPTIONS = onboardingQuestions.find((q) => q.id === 'playingDuration')?.options ?? [];

export function getLevelLabel(value: string | undefined | null) {
  const found = LEVEL_OPTIONS.find((o) => o.value === value)?.label;
  return found ?? (value ? String(value) : '—');
}

export function getDifficultyLabel(value: string) {
  return DIFF_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getInternalGoalLabel(value: string) {
  return INTERNAL_GOAL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getTrainingMethodLabel(value: string) {
  return TRAINING_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getClubLabel(value: string) {
  return CLUB_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function getPlayingDurationLabel(value: string) {
  return PLAYING_DURATION_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function parseTargetGoal(value: string) {
  if (!value) return { label: '—', rank: 15 };
  if (value === '1d') return { label: '1 Dan', rank: 0 };
  const m = /^(\d+)k$/.exec(value);
  if (m) {
    const n = parseInt(m[1], 10);
    return { label: `${n} Kyu`, rank: n };
  }
  return { label: value, rank: 15 };
}

export function weeklyHoursToPercent(weeklyHours: string) {
  switch (weeklyHours) {
    case 'extra-none':
      return 0;
    case '1-2':
      return 50;
    case '3-plus':
      return 100;
    case '3-4':
      return 66;
    case '5-plus':
      return 100;
    default:
      return 0;
  }
}

export function getWeeklyHoursLabel(weeklyHours: string) {
  const q = onboardingQuestions.find((q) => q.id === 'weeklyHours');
  const found = q?.options?.find((o) => o.value === weeklyHours)?.label;
  if (found) return found;
  switch (weeklyHours) {
    case '1-2':
      return '1–2 saat';
    case '3-4':
      return '3–4 saat';
    case '5-plus':
      return '5+ saat';
    default:
      return '—';
  }
}
