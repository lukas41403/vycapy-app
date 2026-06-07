import 'react-native-reanimated'
import '@/src/theme/fontPatch' // globálny brand font pre všetky <Text>

import { registerForPushNotifications } from '@/src/lib/pushNotifications'
import { ThemeProvider as VOThemeProvider, useThemeMode } from '@/src/theme/ThemeContext'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'

export const unstable_settings = {
  anchor: '(tabs)',
}

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {})
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <VOThemeProvider>
      <NavigationWithTheme />
    </VOThemeProvider>
  )
}

function NavigationWithTheme() {
  const { scheme } = useThemeMode()

  // Pri prvom spustení požiadať o push permission a registrovať token.
  useEffect(() => {
    registerForPushNotifications().catch(() => {})
  }, [])

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  )
}
