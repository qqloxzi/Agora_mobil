/**
 * AtolyelerKurs — Agora Mobil
 *
 * Minimal solve layout: board + essential controls, one explanation line.
 * Completion is quiet (header next button); no celebratory banners.
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
import { COURSE_BRAND } from '../../src/components/courses';
import {
  fetchCurriculum, findCourseBySlug, flattenLessonsForCourse,
  getNextLesson, type Course, type Lesson,
} from '../../src/lib/education/fetchCurriculum';
import {
  fetchRemoteCompletedLessonIds,
  loadLocalCompletedIds, markLessonCompleted,
  saveLocalCompletedIds,
  syncLocalCompletedIdsToRemote,
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
                  borderRadius: 10,
                  backgroundColor: isSelected ? COURSE_BRAND.accentSoft : 'transparent',
                }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: isDone ? COURSE_BRAND.accent : '#ffffff',
                  borderWidth: isDone ? 0 : 2,
                  borderColor: '#d1d5db',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDone
                    ? <Ionicons name="checkmark" size={12} color="#fff" />
                    : null
                  }
                </View>
                <Text numberOfLines={2} style={{
                  flex: 1, fontSize: 13,
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? COURSE_BRAND.accent : isDone ? '#374151' : '#6b7280',
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
  lesson, completed, onSolved,
  progressIndex, progressTotal, onSolvedStateChange,
}: {
  lesson: Lesson; completed: boolean;
  onSolved: () => void;
  progressIndex: number; progressTotal: number;
  onSolvedStateChange?: (solved: boolean) => void;
}) {
  const { width, height } = useWindowDimensions();
  const isShortScreen = height < 720;
  const boardMaxByHeight = height * (isShortScreen ? 0.48 : 0.54);
  const boardPx = Math.min(width - 24, boardMaxByHeight);

  const [activeNodeInfo, setActiveNodeInfo] = useState<{
    x: number; y: number; color: string; comment: string | null;
  } | null>(null);
  const solvedOnceRef = useRef(false);

  useEffect(() => {
    setActiveNodeInfo(null);
    solvedOnceRef.current = false;
    onSolvedStateChange?.(completed);
  }, [lesson.id, completed, onSolvedStateChange]);

  const handleSolve = useCallback(() => {
    if (!solvedOnceRef.current) {
      solvedOnceRef.current = true;
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
  const introText = getLessonIntroText(lesson);
  const moveComment = cleanText(activeNodeInfo?.comment);
  const moveLabel = activeNodeInfo
    ? `${activeNodeInfo.color === 'white' ? 'Beyaz' : 'Siyah'} · ${formatCoord(activeNodeInfo.x, activeNodeInfo.y, boardSize)}`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7f5' }}>
      <View style={{ alignItems: 'center', paddingHorizontal: 12, paddingTop: isShortScreen ? 6 : 10 }}>
        <View style={{
          alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 6, gap: 8,
        }}>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: COURSE_BRAND.ink }} numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text style={{
            fontSize: 11, color: COURSE_BRAND.accent, fontWeight: '700',
            backgroundColor: COURSE_BRAND.accentSoft, overflow: 'hidden',
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
          }}>
            {progressIndex}/{progressTotal}
          </Text>
        </View>

        <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <View style={{
            width: 10, height: 10, borderRadius: 5,
            backgroundColor: initialTurn === 'black' ? COURSE_BRAND.ink : '#f5f0e8',
            borderWidth: 1, borderColor: 'rgba(148,163,184,0.7)',
          }} />
          <Text style={{ fontSize: 12, color: COURSE_BRAND.muted, fontWeight: '500' }}>
            {initialTurn === 'white' ? 'Beyaz oynar' : 'Siyah oynar'}
          </Text>
        </View>

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Single explanation source (GoBoard status suppresses comments when onNodeChange is set) */}
        <View style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COURSE_BRAND.accentBorder,
          backgroundColor: '#ffffff',
          paddingHorizontal: 14,
          paddingVertical: 12,
          gap: 6,
        }}>
          {introText && !activeNodeInfo ? (
            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 19 }}>
              {introText}
            </Text>
          ) : null}

          {moveLabel ? (
            <>
              <Text style={{
                fontSize: 11, fontWeight: '700', color: COURSE_BRAND.accent,
                letterSpacing: 0.4, textTransform: 'uppercase',
              }}>
                {moveLabel}
              </Text>
              {moveComment ? (
                <Text style={{ fontSize: 14, color: COURSE_BRAND.ink, lineHeight: 20, fontWeight: '500' }}>
                  {moveComment}
                </Text>
              ) : null}
            </>
          ) : !introText ? (
            <Text style={{ fontSize: 13, color: COURSE_BRAND.muted, lineHeight: 18 }}>
              Hamle yaptıkça notlar burada görünür.
            </Text>
          ) : null}
        </View>
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
          const merged = new Set([...ids, ...remote]);
          setCompletedIds(merged);
          saveLocalCompletedIds(merged);
          syncLocalCompletedIdsToRemote(uid, ids);
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
      await markLessonCompleted(userId, currentLesson.id, {
        course: activeCourse,
        lesson: currentLesson,
      });
      setCompletedIds((prev) => {
        const n = new Set(prev);
        n.add(currentLesson.id);
        saveLocalCompletedIds(n);
        return n;
      });
    }
  }, [currentLesson, completedIds, userId, activeCourse]);

  const handleNext = useCallback(() => {
    if (nextLesson) setSelectedLessonId(nextLesson.id);
  }, [nextLesson]);

  /* ── Loading ── */
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={COURSE_BRAND.accent} />
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
          style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COURSE_BRAND.primary, borderRadius: 100 }}>
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
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: COURSE_BRAND.accent, alignItems: 'center', justifyContent: 'center' }}>
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
