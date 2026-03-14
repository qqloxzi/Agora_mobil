/**
 * Konu (topicId) bazlı JSON tabanlı tsumego problemleri.
 * Problem arayüzü: id, size, labels, turn, title, initialState, solution, category, description.
 */
import type { Problem } from '../types/tsumego';

function emptyLabels(size: number): string {
  return JSON.stringify(
    Array(size)
      .fill(null)
      .map(() => Array(size).fill(null))
  );
}

/** topicId -> tek bir örnek problem (JSON tabanlı) */
const PROBLEM_BY_TOPIC: Record<string, Problem> = {
  Kurallar: {
    id: 'prob-kurallar-1',
    size: 9,
    labels: emptyLabels(9),
    turn: 'white',
    title: 'Kurallar',
    category: 'Kurallar',
    description: 'Taşları ve temel kuralları öğrenin.',
    initialState: JSON.stringify(
      Array(9)
        .fill(null)
        .map(() => Array(9).fill(null))
    ),
    solution: { children: [] },
  },
  'Esir Alma 1': {
    id: 'prob-esir-1',
    size: 9,
    labels: emptyLabels(9),
    turn: 'white',
    title: 'Esir Alma',
    category: 'Esir Alma 1',
    description: 'Beyaz, siyah grubu esir almak için nereye oynamalı?',
    initialState: `[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,{"color":"white"},{"color":"white"},null,null,null,null],[null,null,{"color":"white"},{"color":"black"},{"color":"black"},{"color":"white"},null,null,null],[null,null,null,null,{"color":"black"},{"color":"white"},null,null,null],[null,null,null,null,{"color":"white"},null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]`,
    solution: {
      children: [
        {
          x: 4,
          y: 3,
          color: 'white',
          children: [],
          status: 'correct',
        },
      ],
    },
  },
  'Bağlanma & Kesme': {
    id: 'prob-baglanma-1',
    size: 9,
    labels: emptyLabels(9),
    turn: 'black',
    title: 'Bağlanma & Kesme',
    category: 'Bağlanma & Kesme',
    description: 'Siyah bağlanmak veya kesmek için nereye oynamalı?',
    initialState: `[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,{"color":"black"},{"color":"white"},null,null,null,null],[null,null,null,{"color":"white"},null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]`,
    solution: {
      children: [
        {
          x: 3,
          y: 4,
          color: 'black',
          children: [],
          status: 'correct',
        },
      ],
    },
  },
  'Nefes Yarışı 1': {
    id: 'prob-nefes-1',
    size: 9,
    labels: emptyLabels(9),
    turn: 'white',
    title: 'Nefes Yarışı',
    category: 'Nefes Yarışı 1',
    description: 'Beyaz siyah grubu yakalamak için nereye oynamalı?',
    initialState: `[[null,null,null,null,null,null,null,null,null],[null,null,{"color":"white"},{"color":"white"},{"color":"white"},null,null,null,null],[null,{"color":"white"},{"color":"black"},{"color":"black"},{"color":"black"},{"color":"white"},null,null,null],[null,{"color":"white"},{"color":"black"},null,{"color":"black"},{"color":"white"},null,null,null],[null,{"color":"white"},{"color":"black"},{"color":"black"},{"color":"black"},{"color":"white"},null,null,null],[null,null,{"color":"white"},{"color":"white"},{"color":"white"},null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]`,
    solution: {
      children: [
        {
          x: 3,
          y: 3,
          color: 'white',
          children: [],
          status: 'correct',
        },
      ],
    },
  },
};

export function getProblemForTopic(topicId: string): Problem | null {
  return PROBLEM_BY_TOPIC[topicId] ?? null;
}

export function getTopicsWithProblems(): string[] {
  return Object.keys(PROBLEM_BY_TOPIC);
}
