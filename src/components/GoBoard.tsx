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
        setStatusMsg(cleanNodeComment(oppNode.comment) || '❌ Yanlış hamle.');
        onSolve?.();
      } else if (oppNode.status === 'correct' || !oppNode.children?.length) {
        // Leaf node — doğru çözüm
        solvedRef.current = true;
        onSolve?.();
        setStatusMsg(cleanNodeComment(oppNode.comment) || '✅ Doğru!');
      }
      // 'auto' modunda comment pause'u yok, stepAfter için koru
      if ((problem?.lessonPlayback ?? 'auto') === 'stepAfter' && oppNode.comment) {
        setPausePhase('afterOpponent');
      }
    }, OPPONENT_RESPONSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pendingOpponent, size, problem?.lessonPlayback, onSolve, playStoneSound]);

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
        suicide: '⛔ Yasak Hamle',
        ko: '🔄 Ko Kuralı!',
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
          setStatusMsg(cleanNodeComment(matched.comment) || '');
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
            setStatusMsg(cleanNodeComment(matched.comment) || '❌ Yanlış hamle.');
            onSolve?.();
          }
          return;
        }

        if ((matched.status === 'correct' && isLeaf) || (!matched.status && isLeaf)) {
          solvedRef.current = true;
          onSolve?.();
          setStatusMsg(cleanNodeComment(matched.comment) || '✅ Doğru!');
          return;
        }

        // Rakibin SGF cevabını otomatik oynat (isLeaf değilse)
        if (!isLeaf && matched.children.length >= 1) {
          const playback = problem?.lessonPlayback ?? 'auto';
          if (playback === 'stepBefore') {
            setStatusMsg(cleanNodeComment(matched.comment) || 'Devam ederek rakibin cevabını gör.');
            setPausePhase('beforeOpponent');
            setPendingOpponent({ node: matched.children[0], gridAfterUser: result.newGrid!, paused: true });
          } else {
            setPendingOpponent({ node: matched.children[0], gridAfterUser: result.newGrid! });
          }
        }
      } else if (children.length > 0) {
        setCurrentNode(null);
        setStatusMsg('❌ Yanlış hamle — serbest devam edebilirsiniz.');
        onSolve?.();
      }
    }
  }, [readOnly, pausePhase, grid, turn, size, boardHistory, hitTest, problem, onSolve, onTurnChange, playStoneSound]);

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

  return (
    <View style={styles.boardShell}>
      {/* Fixed status slot: prevents board jumping when feedback appears. */}
      <View style={styles.statusSlot}>
        {statusMsg !== '' ? (
          <View
            style={[
              styles.statusBanner,
              statusMsg.startsWith('✅')
                ? styles.statusSuccess
                : statusMsg.startsWith('❌')
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

          {/* Grid yatay + dikey çizgiler */}
          {Array.from({ length: size }).map((_, i) => {
            const { x: sx, y: sy } = intersectionXY(padding, cellSize, i, 0);
            const { x: ex, y: ey } = intersectionXY(padding, cellSize, i, size - 1);
            const { x: lx, y: ly } = intersectionXY(padding, cellSize, 0, i);
            const { x: rx, y: ry } = intersectionXY(padding, cellSize, size - 1, i);
            return (
              <G key={i}>
                <Line x1={sx} y1={sy} x2={ex} y2={ey} stroke="rgba(0,0,0,0.7)" strokeWidth={0.7} />
                <Line x1={lx} y1={ly} x2={rx} y2={ry} stroke="rgba(0,0,0,0.7)" strokeWidth={0.7} />
              </G>
            );
          })}

          {/* Hoshi (star points) */}
          {stars.map(([ix, iy]) => {
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
                fill="rgba(16,185,129,0.18)"
                stroke="#10b981"
                strokeWidth={2}
              />
            );
          })() : null}

          {/* Taşlar */}
          {stones.map((s) => {
            const { x, y } = intersectionXY(padding, cellSize, s.x, s.y);
            const r = cellSize * 0.485;
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
              return (
                <SvgText
                  key={`lb-${x}-${y}`}
                  x={pt.x}
                  y={pt.y + cellSize * 0.02}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize={cellSize * 0.58}
                  fontWeight="800"
                  fill={ink}
                >
                  {cell.text}
                </SvgText>
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

      {/* Kontrol çubuğu */}
      {!readOnly && (
        <View style={styles.controlsRow}>
          {/* Sıra göstergesi — ders modunda gizlenir */}
          {!hideTurnIndicator && (
            <View style={styles.turnBadge}>
              <View style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: turn === 'black' ? '#1a1a1a' : '#f5f0e8',
                borderWidth: 1, borderColor: '#888',
              }} />
              <Text style={styles.turnText}>
                {turn === 'black' ? 'Siyah' : 'Beyaz'} oynuyor
              </Text>
            </View>
          )}
          {/* Gravity-style lesson board controls */}
          <View style={styles.controlGroup}>
            <Pressable onPress={undo}
              style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}>
              <Text style={styles.controlButtonText}>↩</Text>
            </Pressable>
            <Pressable onPress={reset}
              style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}>
              <Text style={styles.controlButtonText}>↺</Text>
            </Pressable>
            <Pressable onPress={showHint}
              style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}>
              <Text style={styles.controlButtonText}>?</Text>
            </Pressable>
            {pausePhase === 'beforeOpponent' && (
              <Pressable onPress={playOpponentResponse}
                style={({ pressed }) => [styles.continueButton, pressed && styles.controlButtonPressed]}>
                <Text style={styles.continueButtonText}>▶ Devam</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  boardShell: {
    alignItems: 'center',
  },
  statusSlot: {
    height: 54,
    minHeight: 54,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statusBanner: {
    maxWidth: '96%',
    minHeight: 38,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 14px rgba(15,23,42,0.10)',
  } as any,
  statusSuccess: {
    backgroundColor: 'rgba(220,252,231,0.92)',
    borderColor: 'rgba(74,222,128,0.45)',
  },
  statusError: {
    backgroundColor: 'rgba(254,242,242,0.92)',
    borderColor: 'rgba(252,165,165,0.55)',
  },
  statusInfo: {
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderColor: 'rgba(15,23,42,0.08)',
  },
  statusText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  boardFrame: {
    position: 'relative',
    borderRadius: 6,
    backgroundColor: '#D4920F',
    overflow: 'hidden',
    boxShadow: '0px 12px 24px rgba(15,23,42,0.22)',
  } as any,
  controlsRow: {
    width: '100%',
    minHeight: 42,
    marginTop: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  turnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  turnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  controlGroup: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 3px 8px rgba(15,23,42,0.08)',
  } as any,
  controlButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: '#eef2ff',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748b',
  },
  continueButton: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 10px rgba(245,158,11,0.25)',
  } as any,
  continueButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
  },
});
