/**
 * Go problem record: `id` is always unique; `sgf` is optional metadata (filename/path)
 * and may repeat across multiple problems.
 */
/** SGF LB / TR / CR / SQ / MA — tahta üzeri işaret (JSON grid hücresi). */
export type BoardLabelCell =
  | { kind: 'letter'; text: string }
  | { kind: 'square' }
  | { kind: 'circle' }
  | { kind: 'triangle' }
  | { kind: 'cross' };

export type SolutionNode = {
  x: number;
  y: number;
  color: 'black' | 'white';
  /** SGF C[] / JSON: hamle sonrası açıklama veya yorum metni */
  comment?: string;
  /** JSON: `(BoardLabelCell | null)[][]` — bu node'a ait tahta üzeri işaretler */
  labels?: string;
  children: SolutionNode[];
  status?: 'correct' | 'wrong' | null;
};

export type GoProblem = {
  /** Stable unique key for React, DB, and routing — never an SGF filename. */
  id: string;
  /** Topic / tree node id (e.g. "Kurallar"). */
  category: string;
  title: string;
  description: string;
  /** Supabase `initial_description`: preferred intro shown before lesson body/description. */
  initialDescription?: string;
  size: number;
  turn: 'black' | 'white';
  /** JSON: `(BoardLabelCell | null)[][]` — SGF LB/TR/CR/SQ/MA */
  labels: string;
  initialState: string;
  solution: { children: SolutionNode[] } | SolutionNode[];
  /** Optional: source SGF file under /public/lessons/ — not unique; many rows may share the same value. */
  sgf?: string;
  /** Optional Supabase curriculum placement metadata. */
  courseSlug?: string | null;
  moduleSlug?: string | null;
  moduleTitle?: string | null;
  lessonTitle?: string | null;
  sortOrder?: number | null;
  /**
   * Ders/tahta akışı (SGF: `LP[...]`).
   * `auto` — rakip anında oynar, ek duraklama yok.
   * `stepAfter` — rakip hamlesi hemen oynanır; yorum (genelde rakip hamlesindeki C[]) okunana kadar durur, sonra "Devam".
   * `stepBefore` — kullanıcı hamlesinden sonra durur; "Devam" ile rakip oynar (kendi hamle yorumunu önce okutmak için).
   */
  lessonPlayback?: 'auto' | 'stepAfter' | 'stepBefore';
  /**
   * SGF kök `CS[...]` — koordinat yorumu (tahta: x soldan, y üstten).
   * `legacy`: her iki harf de üstten satır (eski Agora davranışı).
   * `ff4`: 2. harf SGF FF[4] gibi **aşağıdan** satır; tahta indeksine `y = SZ-1-y` ile çevrilir (OGS dışa aktarımına yakın).
   */
  coordSystem?: 'legacy' | 'ff4';
};
