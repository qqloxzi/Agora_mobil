import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { getAuthRedirectUri, getNativeAppReturnUri } from './authRedirect';
import { completeSupabaseSessionFromUrl } from './authSessionFromUrl';

WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; message: string; cancelled?: boolean };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  // Mobil varsayılan: exp:// veya agoramobil:// (Supabase Redirect URLs wildcards).
  // Köprü: yalnızca EXPO_PUBLIC_OAUTH_USE_BRIDGE=1 iken.
  // Web: origin/auth/callback
  const redirectTo = getAuthRedirectUri();
  const appReturnUri = getNativeAppReturnUri();

  if (__DEV__) {
    console.log('[Google OAuth] redirectTo:', redirectTo);
    console.log('[Google OAuth] appReturnUri:', appReturnUri);
  }

  const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (oauthError) {
    return { ok: false, message: oauthError.message };
  }

  if (!data?.url) {
    return { ok: false, message: 'OAuth URL alınamadı.' };
  }

  if (Platform.OS === 'web') {
    window.location.assign(data.url);
    return { ok: true };
  }

  // Android: app scheme / exp:// gelene kadar Custom Tab açık kalır.
  // iOS: ASWebAuthenticationSession redirectUrl ile kapanır.
  // redirectTo ile appReturnUri aynı native URI olmalı (köprü modunda köprü → appReturnUri).
  const result = await WebBrowser.openAuthSessionAsync(data.url, appReturnUri);

  if (result.type === 'success' && result.url) {
    const { error: sessionError } = await completeSupabaseSessionFromUrl(result.url);
    if (sessionError) {
      return { ok: false, message: sessionError.message };
    }
    return { ok: true };
  }

  // Deep link handler / bridge ile session gelmiş olabilir
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    return { ok: true };
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { ok: false, message: 'Giriş iptal edildi.', cancelled: true };
  }

  return {
    ok: false,
    message:
      'Google girişi tamamlanamadı. Supabase Redirect URLs: exp://** ve agoramobil://auth/callback. Site URL /dashboard olmamalı.',
  };
}
