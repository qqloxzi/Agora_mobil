import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { LogIn, Sparkles, X } from 'lucide-react-native';

type StartJourneyModalContextType = {
  openStartJourneyModal: () => void;
};

const StartJourneyModalContext = createContext<StartJourneyModalContextType | null>(null);

export function StartJourneyModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const goLogin = useCallback(() => {
    setOpen(false);
    router.push('/(auth)');
  }, [router]);

  const goOnboarding = useCallback(() => {
    setOpen(false);
    router.push('/onboarding');
  }, [router]);

  const value = { openStartJourneyModal: openModal };

  return (
    <StartJourneyModalContext.Provider value={value}>
      {children}
      <Modal visible={open} transparent animationType="fade" onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View className="flex-1 bg-black/50 justify-center items-center p-6">
            <TouchableWithoutFeedback>
              <View className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl overflow-hidden relative border border-slate-200 dark:border-white/10">
                <TouchableOpacity
                  onPress={closeModal}
                  className="absolute right-4 top-4 p-2 rounded-lg bg-transparent"
                  accessibilityLabel="Kapat"
                >
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>

                <Text className="text-center text-lg font-semibold tracking-tight text-slate-900 dark:text-white px-8">
                  Nasıl devam etmek istersiniz?
                </Text>
                <Text className="mt-2 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Daha önce kayıt olduysanız giriş yapın; yeniyseniz kişiselleştirilmiş ankete başlayın.
                </Text>

                <View className="mt-6 flex-col gap-3">
                  <TouchableOpacity
                    onPress={goLogin}
                    className="flex-row w-full items-center gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent px-4 py-4"
                  >
                    <View className="h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10">
                      <LogIn size={20} color="#475569" className="dark:text-slate-200" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                        Giriş yap
                      </Text>
                      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Zaten hesabım var
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={goOnboarding}
                    className="flex-row w-full items-center gap-4 rounded-xl border border-primary-blue bg-primary-blue px-4 py-4"
                  >
                    <View className="h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                      <Sparkles size={20} color="#ffffff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-white">Yeni başlıyorum</Text>
                      <Text className="mt-0.5 text-xs text-white/80">
                        Ankete başla (kayıt anketi sonunda)
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </StartJourneyModalContext.Provider>
  );
}

export function useStartJourneyModal() {
  const ctx = useContext(StartJourneyModalContext);
  if (!ctx) {
    throw new Error('useStartJourneyModal must be used within StartJourneyModalProvider');
  }
  return ctx;
}
