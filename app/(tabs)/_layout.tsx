import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#EEEEEE',
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
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
        name="hlasenie"
        options={{
          title: 'Hlásenie',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚠️</Text>,
        }}
      />
      <Tabs.Screen
        name="podujatia"
        options={{
          title: 'Podujatia',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📅</Text>,
        }}
      />
    </Tabs>
  );
}