/**
 * GoBoard — React Native SVG Go Tahtası
 *
 * Agora_gravity GoBoardReact.jsx oyun motorunun (getLiberties,
 * removeGroup, playMove, Ko kuralı, intihar yasağı) tam portu.
 *
 * Render: react-native-svg (Canvas API yok)
 * Geometri: goBoardLayout.js (aynı kaynak)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Svg, { Rect, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { computeBoardLayout, intersectionXY } from '../lib/goBoardLayout';
import type { GoProblem } from '../types/goProblem';

/* ─── Tipler ───────────────────────────────────────────────── */
type Color = 'black' | 'white';
type BoardGrid = (null | { color: Color })[][];

export interface GoBoardProps {
  /** Tahta boyutu (9/13/19). Problem yoksa 9 kullanılır. */
  size?: number;
  boardSizePx?: number;
  /** Başlangıç durumu (GoProblem.initialState JSON'u veya parse edilmiş) */
  initialState?: string | BoardGrid;
  /** Hangi renk oynar */
  startTurn?: Color;
  /** Çözüm ağacı — problem modunda kullanılır */
  problem?: GoProblem | null;
  onSolve?: () => void;
  /** true → taşlar yerleştirilemez, sadece gösterim */
  readOnly?: boolean;
  onTurnChange?: (turn: Color) => void;
  /** Aktif node değişince çağrılır — comment, color ve koordinat bilgisi */
  onNodeChange?: (info: { x: number; y: number; comment: string | null; color: string | null } | null) => void;
}

/* ─── Star Points ──────────────────────────────────────────── */
const STAR_POINTS: Record<number, [number, number][]> = {
  9:  [[2,2],[6,2],[4,4],[2,6],[6,6]],
  13: [[3,3],[9,3],[3,9],[9,9],[6,6],[3,6],[9,6],[6,3],[6,9]],
  19: [[3,3],[9,3],[15,3],[3,9],[9,9],[15,9],[3,15],[9,15],[15,15]],
};

/* ─── Yardımcı: BoardGrid ──────────────────────────────────── */
function emptyGrid(size: number): BoardGrid {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function parseInitialState(raw: string | BoardGrid | undefined, size: number): BoardGrid {
  if (!raw) return emptyGrid(size);
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return emptyGrid(size);
}

function gridToStones(grid: BoardGrid): { x: number; y: number; color: Color }[] {
  const result: { x: number; y: number; color: Color }[] = [];
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < (grid[x]?.length ?? 0); y++) {
      const cell = grid[x]?.[y];
      if (cell) result.push({ x, y, color: cell.color });
    }
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════
   OYUN MOTORU — GoBoardReact.jsx ile birebir aynı mantık
═══════════════════════════════════════════════════════════════ */

function isOnBoard(x: number, y: number, size: number): boolean {
  return x >= 0 && x < size && y >= 0 && y < size;
}

/** Taş grubunun özgürlüklerini say (recursive flood-fill) */
function getLiberties(
  x: number, y: number, color: Color,
  stones: BoardGrid, size: number,
  checked = new Set<string>()
): number {
  const key = `${x},${y}`;
  if (checked.has(key)) return 0;
  checked.add(key);
  let lib = 0;
  for (const [nx, ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]] as [number,number][]) {
    if (!isOnBoard(nx, ny, size)) continue;
    const cell = stones[nx]?.[ny];
    if (!cell) lib++;
    else if (cell.color === color) lib += getLiberties(nx, ny, color, stones, size, checked);
  }
  return lib;
}

/** Taş grubunu tahtadan sil (recursive) */
function removeGroup(x: number, y: number, color: Color, stones: BoardGrid, size: number): void {
  const cell = stones[x]?.[y];
  if (!cell || cell.color !== color) return;
  stones[x]![y] = null;
  for (const [nx, ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]] as [number,number][]) {
    if (isOnBoard(nx, ny, size)) removeGroup(nx, ny, color, stones, size);
  }
}

interface PlayResult {
  ok: boolean;
  newGrid?: BoardGrid;
  reason?: 'occupied' | 'suicide' | 'ko';
}

/**
 * Hamle oyna — GoBoardReact.jsx playMove() ile aynı mantık:
 * 1. Hücre dolu mu?
 * 2. Taşı yerleştir
 * 3. Rakibi esir al
 * 4. İntihar yasağı (capture sonrası lib === 0)
 * 5. Ko kuralı (tahta durumu daha önce oluştu mu?)
 */
function playMove(
  x: number, y: number, color: Color,
  currentGrid: BoardGrid, size: number,
  boardHistory: string[]   // JSON snapshot'ları
): PlayResult {
  if (currentGrid[x]?.[y]) return { ok: false, reason: 'occupied' };

  // Derin kopya
  const newGrid: BoardGrid = currentGrid.map(row => row.map(cell => (cell ? { ...cell } : null)));
  newGrid[x]![y] = { color };

  const opp: Color = color === 'black' ? 'white' : 'black';
  let captured = false;

  // Komşu rakip gruplarını esir al
  for (const [nx, ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]] as [number,number][]) {
    if (
      isOnBoard(nx, ny, size) &&
      newGrid[nx]?.[ny]?.color === opp &&
      getLiberties(nx, ny, opp, newGrid, size) === 0
    ) {
      removeGroup(nx, ny, opp, newGrid, size);
      captured = true;
    }
  }

  // İntihar yasağı
  if (!captured && getLiberties(x, y, color, newGrid, size) === 0) {
    return { ok: false, reason: 'suicide' };
  }

  // Ko kuralı
  const newBoardStr = JSON.stringify(newGrid);
  if (boardHistory.includes(newBoardStr)) {
    return { ok: false, reason: 'ko' };
  }

  return { ok: true, newGrid };
}

/* ─── Fast-Forward: GoBoardReact.jsx loadProblemData() mantığı ──────
   Çözüm ağacında tek devam yolu varken hamleleri otomatik oyna;
   yorum veya dallanma noktasında dur (kullanıcıya soru sor).
────────────────────────────────────────────────────────────────── */
function computeFastForwardState(
  baseGrid: BoardGrid,
  baseTurn: Color,
  solutionTree: any,
  size: number
): { grid: BoardGrid; turn: Color; lastMove: { x: number; y: number } | null; currentNode: any; history: string[] } {
  let grid: BoardGrid = baseGrid.map(row => row.map(c => c ? { ...c } : null));
  let turn: Color = baseTurn;
  let lastMove: { x: number; y: number } | null = null;
  let currentNode: any = solutionTree;
  const history: string[] = [];

  // Tek çocuk varken ilerle (GoBoardReact.jsx while döngüsü)
  while (currentNode?.children?.length === 1) {
    const nextNode = currentNode.children[0];
    const snapshot = JSON.stringify(grid);

    // Taşı yerleştir
    const newGrid: BoardGrid = grid.map(row => row.map(c => c ? { ...c } : null));
    newGrid[nextNode.x]![nextNode.y] = { color: nextNode.color };

    // Esir alma
    const opp: Color = nextNode.color === 'black' ? 'white' : 'black';
    for (const [nx, ny] of [[nextNode.x+1,nextNode.y],[nextNode.x-1,nextNode.y],[nextNode.x,nextNode.y+1],[nextNode.x,nextNode.y-1]] as [number,number][]) {
      if (isOnBoard(nx, ny, size) && newGrid[nx]?.[ny]?.color === opp && getLiberties(nx, ny, opp, newGrid, size) === 0) {
        removeGroup(nx, ny, opp, newGrid, size);
      }
    }

    history.push(snapshot);
    grid = newGrid;
    lastMove = { x: nextNode.x, y: nextNode.y };
    turn = nextNode.color === 'black' ? 'white' : 'black';
    currentNode = nextNode;

    // Yorum varsa dur (kullanıcı pozisyonu okusun)
    if (nextNode.comment && String(nextNode.comment).trim() !== '') break;
    // Dallanma varsa dur
    if (nextNode.children?.length > 1) break;
    // Son hamleyse dur
    if (!nextNode.children || nextNode.children.length === 0) break;
  }

  return { grid, turn, lastMove, currentNode, history };
}

/* ─── GoBoard Bileşeni ─────────────────────────────────────── */
export default function GoBoard({
  size: sizeProp = 9,
  boardSizePx,
  initialState,
  startTurn = 'black',
  problem,
  onSolve,
  readOnly = false,
  onTurnChange,
  onNodeChange,
}: GoBoardProps) {
  const { width: screenW } = useWindowDimensions();
  const W = boardSizePx ?? Math.min(screenW - 32, 380);

  const size = problem?.size ?? sizeProp;
  const { padding, cellSize } = useMemo(() => computeBoardLayout(size, W), [size, W]);

  // Başlangıç durumu + fast-forward
  const initState = useMemo(() => {
    const baseGrid = problem?.initialState
      ? parseInitialState(problem.initialState, size)
      : parseInitialState(initialState, size);
    const baseTurn: Color = problem?.turn ?? startTurn;

    // Çözüm ağacı varsa fast-forward uygula
    if (problem?.solution) {
      const tree = Array.isArray(problem.solution)
        ? { children: problem.solution }
        : problem.solution;
      return computeFastForwardState(baseGrid, baseTurn, tree, size);
    }

    return { grid: baseGrid, turn: baseTurn, lastMove: null, currentNode: null, history: [] };
  }, [problem, initialState, size, startTurn]);

  const [grid, setGrid] = useState<BoardGrid>(initState.grid);
  const [turn, setTurn]  = useState<Color>(initState.turn);
  const [lastMove, setLastMove] = useState<{ x: number; y: number } | null>(initState.lastMove);
  const [boardHistory, setBoardHistory] = useState<string[]>(initState.history);
  const [currentNode, setCurrentNode] = useState<any>(initState.currentNode);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const solvedRef = useRef(false);

  /* currentNode değişince comment + koordinat'i dışarı aktar */
  useEffect(() => {
    if (!onNodeChange) return;
    if (!currentNode) { onNodeChange(null); return; }
    const raw    = currentNode.comment;
    const comment = raw && String(raw).trim() !== '' ? String(raw).trim() : null;
    onNodeChange({
      x: currentNode.x ?? 0,
      y: currentNode.y ?? 0,
      comment,
      color: currentNode.color ?? null,
    });
  }, [currentNode, onNodeChange]);

  /** Taşları düz liste olarak göster */
  const stones = useMemo(() => gridToStones(grid), [grid]);

  /* Hit-test: dokunulan nokta → tahta koordinatı */
  const hitTest = useCallback((touchX: number, touchY: number) => {
    let best: { x: number; y: number; dist: number } | null = null;
    for (let ix = 0; ix < size; ix++) {
      for (let iy = 0; iy < size; iy++) {
        const { x, y } = intersectionXY(padding, cellSize, ix, iy);
        const dist = Math.hypot(touchX - x, touchY - y);
        if (!best || dist < best.dist) best = { x: ix, y: iy, dist };
      }
    }
    if (!best || best.dist > cellSize * 0.6) return null;
    return { x: best.x, y: best.y };
  }, [size, padding, cellSize]);

  /* Dokunma: hamle oyna */
  const handlePress = useCallback((evt: any) => {
    if (readOnly) return;
    const { locationX, locationY } = evt.nativeEvent;
    const pos = hitTest(locationX, locationY);
    if (!pos) return;

    const snapshot = JSON.stringify(grid);
    const result = playMove(pos.x, pos.y, turn, grid, size, boardHistory);

    if (!result.ok) {
      const msgs: Record<string, string> = {
        occupied: '',
        suicide: '⛔ Yasak Hamle',
        ko: '🔄 Ko Kuralı!',
      };
      if (result.reason !== 'occupied') setStatusMsg(msgs[result.reason!] ?? '');
      return;
    }

    setStatusMsg('');
    setBoardHistory(h => [...h, snapshot]);
    setGrid(result.newGrid!);
    setLastMove(pos);
    const nextTurn: Color = turn === 'black' ? 'white' : 'black';
    setTurn(nextTurn);
    onTurnChange?.(nextTurn);

    // Problem çözüm kontrolü — currentNode'un children'larına bak
    if (!solvedRef.current) {
      const children: any[] = currentNode?.children ?? [];
      const matched = children.find((c: any) => c.x === pos.x && c.y === pos.y && c.color === turn);
      if (matched) {
        setCurrentNode(matched);  // ← useEffect onNodeChange'i tetikler
        if (matched.status === 'correct' || (children.length === 1 && matched.children?.length === 0)) {
          solvedRef.current = true;
          onSolve?.();
          setStatusMsg('✅ Doğru!');
        } else if (matched.status === 'wrong') {
          setStatusMsg('❌ Yanlış hamle.');
        }
      } else if (children.length > 0) {
        setStatusMsg('❌ Yanlış hamle.');
      }
    }
  }, [readOnly, grid, turn, size, boardHistory, hitTest, problem, onSolve, onTurnChange]);

  /* Geri al */
  const undo = useCallback(() => {
    if (boardHistory.length === 0) return;
    const prevSnapshot = boardHistory[boardHistory.length - 1]!;
    setGrid(JSON.parse(prevSnapshot));
    setBoardHistory(h => h.slice(0, -1));
    setTurn(t => (t === 'black' ? 'white' : 'black'));
    setLastMove(null);
    setStatusMsg('');
    solvedRef.current = false;
  }, [boardHistory]);

  /* Sıfırla — fast-forward başlangıç pozisyonuna dön */
  const reset = useCallback(() => {
    setGrid(initState.grid);
    setBoardHistory(initState.history);
    setTurn(initState.turn);
    setLastMove(initState.lastMove);
    setCurrentNode(initState.currentNode);
    setStatusMsg('');
    solvedRef.current = false;
  }, [initState]);

  /* ── SVG ── */
  const stars = STAR_POINTS[size] ?? [];

  return (
    <View>
      {/* Durum mesajı */}
      {statusMsg !== '' && (
        <View style={{
          marginBottom: 8, paddingHorizontal: 12, paddingVertical: 6,
          backgroundColor: statusMsg.startsWith('✅') ? '#d1fae5' : statusMsg.startsWith('❌') ? '#fee2e2' : '#fef3c7',
          borderRadius: 10, alignSelf: 'center',
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>{statusMsg}</Text>
        </View>
      )}

      {/* Tahta */}
      <Pressable onPress={handlePress}>
        <Svg width={W} height={W} style={{ borderRadius: 4 }}>
          {/* Ahşap arka plan */}
          <Rect x={0} y={0} width={W} height={W} fill="#E3BA71" rx={4} />

          {/* Grid yatay + dikey çizgiler */}
          {Array.from({ length: size }).map((_, i) => {
            const { x: sx, y: sy } = intersectionXY(padding, cellSize, i, 0);
            const { x: ex, y: ey } = intersectionXY(padding, cellSize, i, size - 1);
            const { x: lx, y: ly } = intersectionXY(padding, cellSize, 0, i);
            const { x: rx, y: ry } = intersectionXY(padding, cellSize, size - 1, i);
            return (
              <G key={i}>
                <Line x1={sx} y1={sy} x2={ex} y2={ey} stroke="rgba(0,0,0,0.6)" strokeWidth={0.8} />
                <Line x1={lx} y1={ly} x2={rx} y2={ry} stroke="rgba(0,0,0,0.6)" strokeWidth={0.8} />
              </G>
            );
          })}

          {/* Dış çerçeve (kalın) */}
          {(() => {
            const { x: x0, y: y0 } = intersectionXY(padding, cellSize, 0, 0);
            const { x: x1, y: y1 } = intersectionXY(padding, cellSize, size-1, size-1);
            return <Rect x={x0} y={y0} width={x1-x0} height={y1-y0} fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth={1.6} />;
          })()}

          {/* Hoshi (star points) */}
          {stars.map(([ix, iy]) => {
            const { x, y } = intersectionXY(padding, cellSize, ix, iy);
            return <Circle key={`h-${ix}-${iy}`} cx={x} cy={y} r={Math.max(1.6, cellSize * 0.07)} fill="rgba(0,0,0,0.75)" />;
          })}

          {/* Koordinat etiketleri */}
          {Array.from({ length: size }).map((_, i) => {
            const col = String.fromCharCode(65 + (i >= 8 ? i + 1 : i)); // I yok
            const { x } = intersectionXY(padding, cellSize, i, 0);
            const { y: yBot } = intersectionXY(padding, cellSize, 0, size-1);
            const fz = Math.max(7, cellSize * 0.28);
            return (
              <G key={`cl-${i}`}>
                <SvgText x={x} y={padding*0.55} textAnchor="middle" fontSize={fz} fill="rgba(0,0,0,0.6)" fontWeight="700">{col}</SvgText>
                <SvgText x={x} y={yBot+padding*0.72} textAnchor="middle" fontSize={fz} fill="rgba(0,0,0,0.6)" fontWeight="700">{col}</SvgText>
              </G>
            );
          })}
          {Array.from({ length: size }).map((_, i) => {
            const row = String(size - i);
            const { y } = intersectionXY(padding, cellSize, 0, i);
            const { x: xR } = intersectionXY(padding, cellSize, size-1, 0);
            const fz = Math.max(7, cellSize * 0.28);
            return (
              <G key={`rl-${i}`}>
                <SvgText x={padding*0.45} y={y+cellSize*0.1} textAnchor="middle" fontSize={fz} fill="rgba(0,0,0,0.6)" fontWeight="700">{row}</SvgText>
                <SvgText x={xR+padding*0.58} y={y+cellSize*0.1} textAnchor="middle" fontSize={fz} fill="rgba(0,0,0,0.6)" fontWeight="700">{row}</SvgText>
              </G>
            );
          })}

          {/* Taşlar */}
          {stones.map((s) => {
            const { x, y } = intersectionXY(padding, cellSize, s.x, s.y);
            const r = cellSize * 0.485;
            const isLast = lastMove?.x === s.x && lastMove?.y === s.y;
            return (
              <G key={`${s.x}-${s.y}`}>
                {/* Gölge */}
                <Circle cx={x+1} cy={y+2} r={r} fill="rgba(0,0,0,0.22)" />
                {/* Taş */}
                <Circle cx={x} cy={y} r={r}
                  fill={s.color === 'black' ? '#1a1a1a' : '#f5f0e8'}
                  stroke={s.color === 'black' ? '#000' : '#888'}
                  strokeWidth={0.6}
                />
                {/* Son hamle işareti */}
                {isLast && (
                  <Circle cx={x} cy={y} r={r * 0.3}
                    fill={s.color === 'black' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)'}
                  />
                )}
              </G>
            );
          })}
        </Svg>
      </Pressable>

      {/* Kontrol çubuğu */}
      {!readOnly && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 }}>
          {/* Sıra göstergesi */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: turn === 'black' ? '#1a1a1a' : '#f5f0e8',
              borderWidth: 1, borderColor: '#888',
            }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
              {turn === 'black' ? 'Siyah' : 'Beyaz'} oynuyor
            </Text>
          </View>
          {/* Butonlar */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={undo}
              style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280' }}>↩ Geri Al</Text>
            </Pressable>
            <Pressable onPress={reset}
              style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280' }}>↺ Sıfırla</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
