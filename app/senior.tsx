/**
 * Senior mód — zjednodušená obrazovka pre starších občanov.
 *
 *   ┌────────────────────────────┐
 *   │  Streda                    │
 *   │  15. mája 2026             │
 *   │  Dobré ráno! ☀️            │
 *   ├────────────────────────────┤
 *   │  Najbližší vývoz:          │
 *   │  ♻️ Zajtra — Plast         │
 *   ├────────────────────────────┤
 *   │  ┌──────────────────────┐  │
 *   │  │ 📰 AKTUALITY         │  │
 *   │  └──────────────────────┘  │
 *   │  ┌──────────────────────┐  │
 *   │  │ ♻️ ODVOZ ODPADU      │  │
 *   │  └──────────────────────┘  │
 *   │  ┌──────────────────────┐  │
 *   │  │ 📞 ZAVOLAŤ NA ÚRAD   │  │
 *   │  └──────────────────────┘  │
 *   │                            │
 *   │  Vypnúť senior mód         │
 *   └────────────────────────────┘
 *                          ┌───┐
 *                          │SOS│ ← fixed
 *                          └───┘
 */

import { C } from '@/constants/colors'
import { OBECNY_TELEFON, SENIOR } from '@/constants/seniorMode'
import { useSeniorMode } from '@/hooks/useSeniorMode'
import { useOdpady } from '@/src/hooks/useOdpady'
import { useRouter } from 'expo-router'
import {
  Alert,
  Linking,
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
  if (jeDnes) return `Dnes — ${datumStr}`
  if (jeZajtra) return `Zajtra — ${datumStr}`
  return `${den.charAt(0).toUpperCase() + den.slice(1)} — ${datumStr}`
}

export default function SeniorScreen() {
  const router = useRouter()
  const { set: setSenior } = useSeniorMode()
  const { odpady } = useOdpady()
  const najblizsi = odpady[0]
  const p = pozdrav()

  const dnes = new Date()
  const denTyzdna = dnes.toLocaleDateString('sk-SK', { weekday: 'long' })
  const datum = dnes.toLocaleDateString('sk-SK', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  function zavolatUrad() {
    Alert.alert(
      'Zavolať na obecný úrad',
      `Číslo: ${OBECNY_TELEFON.replace(/(\d{3})(\d{2})(\d{3})(\d{2})/, '$1 / $2 $3 $4')}`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        { text: 'Zavolať', onPress: () => Linking.openURL(`tel:${OBECNY_TELEFON}`) },
      ]
    )
  }

  function sosAlert() {
    Alert.alert(
      'Núdzové volanie',
      'Koho chcete zavolať?',
      [
        { text: 'Zrušiť', style: 'cancel' },
        {
          text: '🚨 Záchranka (112)',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:112'),
        },
        {
          text: '🏛️ Obecný úrad',
          onPress: () => Linking.openURL(`tel:${OBECNY_TELEFON}`),
        },
      ]
    )
  }

  function vypnutSenior() {
    Alert.alert(
      'Vypnúť senior mód?',
      'Aplikácia sa prepne do normálneho zobrazenia.',
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

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Dátum + pozdrav */}
          <View style={styles.header}>
            <Text style={styles.den}>{denTyzdna.charAt(0).toUpperCase() + denTyzdna.slice(1)}</Text>
            <Text style={styles.datum}>{datum}</Text>
            <Text style={styles.pozdrav}>
              {p.text}! {p.emoji}
            </Text>
          </View>

          {/* Najbližší vývoz odpadu */}
          {najblizsi && (
            <View style={styles.vyvozBox}>
              <Text style={styles.vyvozLabel}>NAJBLIŽŠÍ VÝVOZ</Text>
              <View style={[styles.vyvozPas, { backgroundColor: najblizsi.typ.farba }]} />
              <Text style={styles.vyvozTyp}>♻️ {najblizsi.typ.nazov}</Text>
              <Text style={styles.vyvozDatum}>{formatBlizkyVyvoz(najblizsi.datum)}</Text>
            </View>
          )}

          {/* 3 veľké tlačidlá */}
          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: '#1565C0' }]}
            activeOpacity={0.85}
            onPress={() => {
              setSenior(false).then(() => router.push('/aktuality' as never))
            }}
          >
            <Text style={styles.bigBtnEmoji}>📰</Text>
            <Text style={styles.bigBtnText}>AKTUALITY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: '#2E7D32' }]}
            activeOpacity={0.85}
            onPress={() => {
              setSenior(false).then(() => router.push('/explore' as never))
            }}
          >
            <Text style={styles.bigBtnEmoji}>♻️</Text>
            <Text style={styles.bigBtnText}>ODVOZ ODPADU</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: C.primary }]}
            activeOpacity={0.85}
            onPress={zavolatUrad}
          >
            <Text style={styles.bigBtnEmoji}>📞</Text>
            <Text style={styles.bigBtnText}>ZAVOLAŤ NA ÚRAD</Text>
          </TouchableOpacity>

          {/* Prepínač späť na normálny mód */}
          <TouchableOpacity
            style={styles.switchBtn}
            activeOpacity={0.8}
            onPress={vypnutSenior}
          >
            <Text style={styles.switchBtnText}>Vypnúť senior mód</Text>
          </TouchableOpacity>

          {/* spodok aby SOS neprekrýval obsah */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* SOS — fixne vpravo dole */}
      <TouchableOpacity
        style={styles.sos}
        activeOpacity={0.7}
        onPress={sosAlert}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SENIOR.colors.background },
  scroll: {
    padding: SENIOR.spacing.padding,
    gap: SENIOR.spacing.gap,
  },

  header: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: SENIOR.colors.border,
    marginBottom: SENIOR.spacing.gap,
  },
  den: {
    fontSize: SENIOR.fontSize.heading,
    fontWeight: '800',
    color: SENIOR.colors.text,
  },
  datum: {
    fontSize: SENIOR.fontSize.title,
    color: SENIOR.colors.text,
    marginTop: 4,
  },
  pozdrav: {
    fontSize: SENIOR.fontSize.title,
    fontWeight: '700',
    color: SENIOR.colors.primary,
    marginTop: 12,
  },

  vyvozBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: SENIOR.colors.primary,
    borderRadius: 16,
    padding: SENIOR.spacing.padding,
    gap: 8,
  },
  vyvozLabel: {
    fontSize: SENIOR.fontSize.small,
    fontWeight: '800',
    color: SENIOR.colors.text,
    letterSpacing: 1,
  },
  vyvozPas: { height: 4, borderRadius: 2, marginVertical: 4 },
  vyvozTyp: {
    fontSize: SENIOR.fontSize.heading,
    fontWeight: '800',
    color: SENIOR.colors.text,
  },
  vyvozDatum: {
    fontSize: SENIOR.fontSize.title,
    color: SENIOR.colors.text,
    fontWeight: '600',
  },

  bigBtn: {
    minHeight: 100,
    borderRadius: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  bigBtnEmoji: { fontSize: 42 },
  bigBtnText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },

  switchBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 12,
    minHeight: SENIOR.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  switchBtnText: {
    fontSize: SENIOR.fontSize.body,
    fontWeight: '700',
    color: SENIOR.colors.text,
  },

  sos: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
})
