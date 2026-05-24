/**
 * "Viac" menu — všetky sekundárne obrazovky na jednom mieste.
 *
 * Grid kariet s ikonou a popisom. Admin a Správa obce sú vždy
 * zobrazené — autorizácia sa rieši až na cieľovej obrazovke.
 */

import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { ThemeMode, useThemeMode } from '@/src/theme/ThemeContext'
import { useRouter } from 'expo-router'
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type MenuItem = {
  id: string
  emoji: string
  title: string
  subtitle?: string
  path?: string
  farba: string
  onPress?: () => void
}

export default function ViacScreen() {
  const router = useRouter()
  const { mode, setMode, scheme } = useThemeMode()

  const items: MenuItem[] = [
    {
      id: 'prenajom',
      emoji: '🏟️',
      title: 'Prenájom haly',
      subtitle: 'Rezervujte si športovú halu',
      path: '/prenajom',
      farba: C.brand.gold,
    },
    {
      id: 'kontakty',
      emoji: '📞',
      title: 'Kontakty',
      subtitle: 'Obecný úrad a zamestnanci',
      path: '/kontakty',
      farba: '#37474F',
    },
    {
      id: 'podujatia',
      emoji: '📅',
      title: 'Podujatia',
      subtitle: 'Kalendár obecných akcií',
      path: '/podujatia',
      farba: C.brand.green,
    },
    {
      id: 'fc',
      emoji: '⚽',
      title: 'FC Výčapy-Opatovce',
      subtitle: 'Oblastná liga · Program, výsledky, káder',
      path: '/fc',
      farba: '#1B5E20',
    },
    {
      id: 'referentka',
      emoji: '🤖',
      title: 'AI Referentka Marta',
      subtitle: 'Online 24/7 · Odpovedá na otázky o obci',
      path: '/referentka',
      farba: '#6A1B9A',
    },
    {
      id: 'sluzby',
      emoji: '🏥',
      title: 'Služby v obci',
      subtitle: 'Lekár, lekáreň, pošta, fara, veterina',
      path: '/sluzby',
      farba: '#00838F',
    },
    {
      id: 'farske-oznamy',
      emoji: '⛪',
      title: 'Farské oznamy',
      subtitle: 'Omše, smútočné, ohlášky',
      path: '/farske-oznamy',
      farba: '#5D4037',
    },
    {
      id: 'okolie',
      emoji: '🌍',
      title: 'Voľný čas v okolí',
      subtitle: 'Cyklotrasy, výlety, kam s deťmi · do 50 km',
      path: '/okolie',
      farba: '#0277BD',
    },
    {
      id: 'cestovny-poriadok',
      emoji: '🚌',
      title: 'Cestovný poriadok',
      subtitle: 'Autobusy a vlaky cez obec',
      path: '/cestovny-poriadok',
      farba: '#F57F17',
    },
    {
      id: 'pocasie',
      emoji: '☁️',
      title: 'Počasie',
      subtitle: 'Predpoveď 7 dní + kvalita vzduchu',
      path: '/pocasie',
      farba: '#0277BD',
    },
    {
      id: 'meteo-stanice',
      emoji: '📡',
      title: 'Meteo stanice obce',
      subtitle: 'Kvalita vzduchu, teplota, vlhkosť v reálnom čase',
      path: '/meteo-stanice',
      farba: '#00838F',
    },
    {
      id: 'ankety',
      emoji: '🗳️',
      title: 'Ankety obce',
      subtitle: 'Hlasujte o dôležitých otázkach',
      path: '/ankety',
      farba: '#7B1FA2',
    },
    {
      id: 'hlasenie',
      emoji: '⚠️',
      title: 'Hlásenie porúch',
      subtitle: 'Nahláste problém v obci',
      path: '/hlasenie',
      farba: C.brand.red,
    },
    {
      id: 'senior',
      emoji: '👴',
      title: 'Senior mód',
      subtitle: 'Veľké písmo, jednoduché ovládanie',
      farba: '#5D4037',
      onPress: () => {
        Alert.alert(
          'Senior mód',
          'Zapnúť seniorský režim s veľkým písmom a zjednodušeným ovládaním?',
          [
            { text: 'Zrušiť', style: 'cancel' },
            { text: 'Zapnúť', onPress: () => router.push('/senior' as never) },
          ]
        )
      },
    },
    {
      id: 'starosta',
      emoji: '💡',
      title: 'Správa obce',
      subtitle: 'Smart obec — IoT a infraštruktúra',
      path: '/starosta-dashboard',
      farba: '#0D47A1',
    },
    {
      id: 'mapa',
      emoji: '🗺️',
      title: 'Mapa obce',
      subtitle: 'Osvetlenie, senzory, hlásenia na mape',
      path: '/mapa',
      farba: '#0D47A1',
    },
    {
      id: 'admin',
      emoji: '🔐',
      title: 'Admin panel',
      subtitle: 'Pre poverené osoby úradu',
      path: '/admin',
      farba: C.primaryDark,
    },
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <AppHeader title="Viac" subtitle="Všetky funkcie aplikácie" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.karta}
              activeOpacity={0.8}
              onPress={() => {
                if (item.onPress) item.onPress()
                else if (item.path) router.push(item.path as never)
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: item.farba + '18' }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tmavý režim prepínač */}
        <View style={styles.themeBox}>
          <Text style={styles.themeTitle}>🌓 Vzhľad aplikácie</Text>
          <View style={styles.themeRow}>
            {(['light', 'auto', 'dark'] as ThemeMode[]).map(m => {
              const labels = { light: '☀️ Svetlý', auto: '⚙️ Auto', dark: '🌙 Tmavý' }
              const active = mode === m
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.themeBtn, active && styles.themeBtnActive]}
                  onPress={() => setMode(m)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.themeBtnText, active && styles.themeBtnTextActive]}>
                    {labels[m]}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <Text style={styles.themeHint}>
            Aktuálne: {scheme === 'dark' ? 'Tmavý režim' : 'Svetlý režim'}
            {mode === 'auto' && ' (podľa systému)'}
          </Text>
        </View>

        <View style={styles.about}>
          <Text style={styles.aboutTitle}>O aplikácii</Text>
          <Text style={styles.aboutText}>
            Oficiálna aplikácia obce Výčapy-Opatovce. Slúži na komunikáciu obecného úradu
            s občanmi, hlásenie porúch, prehľad podujatí a aktualít.
          </Text>
          <Text style={styles.aboutVersion}>Verzia 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  content: { padding: 16, paddingBottom: 24 },
  grid: { gap: 10 },

  karta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    gap: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 26 },
  title: { fontSize: 16, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  chevron: { fontSize: 28, color: C.textPlaceholder, fontWeight: '300' },

  // Theme switcher
  themeBox: {
    marginTop: 24,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  themeTitle: {
    fontSize: 14, fontWeight: '800', color: C.text,
    marginBottom: 10,
  },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: {
    flex: 1, paddingVertical: 10,
    backgroundColor: C.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1, borderColor: 'transparent',
    alignItems: 'center',
  },
  themeBtnActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  themeBtnText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  themeBtnTextActive: { color: C.primary },
  themeHint: {
    fontSize: 11, color: C.textMuted,
    textAlign: 'center', marginTop: 8,
  },

  about: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  aboutTitle: {
    fontSize: 11, fontWeight: '800', color: C.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
  },
  aboutText: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },
  aboutVersion: { fontSize: 11, color: C.textPlaceholder, marginTop: 12 },
})
