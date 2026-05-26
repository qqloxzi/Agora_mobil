import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';

/* ─── Sabitler ─────────────────────────────────────────────── */
const FORUM_ROOT_ID = 'forum-root';
const CATEGORIES = ['Tümü', 'Strateji', 'Taktik', 'Soru', 'Duyuru'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Strateji: { bg: '#dbeafe', text: '#1e40af' },
  Taktik:   { bg: '#e0f2fe', text: '#0369a1' },
  Soru:     { bg: '#fef3c7', text: '#92400e' },
  Duyuru:   { bg: '#d1fae5', text: '#065f46' },
};

/* ─── Tipler ───────────────────────────────────────────────── */
interface ForumPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author_name: string;
  pinned: boolean;
  created_at: string;
  user_id: string;
}

/* ─── Yardımcılar ──────────────────────────────────────────── */
function parsePost(row: any): ForumPost {
  try {
    const p = JSON.parse(row.content);
    return {
      id: row.id,
      title: p.title ?? '—',
      excerpt: p.excerpt ?? '',
      category: p.category ?? 'Soru',
      author_name: p.author_name ?? 'Kullanıcı',
      pinned: p.pinned ?? false,
      created_at: row.created_at,
      user_id: row.user_id,
    };
  } catch {
    return {
      id: row.id,
      title: row.content ?? '—',
      excerpt: '',
      category: 'Soru',
      author_name: 'Kullanıcı',
      pinned: false,
      created_at: row.created_at,
      user_id: row.user_id,
    };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

/* ─── PostCard ─────────────────────────────────────────────── */
function PostCard({ post, currentUserId }: { post: ForumPost; currentUserId: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[post.category] ?? { bg: '#f3f4f6', text: '#374151' };

  const handleLinkPress = (url: string) => Linking.openURL(url);

  /** Metni URL'ler için böl ve göster */
  const renderExcerpt = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <Text
          key={i}
          style={{ color: '#1d4ed8', textDecorationLine: 'underline' }}
          onPress={() => handleLinkPress(part)}
        >
          {part}
        </Text>
      ) : (
        <Text key={i} style={{ color: '#374151' }}>{part}</Text>
      )
    );
  };

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      className="bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden active:opacity-90"
    >
      {/* Üst satır */}
      <View className="px-4 pt-4 pb-3 flex-row items-start gap-3">
        <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center mt-0.5">
          <Ionicons name="chatbubble-ellipses" size={16} color="#3b82f6" />
        </View>

        <View className="flex-1">
          {/* Kategori + Sabitlenmiş */}
          <View className="flex-row flex-wrap gap-1.5 mb-1.5">
            {post.pinned && (
              <View className="flex-row items-center gap-1 bg-blue-50 rounded-full px-2 py-0.5">
                <Ionicons name="pin" size={10} color="#3b82f6" />
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#3b82f6' }}>Sabitlenmiş</Text>
              </View>
            )}
            <View style={{ backgroundColor: catColor.bg }} className="rounded-full px-2.5 py-0.5">
              <Text style={{ fontSize: 10, fontWeight: '700', color: catColor.text }}>
                {post.category}
              </Text>
            </View>
          </View>

          {/* Başlık */}
          <Text className="text-base font-bold text-gray-900 leading-snug">{post.title}</Text>

          {/* Kapalıyken önizleme */}
          {!expanded && post.excerpt !== '' && (
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>{post.excerpt}</Text>
          )}

          {/* Meta */}
          <Text className="text-xs text-gray-400 mt-2">
            {post.author_name} · {formatDate(post.created_at)}
          </Text>
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#9ca3af"
        />
      </View>

      {/* Genişletilmiş: tam metin */}
      {expanded && post.excerpt !== '' && (
        <View className="px-4 pb-4 border-t border-gray-100 pt-3">
          <Text className="text-sm text-gray-700 leading-relaxed">
            {renderExcerpt(post.excerpt)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/* ─── Yeni Gönderi Modalı ──────────────────────────────────── */
function NewPostModal({
  visible,
  user,
  onClose,
  onCreated,
}: {
  visible: boolean;
  user: any;
  onClose: () => void;
  onCreated: (post: ForumPost) => void;
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState<string>('Soru');
  const [saving, setSaving] = useState(false);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Kullanıcı';

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Başlık gerekli', 'Lütfen bir başlık girin.');
    setSaving(true);
    try {
      const contentJson = JSON.stringify({
        title: title.trim(),
        excerpt: excerpt.trim(),
        category,
        author_name: displayName,
        pinned: false,
      });
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: FORUM_ROOT_ID, user_id: user.id, content: contentJson, rating: 0 }])
        .select()
        .single();
      if (error) throw error;
      onCreated(parsePost(data));
      setTitle(''); setExcerpt(''); setCategory('Soru');
      onClose();
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Gönderi oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-white"
        style={{ paddingTop: insets.top + 8 }}
      >
        {/* Modal header */}
        <View className="flex-row items-center justify-between px-5 pb-4 border-b border-gray-100">
          <Pressable onPress={onClose}>
            <Text className="text-base text-gray-500">İptal</Text>
          </Pressable>
          <Text className="text-base font-bold text-gray-900">Yeni Konu</Text>
          <Pressable onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color="#1d4ed8" />
              : <Text className="text-base font-bold text-blue-600">Paylaş</Text>
            }
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-5">
          {/* Başlık */}
          <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Başlık</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Konu başlığı…"
            placeholderTextColor="#9ca3af"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base mb-5"
          />

          {/* Kategori */}
          <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Kategori</Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {(['Strateji', 'Taktik', 'Soru', 'Duyuru'] as const).map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className="rounded-full px-4 py-1.5"
                style={{
                  backgroundColor: category === cat ? '#1e293b' : '#f1f5f9',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: category === cat ? '#fff' : '#64748b' }}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* İçerik */}
          <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">İçerik</Text>
          <TextInput
            value={excerpt}
            onChangeText={setExcerpt}
            placeholder="Konuyu açıklayın, link ekleyebilirsiniz…"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm mb-8"
            style={{ minHeight: 160 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Ana Ekran ─────────────────────────────────────────────── */
export default function ForumScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('Tümü');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  /* Auth */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  /* Gönderileri yükle */
  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', FORUM_ROOT_ID)
      .order('created_at', { ascending: false });
    setPosts((data ?? []).map(parsePost));
    setLoading(false);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  /* Filtrele + sırala */
  const sorted = [...posts]
    .filter((p) => {
      const matchCat = activeCategory === 'Tümü' || p.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch = p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
      return matchCat && matchSearch;
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Başlık */}
      <View className="px-5 pt-5 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Forum</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Tartış, sor, öğren.</Text>
      </View>

      {/* Arama */}
      <View className="px-5 pb-3">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-3 py-2.5 gap-2">
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Konu ara…"
            placeholderTextColor="#9ca3af"
            className="flex-1 text-sm text-gray-800"
          />
          {search !== '' && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Kategori filtreleri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            className="rounded-full px-4 py-1.5"
            style={{ backgroundColor: activeCategory === cat ? '#1e293b' : '#fff', borderWidth: 1, borderColor: activeCategory === cat ? 'transparent' : '#e5e7eb' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: activeCategory === cat ? '#fff' : '#6b7280' }}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Liste */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1d4ed8" />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} currentUserId={user?.id ?? null} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="chatbubbles-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3">Henüz gönderi yok.</Text>
            </View>
          }
        />
      )}

      {/* FAB — yeni konu */}
      {user && (
        <Pressable
          onPress={() => setShowModal(true)}
          className="absolute bottom-8 right-5 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg active:opacity-90"
          style={{ bottom: insets.bottom + 80 }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}

      <NewPostModal
        visible={showModal}
        user={user}
        onClose={() => setShowModal(false)}
        onCreated={(p) => setPosts((prev) => [p, ...prev])}
      />
    </View>
  );
}
