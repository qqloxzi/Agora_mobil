import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import {
  completeSupabaseSessionFromUrl,
  isAuthCallbackUrl,
} from '../lib/authSessionFromUrl';

/**
 * OAuth callback'leri uygulama genelinde yakala (login ekranı mount olmasa bile).
 */
export function AuthDeepLinkHandler() {
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      if (!isAuthCallbackUrl(url)) return;
      await completeSupabaseSessionFromUrl(url);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const onCallback =
          window.location.pathname.includes('/auth/callback') ||
          window.location.hash.includes('access_token') ||
          window.location.search.includes('code=');
        if (onCallback) {
          window.history.replaceState({}, '', '/');
        }
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      void handleUrl({ url: window.location.href });
    }

    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, []);

  return null;
}
