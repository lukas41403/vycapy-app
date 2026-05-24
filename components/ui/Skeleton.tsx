/**
 * Skeleton — jemne pulzujúci placeholder pre loading stavy.
 *
 * Použitie:
 *   <Skeleton height={120} radius={16} />
 *   <SkeletonCard />   — predpripravený layout karty
 */

import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius as r, spacing } from '@/src/theme/tokens'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleProp, View, ViewStyle } from 'react-native'

type Props = {
  width?: number | `${number}%`
  height?: number
  radius?: number
  style?: StyleProp<ViewStyle>
}

export function Skeleton({ width = '100%', height = 12, radius = 6, style }: Props) {
  const t = useThemeColors()
  const pulse = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [pulse])

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: t.surfaceAlt,
          opacity: pulse,
        },
        style,
      ]}
    />
  )
}

/** Predpripravená skeletna karta — vhodná pre aktuality / podujatia. */
export function SkeletonCard() {
  const t = useThemeColors()
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: r.lg,
        padding: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.md,
      }}
    >
      <Skeleton height={120} radius={r.md} />
      <Skeleton width="50%" height={10} />
      <Skeleton width="85%" height={16} />
      <Skeleton width="70%" height={12} />
    </View>
  )
}

export default Skeleton
