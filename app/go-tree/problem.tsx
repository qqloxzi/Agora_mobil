/**
 * GameManager.jsx akışına uyumlu: Kategoriye göre problem listesi, sonraki/önceki, bitir.
 * problemSet (problems.ts) kullanılır.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
        <Text className="text-gray-500">Konu seçilmedi.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text className="text-white font-semibold">Geri</Text>
        </Pressable>
      </View>
    );
  }

  if (problems.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingHorizontal: 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text className="text-blue-600 font-semibold">← Geri</Text>
        </Pressable>
        <View style={styles.emptyBox}>
          <Text className="text-gray-500 text-center px-4">
            Bu konu için henüz tsumego eklenmedi.
          </Text>
          <Text className="mt-2 text-sm text-gray-400">{topicId}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text className="text-blue-600 font-semibold">← Çıkış</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {topicId}
        </Text>
        <Text style={styles.counter}>
          {currentIndex + 1} / {problems.length}
        </Text>
      </View>

      {/* İlerleme çubuğu (GameManager progress bar) */}
      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {activeProblem?.description ? (
        <Text className="text-gray-600 text-sm mb-4">{activeProblem.description}</Text>
      ) : null}

      <GoBoardView
        key={`${activeProblem?.id ?? 0}-${resetKey}`}
        problem={activeProblem!}
        onSolve={handleSolve}
        statusMessage={statusMessage}
        setStatusMessage={setStatusMessage}
      />

      {/* Alt kontroller: Geri, Yeniden Başlat, Sonraki / Bitir (GameManager game-controls-bottom) */}
      <View style={styles.controls}>
        <Pressable
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={[styles.controlBtn, currentIndex === 0 && styles.controlBtnDisabled]}>
          <Text style={[styles.controlBtnText, currentIndex === 0 && styles.controlBtnTextDisabled]}>
            ← Geri
          </Text>
        </Pressable>
        <Pressable onPress={handleRestart} style={[styles.controlBtn, styles.controlBtnRestart]}>
          <Text style={styles.controlBtnText}>↺</Text>
        </Pressable>
        <Pressable
          onPress={handleNextProblem}
          disabled={!isNextActive}
          style={[styles.controlBtn, styles.controlBtnNext, !isNextActive && styles.controlBtnDisabled]}>
          <Text style={[styles.controlBtnTextNext, !isNextActive && styles.controlBtnTextDisabled]}>
            {currentIndex >= problems.length - 1 ? 'Bitir' : 'Sonraki →'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  backBtn: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    paddingVertical: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  counter: {
    fontSize: 14,
    color: '#6b7280',
    opacity: 0.8,
  },
  progressWrap: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1d4ed8',
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  controlBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  controlBtnDisabled: {
    opacity: 0.5,
  },
  controlBtnRestart: {
    paddingHorizontal: 16,
  },
  controlBtnNext: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  controlBtnTextDisabled: {
    color: '#9ca3af',
  },
  controlBtnTextNext: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
