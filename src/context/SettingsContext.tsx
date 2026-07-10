import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useColorScheme } from 'nativewind';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  /** Çözümlenmiş gerçek tema (light/dark) */
  resolvedTheme: 'light' | 'dark';
}

interface SettingsContextValue extends SettingsState {
  setThemeMode: (mode: ThemeMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const STORAGE_KEYS = {
  THEME: '@agora/settings/themeMode',
  NOTIFICATIONS: '@agora/settings/notificationsEnabled',
} as const;

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? 'light';
  // NativeWind'in setColorScheme'si dark: prefix sınıfları aktif eder
  const { setColorScheme } = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [notificationsEnabled, setNotificationsState] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Disk'ten yükle
  useEffect(() => {
    (async () => {
      try {
        const [savedTheme, savedNotif] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        ]);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemeModeState(savedTheme);
          setColorScheme(savedTheme);
        }
        if (savedNotif !== null) {
          setNotificationsState(savedNotif === 'true');
        }
      } catch (_) {
        // AsyncStorage hatası sessizce geçilir
      } finally {
        setLoaded(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      setThemeModeState(mode);
      // NativeWind'e bildir → tüm dark: sınıflar anında devreye girer
      setColorScheme(mode);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.THEME, mode);
      } catch (_) {}
    },
    [setColorScheme],
  );

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    setNotificationsState(enabled);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, String(enabled));
    } catch (_) {}
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? systemScheme : themeMode;

  if (!loaded) return null;

  return (
    <SettingsContext.Provider
      value={{
        themeMode,
        notificationsEnabled,
        resolvedTheme,
        setThemeMode,
        setNotificationsEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
