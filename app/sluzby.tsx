/**
 * Služby v obci — zoznam.
 *
 * Zoskupené karty pre:
 *   - Zdravotníctvo (zdravotnícke stredisko, lekáreň)
 *   - Pošta
 *   - Veterina
 *   - Farský úrad
 *
 * Pošta nemá admin prístup — všetko ide cez obec. Občania ich môžu volať.
 * Tu vidia hodiny, vedenie, špeciálne akcie ("Podržanie zásielky" pre poštu).
 */

import { AppHeader } from '@/components/AppHeader'
import { Badge, Card, SectionHeader } from '@/components/ui'
import { Sluzba, useTenant } from '@/src/config/tenant'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const KATEGORIA_LABEL: Record<string, string> = {
  zdravotnictvo: 'Zdravotníctvo',
  lekaren: 'Zdravotníctvo',
  veterina: 'Veterina',
  posta: 'Pošta',
  farsky: 'Cirkev',
  iny: 'Ostatné',
}

const KATEGORIA_BADGE_TONE: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent'> = {
  zdravotnictvo: 'info',
  lekaren: 'success',
  veterina: 'accent',
  posta: 'warning',
  farsky: 'neutral',
}

/** Vráti True ak je služba teraz otvorená (parse hodín). */
function jeOtvorene(s: Sluzba): boolean {
  const hodiny = s.hodiny
  if (!hodiny) {
    // Ak ide o zdravotnícke stredisko, vezmeme prvého ordinanta
    if (s.ordinanti && s.ordinanti.length > 0) {
      const dni = ['nedela','pondelok','utorok','streda','stvrtok','piatok','sobota'] as const
      const today = dni[new Date().getDay()]
      return s.ordinanti.some(o => {
        const rec = o.ordinacneHodiny.find(h => h.den === today)
        if (!rec?.hodiny) return false
        return parseAOverit(rec.hodiny)
      })
    }
    return false
  }
  const dni = ['nedela','pondelok','utorok','streda','stvrtok','piatok','sobota'] as const
  const today = dni[new Date().getDay()]
  const rec = hodiny.find(h => h.den === today)
  if (!rec?.hodiny) return false
  return parseAOverit(rec.hodiny)
}

function parseAOverit(hodinyStr: string): boolean {
  // Podporuje viaceré segmenty "7:15-12:00 | 12:30-14:30"
  const segmenty = hodinyStr.split('|').map(s => s.trim())
  const now = new Date().getHours() * 60 + new Date().getMinutes()
  for (const seg of segmenty) {
    const m = seg.match(/(\d{1,2})[:.](\d{2})\s*[–-]\s*(\d{1,2})[:.](\d{2})/)
    if (m) {
      const start = Number(m[1]) * 60 + Number(m[2])
      const end   = Number(m[3]) * 60 + Number(m[4])
      if (now >= start && now < end) return true
    }
  }
  return false
}

export default function SluzbyScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()

  const skupiny = useMemo(() => {
    const zdravie = tenant.sluzby.filter(s => s.kategoria === 'zdravotnictvo' || s.kategoria === 'lekaren')
    const ostatne = tenant.sluzby.filter(s =>
      s.kategoria !== 'zdravotnictvo' && s.kategoria !== 'lekaren'
    )
    return { zdravie, ostatne }
  }, [tenant.sluzby])

  function renderKarta(s: Sluzba) {
    const otvorene = jeOtvorene(s)
    return (
      <Card
        key={s.id}
        onPress={() => router.push(`/sluzba/${s.id}` as never)}
        padding={0}
      >
        <View style={styles.kartaObsah}>
          <View style={styles.ikonaBox}>
            <Text style={styles.ikona}>{s.emoji}</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.kartaTop}>
              <Badge
                label={KATEGORIA_LABEL[s.kategoria] ?? s.kategoria}
                tone={KATEGORIA_BADGE_TONE[s.kategoria] ?? 'neutral'}
              />
              <View style={[
                styles.statusPill,
                { backgroundColor: otvorene ? '#E8F5E9' : '#FFEBEE' },
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: otvorene ? '#2E7D32' : '#C62828' },
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: otvorene ? '#1B5E20' : '#8E1F1F' },
                ]}>
                  {otvorene ? 'Otvorené' : 'Zatvorené'}
                </Text>
              </View>
            </View>
            <Text style={[styles.nazov, { color: t.text }]} numberOfLines={1}>
              {s.nazov}
            </Text>
            {s.podtitul && (
              <Text style={[styles.podtitul, { color: t.textMuted }]} numberOfLines={2}>
                {s.podtitul}
              </Text>
            )}
            {s.adresa && (
              <Text style={[styles.adresa, { color: t.textPlaceholder }]} numberOfLines={1}>
                📍 {s.adresa}
              </Text>
            )}
          </View>
          <Text style={[styles.chevron, { color: t.textPlaceholder }]}>›</Text>
        </View>
      </Card>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.surface} />
      <AppHeader title="Služby v obci" subtitle="Lekár, lekáreň, pošta, fara, vet" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: t.surfaceAlt, borderLeftColor: t.primary }]}>
          <Text style={[styles.infoText, { color: t.textSecondary }]}>
            ℹ️ Tu nájdete kontakty a otváracie hodiny všetkých služieb v obci.
            Klepnutím otvoríte detail, kde môžete priamo zavolať.
          </Text>
        </View>

        {/* Zdravotníctvo */}
        {skupiny.zdravie.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="🏥 Zdravotníctvo" />
            <View style={{ gap: spacing.md }}>
              {skupiny.zdravie.map(renderKarta)}
            </View>
          </View>
        )}

        {/* Ostatné — pošta, fara, vet */}
        {skupiny.ostatne.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="📋 Ďalšie služby" />
            <View style={{ gap: spacing.md }}>
              {skupiny.ostatne.map(renderKarta)}
            </View>
          </View>
        )}

        {/* CTA: Farské oznamy ako samostatný odkaz */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.farskyCta, { backgroundColor: t.surface, borderColor: t.primary }]}
            activeOpacity={0.85}
            onPress={() => router.push('/farske-oznamy' as never)}
            accessibilityRole="button"
            accessibilityLabel="Farské oznamy — omše, smútočné oznamy"
          >
            <Text style={styles.farskyEmoji}>⛪</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.farskyTitle, { color: t.text }]}>Farské oznamy</Text>
              <Text style={[styles.farskySub, { color: t.textMuted }]}>
                Aktuálne omše, smútočné oznamy, ohlášky
              </Text>
            </View>
            <Text style={[styles.chevron, { color: t.primary }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },

  // Info box hore
  infoBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    marginBottom: spacing.lg,
  },
  infoText: { ...typo.caption, lineHeight: 19 },

  section: { marginBottom: spacing.xl },

  // Karta služby
  kartaObsah: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  ikonaBox: {
    width: 56, height: 56,
    borderRadius: radius.md,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  ikona: { fontSize: 30 },
  kartaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  nazov: { ...typo.h3 },
  podtitul: { ...typo.caption },
  adresa: { ...typo.micro },
  chevron: { fontSize: 28, fontWeight: '300' },

  // Farské oznamy CTA
  farskyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    ...shadows.sm,
  },
  farskyEmoji: { fontSize: 36 },
  farskyTitle: { ...typo.h3 },
  farskySub: { ...typo.caption, marginTop: 2 },
})
