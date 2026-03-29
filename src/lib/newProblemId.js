/** Unique id for a Go problem row (UUID when available). */
export function newProblemId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `prob-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
