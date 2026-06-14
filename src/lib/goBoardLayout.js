/**
 * Single source of truth for go board geometry.
 * Grid lines, stones, hit-testing, and axis labels must all use these values.
 */

/** Fraction of board width reserved as margin on each side.
 * Matches Agora_gravity GoBoardSVG: PAD 18 in a 560 viewBox.
 */
export const BOARD_PADDING_PCT = 18 / 560;

/**
 * @param {number} size - line count (9, 13, 19)
 * @param {number} W - square canvas edge length in CSS pixels
 * @returns {{ padding: number, cellSize: number, inner: number, W: number }}
 */
export function computeBoardLayout(size, W) {
  const padding = W * BOARD_PADDING_PCT;
  const inner = W - padding * 2;
  const cellSize = inner / (size - 1);
  return { padding, cellSize, inner, W };
}

/** Intersection center (same as stone centers). */
export function intersectionXY(padding, cellSize, ix, iy) {
  return {
    x: padding + ix * cellSize,
    y: padding + iy * cellSize,
  };
}
