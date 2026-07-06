import { useEffect } from 'react';
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
    };

    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, []);

  return null;
}
