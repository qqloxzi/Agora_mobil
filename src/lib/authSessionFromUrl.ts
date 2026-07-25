import { supabase } from './supabase';

function parseAuthCallbackUrl(url: string): URL {
  // Custom scheme (agoramobil://…) bazı ortamlarda new URL ile sorun çıkarabilir.
  try {
    return new URL(url);
  } catch {
    const normalized = url.replace(/^([a-z][a-z0-9+.-]*):\/\//i, 'https://');
    return new URL(normalized);
  }
}

/** OAuth / magic-link callback URL → Supabase oturumu */
export async function completeSupabaseSessionFromUrl(url: string) {
  const parsed = parseAuthCallbackUrl(url);
  const code = parsed.searchParams.get('code');
  if (code) return supabase.auth.exchangeCodeForSession(code);

  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const accessToken =
    hashParams.get('access_token') ?? parsed.searchParams.get('access_token');
  const refreshToken =
    hashParams.get('refresh_token') ?? parsed.searchParams.get('refresh_token');

  if (accessToken && refreshToken) {
    return supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return { data: { session: null, user: null }, error: null };
}

export function isAuthCallbackUrl(url: string) {
  return (
    url.includes('access_token') ||
    url.includes('refresh_token') ||
    url.includes('code=') ||
    url.includes('auth/callback') ||
    url.includes('mobile-callback')
  );
}
