/**
 * SGF (Smart Game Format) parser for tsumego.
 * .sgf dosyalarından tahta başlangıç pozisyonu ve çözüm ağacı (B/W, C[Correct], C[Wrong]) üretir.
 * GameManager.jsx / GoBoardReact ile uyumlu Problem formatına çevirir.
 */

import type { SolutionNode, Problem } from '../types/tsumego';

const SGF_COL = 'abcdefghjklmnopqrst'; // 19x19: 'i' atlanır
const SGF_ROW = 'abcdefghjklmnopqrst';

function sgfPointToXY(s: string, size: number): { x: number; y: number } | null {
  if (!s || s.length < 2) return null;
  const col = s[0].toLowerCase();
  const row = s[1].toLowerCase();
  const ci = SGF_COL.indexOf(col);
  const ri = SGF_ROW.indexOf(row);
  if (ci === -1 || ri === -1) return null;
  // SGF: col, row (left-right, top-bottom). Our grid: x=row, y=col
  const x = size - 1 - ri; // flip row so 0 is top
  const y = ci;
  return { x, y };
}

function parseProperty(cont: string, key: string): string[] {
  const out: string[] = [];
  const re = new RegExp(key + '\\[([^\\]]*)\\]', 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(cont)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function parseSequence(
  cont: string,
  size: number,
  startTurn: 'black' | 'white'
): { moves: Array<{ x: number; y: number; color: 'black' | 'white'; status: 'correct' | 'wrong' | null }>; rest: string } {
  const moves: Array<{ x: number; y: number; color: 'black' | 'white'; status: 'correct' | 'wrong' | null }> = [];
  let rest = cont.trim();
  let turn = startTurn;

  while (rest.startsWith(';')) {
    const end = rest.indexOf(';', 1);
    const nodeStr = end === -1 ? rest : rest.slice(0, end);
    rest = end === -1 ? '' : rest.slice(end);

    const b = parseProperty(nodeStr, 'B');
    const w = parseProperty(nodeStr, 'W');
    const c = parseProperty(nodeStr, 'C');
    const comment = c[c.length - 1]?.trim().toLowerCase() ?? '';
    let status: 'correct' | 'wrong' | null = null;
    if (comment.includes('correct')) status = 'correct';
    else if (comment.includes('wrong')) status = 'wrong';

    if (b.length > 0) {
      const xy = sgfPointToXY(b[0], size);
      if (xy) {
        moves.push({ ...xy, color: 'black', status });
        turn = 'white';
      }
    } else if (w.length > 0) {
      const xy = sgfPointToXY(w[0], size);
      if (xy) {
        moves.push({ ...xy, color: 'white', status });
        turn = 'black';
      }
    }
    if (rest.startsWith('(')) break;
  }

  return { moves, rest: rest.trim() };
}

function parseVariations(
  cont: string,
  size: number,
  turn: 'black' | 'white'
): SolutionNode[] {
  const children: SolutionNode[] = [];
  let s = cont.trim();
  while (s.startsWith('(')) {
    s = s.slice(1);
    const close = findMatchingParen(s);
    if (close === -1) break;
    const branch = s.slice(0, close);
    s = s.slice(close + 1);
    const { moves, rest } = parseSequence(branch, size, turn);
    const first = moves[0];
    if (!first) continue;
    const node: SolutionNode = {
      x: first.x,
      y: first.y,
      color: first.color,
      status: first.status ?? null,
      children: [],
    };
    let nextTurn = first.color === 'black' ? 'white' : 'black';
    if (moves.length > 1) {
      let ptr: SolutionNode = node;
      for (let i = 1; i < moves.length; i++) {
        const m = moves[i];
        const child: SolutionNode = { x: m.x, y: m.y, color: m.color, status: m.status ?? null, children: [] };
        ptr.children = [child];
        ptr = child;
        nextTurn = m.color === 'black' ? 'white' : 'black';
      }
    }
    if (rest.trim().startsWith('(')) {
      ptr.children = parseVariations(rest, size, nextTurn);
    }
    children.push(node);
  }
  return children;
}

function findMatchingParen(s: string): number {
  let depth = 1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function buildSolutionTree(
  moves: Array<{ x: number; y: number; color: 'black' | 'white'; status: 'correct' | 'wrong' | null }>,
  variations: SolutionNode[],
  startTurn: 'black' | 'white'
): { children: SolutionNode[] } {
  const root = { children: [] as SolutionNode[] };
  if (moves.length === 0) return root;
  let ptr = root;
  let turn = startTurn;
  for (const m of moves) {
    const node: SolutionNode = { x: m.x, y: m.y, color: m.color, status: m.status ?? null, children: [] };
    ptr.children = [node];
    ptr = node;
    turn = m.color === 'black' ? 'white' : 'black';
  }
  if (variations.length > 0) ptr.children = variations;
  return root;
}

/** 2D tahta: boş veya { color } */
function emptyBoard(size: number): (null | { color: string })[][] {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
}

function boardToInitialState(board: (null | { color: string })[][]): string {
  return JSON.stringify(board);
}

/**
 * SGF string'ini Problem (JSON uyumlu) formatına çevirir.
 * FF[4], SZ, AB, AW, ardından ana varyasyon (;B[..];W[..]) ve ( ) ile yan varyasyonlar desteklenir.
 */
export function parseSgfToProblem(sgf: string, id: string, category: string, title?: string): Problem | null {
  const normalized = sgf.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
  const sz = parseProperty(normalized, 'SZ');
  const size = sz.length > 0 ? Math.min(19, Math.max(9, parseInt(sz[0], 10) || 9)) : 9;
  const ab = parseProperty(normalized, 'AB');
  const aw = parseProperty(normalized, 'AW');

  const board = emptyBoard(size);
  for (const p of ab) {
    const xy = sgfPointToXY(p, size);
    if (xy && board[xy.x] && board[xy.x][xy.y] === null) board[xy.x][xy.y] = { color: 'black' };
  }
  for (const p of aw) {
    const xy = sgfPointToXY(p, size);
    if (xy && board[xy.x] && board[xy.x][xy.y] === null) board[xy.x][xy.y] = { color: 'white' };
  }

  const firstB = normalized.indexOf('B[');
  const firstW = normalized.indexOf('W[');
  let startTurn: 'black' | 'white' = 'black';
  if (firstB >= 0 && (firstW < 0 || firstB < firstW)) startTurn = 'black';
  else if (firstW >= 0) startTurn = 'white';

  const mainStart = Math.max(normalized.indexOf(';'), 0);
  const mainBlock = normalized.slice(mainStart);
  const { moves, rest } = parseSequence(mainBlock, size, startTurn);
  const variations = rest.trim().startsWith('(') ? parseVariations(rest, size, startTurn) : [];
  const solution = buildSolutionTree(moves, variations, startTurn);

  const initialState = boardToInitialState(board);
  const labels = initialState; // boş veya tahta ile aynı 2D JSON

  return {
    id,
    size,
    labels,
    turn: startTurn,
    title: title ?? category,
    description: '',
    category,
    initialState,
    solution,
  };
}
