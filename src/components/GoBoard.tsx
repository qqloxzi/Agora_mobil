/**
 * GoBoard — React Native SVG Go Tahtası
 *
 * Agora_gravity GoBoardReact.jsx oyun motorunun (getLiberties,
 * removeGroup, playMove, Ko kuralı, intihar yasağı) tam portu.
 *
 * Render: react-native-svg (Canvas API yok)
 * Geometri: goBoardLayout.js (aynı kaynak)
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import Svg, {
  Rect,
  Line,
  Circle,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Ellipse,
  Polygon,
} from 'react-native-svg';
import { COURSE_BRAND } from './courses/courseTheme';
import { computeBoardLayout, intersectionXY } from '../lib/goBoardLayout';
import type { BoardLabelCell, GoProblem } from '../types/goProblem';

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
  /** Yanlış hamle yapıldığında çağrılır (doğru çözüm değil) */
  onWrong?: () => void;
  /** true → taşlar yerleştirilemez, sadece gösterim */
  readOnly?: boolean;
  onTurnChange?: (turn: Color) => void;
  /** Aktif node değişince çağrılır — comment, color ve koordinat bilgisi */
  onNodeChange?: (info: { x: number; y: number; comment: string | null; color: string | null } | null) => void;
  /** true → kontrol çubuğundaki sıra göstergesi ("Siyah oynuyor") gizlenir */
  hideTurnIndicator?: boolean;
}

const OPPONENT_RESPONSE_DELAY_MS = 550;

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

function parseBoardLabels(raw: string | undefined, size: number): (BoardLabelCell | null)[][] {
  const empty = Array.from({ length: size }, () => Array<BoardLabelCell | null>(size).fill(null));
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return empty;
    return empty.map((col, x) =>
      col.map((_, y) => {
        const cell = parsed[x]?.[y];
        return cell && typeof cell === 'object' ? (cell as BoardLabelCell) : null;
      })
    );
  } catch {
    return empty;
  }
}

function cleanNodeComment(comment: unknown): string {
  return typeof comment === 'string' ? comment.trim() : '';
}

function nextTurnAfter(color: Color): Color {
  return color === 'black' ? 'white' : 'black';
}

/** Stone radius as a fraction of cell size (diameter ≈ 0.97× cell). */
const STONE_RADIUS_CELL_RATIO = 0.485;
/**
 * Letter label fontSize ≈ ~0.68× cell (substantial vs stones, not oversized).
 * Between prior 0.4 (tiny) and 0.9 (oversized); line-gap halo scales with fontSize.
 */
const LETTER_FONT_CELL_RATIO = 0.68;
/** Half-gap around empty letters, relative to fontSize — scales with letter size. */
const LETTER_LINE_GAP_FONT_RATIO = 0.55;

function letterFontSize(cellSize: number): number {
  return Math.max(9, cellSize * LETTER_FONT_CELL_RATIO);
}

/** Half-gap around empty-point letter labels so grid lines don't touch the glyph. */
function letterLineGapHalf(cellSize: number): number {
  return letterFontSize(cellSize) * LETTER_LINE_GAP_FONT_RATIO;
}

/**
 * Draw a full board line as segments, leaving a clean halo at each gap center.
 * `axis` is the varying coordinate ('x' for horizontal lines, 'y' for vertical).
 */
function gridLineSegments(
  fixed: number,
  start: number,
  end: number,
  gapCenters: number[],
  gapHalf: number,
  axis: 'x' | 'y',
  stroke: string,
  strokeWidth: number,
  keyPrefix: string,
): React.ReactNode[] {
  const sorted = [...gapCenters].sort((a, b) => a - b);
  const segments: React.ReactNode[] = [];
  let cursor = start;
  let seg = 0;
  for (const c of sorted) {
    const gapStart = c - gapHalf;
    const gapEnd = c + gapHalf;
    if (cursor < gapStart - 0.25) {
      const props =
        axis === 'y'
          ? { x1: fixed, y1: cursor, x2: fixed, y2: gapStart }
          : { x1: cursor, y1: fixed, x2: gapStart, y2: fixed };
      segments.push(
        <Line key={`${keyPrefix}-${seg++}`} {...props} stroke={stroke} strokeWidth={strokeWidth} />,
      );
    }
    cursor = Math.max(cursor, gapEnd);
  }
  if (cursor < end - 0.25) {
    const props =
      axis === 'y'
        ? { x1: fixed, y1: cursor, x2: fixed, y2: end }
        : { x1: cursor, y1: fixed, x2: end, y2: fixed };
    segments.push(
      <Line key={`${keyPrefix}-${seg++}`} {...props} stroke={stroke} strokeWidth={strokeWidth} />,
    );
  }
  return segments;
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
  captured?: boolean;
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

  return { ok: true, newGrid, captured };
}

/* ─── Non-first branch'leri otomatik 'wrong' işaretle ─────────────
   SGF'de her dallanmada ilk child doğru yol, diğerleri yanlış.
   Bu fonksiyon tüm ağacı gezer ve non-first child'lara status:'wrong' atar.
   Eğer node'un zaten status'u varsa değiştirmez.
────────────────────────────────────────────────────────────────── */
function markNonFirstBranchesWrong(node: any, isWrongBranch = false): void {
  if (!node) return;
  if (isWrongBranch && !node.status) node.status = 'wrong';
  (node.children ?? []).forEach((child: any, i: number) =>
    markNonFirstBranchesWrong(child, isWrongBranch || i > 0)
  );
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
  // Non-first dalları wrong olarak işaretle
  markNonFirstBranchesWrong(solutionTree);

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
  onWrong,
  readOnly = false,
  onTurnChange,
  onNodeChange,
  hideTurnIndicator = false,
}: GoBoardProps) {
  const { width: screenW } = useWindowDimensions();
  const W = boardSizePx ?? Math.min(screenW - 32, 380);
  const stonePlayer = useAudioPlayer(require('../../assets/sounds/stone.mp3'), {
    downloadFirst: true,
    keepAudioSessionActive: true,
  });
  const capturePlayer = useAudioPlayer(require('../../assets/sounds/capturing.mp3'), {
    downloadFirst: true,
    keepAudioSessionActive: true,
  });
  const playStoneSound = useCallback((captured = false) => {
    const player = captured ? capturePlayer : stonePlayer;
    player.seekTo(0).catch(() => {}).finally(() => player.play());
  }, [capturePlayer, stonePlayer]);

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
  const [hintPos, setHintPos] = useState<{ x: number; y: number } | null>(null);
  const [pausePhase, setPausePhase] = useState<'beforeOpponent' | 'afterOpponent' | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Parent (onNodeChange) already renders SGF comments — keep board status empty
     for move outcomes so the same explanation is not shown twice. */
  const statusForNode = useCallback((comment: unknown, fallback: string) => {
    if (onNodeChange) return '';
    return cleanNodeComment(comment) || fallback;
  }, [onNodeChange]);

  // currentNode.labels'a göre etiketleri güncelle (Gravity syncLabels mantığı)
  const [currentNodeLabels, setCurrentNodeLabels] = useState<(BoardLabelCell | null)[][] >(() =>
    Array.from({ length: initState.currentNode?.labels ? size : size }, () => Array<BoardLabelCell | null>(size).fill(null))
  );

  // Her currentNode değişiminde etiketleri senkronize et
  useEffect(() => {
    const emptyLabels = Array.from({ length: size }, () => Array<BoardLabelCell | null>(size).fill(null));
    const n = currentNode;
    if (!n || !n.labels) {
      setCurrentNodeLabels(emptyLabels);
      return;
    }
    try {
      const parsed = typeof n.labels === 'string' ? JSON.parse(n.labels) : n.labels;
      if (Array.isArray(parsed)) {
        const mapped = emptyLabels.map((col, x) =>
          col.map((_, y) => {
            const cell = parsed[x]?.[y];
            return cell && typeof cell === 'object' ? (cell as BoardLabelCell) : null;
          })
        );
        setCurrentNodeLabels(mapped);
      } else {
        setCurrentNodeLabels(emptyLabels);
      }
    } catch {
      setCurrentNodeLabels(emptyLabels);
    }
  }, [currentNode, size]);

  /* Rakip hamle otomatik oynatma: { node, gridAfterUserMove } */
  const [pendingOpponent, setPendingOpponent] = useState<{
    node: any; gridAfterUser: BoardGrid; paused?: boolean;
  } | null>(null);

  const playOpponentResponse = useCallback(() => {
    setPendingOpponent((pending) => pending ? { ...pending, paused: false } : pending);
    setPausePhase(null);
  }, []);

  useEffect(() => {
    if (!pendingOpponent) return;
    if (pendingOpponent.paused) return;
    const { node: oppNode, gridAfterUser } = pendingOpponent;
    const timer = setTimeout(() => {
      /* Rakibin taşını yerleştir ve esir al */
      const newGrid: BoardGrid = gridAfterUser.map(r => r.map(c => c ? { ...c } : null));
      let captured = false;
      if (oppNode.x !== undefined && oppNode.y !== undefined) {
        newGrid[oppNode.x]![oppNode.y] = { color: oppNode.color };
        const opp: Color = oppNode.color === 'black' ? 'white' : 'black';
        for (const [nx, ny] of [
          [oppNode.x + 1, oppNode.y], [oppNode.x - 1, oppNode.y],
          [oppNode.x, oppNode.y + 1], [oppNode.x, oppNode.y - 1],
        ] as [number, number][]) {
          if (isOnBoard(nx, ny, size) && newGrid[nx]?.[ny]?.color === opp &&
              getLiberties(nx, ny, opp, newGrid, size) === 0) {
            removeGroup(nx, ny, opp, newGrid, size);
            captured = true;
          }
        }
      }
      playStoneSound(captured);
      setGrid(newGrid);
      setLastMove(oppNode.x !== undefined ? { x: oppNode.x, y: oppNode.y } : null);
      setTurn(nextTurnAfter(oppNode.color));
      setCurrentNode(oppNode);
      setBoardHistory(h => [...h, JSON.stringify(gridAfterUser)]);
      setPendingOpponent(null);
      // checkStatus: wrong veya doğru leaf node kontrolü
      if (oppNode.status === 'wrong') {
        setStatusMsg(statusForNode(oppNode.comment, 'Yanlış hamle.'));
        onWrong?.();
      } else if (oppNode.status === 'correct' || !oppNode.children?.length) {
        // Leaf node — doğru çözüm
        solvedRef.current = true;
        onSolve?.();
        setStatusMsg(statusForNode(oppNode.comment, 'Doğru.'));
      }
      // 'auto' modunda comment pause'u yok, stepAfter için koru
      if ((problem?.lessonPlayback ?? 'auto') === 'stepAfter' && oppNode.comment) {
        setPausePhase('afterOpponent');
      }
    }, OPPONENT_RESPONSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pendingOpponent, size, problem?.lessonPlayback, onSolve, playStoneSound, statusForNode]);

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
  const handleBoardTap = useCallback((touchX: number, touchY: number) => {
    if (readOnly) return;
    if (pausePhase === 'beforeOpponent') return;
    if (!Number.isFinite(touchX) || !Number.isFinite(touchY)) return;
    const pos = hitTest(touchX, touchY);
    if (!pos) return;

    const children: any[] = currentNode?.children ?? [];
    const matched = !solvedRef.current
      ? children.find((c: any) => c.x === pos.x && c.y === pos.y)
      : null;
    const moveColor: Color = matched?.color ?? turn;
    const snapshot = JSON.stringify(grid);
    const result = playMove(pos.x, pos.y, moveColor, grid, size, boardHistory);

    if (!result.ok) {
      const msgs: Record<string, string> = {
        occupied: '',
        suicide: 'Yasak hamle',
        ko: 'Ko kuralı',
      };
      if (result.reason !== 'occupied') setStatusMsg(msgs[result.reason!] ?? '');
      return;
    }

    setStatusMsg('');
    setHintPos(null);
    setPausePhase(null);
    setBoardHistory(h => [...h, snapshot]);
    setGrid(result.newGrid!);
    setLastMove(pos);
    playStoneSound(Boolean(result.captured));
    const nextTurn: Color = nextTurnAfter(moveColor);
    setTurn(nextTurn);
    onTurnChange?.(nextTurn);

    // Problem çözüm kontrolü — currentNode'un children'larına bak
    if (!solvedRef.current) {
      if (matched) {
        setCurrentNode(matched);
        const isLeaf = !matched.children || matched.children.length === 0;

        if (matched.status === 'wrong') {
          // Yanlış dal: rakibin cevabını da göster (isLeaf değilse)
          setStatusMsg(statusForNode(matched.comment, ''));
          if (!isLeaf && matched.children.length >= 1) {
            const playback = problem?.lessonPlayback ?? 'auto';
            if (playback === 'stepBefore') {
              setPausePhase('beforeOpponent');
              setPendingOpponent({ node: matched.children[0], gridAfterUser: result.newGrid!, paused: true });
            } else {
              // auto veya stepAfter: rakip otomatik yanıt verir, sonra onSolve tetiklenir
              setPendingOpponent({ node: matched.children[0], gridAfterUser: result.newGrid! });
            }
          } else {
            // Yanlış leaf: hemen bildir
            setStatusMsg(statusForNode(matched.comment, 'Yanlış hamle.'));
            onWrong?.();
          }
          return;
        }

        if ((matched.status === 'correct' && isLeaf) || (!matched.status && isLeaf)) {
          solvedRef.current = true;
          onSolve?.();
          setStatusMsg(statusForNode(matched.comment, 'Doğru.'));
          return;
        }

        // Rakibin SGF cevabını otomatik oynat (isLeaf değilse)
        if (!isLeaf && matched.children.length >= 1) {
          const playback = problem?.lessonPlayback ?? 'auto';
          if (playback === 'stepBefore') {
            setStatusMsg(statusForNode(matched.comment, 'Devam ederek rakibin cevabını gör.'));
            setPausePhase('beforeOpponent');
            setPendingOpponent({ node: matched.children[0], gridAfterUser: result.newGrid!, paused: true });
          } else {
            // Comment lives in parent via onNodeChange; avoid duplicating it here.
            setStatusMsg(statusForNode(matched.comment, ''));
            setPendingOpponent({ node: matched.children[0], gridAfterUser: result.newGrid! });
          }
        }
      } else if (children.length > 0) {
        setCurrentNode(null);
        setStatusMsg('Yanlış hamle — serbest devam edebilirsiniz.');
        onWrong?.();
      }
    }
  }, [readOnly, pausePhase, grid, turn, size, boardHistory, hitTest, problem, onSolve, onWrong, onTurnChange, playStoneSound, statusForNode, currentNode]);

  const handleResponderRelease = useCallback(
    (evt: GestureResponderEvent) => {
      const { locationX, locationY } = evt.nativeEvent;
      handleBoardTap(locationX, locationY);
    },
    [handleBoardTap]
  );

  /* Geri al */
  const undo = useCallback(() => {
    if (boardHistory.length === 0) return;
    const prevSnapshot = boardHistory[boardHistory.length - 1]!;
    setGrid(JSON.parse(prevSnapshot));
    setBoardHistory(h => h.slice(0, -1));
    setTurn(t => (t === 'black' ? 'white' : 'black'));
    setLastMove(null);
    setStatusMsg('');
    setHintPos(null);
    setPausePhase(null);
    setPendingOpponent(null);
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
    setHintPos(null);
    setPausePhase(null);
    setPendingOpponent(null);
    solvedRef.current = false;
  }, [initState]);

  /* ── SVG ── */
  const stars = STAR_POINTS[size] ?? [];
  // currentNode'a göre etiketler (syncLabels mantığı) — problem.labels artık kullanılmıyor
  const labels = currentNodeLabels;
  /** Empty intersections with letter labels — grid lines leave a halo here. */
  const emptyLetterGaps = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const cell = labels[x]?.[y];
        if (cell?.kind === 'letter' && !grid[x]?.[y]) {
          points.push({ x, y });
        }
      }
    }
    return points;
  }, [labels, grid, size]);
  const emptyLetterGapKeys = useMemo(
    () => new Set(emptyLetterGaps.map((p) => `${p.x},${p.y}`)),
    [emptyLetterGaps],
  );
  const lineGapHalf = letterLineGapHalf(cellSize);
  const gradientSuffix = useMemo(() => `${problem?.id ?? 'board'}-${size}`.replace(/[^a-zA-Z0-9_-]/g, '-'), [problem?.id, size]);
  const woodId = `wood-${gradientSuffix}`;
  const blackStoneId = `blackStone-${gradientSuffix}`;
  const whiteStoneId = `whiteStone-${gradientSuffix}`;

  const showHint = useCallback(() => {
    const next = (currentNode?.children ?? []).find((node: any) =>
      Number.isInteger(node?.x) && Number.isInteger(node?.y)
    );
    if (next) {
      setHintPos({ x: next.x, y: next.y });
      setStatusMsg('İpucu gösteriliyor.');
    }
  }, [currentNode]);

  const tone = statusMsg ? statusTone(statusMsg) : 'info';

  return (
    <View style={[styles.boardShell, { width: W }]}>
      {/* Status slot — collapses when empty to keep lesson UI compact. */}
      <View style={[styles.statusSlot, statusMsg === '' && styles.statusSlotCollapsed]}>
        {statusMsg !== '' ? (
          <View
            style={[
              styles.statusBanner,
              tone === 'success'
                ? styles.statusSuccess
                : tone === 'error'
                  ? styles.statusError
                  : styles.statusInfo,
            ]}
          >
            <Text style={styles.statusText} numberOfLines={2}>{statusMsg}</Text>
          </View>
        ) : null}
      </View>

      {/* Tahta */}
      <View style={[styles.boardFrame, { width: W, height: W }]}>
        <Svg width={W} height={W} style={{ borderRadius: 4 }}>
          <Defs>
            <LinearGradient id={woodId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#F5B731" />
              <Stop offset="42%" stopColor="#EDA826" />
              <Stop offset="100%" stopColor="#D4920F" />
            </LinearGradient>
            <RadialGradient id={blackStoneId} cx="35%" cy="30%" r="65%">
              <Stop offset="0%" stopColor="#5b616b" />
              <Stop offset="42%" stopColor="#111827" />
              <Stop offset="100%" stopColor="#020617" />
            </RadialGradient>
            <RadialGradient id={whiteStoneId} cx="35%" cy="28%" r="70%">
              <Stop offset="0%" stopColor="#ffffff" />
              <Stop offset="48%" stopColor="#f8fafc" />
              <Stop offset="100%" stopColor="#cbd5e1" />
            </RadialGradient>
          </Defs>

          {/* Gravity board look: warm SVG wood, no axis labels. */}
          <Rect x={0} y={0} width={W} height={W} fill={`url(#${woodId})`} rx={8} />

          {/* Grid yatay + dikey çizgiler — empty letter points interrupt the lines. */}
          {Array.from({ length: size }).map((_, i) => {
            const { x: colX, y: topY } = intersectionXY(padding, cellSize, i, 0);
            const { y: botY } = intersectionXY(padding, cellSize, i, size - 1);
            const { x: leftX, y: rowY } = intersectionXY(padding, cellSize, 0, i);
            const { x: rightX } = intersectionXY(padding, cellSize, size - 1, i);
            const vertGaps = emptyLetterGaps
              .filter((p) => p.x === i)
              .map((p) => intersectionXY(padding, cellSize, p.x, p.y).y);
            const horizGaps = emptyLetterGaps
              .filter((p) => p.y === i)
              .map((p) => intersectionXY(padding, cellSize, p.x, p.y).x);
            const stroke = 'rgba(0,0,0,0.7)';
            const sw = 0.7;
            return (
              <G key={i}>
                {gridLineSegments(colX, topY, botY, vertGaps, lineGapHalf, 'y', stroke, sw, `v${i}`)}
                {gridLineSegments(rowY, leftX, rightX, horizGaps, lineGapHalf, 'x', stroke, sw, `h${i}`)}
              </G>
            );
          })}

          {/* Hoshi (star points) — skip under empty letter labels */}
          {stars.map(([ix, iy]) => {
            if (emptyLetterGapKeys.has(`${ix},${iy}`)) return null;
            const { x, y } = intersectionXY(padding, cellSize, ix, iy);
            return <Circle key={`h-${ix}-${iy}`} cx={x} cy={y} r={Math.max(2, Math.min(3.2, cellSize * 0.075))} fill="rgba(0,0,0,0.75)" />;
          })}

          {/* Hint marker */}
          {hintPos ? (() => {
            const pt = intersectionXY(padding, cellSize, hintPos.x, hintPos.y);
            return (
              <Circle
                cx={pt.x}
                cy={pt.y}
                r={cellSize * 0.32}
                fill="rgba(15,118,110,0.16)"
                stroke={COURSE_BRAND.accentBright}
                strokeWidth={2}
              />
            );
          })() : null}

          {/* Taşlar */}
          {stones.map((s) => {
            const { x, y } = intersectionXY(padding, cellSize, s.x, s.y);
            const r = cellSize * STONE_RADIUS_CELL_RATIO;
            const isLast = lastMove?.x === s.x && lastMove?.y === s.y;
            return (
              <G key={`${s.x}-${s.y}`}>
                {/* Gölge */}
                <Circle cx={x+1} cy={y+2} r={r} fill="#000000" opacity={0.28} />
                {/* Taş */}
                <Circle cx={x} cy={y} r={r}
                  fill={s.color === 'black' ? '#020617' : '#f8fafc'}
                  stroke={s.color === 'black' ? '#000000' : '#64748b'}
                  strokeWidth={0.7}
                />
                <Circle cx={x} cy={y} r={r}
                  fill={s.color === 'black' ? `url(#${blackStoneId})` : `url(#${whiteStoneId})`}
                  stroke={s.color === 'black' ? '#000000' : '#64748b'}
                  strokeWidth={0.7}
                />
                <Ellipse
                  cx={x - r * 0.28}
                  cy={y - r * 0.28}
                  rx={s.color === 'black' ? r * 0.18 : r * 0.26}
                  ry={s.color === 'black' ? r * 0.11 : r * 0.16}
                  fill={s.color === 'black' ? '#ffffff' : '#ffffff'}
                  opacity={s.color === 'black' ? 0.18 : 0.75}
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

          {/* SGF labels/marks from Gravity board. */}
          {labels.map((col, x) => col.map((cell, y) => {
            if (!cell) return null;
            const pt = intersectionXY(padding, cellSize, x, y);
            const stone = grid[x]?.[y];
            const ink = stone?.color === 'black' ? '#fff' : '#111';
            if (cell.kind === 'letter') {
              const onEmpty = !stone;
              const fontSize = letterFontSize(cellSize);
              // Empty: bold black on wood (grid already gapped). On stone: high-contrast ink.
              const letterFill = onEmpty ? '#111111' : ink;
              return (
                <G key={`lb-${x}-${y}`}>
                  <SvgText
                    x={pt.x}
                    y={pt.y + fontSize * 0.08}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize={fontSize}
                    fontWeight="700"
                    fill={letterFill}
                  >
                    {cell.text}
                  </SvgText>
                </G>
              );
            }
            if (cell.kind === 'circle') {
              return <Circle key={`lb-${x}-${y}`} cx={pt.x} cy={pt.y} r={cellSize * 0.22} fill="none" stroke={ink} strokeWidth={2} />;
            }
            if (cell.kind === 'square') {
              const s = cellSize * 0.24;
              return <Rect key={`lb-${x}-${y}`} x={pt.x - s} y={pt.y - s} width={s * 2} height={s * 2} fill="none" stroke={ink} strokeWidth={2} />;
            }
            if (cell.kind === 'triangle') {
              const s = cellSize * 0.28;
              const points = `${pt.x},${pt.y - s} ${pt.x - s * 0.87},${pt.y + s * 0.5} ${pt.x + s * 0.87},${pt.y + s * 0.5}`;
              return <Polygon key={`lb-${x}-${y}`} points={points} fill="none" stroke={ink} strokeWidth={2} />;
            }
            const s = cellSize * 0.22;
            return (
              <G key={`lb-${x}-${y}`}>
                <Line x1={pt.x - s} y1={pt.y - s} x2={pt.x + s} y2={pt.y + s} stroke={ink} strokeWidth={2} />
                <Line x1={pt.x + s} y1={pt.y - s} x2={pt.x - s} y2={pt.y + s} stroke={ink} strokeWidth={2} />
              </G>
            );
          }))}
        </Svg>
        {!readOnly && (
          <View
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleResponderRelease}
          />
        )}
      </View>

      {/* Kontrol çubuğu — width locked to board so RN centers under the grid */}
      {!readOnly && (
        <View style={styles.controlsRow}>
          {!hideTurnIndicator && (
            <View style={styles.turnBadge}>
              <View style={[
                styles.turnStone,
                { backgroundColor: turn === 'black' ? COURSE_BRAND.ink : '#f5f0e8' },
              ]} />
              <Text style={styles.turnText}>
                {turn === 'black' ? 'Siyah' : 'Beyaz'} oynuyor
              </Text>
            </View>
          )}
          <View style={styles.controlGroup}>
            <Pressable
              onPress={undo}
              accessibilityLabel="Geri al"
              hitSlop={4}
              style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            >
              <Ionicons name="arrow-undo-outline" size={22} color={COURSE_BRAND.primary} />
            </Pressable>
            <Pressable
              onPress={reset}
              accessibilityLabel="Sıfırla"
              hitSlop={4}
              style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            >
              <Ionicons name="refresh-outline" size={22} color={COURSE_BRAND.primary} />
            </Pressable>
            <Pressable
              onPress={showHint}
              accessibilityLabel="İpucu"
              hitSlop={4}
              style={({ pressed }) => [styles.controlButton, styles.hintButton, pressed && styles.controlButtonPressed]}
            >
              <Ionicons name="help-outline" size={22} color={COURSE_BRAND.accent} />
            </Pressable>
            {pausePhase === 'beforeOpponent' && (
              <Pressable
                onPress={playOpponentResponse}
                accessibilityLabel="Devam"
                style={({ pressed }) => [styles.continueButton, pressed && styles.controlButtonPressed]}
              >
                <Ionicons name="play" size={16} color="#fff" />
                <Text style={styles.continueButtonText}>Devam</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function statusTone(msg: string): 'success' | 'error' | 'info' {
  const lower = msg.toLowerCase();
  if (lower.startsWith('doğru') || lower.includes('doğru.')) return 'success';
  if (
    lower.includes('yanlış') ||
    lower.includes('yasak') ||
    lower.includes('ko kural')
  ) return 'error';
  return 'info';
}

const styles = StyleSheet.create({
  boardShell: {
    alignItems: 'center',
    alignSelf: 'center',
  },
  statusSlot: {
    alignSelf: 'stretch',
    minHeight: 40,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSlotCollapsed: {
    minHeight: 0,
    height: 0,
    marginBottom: 0,
    overflow: 'hidden',
  },
  statusBanner: {
    alignSelf: 'stretch',
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSuccess: {
    backgroundColor: COURSE_BRAND.accentSoft,
    borderColor: COURSE_BRAND.accentBorder,
  },
  statusError: {
    backgroundColor: 'rgba(254,242,242,0.95)',
    borderColor: 'rgba(248,113,113,0.35)',
  },
  statusInfo: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(15, 118, 110, 0.16)',
  },
  statusText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: COURSE_BRAND.ink,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  boardFrame: {
    position: 'relative',
    borderRadius: 6,
    backgroundColor: '#D4920F',
    overflow: 'hidden',
  },
  controlsRow: {
    alignSelf: 'stretch',
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  turnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COURSE_BRAND.accentBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  turnStone: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.7)',
  },
  turnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COURSE_BRAND.muted,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(10, 37, 64, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintButton: {
    borderColor: COURSE_BRAND.accentBorder,
    backgroundColor: COURSE_BRAND.accentSoft,
  },
  controlButtonPressed: {
    opacity: 0.82,
    backgroundColor: COURSE_BRAND.pathTrack,
  },
  continueButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COURSE_BRAND.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
