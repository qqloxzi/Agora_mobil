/**
 * GameManager.jsx akışına uyumlu: Kategoriye göre problem listesi. (Artık SGF modunda)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { GoBoardView } from '../../src/components/GoBoardView';
import { markTopicCompleted } from '../../src/lib/goTreeProgress';
import { parseSgfToProblem } from '../../src/lib/sgfParser';
import type { Problem } from '../../src/types/tsumego';
import { Asset } from 'expo-asset';
import { SGF_ASSETS } from '../../src/data/sgfAssets';
import { GO_TREE_LEVELS } from '../../src/data/goTreeData';

export default function GoTreeProblemScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isNextActive, setIsNextActive] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const deriveProblemTitle = useCallback((id: string) => {
    for (const group of GO_TREE_LEVELS) {
      const level = group.levels.find((l) => l.id === id);
      if (level) return `${group.title} - ${level.label}`;
    }
    return id;
  }, []);

  // Fetch SGF dynamically
  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    
    const loadLessonAsset = async () => {
      try {
        const sgfFilename = topicId
          .toLowerCase()
          .replace(/[ıİ]/g, 'i')
          .replace(/[şŞ]/g, 's')
          .replace(/[ğĞ]/g, 'g')
          .replace(/[üÜ]/g, 'u')
          .replace(/[öÖ]/g, 'o')
          .replace(/[çÇ]/g, 'c')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const assetModule = SGF_ASSETS[sgfFilename];
        if (!assetModule) {
          throw new Error('SGF asset not registered in sgfAssets.ts: ' + sgfFilename);
        }

        const [asset] = await Asset.loadAsync(assetModule);
        if (!asset) throw new Error('Expo asset resolution failed');
        
        const resp = await fetch(asset.localUri || asset.uri);
        if (!resp.ok) throw new Error('Network response or local file read failed');
        
        const sgfStr = await resp.text();
        const parsed = parseSgfToProblem(sgfStr, topicId);
        setActiveProblem({ ...parsed, title: deriveProblemTitle(topicId) });
        setIsNextActive(false);
        setLoading(false);
      } catch (err) {
        console.error('SGF Loading Error:', err);
        setErrorMsg('Bu ders henüz eklenmedi: ' + topicId);
        setLoading(false);
      }
    };
    
    loadLessonAsset();
  }, [topicId]);

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
    if (!topicId) return;
    const { completed } = await markTopicCompleted(topicId, user?.id ?? null, completedIds);
    setCompletedIds(completed);
    setShowCompletionModal(true);
  }, [topicId, user?.id, completedIds]);

  const handleCompletionNextTopic = useCallback(() => {
    setShowCompletionModal(false);
    router.replace('/(tabs)/skill-tree');
  }, [router]);

  const handleCompletionMainMenu = useCallback(() => {
    setShowCompletionModal(false);
    router.replace('/(tabs)');
  }, [router]);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PROGRESS_GREEN} />
        <Text style={{ color: '#fff', marginTop: 12 }}>Ders yükleniyor...</Text>
      </View>
    );
  }

  if (errorMsg || !activeProblem) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.containerInner}>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.emptyStateLink}>← Geri</Text>
          </Pressable>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyStateText}>
              {errorMsg || 'Problem bulunamadı.'}
            </Text>
            <Text style={styles.emptyStateSubtext}>{topicId}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screenWrap, { paddingBottom: insets.bottom + 8 }]}
      edges={['top', 'left', 'right']}>
      <View style={styles.screenInner}>
        {/* 1. Üst bilgi çubuğu (Header) */}
        <View style={styles.headerSection}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {topicId} (Ders)
            </Text>
            <Pressable onPress={() => router.back()} style={styles.exitBtn}>
              <Text style={styles.exitBtnText}>× Çıkış</Text>
            </Pressable>
          </View>
          <View style={styles.progressWrap}>
            <View style={[styles.progressFill, { width: `${isNextActive ? 100 : 50}%` }]} />
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
          <Pressable onPress={handleRestart} style={styles.controlBtnRestart}>
            <Text style={styles.controlBtnRestartText}>↻</Text>
          </Pressable>
          <Pressable
            onPress={handleNextProblem}
            disabled={!isNextActive}
            style={[styles.controlBtnNext, !isNextActive && styles.controlBtnDisabled]}>
            <Text style={[styles.controlBtnNextText, !isNextActive && styles.controlBtnTextDisabled]}>
              {'Bitir →'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tebrikler!</Text>
            <Text style={styles.modalMessage}>Dersi başarıyla tamamladınız.</Text>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={handleCompletionNextTopic}
                style={styles.modalBtnNext}
                accessibilityRole="button">
                <Text style={styles.modalBtnNextText}>Haritaya Dön</Text>
              </Pressable>
              <Pressable
                onPress={handleCompletionMainMenu}
                style={styles.modalBtnMenu}
                accessibilityRole="button">
                <Text style={styles.modalBtnMenuText}>Ana Menüye Dön</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const BG_LIGHT = '#FFFFFF';
const PANEL_LIGHT = '#F3F4F6';
const PROGRESS_GREEN = '#059669';
const PROGRESS_TRACK = '#E5E7EB';

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG_LIGHT,
  },
  container: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },
  containerInner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  screenWrap: {
    flex: 1,
    backgroundColor: BG_LIGHT,
  },
  screenInner: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 10,
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
    fontWeight: '700',
    color: '#111827',
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
    borderColor: '#D1D5DB',
    backgroundColor: PANEL_LIGHT,
    paddingVertical: 48,
  },
  backBtn: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: PANEL_LIGHT,
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
    backgroundColor: PANEL_LIGHT,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoPanelText: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
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
    backgroundColor: '#111827',
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
    color: '#374151',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyStateLink: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: BG_LIGHT,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalBtnNext: {
    backgroundColor: PROGRESS_GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBtnNextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalBtnMenu: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalBtnMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
});
