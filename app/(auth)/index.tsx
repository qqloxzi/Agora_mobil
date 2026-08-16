import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  ScrollView, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { signInWithGoogle } from '../../src/lib/googleSignIn';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user, router]);

  const onSignInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle();
      if (!result.ok && !result.cancelled) {
        setError(result.message);
      }
    } catch (e: any) {
      setError(e.message ?? 'Google ile giriş başarısız.');
    } finally {
      if (Platform.OS !== 'web') {
        setGoogleLoading(false);
      }
    }
  };

  const onSignInWithPassword = async () => {
    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'E-posta veya şifre hatalı.'
          : err.message
      );
    } else if (data.session) {
      router.replace('/(tabs)');
    }

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
          <Image source={require('../../public/background.png')} style={{ width: 200, height: 200 }} resizeMode="contain" />
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

        <Pressable onPress={() => router.push('/(auth)/signup')} className="py-2 active:opacity-70">
          <Text className="text-center text-[15px] text-gray-500">
            Hesabınız yok mu? <Text className="text-blue-500 font-bold">Kayıt Ol</Text>
          </Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
