/**
 * AtolyelerKurs — Agora Mobil
 *
 * Split-screen layout:
 *  - Üst yarı: tahta (ekran yüksekliğinin ~%45'i)
 *  - Alt yarı: sıra / hamle yorumu / ilerleme çubuğu + CTA
 *
 * Kullanıcı board ile etkileşime girerken açıklamayı görmek için
 * scroll yapmak zorunda kalmaz.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable, ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoBoard from '../../src/components/GoBoard';
import {
  fetchCurriculum, findCourseBySlug, flattenLessonsForCourse,
  getNextLesson, type Course, type Lesson,
} from '../../src/lib/education/fetchCurriculum';
import {
  fetchRemoteCompletedLessonIds,
  loadLocalCompletedIds, markLessonCompleted,
  saveLocalCompletedIds,
} from '../../src/lib/education/progressStorage';
import { supabase } from '../../src/lib/supabase';

/* ─── Yardımcılar ────────────────────────────────────────────── */
function formatCoord(x: number, y: number, size: number): string {
  const col = String.fromCharCode(65 + (x >= 8 ? x + 1 : x));
  return `${col}${size - y}`;
}

function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/https:\/\/online-go\.com\/review\/\d+/g, '').trim();
}

function getLessonIntroText(lesson: Lesson): string {
  const initialDescription = cleanText(lesson.problem?.initialDescription);
  if (initialDescription) return initialDescription;
  const body = cleanText(lesson.body);
  if (body) return body;
  const problemDescription = cleanText(lesson.problem?.description);
  if (problemDescription && !problemDescription.startsWith('SGF:')) return problemDescription;
  return '';
}

/* ═══════════════════════════════════════════════════════════════
   SidebarMenu — ders listesi (modal içinde)
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
   LessonContent — split-screen: tahta (üst) + bilgi paneli (alt)
═══════════════════════════════════════════════════════════════ */
function LessonContent({
  lesson, completed, onSolved, onNext, hasNext, isLast,
  progressIndex, progressTotal, onSolvedStateChange,
}: {
  lesson: Lesson; completed: boolean;
  onSolved: () => void; onNext: () => void;
  hasNext: boolean; isLast: boolean;
  progressIndex: number; progressTotal: number;
  onSolvedStateChange?: (solved: boolean) => void;
}) {
  const { width, height } = useWindowDimensions();
  // Board: en fazla ekran yüksekliğinin %45'i veya ekran genişliği - 32
  const boardPx = Math.min(width - 32, height * 0.45);

  const [solved, setSolved] = useState(completed);
  const [activeNodeInfo, setActiveNodeInfo] = useState<{
    x: number; y: number; color: string; comment: string | null;
  } | null>(null);
  const solvedOnceRef = useRef(false);

  useEffect(() => {
    setSolved(completed);
    setActiveNodeInfo(null);
    solvedOnceRef.current = false;
    onSolvedStateChange?.(completed);
  }, [lesson.id, completed]);

  const handleSolve = useCallback(() => {
    if (!solvedOnceRef.current) {
      solvedOnceRef.current = true;
      setSolved(true);
      onSolved();
      onSolvedStateChange?.(true);
    }
  }, [onSolved, onSolvedStateChange]);

  const handleNodeChange = useCallback((
    info: { x: number; y: number; comment: string | null; color: string | null } | null
  ) => {
    if (!info) { setActiveNodeInfo(null); return; }
    setActiveNodeInfo({ x: info.x, y: info.y, color: info.color ?? 'black', comment: info.comment });
  }, []);

  const initialTurn: 'black' | 'white' = lesson.problem?.turn === 'white' ? 'white' : 'black';
  const boardSize = lesson.problem?.size ?? 19;
  const pct = progressTotal > 0 ? (progressIndex / progressTotal) * 100 : 0;
  const introText = getLessonIntroText(lesson);

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f3eb' }}>

      {/* ── Üst: tahta ── */}
      <View style={{ alignItems: 'center', paddingHorizontal: 14, paddingTop: 10 }}>
        <Text
          style={{ fontSize: 14, fontWeight: '800', color: '#1f2937', alignSelf: 'flex-start', marginBottom: 6 }}
          numberOfLines={1}
        >
          {lesson.title}
        </Text>

        {lesson.problem && (
          <GoBoard
            size={boardSize}
            boardSizePx={boardPx}
            initialState={lesson.problem.initialState}
            startTurn={initialTurn}
            problem={lesson.problem}
            onSolve={handleSolve}
            onNodeChange={handleNodeChange}
            hideTurnIndicator
          />
        )}
      </View>

      {/* ── Alt: bilgi paneli — kalan alanı doldurur ── */}
      <ScrollView
        style={{ flex: 1, marginTop: 8, borderTopWidth: 1, borderTopColor: '#e8ddcc' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gravity LessonIntroBox equivalent */}
        <View style={{
          backgroundColor: '#fffaf0', borderRadius: 14,
          borderWidth: 1, borderColor: '#f1d19b', padding: 13, marginBottom: 8,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '900', letterSpacing: 1.2, color: '#b45309', textTransform: 'uppercase', marginBottom: 4 }}>
            Bu alıştırmada
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: introText ? 5 : 0 }}>
            <View style={{
              width: 13, height: 13, borderRadius: 7,
              backgroundColor: initialTurn === 'black' ? '#1a1a1a' : '#f5f0e8',
              borderWidth: 1, borderColor: '#94a3b8',
            }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }}>
              {initialTurn === 'white' ? 'Beyaz oynar' : 'Siyah oynar'}
            </Text>
          </View>
          {introText ? (
            <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>{introText}</Text>
          ) : null}
        </View>

        {/* Aktif hamle yorumu — bigger card */}
        <View style={{
          backgroundColor: activeNodeInfo ? '#f0f4ff' : '#f8fafc',
          borderRadius: 12, borderWidth: 1,
          borderColor: activeNodeInfo ? '#c7d2fe' : '#e2e8f0',
          padding: 14, marginBottom: 8, minHeight: 80,
        }}>
          {activeNodeInfo ? (
            <>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 5 }}>
                {activeNodeInfo.color === 'white' ? 'Beyaz' : 'Siyah'} · {formatCoord(activeNodeInfo.x, activeNodeInfo.y, boardSize)}
              </Text>
              <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20 }}>
                {cleanText(activeNodeInfo.comment) || 'Bu hamle için kayıtlı açıklama yok.'}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 20 }}>
              Başlangıç pozisyonu. Hamle yaptıkça notlar burada görünür.
            </Text>
          )}
        </View>

        {/* İlerleme çubuğu */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <View style={{ flex: 1, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ width: `${pct}%` as any, height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 }} />
          </View>
          <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>
            {progressIndex} / {progressTotal}
          </Text>
        </View>

        {/* Tebrik */}
        {solved && (
          <View style={{
            backgroundColor: '#ecfdf5', borderRadius: 14,
            borderWidth: 1, borderColor: '#6ee7b7',
            padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
          }}>
            <Ionicons name="checkmark-circle" size={26} color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: '#065f46', fontSize: 14 }}>Tebrikler!</Text>
              <Text style={{ color: '#047857', fontSize: 12, marginTop: 2 }}>Bu dersi tamamladınız.</Text>
            </View>
          </View>
        )}
        {/* Sonraki ders butonu header'a taşındı */}

        {/* Kurs tamamlandı */}
        {solved && isLast && (
          <View style={{ backgroundColor: '#059669', borderRadius: 14, paddingVertical: 13, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>🎉 Kurs Tamamlandı!</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
              Bu müfredattaki son dersiniz. Tebrikler!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Ana Ekran
═══════════════════════════════════════════════════════════════ */
export default function AtolyelerKursScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonSolved, setLessonSolved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
  const nextLesson = useMemo(
    () => (selectedLessonId ? getNextLesson(flatLessons, selectedLessonId) : null),
    [flatLessons, selectedLessonId]
  );
  const isLast = flatLessons.length > 0 && flatLessons[flatLessons.length - 1]?.id === currentLesson?.id;
  const lessonIndex = flatLessons.findIndex((l) => l.id === selectedLessonId);

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
        flexDirection: 'row', alignItems: 'center', gap: 8,
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
        {/* Sonraki ders — sadece çözüldüğünde ve sonraki varsa */}
        {lessonSolved && Boolean(nextLesson) && (
          <Pressable onPress={handleNext}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#1d4ed8', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-forward" size={17} color="#fff" />
          </Pressable>
        )}
        <Pressable onPress={() => setSidebarOpen(true)}
          style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="list" size={17} color="#374151" />
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
          onSolvedStateChange={setLessonSolved}
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
