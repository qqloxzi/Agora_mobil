/**
 * Mobile Go Board – React Native adaptation of GoBoardReact.jsx logic.
 * Game engine: src/lib/goEngine.ts (liberties, capture, Ko, undo move).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Svg, { Line, Circle, Defs, RadialGradient, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import {
  type GoState,
  type StoneColor,
  playMove as enginePlayMove,
  stepBack as engineStepBack,
  getHoshiPoints,
  getCoordinateLabels,
  parseInitialState,
  parseLabels,
} from '../lib/goEngine';
import type { Problem, SolutionNode } from '../types/tsumego';

function ensureSolutionRoot(solution: Problem['solution']): { children: SolutionNode[] } {
  if (Array.isArray(solution)) return { children: solution };
  if (solution && typeof solution === 'object' && 'children' in solution)
    return solution as { children: SolutionNode[] };
  return { children: [] };
}

export function GoBoardView({
  problem,
  onSolve,
  statusMessage,
  setStatusMessage,
}: {
  problem: Problem;
  onSolve: (success: boolean) => void;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
}) {
  const { width, height } = useWindowDimensions();
  const boardSize = Math.max(1, Math.min(19, problem.size ?? 9));
  const maxBoardByHeight = height * 0.38;
  const boardWidth = Math.min(
    Math.max(0, width * 0.9),
    400,
    maxBoardByHeight
  );

  const minPaddingForStones =
    boardSize > 1
      ? Math.ceil((0.44 * boardWidth) / (boardSize - 1 + 0.88))
      : 12;
  const padding = Math.max(12, minPaddingForStones);
  const innerSize = Math.max(0, boardWidth - 2 * padding);
  const cellPx =
    boardSize > 1 && innerSize > 0 ? innerSize / (boardSize - 1) : Math.max(1, innerSize);

  const initialStateStr = problem.initialState;
  const moveTree = ensureSolutionRoot(problem.solution);
  const hasSolution = moveTree.children && moveTree.children.length > 0;

  const [gameState, setGameState] = useState<GoState>(() => ({
    size: boardSize,
    stones: parseInitialState(initialStateStr, boardSize),
    turn: problem.turn,
    history: [],
    lastMove: null,
  }));
  const [isLocked, setIsLocked] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [previewCoord, setPreviewCoord] = useState<{ r: number; c: number } | null>(null);

  const nodeStackRef = useRef<(SolutionNode | { children: SolutionNode[] })[]>([moveTree]);
  const currentNodeRef = useRef<SolutionNode | { children: SolutionNode[] }>(moveTree);

  const moveTreeRef = useRef(moveTree);
  moveTreeRef.current = moveTree;

  const gameStateRef = useRef<GoState>(gameState);
  gameStateRef.current = gameState;

  const isSolvedRef = useRef(false);
  const isComputingRef = useRef(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const wrongFlashAnim = useRef(new Animated.Value(0)).current;

  const triggerWrongFeedback = useCallback(() => {
    shakeAnim.setValue(0);
    wrongFlashAnim.setValue(0);
    Animated.parallel([
      Animated.timing(shakeAnim, { toValue: 1, duration: 220, useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(wrongFlashAnim, { toValue: 1, duration: 80, useNativeDriver: false }),
        Animated.timing(wrongFlashAnim, { toValue: 0, duration: 350, useNativeDriver: false }),
      ]),
    ]).start(({ finished }) => {
      if (finished) shakeAnim.setValue(0);
    });
  }, [shakeAnim, wrongFlashAnim]);

  const labels = parseLabels(problem.labels ?? '[]', boardSize);
  const hoshi = getHoshiPoints(boardSize);
  const { cols: coordCols, rows: coordRows } = getCoordinateLabels(boardSize);

  const isCoordNumber = (v: unknown): boolean =>
    typeof v === 'number' || (typeof v === 'string' && /^\d+$/.test(v.trim()));
  const isCoordLetter = (v: unknown): boolean =>
    typeof v === 'string' && /^[A-Za-z]$/.test(v.trim());

  const resetBoard = useCallback(() => {
    const tree = ensureSolutionRoot(problem.solution);
    const nextState: GoState = {
      size: problem.size,
      stones: parseInitialState(problem.initialState, problem.size),
      turn: problem.turn,
      history: [],
      lastMove: null,
    };
    setGameState(nextState);
    gameStateRef.current = nextState;
    setIsLocked(false);
    setIsSolved(false);
    setPreviewCoord(null);
    isSolvedRef.current = false;
    nodeStackRef.current = [tree];
    currentNodeRef.current = tree;
    moveTreeRef.current = tree;
  }, [problem.id]);

  useEffect(() => {
    resetBoard();
  }, [resetBoard]);

  const applyMove = useCallback((x: number, y: number, color: StoneColor): boolean => {
    const result = enginePlayMove(x, y, color, gameState);
    if (!result.success) {
      setStatusMessage(result.message);
      return false;
    }
    setGameState(result.state);
    return true;
  }, [gameState, setStatusMessage]);

  const handleStepBack = useCallback(() => {
    if (isLocked) return;
    if (!isSolvedRef.current && hasSolution && nodeStackRef.current.length > 1) {
      nodeStackRef.current.pop();
      currentNodeRef.current = nodeStackRef.current[nodeStackRef.current.length - 1] ?? moveTreeRef.current;
    }
    const next = engineStepBack(gameState, initialStateStr);
    if (next) {
      setGameState(next);
      setIsLocked(false);
      setPreviewCoord(null);
      setStatusMessage('');
    } else {
      setStatusMessage('Geri alınacak hamle yok.');
    }
  }, [gameState, initialStateStr, hasSolution, isLocked]);

  const checkStatus = useCallback(
    (node: SolutionNode) => {
      if (node.children && node.children.length > 0) {
        if (node.status === 'wrong') {
          setStatusMessage('Yanlış Yol');
          setIsLocked(true);
          onSolve(false);
        }
        return;
      }
      if (node.status === 'correct') {
        setStatusMessage('Tebrikler!');
        setIsLocked(false);
        setIsSolved(true);
        isSolvedRef.current = true;
        onSolve(true);
        return;
      }
      if (node.status === 'wrong') {
        setStatusMessage('Yanlış Yol');
        setIsLocked(true);
        onSolve(false);
        return;
      }
      setStatusMessage('Tebrikler!');
      setIsLocked(false);
      setIsSolved(true);
      isSolvedRef.current = true;
      onSolve(true);
    },
    [onSolve, setStatusMessage]
  );

  const revertLastMoveAfterWrong = useCallback(() => {
    const prev = engineStepBack(gameStateRef.current, initialStateStr);
    if (prev) {
      setGameState(prev);
      gameStateRef.current = prev;
    }
    setIsLocked(false);
    setPreviewCoord(null);
    setStatusMessage('');
  }, [initialStateStr]);

  const handleCellPress = useCallback(
    (x: number, y: number) => {
      if (isLocked || isComputingRef.current) return;
      const { stones, size } = gameState;
      if (
        !stones ||
        !Number.isInteger(x) ||
        !Number.isInteger(y) ||
        x < 0 ||
        x >= size ||
        y < 0 ||
        y >= size
      )
        return;
      
      if (stones[x] && stones[x][y]) {
        setPreviewCoord(null);
        return;
      }

      if (!previewCoord || previewCoord.r !== x || previewCoord.c !== y) {
        setPreviewCoord({ r: x, c: y });
        return;
      }

      setPreviewCoord(null);

      if (isSolvedRef.current) {
        applyMove(x, y, gameState.turn);
        return;
      }

      const node = currentNodeRef.current;
      const children = 'children' in node ? node.children : [];
      const nextNode = children?.find((c) => c.x === x && c.y === y);

      if (nextNode) {
        if (nextNode.status === 'wrong') {
          const moveColor = nextNode.color as StoneColor;
          const applied = applyMove(x, y, moveColor);
          if (!applied) {
            triggerWrongFeedback();
            setStatusMessage('Yanlış Yol');
            setIsLocked(true);
            onSolve(false);
            return;
          }
          triggerWrongFeedback();
          setStatusMessage('Yanlış Yol');
          setIsLocked(true);
          onSolve(false);
          setTimeout(revertLastMoveAfterWrong, 1200);
          return;
        }
        const moveColor = nextNode.color as StoneColor;
        if (!applyMove(x, y, moveColor)) return;
        nodeStackRef.current.push(nextNode);
        currentNodeRef.current = nextNode;

        if (nextNode.children && nextNode.children.length > 0) {
          isComputingRef.current = true;
          const response = nextNode.children[0];
          setTimeout(() => {
            try {
              const state = gameStateRef.current;
              const size = state.size;
              const respColor = response.color as StoneColor;
              const rx = response.x;
              const ry = response.y;
              if (
                Number.isInteger(rx) &&
                Number.isInteger(ry) &&
                rx >= 0 &&
                rx < size &&
                ry >= 0 &&
                ry < size
              ) {
                const result = enginePlayMove(rx, ry, respColor, state);
                if (result.success) {
                  setGameState(result.state);
                  gameStateRef.current = result.state;
                  nodeStackRef.current.push(response);
                  currentNodeRef.current = response;
                  checkStatus(response);
                }
              }
            } finally {
              isComputingRef.current = false;
            }
          }, 250);
        } else {
          checkStatus(nextNode);
        }
      } else {
        if (hasSolution) {
          const applied = applyMove(x, y, gameState.turn);
          if (!applied) {
            triggerWrongFeedback();
            setStatusMessage('Yanlış Hamle');
            setIsLocked(true);
            onSolve(false);
            return;
          }
          triggerWrongFeedback();
          setStatusMessage('Yanlış Hamle');
          setIsLocked(true);
          onSolve(false);
          setTimeout(revertLastMoveAfterWrong, 1200);
        } else {
          applyMove(x, y, gameState.turn);
        }
      }
    },
    [
      isLocked,
      gameState,
      applyMove,
      checkStatus,
      onSolve,
      hasSolution,
      triggerWrongFeedback,
      revertLastMoveAfterWrong,
      previewCoord,
    ]
  );

  const handleBoardPress = useCallback(
    (ev: { nativeEvent: { locationX?: number; locationY?: number; offsetX?: number; offsetY?: number } }) => {
      const safeCellPx = Number(cellPx);
      if (!Number.isFinite(safeCellPx) || safeCellPx <= 0 || boardSize < 1) return;
      const native = ev.nativeEvent as { locationX?: number; locationY?: number; offsetX?: number; offsetY?: number };

      // FIX: Adjust touch location math to account for the expanded Pressable
      let locX = Number(native.offsetX ?? native.locationX) - (safeCellPx / 2);
      let locY = Number(native.offsetY ?? native.locationY) - (safeCellPx / 2);

      if (!Number.isFinite(locX)) locX = 0;
      if (!Number.isFinite(locY)) locY = 0;

      const rawCol = locX / safeCellPx;
      const rawRow = locY / safeCellPx;
      const col = Math.floor(rawCol + 0.5);
      const row = Math.floor(rawRow + 0.5);

      if (row < 0 || col < 0 || row >= boardSize || col >= boardSize) {
        setPreviewCoord(null);
        return;
      }

      if (Number.isNaN(row) || Number.isNaN(col) || !Number.isFinite(row) || !Number.isFinite(col)) return;
      if (__DEV__) {
        console.log('GoBoardView touch:', { locX, locY, cellPx: safeCellPx, row: row, col: col });
      }
      handleCellPress(row, col);
    },
    [handleCellPress, cellPx, boardSize]
  );

  const { stones, turn, lastMove } = gameState;
  const boardStyles = createBoardStyles(boardWidth, padding, cellPx, boardSize);

  const boardShakeStyle = {
    transform: [
      {
        translateX: shakeAnim.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, -6, 6, -4, 0],
        }),
      },
    ],
  };

  const wrongFlashOpacity = wrongFlashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.18],
  });

  const boardContainerSize = { width: boardWidth, height: boardWidth };

  return (
    <View style={styles.wrapper}>
      <View style={styles.turnIndicatorContainer}>
        <View
          style={[
            styles.turnBadge,
            gameState.turn === 'black' ? styles.turnBadgeBlack : styles.turnBadgeWhite,
          ]}>
          <Text
            style={[
              styles.turnText,
              gameState.turn === 'black' ? styles.turnTextBlack : styles.turnTextWhite,
            ]}>
            {gameState.turn === 'white' ? 'Beyaz Oynuyor' : 'Siyah Oynuyor'}
          </Text>
        </View>
      </View>
      
      {!!problem.title && (
        <View style={styles.titleContainer}>
          <Text style={styles.problemTitle}>{problem.title}</Text>
        </View>
      )}

      <View style={styles.statusMessageSlot}>
        {statusMessage ? (
          <Text
            style={[
              styles.statusText,
              statusMessage.includes('Yanlış') || statusMessage.includes('Yasak') || statusMessage.includes('Ko')
                ? styles.statusWrong
                : styles.statusCorrect,
            ]}>
            {statusMessage}
          </Text>
        ) : null}
      </View>
      <View style={styles.boardCenterWrap}>
        <View style={[styles.boardOuterWrapper, boardContainerSize]}>
          <Animated.View
            style={[
              boardShakeStyle,
              {
                position: 'absolute',
                left: 0,
                top: 0,
                width: boardWidth,
                height: boardWidth,
                overflow: 'visible',
              },
            ]}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#dc2626',
                  borderRadius: 4,
                  opacity: wrongFlashOpacity,
                  zIndex: 0,
                  pointerEvents: 'none',
                },
              ]}
            />
            <Svg width={boardWidth} height={boardWidth} style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none' }}>
              <Defs>
                <RadialGradient id="blackStone" cx="30%" cy="25%" r="75%">
                  <Stop offset="0" stopColor="#5A5A5A" />
                  <Stop offset="0.4" stopColor="#222222" />
                  <Stop offset="1" stopColor="#0B0B0B" />
                </RadialGradient>
                <RadialGradient id="whiteStone" cx="30%" cy="25%" r="75%">
                  <Stop offset="0" stopColor="#FFFFFF" />
                  <Stop offset="0.5" stopColor="#F5F5F5" />
                  <Stop offset="1" stopColor="#D1D1D1" />
                </RadialGradient>
              </Defs>
              
              <Rect x="0" y="0" width={boardWidth} height={boardWidth} fill="#DEB887" rx="8" />

              {/* Grid Lines */}
              {Array.from({ length: boardSize }).map((_, i) => {
                const coord = padding + i * cellPx;
                return (
                  <React.Fragment key={`grid-${i}`}>
                    <Line x1={padding} y1={coord} x2={padding + innerSize} y2={coord} stroke="#1A1A1A" strokeWidth="1" />
                    <Line x1={coord} y1={padding} x2={coord} y2={padding + innerSize} stroke="#1A1A1A" strokeWidth="1" />
                  </React.Fragment>
                );
              })}

              {/* Hoshi Points */}
              {hoshi.map(([hx, hy]) => {
                const cx = padding + hy * cellPx;
                const cy = padding + hx * cellPx;
                // Star points should be subtle markers, not dominant circles.
                const r = Math.max(1.4, Math.min(2.2, cellPx * 0.07));
                return <Circle key={`hoshi-${hx}-${hy}`} cx={cx} cy={cy} r={r} fill="#111" />
              })}

              {/* Coordinates: only numbers (left) + letters (bottom) */}
              {Array.from({ length: boardSize }).map((_, i) => {
                const fontSize = Math.max(11, cellPx * 0.38);
                const x = padding * 0.5;
                const y = padding + i * cellPx;
                return (
                  <SvgText
                    key={`coord-row-${i}`}
                    x={x}
                    y={y}
                    fill="#A5630F"
                    fontSize={fontSize}
                    fontWeight="800"
                    textAnchor="middle"
                    alignmentBaseline="central">
                    {coordRows[i]}
                  </SvgText>
                );
              })}
              {Array.from({ length: boardSize }).map((_, j) => {
                const fontSize = Math.max(11, cellPx * 0.38);
                const x = padding + j * cellPx;
                const y = padding + innerSize + padding * 0.5;
                return (
                  <SvgText
                    key={`coord-col-${j}`}
                    x={x}
                    y={y}
                    fill="#A5630F"
                    fontSize={fontSize}
                    fontWeight="800"
                    textAnchor="middle"
                    alignmentBaseline="central">
                    {coordCols[j]}
                  </SvgText>
                );
              })}

              {/* Labels & Stones */}
              {Array.from({ length: boardSize }).map((_, row) =>
                Array.from({ length: boardSize }).map((_, col) => {
                  const x = padding + col * cellPx;
                  const y = padding + row * cellPx;
                  const stoneObj = stones[row][col];
                  const isPreview = previewCoord?.r === row && previewCoord?.c === col;

                  // Labels
                  if (labels[row][col] != null && !stoneObj && !isPreview) {
                    // If the incoming labels contain standard Go coordinates, they will
                    // be rendered below/left by our explicit coordinate renderer above.
                    // This prevents right/top coordinates from being shown and avoids duplicates.
                    const lbl = labels[row][col];
                    const isBorder = row === 0 || row === boardSize - 1 || col === 0 || col === boardSize - 1;
                    if (isBorder && (isCoordNumber(lbl) || isCoordLetter(lbl))) return null;

                    return (
                      <SvgText
                        key={`lbl-${row}-${col}`}
                        x={x}
                        y={y}
                        fill="#A5630F"
                        fontSize={Math.max(10, cellPx * 0.38)}
                        fontWeight="700"
                        textAnchor="middle"
                        alignmentBaseline="central"
                      >
                        {String(lbl)}
                      </SvgText>
                    );
                  }

                  // Stones & Preview
                  if (stoneObj || isPreview) {
                    const isBlack = isPreview ? turn === 'black' : (stoneObj as { color: string }).color === 'black';
                    const r = (cellPx * 0.9) / 2;
                    return (
                      <React.Fragment key={`stone-${row}-${col}`}>
                        <Circle cx={x} cy={y + 1} r={r} fill="rgba(0,0,0,0.3)" opacity={isPreview ? 0 : 1} />
                        <Circle 
                          cx={x} 
                          cy={y} 
                          r={r} 
                          fill={isBlack ? "url(#blackStone)" : "url(#whiteStone)"} 
                          opacity={isPreview ? 0.6 : 1} 
                        />
                      </React.Fragment>
                    );
                  }
                  
                  return null;
                })
              )}
            </Svg>

            {/* Last Move Indicator Overlay (Must be a React Native view to easily float perfectly top of SVG without nesting complexities, or could be in SVG. Decided to keep it RN for exact styling consistency) */}
            {lastMove && (
              <View
                style={[
                  boardStyles.lastMove,
                  {
                    left: padding + lastMove.y * cellPx - Math.max(3, cellPx * 0.16) / 2,
                    top: padding + lastMove.x * cellPx - Math.max(3, cellPx * 0.16) / 2,
                    width: Math.max(3, cellPx * 0.16),
                    height: Math.max(3, cellPx * 0.16),
                    borderRadius: Math.max(3, cellPx * 0.16) / 2,
                    backgroundColor: lastMove.color === 'black' ? '#FFFFFF' : '#000000',
                    zIndex: 2,
                    pointerEvents: 'none',
                  },
                ]}
              />
            )}

            {/* FIX: Expanded Pressable Area */}
            <Pressable
              style={{
                position: 'absolute',
                left: padding - (cellPx / 2),
                top: padding - (cellPx / 2),
                width: innerSize + cellPx,
                height: innerSize + cellPx,
                zIndex: 2,
              }}
              onPress={handleBoardPress}
            />
          </Animated.View>
        </View>
      </View>
      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleStepBack}
          style={({ pressed }) => [styles.undoBtn, pressed && styles.undoBtnPressed]}
        >
          <Text style={styles.undoBtnText}>⤾ Geri Al</Text>
        </Pressable>
      </View>
    </View>
  );
}

const BOARD_BG = '#E8DCC4';
const GRID_LINE = '#2c2c2c';
const HOSHI_BG = '#2c2c2c';

function createBoardStyles(
  boardWidth: number,
  padding: number,
  cellPx: number,
  _boardSize: number
): {
  board: ViewStyle;
  intersectionWrap: ViewStyle;
  stone: ViewStyle;
  lastMove: ViewStyle;
  hoshi: ViewStyle;
  label: TextStyle;
} {
  const stoneShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    default: {},
  });
  return {
    board: {
      width: boardWidth,
      height: boardWidth,
      padding,
      backgroundColor: BOARD_BG,
      borderRadius: 8,
      overflow: 'visible',
      position: 'relative',
    },
    intersectionWrap: {
      position: 'absolute',
      width: 0,
      height: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stone: {
      position: 'absolute',
      borderWidth: 0,
      ...stoneShadow,
    },
    lastMove: {
      position: 'absolute',
    },
    hoshi: {
      position: 'absolute',
      backgroundColor: HOSHI_BG,
    },
    label: {
      position: 'absolute',
      color: '#374151',
      fontWeight: '600',
    },
  };
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexGrow: 0,
  },
  boardCenterWrap: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
    flexGrow: 0,
  },
  boardOuterWrapper: {
    position: 'relative',
    overflow: 'visible',
  },
  turnIndicatorContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  turnBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  turnBadgeBlack: {
    backgroundColor: '#1C263A',
    borderColor: '#0f172a',
  },
  turnBadgeWhite: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  turnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  turnTextBlack: {
    color: '#ffffff',
  },
  turnTextWhite: {
    color: '#1f2937',
  },
  titleContainer: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  problemTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  statusMessageSlot: {
    minHeight: 36,
    justifyContent: 'center',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusCorrect: {
    color: '#34d399',
  },
  statusWrong: {
    color: '#f87171',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexShrink: 0,
  },
  undoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#fff',
    borderWidth: 0,
  },
  undoBtnPressed: {
    opacity: 0.9,
  },
  undoBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ea580c',
  },
});