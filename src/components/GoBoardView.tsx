/**
 * Mobil Go tahtası – GoBoardReact.jsx mantığının React Native uyarlaması.
 * Oyun motoru: src/lib/goEngine.ts (nefes, esir alma, Ko, hamle geri al).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  useWindowDimensions,
  StyleSheet,
  Pressable,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import type { SolutionNode, Problem } from '../types/tsumego';
import {
  type StoneColor,
  type GoState,
  playMove as enginePlayMove,
  stepBack as engineStepBack,
  parseInitialState,
  getHoshiPoints,
  parseLabels,
  getCoordinateLabels,
} from '../lib/goEngine';

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
  const padding = 12;
  const maxBoardByHeight = height * 0.45;
  const boardWidth = Math.min(
    Math.max(0, width * 0.9),
    400,
    maxBoardByHeight
  );
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
      Animated.timing(shakeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(wrongFlashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(wrongFlashAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => {
      if (finished) shakeAnim.setValue(0);
    });
  }, [shakeAnim, wrongFlashAnim]);

  const labels = parseLabels(problem.labels ?? '[]', boardSize);
  const hoshi = getHoshiPoints(boardSize);
  const coordLabels = getCoordinateLabels(boardSize);
  const coordMarginH = 18;
  const coordMarginV = 14;
  const coordFontSize = Math.max(10, Math.min(12, cellPx * 0.45));

  // Sadece problem.id değişince sıfırla; parent onSolve(true) ile re-render olsa bile tahta sıfırlanmasın.
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
      if (stones[x] && stones[x][y]) return;

      if (isSolvedRef.current) {
        applyMove(x, y, gameState.turn);
        return;
      }

      const node = currentNodeRef.current;
      const children = 'children' in node ? node.children : [];
      const nextNode = children?.find((c) => c.x === x && c.y === y);

      if (nextNode) {
        if (nextNode.status === 'wrong') {
          triggerWrongFeedback();
          setStatusMessage('Yanlış Yol');
          setIsLocked(true);
          onSolve(false);
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
          triggerWrongFeedback();
          setStatusMessage('Yanlış Hamle');
          setIsLocked(true);
          onSolve(false);
        } else {
          applyMove(x, y, gameState.turn);
        }
      }
    },
    [isLocked, gameState, applyMove, checkStatus, onSolve, hasSolution, triggerWrongFeedback]
  );

  const handleBoardPress = useCallback(
    (ev: { nativeEvent: { locationX?: number; locationY?: number; offsetX?: number; offsetY?: number } }) => {
      const safeCellPx = Number(cellPx);
      if (!Number.isFinite(safeCellPx) || safeCellPx <= 0 || boardSize < 1) return;
      const native = ev.nativeEvent as { locationX?: number; locationY?: number; offsetX?: number; offsetY?: number };
      let locX = Number(native.offsetX ?? native.locationX);
      let locY = Number(native.offsetY ?? native.locationY);
      if (!Number.isFinite(locX)) locX = 0;
      if (!Number.isFinite(locY)) locY = 0;
      const rawCol = locX / safeCellPx;
      const rawRow = locY / safeCellPx;
      const col = Math.floor(rawCol + 0.5);
      const row = Math.floor(rawRow + 0.5);
      const c = Math.max(0, Math.min(boardSize - 1, col));
      const r = Math.max(0, Math.min(boardSize - 1, row));
      if (Number.isNaN(r) || Number.isNaN(c) || !Number.isFinite(r) || !Number.isFinite(c)) return;
      if (__DEV__) {
        console.log('GoBoardView touch:', { locX, locY, cellPx: safeCellPx, row: r, col: c });
      }
      handleCellPress(r, c);
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

  const coordWrap = {
    width: boardWidth + 2 * coordMarginH,
    height: boardWidth + 2 * coordMarginV,
  };
  const coordTextStyle = [styles.coordText, { fontSize: coordFontSize }];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.turnLabel}>
        {gameState.turn === 'white' ? 'Beyaz' : 'Siyah'} oynar
      </Text>
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
        <View style={[styles.coordWrapper, coordWrap]}>
        {coordLabels.cols.map((letter, col) => (
          <View
            key={`top-${col}`}
            style={[
              styles.coordTop,
              {
                left: coordMarginH + padding + col * cellPx - 9,
                width: 18,
                height: coordMarginV,
              },
            ]}>
            <Text style={coordTextStyle}>{letter}</Text>
          </View>
        ))}
        {coordLabels.cols.map((letter, col) => (
          <View
            key={`bot-${col}`}
            style={[
              styles.coordBottom,
              {
                left: coordMarginH + padding + col * cellPx - 9,
                width: 18,
                height: coordMarginV,
                top: coordMarginV + boardWidth,
              },
            ]}>
            <Text style={coordTextStyle}>{letter}</Text>
          </View>
        ))}
        {coordLabels.rows.map((num, row) => (
          <View
            key={`left-${row}`}
            style={[
              styles.coordLeft,
              {
                top: coordMarginV + padding + row * cellPx - 7,
                height: 14,
                width: coordMarginH,
              },
            ]}>
            <Text style={coordTextStyle}>{num}</Text>
          </View>
        ))}
        {coordLabels.rows.map((num, row) => (
          <View
            key={`right-${row}`}
            style={[
              styles.coordRight,
              {
                top: coordMarginV + padding + row * cellPx - 7,
                height: 14,
                width: coordMarginH,
                left: coordMarginH + boardWidth,
              },
            ]}>
            <Text style={coordTextStyle}>{num}</Text>
          </View>
        ))}
      <Animated.View
        style={[
          boardShakeStyle,
          { position: 'absolute', left: coordMarginH, top: coordMarginV, width: boardWidth, height: boardWidth },
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
        <View style={[boardStyles.board, { zIndex: 1 }]}>
          {Array.from({ length: boardSize - 1 }, (_, row) =>
            Array.from({ length: boardSize - 1 }, (_, col) => (
              <View
                key={`g-${row}-${col}`}
                style={[
                  boardStyles.gridCell,
                  {
                    position: 'absolute',
                    left: col * cellPx,
                    top: row * cellPx,
                    width: cellPx,
                    height: cellPx,
                    borderRightWidth: 1,
                    borderBottomWidth: 1,
                    pointerEvents: 'none',
                  },
                ]}
              />
            ))
          )}
          {Array.from({ length: boardSize }, (_, row) =>
            Array.from({ length: boardSize }, (_, col) => {
              const stoneSize = cellPx * 0.88;
              const hoshiSize = Math.max(4, cellPx * 0.15);
              const lastMoveSize = Math.max(4, cellPx * 0.2);
              const intersectionOffset = (s: number) => -s / 2;
              const x = col * cellPx;
              const y = row * cellPx;
              return (
                <View
                  key={`${row}-${col}`}
                  style={[boardStyles.intersectionWrap, { left: x, top: y, pointerEvents: 'none' }]}>
                  {hoshi.some(([hx, hy]) => hx === row && hy === col) && (
                    <View
                      style={[
                        boardStyles.hoshi,
                        {
                          left: intersectionOffset(hoshiSize),
                          top: intersectionOffset(hoshiSize),
                          width: hoshiSize,
                          height: hoshiSize,
                          borderRadius: hoshiSize / 2,
                        },
                      ]}
                    />
                  )}
                  {labels[row][col] != null && !stones[row][col] && (
                    <Text style={[boardStyles.label, { fontSize: Math.max(10, cellPx * 0.35) }]}>
                      {String(labels[row][col])}
                    </Text>
                  )}
                  {stones[row][col] ? (
                    <View
                      style={[
                        boardStyles.stone,
                        {
                          left: intersectionOffset(stoneSize),
                          top: intersectionOffset(stoneSize),
                          width: stoneSize,
                          height: stoneSize,
                          borderRadius: stoneSize / 2,
                          backgroundColor:
                            (stones[row][col] as { color: string }).color === 'black' ? '#1a1a1a' : '#f5f5f5',
                          borderColor:
                            (stones[row][col] as { color: string }).color === 'black' ? '#333' : '#ddd',
                        },
                      ]}
                    />
                  ) : null}
                  {lastMove && lastMove.x === row && lastMove.y === col && (
                    <View
                      style={[
                        boardStyles.lastMove,
                        {
                          left: intersectionOffset(lastMoveSize),
                          top: intersectionOffset(lastMoveSize),
                          width: lastMoveSize,
                          height: lastMoveSize,
                          borderRadius: lastMoveSize / 2,
                          backgroundColor: lastMove.color === 'black' ? '#fff' : '#000',
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })
          )}
        </View>
        <Pressable
          style={{
            position: 'absolute',
            left: padding,
            top: padding,
            width: innerSize,
            height: innerSize,
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

function createBoardStyles(
  boardWidth: number,
  padding: number,
  _cellPx: number,
  _boardSize: number
): {
  board: ViewStyle;
  gridCell: ViewStyle;
  intersectionWrap: ViewStyle;
  stone: ViewStyle;
  lastMove: ViewStyle;
  hoshi: ViewStyle;
  label: TextStyle;
} {
  return {
    board: {
      width: boardWidth,
      height: boardWidth,
      padding,
      backgroundColor: '#E6AA5D',
      borderRadius: 4,
      overflow: 'visible',
      position: 'relative',
      borderLeftWidth: 1,
      borderTopWidth: 1,
      borderColor: '#2b1d0e',
    },
    gridCell: {
      borderColor: '#000',
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
      borderWidth: 1,
    },
    lastMove: {
      position: 'absolute',
    },
    hoshi: {
      position: 'absolute',
      backgroundColor: '#000',
    },
    label: {
      position: 'absolute',
      color: '#1f2937',
      fontWeight: '600',
    },
  };
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  boardCenterWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
  },
  coordWrapper: {
    position: 'relative',
  },
  coordTop: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordBottom: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordLeft: {
    position: 'absolute',
    left: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 4,
  },
  coordRight: {
    position: 'absolute',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  coordText: {
    color: '#e5e7eb',
    fontWeight: '500',
  },
  turnLabel: {
    marginBottom: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#e5e7eb',
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
