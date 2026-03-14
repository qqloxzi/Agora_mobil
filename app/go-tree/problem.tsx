/**
 * GameManager.jsx akışına uyumlu: Kategoriye göre problem listesi, sonraki/önceki, bitir.
 * problemSet (problems.ts) kullanılır.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { GoBoardView } from '../../src/components/GoBoardView';
import { getProblemsForCategory } from '../../src/data/problems';
import { markTopicCompleted } from '../../src/lib/goTreeProgress';
import type { Problem } from '../../src/types/tsumego';

function hasNoSolution(problem: Problem): boolean {
  const s = problem.solution;
  if (Array.isArray(s)) return s.length === 0;
  if (s && typeof s === 'object' && 'children' in s)
    return !(s as { children: unknown[] }).children?.length;
  return true;
}

export default function GoTreeProblemScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const problems = (topicId ? getProblemsForCategory(topicId) : []) as Problem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNextActive, setIsNextActive] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const activeProblem = problems[currentIndex] ?? null;
  const progressPercent = problems.length > 0 ? ((currentIndex + 1) / problems.length) * 100 : 0;

  useEffect(() => {
    if (activeProblem && hasNoSolution(activeProblem)) setIsNextActive(true);
  }, [activeProblem]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      };
    }, [])
  );

  const handleSolve = useCallback(
    (success: boolean) => {
      if (success) {
        setIsNextActive(true);
        if (activeProblem?.id)
          setCompletedIds((prev) =>
            prev.includes(activeProblem.id) ? prev : [...prev, activeProblem.id]
          );
      }
    },
    [activeProblem?.id]
  );

  const handleNextProblem = useCallback(async () => {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex((i) => i + 1);
      setIsNextActive(false);
      setStatusMessage('');
      setResetKey((k) => k + 1);
    } else {
      if (!topicId) return;
      const { completed } = await markTopicCompleted(topicId, user?.id ?? null, completedIds);
      setCompletedIds(completed);
      setStatusMessage('Tebrikler! Konu tamamlandı.');
      setTimeout(() => router.back(), 1200);
    }
  }, [currentIndex, problems.length, topicId, user?.id, completedIds, router]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setIsNextActive(true);
      setStatusMessage('');
      setResetKey((k) => k + 1);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setResetKey((k) => k + 1);
    setStatusMessage('');
  }, []);

  if (!topicId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyStateText}>Konu seçilmedi.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.exitBtnText}>Geri</Text>
        </Pressable>
      </View>
    );
  }

  if (problems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.containerInner}>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.emptyStateLink}>← Geri</Text>
          </Pressable>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyStateText}>
              Bu konu için henüz tsumego eklenmedi.
            </Text>
            <Text style={styles.emptyStateSubtext}>{topicId}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenWrap} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.screenInner}>
        {/* 1. Üst bilgi çubuğu (Header) */}
        <View style={styles.headerSection}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {topicId} ({currentIndex + 1} / {problems.length})
            </Text>
            <Pressable onPress={() => router.back()} style={styles.exitBtn}>
              <Text style={styles.exitBtnText}>× Çıkış</Text>
            </Pressable>
          </View>
          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          {activeProblem?.description ? (
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelText} numberOfLines={4}>
                {activeProblem.description}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 2. Go tahtası (merkezde, sabit oranlı) */}
        <View style={styles.boardSection}>
          <GoBoardView
            key={`${activeProblem?.id ?? 0}-${resetKey}`}
            problem={activeProblem!}
            onSolve={handleSolve}
            statusMessage={statusMessage}
            setStatusMessage={setStatusMessage}
          />
        </View>

        {/* 3. Alt kontrol butonları */}
        <View style={styles.controls}>
          <Pressable
            onPress={handlePrev}
            disabled={currentIndex === 0}
            style={[styles.controlBtnGeri, currentIndex === 0 && styles.controlBtnDisabled]}>
            <Text style={[styles.controlBtnGeriText, currentIndex === 0 && styles.controlBtnTextDisabled]}>
              ← Geri
            </Text>
          </Pressable>
          <Pressable onPress={handleRestart} style={styles.controlBtnRestart}>
            <Text style={styles.controlBtnRestartText}>↻</Text>
          </Pressable>
          <Pressable
            onPress={handleNextProblem}
            disabled={!isNextActive}
            style={[styles.controlBtnNext, !isNextActive && styles.controlBtnDisabled]}>
            <Text style={[styles.controlBtnNextText, !isNextActive && styles.controlBtnTextDisabled]}>
              {currentIndex >= problems.length - 1 ? 'Bitir' : 'Sonraki →'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const BG_DARK = '#1C263A';
const PANEL_DARK = '#10162A';
const PROGRESS_GREEN = '#00C897';
const PROGRESS_TRACK = '#0d1220';

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG_DARK,
  },
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  containerInner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  screenWrap: {
    flex: 1,
    backgroundColor: BG_DARK,
  },
  screenInner: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  headerSection: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginRight: 12,
  },
  exitBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  exitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 0,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: PANEL_DARK,
    paddingVertical: 48,
  },
  backBtn: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: PANEL_DARK,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressWrap: {
    height: 5,
    backgroundColor: PROGRESS_TRACK,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PROGRESS_GREEN,
    borderRadius: 3,
  },
  infoPanel: {
    backgroundColor: PANEL_DARK,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  infoPanelText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  boardSection: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 8,
    flexShrink: 0,
  },
  controlBtnGeri: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#2a3142',
  },
  controlBtnGeriText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  controlBtnDisabled: {
    opacity: 0.5,
  },
  controlBtnRestart: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnRestartText: {
    fontSize: 22,
    color: '#ea580c',
    fontWeight: '600',
  },
  controlBtnNext: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#2a3142',
  },
  controlBtnTextDisabled: {
    color: 'rgba(255,255,255,0.6)',
  },
  controlBtnNextText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  emptyStateLink: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 16,
  },
});
