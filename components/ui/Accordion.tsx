/**
 * Accordion — rozbaľovacia položka (úradná tabuľa, agendy, dokumenty, FAQ).
 *
 * Plynulý expand cez reanimated layout (Fabric-friendly), rotujúci chevron,
 * theme-aware. Respektuje reduced motion.
 */

import { radius, spacing, typo } from '@/src/theme/tokens'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { ReactNode, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Icon, { IconName } from './Icon'

type Props = {
  title: string
  subtitle?: string
  icon?: IconName
  defaultOpen?: boolean
  children: ReactNode
}

export function Accordion({ title, subtitle, icon, defaultOpen = false, children }: Props) {
  const t = useThemeColors()
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(defaultOpen)
  const rot = useSharedValue(defaultOpen ? 1 : 0)

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 90}deg` }],
  }))

  function toggle() {
    const next = !open
    setOpen(next)
    rot.value = withTiming(next ? 1 : 0, { duration: 200 })
  }

  return (
    <Animated.View
      layout={reduced ? undefined : LinearTransition.duration(220)}
      style={[styles.wrap, { backgroundColor: t.surface, borderColor: t.borderLight, shadowColor: t.shadow }]}
    >
      <Pressable
        onPress={toggle}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
      >
        {icon && (
          <View style={[styles.iconBox, { backgroundColor: t.primaryLight }]}>
            <Icon name={icon} size={18} color={t.primary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: t.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: t.textMuted }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron" size={20} color={t.textMuted} />
        </Animated.View>
      </Pressable>

      {open && (
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(180)}
          exiting={reduced ? undefined : FadeOut.duration(120)}
          style={[styles.body, { borderTopColor: t.divider }]}
        >
          {typeof children === 'string'
            ? <Text style={[styles.bodyText, { color: t.textSecondary }]}>{children}</Text>
            : children}
        </Animated.View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  iconBox: { width: 36, height: 36, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
  title: { ...typo.h3 },
  subtitle: { ...typo.caption, marginTop: 2 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
  bodyText: { ...typo.body },
})

export default Accordion
