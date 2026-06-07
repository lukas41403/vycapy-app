/**
 * "Viac" menu — všetky sekundárne obrazovky na jednom mieste.
 *
 * Zoznam kariet s ikonou a popisom. Admin a Správa obce sú vždy
 * zobrazené — autorizácia sa rieši až na cieľovej obrazovke.
 *
 * Ikony: jednotný <Icon> systém. Interakcie: PressableScale. Plne theme-aware.
 */

import { AppHeader } from '@/components/AppHeader'
import { Accordion, AtmosphereBackground, Counter, Icon, IconName, IconTile, PressableScale } from '@/components/ui'
import { C } from '@/constants/colors'
import { useTenant } from '@/src/config/tenant'
import { ThemeMode, useThemeMode } from '@/src/theme/ThemeContext'
import { fonts, radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type MenuItem = {
  id: string
  icon: IconName
  title: string
  subtitle?: string
  path?: string
  gradient: readonly [string, string, ...string[]]
  onPress?: () => void
}

const FAQ = [
  { q: 'Ako nahlásim problém v obci?', a: 'Na Domove cez „Nahlásiť podnet" alebo v menu „Hlásenie porúch". Priložte fotku a polohu — úrad podnet vidí okamžite a môžete sledovať jeho stav.' },
  { q: 'Ako funguje AI referentka Marta?', a: 'Marta odpovedá na otázky o obci 24/7 — úradné hodiny, vývoz odpadu, dokumenty, kontakty. Stačí sa opýtať bežnou rečou.' },
  { q: 'Odkiaľ sú aktuality a oznamy?', a: 'Synchronizujú sa automaticky z oficiálneho webu obce, takže sú vždy aktuálne bez duplicitnej práce úradu.' },
  { q: 'Kde nájdem úradné hodiny a kontakty?', a: 'V sekcii „Kontakty" — telefón, e-mail aj úradné hodiny obecného úradu. Volať môžete priamo z appky.' },
]

export default function ViacScreen() {
  const router = useRouter()
  const t = useThemeMode().colors
  const tenant = useTenant()
  const { mode, setMode, scheme } = useThemeMode()

  const items: MenuItem[] = [
    { id: 'prenajom',          icon: 'prenajom',   title: 'Prenájom haly',       subtitle: 'Rezervujte si športovú halu',                 path: '/prenajom',          gradient: C.gradients.gold },
    { id: 'kontakty',          icon: 'kontakty',   title: 'Kontakty',            subtitle: 'Obecný úrad a zamestnanci',                   path: '/kontakty',          gradient: C.gradients.slate },
    { id: 'podujatia',         icon: 'podujatia',  title: 'Podujatia',           subtitle: 'Kalendár obecných akcií',                     path: '/podujatia',         gradient: C.gradients.green },
    { id: 'fc',                icon: 'fc',         title: 'FC Výčapy-Opatovce',  subtitle: 'Oblastná liga · Program, výsledky, káder',    path: '/fc',                gradient: C.gradients.indigo },
    { id: 'referentka',        icon: 'marta',      title: 'AI Referentka Marta', subtitle: 'Online 24/7 · Odpovedá na otázky o obci',     path: '/referentka',        gradient: C.gradients.purple },
    { id: 'sluzby',            icon: 'sluzby',     title: 'Služby v obci',       subtitle: 'Lekár, lekáreň, pošta, fara, veterina',       path: '/sluzby',            gradient: C.gradients.teal },
    { id: 'farske-oznamy',     icon: 'farske',     title: 'Farské oznamy',       subtitle: 'Omše, smútočné, ohlášky',                     path: '/farske-oznamy',     gradient: C.gradients.brown },
    { id: 'okolie',            icon: 'okolie',     title: 'Voľný čas v okolí',   subtitle: 'Cyklotrasy, výlety, kam s deťmi · do 50 km',  path: '/okolie',            gradient: C.gradients.green },
    { id: 'cestovny-poriadok', icon: 'cestovny',   title: 'Cestovný poriadok',   subtitle: 'Autobusy a vlaky cez obec',                   path: '/cestovny-poriadok', gradient: C.gradients.orange },
    { id: 'pocasie',           icon: 'pocasie',    title: 'Počasie',             subtitle: 'Predpoveď 7 dní + kvalita vzduchu',           path: '/pocasie',           gradient: C.gradients.blue },
    { id: 'meteo-stanice',     icon: 'meteo',      title: 'Meteo stanice obce',  subtitle: 'Kvalita vzduchu, teplota, vlhkosť v reálnom čase', path: '/meteo-stanice',  gradient: C.gradients.teal },
    { id: 'ankety',            icon: 'ankety',     title: 'Ankety obce',         subtitle: 'Hlasujte o dôležitých otázkach',              path: '/ankety',            gradient: C.gradients.pink },
    { id: 'hlasenie',          icon: 'hlasenie',   title: 'Hlásenie porúch',     subtitle: 'Nahláste problém v obci',                     path: '/hlasenie',          gradient: C.gradients.red },
    {
      id: 'senior', icon: 'senior', title: 'Senior mód', subtitle: 'Veľké písmo, jednoduché ovládanie', gradient: C.gradients.brown,
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
    { id: 'starosta', icon: 'spravaObce', title: 'Správa obce',  subtitle: 'Smart obec — IoT a infraštruktúra',     path: '/starosta-dashboard', gradient: C.gradients.indigo },
    { id: 'mapa',     icon: 'mapa',       title: 'Mapa obce',    subtitle: 'Osvetlenie, senzory, hlásenia na mape', path: '/mapa',               gradient: C.gradients.blue },
    { id: 'admin',    icon: 'admin',      title: 'Admin panel',  subtitle: 'Pre poverené osoby úradu',              path: '/admin',              gradient: C.gradients.slate },
  ]

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top']}>
      <AtmosphereBackground />
      <AppHeader title="Viac" subtitle="Všetky funkcie aplikácie" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {items.map(item => (
            <PressableScale
              key={item.id}
              style={[styles.karta, { backgroundColor: t.surface, shadowColor: t.shadow }]}
              onPress={() => {
                if (item.onPress) item.onPress()
                else if (item.path) router.push(item.path as never)
              }}
              accessibilityLabel={item.title}
            >
              <IconTile name={item.icon} gradient={item.gradient} size={48} iconSize={24} glow />
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: t.text }]}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={[styles.subtitle, { color: t.textMuted }]} numberOfLines={1}>{item.subtitle}</Text>
                )}
              </View>
              <Icon name="chevron" size={20} color={t.textPlaceholder} />
            </PressableScale>
          ))}
        </View>

        {/* Vzhľad aplikácie — prepínač témy */}
        <View style={[styles.themeBox, { backgroundColor: t.surface, shadowColor: t.shadow }]}>
          <Text style={[styles.themeTitle, { color: t.text }]}>Vzhľad aplikácie</Text>
          <View style={styles.themeRow}>
            {(['light', 'auto', 'dark'] as ThemeMode[]).map(m => {
              const meta: Record<ThemeMode, { label: string; icon: IconName }> = {
                light: { label: 'Svetlý', icon: 'sun' },
                auto:  { label: 'Auto',   icon: 'settings' },
                dark:  { label: 'Tmavý',  icon: 'moon' },
              }
              const active = mode === m
              return (
                <PressableScale
                  key={m}
                  style={[
                    styles.themeBtn,
                    { backgroundColor: t.surfaceAlt, borderColor: 'transparent' },
                    active && { backgroundColor: t.primaryLight, borderColor: t.primary },
                  ]}
                  scaleTo={0.95}
                  onPress={() => setMode(m)}
                  accessibilityLabel={`Vzhľad: ${meta[m].label}`}
                >
                  <Icon name={meta[m].icon} size={18} color={active ? t.primary : t.textSecondary} />
                  <Text style={[styles.themeBtnText, { color: active ? t.primary : t.textSecondary }]}>
                    {meta[m].label}
                  </Text>
                </PressableScale>
              )
            })}
          </View>
          <Text style={[styles.themeHint, { color: t.textMuted }]}>
            Aktuálne: {scheme === 'dark' ? 'Tmavý režim' : 'Svetlý režim'}
            {mode === 'auto' && ' (podľa systému)'}
          </Text>
        </View>

        {/* Obec v číslach — animované počítadlá */}
        <View style={[styles.statsCard, { backgroundColor: t.surface, shadowColor: t.shadow }]}>
          <View style={styles.statCell}>
            <Counter value={tenant.pocetObyvatelov ?? 1900} style={[styles.statNum, { color: t.primary }]} />
            <Text style={[styles.statLabel, { color: t.textMuted }]}>Obyvateľov</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.borderLight }]} />
          <View style={styles.statCell}>
            <Counter value={items.length} style={[styles.statNum, { color: t.primary }]} />
            <Text style={[styles.statLabel, { color: t.textMuted }]}>Funkcií</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: t.borderLight }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: t.primary }]}>24/7</Text>
            <Text style={[styles.statLabel, { color: t.textMuted }]}>AI podpora</Text>
          </View>
        </View>

        {/* Časté otázky — accordion */}
        <Text style={[styles.faqHeading, { color: t.text }]}>Časté otázky</Text>
        {FAQ.map((f, i) => (
          <Accordion key={i} title={f.q} icon="info" defaultOpen={i === 0}>
            {f.a}
          </Accordion>
        ))}

        <View style={styles.about}>
          <Text style={[styles.aboutTitle, { color: t.textMuted }]}>O aplikácii</Text>
          <Text style={[styles.aboutText, { color: t.textSecondary }]}>
            Oficiálna aplikácia obce Výčapy-Opatovce. Slúži na komunikáciu obecného úradu
            s občanmi, hlásenie porúch, prehľad podujatí a aktualít.
          </Text>
          <Text style={[styles.aboutVersion, { color: t.textPlaceholder }]}>Verzia 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  grid: { gap: spacing.sm },

  karta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { ...typo.h3 },
  subtitle: { ...typo.caption, marginTop: 2 },

  // Theme switcher
  themeBox: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  themeTitle: { ...typo.bodyB, marginBottom: spacing.md },
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  themeBtnText: { fontSize: 13, fontWeight: '700' },
  themeHint: { ...typo.micro, textAlign: 'center', marginTop: spacing.md },

  // Obec v číslach
  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.xl, borderRadius: radius.lg, padding: spacing.lg,
    ...shadows.sm,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.5 },
  statLabel: { ...typo.micro, textTransform: 'uppercase', letterSpacing: 0.6 },
  statDivider: { width: 1, height: 34 },

  // FAQ
  faqHeading: { ...typo.h1, marginTop: spacing.xl, marginBottom: spacing.md },

  about: { marginTop: spacing.xl, paddingHorizontal: spacing.xs },
  aboutTitle: { ...typo.label, marginBottom: spacing.sm },
  aboutText: { ...typo.caption, lineHeight: 19 },
  aboutVersion: { ...typo.micro, marginTop: spacing.md },
})
