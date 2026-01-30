import { Tabs } from 'expo-router';
import React from 'react';
import { Home, BarChart2, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '@/lib/theme';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const activeColor = NAV_THEME[colorScheme ?? 'light'].colors.primary;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#122117' : '#ffffff',
          borderTopColor: colorScheme === 'dark' ? '#1a2e20' : '#e5e5e5',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
