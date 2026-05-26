import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  icon,
  loading = false,
  className = '',
  textClassName = '',
}: ButtonProps) {
  let bgClass = '';
  let textClass = '';

  switch (variant) {
    case 'primary':
      bgClass = 'bg-ink active:bg-primary-blue shadow-md';
      textClass = 'text-white';
      break;
    case 'secondary':
      bgClass = 'bg-ice-white active:bg-gray-200 border border-slate-200';
      textClass = 'text-ink';
      break;
    case 'outline':
      bgClass = 'bg-transparent border border-gray-300 active:bg-gray-50';
      textClass = 'text-gray-700';
      break;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`flex-row items-center justify-center rounded-full px-6 py-4 transition-all ${bgClass} ${loading ? 'opacity-70' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#1A1A1A'} />
      ) : (
        <>
          <Text className={`text-lg font-bold text-center ${textClass} ${textClassName}`}>
            {title}
          </Text>
          {icon && <React.Fragment>{icon}</React.Fragment>}
        </>
      )}
    </Pressable>
  );
}
