import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Web (Agora_gravity) ile aynı Supabase projesi.
 * EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY .env dosyasında tanımlı olmalı.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Env variables are not set. Check .env file.');
}

const isServerSideWeb =
  Platform.OS === 'web' &&
  typeof window === 'undefined' &&
  typeof document === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: isServerSideWeb
    ? {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    : {
        storage: AsyncStorage,          // Session'ı kalıcı olarak sakla
        persistSession: true,           // Uygulama yeniden açılınca oturum korunsun
        autoRefreshToken: true,
        detectSessionInUrl: false,      // Mobilde URL detection devre dışı (native deep link kullanıyoruz)
      },
});
