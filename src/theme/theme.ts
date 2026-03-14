/**
 * Global tema – web (tailwind.config.cjs) ile uyumlu, Zen / Go estetiği.
 * Karanlık mod varsayılan.
 */
import { colors } from './colors';

export const theme = {
  colors,
  /** Yuvarlaklık (web: rounded-3xl, rounded-full) */
  radius: {
    card: 24,
    button: 9999,
    input: 12,
  },
  /** Gölge (login kartı) */
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 12,
    },
  },
} as const;

export type Theme = typeof theme;
