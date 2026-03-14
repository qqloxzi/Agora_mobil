/**
 * Go Ağacı: seviye grupları ve düğüm yapısı.
 * Supabase user_progress (topic_id) ile senkron çalışır.
 */
export interface TreeLevelNode {
  id: string;
  label: string;
  icon: string; // Ionicons name
  parent: string | null;
}

export interface LevelGroup {
  title: string;
  levels: TreeLevelNode[];
}

export interface TreeNodeWithChildren extends TreeLevelNode {
  children: TreeNodeWithChildren[];
}
