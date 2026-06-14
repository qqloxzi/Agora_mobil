import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { blogEntries } from '../../src/data/gravityContent';

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const entry = blogEntries.find((item) => item.slug === slug) ?? blogEntries[0];

  if (!entry) return null;

  return (
    <ScrollView
      className="flex-1 bg-ice-white"
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 18, paddingBottom: insets.bottom + 36 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-100 mb-6">
        <Ionicons name="arrow-back" size={18} color="#0a2540" />
      </Pressable>

      <View className="bg-white rounded-3xl border border-gray-100 p-6">
        <Text className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">{entry.category}</Text>
        <Text className="text-3xl font-extrabold text-gray-900 mt-3">{entry.title}</Text>
        <Text className="text-sm text-gray-400 mt-2">{entry.author} · {entry.date}</Text>

        <View className="mt-7 gap-6">
          {entry.sections.map((section) => (
            <View key={section.title}>
              <Text className="text-xl font-extrabold text-primary-blue mb-2">{section.title}</Text>
              <Text className="text-base leading-7 text-gray-600">{section.body}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
