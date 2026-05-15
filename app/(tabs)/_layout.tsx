import { C } from '@/constants/colors'
import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.borderLight,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* 4 viditeľné taby v dolnej navigácii */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Domov',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="aktuality"
        options={{
          title: 'Aktuality',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📰</Text>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Odpady',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>♻️</Text>,
        }}
      />
      <Tabs.Screen
        name="viac"
        options={{
          title: 'Viac',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>☰</Text>,
        }}
      />

      {/* Skryté obrazovky — dostupné cez router.push, neukazujú sa v tab baru */}
      <Tabs.Screen name="hlasenie"  options={{ href: null }} />
      <Tabs.Screen name="podujatia" options={{ href: null }} />
      <Tabs.Screen name="prenajom"  options={{ href: null }} />
      <Tabs.Screen name="kontakty"  options={{ href: null }} />
    </Tabs>
  )
}
