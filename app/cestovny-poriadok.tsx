/**
 * Cestovný poriadok — odkazy na PDF cestovných poriadkov obce.
 *
 * Obec Výčapy-Opatovce má 3 PDF cestovné poriadky:
 *   - Autobus Nitra – Lefantovce
 *   - Autobus Nitra – Topoľčany
 *   - Vlak Nové Zámky – Prievidza (cez Výčapy-Opatovce)
 *
 * Linky sú v tenant configu — pre inú obec stačí ich vymeniť.
 */

import { AppHeader } from '@/components/AppHeader'
import { Card } from '@/components/ui'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, spacing, typo } from '@/src/theme/tokens'
import * as WebBrowser from 'expo-web-browser'
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type Spoj = {
  id: string
  typ: 'autobus' | 'vlak'
  smer: string
  popis: string
  trasa: string
  pdfUrl: string
  platnost?: string
}

// Reálne PDF linky zo stránky obce Výčapy-Opatovce (web fetched máj 2026)
const SPOJE: Spoj[] = [
  {
    id: 'bus-lefantovce',
    typ: 'autobus',
    smer: 'Nitra – Lefantovce',
    popis: 'Linka cez Výčapy-Opatovce',
    trasa: 'Lefantovce → Výčapy-Opatovce → Nitra (autobusová stanica)',
    pdfUrl: 'https://www.vycapy-opatovce.sk/download_file_f.php?id=2335749',
    platnost: 'Platné od 14. 12. 2025',
  },
  {
    id: 'bus-topolcany',
    typ: 'autobus',
    smer: 'Nitra – Topoľčany',
    popis: 'Linka cez Výčapy-Opatovce',
    trasa: 'Topoľčany → Výčapy-Opatovce → Nitra',
    pdfUrl: 'https://www.vycapy-opatovce.sk/download_file_f.php?id=2335748',
    platnost: 'Platné od 14. 12. 2025',
  },
  {
    id: 'vlak',
    typ: 'vlak',
    smer: 'Nové Zámky – Prievidza',
    popis: 'Vlakové spojenie cez región',
    trasa: 'Nové Zámky → Nitra → Topoľčany → Prievidza',
    pdfUrl: 'https://www.vycapy-opatovce.sk/download_file_f.php?id=2330594',
    platnost: 'Platné od 14. 12. 2025',
  },
]

export default function CestovnyPoriadokScreen() {
  const t = useThemeColors()

  async function otvorPdf(url: string) {
    try {
      await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET })
    } catch {
      // Fallback — open default browser
      Linking.openURL(url)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.surface} />
      <AppHeader title="Cestovný poriadok" subtitle="Autobusy a vlaky cez obec" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: t.surfaceAlt, borderLeftColor: t.primary }]}>
          <Text style={[styles.infoText, { color: t.textSecondary }]}>
            ℹ️ Cestovné poriadky sa otvoria ako PDF v prehliadači. Otvorené aj offline ak ich
            stiahnete a uložíte.
          </Text>
        </View>

        {/* Spoje */}
        <View style={{ gap: spacing.md }}>
          {SPOJE.map(s => (
            <TouchableOpacity
              key={s.id}
              onPress={() => otvorPdf(s.pdfUrl)}
              activeOpacity={0.85}
            >
              <Card padding={0}>
                <View style={styles.spojRow}>
                  <View style={[
                    styles.spojIconBox,
                    { backgroundColor: s.typ === 'autobus' ? '#FFF3E0' : '#E3F2FD' },
                  ]}>
                    <Text style={styles.spojIcon}>
                      {s.typ === 'autobus' ? '🚌' : '🚆'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.spojSmer, { color: t.text }]} numberOfLines={1}>
                      {s.smer}
                    </Text>
                    <Text style={[styles.spojTrasa, { color: t.textSecondary }]} numberOfLines={2}>
                      {s.trasa}
                    </Text>
                    {s.platnost && (
                      <Text style={[styles.spojPlatnost, { color: t.textMuted }]}>
                        {s.platnost}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.pdfBadge, { backgroundColor: t.primary }]}>
                    <Text style={styles.pdfBadgeText}>PDF</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Užitočné odkazy */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={[styles.sectionLabel, { color: t.textMuted }]}>
            UŽITOČNÉ ODKAZY
          </Text>
          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: t.surface }]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('https://cp.hnonline.sk/vlakbusmhd/spojenie/')}
          >
            <Text style={styles.linkEmoji}>🔍</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkTitle, { color: t.text }]}>
                Vyhľadávač spojení (cp.hnonline.sk)
              </Text>
              <Text style={[styles.linkSub, { color: t.textMuted }]}>
                Aktuálne spojenia autobus, vlak, MHD
              </Text>
            </View>
            <Text style={[styles.linkChev, { color: t.textPlaceholder }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: t.surface }]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('https://www.zsr.sk')}
          >
            <Text style={styles.linkEmoji}>🚆</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkTitle, { color: t.text }]}>
                ZSSK — Železničná spoločnosť
              </Text>
              <Text style={[styles.linkSub, { color: t.textMuted }]}>
                Rezervácie, ceny, výluky
              </Text>
            </View>
            <Text style={[styles.linkChev, { color: t.textPlaceholder }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: t.surface }]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('https://imhd.sk/nr')}
          >
            <Text style={styles.linkEmoji}>🚌</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkTitle, { color: t.text }]}>
                MHD Nitra (imhd.sk)
              </Text>
              <Text style={[styles.linkSub, { color: t.textMuted }]}>
                Mestská hromadná doprava Nitra
              </Text>
            </View>
            <Text style={[styles.linkChev, { color: t.textPlaceholder }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: t.textPlaceholder }]}>
          Zdroj: oficiálna stránka obce · www.vycapy-opatovce.sk
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },

  infoBox: {
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: { ...typo.caption, lineHeight: 19 },

  // Spoj karta
  spojRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  spojIconBox: {
    width: 52, height: 52, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  spojIcon: { fontSize: 28 },
  spojSmer: { ...typo.h3 },
  spojTrasa: { ...typo.caption, marginTop: 2 },
  spojPlatnost: { ...typo.micro, marginTop: 4 },
  pdfBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  pdfBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  // Sekcia užitočné
  sectionLabel: { ...typo.label, marginBottom: spacing.sm },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  linkEmoji: { fontSize: 24 },
  linkTitle: { ...typo.bodyB },
  linkSub: { ...typo.caption, marginTop: 2 },
  linkChev: { fontSize: 24, fontWeight: '300' },

  footer: {
    ...typo.micro,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
})
