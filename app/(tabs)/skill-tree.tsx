import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { GO_TREE_LEVELS, buildHierarchy } from '../../src/data/goTreeData';
import { getCompletedTopicIds } from '../../src/lib/goTreeProgress';
import { shadowStyle } from '../../src/lib/shadowStyle';
import type { TreeNodeWithChildren } from '../../src/types/goTree';

const { width } = Dimensions.get('window');

function flattenHierarchy(nodes: TreeNodeWithChildren[]): TreeNodeWithChildren[] {
  let flat: TreeNodeWithChildren[] = [];
  for (const node of nodes) {
    flat.push(node);
    if (node.children) {
      flat = flat.concat(flattenHierarchy(node.children));
    }
  }
  return flat;
}

function DuolingoNode({
  node,
  index,
  completedIds,
  onPress,
}: {
  node: TreeNodeWithChildren;
  index: number;
  completedIds: string[];
  onPress: (nodeId: string, locked: boolean) => void;
}) {
  // A simple linear progression lock based on index or parent completion
  const isLocked = node.parent !== null && !completedIds.includes(node.parent);
  const isCompleted = completedIds.includes(node.id);

  // Calculate zigzag offset: ranges from -1 to 1 based on sine wave
  const offsetMultiplier = Math.sin((index / 2.5) * Math.PI);
  // Cap the translation to 60px so it perfectly fits any mobile screen without overflowing ScrollView padding
  const translationX = offsetMultiplier * 60;

  return (
    <View className="items-center my-4" style={{ transform: [{ translateX: translationX }] }}>
      <Pressable
        onPress={() => onPress(node.id, isLocked)}
        className={`w-20 h-20 rounded-full items-center justify-center border-b-4 ${
          isLocked
            ? 'bg-gray-200 border-gray-300 opacity-80'
            : isCompleted
              ? 'bg-[#58cc02] border-[#58a700]' // Duolingo green
              : 'bg-[#ffc800] border-[#e5a900]' // Duolingo gold/yellow
        }`}
        style={shadowStyle({ width: 0, height: 2 }, 0.2, 4, '#000')}
      >
        <Ionicons
          name={(node.icon as keyof typeof Ionicons.glyphMap) ?? 'star'}
          size={36}
          color={isLocked ? '#9ca3af' : '#ffffff'}
        />
        {isCompleted && (
          <View className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" style={shadowStyle({ width: 0, height: 1}, 0.1, 2, '#000')}>
            <Ionicons name="checkmark-circle" size={20} color="#58cc02" />
          </View>
        )}
      </Pressable>
      <View className="bg-white/90 px-3 py-1 mt-2 rounded-xl border border-gray-100" style={shadowStyle({ width: 0, height: 1 }, 0.05, 2, '#000')}>
        <Text className={`text-sm font-bold ${isLocked ? 'text-gray-400' : 'text-gray-700'}`}>
          {node.label}
        </Text>
      </View>
    </View>
  );
}

export default function GoTreeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    const ids = await getCompletedTopicIds(user?.id ?? null);
    setCompletedIds(ids);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = await getCompletedTopicIds(user?.id ?? null);
      if (!cancelled) setCompletedIds(ids);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
      return () => {
        if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      };
    }, [loadProgress])
  );

  const handleNodePress = useCallback(
    (nodeId: string, locked: boolean) => {
      if (locked) return;
      if (Platform.OS === 'web' && typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      router.push({ pathname: '/go-tree/problem', params: { topicId: nodeId } });
    },
    [router]
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="mt-3 text-gray-500">İlerleme yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-bold text-gray-900 mb-1">Go Ağacı</Text>
      <Text className="text-gray-500 text-sm mb-6">
        Seviyeye tıklayarak tsumego problemlerini çözün. Tamamladıkça ilerleme kaydedilir.
      </Text>

      {/* Render the flat Duolingo path */}
      {GO_TREE_LEVELS.map((group, groupIdx) => {
        const hierarchy = buildHierarchy(group.levels);
        const flatNodes = flattenHierarchy(hierarchy);
        
        return (
          <View key={groupIdx} className="mb-12 relative items-center w-full">
            <View className="mb-8 rounded-2xl border-2 border-gray-200 bg-white px-6 py-3" style={shadowStyle({ width: 0, height: 2 }, 0.05, 3, '#000')}>
              <Text className="text-lg font-black uppercase text-gray-800 tracking-wider">
                Bölüm {groupIdx + 1}: {group.title}
              </Text>
            </View>
            <View className="w-full relative py-4">
              {/* Vertical connecting line background */}
               <View className="absolute left-1/2 top-0 bottom-0 w-2 bg-gray-200 -ml-1 rounded-full z-0 opacity-50" />
               
              {flatNodes.map((node, nodeIdx) => (
                <DuolingoNode
                  key={node.id}
                  node={node}
                  index={nodeIdx}
                  completedIds={completedIds}
                  onPress={handleNodePress}
                />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
