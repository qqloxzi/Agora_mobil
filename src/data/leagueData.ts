import { supabase } from '../lib/supabase';
import { leagueData as staticLeagueData } from './gravityContent';

export type LeaguePlayer = {
  id: string;
  name: string;
};

export type LeagueMatch = {
  id: string;
  week: number;
  p1Id: string;
  p2Id: string;
  winnerId: string | null;
};

export type League = {
  id: number;
  name: string;
  sub: string;
  status: string;
  players: LeaguePlayer[];
  matches: LeagueMatch[];
};

type LeagueGroupRow = {
  id: number;
  name: string;
  sub: string;
  status: string | null;
  sort_order: number | null;
};

type LeaguePlayerRow = {
  id: string;
  league_id: number;
  name: string;
  sort_order: number | null;
  active: boolean | null;
};

type LeagueMatchResultRow = {
  league_id: number;
  week: number;
  winner_player_id: string;
  loser_player_id: string;
};

const BYE_PLAYER_ID = '__bye';

export const fallbackLeagueData: League[] = staticLeagueData.map((league) => {
  const players = league.players.map((name, index) => ({
    id: `${league.id}-fallback-p${index + 1}`,
    name,
  }));

  return {
    id: league.id,
    name: league.name,
    sub: league.sub,
    status: league.status,
    players,
    matches: league.results.map((result, index) => {
      const winner = players.find((player) => player.name === result.winner);
      const loser = players.find((player) => player.name === result.loser);

      return {
        id: `${league.id}-fallback-r${index + 1}`,
        week: result.week,
        p1Id: winner?.id ?? '',
        p2Id: loser?.id ?? '',
        winnerId: winner?.id ?? null,
      };
    }),
  };
});

function generateRoundRobinWeeks(players: LeaguePlayer[]): Array<Array<[string, string]>> {
  if (players.length < 2) return [];

  const rotating =
    players.length % 2 === 0
      ? [...players]
      : [...players, { id: BYE_PLAYER_ID, name: 'Bay' }];
  const rounds = rotating.length - 1;
  const half = rotating.length / 2;
  const weeks: Array<Array<[string, string]>> = [];

  for (let round = 0; round < rounds; round += 1) {
    const matches: Array<[string, string]> = [];

    for (let i = 0; i < half; i += 1) {
      const home = rotating[i];
      const away = rotating[rotating.length - 1 - i];
      if (home.id === BYE_PLAYER_ID || away.id === BYE_PLAYER_ID) continue;
      matches.push([home.id, away.id]);
    }

    weeks.push(matches);

    const [fixed, ...rest] = rotating;
    const last = rest.pop();
    if (last) rest.unshift(last);
    rotating.splice(0, rotating.length, fixed, ...rest);
  }

  return weeks;
}

function generateFixture(leagueId: number, players: LeaguePlayer[]): LeagueMatch[] {
  const firstCycle = generateRoundRobinWeeks(players);
  if (firstCycle.length === 0) return [];

  const weeks: Array<Array<[string, string]>> = [];
  const totalWeeks = 6;

  for (let i = 0; i < totalWeeks; i += 1) {
    if (i < firstCycle.length) {
      weeks.push(firstCycle[i]);
    } else {
      weeks.push(firstCycle[i % firstCycle.length].map(([p1, p2]) => [p2, p1]));
    }
  }

  return weeks.flatMap((weekMatches, weekIndex) =>
    weekMatches.map(([p1Id, p2Id], matchIndex) => ({
      id: `l${leagueId}-w${weekIndex + 1}-m${matchIndex + 1}`,
      week: weekIndex + 1,
      p1Id,
      p2Id,
      winnerId: null,
    }))
  );
}

function buildLeaguesFromSupabase(
  groupRows: LeagueGroupRow[],
  playerRows: LeaguePlayerRow[],
  resultRows: LeagueMatchResultRow[]
): League[] {
  return [...groupRows]
    .sort((a, b) => (a.sort_order ?? a.id) - (b.sort_order ?? b.id))
    .map((group) => {
      const players = playerRows
        .filter((player) => player.league_id === group.id && player.active !== false)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((player) => ({
          id: player.id,
          name: player.name,
        }));

      const matches = generateFixture(group.id, players);
      const results = resultRows.filter((result) => result.league_id === group.id);

      results.forEach((result) => {
        const match = matches.find(
          (m) =>
            m.week === result.week &&
            ((m.p1Id === result.winner_player_id && m.p2Id === result.loser_player_id) ||
              (m.p1Id === result.loser_player_id && m.p2Id === result.winner_player_id))
        );

        if (match) match.winnerId = result.winner_player_id;
      });

      return {
        id: group.id,
        name: group.name,
        sub: group.sub,
        status: group.status ?? 'Kayıtlar Devam Ediyor',
        players,
        matches,
      };
    });
}

export async function fetchLeagueData(): Promise<League[]> {
  const [groupsResult, playersResult, resultsResult] = await Promise.all([
    supabase.from('league_groups').select('id, name, sub, status, sort_order'),
    supabase
      .from('league_players')
      .select('id, league_id, name, sort_order, active')
      .eq('active', true),
    supabase
      .from('league_match_results')
      .select('league_id, week, winner_player_id, loser_player_id'),
  ]);

  if (groupsResult.error || playersResult.error || resultsResult.error) {
    throw groupsResult.error ?? playersResult.error ?? resultsResult.error;
  }

  return buildLeaguesFromSupabase(
    (groupsResult.data ?? []) as LeagueGroupRow[],
    (playersResult.data ?? []) as LeaguePlayerRow[],
    (resultsResult.data ?? []) as LeagueMatchResultRow[]
  );
}
