import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { instructorsData, type InstructorProfile } from '../../src/data/gravityContent';

function InstructorAvatar({ instructor }: { instructor: InstructorProfile }) {
  return (
    <View className="w-16 h-16 rounded-full bg-primary-blue overflow-hidden">
      <Image
        source={instructor.avatar}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
}

export default function InstructorScreen() {
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
          <Text className="text-2xl font-extrabold text-primary-blue">Eğitmenler</Text>
          <Text className="text-sm text-gray-500">Agora Gravity eğitmen profilleri.</Text>
        </View>
      </View>

      {instructorsData.map((instructor) => (
        <Pressable
          key={instructor.id}
          onPress={() => router.push(`/instructor/${instructor.id}`)}
          className="bg-white rounded-3xl border border-gray-100 p-5 mb-4 active:opacity-90"
        >
          <View className="flex-row items-center gap-4">
            <InstructorAvatar instructor={instructor} />
            <View className="flex-1">
              <Text className="text-lg font-extrabold text-gray-900">{instructor.name}</Text>
              <Text className="text-sm font-bold text-blue-600 mt-1">{instructor.title}</Text>
              <Text className="text-xs text-gray-400 mt-1">{instructor.location}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#1d4ed8" />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
