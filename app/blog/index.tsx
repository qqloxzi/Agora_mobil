import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { blogEntries } from '../../src/data/gravityContent';

export default function BlogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-ice-white"
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 18, paddingBottom: insets.bottom + 36 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center gap-3 mb-8">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100">
          <Ionicons name="arrow-back" size={18} color="#0a2540" />
        </Pressable>
        <View>
          <Text className="text-2xl font-extrabold text-primary-blue">Blog</Text>
          <Text className="text-sm text-gray-500">Gravity içerikleri mobilde.</Text>
        </View>
      </View>

      {blogEntries.map((entry) => (
        <Pressable
          key={entry.slug}
          onPress={() => router.push(`/blog/${entry.slug}`)}
          className="bg-white rounded-3xl border border-gray-100 p-5 mb-4 active:opacity-90"
        >
          <Text className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">{entry.category}</Text>
          <Text className="text-xl font-extrabold text-gray-900 mt-2">{entry.title}</Text>
          <Text className="text-sm text-gray-500 mt-2 leading-6">{entry.snippet}</Text>
          <View className="flex-row items-center justify-between mt-4">
            <Text className="text-xs text-gray-400">{entry.author} · {entry.date}</Text>
            <Ionicons name="chevron-forward" size={18} color="#1d4ed8" />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
