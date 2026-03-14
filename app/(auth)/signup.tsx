import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { shadowStyle } from '../../src/lib/shadowStyle';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSignUp = async () => {
    setSubmitting(true);
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-neutral-100">
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
        <View
          className="w-full max-w-md self-center rounded-2xl bg-white px-6 py-8"
          style={shadowStyle({ width: 0, height: 4 }, 12, 0.06, '#000', 4)}>
          <Text className="text-2xl font-bold text-neutral-800 mb-1">Hesap Oluştur</Text>
          <Text className="text-sm text-neutral-500 mb-6">
            E-posta ve şifre ile yeni hesap oluşturun.
          </Text>

          <TextInput
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-neutral-800 mb-3"
            placeholder="E-posta Adresi"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-neutral-800 mb-4"
            placeholder="Şifre"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text className="text-sm text-red-500 mb-3">{error}</Text> : null}
          {success ? (
            <Text className="text-sm text-emerald-600 mb-3">
              Kayıt başarılı. E-posta doğrulama linkini kontrol edin.
            </Text>
          ) : null}

          <Pressable
            onPress={onSignUp}
            disabled={submitting}
            className="w-full rounded-xl bg-neutral-700 py-3.5 items-center active:opacity-90">
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">Kayıt Ol</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()} className="mt-4 py-2">
            <Text className="text-center text-sm font-medium text-blue-500">Giriş sayfasına dön</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
