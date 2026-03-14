/**
 * Go Ağacı seviye haritası.
 * GameManager.jsx treeStructure ile uyumlu; ikonlar Ionicons adlarıyla.
 */
import type { LevelGroup, TreeNodeWithChildren } from '../types/goTree';

export function buildHierarchy(flatLevels: LevelGroup['levels']): TreeNodeWithChildren[] {
  const nodes = flatLevels.map((n) => ({ ...n, children: [] as TreeNodeWithChildren[] }));
  const map: Record<string, TreeNodeWithChildren> = {};
  nodes.forEach((n) => (map[n.id] = n));
  const roots: TreeNodeWithChildren[] = [];
  nodes.forEach((n) => {
    if (n.parent && map[n.parent]) map[n.parent].children.push(n);
    else roots.push(n);
  });
  return roots;
}

export const GO_TREE_LEVELS: LevelGroup[] = [
  {
    title: '20 Kyu - 18 Kyu Başlangıç',
    levels: [
      { id: 'Kurallar', label: 'Kurallar', icon: 'book', parent: null },
      { id: 'Esir Alma 1', label: 'Esir Alma 1', icon: 'cube', parent: 'Kurallar' },
      { id: 'Bağlanma & Kesme', label: 'Bağlanma & Kesme', icon: 'link', parent: 'Esir Alma 1' },
      { id: 'Nefes Yarışı 1', label: 'Nefes Yarışı 1', icon: 'snow', parent: 'Esir Alma 1' },
      { id: 'Yaşam & Ölüm 1', label: 'Yaşam & Ölüm 1', icon: 'eye', parent: 'Kurallar' },
      { id: 'Kaçış Yolu', label: 'Kaçış Yolu', icon: 'walk', parent: 'Yaşam & Ölüm 1' },
      { id: 'Joseki 1', label: 'Joseki 1', icon: 'book', parent: 'Yaşam & Ölüm 1' },
      { id: 'Oyunu Sona Erdirme', label: 'Oyunu Sona Erdirme', icon: 'flag', parent: 'Joseki 1' },
      { id: 'Tesuji 1', label: 'Tesuji 1', icon: 'bulb', parent: 'Kaçış Yolu' },
      { id: 'Merdiven', label: 'Merdiven ile Esir Alma', icon: 'construct', parent: 'Bağlanma & Kesme' },
      { id: 'Ağ', label: 'Ağ ile Esir Alma', icon: 'apps', parent: 'Merdiven' },
    ],
  },
  {
    title: '17 Kyu - 12 Kyu Temel Taşlar',
    levels: [
      { id: 'Yaşam & Ölüm 2', label: 'Yaşam & Ölüm 2', icon: 'eye', parent: null },
      { id: 'Tesuji 2', label: 'Tesuji 2', icon: 'bulb', parent: 'Yaşam & Ölüm 2' },
      { id: 'Güçlü & Zayıf Şekiller', label: 'Şekiller', icon: 'grid', parent: 'Tesuji 2' },
      { id: 'Güçlü & Zayıf Gruplar', label: 'Güçlü & Zayıf Gruplar', icon: 'business', parent: 'Güçlü & Zayıf Şekiller' },
      { id: 'Büyük & Acil Hamleler', label: 'Büyük & Acil Hamleler', icon: 'locate', parent: 'Güçlü & Zayıf Şekiller' },
      { id: 'Sente & Gote 1', label: 'Sente & Gote 1', icon: 'play-forward', parent: 'Güçlü & Zayıf Gruplar' },
      { id: 'Tenuki', label: 'Tenuki', icon: 'arrow-redo', parent: 'Büyük & Acil Hamleler' },
      { id: 'Cezalandırma', label: 'Cezalandırma', icon: 'hammer', parent: 'Tenuki' },
      { id: 'Açılış Safhası', label: 'Açılış Safhası', icon: 'bar-chart', parent: 'Yaşam & Ölüm 2' },
      { id: 'Joseki 2', label: 'Joseki 2', icon: 'book', parent: 'Açılış Safhası' },
      { id: 'Oyun Yönü 1', label: 'Oyun Yönü 1', icon: 'compass', parent: 'Açılış Safhası' },
      { id: 'Nefes Yarışı 2', label: 'Nefes Yarışı 2', icon: 'snow', parent: 'Joseki 2' },
      { id: 'Miai', label: 'Miai', icon: 'swap-horizontal', parent: 'Nefes Yarışı 2' },
      { id: 'Oyun Ortası 1', label: 'Oyun Ortası 1', icon: 'git-branch', parent: 'Oyun Yönü 1' },
      { id: 'Oyun Sonu 1', label: 'Oyun Sonu 1', icon: 'flag', parent: 'Oyun Yönü 1' },
    ],
  },
  {
    title: '11 Kyu - 6 Kyu Gelişim',
    levels: [
      { id: 'Yaşam & Ölüm 3', label: 'Yaşam & Ölüm 3', icon: 'eye', parent: null },
      { id: 'Oyun Yönü 2', label: 'Oyun Yönü 2', icon: 'compass', parent: 'Yaşam & Ölüm 3' },
      { id: 'Oyun Ortası 2', label: 'Oyun Ortası 2', icon: 'git-branch', parent: 'Oyun Yönü 2' },
      { id: 'Moyo', label: 'Moyo', icon: 'expand', parent: 'Oyun Ortası 2' },
      { id: 'Oyun Sonu 2', label: 'Oyun Sonu 2', icon: 'flag', parent: 'Oyun Yönü 2' },
      { id: 'Tesuji 3', label: 'Tesuji 3', icon: 'bulb', parent: 'Yaşam & Ölüm 3' },
      { id: 'Joseki 3', label: 'Joseki 3', icon: 'book', parent: 'Tesuji 3' },
      { id: 'Ko', label: 'Ko', icon: 'infinite', parent: 'Joseki 3' },
      { id: 'Haengma', label: 'Haengma', icon: 'ellipse', parent: 'Ko' },
      { id: 'Sente & Gote 2', label: 'Sente & Gote 2', icon: 'play-forward', parent: 'Tesuji 3' },
      { id: 'İstila & Küçültme', label: 'İstila & Küçültme', icon: 'arrow-down-circle', parent: 'Sente & Gote 2' },
      { id: 'Yosumiru / Yoklama Hamlesi', label: 'Yosumiru / Yoklama Hamlesi', icon: 'locate', parent: 'İstila & Küçültme' },
      { id: 'Saldırı & Savunma', label: 'Saldırı/Savunma', icon: 'shield-checkmark', parent: 'Sente & Gote 2' },
      { id: 'Aji 1', label: 'Aji 1', icon: 'bug', parent: 'Saldırı & Savunma' },
      { id: 'Aji-Keshi', label: 'Aji-Keshi', icon: 'warning', parent: 'Aji 1' },
    ],
  },
  {
    title: '5 Kyu - 1 Dan',
    levels: [
      { id: 'Yaşam & Ölüm 4', label: 'Yaşam & Ölüm 4', icon: 'eye', parent: null },
      { id: 'Oyun Yönü 3', label: 'Oyun Yönü 3', icon: 'compass', parent: 'Tesuji 4' },
      { id: 'Oyun Ortası 3', label: 'Oyun Ortası 3', icon: 'git-branch', parent: 'Oyun Yönü 3' },
      { id: 'Oyun Sonu 3', label: 'Oyun Sonu 3', icon: 'flag', parent: 'Oyun Yönü 3' },
      { id: 'Pro Kavrayışı', label: 'Pro Kavrayışı', icon: 'ribbon', parent: 'Oyun Ortası 3' },
      { id: 'Tesuji 4', label: 'Tesuji 4', icon: 'bulb', parent: 'Yaşam & Ölüm 4' },
      { id: 'Ai', label: 'Ai', icon: 'hardware-chip', parent: 'Tesuji 3' },
      { id: 'Joseki 4', label: 'Joseki 4', icon: 'book', parent: 'Yaşam & Ölüm 4' },
      { id: 'Sente & Gote 3', label: 'Sente & Gote 3', icon: 'play-forward', parent: 'Ai' },
      { id: 'İstila & Küçültme', label: 'İstila & Küçültme', icon: 'arrow-down-circle', parent: 'Sente & Gote 3' },
      { id: 'Saldırı & Savunma', label: 'Saldırı & Savunma', icon: 'shield-checkmark', parent: 'Sente & Gote 3' },
      { id: 'Aji 2', label: 'Aji 2', icon: 'bug', parent: 'Saldırı & Savunma' },
      { id: 'Semeai', label: 'Semeai', icon: 'git-branch', parent: 'İstila & Küçültme' },
      { id: 'Kikashi', label: 'Kikashi', icon: 'flash', parent: 'Semeai' },
    ],
  },
];
