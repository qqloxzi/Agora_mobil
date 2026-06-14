import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { instructorsData } from '../../src/data/gravityContent';

export default function InstructorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const instructor = instructorsData.find((item) => item.id === id) ?? instructorsData[0];

  if (!instructor) return null;

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
        <View className="w-28 h-28 rounded-full bg-primary-blue overflow-hidden mb-5">
          <Image
            source={instructor.avatar}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
        <Text className="text-3xl font-extrabold text-gray-900">{instructor.name}</Text>
        <Text className="text-base font-bold text-blue-600 mt-1">{instructor.title}</Text>
        <Text className="text-sm text-gray-400 mt-1">{instructor.location}</Text>

        <Text className="text-base leading-7 text-gray-600 mt-6">{instructor.about}</Text>

        <Pressable onPress={() => Linking.openURL(`mailto:${instructor.email}`)} className="mt-6 bg-primary-blue rounded-2xl py-4 px-5 flex-row items-center justify-center gap-2">
          <Ionicons name="mail" size={18} color="#fff" />
          <Text className="text-white font-extrabold">{instructor.email}</Text>
        </Pressable>

        <Text className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mt-7 mb-3">Kursları</Text>
        {instructor.courses.map((course) => (
          <View key={course.slug} className="rounded-2xl bg-gray-50 p-4 mb-2">
            <Text className="font-extrabold text-gray-900">{course.title}</Text>
            <Text className="text-sm text-gray-500 mt-1">{course.level}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
