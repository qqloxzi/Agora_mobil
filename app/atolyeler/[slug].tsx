/**
 * AtolyelerKurs — Agora Mobil
 *
 * Agora_gravity AtolyelerKurs.jsx + ContentView + LessonActiveInfoCard +
 * GameManagerLessonEmbed'in tam React Native portu.
 *
 * Özellikler:
 *  - SidebarMenu (ders listesi modal)
 *  - LessonActiveInfoCard (sıra, hamle notu, ilerleme, "Devam" butonu)
 *  - GoBoard (fast-forward, Ko kuralı, onNodeChange, opponentResponse)
 *  - Sonraki ders / Kurs tamamlandı CTA
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  Modal, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import {
  fetchCurriculum, findCourseBySlug, flattenLessonsForCourse,
  getNextLesson, type Course, type Lesson,
} from '../../src/lib/education/fetchCurriculum';
import {
  loadLocalCompletedIds, markLessonCompleted,
  fetchRemoteCompletedLessonIds, saveLocalCompletedIds,
} from '../../src/lib/education/progressStorage';
import GoBoard from '../../src/components/GoBoard';

/* ─── Yardımcılar ─────────────────────────────────────────────── */
function formatCoord(x: number, y: number, size: number): string {
  const col = String.fromCharCode(65 + (x >= 8 ? x + 1 : x));
  return `${col}${size - y}`;
}

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/https:\/\/online-go\.com\/review\/\d+/g, '').trim();
}

/* ═══════════════════════════════════════════════════════════════
   SidebarMenu — ders listesi
═══════════════════════════════════════════════════════════════ */
function SidebarMenu({
  course, selectedId, completedIds, onSelect,
}: {
  course: Course; selectedId: string | null;
  completedIds: Set<string>; onSelect: (id: string) => void;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {course.modules.map((mod) => (
        <View key={mod.id} style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 10, fontWeight: '700', color: '#9ca3af',
            textTransform: 'uppercase', letterSpacing: 1.5,
            paddingHorizontal: 16, marginBottom: 4,
          }}>
            {mod.title}
          </Text>
          {mod.lessons.map((lesson) => {
            const isSelected = lesson.id === selectedId;
            const isDone = completedIds.has(lesson.id);
            return (
              <Pressable key={lesson.id} onPress={() => onSelect(lesson.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  paddingHorizontal: 16, paddingVertical: 12,
                  backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: isDone ? '#10b981' : isSelected ? '#3b82f6' : '#e5e7eb',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDone
                    ? <Ionicons name="checkmark" size={12} color="#fff" />
                    : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isSelected ? '#fff' : '#9ca3af' }} />
                  }
                </View>
                <Text numberOfLines={2} style={{
                  flex: 1, fontSize: 13,
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#1d4ed8' : isDone ? '#374151' : '#6b7280',
                }}>
                  {lesson.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LessonActiveInfoCard — sidebar bilgi kartı
   (Agora_gravity LessonActiveInfoCard.jsx'in tam portu)
═══════════════════════════════════════════════════════════════ */
function LessonActiveInfoCard({
  lessonTitle, problemDescription, boardSize, initialTurn,
  activeNodeInfo, opponentStepControls, progressIndex, progressTotal,
}: {
  lessonTitle: string;
  problemDescription?: string | null;
  boardSize: number;
  initialTurn: 'black' | 'white';
  activeNodeInfo: { x: number; y: number; color: string; comment: string | null } | null;
  opponentStepControls?: { continue: () => void; phase: 'beforeOpponent' | 'afterOpponent' } | null;
  progressIndex: number;
  progressTotal: number;
}) {
  const pct = progressTotal > 0 ? (progressIndex / progressTotal) * 100 : 0;
  const turnLabel = initialTurn === 'white' ? 'Beyaz oynar' : 'Siyah oynar';
  const cleanedDesc = cleanText(problemDescription);

  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 16,
      borderWidth: 1, borderColor: '#e0e7ff',
      padding: 14, shadowColor: '#000', shadowOpacity: 0.04,
      shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 2,
    }}>
      {/* Ders adı */}
      <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
        Ders
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 }} numberOfLines={2}>
        {lessonTitle}
      </Text>

      {/* Sıra + açıklama */}
      <View style={{
        backgroundColor: '#f8fafc', borderRadius: 12,
        borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginBottom: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: cleanedDesc ? 6 : 0 }}>
          <View style={{
            width: 14, height: 14, borderRadius: 7,
            backgroundColor: initialTurn === 'black' ? '#1a1a1a' : '#f5f0e8',
            borderWidth: 1, borderColor: '#94a3b8',
          }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>{turnLabel}</Text>
        </View>
        {cleanedDesc ? (
          <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>{cleanedDesc}</Text>
        ) : null}
      </View>

      {/* Aktif hamle notu */}
      <View style={{
        backgroundColor: activeNodeInfo ? '#f0f4ff' : '#f8fafc',
        borderRadius: 12, borderWidth: 1,
        borderColor: activeNodeInfo ? '#c7d2fe' : '#e2e8f0',
        padding: 12, marginBottom: 10,
      }}>
        {activeNodeInfo ? (
          <>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 4 }}>
              {activeNodeInfo.color === 'white' ? 'Beyaz' : 'Siyah'} · {formatCoord(activeNodeInfo.x, activeNodeInfo.y, boardSize)}
            </Text>
            <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20 }}>
              {cleanText(activeNodeInfo.comment) || 'Bu hamle için kayıtlı açıklama yok.'}
            </Text>
          </>
        ) : (
          <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 18 }}>
            Başlangıç pozisyonu. Hamle yaptıkça notlar burada görünür.
          </Text>
        )}
      </View>

      {/* Devam butonu (rakibin hamlesi) */}
      {opponentStepControls ? (
        <View style={{ marginBottom: 10 }}>
          {opponentStepControls.phase === 'beforeOpponent' && (
            <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
              Hamlenizin yorumunu okuyun; rakibin cevabını göstermek için devam edin.
            </Text>
          )}
          <Pressable onPress={opponentStepControls.continue}
            style={{
              backgroundColor: '#1d4ed8', borderRadius: 12,
              paddingVertical: 10, alignItems: 'center',
            }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              {opponentStepControls.phase === 'beforeOpponent' ? '▶ Rakibin hamlesini göster' : '▶ Devam et'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* İlerleme çubuğu */}
      <View>
        <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          İlerleme
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 }} />
          </View>
          <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>
            {progressIndex} / {progressTotal}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LessonContent — tahta + bilgi kartı + CTA
   (GameManagerLessonEmbed + ContentView birleşimi)
═══════════════════════════════════════════════════════════════ */
function LessonContent({
  lesson, completed, onSolved, onNext, hasNext, isLast,
  progressIndex, progressTotal,
}: {
  lesson: Lesson; completed: boolean;
  onSolved: () => void; onNext: () => void;
  hasNext: boolean; isLast: boolean;
  progressIndex: number; progressTotal: number;
}) {
  const { width } = useWindowDimensions();
  const boardPx = Math.min(width - 32, 380);

  const [solved, setSolved]           = useState(completed);
  const [activeNodeInfo, setActiveNodeInfo] = useState<{
    x: number; y: number; color: string; comment: string | null;
  } | null>(null);
  const [opponentControls, setOpponentControls] = useState<{
    continue: () => void; phase: 'beforeOpponent' | 'afterOpponent';
  } | null>(null);
  const solvedOnceRef = useRef(false);

  // Ders değişince sıfırla
  useEffect(() => {
    setSolved(completed);
    setActiveNodeInfo(null);
    setOpponentControls(null);
    solvedOnceRef.current = false;
  }, [lesson.id, completed]);

  const handleSolve = useCallback(() => {
    if (!solvedOnceRef.current) {
      solvedOnceRef.current = true;
      setSolved(true);
      onSolved();
    }
  }, [onSolved]);

  const handleNodeChange = useCallback((
    info: { comment: string | null; color: string | null } | null
  ) => {
    // GoBoard'dan gelen info'yu activeNodeInfo formatına çevir
    // GoBoard ayrıca pos bilgisini de verse daha iyi olur;
    // şimdilik comment + color yeterli, x/y 0,0 placeholder
    if (!info) { setActiveNodeInfo(null); return; }
    setActiveNodeInfo((prev) => ({
      x: prev?.x ?? 0,
      y: prev?.y ?? 0,
      color: info.color ?? 'black',
      comment: info.comment,
    }));
  }, []);

  const initialTurn: 'black' | 'white' = lesson.problem?.turn === 'white' ? 'white' : 'black';
  const boardSize = lesson.problem?.size ?? 19;
  const showNextCta = (solved) && hasNext;

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Ders başlığı */}
      <View style={{ paddingTop: 16, paddingBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{lesson.title}</Text>
      </View>

      {/* Ders metni */}
      {lesson.body !== '' && (
        <View style={{
          backgroundColor: '#eff6ff', borderRadius: 14,
          borderWidth: 1, borderColor: '#bfdbfe',
          padding: 14, marginBottom: 12,
        }}>
          <Text style={{ fontSize: 13, color: '#1e40af', lineHeight: 20 }}>{lesson.body}</Text>
        </View>
      )}

      {/* GoBoard */}
      {lesson.problem && (
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <GoBoard
            size={boardSize}
            boardSizePx={boardPx}
            initialState={lesson.problem.initialState}
            startTurn={initialTurn}
            problem={lesson.problem}
            onSolve={handleSolve}
            onNodeChange={handleNodeChange}
          />
        </View>
      )}

      {/* Araç çubuğu: Geri Al + Yeniden Başlat + Devam */}
      {/* GoBoard kendi araç çubuğuna sahip; opponentControls için ayrıca buton */}
      {opponentControls && (
        <Pressable
          onPress={opponentControls.continue}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 6, backgroundColor: '#1d4ed8', borderRadius: 14,
            paddingVertical: 12, marginBottom: 12,
          }}>
          <Ionicons name="play" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
            {opponentControls.phase === 'beforeOpponent' ? 'Rakibin hamlesini göster' : 'Devam et'}
          </Text>
        </Pressable>
      )}

      {/* LessonActiveInfoCard */}
      <LessonActiveInfoCard
        lessonTitle={lesson.title}
        problemDescription={lesson.problem?.description}
        boardSize={boardSize}
        initialTurn={initialTurn}
        activeNodeInfo={activeNodeInfo}
        opponentStepControls={opponentControls}
        progressIndex={progressIndex}
        progressTotal={progressTotal}
      />

      {/* Tebrik + Sonraki ders CTA */}
      {solved && (
        <View style={{
          backgroundColor: '#ecfdf5', borderRadius: 16,
          borderWidth: 1, borderColor: '#6ee7b7',
          padding: 16, marginTop: 14,
          flexDirection: 'row', alignItems: 'center', gap: 10,
        }}>
          <Ionicons name="checkmark-circle" size={28} color="#10b981" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: '#065f46', fontSize: 14 }}>Tebrikler!</Text>
            <Text style={{ color: '#047857', fontSize: 12, marginTop: 2 }}>Bu dersi tamamladınız.</Text>
          </View>
        </View>
      )}

      {showNextCta && (
        <Pressable onPress={onNext}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, backgroundColor: '#1d4ed8', borderRadius: 16,
            paddingVertical: 14, marginTop: 10,
          }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Sonraki derse geç</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      )}

      {solved && isLast && (
        <View style={{
          backgroundColor: '#059669', borderRadius: 16,
          paddingVertical: 14, marginTop: 10, alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>🎉 Kurs Tamamlandı!</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
            Bu müfredattaki son dersiniz. Tebrikler!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Ana Ekran
═══════════════════════════════════════════════════════════════ */
export default function AtolyelerKursScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [courses, setCourses]               = useState<Course[]>([]);
  const [loading, setLoading]               = useState(true);
  const [completedIds, setCompletedIds]     = useState<Set<string>>(new Set());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [userId, setUserId]                 = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  const activeCourse = useMemo(
    () => (slug ? findCourseBySlug(courses, slug) : null),
    [courses, slug]
  );
  const flatLessons = useMemo(
    () => (activeCourse && slug ? flattenLessonsForCourse(courses, slug) : []),
    [courses, slug, activeCourse]
  );
  const currentLesson = useMemo(
    () => flatLessons.find((l) => l.id === selectedLessonId) ?? null,
    [flatLessons, selectedLessonId]
  );
  const lessonCompleted = currentLesson ? completedIds.has(currentLesson.id) : false;
  const nextLesson      = useMemo(
    () => (selectedLessonId ? getNextLesson(flatLessons, selectedLessonId) : null),
    [flatLessons, selectedLessonId]
  );
  const isLast          = flatLessons.length > 0 && flatLessons[flatLessons.length - 1]?.id === currentLesson?.id;
  const lessonIndex     = flatLessons.findIndex((l) => l.id === selectedLessonId);

  /* Veri yükle */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      if (!cancelled) setUserId(uid);

      const ids = await loadLocalCompletedIds();
      if (!cancelled) setCompletedIds(ids);

      if (uid) {
        const remote = await fetchRemoteCompletedLessonIds(uid);
        if (!cancelled) {
          setCompletedIds((prev) => {
            const merged = new Set([...prev, ...remote]);
            saveLocalCompletedIds(merged);
            return merged;
          });
        }
      }

      const { courses: c } = await fetchCurriculum();
      if (cancelled) return;
      setCourses(c);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  /* İlk dersi seç */
  useEffect(() => {
    if (flatLessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(flatLessons[0]!.id);
    }
  }, [flatLessons, selectedLessonId]);

  /* Kurs yoksa geri dön */
  useEffect(() => {
    if (!loading && courses.length > 0 && slug && !activeCourse) {
      router.replace('/(tabs)/atolyeler');
    }
  }, [loading, courses, slug, activeCourse, router]);

  const handleSelectLesson = useCallback((id: string) => {
    setSelectedLessonId(id);
    setSidebarOpen(false);
  }, []);

  const handleSolved = useCallback(async () => {
    if (!currentLesson) return;
    if (!completedIds.has(currentLesson.id)) {
      await markLessonCompleted(userId, currentLesson.id);
      setCompletedIds((prev) => {
        const n = new Set(prev);
        n.add(currentLesson.id);
        saveLocalCompletedIds(n);
        return n;
      });
    }
  }, [currentLesson, completedIds, userId]);

  const handleNext = useCallback(() => {
    if (nextLesson) setSelectedLessonId(nextLesson.id);
  }, [nextLesson]);

  /* ── Loading ── */
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={{ color: '#9ca3af', marginTop: 12 }}>İçerik yükleniyor…</Text>
      </View>
    );
  }

  if (!activeCourse) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: insets.top }}>
        <Ionicons name="alert-circle-outline" size={48} color="#d1d5db" />
        <Text style={{ color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>Kurs bulunamadı.</Text>
        <Pressable onPress={() => router.back()}
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#1d4ed8', borderRadius: 100 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Geri Dön</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingTop: insets.top }}>

      {/* ── Üst Bar ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
      }}>
        <Pressable onPress={() => router.back()}
          style={{ padding: 8, borderRadius: 100, backgroundColor: '#f3f4f6' }}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
            {activeCourse.title}
          </Text>
          {currentLesson && (
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>
              {lessonIndex + 1} / {flatLessons.length} ders
            </Text>
          )}
        </View>
        <Pressable onPress={() => setSidebarOpen(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 12, paddingVertical: 8,
            backgroundColor: '#f3f4f6', borderRadius: 100,
          }}>
          <Ionicons name="list" size={16} color="#374151" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>Dersler</Text>
        </Pressable>
      </View>

      {/* ── İçerik ── */}
      {currentLesson ? (
        <LessonContent
          key={currentLesson.id}
          lesson={currentLesson}
          completed={lessonCompleted}
          onSolved={handleSolved}
          onNext={handleNext}
          hasNext={Boolean(nextLesson)}
          isLast={isLast}
          progressIndex={lessonIndex + 1}
          progressTotal={flatLessons.length}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#9ca3af' }}>Bu kursta henüz ders yok.</Text>
        </View>
      )}

      {/* ── Sidebar Modal ── */}
      <Modal
        visible={sidebarOpen} animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top + 8 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
          }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Ders Listesi</Text>
            <Pressable onPress={() => setSidebarOpen(false)}
              style={{ padding: 8, borderRadius: 100, backgroundColor: '#f3f4f6' }}>
              <Ionicons name="close" size={20} color="#374151" />
            </Pressable>
          </View>
          <SidebarMenu
            course={activeCourse}
            selectedId={selectedLessonId}
            completedIds={completedIds}
            onSelect={handleSelectLesson}
          />
        </View>
      </Modal>
    </View>
  );
}
