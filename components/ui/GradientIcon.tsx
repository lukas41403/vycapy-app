/**
 * GradientIcon — ikona vyplnená farebným gradientom (nie plochá šedá).
 *
 * Funguje cez MaskedView: glyph slúži ako maska, cez ktorú presvitá
 * LinearGradient. Použiť na prominentné ikony, kde má gradient vyniknúť
 * (sekcie, počasie, akcenty). Pre drobné funkčné ikony stačí plná farba.
 *
 * Použitie:
 *   <GradientIcon name="podujatia" gradient={C.gradients.gold} size={20} />
 */

import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { View } from 'react-native'
import Icon, { IconName } from './Icon'

type Gradient = readonly [string, string, ...string[]]

type Props = {
  name: IconName
  gradient: Gradient
  size?: number
  variant?: 'filled' | 'outline'
}

export function GradientIcon({ name, gradient, size = 22, variant = 'filled' }: Props) {
  return (
    <MaskedView
      style={{ width: size, height: size }}
      maskElement={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* čierny glyph = plne nepriehľadná maska */}
          <Icon name={name} size={size} color="#000000" variant={variant} />
        </View>
      }
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size }}
      />
    </MaskedView>
  )
}

export default GradientIcon
