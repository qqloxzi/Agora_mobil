/**
 * Agora Go Akademisi – Web ile uyumlu renk paleti (Go estetiği: siyah / beyaz / gri).
 * Karanlık mod varsayılan; light mod değerleri de tanımlı.
 */
export const colors = {
  // Arka planlar (web: slate-900, slate-950)
  background: {
    default: '#0f172a',   // slate-900
    dark: '#020617',      // slate-950
    card: 'rgba(15, 23, 42, 0.4)',   // dark:bg-slate-900/40
    cardBorder: 'rgba(255, 255, 255, 0.1)',
  },
  // Metin
  text: {
    primary: '#ffffff',
    secondary: 'rgba(226, 232, 240, 0.7)',   // sky-100/70
    muted: '#94a3b8',     // slate-400
    inverse: '#0f172a',   // slate-900 (buton metni)
  },
  // Vurgu (web: sky, cyan, emerald)
  accent: {
    sky: '#7dd3fc',      // sky-300
    skyMuted: 'rgba(125, 211, 252, 0.8)',
    cyan: '#22d3ee',
    emerald: '#34d399',
  },
  // Glow / gradient (login kartı)
  glow: {
    blue: 'rgba(59, 130, 246, 0.4)',
    cyan: 'rgba(34, 211, 238, 0.4)',
    emerald: 'rgba(52, 211, 153, 0.4)',
  },
  // Light mode (isteğe bağlı)
  light: {
    background: '#f8fafc',
    card: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
  },
} as const;
