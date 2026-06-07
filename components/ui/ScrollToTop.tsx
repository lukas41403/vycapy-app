/**
 * ScrollToTop — plávajúce tlačidlo (FAB), ktoré sa objaví po scrollovaní nadol.
 *
 * Rodič riadi `visible` (z onScroll) a `onPress` (scrollnutie na vrch).
 * Jemný fade + scale nástup/odchod (reanimated), respektuje safe-area.
 */

import { radius, shadows } from '@/src/theme/tokens'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { StyleSheet } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from './Icon'
import PressableScale from './PressableScale'

type Props = {
  visible: boolean
  onPress: () => void
  /** Odsadenie zdola (nad tab barom). Default 84. */
  bottom?: number
}

export function ScrollToTop({ visible, onPress, bottom = 84 }: Props) {
  const t = useThemeColors()
  const insets = useSafeAreaInsets()
  if (!visible) return null

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.wrap, { bottom: bottom + insets.bottom }]}
      pointerEvents="box-none"
    >
      <PressableScale
        onPress={onPress}
        scaleTo={0.9}
        accessibilityLabel="Späť nahor"
        style={[styles.fab, { backgroundColor: t.primary, shadowColor: t.primary }]}
      >
        <Icon name="chevronBack" size={22} color="#FFFFFF" style={{ transform: [{ rotate: '90deg' }] }} />
      </PressableScale>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 16, alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 46, height: 46, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.lg,
    shadowOpacity: 0.35,
  },
})

export default ScrollToTop
