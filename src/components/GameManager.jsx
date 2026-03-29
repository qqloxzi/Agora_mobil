import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GoBoardReact from './GoBoardReact';
import { supabase } from '../lib/supabase';

const ProfileSummaryBox = ({ variant }) => (
  <View style={variant === 'compact' ? styles.profileBoxCompact : styles.profileBox}>
    <Text style={styles.profileText}>Öğrenci Profili</Text>
  </View>
);

const treeStructure = [
  {
    title: '17 Kyu - 12 Kyu Temel Taşlar',
    levels: [
      { id: 'Yaşam & Ölüm 2', label: 'Yaşam & Ölüm 2', icon: 'eye', parent: null },
      { id: 'Tesuji 2', label: 'Tesuji 2', icon: 'lightbulb-on', parent: 'Yaşam & Ölüm 2' },
      { id: 'Güçlü & Zayıf Şekiller', label: 'Şekiller', icon: 'shape-outline', parent: 'Tesuji 2' },
      { id: 'Güçlü & Zayıf Gruplar', label: 'Güçlü & Zayıf Gruplar', icon: 'castle', parent: 'Güçlü & Zayıf Şekiller' }, 
      { id: 'Büyük & Acil Hamleler', label: 'Büyük & Acil Hamleler', icon: 'target', parent: 'Güçlü & Zayıf Şekiller' }, 
      { id: 'Sente & Gote 1', label: 'Sente & Gote 1', icon: 'fast-forward', parent: 'Güçlü & Zayıf Gruplar' }, 
      { id: 'Tenuki', label: 'Tenuki', icon: 'directions-fork', parent: 'Büyük & Acil Hamleler' }, 
      { id: 'Cezalandırma', label: 'Cezalandırma', icon: 'gavel', parent: 'Tenuki' }, 

      // Dal 2
      { id: 'Açılış Safhası', label: 'Açılış Safhası', icon: 'chart-bar', parent: 'Yaşam & Ölüm 2' }, 
      { id: 'Joseki 2', label: 'Joseki 2', icon: 'book-open-variant', parent: 'Açılış Safhası' }, 
      { id: 'Oyun Yönü 1', label: 'Oyun Yönü 1', icon: 'compass-outline', parent: 'Açılış Safhası' },
      { id: 'Nefes Yarışı 2', label: 'Nefes Yarışı 2', icon: 'weather-windy', parent: 'Joseki 2' }, 
      { id: 'Miai', label: 'Miai', icon: 'scale-balance', parent: 'Nefes Yarışı 2' }, 
      
      // Dal 3
      { id: 'Oyun Ortası 1', label: 'Oyun Ortası 1', icon: 'sword-cross', parent: 'Oyun Yönü 1' }, 
      { id: 'Oyun Sonu 1', label: 'Oyun Sonu 1', icon: 'flag', parent: 'Oyun Yönü 1' }, 
    ]
  },
  { 
    title: "11 Kyu - 6 Kyu Gelişim", 
    levels: [
      { id: 'Yaşam & Ölüm 3', label: 'Yaşam & Ölüm 3', icon: 'eye', parent: null },
      
      { id: 'Oyun Yönü 2', label: 'Oyun Yönü 2', icon: 'compass', parent: 'Yaşam & Ölüm 3' },
      { id: 'Oyun Ortası 2', label: 'Oyun Ortası 2', icon: 'sword-cross', parent: 'Oyun Yönü 2' }, 
      { id: 'Moyo', label: 'Moyo', icon: 'arrow-expand-all', parent: 'Oyun Ortası 2' }, 
      { id: 'Oyun Sonu 2', label: 'Oyun Sonu 2', icon: 'flag', parent: 'Oyun Yönü 2' }, 

      { id: 'Tesuji 3', label: 'Tesuji 3', icon: 'lightbulb-on', parent: 'Yaşam & Ölüm 3' },
      { id: 'Joseki 3', label: 'Joseki 3', icon: 'book-open-page-variant', parent: 'Tesuji 3' },
      { id: 'Ko', label: 'Ko', icon: 'infinity', parent: 'Joseki 3' }, 
      { id: 'Haengma', label: 'Haengma', icon: 'butterfly', parent: 'Ko' }, 
    
      { id: 'Sente & Gote 2', label: 'Sente & Gote 2', icon: 'fast-forward', parent: 'Tesuji 3' },
      { id: 'İstila & Küçültme', label: 'İstila & Küçültme', icon: 'parachute', parent: 'Sente & Gote 2' }, 
      { id: 'Yosumiru / Yoklama Hamlesi', label: 'Yosumiru / Yoklama Hamlesi', icon: 'crosshairs-gps', parent: 'İstila & Küçültme' }, 
      { id: 'Saldırı & Savunma', label: 'Saldırı/Savunma', icon: 'shield', parent: 'Sente & Gote 2' }, 
      { id: 'Aji 1', label: 'Aji 1', icon: 'incognito', parent: 'Saldırı & Savunma' }, 
      { id: 'Aji-Keshi', label: 'Aji-Keshi', icon: 'glass-fragile', parent: 'Aji 1' }, 
    ]
  },{ 
    title: "5 Kyu - 1 Dan", 
    levels: [
      { id: 'Yaşam & Ölüm 4', label: 'Yaşam & Ölüm 4', icon: 'eye', parent: null },
      
      { id: 'Oyun Yönü 3', label: 'Oyun Yönü 3', icon: 'compass-outline', parent: 'Tesuji 4' },
      { id: 'Oyun Ortası 3', label: 'Oyun Ortası 3', icon: 'sword-cross', parent: 'Oyun Yönü 3' }, 
      { id: 'Oyun Sonu 3', label: 'Oyun Sonu 3', icon: 'flag', parent: 'Oyun Yönü 3' }, 
      { id: 'Pro Kavrayışı', label: 'Pro Kavrayışı', icon: 'karate', parent: 'Oyun Ortası 3' }, 

      { id: 'Tesuji 4', label: 'Tesuji 4', icon: 'lightbulb-on', parent: 'Yaşam & Ölüm 4' },
      { id: 'Ai', label: 'Ai', icon: 'robot', parent: 'Tesuji 3' }, 
      { id: 'Joseki 4', label: 'Joseki 4', icon: 'book-open-variant', parent: 'Yaşam & Ölüm 4' },
      
      { id: 'Sente & Gote 3', label: 'Sente & Gote 3', icon: 'fast-forward', parent: 'Ai' },
      { id: 'İstila & Küçültme', label: 'İstila & Küçültme', icon: 'parachute', parent: 'Sente & Gote 3' }, 
      { id: 'Saldırı & Savunma', label: 'Saldırı & Savunma', icon: 'shield', parent: 'Sente & Gote 3' }, 
      { id: 'Aji 2', label: 'Aji 2', icon: 'incognito', parent: 'Saldırı & Savunma' }, 
      { id: 'Semeai', label: 'Semeai', icon: 'sword-cross', parent: 'İstila & Küçültme' }, 
      { id: 'Kikashi', label: 'Kikashi', icon: 'lightning-bolt', parent: 'Semeai' }, 
    ]
  },
];

const buildHierarchy = (flatLevels) => {
  const nodes = flatLevels.map(n => ({...n, children: []}));
  const map = {};
  nodes.forEach(n => map[n.id] = n);
  const roots = [];
  
  nodes.forEach(n => {
    if (n.parent && map[n.parent]) {
      map[n.parent].children.push(n);
    } else {
      roots.push(n);
    }
  });
  return roots;
};

const TreeNode = ({ node, completedLevels, startLevel, allProblems }) => {
    const isLocked = node.parent && !completedLevels.includes(node.parent);
    const isCompleted = completedLevels.includes(node.id);
    const questionCount = allProblems.filter(p => p.category === node.id).length;
  
    return (
      <View style={styles.treeNodeContainer}>
        <TouchableOpacity
          style={[
            styles.levelNode,
            isLocked ? styles.levelNodeLocked : {},
            isCompleted ? styles.levelNodeCompleted : {}
          ]}
          onPress={() => startLevel(node.id, isLocked)}
          activeOpacity={isLocked ? 1 : 0.7}
        >
          <View style={[styles.nodeIconWrap, isCompleted && styles.nodeIconWrapCompleted, isLocked && styles.nodeIconWrapLocked]}>
             <MaterialCommunityIcons name={node.icon} size={24} color={isCompleted ? '#fff' : isLocked ? '#94a3b8' : '#334155'} />
          </View>
          {questionCount > 0 && (
              <View style={styles.nodeBadge}>
                  <Text style={styles.nodeBadgeText}>{questionCount}</Text>
              </View>
          )}
          <Text style={[styles.nodeLabel, isLocked && styles.nodeLabelLocked]}>{node.label}</Text>
        </TouchableOpacity>
  
        {node.children && node.children.length > 0 && (
          <View style={styles.nodeChildren}>
             {/* Lines would be complex in pure RN without SVG, using slight left padding to denote hierarchy instead */}
            {node.children.map(child => (
              <View key={child.id} style={styles.childContainer}>
                  <View style={styles.treeLine} />
                  <TreeNode 
                    node={child} 
                    completedLevels={completedLevels}
                    startLevel={startLevel}
                    allProblems={allProblems}
                  />
              </View>
            ))}
          </View>
        )}
      </View>
    );
};

const GameManager = ({ allProblems = [], onPlayingChange }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [gameMode, setGameMode] = useState('tree');
  const [completedLevels, setCompletedLevels] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNextActive, setIsNextActive] = useState(false);
  const [levelStats, setLevelStats] = useState({ correct: 0, wrong: 0 });
  const [currentProblemHasError, setCurrentProblemHasError] = useState(false);
  const [liveTurn, setLiveTurn] = useState('black');
  const boardRef = useRef(null);

  useEffect(() => {
    onPlayingChange?.(gameMode === 'playing' || gameMode === 'result');
  }, [gameMode, onPlayingChange]);

  useEffect(() => {
    const p = activeCategory?.problems?.[currentIndex];
    if (p?.turn) setLiveTurn(p.turn);
  }, [activeCategory, currentIndex]);

  useEffect(() => {
    const initProgress = async () => {
        const localSaved = await AsyncStorage.getItem('goProgress');
        let localData = localSaved ? JSON.parse(localSaved) : [];
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUser(user);
            const { data, error } = await supabase
                .from('user_progress')
                .select('topic_id') 
                .eq('user_id', user.id);
            
            if (data) {
                const dbLevels = data.map(item => item.topic_id);
                const mergedLevels = [...new Set([...localData, ...dbLevels])];
                setCompletedLevels(mergedLevels);
                await AsyncStorage.setItem('goProgress', JSON.stringify(mergedLevels));
            }
        } else {
            setCompletedLevels(localData);
        }
    };
    initProgress();
  }, []);

  useEffect(() => {
    if (gameMode === 'playing') {
       const currentProb = activeCategory?.problems[currentIndex];
       const sol = currentProb?.solution;
       const hasSolution =
         sol &&
         (Array.isArray(sol) ? sol.length > 0 : (sol.children?.length ?? 0) > 0);
       setIsNextActive(!hasSolution); 
    }
  }, [currentIndex, gameMode, activeCategory]);

  const handleLevelComplete = async (category) => {
    if (!completedLevels.includes(category)) {
      const newProgress = [...completedLevels, category];
      setCompletedLevels(newProgress);
      await AsyncStorage.setItem('goProgress', JSON.stringify(newProgress));
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        try { 
          await supabase
              .from('user_progress')
              .insert([{ user_id: user.id, topic_id: category }]);
        } catch (err) { 
            console.error("Beklenmedik Kod Hatası:", err); 
        }
    }
    
    setGameMode('result');
  };

  const startLevel = (categoryId, isLocked) => {
    if (isLocked) return;
    const problems = allProblems.filter(p => p.category === categoryId);
    if (problems.length === 0) return;
    setActiveCategory({ id: categoryId, problems: problems });
    setCurrentIndex(0);
    setLevelStats({ correct: 0, wrong: 0 }); 
    setCurrentProblemHasError(false);
    setGameMode('playing');
  };

  const handleNextProblem = () => {
    if (activeCategory && currentIndex < activeCategory.problems.length - 1) {
      setCurrentIndex(c => c + 1);
      setCurrentProblemHasError(false);
    } else {
      handleLevelComplete(activeCategory.id);
    }
  };

  const handleRestart = () => {
    setCurrentProblemHasError(false); 
    boardRef.current?.restart?.();
  };

  const handleProblemSolve = (success) => {
      if (success) {
          setIsNextActive(true);
          if (!isNextActive) {
              if (currentProblemHasError) setLevelStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
              else setLevelStats(prev => ({ ...prev, correct: prev.correct + 1 }));
          }
      } else {
          setCurrentProblemHasError(true);
      }
  };

  const activeProblem = activeCategory ? activeCategory.problems[currentIndex] : null;
  const progressPercent = activeCategory ? ((currentIndex + 1) / activeCategory.problems.length) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      {gameMode === 'tree' && (
        <ScrollView style={styles.treeScroll} contentContainerStyle={styles.treeScrollContent}>
          <ProfileSummaryBox />
          <View style={styles.dailyMissionsBox}>
             <Text style={styles.dailyTitle}>Günlük Görevler</Text>
             <View style={styles.dailyRow}>
                <Text style={styles.dailyTaskName}>3 soru çöz</Text>
                <Text style={styles.dailyXP}>+15 XP</Text>
             </View>
             <View style={styles.dailyRow}>
                <Text style={styles.dailyTaskName}>Yeni bir seviye aç</Text>
                <Text style={styles.dailyXP}>+25 XP</Text>
             </View>
          </View>

          {treeStructure.map((categoryGroup, index) => {
            const hierarchy = buildHierarchy(categoryGroup.levels);
            return (
              <View key={index} style={styles.treeSection}>
                  <View style={styles.sectionTitleBox}>
                      <View style={styles.sectionTitleLine} />
                      <Text style={styles.sectionTitleText}>{categoryGroup.title}</Text>
                  </View>

                  <View style={styles.orgTree}>
                      {hierarchy.map((rootNode) => (
                          <TreeNode
                              key={rootNode.id}
                              node={rootNode}
                              completedLevels={completedLevels}
                              startLevel={startLevel}
                              allProblems={allProblems}
                          />
                      ))}
                  </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {gameMode === 'playing' && activeProblem && (
        <View style={styles.playingView}>
           <View style={styles.playingHeader}>
               <Text style={styles.playingTitle}>{activeCategory?.id}</Text>
               <TouchableOpacity onPress={() => setGameMode('tree')} style={styles.closeButton}>
                   <MaterialCommunityIcons name="close" size={28} color="#475569" />
               </TouchableOpacity>
           </View>
  
           <View style={styles.progressBar}>
               <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
           </View>
           <Text style={styles.progressText}>{currentIndex + 1} / {activeCategory.problems.length}</Text>

           <View style={styles.boardWrapper}>
               <GoBoardReact
                  ref={boardRef}
                  problem={activeProblem}
                  onSolve={handleProblemSolve}
                  description={activeProblem?.description || ""}
                  showInfoBar={true}
                  hideStudentUndo={true}
                  onTurnChange={setLiveTurn}
               />
           </View>

           <View style={styles.toolbar}>
              <TouchableOpacity style={styles.toolBtn} onPress={() => boardRef.current?.undo()}>
                 <MaterialCommunityIcons name="undo" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, currentIndex === 0 && styles.disabledBtn]} disabled={currentIndex === 0} onPress={() => { setCurrentIndex((c) => c - 1); setIsNextActive(true); }}>
                 <MaterialCommunityIcons name="arrow-left" size={24} color={currentIndex === 0 ? "#ccc" : "#333"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn} onPress={handleRestart}>
                 <MaterialCommunityIcons name="refresh" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolBtn, styles.primaryBtn, !isNextActive && styles.disabledPrimaryBtn]} disabled={!isNextActive} onPress={handleNextProblem}>
                 <MaterialCommunityIcons name="arrow-right" size={24} color={!isNextActive ? "rgba(255,255,255,0.4)" : "#fff"} />
              </TouchableOpacity>
           </View>
        </View>
      )}

      {gameMode === 'result' && (
          <View style={styles.resultOverlay}>
              <View style={styles.resultCard}>
                  <Text style={styles.resultEmoji}>🍵</Text>
                  <Text style={styles.resultTitle}>Tebrikler!</Text>
                  <Text style={styles.resultSubtitle}>"{activeCategory?.id}" seviyesini tamamladınız.</Text>
                  <TouchableOpacity style={styles.resultBtn} onPress={() => setGameMode('tree')}>
                      <Text style={styles.resultBtnText}>Ağaca Dön ve Devam Et →</Text>
                  </TouchableOpacity>
              </View>
          </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  treeScroll: { flex: 1 },
  treeScrollContent: { padding: 16, paddingBottom: 40 },
  profileBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  profileBoxCompact: { display: 'none' },
  profileText: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  dailyMissionsBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  dailyTitle: { fontSize: 12, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 },
  dailyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dailyTaskName: { fontSize: 14, color: '#334155' },
  dailyXP: { fontSize: 14, fontWeight: 'bold', color: '#d97706' },
  treeSection: { marginBottom: 30, alignItems: 'center' },
  sectionTitleBox: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  sectionTitleLine: { width: 40, height: 3, backgroundColor: '#d97706', borderRadius: 2, marginBottom: 5 },
  sectionTitleText: { fontSize: 12, fontWeight: 'bold', color: '#334155', textTransform: 'uppercase', letterSpacing: 1 },
  orgTree: { width: '100%' },
  treeNodeContainer: { alignItems: 'center', marginVertical: 10 },
  levelNode: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 30, paddingRight: 15, paddingLeft: 5, paddingVertical: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  levelNodeLocked: { opacity: 0.6, backgroundColor: '#f1f5f9' },
  levelNodeCompleted: { borderColor: '#2ecc71', backgroundColor: '#f0fdf4' },
  nodeIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  nodeIconWrapCompleted: { backgroundColor: '#2ecc71' },
  nodeIconWrapLocked: { backgroundColor: '#e2e8f0' },
  nodeBadge: { position: 'absolute', top: -5, left: -5, backgroundColor: '#ef4444', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex: 2, borderWidth: 2, borderColor: '#fff' },
  nodeBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  nodeLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  nodeLabelLocked: { color: '#94a3b8' },
  nodeChildren: { marginTop: 10, alignItems: 'center' },
  childContainer: { alignItems: 'center' },
  treeLine: { width: 2, height: 20, backgroundColor: '#cbd5e1' },
  playingView: { flex: 1, backgroundColor: '#fff', paddingTop: 10 },
  playingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
  playingTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  closeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20 },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', marginHorizontal: 20, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3498db' },
  progressText: { textAlign: 'center', fontSize: 12, color: '#64748b', marginTop: 5 },
  boardWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  toolbar: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 20, gap: 15, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  toolBtn: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  primaryBtn: { backgroundColor: '#d97706' },
  disabledBtn: { opacity: 0.4, elevation: 0 },
  disabledPrimaryBtn: { backgroundColor: '#fcd34d', elevation: 0 },
  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  resultCard: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  resultEmoji: { fontSize: 60, marginBottom: 10 },
  resultTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  resultSubtitle: { fontSize: 16, color: '#475569', textAlign: 'center', marginBottom: 30 },
  resultBtn: { backgroundColor: '#10b981', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 100, width: '100%' },
  resultBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' }
});

export default GameManager;