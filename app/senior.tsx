/**
 * Senior mód — domáca obrazovka.
 *
 * Filozofia:
 *   - Veľké tlačidlá (>= 100px výška), vysoký kontrast, jednoduchý jazyk
 *   - Žiadne "secondary" akcie — všetko prominentné
 *   - Stay-in-senior-mode: každá dlaždica vedie na senior-* obrazovku,
 *     nie do bežnej UI s malým písmom
 *   - SOS vždy dostupné vpravo dole
 *   - ⚙ Nastavenia v hornom rohu — veľkosť písma, vlastné kontakty
 *
 * Dlaždice (2×3 grid):
 *   1. Aktuality                  → /senior-aktuality
 *   2. Odvoz odpadu               → /senior-odpady  (alt: existujúce /explore)
 *   3. Podujatia                  → /senior-podujatia
 *   4. Spýtať sa Marty            → /senior-marta
 *   5. Kontakty                   → /senior-kontakty
 *   6. Nahlásiť problém           → /senior-hlasenie  (alt: existujúce /hlasenie)
 */

import { useTenant } from '@/src/config/tenant'
import { useOdpady } from '@/src/hooks/useOdpady'
import { CustomKontakt, FONT_SCALES, formatTelefon, OBECNY_TELEFON, SENIOR } from '@/constants/seniorMode'
import { useSeniorMode } from '@/hooks/useSeniorMode'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

function pozdrav() {
  const h = new Date().getHours()
  if (h >= 6 && h < 11) return { text: 'Dobré ráno', emoji: '☀️' }
  if (h >= 11 && h < 18) return { text: 'Dobrý deň', emoji: '🌤️' }
  if (h >= 18 && h < 22) return { text: 'Dobrý večer', emoji: '🌅' }
  return { text: 'Dobrú noc', emoji: '🌙' }
}

function formatBlizkyVyvoz(datum: string) {
  const d = new Date(datum)
  const dnes = new Date()
  const zajtra = new Date()
  zajtra.setDate(dnes.getDate() + 1)
  const jeDnes = d.toDateString() === dnes.toDateString()
  const jeZajtra = d.toDateString() === zajtra.toDateString()
  const den = d.toLocaleDateString('sk-SK', { weekday: 'long' })
  const datumStr = d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long' })
  if (jeDnes) return { hlavny: 'DNES', sub: datumStr, urgent: true }
  if (jeZajtra) return { hlavny: 'ZAJTRA', sub: datumStr, urgent: true }
  return { hlavny: den.toUpperCase(), sub: datumStr, urgent: false }
}

type Dlazdica = {
  id: string
  emoji: string
  title: string
  subtitle: string
  farba: string
  onPress: () => void
}

export default function SeniorScreen() {
  const router = useRouter()
  const tenant = useTenant()
  const { set: setSenior, fontScale, customKontakty } = useSeniorMode()
  const { odpady } = useOdpady()
  const najblizsi = odpady[0]
  const p = pozdrav()
  const F = FONT_SCALES[fontScale]

  const [sosOpen, setSosOpen] = useState(false)

  const dnes = new Date()
  const denTyzdna = dnes.toLocaleDateString('sk-SK', { weekday: 'long' })
  const datum = dnes.toLocaleDateString('sk-SK', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  function vypnutSenior() {
    Alert.alert(
      'Vypnúť senior mód?',
      'Aplikácia sa prepne do bežného zobrazenia s normálnou veľkosťou písma.',
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: 'Vypnúť',
          onPress: async () => {
            await setSenior(false)
            router.replace('/' as never)
          },
        },
      ]
    )
  }

  const dlazdice: Dlazdica[] = useMemo(() => [
    {
      id: 'aktuality',
      emoji: '📰',
      title: 'AKTUALITY',
      subtitle: 'Čo je nové v obci',
      farba: '#1565C0',
      onPress: () => router.push('/senior-aktuality' as never),
    },
    {
      id: 'odpady',
      emoji: '♻️',
      title: 'ODVOZ ODPADU',
      subtitle: 'Kedy vyvážajú',
      farba: '#2E7D32',
      onPress: () => router.push('/explore' as never),
    },
    {
      id: 'podujatia',
      emoji: '📅',
      title: 'PODUJATIA',
      subtitle: 'Akcie v obci',
      farba: '#F57F17',
      onPress: () => router.push('/podujatia' as never),
    },
    {
      id: 'marta',
      emoji: '🤖',
      title: 'SPÝTAŤ SA',
      subtitle: 'Marta poradí 24/7',
      farba: '#6A1B9A',
      onPress: () => router.push('/senior-marta' as never),
    },
    {
      id: 'kontakty',
      emoji: '📞',
      title: 'KONTAKTY',
      subtitle: 'Úrad, lekár, rodina',
      farba: SENIOR.colors.primary,
      onPress: () => router.push('/senior-kontakty' as never),
    },
    {
      id: 'hlasenie',
      emoji: '⚠️',
      title: 'NAHLÁSIŤ',
      subtitle: 'Problém v obci',
      farba: '#D84315',
      onPress: () => router.push('/hlasenie' as never),
    },
  ], [router])

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar — nastavenia */}
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tenantName, { fontSize: F.small }]} numberOfLines={1}>
                {tenant.nazov}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push('/senior-nastavenia' as never)}
              accessibilityRole="button"
              accessibilityLabel="Nastavenia senior módu"
              hitSlop={10}
            >
              <Text style={styles.settingsIcon}>⚙</Text>
              <Text style={[styles.settingsText, { fontSize: F.small }]}>Nastavenia</Text>
            </TouchableOpacity>
          </View>

          {/* Dátum + pozdrav */}
          <View style={styles.header}>
            <Text style={[styles.den, { fontSize: F.heading }]}>
              {denTyzdna.charAt(0).toUpperCase() + denTyzdna.slice(1)}
            </Text>
            <Text style={[styles.datum, { fontSize: F.title }]}>{datum}</Text>
            <Text style={[styles.pozdrav, { fontSize: F.title }]}>
              {p.text}! {p.emoji}
            </Text>
          </View>

          {/* Najbližší vývoz */}
          {najblizsi && (() => {
            const { hlavny, sub, urgent } = formatBlizkyVyvoz(najblizsi.datum)
            return (
              <TouchableOpacity
                style={[
                  styles.vyvozBox,
                  urgent && { borderColor: SENIOR.colors.primary, borderWidth: 4 },
                ]}
                activeOpacity={0.85}
                onPress={() => router.push('/explore' as never)}
                accessibilityRole="button"
                accessibilityLabel={`Najbližší vývoz: ${hlavny}, ${najblizsi.typ.nazov}`}
              >
                <Text style={[styles.vyvozLabel, { fontSize: F.small }]}>NAJBLIŽŠÍ VÝVOZ</Text>
                <View style={[styles.vyvozPas, { backgroundColor: najblizsi.typ.farba }]} />
                <View style={styles.vyvozRow}>
                  <Text style={[styles.vyvozTyp, { fontSize: F.heading }]}>
                    ♻️ {najblizsi.typ.nazov}
                  </Text>
                  <Text style={[styles.vyvozDen, { fontSize: F.title, color: urgent ? SENIOR.colors.primary : SENIOR.colors.text }]}>
                    {hlavny}
                  </Text>
                </View>
                <Text style={[styles.vyvozDatum, { fontSize: F.body }]}>{sub}</Text>
              </TouchableOpacity>
            )
          })()}

          {/* 6 veľkých dlaždíc (2×3) */}
          <View style={styles.grid}>
            {dlazdice.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[styles.tile, { backgroundColor: d.farba }]}
                activeOpacity={0.85}
                onPress={d.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${d.title}. ${d.subtitle}`}
              >
                <Text style={[styles.tileEmoji, { fontSize: F.display }]}>{d.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tileTitle, { fontSize: F.title }]}>{d.title}</Text>
                  <Text style={[styles.tileSub, { fontSize: F.small }]}>{d.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Prepínač späť na normálny mód */}
          <TouchableOpacity
            style={styles.switchBtn}
            activeOpacity={0.8}
            onPress={vypnutSenior}
          >
            <Text style={[styles.switchBtnText, { fontSize: F.body }]}>
              Vypnúť senior mód
            </Text>
          </TouchableOpacity>

          {/* Spodok */}
          <View style={{ height: 140 }} />
        </ScrollView>
      </SafeAreaView>

      {/* SOS — fixne vpravo dole */}
      <TouchableOpacity
        style={styles.sos}
        activeOpacity={0.7}
        onPress={() => setSosOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Núdzové volanie SOS"
      >
        <Text style={[styles.sosText, { fontSize: F.title }]}>SOS</Text>
      </TouchableOpacity>

      {/* SOS modal — rozšírené menu s vlastnými kontaktmi */}
      <SosModal
        visible={sosOpen}
        onClose={() => setSosOpen(false)}
        customKontakty={customKontakty}
        F={F}
      />
    </View>
  )
}

// ─── SOS Modal s vlastnými kontaktmi ───────────────────────────────────────
function SosModal({
  visible, onClose, customKontakty, F,
}: {
  visible: boolean
  onClose: () => void
  customKontakty: CustomKontakt[]
  F: typeof FONT_SCALES['medium']
}) {
  const call = (cislo: string) => {
    Linking.openURL(`tel:${cislo}`)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable style={modalStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={modalStyles.handle} />
          <Text style={[modalStyles.title, { fontSize: F.heading }]}>
            🆘 Núdzové volanie
          </Text>
          <Text style={[modalStyles.subtitle, { fontSize: F.small }]}>
            Vyberte koho chcete zavolať
          </Text>

          <ScrollView style={{ maxHeight: 480 }}>
            {/* Tiesňové linky */}
            <SosBtn emoji="🆘" label="Tiesňová linka 112" big onPress={() => call('112')} F={F} />
            <SosBtn emoji="🚑" label="Záchranka 155" onPress={() => call('155')} F={F} />
            <SosBtn emoji="🚒" label="Hasiči 150" onPress={() => call('150')} F={F} />
            <SosBtn emoji="👮" label="Polícia 158" onPress={() => call('158')} F={F} />

            {/* Obec */}
            <View style={modalStyles.sep} />
            <SosBtn emoji="🏛️" label={`Obecný úrad · ${formatTelefon(OBECNY_TELEFON)}`} onPress={() => call(OBECNY_TELEFON)} F={F} />

            {/* Vlastné kontakty */}
            {customKontakty.length > 0 && <View style={modalStyles.sep} />}
            {customKontakty.map(k => (
              <SosBtn
                key={k.id}
                emoji={k.emoji ?? '👤'}
                label={`${k.meno} · ${formatTelefon(k.telefon)}`}
                onPress={() => call(k.telefon)}
                F={F}
              />
            ))}
          </ScrollView>

          <TouchableOpacity style={modalStyles.cancel} onPress={onClose}>
            <Text style={[modalStyles.cancelText, { fontSize: F.body }]}>Zrušiť</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function SosBtn({
  emoji, label, onPress, big, F,
}: {
  emoji: string
  label: string
  onPress: () => void
  big?: boolean
  F: typeof FONT_SCALES['medium']
}) {
  return (
    <TouchableOpacity
      style={[modalStyles.sosBtn, big && modalStyles.sosBtnBig]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[modalStyles.sosBtnEmoji, { fontSize: big ? F.heading : F.title }]}>{emoji}</Text>
      <Text style={[modalStyles.sosBtnText, { fontSize: big ? F.title : F.body, fontWeight: big ? '900' : '700' }]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SENIOR.colors.background },
  scroll: { padding: SENIOR.spacing.padding, gap: SENIOR.spacing.gap },

  // Top bar (nastavenia)
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  tenantName: { fontWeight: '700', color: SENIOR.colors.textSecondary, letterSpacing: 0.5 },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: SENIOR.colors.borderLight,
  },
  settingsIcon: { fontSize: 22 },
  settingsText: { fontWeight: '800', color: SENIOR.colors.text },

  // Dátum + pozdrav
  header: {
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: SENIOR.colors.text,
    marginBottom: 8,
  },
  den: { fontWeight: '900', color: SENIOR.colors.text, letterSpacing: -0.5 },
  datum: { color: SENIOR.colors.text, marginTop: 4, fontWeight: '600' },
  pozdrav: { fontWeight: '800', color: SENIOR.colors.primary, marginTop: 16 },

  // Vývoz box
  vyvozBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: SENIOR.colors.text,
    borderRadius: 18,
    padding: SENIOR.spacing.padding,
    gap: 6,
  },
  vyvozLabel: { fontWeight: '900', color: SENIOR.colors.textSecondary, letterSpacing: 1 },
  vyvozPas: { height: 6, borderRadius: 3, marginVertical: 6 },
  vyvozRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  vyvozTyp: { fontWeight: '900', color: SENIOR.colors.text, flex: 1 },
  vyvozDen: { fontWeight: '900' },
  vyvozDatum: { color: SENIOR.colors.text, fontWeight: '600' },

  // Grid 2x3
  grid: { gap: 16 },
  tile: {
    minHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  tileEmoji: { lineHeight: undefined },
  tileTitle: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.5 },
  tileSub: { color: 'rgba(255,255,255,0.95)', fontWeight: '700', marginTop: 4 },

  // Switch off
  switchBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 3,
    borderColor: SENIOR.colors.text,
    borderRadius: 14,
    minHeight: SENIOR.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  switchBtnText: { fontWeight: '800', color: SENIOR.colors.text },

  // SOS
  sos: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 5,
    borderColor: '#FFFFFF',
  },
  sosText: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 2 },
})

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 8,
  },
  handle: {
    width: 48, height: 5,
    backgroundColor: '#CCC',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: { fontWeight: '900', color: SENIOR.colors.text, textAlign: 'center' },
  subtitle: { color: SENIOR.colors.textSecondary, textAlign: 'center', marginBottom: 12 },

  sep: { height: 2, backgroundColor: SENIOR.colors.borderLight, marginVertical: 10 },

  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: SENIOR.colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginVertical: 4,
    minHeight: SENIOR.touchTarget,
  },
  sosBtnBig: {
    backgroundColor: '#FFEBEE',
    borderColor: SENIOR.colors.primary,
    borderWidth: 3,
  },
  sosBtnEmoji: {},
  sosBtnText: { color: SENIOR.colors.text, flex: 1 },

  cancel: {
    backgroundColor: '#212121',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: { color: '#FFF', fontWeight: '800' },
})
