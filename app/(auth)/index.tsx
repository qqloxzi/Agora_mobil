import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { shadowStyle } from '../../src/lib/shadowStyle';
import { useAuth } from '../../src/context/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const redirectTo =
      Platform.OS === 'web'
        ? typeof window !== 'undefined' &&
          (window as unknown as { location?: { origin?: string } }).location?.origin
          ? (window as unknown as { location: { origin: string } }).location.origin + '/goagaci'
          : undefined
        : AuthSession.makeRedirectUri({ scheme: 'agoramobil' });

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: redirectTo ? { redirectTo } : undefined,
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
      return;
    }
    if (data?.url) {
      if (Platform.OS === 'web') {
        (window as unknown as { location: { href: string } }).location.href = data.url;
      } else {
        await WebBrowser.openAuthSessionAsync(data.url, redirectTo ?? undefined);
      }
    }
    setGoogleLoading(false);
  };

  const onSignInWithPassword = async () => {
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setSubmitting(false);
  };

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator color="#2D3748" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-100">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Konteyner: beyaz, rounded-3xl, shadow-xl */}
        <View
          className="w-full max-w-md self-center rounded-3xl bg-white px-6 py-8"
          style={shadowStyle({ width: 0, height: 10 }, 20, 0.12, '#000', 12)}>
          <Text className="text-2xl font-bold text-[#1e3a5f] mb-1">Agora'ya Hoşgeldiniz</Text>
          <Text className="text-sm text-gray-500 mb-6">
            İlerlemenizi kaydetmek için giriş yapabilirsiniz.
          </Text>

          {/* Google: beyaz, ince gri çerçeve */}
          <Pressable
            onPress={onSignInWithGoogle}
            disabled={googleLoading}
            className="w-full flex-row items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-3 active:opacity-90">
            {googleLoading ? (
              <ActivityIndicator color="#2D3748" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#374151" />
                <Text className="text-base font-medium text-gray-800">Google ile Devam Et</Text>
              </>
            )}
          </Pressable>

          {/* Ayraç: veya e-posta ile, flex items-center */}
          <View className="flex-row items-center gap-3 my-5">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-sm text-gray-400">veya e-posta ile</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Inputlar: bg-gray-50, gri çerçeve, p-3, rounded-lg */}
          <TextInput
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 mb-3"
            placeholder="E-posta Adresi"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 mb-4"
            placeholder="Şifre"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text className="text-sm text-red-500 mb-3">{error}</Text> : null}

          {/* Giriş: tam genişlik, bg-[#2D3748], beyaz, rounded-lg */}
          <Pressable
            onPress={onSignInWithPassword}
            disabled={submitting}
            className="w-full rounded-lg py-3.5 items-center active:opacity-90"
            style={{ backgroundColor: '#2D3748' }}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Giriş Yap</Text>
            )}
          </Pressable>

          {/* Alt link: mavi Hesap Oluştur */}
          <Pressable onPress={() => router.push('/(auth)/signup')} className="mt-4 py-2">
            <Text className="text-center text-sm font-medium text-blue-500">Hesap Oluştur</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
