/**
 * Global tema – web (tailwind.config.cjs) ile uyumlu, Zen / Go estetiği.
 * Karanlık mod varsayılan.
 */
import { colors } from './colors';
import { shadowStyle } from '../lib/shadowStyle';

export const theme = {
  colors,
  /** Yuvarlaklık (web: rounded-3xl, rounded-full) */
  radius: {
    card: 24,
    button: 9999,
    input: 12,
  },
  /** Gölge (login kartı) – web: boxShadow, native: shadow* */
  shadow: {
    card: {
      ...shadowStyle({ width: 0, height: 12 }, 24, 0.35, '#000', 12),
    },
  },
} as const;

export type Theme = typeof theme;
