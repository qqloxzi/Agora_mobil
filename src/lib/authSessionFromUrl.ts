import { supabase } from './supabase';

/** OAuth / magic-link callback URL → Supabase oturumu */
export async function completeSupabaseSessionFromUrl(url: string) {
  const parsed = new URL(url);
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
    url.includes('auth/callback')
  );
}
