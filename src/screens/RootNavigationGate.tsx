import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export const RootNavigationGate = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return <Slot />;
};

