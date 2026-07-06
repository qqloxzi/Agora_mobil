import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { getAuthRedirectUri, getNativeAppReturnUriForDebug } from './authRedirect';
import { completeSupabaseSessionFromUrl } from './authSessionFromUrl';

WebBrowser.maybeCompleteAuthSession();

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; message: string; cancelled?: boolean };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const redirectTo = getAuthRedirectUri();

  if (__DEV__) {
    console.log('[Google OAuth] redirectTo:', redirectTo);
    if (Platform.OS !== 'web') {
      console.log('[Google OAuth] app return URI:', getNativeAppReturnUriForDebug());
    }
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

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    getNativeAppReturnUriForDebug()
  );

  if (result.type === 'success' && result.url) {
    const { error: sessionError } = await completeSupabaseSessionFromUrl(result.url);
    if (sessionError) {
      return { ok: false, message: sessionError.message };
    }
    return { ok: true };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    return { ok: true };
  }

  if (result.type === 'cancel') {
    return { ok: false, message: 'Giriş iptal edildi.', cancelled: true };
  }

  return {
    ok: false,
    message:
      'Google girişi tamamlanamadı. Supabase Redirect URLs listesine uygulama adresini eklediğinizden emin olun.',
  };
}
