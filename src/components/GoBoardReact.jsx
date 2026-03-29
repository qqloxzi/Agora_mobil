import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, Alert, PanResponder, StyleSheet, Platform } from 'react-native';
import Svg, { Rect, Circle, Line, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';
import { computeBoardLayout } from '../lib/goBoardLayout';
import { newProblemId } from '../lib/newProblemId';

const GoBoardReact = forwardRef(function GoBoardReact(
  {
    problem,
    isTeacher = false,
    onSolve = null,
    description = '',
    showInfoBar = true,
    hideStudentUndo = false,
    onTurnChange = null,
  },
  ref
) {
  const isComputing = useRef(false);
  const [boardWidth, setBoardWidth] = useState(0);
  const [, forceRenderObj] = useState({});
  const triggerRender = () => forceRenderObj({});

  const gameState = useRef({
    size: 9,
    stones: [], 
    labels: [],
    turn: 'black',
    history: [],            
    moveTree: { children: [] }, 
    currentNode: null,          
    lastMove: null,
    isLocked: false,
    hoverPos: { x: -1, y: -1 },
    hasSolution: false,
    mode: 'SOLVE', 
    initialStateStr: "", 
    recordingStartColor: 'black',
  });

  const [statusMsg, setStatusMsg] = useState('');
  const [statusColor, setStatusColor] = useState('#fff');
  const [turnIndicator, setTurnIndicator] = useState('black');
  const [teacherMode, setTeacherMode] = useState('SETUP'); 
  const [currentSize, setCurrentSize] = useState(9); 

  useEffect(() => {
    loadProblemData();
  }, [problem]);

  useEffect(() => {
    onTurnChange?.(turnIndicator);
  }, [turnIndicator, onTurnChange]);

  const loadProblemData = () => {
    const state = gameState.current;
    
    state.size = problem?.size || 9;
    setCurrentSize(state.size);
    resetBoardState(state.size);

    state.turn = problem?.turn || 'black';
    state.recordingStartColor = state.turn;
    state.lastMove = problem?.lastMove || null;
    state.mode = isTeacher ? 'SETUP' : 'SOLVE';
    setTeacherMode(state.mode);

    if (problem?.solution) {
      if (Array.isArray(problem.solution) && problem.solution.length > 0) {
        let ptr = { children: [] };
        state.moveTree = ptr;
        problem.solution.forEach(move => {
          const n = { ...move, children: [], status: null };
          ptr.children.push(n);
          ptr = n;
        });
        ptr.status = 'correct'; 
        state.hasSolution = true;
      } else if (problem.solution.children) {
        state.moveTree = problem.solution;
        state.hasSolution = true;
      } else {
        state.moveTree = { children: [] };
        state.hasSolution = false;
      }
    } else {
      state.moveTree = { children: [] };
      state.hasSolution = false;
    }
    state.currentNode = state.moveTree;

    if (problem?.initialState) {
        try {
            const parsed = typeof problem.initialState === 'string' ? JSON.parse(problem.initialState) : problem.initialState;
            if (Array.isArray(parsed) && parsed.length > 0) {
                state.stones = parsed;
                state.initialStateStr = typeof problem.initialState === 'string' ? problem.initialState : JSON.stringify(parsed);
            }
        } catch(e) { console.error("Parse Error", e); }
    }

    setTurnIndicator(state.turn);
    setStatusMsg(isTeacher ? "Öğretmen Modu: SETUP" : (state.hasSolution ? "" : "Analiz Modu"));
    triggerRender();
  };

  const resetBoardState = (newSize) => {
      const state = gameState.current;
      state.size = newSize;
      state.stones = Array(newSize).fill(0).map(() => Array(newSize).fill(null));
      state.labels = Array(newSize).fill(0).map(() => Array(newSize).fill(null));
      state.history = [];
      state.isLocked = false;
      state.hoverPos = { x: -1, y: -1 };
  };

  const handleSizeChange = (newSize) => {
      if (!isTeacher) return;
      const state = gameState.current;
      state.size = newSize;
      setCurrentSize(newSize);
      resetBoardState(newSize);
      state.moveTree = { children: [] };
      state.currentNode = state.moveTree;
      state.initialStateStr = "";
      state.history = [];
      state.lastMove = null;
      setStatusMsg(`${newSize}x${newSize} Tahta Hazır`);
      triggerRender();
  };

  const toggleTeacherMode = (newMode) => {
      const state = gameState.current;
      if (newMode === 'SETUP') {
          state.mode = 'SETUP';
          showMessage("Taşları dizin.", '#fff');
      } 
      else if (newMode === 'RECORD') {
          state.initialStateStr = JSON.stringify(state.stones);
          state.recordingStartColor = state.turn;
          state.moveTree = { children: [] };
          state.currentNode = state.moveTree;
          state.history = [];
          state.mode = 'RECORD';
          showMessage("Kayıt Başladı", '#f1c40f');
      }
      setTeacherMode(newMode);
  };

  const handleStepBack = () => {
      const state = gameState.current;

      if (!state.hasSolution) {
          if (state.history.length === 0) { return; }
          const prevBoard = state.history.pop();
          state.stones = JSON.parse(prevBoard);
          state.turn = state.turn === 'black' ? 'white' : 'black';
          setTurnIndicator(state.turn);
          state.lastMove = null; 
          showMessage("Hamle geri alındı.", "#f1c40f"); 
          triggerRender();
          return;
      }

      if (!state.currentNode || state.currentNode === state.moveTree) {
          return;
      }

      if (state.history.length > 0) {
          const prevBoard = state.history.pop(); 
          state.stones = JSON.parse(prevBoard);  
      } else if (state.initialStateStr) {
          state.stones = JSON.parse(state.initialStateStr);
      }

      if (state.currentNode.parent) {
          state.currentNode = state.currentNode.parent;
      } else {
          state.currentNode = state.moveTree;
      }

      state.turn = state.turn === 'black' ? 'white' : 'black';
      setTurnIndicator(state.turn);

      if (state.currentNode && state.currentNode !== state.moveTree) {
          state.lastMove = { x: state.currentNode.x, y: state.currentNode.y, color: state.currentNode.color };
      } else {
          state.lastMove = null;
      }

      state.isLocked = false; 
      setStatusMsg(''); 
      setStatusColor('#fff');
      triggerRender();
  };

  const markNodeStatus = (status) => {
      const state = gameState.current;
      if (state.mode !== 'RECORD') return;
      if (!state.currentNode || state.currentNode === state.moveTree) {
          showMessage("Henüz hamle yok!", "#e74c3c"); return;
      }
      state.currentNode.status = status;
      showMessage(status === 'correct' ? "✅ İşaretlendi" : "❌ İşaretlendi", status === 'correct' ? '#2ecc71' : '#e74c3c');
  };

  const handleExport = () => {
      Alert.alert('Bilgi', 'Mobil uygulamada export fonksiyonu devredışıdır.');
  };

  const handleTeacherColorToggle = () => {
      const state = gameState.current;
      state.turn = state.turn === 'black' ? 'white' : 'black';
      setTurnIndicator(state.turn);
  };

  const isOnBoard = (x, y) => x >= 0 && x < gameState.current.size && y >= 0 && y < gameState.current.size;
  
  const getLiberties = (x, y, color, stones, checked = new Set()) => {
      const key = `${x},${y}`;
      if (checked.has(key)) return 0;
      checked.add(key);
      let lib = 0;
      [[x+1, y], [x-1, y], [x, y+1], [x, y-1]].forEach(([nx, ny]) => {
          if (isOnBoard(nx, ny)) {
              if (!stones[nx][ny]) lib++;
              else if (stones[nx][ny].color === color) lib += getLiberties(nx, ny, color, stones, checked);
          }
      });
      return lib;
  };

  const removeGroup = (x, y, color, stones) => {
      const stone = stones[x][y];
      if (!stone || stone.color !== color) return;
      stones[x][y] = null;
      [[x+1, y], [x-1, y], [x, y+1], [x, y-1]].forEach(([nx, ny]) => { if (isOnBoard(nx, ny)) removeGroup(nx, ny, color, stones); });
  };

  const playMove = (x, y, color) => {
      const state = gameState.current;
      
      const currentBoardSnapshot = JSON.stringify(state.stones);
      const newStones = JSON.parse(currentBoardSnapshot); 
      if (newStones[x][y]) return false;
      newStones[x][y] = { color };

      let captured = false;
      const opp = color === 'black' ? 'white' : 'black';
      
      [[x+1, y], [x-1, y], [x, y+1], [x, y-1]].forEach(([nx, ny]) => {
          if (isOnBoard(nx, ny) && newStones[nx][ny] && newStones[nx][ny].color === opp && getLiberties(nx, ny, opp, newStones) === 0) {
              removeGroup(nx, ny, opp, newStones); captured = true;
          }
      });

      if (!captured && getLiberties(x, y, color, newStones) === 0) { showMessage("Yasak Hamle", "#e74c3c"); return false; }
      
      const newBoardStr = JSON.stringify(newStones);
      if (state.history.includes(newBoardStr)) {
          showMessage("Ko Kuralı!", "#e74c3c");
          return false;
      }

      state.history.push(currentBoardSnapshot); 
      state.stones = newStones;
      state.lastMove = { x, y, color };
      return true;
  };

  const handleTouchAction = (nativeEvent, isPress) => {
    const state = gameState.current;
    if (state.isLocked && state.mode === 'SOLVE') return;
    if (!boardWidth) return;

    const { locationX, locationY } = nativeEvent;
    const { padding: pad, cellSize } = computeBoardLayout(state.size, boardWidth);
    const mouseX = locationX - pad;
    const mouseY = locationY - pad;
    const x = Math.round(mouseX / cellSize); 
    const y = Math.round(mouseY / cellSize);
    
    if (isOnBoard(x, y)) {
       if (!isPress) {
          if (state.hoverPos.x !== x || state.hoverPos.y !== y) { 
              state.hoverPos = { x, y }; 
              triggerRender();
          }
       } else {
          // It's a click
          handleClickProcess(x, y);
       }
    } else {
       if (!isPress) {
          state.hoverPos = { x: -1, y: -1 }; 
          triggerRender();
       }
    }
  };

  const handleClickProcess = (x, y) => {
      const state = gameState.current;
      if (isComputing.current) return;
      if (!isOnBoard(x, y) || state.isLocked) return;
      if (state.stones[x][y]) return;

      if (state.mode === 'SETUP') {
          state.stones[x][y] = { color: state.turn };
          triggerRender();
          return;
      }

      if (state.mode === 'RECORD') {
          const moveColor = state.turn;
          if (playMove(x, y, moveColor)) {
              const newNode = { 
                  x, y, 
                  color: moveColor, 
                  children: [], 
                  status: null, 
                  parent: state.currentNode 
              };
              
              const existingChild = state.currentNode.children.find(c => c.x === x && c.y === y);
              if (existingChild) {
                  state.currentNode = existingChild;
                  showMessage("Mevcut varyasyon", "#3498db");
              } else {
                  state.currentNode.children.push(newNode);
                  state.currentNode = newNode;
              }
              state.turn = state.turn === 'black' ? 'white' : 'black';
              setTurnIndicator(state.turn);
              triggerRender();
          }
          return;
      }

      if (state.mode === 'SOLVE') {
          const nextNode = state.currentNode.children?.find(c => c.x === x && c.y === y);
          
          if (nextNode) {
              if (playMove(x, y, nextNode.color)) {
                  state.currentNode = nextNode;
                  state.turn = state.turn === 'black' ? 'white' : 'black';
                  setTurnIndicator(state.turn);
                  triggerRender();

                  if (nextNode.children && nextNode.children.length > 0) {
                      isComputing.current = true; 
                      
                      setTimeout(() => {
                          const responseNode = nextNode.children[0]; 
                          if (playMove(responseNode.x, responseNode.y, responseNode.color)) {
                              state.currentNode = responseNode;
                              state.turn = state.turn === 'black' ? 'white' : 'black';
                              setTurnIndicator(state.turn); 
                              triggerRender();
                              checkStatus(responseNode);
                          }
                          isComputing.current = false; 
                      }, 400); 
                  } else {
                      checkStatus(nextNode);
                  }
              }
          } else {
              if(!state.hasSolution) { 
                 if (playMove(x, y, state.turn)) {
                     state.turn = state.turn === 'black' ? 'white' : 'black';
                     setTurnIndicator(state.turn); 
                     triggerRender();
                 }
              } else {
                 showMessage("Yanlış Hamle", "#e74c3c"); 
                 state.isLocked = true;
                 if(onSolve) onSolve(false);
              }
          }
      }
  };

  const checkStatus = (node) => {
      if (node.children && node.children.length > 0) {
          if (node.status === 'wrong') {
             showMessage("Yanlış Yol", "#e74c3c"); 
             if(onSolve) onSolve(false);
          }
          return;
      }

      if (node.status === 'correct') {
          showMessage("Tebrikler! Serbest mod aktif.", "#2ecc71"); 
          gameState.current.isLocked = false;
          gameState.current.hasSolution = false; 
          if(onSolve) onSolve(true);
      } 
      else if (node.status === 'wrong') {
          showMessage("Yanlış Yol", "#e74c3c"); 
          gameState.current.isLocked = true; 
          if(onSolve) onSolve(false);
      } 
      else {
          if(!node.children || node.children.length === 0) {
              showMessage("Tebrikler! Çözdünüz. Serbest analiz modu aktif.", "#2ecc71");
              gameState.current.isLocked = false;
              gameState.current.hasSolution = false;
              if(onSolve) onSolve(true);
          }
      }
  };

  const showMessage = (msg, color) => { setStatusMsg(msg); setStatusColor(color); };
  const resetBoard = () => loadProblemData();

  useImperativeHandle(
    ref,
    () => ({
      undo: () => handleStepBack(),
      restart: () => resetBoard(),
    }),
    [problem]
  );

  const statusTone = !statusMsg
    ? 'empty'
    : /e74c3c|ef4444/i.test(statusColor)
      ? 'error'
      : /2ecc71|22c55e/i.test(statusColor)
        ? 'success'
        : 'info';

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouchAction(evt.nativeEvent, false),
      onPanResponderMove: (evt) => handleTouchAction(evt.nativeEvent, false),
      onPanResponderRelease: (evt) => {
        handleTouchAction(evt.nativeEvent, true);
        gameState.current.hoverPos = { x: -1, y: -1 };
        triggerRender();
      },
    })
  ).current;

  const renderBoardSvg = () => {
      if (boardWidth === 0) return null;
      const state = gameState.current;
      const size = state.size;
      const { padding, cellSize } = computeBoardLayout(size, boardWidth);

      const GO_BOARD_WOOD = '#E3A857';
      const lines = [];
      for (let i = 0; i < size; i++) {
        const raw = padding + i * cellSize;
        // vertical
        lines.push(<Line key={`v${i}`} x1={raw} y1={padding} x2={raw} y2={boardWidth - padding} stroke="rgba(0,0,0,0.8)" strokeWidth={1} />);
        // horizontal
        lines.push(<Line key={`h${i}`} x1={padding} y1={raw} x2={boardWidth - padding} y2={raw} stroke="rgba(0,0,0,0.8)" strokeWidth={1} />);
      }

      const hoshiPoints = [];
      const r = Math.max(2, cellSize * 0.06);
      const dot = (xi, yi, k) => hoshiPoints.push(<Circle key={`hpt${k}`} cx={padding + xi * cellSize} cy={padding + yi * cellSize} r={r} fill="rgba(0,0,0,0.8)" />);
      
      if (size === 9) {
          [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]].forEach(([x, y], i) => dot(x, y, i));
      } else if (size === 13) {
          [[3, 9], [3, 3], [6, 6], [9, 9], [9, 3]].forEach(([x, y], i) => dot(x, y, i));
      } else if (size === 19) {
          let k=0;
          [3, 9, 15].forEach((x) => [3, 9, 15].forEach((y) => { dot(x, y, k); k++; }));
      } else if (size >= 5) {
          const c = Math.floor((size - 1) / 2);
          dot(c, c, 0);
      }

      const stonesRender = [];
      const renderSingleStone = (x, y, color, opacity, id) => {
          const cx = padding + x * cellSize;
          const cy = padding + y * cellSize;
          const sr = cellSize * 0.47;
          
          let fillUrl = color === 'black' ? 'url(#blackGrad)' : 'url(#whiteGrad)';

          stonesRender.push(
              <Circle key={`stone_${id}`} cx={cx} cy={cy} r={sr} fill={fillUrl} opacity={opacity} />
          );
      };

      state.stones.forEach((row, x) => {
          row.forEach((stone, y) => {
              if (stone) {
                  renderSingleStone(x, y, stone.color, 1, `${x}_${y}`);
              }
          });
      });

      if (state.lastMove) {
          const { x, y } = state.lastMove;
          stonesRender.push(
              <Circle 
                key="last_move" 
                cx={padding + x * cellSize} 
                cy={padding + y * cellSize} 
                r={cellSize * 0.15} 
                fill={state.stones[x][y].color === "black" ? "#fff" : "#000"} 
              />
          );
      }

      const { x: hx, y: hy } = state.hoverPos;
      if (hx >= 0 && hy >= 0 && !state.stones[hx][hy] && !state.isLocked) {
          renderSingleStone(hx, hy, state.turn, 0.45, 'hover');
      }

      return (
          <Svg width={boardWidth} height={boardWidth}>
              <Defs>
                  <RadialGradient id="blackGrad" cx="30%" cy="30%" rx="70%" ry="70%" fx="30%" fy="30%">
                      <Stop offset="0%" stopColor="#666" />
                      <Stop offset="50%" stopColor="#333" />
                      <Stop offset="100%" stopColor="#000" />
                  </RadialGradient>
                  <RadialGradient id="whiteGrad" cx="30%" cy="30%" rx="70%" ry="70%" fx="30%" fy="30%">
                      <Stop offset="0%" stopColor="#fff" />
                      <Stop offset="60%" stopColor="#f5f5f5" />
                      <Stop offset="100%" stopColor="#e0e0e0" />
                  </RadialGradient>
              </Defs>
              <Rect width={boardWidth} height={boardWidth} fill={GO_BOARD_WOOD} />
              <Rect x={0.5} y={0.5} width={boardWidth-1} height={boardWidth-1} stroke="rgba(55, 38, 14, 0.28)" strokeWidth={1} fill="none" />
              {lines}
              {hoshiPoints}
              {stonesRender}
          </Svg>
      );
  };

  return (
    <View style={hideStudentUndo ? styles.tightContainer : styles.container}>
      {showInfoBar && (!isTeacher || teacherMode === 'RECORD') && (
        <View style={styles.topInfoBar}>
          <View style={styles.turnBadge}>
            <View style={[styles.turnIndicator, problem?.turn === 'white' ? styles.whiteIndicator : styles.blackIndicator]} />
            <Text style={styles.turnText}>
              {problem?.turn === 'white' ? 'Beyaz' : 'Siyah'}
            </Text>
            {problem?.title && (
              <>
                <Text style={styles.separator}>|</Text>
                <Text style={styles.titleText}>{problem.title}</Text>
              </>
            )}
          </View>
        </View>
      )}

      {description ? (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>{description}</Text>
        </View>
      ) : null}

      <View style={styles.boardArena}>
        <View style={styles.statusSlot}>
          {!!statusMsg && (
            <View style={[styles.statusBanner, styles[`status_${statusTone}`]]}>
              <Text style={styles.statusText}>{statusMsg}</Text>
            </View>
          )}
        </View>

        <View 
            style={styles.wrapperShadow}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                setBoardWidth(w);
            }}
            {...panResponder.panHandlers}
        >
          {renderBoardSvg()}
        </View>
      </View>

      {!isTeacher && !hideStudentUndo && (
        <View style={styles.studentControls}>
          <TouchableOpacity style={styles.btnUndo} onPress={handleStepBack}>
            <Text style={styles.btnUndoText}>↩ Geri Al</Text>
          </TouchableOpacity>
        </View>
      )}

      {isTeacher && (
        <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.controlBtn} onPress={resetBoard}>
                <Text style={styles.controlEmoji}>↺</Text>
            </TouchableOpacity>
            
            <View style={styles.teacherControls}>
                <View style={styles.divider} />
                
                {teacherMode === 'SETUP' ? (
                    <>
                        <View style={styles.sizeGroup}>
                            {[9, 13, 19].map(s => (
                                <TouchableOpacity 
                                    key={s}
                                    onPress={() => handleSizeChange(s)}
                                    style={[styles.sizeBtn, currentSize === s && styles.sizeBtnActive]}
                                >
                                    <Text style={[styles.sizeBtnText, currentSize === s && styles.sizeBtnTextActive]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.controlBtn} onPress={handleTeacherColorToggle}>
                            <View style={[styles.turnIndicator, turnIndicator === 'black' ? styles.whiteIndicator : styles.blackIndicator]} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.controlBtn, styles.px2]} onPress={() => toggleTeacherMode('RECORD')}>
                            <Text style={styles.controlText}>🔴 Kayıt</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity style={[styles.controlBtn, styles.bgCorrect]} onPress={() => markNodeStatus('correct')}>
                            <Text style={styles.controlEmoji}>✅</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.controlBtn, styles.bgWrong]} onPress={() => markNodeStatus('wrong')}>
                            <Text style={styles.controlEmoji}>❌</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.controlBtn, styles.bgWarn]} onPress={handleStepBack}>
                            <Text style={styles.controlEmoji}>↩️</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.controlBtn} onPress={handleExport}>
                            <Text style={styles.controlText}>💾 İndir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlBtn} onPress={() => toggleTeacherMode('SETUP')}>
                            <Text style={styles.controlEmoji}>⚙️</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tightContainer: { width: '100%', alignItems: 'center' },
  topInfoBar: { marginBottom: 10 },
  turnBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  turnIndicator: { width: 14, height: 14, borderRadius: 7 },
  blackIndicator: { backgroundColor: '#000' },
  whiteIndicator: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc' },
  turnText: { marginLeft: 8, fontSize: 14, fontWeight: '500', color: '#334155' },
  separator: { marginHorizontal: 8, color: '#94a3b8' },
  titleText: { fontWeight: '600', color: '#d97706' },
  hintBox: { backgroundColor: '#fffbe1', padding: 8, borderRadius: 8, marginVertical: 8 },
  hintText: { fontSize: 13, color: '#b45309' },
  boardArena: { width: '100%', maxWidth: 500, aspectRatio: 1, alignItems: 'center', position: 'relative', marginTop: 10 },
  statusSlot: { height: 30, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 5, width: '100%' },
  statusBanner: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  status_info: { backgroundColor: '#3498db' },
  status_success: { backgroundColor: '#2ecc71' },
  status_error: { backgroundColor: '#e74c3c' },
  statusText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  wrapperShadow: { width: '100%', aspectRatio: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  studentControls: { marginTop: 20, alignItems: 'center' },
  btnUndo: { backgroundColor: '#e2e8f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  btnUndoText: { color: '#475569', fontWeight: '600' },
  bottomControls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 },
  controlBtn: { minWidth: 40, height: 40, backgroundColor: '#fff', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: '#e2e8f0' },
  px2: { paddingHorizontal: 10 },
  controlEmoji: { fontSize: 16 },
  controlText: { fontSize: 14, fontWeight: '500', color: '#334155' },
  teacherControls: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  divider: { width: 1, height: 30, backgroundColor: '#cbd5e1', marginHorizontal: 10 },
  sizeGroup: { flexDirection: 'row', gap: 5 },
  sizeBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5 },
  sizeBtnActive: { backgroundColor: '#3498db', borderColor: '#3498db' },
  sizeBtnText: { color: '#94a3b8' },
  sizeBtnTextActive: { color: 'white' },
  bgCorrect: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
  bgWrong: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
  bgWarn: { backgroundColor: '#e67e22', borderColor: '#e67e22' }
});

export default GoBoardReact;