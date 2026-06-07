/**
 * Counter — animované počítadlo (0 → cieľová hodnota) pri zobrazení.
 *
 * Pre štatistiky / KPI (admin, starosta dashboard). easeOutCubic, respektuje
 * reduced motion (vtedy zobrazí hodnotu okamžite). Číslo používa brand font
 * cez `style` (typ. typo.display / tabular).
 */

import { useEffect, useRef, useState } from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'

type Props = {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  style?: StyleProp<TextStyle>
}

export function Counter({ value, duration = 1100, prefix = '', suffix = '', style }: Props) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (reduced) { setDisplay(value); return }
    const start = Date.now()
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setDisplay(Math.round(value * eased))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value, duration, reduced])

  return <Text style={style}>{prefix}{display}{suffix}</Text>
}

export default Counter
