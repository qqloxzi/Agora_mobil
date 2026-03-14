import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

/**
 * Web (Agora_1.0.1) ile aynı Supabase projesi:
 * PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY → EXPO_PUBLIC_* ile mobilde kullanılıyor.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env variables are not set');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

