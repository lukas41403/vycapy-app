/**
 * PressableScale — dotykový wrapper s „profi" odozvou.
 *
 * Pri stlačení sa obsah jemne zmenší (scale) a (na iOS) prebehne ľahká
 * haptika. To dáva appke hmatateľný, kvalitný pocit namiesto plochého
 * `TouchableOpacity` s opacity skokom.
 *
 * Beží na UI vlákne cez react-native-reanimated → plynulé aj pri záťaži.
 *
 * Použitie:
 *   <PressableScale onPress={...} accessibilityLabel="Nahlásiť podnet">
 *     <Card>…</Card>
 *   </PressableScale>
 */

import { motion } from '@/src/theme/tokens'
import * as Haptics from 'expo-haptics'
import { ReactNode } from 'react'
import { Platform, Pressable, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type Props = {
  children: ReactNode
  onPress?: () => void
  onLongPress?: () => void
  /** Cieľová mierka pri stlačení (default 0.97). */
  scaleTo?: number
  /** Vypnúť haptiku (default zapnutá na iOS). */
  haptic?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: 'button' | 'link'
}

export function PressableScale({
  children,
  onPress,
  onLongPress,
  scaleTo = 0.97,
  haptic = true,
  disabled,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
}: Props) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withTiming(scaleTo, { duration: motion.fast })
        if (haptic && Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        }
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: motion.base })
      }}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      {children}
    </AnimatedPressable>
  )
}

export default PressableScale
