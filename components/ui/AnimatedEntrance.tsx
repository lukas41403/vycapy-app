/**
 * AnimatedEntrance — jemný nástup obsahu (fade + posun zdola).
 *
 * Sekcie sa pri otvorení / scrollovaní do pohľadu kaskádovito objavia.
 * Animuje iba `opacity` a `transform` (GPU-friendly, podľa UX odporúčaní),
 * a rešpektuje systémové „obmedziť pohyb" (reduced motion).
 *
 * Použitie:
 *   <AnimatedEntrance delay={80}><Card>…</Card></AnimatedEntrance>
 */

import { motion } from '@/src/theme/tokens'
import { ReactNode } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'

type Props = {
  children: ReactNode
  /** Oneskorenie v ms — pre kaskádu sekcií. */
  delay?: number
  style?: StyleProp<ViewStyle>
}

export function AnimatedEntrance({ children, delay = 0, style }: Props) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <View style={style}>{children}</View>
  }

  return (
    <Animated.View
      style={style}
      entering={FadeInDown.duration(motion.slow).delay(delay)}
    >
      {children}
    </Animated.View>
  )
}

export default AnimatedEntrance
