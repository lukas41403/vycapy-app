/**
 * AppHeader — zdieľaný header pre všetky taby aplikácie.
 *
 * Štýly:
 *   - variant="brand"  → farebný (červená brand farba), pre hlavnú obrazovku (Aktuality)
 *   - variant="plain"  → biely, pre ostatné taby (Odpady, Hlásenie, ...)
 *
 * Erb obce:
 *   Default sa zobrazí stylizovaný "Erb badge" v RN primitívach (červené
 *   pozadie, žlté písmená V–O na štíte). Keď nahráš skutočný erb ako PNG
 *   do assets/images/erb.png, stačí v ErbBadge() odkomentovať <Image>
 *   variantu a fallback ostane ako záloha pre prípad chybného súboru.
 */

import { C } from '@/constants/colors'
import { useState } from 'react'
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native'

// ── Erb ako lokálny súbor (zatiaľ nie je nahratý) ─────────────────────────
// Akonáhle nahráš `assets/images/erb.png`, odkomentuj nasledovný riadok:
const ERB_SOURCE = require('@/assets/images/erb.png')
// const ERB_SOURCE: any = null
// ──────────────────────────────────────────────────────────────────────────

type Variant = 'brand' | 'plain'

type Props = {
  /** Hlavný titulok (napr. "Aktuality", "Odpadový kalendár") */
  title: string
  /** Voliteľný podtitul (napr. "Najbližšie vývozy odpadu") */
  subtitle?: string
  /** Štýl headera. Defaultne "plain" (biely). */
  variant?: Variant
  /** Ak true, ukáže sa veľký brandový blok s názvom obce nad sekciou */
  showBrandRow?: boolean
  style?: ViewStyle
}

export function AppHeader({
  title,
  subtitle,
  variant = 'plain',
  showBrandRow = false,
  style,
}: Props) {
  const isBrand = variant === 'brand'

  return (
    <View
      style={[
        styles.header,
        isBrand ? styles.headerBrand : styles.headerPlain,
        style,
      ]}
    >
      {showBrandRow && (
        <View style={styles.brandRow}>
          <ErbBadge variant={variant} />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.brandTitle,
                isBrand ? styles.brandTitleBrand : styles.brandTitlePlain,
              ]}
              numberOfLines={1}
            >
              Výčapy-Opatovce
            </Text>
            <Text
              style={[
                styles.brandSub,
                isBrand ? styles.brandSubBrand : styles.brandSubPlain,
              ]}
            >
              Obecná aplikácia
            </Text>
          </View>
        </View>
      )}

      <Text
        style={[
          styles.sectionTitle,
          isBrand ? styles.sectionTitleBrand : styles.sectionTitlePlain,
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            styles.sectionSub,
            isBrand ? styles.sectionSubBrand : styles.sectionSubPlain,
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  )
}

/**
 * Erb obce ako badge.
 * Ak je k dispozícii PNG (ERB_SOURCE != null), zobrazí ho. Inak vyrobí
 * stylizovaný štít vo farbách obce – červené pozadie, biely okraj
 * (strieborná z heraldiky), zlaté písmená V–O.
 */
export function ErbBadge({ variant }: { variant: Variant }) {
  const [failed, setFailed] = useState(false)
  const showImage = ERB_SOURCE != null && !failed

  return (
    <View style={styles.erbWrap}>
      {showImage ? (
        <Image
          source={ERB_SOURCE}
          style={styles.erbImage}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        // Stylizovaný "štít" v heraldických farbách obce
        <View style={styles.erbShield}>
          {/* zelená pažiť na spodku */}
          <View style={styles.erbGrass} />
          {/* žltý "lev" placeholder = písmená V–O */}
          <Text style={styles.erbText}>V–O</Text>
        </View>
      )}
    </View>
  )
}

const ERB_SIZE = 48
const SHIELD_W = 40
const SHIELD_H = 46

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerPlain: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  headerBrand: {
    backgroundColor: C.primary,
    paddingBottom: 24,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },

  // Erb badge wrapper
  erbWrap: {
    width: ERB_SIZE,
    height: ERB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  erbImage: {
    width: ERB_SIZE,
    height: ERB_SIZE,
  },
  // Stylizovaný štít — zaoblený obdĺžnik s "tip" na spodku
  erbShield: {
    width: SHIELD_W,
    height: SHIELD_H,
    backgroundColor: C.brand.red,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 2,
    borderColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  erbGrass: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: C.brand.green,
  },
  erbText: {
    color: C.brand.gold,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 6, // posunúť mierne nahor nad "pažiť"
  },

  brandTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  brandTitleBrand: { color: C.onPrimary },
  brandTitlePlain: { color: C.text },
  brandSub: {
    fontSize: 12,
    marginTop: 1,
  },
  brandSubBrand: { color: 'rgba(255,255,255,0.85)' },
  brandSubPlain: { color: C.textMuted },

  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionTitleBrand: { color: C.onPrimary },
  sectionTitlePlain: { color: C.text },
  sectionSub: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionSubBrand: { color: 'rgba(255,255,255,0.85)' },
  sectionSubPlain: { color: C.textMuted },
})

export default AppHeader
