import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

export const AUTH_CALLBACK_PATH = 'auth/callback';

/**
 * OAuth köprüsü — agoragoakademisi.com Supabase'te zaten kayıtlı.
 * Mobil OAuth bu adrese döner, statik sayfa uygulama deep link'ine yönlendirir.
 */
export const OAUTH_BRIDGE_URL =
  (process.env.EXPO_PUBLIC_OAUTH_BRIDGE_URL as string | undefined)?.replace(/\/$/, '') ??
  'https://agoragoakademisi.com/auth/mobile-callback';

function getNativeAppReturnUri(): string {
  return makeRedirectUri({
    scheme: 'agoramobil',
    path: AUTH_CALLBACK_PATH,
    native: 'agoramobil://auth/callback',
  });
}

/** Google OAuth sonrası Supabase'in yönlendireceği adres (platforma göre). */
export function getAuthRedirectUri(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin.replace(/\/$/, '')}/${AUTH_CALLBACK_PATH}`;
    }
    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL;
    if (siteUrl) {
      return `${siteUrl.replace(/\/$/, '')}/${AUTH_CALLBACK_PATH}`;
    }
  }

  const appReturnUri = getNativeAppReturnUri();
  return `${OAUTH_BRIDGE_URL}?return_to=${encodeURIComponent(appReturnUri)}`;
}

/** Uygulama deep link (köprü sonrası hedef). */
export function getNativeAppReturnUriForDebug(): string {
  return getNativeAppReturnUri();
}

/** Supabase Dashboard → Authentication → URL Configuration → Redirect URLs */
export function getSupabaseRedirectUrlHints(): string[] {
  return [
    getAuthRedirectUri(),
    OAUTH_BRIDGE_URL,
    'https://agoragoakademisi.com/auth/mobile-callback',
    'https://agoragoakademisi.com/**',
    getNativeAppReturnUri(),
    'agoramobil://auth/callback',
    'agoramobil://**',
    'exp://**/--/auth/callback',
    'exp://**',
    'http://localhost:8081/**',
  ];
}
