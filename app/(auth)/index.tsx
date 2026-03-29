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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 28,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Logo Section */}
        <View className="w-full items-center mb-12">
          <Image 
            source={require('../../public/background.png')} 
            style={{ width: 140, height: 140 }} 
            resizeMode="contain" 
          />
        </View>

        <TextInput
          className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-4 text-gray-800 mb-4 font-medium text-[16px]"
          placeholder="E-posta"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        
        <TextInput
          className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-4 text-gray-800 mb-6 font-medium text-[16px]"
          placeholder="Şifre"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text className="text-sm font-medium text-red-500 mb-4 text-center px-4">{error}</Text> : null}

        <Pressable
          onPress={onSignInWithPassword}
          disabled={submitting}
          className="w-full bg-blue-500 rounded-2xl py-4 items-center mb-8 active:opacity-90">
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
             <Text className="text-white font-bold text-lg">Giriş Yap</Text>
          )}
        </Pressable>

        <View className="flex-row items-center gap-4 mb-8">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="text-sm font-medium text-gray-400">veya</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        <View className="flex-row items-center gap-4 mb-10 w-full px-4">
          <Pressable
            onPress={onSignInWithGoogle}
            disabled={googleLoading}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 active:bg-gray-50">
            {googleLoading ? (
              <ActivityIndicator color="#3b82f6" />
            ) : (
              <Ionicons name="logo-google" size={24} color="#ea4335" />
            )}
          </Pressable>

          <Pressable
             className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 active:bg-gray-50">
              <Ionicons name="logo-apple" size={24} color="#000" />
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/(auth)/signup')} className="py-2 active:opacity-70">
          <Text className="text-center text-[15px] font-medium text-gray-500">
            Hesabınız yok mu? <Text className="text-blue-500 font-bold">Kayıt Ol</Text>
          </Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
