/**
 * JSON tabanlı tsumego veri modeli.
 * Agora_1.0.1 GoBoardReact / problems.ts ile uyumlu.
 */
export interface SolutionNode {
  x: number;
  y: number;
  color: string;
  children?: SolutionNode[];
  status?: 'correct' | 'wrong' | null;
}

export interface Problem {
  id: string;
  size: number;
  labels: string; // JSON string (2D Array)
  turn: 'black' | 'white';
  title: string;
  initialState: string; // JSON string (2D Array)
  solution: SolutionNode[] | { children: SolutionNode[] };
  category: string;
  description: string;
}
