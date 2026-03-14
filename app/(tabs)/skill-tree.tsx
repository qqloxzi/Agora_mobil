import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { GO_TREE_LEVELS, buildHierarchy } from '../../src/data/goTreeData';
import { getCompletedTopicIds } from '../../src/lib/goTreeProgress';
import { shadowStyle } from '../../src/lib/shadowStyle';
import { getProblemsForCategory } from '../../src/data/problems';
import type { TreeNodeWithChildren } from '../../src/types/goTree';

function TreeNodeItem({
  node,
  completedIds,
  onPress,
  problemCount,
}: {
  node: TreeNodeWithChildren;
  completedIds: string[];
  onPress: (nodeId: string, locked: boolean) => void;
  problemCount: number;
}) {
  const isLocked = node.parent !== null && !completedIds.includes(node.parent);
  const isCompleted = completedIds.includes(node.id);

  return (
    <View className="mb-2">
      <Pressable
        onPress={() => onPress(node.id, isLocked)}
        className={`flex-row items-center rounded-xl border-2 px-4 py-3 ${
          isLocked
            ? 'border-gray-200 bg-gray-100 opacity-70'
            : isCompleted
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-amber-200 bg-white'
        }`}
        style={{
          ...shadowStyle(
            { width: 0, height: 1 },
            3,
            isLocked ? 0 : 0.06,
            '#000',
            isLocked ? 0 : 2
          ),
        }}>
        <View
          className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
            isLocked ? 'bg-gray-300' : isCompleted ? 'bg-emerald-200' : 'bg-amber-100'
          }`}>
          <Ionicons
            name={(node.icon as keyof typeof Ionicons.glyphMap) ?? 'ellipse'}
            size={22}
            color={isLocked ? '#9ca3af' : isCompleted ? '#059669' : '#b45309'}
          />
        </View>
        <Text
          className={`flex-1 text-base font-semibold ${
            isLocked ? 'text-gray-400' : isCompleted ? 'text-emerald-800' : 'text-gray-900'
          }`}
          numberOfLines={1}>
          {node.label}
        </Text>
        {problemCount > 0 && !isLocked && (
          <View className="rounded-full bg-gray-200 px-2 py-0.5">
            <Text className="text-xs font-bold text-gray-600">{problemCount}</Text>
          </View>
        )}
        {isCompleted && (
          <View className="ml-2">
            <Ionicons name="checkmark-circle" size={24} color="#059669" />
          </View>
        )}
      </Pressable>
      {node.children.length > 0 && (
        <View className="ml-6 mt-1 border-l-2 border-gray-200 pl-3">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              completedIds={completedIds}
              onPress={onPress}
              problemCount={getProblemsForCategory(child.id).length}
            />
          ))}
        </View>
      )}
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
    }, [loadProgress])
  );

  const handleNodePress = useCallback(
    (nodeId: string, locked: boolean) => {
      if (locked) return;
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

      {GO_TREE_LEVELS.map((group, idx) => {
        const hierarchy = buildHierarchy(group.levels);
        return (
          <View key={idx} className="mb-8">
            <View className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
              <Text className="text-sm font-bold uppercase tracking-wide text-amber-800">
                {group.title}
              </Text>
            </View>
            {hierarchy.map((root) => (
              <TreeNodeItem
                key={root.id}
                node={root}
                completedIds={completedIds}
                onPress={handleNodePress}
                problemCount={getProblemsForCategory(root.id).length}
              />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
