import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function ChatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '600',
          color: '#333',
          fontSize: 18,
        },
        headerTintColor: '#007AFF',
        contentStyle: {
          backgroundColor: Platform.OS === 'web' ? '#f5f5f5' : '#fff',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Conversații',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerBackTitle: 'Înapoi',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Conversație nouă',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
} 