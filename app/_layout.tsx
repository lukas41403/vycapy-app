import { registerForPushNotifications } from '@/src/lib/pushNotifications'
import { ThemeProvider as VOThemeProvider, useThemeMode } from '@/src/theme/ThemeContext'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import 'react-native-reanimated'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  return (
    <VOThemeProvider>
      <NavigationWithTheme />
    </VOThemeProvider>
  )
}

function NavigationWithTheme() {
  const { scheme } = useThemeMode()

  // Pri prvom spustení požiadať o push permission a registrovať token.
  // Defenzívne — ak balík expo-notifications nie je nainštalovaný, funkcia
  // tichá vráti null a appka funguje normálne.
  useEffect(() => {
    registerForPushNotifications().catch(() => {})
  }, [])

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  )
}
