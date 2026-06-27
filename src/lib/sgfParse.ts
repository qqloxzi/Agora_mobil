import type { BoardLabelCell, GoProblem, SolutionNode } from '../types/goProblem';

/** SGF FF[4] omits 'i' in coordinate letters (a–h, j–t). */
export function letterToIndex(ch: string): number {
  const c = ch.toLowerCase().charCodeAt(0) - 97;
  if (c < 0 || c > 18) return -1;
  return c; // -1 atlama kuralı tamamen silindi
}
/** Some exports (e.g. OGS) use consecutive a–s on 19×19, including 'i'. */
function letterToIndexConsecutive(ch: string, size: number): number {
  const c = ch.toLowerCase().charCodeAt(0) - 97;
  if (c < 0 || c >= size) return -1;
  return c;
}

/**
 * AB/AW/BW satırlarında herhangi bir koordinatta `i` harfi varsa tüm dosya OGS tarzı
 * ardışık a–s haritasına geçer (jj → (9,9) gibi).
 */
function sgfUsesConsecutiveCoords(sgf: string): boolean {
  const re = /(?:AB|AW)\[([a-zA-Z]{2})\]|;[BW]\[([a-zA-Z]{2})\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sgf)) !== null) {
    const coord = (m[1] || m[2] || '').toLowerCase();
    if (coord.includes('i')) return true;
  }
  return false;
}

/** Tahta: x sütun soldan, y satır üstten (canvas ile uyumlu). */
export type SgfCoordMode = 'legacy' | 'ff4';

/**
 * Kök `CS[legacy]` (varsayılan) veya `CS[ff4]` — SGF kök özelliği.
 * `ff4`: ikinci harf satırı **aşağıdan** sayar (resmi FF[4]); iç `y` üstten olacak şekilde çevrilir.
 */
export function parseCoordModeFromSgf(sgf: string): SgfCoordMode {
  const m = sgf.match(/CS\[([^\]]*)\]/i);
  if (!m?.[1]) return 'legacy';
  const v = m[1].trim().toLowerCase();
  if (v === 'ff4' || v === 'sgf' || v === 'bottom') return 'ff4';
  return 'legacy';
}

/**
 * İki harfli SGF koordinatı → tahta indeksi (x sütun soldan, y satır üstten).
 * `i` harfi: `LB[pi]` gibi durumlarda o koordinat ardışık haritaya alınır.
 * `ff4` modunda 2. harf aşağıdan satır indeksidir (`legacy` ise üstten, eski uyumluluk).
 */
export function sgfCoordToXY(
  coord: string,
  size: number,
  consecutiveFile: boolean,
  mode: SgfCoordMode = 'legacy'
): { x: number; y: number } {
  if (coord.length < 2) return { x: -1, y: -1 };
  const a = coord[0]!;
  const b = coord[1]!;
  const useConsecutive =
    consecutiveFile || coord.toLowerCase().includes('i');
  if (useConsecutive) {
    const x = letterToIndexConsecutive(a, size);
    let y = letterToIndexConsecutive(b, size);
    if (mode === 'ff4') {
      y = size - 1 - y;
    }
    return { x, y };
  }
  const x = letterToIndex(a);
  let y = letterToIndex(b);
  if (mode === 'ff4') {
    y = size - 1 - y;
  }
  return { x, y };
}

type StoneCell = null | { color: 'black' | 'white' };

function isOnBoard(x: number, y: number, size: number): boolean {
  return x >= 0 && x < size && y >= 0 && y < size;
}

function getLiberties(
  x: number,
  y: number,
  color: 'black' | 'white',
  stones: StoneCell[][],
  size: number,
  checked: Set<string> = new Set()
): number {
  const key = `${x},${y}`;
  if (checked.has(key)) return 0;
  checked.add(key);
  let lib = 0;
  for (const [nx, ny] of [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ] as const) {
    if (isOnBoard(nx, ny, size)) {
      const cell = stones[nx]![ny];
      if (!cell) lib++;
      else if (cell.color === color) lib += getLiberties(nx, ny, color, stones, size, checked);
    }
  }
  return lib;
}

function removeGroup(x: number, y: number, color: 'black' | 'white', stones: StoneCell[][], size: number): void {
  const stone = stones[x]![y];
  if (!stone || stone.color !== color) return;
  stones[x]![y] = null;
  for (const [nx, ny] of [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ] as const) {
    if (isOnBoard(nx, ny, size)) removeGroup(nx, ny, color, stones, size);
  }
}

/**
 * Drop trailing moves that would be illegal from the initial position (same rules as GoBoardReact.playMove).
 * Fixes game records that repeat a move (e.g. closing bracket) or append garbage.
 */
/** SGF Text field: `\]`, `\\`, `\:`, etc. */
function decodeSgfText(raw: string): string {
  return raw.replace(/\\(.)/g, (_, ch: string) => {
    if (ch === ']') return ']';
    if (ch === ':') return ':';
    if (ch === '\\') return '\\';
    if (ch === 'n') return '\n';
    return '\\' + ch;
  });
}

type MoveWithOptionalComment = {
  x: number;
  y: number;
  color: 'black' | 'white';
  comment?: string;
  labels?: string;
};

/**
 * SGF ana hat hamleleri: yalnızca `;B[xx]` / `;W[xx]` (iki harf, hemen `]`).
 * Aynı düğümde `;B[jj]SQ[dd]LB[...]` gibi özellikler olsa da koordinat yalnızca `B`/`W`
 * köşeli bloğundan okunur; `;AB[` / `;AW[` ile karışmaz.
 */

type LabelEntry = { index: number; x: number; y: number; cell: BoardLabelCell };

/**
 * SGF: LB (harf), TR (üçgen), CR (daire), SQ (kare), MA (çarpı).
 * Aynı koordinatta birden fazla özellik varsa dosyada **son** gelen geçerlidir.
 */
export function buildLabelsFromSgf(
  sgf: string,
  size: number,
  consecutive: boolean,
  mode: SgfCoordMode = 'legacy'
): string {
  const entries: LabelEntry[] = [];

  const lbRe = /LB\[([a-zA-Z]{2}):((?:\\.|[^\]])*)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = lbRe.exec(sgf)) !== null) {
    const { x, y } = sgfCoordToXY(m[1]!, size, consecutive, mode);
    if (x < 0 || y < 0) continue;
    const text = decodeSgfText(m[2] ?? '').trim();
    entries.push({
      index: m.index,
      x,
      y,
      cell: { kind: 'letter', text: text.length > 0 ? text : '?' },
    });
  }

  const shapeRes: Array<{ re: RegExp; cell: BoardLabelCell }> = [
    { re: /TR\[([a-zA-Z]{2})\]/gi, cell: { kind: 'triangle' } },
    { re: /CR\[([a-zA-Z]{2})\]/gi, cell: { kind: 'circle' } },
    { re: /SQ\[([a-zA-Z]{2})\]/gi, cell: { kind: 'square' } },
    { re: /MA\[([a-zA-Z]{2})\]/gi, cell: { kind: 'cross' } },
  ];
  for (const { re, cell } of shapeRes) {
    while ((m = re.exec(sgf)) !== null) {
      const { x, y } = sgfCoordToXY(m[1]!, size, consecutive, mode);
      if (x < 0 || y < 0) continue;
      entries.push({ index: m.index, x, y, cell });
    }
  }

  entries.sort((a, b) => a.index - b.index);
  const grid: (BoardLabelCell | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
  for (const e of entries) {
    grid[e.x]![e.y] = e.cell;
  }
  return JSON.stringify(grid);
}

function buildInitialStateJson(
  size: number,
  black: { x: number; y: number }[],
  white: { x: number; y: number }[]
): string {
  const stones: (null | { color: 'black' | 'white' })[][] = Array.from(
    { length: size },
    () => Array.from({ length: size }, () => null)
  );
  for (const p of black) {
    if (p.x >= 0 && p.x < size && p.y >= 0 && p.y < size) stones[p.x]![p.y] = { color: 'black' };
  }
  for (const p of white) {
    if (p.x >= 0 && p.x < size && p.y >= 0 && p.y < size) stones[p.x]![p.y] = { color: 'white' };
  }
  return JSON.stringify(stones);
}

function parseSgfTree(sgf: string, size: number, consecutive: boolean, coordMode: SgfCoordMode): SolutionNode[] {
  const tokens: { type: 'branch_start' | 'branch_end' | 'node'; text: string }[] = [];
  let i = 0;
  while (i < sgf.length) {
    const ch = sgf[i];
    if (ch === '(') {
      tokens.push({ type: 'branch_start', text: '(' });
      i++;
    } else if (ch === ')') {
      tokens.push({ type: 'branch_end', text: ')' });
      i++;
    } else if (ch === ';') {
      const start = i;
      i++;
      while (i < sgf.length) {
        if (sgf[i] === '(' || sgf[i] === ')' || sgf[i] === ';') {
          break;
        }
        if (sgf[i] === '[') {
          i++;
          while (i < sgf.length) {
            if (sgf[i] === '\\') {
              i += 2;
            } else if (sgf[i] === ']') {
              i++;
              break;
            } else {
              i++;
            }
          }
        } else {
          i++;
        }
      }
      tokens.push({ type: 'node', text: sgf.slice(start, i) });
    } else {
      i++;
    }
  }

  const rootDummy: SolutionNode = { x: -1, y: -1, color: 'black', children: [] };
  const stack: SolutionNode[] = [rootDummy];
  let currentParent = rootDummy;
  let hasExplicitStatus = false;

  for (const token of tokens) {
    if (token.type === 'branch_start') {
      stack.push(currentParent);
    } else if (token.type === 'branch_end') {
      if (stack.length > 1) {
        currentParent = stack.pop()!;
      }
    } else if (token.type === 'node') {
      const bMatch = token.text.match(/B\[([a-zA-Z]{2})\]/);
      const wMatch = token.text.match(/W\[([a-zA-Z]{2})\]/);
      
      let moveColor: 'black' | 'white' | null = null;
      let coord = '';
      if (bMatch) {
        moveColor = 'black'; coord = bMatch[1];
      } else if (wMatch) {
        moveColor = 'white'; coord = wMatch[1];
      }
      
      if (moveColor && coord) {
        const { x, y } = sgfCoordToXY(coord, size, consecutive, coordMode);
        if (x >= 0 && y >= 0) {
          let comment: string | undefined;
          const cMatch = token.text.match(/C\[((?:\\.|[^\]])*)\]/);
          if (cMatch?.[1] != null) {
            const decoded = decodeSgfText(cMatch[1]).trim();
            if (decoded.length > 0) comment = decoded;
          }
          
          const hasLabels = token.text.includes('LB[') || token.text.includes('TR[') || token.text.includes('CR[') || token.text.includes('SQ[') || token.text.includes('MA[');
          let labels: string | undefined;
          if (hasLabels) {
            labels = buildLabelsFromSgf(token.text, size, consecutive, coordMode);
          }

          let status: SolutionNode['status'] | undefined;
          if (/\b(?:TE|GB)\s*\[\s*1\s*\]/i.test(token.text)) {
            status = 'correct';
            hasExplicitStatus = true;
          } else if (/\b(?:BM|UC)\s*\[\s*1\s*\]/i.test(token.text)) {
            status = 'wrong';
            hasExplicitStatus = true;
          }

          const newNode: SolutionNode = {
            x, y, color: moveColor, children: [],
            ...(comment ? { comment } : {}),
            ...(labels && labels !== '[]' ? { labels } : {}),
            ...(status ? { status } : {})
          };
          currentParent.children.push(newNode);
          currentParent = newNode;
        }
      }
    }
  }

  // Açık TE/BM/GB/UC yoksa: her kardeş dal grubunda ilk branch doğru,
  // sonraki branch'ler yanlış. Tek çizgili eski SGF'lerde tek yaprak doğru kalır.
  function markFirstBranchCorrect(nodes: SolutionNode[], parentIsWrong = false) {
    nodes.forEach((node, index) => {
      const isWrongBranch = parentIsWrong || (nodes.length > 1 && index > 0);

      if (isWrongBranch) {
        node.status = 'wrong';
      } else if (nodes.length > 1) {
        node.status = index === 0 ? 'correct' : 'wrong';
      } else if (node.children.length === 0) {
        node.status = 'correct';
      }

      if (node.children.length > 0) {
        markFirstBranchCorrect(node.children, isWrongBranch);
      }
    });
  }
  if (!hasExplicitStatus) {
    markFirstBranchCorrect(rootDummy.children);
  }

  return rootDummy.children;
}

/**
 * Minimal SGF → GoProblem (SZ, AB, AW, PL, GN, PC, move sequence).
 */
export function parseSgfToProblem(
  sgf: string,
  meta: { relativePath: string; filename: string; id: string; category: string }
): GoProblem {
  const szMatch = sgf.match(/SZ\[(\d+)\]/);
  const size = szMatch ? parseInt(szMatch[1]!, 10) : 9;

  const gnMatch = sgf.match(/GN\[([^\]]*)\]/);
  const pcMatch = sgf.match(/PC\[([^\]]*)\]/);
  const title =
    (gnMatch?.[1]?.trim() && gnMatch[1].trim().length > 0
      ? gnMatch[1].trim()
      : meta.filename.replace(/\.sgf$/i, '')) || 'Untitled';
  const description =
    pcMatch?.[1]?.trim() && pcMatch[1].trim().length > 0
      ? pcMatch[1].trim()
      : `SGF: ${meta.filename}`;

  /** Özel: `LP[stepAfter]` / `LP[after]` rakip hamlesinden sonra duraklat; `LP[stepBefore]` önce duraklat; `LP[auto]` anında. */
  const lpMatch = sgf.match(/LP\[([^\]]*)\]/i);
  let lessonPlayback: 'auto' | 'stepAfter' | 'stepBefore' | undefined;
  if (lpMatch?.[1] != null) {
    const v = lpMatch[1].trim().toLowerCase();
    if (v === 'auto') lessonPlayback = 'auto';
    else if (v === 'stepbefore' || v === 'before') lessonPlayback = 'stepBefore';
    else if (
      v === 'stepafter' ||
      v === 'after' ||
      v === 'step'
    ) {
      lessonPlayback = 'stepAfter';
    }
  }

  const consecutive = sgfUsesConsecutiveCoords(sgf);
  const coordMode = parseCoordModeFromSgf(sgf);

  const black: { x: number; y: number }[] = [];
  const white: { x: number; y: number }[] = [];
  const abRe = /AB\[([a-zA-Z]{2})\]/gi;
  let m: RegExpExecArray | null;
  while ((m = abRe.exec(sgf)) !== null) {
    const { x, y } = sgfCoordToXY(m[1]!, size, consecutive, coordMode);
    if (x >= 0 && y >= 0) black.push({ x, y });
  }
  const awRe = /AW\[([a-zA-Z]{2})\]/gi;
  while ((m = awRe.exec(sgf)) !== null) {
    const { x, y } = sgfCoordToXY(m[1]!, size, consecutive, coordMode);
    if (x >= 0 && y >= 0) white.push({ x, y });
  }

  const movesForTree = parseSgfTree(sgf, size, consecutive, coordMode);

  const plMatch = sgf.match(/PL\[([BW])\]/);
  const plColor: 'black' | 'white' | null = plMatch
    ? plMatch[1] === 'B'
      ? 'black'
      : 'white'
    : null;

  let blackStones = [...black];
  let whiteStones = [...white];
  let currentChildren = movesForTree;

  if (plColor != null) {
    while (currentChildren.length === 1 && currentChildren[0].color !== plColor) {
      const mv = currentChildren[0];
      if (mv.color === 'black') {
        blackStones.push({ x: mv.x, y: mv.y });
      } else {
        whiteStones.push({ x: mv.x, y: mv.y });
      }
      currentChildren = mv.children;
    }
  }

  const initialState = buildInitialStateJson(size, blackStones, whiteStones);
  
  let turn: 'black' | 'white';
  if (currentChildren.length > 0) {
    turn = currentChildren[0].color;
  } else if (plColor != null) {
    turn = plColor;
  } else {
    turn = 'black';
  }

  const firstMoveMatch = sgf.match(/;[BW]\[/);
  const rootSgfPart = firstMoveMatch ? sgf.slice(0, firstMoveMatch.index) : sgf;
  const labels = buildLabelsFromSgf(rootSgfPart, size, consecutive, coordMode);
  const solution = { children: currentChildren };

  return {
    id: meta.id,
    sgf: meta.filename,
    category: meta.category,
    title,
    description,
    size,
    turn,
    labels,
    initialState,
    solution,
    coordSystem: coordMode,
    ...(lessonPlayback != null ? { lessonPlayback } : {}),
  };
}

/** Parent folder under `.../sgf/<category>/file.sgf` → category id for the tree. */
export function categoryFromPath(relativePath: string): string {
  const norm = relativePath.replace(/\\/g, '/');
  const parts = norm.split('/').filter(Boolean);
  const i = parts.lastIndexOf('sgf');
  if (i >= 0 && parts[i + 1] && parts[i + 2]) {
    return parts[i + 1]!;
  }
  return 'Genel';
}

/** Stable unique id from path + content (FNV-1a-ish). */
export function hashIdForSgf(relativePath: string, content: string): string {
  const base = relativePath.split('/').pop()?.replace(/\.sgf$/i, '') || 'sgf';
  let h = 2166136261;
  const s = `${relativePath}\0${content.length}\0${content}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const hex = h.toString(16).padStart(8, '0');
  return `sgf-${base}-${hex}`;
}
