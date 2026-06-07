/**
 * Globálny font patch.
 *
 * Pri custom fontoch v React Native nesie váhu samotná rodina (fontWeight sa
 * pri vlastných fontoch ignoruje). Tento patch prepíše `Text.render` tak, že
 * každému textu BEZ explicitného `fontFamily` doplní správnu brand rodinu
 * podľa jeho `fontWeight`. Výsledok: celá appka používa editorial fonty so
 * správnymi váhami bez nutnosti upravovať každý inline štýl.
 *
 * Texty, ktoré už majú `fontFamily` (napr. cez typo tokeny), ostávajú nedotknuté.
 *
 * Volá sa raz pri štarte (side-effect import v app/_layout.tsx).
 */

import { Text, StyleSheet, TextStyle } from 'react-native'
import { fontFor } from './tokens'

const AnyText = Text as any

if (!AnyText.__brandFontPatched) {
  AnyText.__brandFontPatched = true
  const originalRender = AnyText.render

  AnyText.render = function patchedRender(...args: any[]) {
    const origin = originalRender.apply(this, args)
    const flat = (StyleSheet.flatten(origin.props.style) || {}) as TextStyle
    if (flat.fontFamily) return origin // už má rodinu — nemeníme

    const family = fontFor(flat.fontWeight)
    const Cloned = require('react').cloneElement
    return Cloned(origin, {
      style: [{ fontFamily: family }, origin.props.style],
    })
  }
}

export {}
