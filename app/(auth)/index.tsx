import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  ScrollView, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';

/* OAuth callback'i uygulamada tamamlamak için gerekli */
WebBrowser.maybeCompleteAuthSession();

async function completeSupabaseSessionFromUrl(url: string) {
  const parsed = new URL(url);
  const code = parsed.searchParams.get('code');
  if (code) return supabase.auth.exchangeCodeForSession(code);

  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const accessToken = hashParams.get('access_token') ?? parsed.searchParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token') ?? parsed.searchParams.get('refresh_token');
  if (accessToken && refreshToken) {
    return supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  }

  return { data: null, error: null };
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Deep link dinleyici ── */
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      if (!url.includes('access_token') && !url.includes('code=')) return;
      await completeSupabaseSessionFromUrl(url);
    };
    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
    return () => sub.remove();
  }, []);

  /* ── Google Sign-In ──
   *
   * Expo Go'da "agoramobil://" scheme çalışmaz → useProxy: true ile
   * Expo'nun auth.expo.io proxy'si kullanılır; bu sayede Expo Go'da da
   * tarayıcı kapanıp session kurulur.
   *
   * Üretim (standalone) build'de useProxy: false, scheme: 'agoramobil' kullanılır.
   */
  const onSignInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      // Platform kontrolü: web vs native
      const isWeb = Platform.OS === 'web';

      // Expo Go'da mı yoksa production build'de mi?
      // __DEV__ + Platform.OS !== 'web' → Expo Go veya dev build
      const redirectTo = isWeb
        ? `${(window as any).location.origin}/`
        : makeRedirectUri({
            scheme: 'agoramobil',
            path: 'auth/callback',
          });

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;

      if (data?.url && !isWeb) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (result.type === 'success' && result.url) {
          const { error: sessionError } = await completeSupabaseSessionFromUrl(result.url);
          if (sessionError) setError(sessionError.message);
        } else if (result.type === 'cancel') {
          setError('Giriş iptal edildi.');
        }
        // 'dismiss' → tarayıcı kapandı ama URL yok (Expo Go deep link problemi)
        // Bu durumda session token varsa onAuthStateChange yakalar
      } else if (isWeb && data?.url) {
        (window as any).location.href = data.url;
      }
    } catch (e: any) {
      setError(e.message ?? 'Google ile giriş başarısız.');
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ── Email/Şifre ── */
  const onSignInWithPassword = async () => {
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setSubmitting(false);
  };

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <View className="w-full items-center mb-12">
          <Image source={require('../../public/background.png')} style={{ width: 140, height: 140 }} resizeMode="contain" />
        </View>

        <TextInput
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-800 mb-4 text-[16px]"
          placeholder="E-posta" placeholderTextColor="#9ca3af"
          autoCapitalize="none" keyboardType="email-address"
          value={email} onChangeText={setEmail}
        />
        <TextInput
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-800 mb-6 text-[16px]"
          placeholder="Şifre" placeholderTextColor="#9ca3af"
          secureTextEntry value={password} onChangeText={setPassword}
        />

        {error ? <Text className="text-sm text-red-500 mb-4 text-center">{error}</Text> : null}

        <Pressable onPress={onSignInWithPassword} disabled={submitting}
          className="w-full bg-blue-500 rounded-2xl py-4 items-center mb-8 active:opacity-90">
          {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Giriş Yap</Text>}
        </Pressable>

        <View className="flex-row items-center gap-4 mb-8">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="text-sm text-gray-400">veya</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Google Sign-In */}
        <Pressable onPress={onSignInWithGoogle} disabled={googleLoading}
          className="w-full flex-row items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-4 mb-10 active:bg-gray-50">
          {googleLoading
            ? <ActivityIndicator color="#3b82f6" />
            : <>
                <Ionicons name="logo-google" size={22} color="#ea4335" />
                <Text className="text-base font-semibold text-gray-700">Google ile Giriş Yap</Text>
              </>
          }
        </Pressable>

        {/* Expo Go uyarısı — sadece development modda göster */}
        {__DEV__ && Platform.OS !== 'web' && (
          <View className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Text className="text-xs text-amber-700 text-center leading-relaxed">
              <Text className="font-bold">Geliştirme modu:</Text> Google girişi Expo Go'da tarayıcıyı kapatmayabilir.{'\n'}
              Üretim build'de sorunsuz çalışır.
            </Text>
          </View>
        )}

        <Pressable onPress={() => router.push('/(auth)/signup')} className="py-2 active:opacity-70">
          <Text className="text-center text-[15px] text-gray-500">
            Hesabınız yok mu? <Text className="text-blue-500 font-bold">Kayıt Ol</Text>
          </Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
