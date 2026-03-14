/**
 * Go oyun motoru – Agora_1.0.1 GoBoardReact.jsx / GameManager.jsx ile birebir uyumlu.
 * Nefes hesaplama, esir alma, Ko kuralı, hamle geçerliliği. Framework bağımsız (saf fonksiyonlar).
 */

export type StoneColor = 'black' | 'white';

export type BoardCell = null | { color: string };

export type Board = BoardCell[][];

export interface LastMove {
  x: number;
  y: number;
  color: StoneColor;
}

export interface GoState {
  size: number;
  stones: Board;
  turn: StoneColor;
  history: string[];
  lastMove: LastMove | null;
}

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function isOnBoard(size: number, x: number, y: number): boolean {
  return x >= 0 && x < size && y >= 0 && y < size;
}

/**
 * Bir taş grubunun toplam nefes sayısı (liberty).
 * Web: getLiberties(x, y, color, stones, checked)
 */
export function getLiberties(
  x: number,
  y: number,
  color: StoneColor,
  stones: Board,
  size: number,
  checked: Set<string> = new Set()
): number {
  const key = `${x},${y}`;
  if (checked.has(key)) return 0;
  checked.add(key);
  let lib = 0;
  for (const [dx, dy] of NEIGHBORS) {
    const nx = x + dx;
    const ny = y + dy;
    if (!isOnBoard(size, nx, ny)) continue;
    if (!stones[nx][ny]) lib++;
    else if ((stones[nx][ny] as { color: string }).color === color)
      lib += getLiberties(nx, ny, color, stones, size, checked);
  }
  return lib;
}

/**
 * Tahtadan aynı renkte bağlı grubu kaldırır (mutate). Esir alma.
 * Web: removeGroup(x, y, color, stones)
 */
export function removeGroup(x: number, y: number, color: StoneColor, stones: Board, size: number): void {
  const stone = stones[x][y];
  if (!stone || (stone as { color: string }).color !== color) return;
  stones[x][y] = null;
  for (const [dx, dy] of NEIGHBORS) {
    const nx = x + dx;
    const ny = y + dy;
    if (isOnBoard(size, nx, ny)) removeGroup(nx, ny, color, stones, size);
  }
}

/**
 * Tahtanın derin kopyası.
 */
function cloneBoard(stones: Board): Board {
  return stones.map((row) => row.map((c) => (c ? { ...c } : null)));
}

export type PlayMoveResult =
  | { success: true; state: GoState }
  | { success: false; message: string };

/**
 * Tek hamle uygular: taş koyar, esir alır, nefes/ko kontrolü.
 * Web: playMove(x, y, color) – state mutasyonu yerine yeni state döner.
 */
export function playMove(x: number, y: number, color: StoneColor, state: GoState): PlayMoveResult {
  const { size, stones, history } = state;
  if (!isOnBoard(size, x, y)) return { success: false, message: 'Tahta dışı' };
  if (stones[x][y]) return { success: false, message: 'Dolu kesişim' };

  const newStones = cloneBoard(stones);
  newStones[x][y] = { color };
  const opp: StoneColor = color === 'black' ? 'white' : 'black';

  for (const [dx, dy] of NEIGHBORS) {
    const nx = x + dx;
    const ny = y + dy;
    if (
      isOnBoard(size, nx, ny) &&
      newStones[nx][ny] &&
      (newStones[nx][ny] as { color: string }).color === opp &&
      getLiberties(nx, ny, opp, newStones, size) === 0
    ) {
      removeGroup(nx, ny, opp, newStones, size);
    }
  }

  if (getLiberties(x, y, color, newStones, size) === 0)
    return { success: false, message: 'Yasak Hamle' };

  const newBoardStr = JSON.stringify(newStones);
  if (history.includes(newBoardStr)) return { success: false, message: 'Ko Kuralı!' };

  return {
    success: true,
    state: {
      size,
      stones: newStones,
      turn: opp,
      history: [...history, JSON.stringify(stones)],
      lastMove: { x, y, color },
    },
  };
}

/**
 * Hamle geri al. Web: handleStepBack – history.pop(), tahtayı önceki duruma getir.
 */
export function stepBack(state: GoState, initialStateStr: string | null): GoState | null {
  if (state.history.length === 0) return null;
  const prevBoardStr = state.history[state.history.length - 1];
  let stones: Board;
  try {
    stones = JSON.parse(prevBoardStr) as Board;
  } catch {
    return null;
  }
  return {
    size: state.size,
    stones,
    turn: state.turn === 'black' ? 'white' : 'black',
    history: state.history.slice(0, -1),
    lastMove: null,
  };
}

/**
 * Pas geçme: sıra değişir, tahta aynı, history'ye mevcut tahta eklenir (ko için).
 */
export function playPass(state: GoState): GoState {
  const boardStr = JSON.stringify(state.stones);
  return {
    size: state.size,
    stones: cloneBoard(state.stones),
    turn: state.turn === 'black' ? 'white' : 'black',
    history: [...state.history, boardStr],
    lastMove: null,
  };
}

/**
 * Başlangıç durumu: initialState JSON string'den tahta; boşsa size x size boş tahta.
 */
export function parseInitialState(initialState: string, size: number): Board {
  try {
    const parsed = JSON.parse(initialState);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Board;
  } catch {
    // ignore
  }
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
}

/**
 * Boş tahta (size x size).
 */
export function emptyBoard(size: number): Board {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
}

/**
 * Koordinat etiketleri: 9/13/19 için sütun (A-S, I atlanır 19'da) ve satır (1..size).
 * Web: calculateCoords(s) -> cols, rows.
 */
export function getCoordinateLabels(size: number): { cols: string[]; rows: string[] } {
  const cols: string[] = [];
  const rows: string[] = [];
  for (let i = 0; i < size; i++) {
    cols.push(String.fromCharCode(65 + (size === 19 && i >= 8 ? i + 1 : i)));
  }
  for (let i = 0; i < size; i++) {
    rows.push(String(size - i));
  }
  return { cols, rows };
}

/**
 * Hoshi (yıldız) noktaları: 9 -> [2,4,6], 13 -> [3,6,9], 19 -> [3,9,15].
 */
export function getHoshiPoints(size: number): [number, number][] {
  const pts =
    size === 19 ? [3, 9, 15] : size === 13 ? [3, 6, 9] : size === 9 ? [2, 4, 6] : [];
  const out: [number, number][] = [];
  for (const x of pts) for (const y of pts) out.push([x, y]);
  return out;
}

/**
 * problem.labels JSON string'den 2D etiket dizisi (sayı, harf vb.).
 */
export function parseLabels(labelsStr: string, size: number): (string | number | null)[][] {
  try {
    const parsed = JSON.parse(labelsStr);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as (string | number | null)[][];
  } catch {
    // ignore
  }
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
}
