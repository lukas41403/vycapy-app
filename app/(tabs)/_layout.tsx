import { HapticTab } from '@/components/haptic-tab'
import { Icon, IconName } from '@/components/ui'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { Tabs } from 'expo-router'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabLayout() {
  const t = useThemeColors()
  const insets = useSafeAreaInsets()

  const tabIcon = (name: IconName) =>
    ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
      <Icon name={name} variant={focused ? 'filled' : 'outline'} color={color} size={size ?? 24} />
    )

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopWidth: 0,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          // výraznejší „floating" tieň — tab bar sa zdvihne nad obsah
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
            },
            android: { elevation: 16 },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      {/* 4 viditeľné taby v dolnej navigácii */}
      <Tabs.Screen name="index"     options={{ title: 'Domov',     tabBarIcon: tabIcon('domov') }} />
      <Tabs.Screen name="aktuality" options={{ title: 'Aktuality', tabBarIcon: tabIcon('aktuality') }} />
      <Tabs.Screen name="explore"   options={{ title: 'Odpady',    tabBarIcon: tabIcon('odpady') }} />
      <Tabs.Screen name="viac"      options={{ title: 'Viac',      tabBarIcon: tabIcon('viac') }} />

      {/* Skryté obrazovky — dostupné cez router.push, neukazujú sa v tab baru */}
      <Tabs.Screen name="hlasenie"  options={{ href: null }} />
      <Tabs.Screen name="podujatia" options={{ href: null }} />
      <Tabs.Screen name="prenajom"  options={{ href: null }} />
      <Tabs.Screen name="kontakty"  options={{ href: null }} />
    </Tabs>
  )
}
