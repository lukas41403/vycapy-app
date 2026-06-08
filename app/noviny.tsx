/**
 * Život obce — archív PDF novín obce.
 *
 * Občan vidí karty pre každé číslo: titulná stránka (ak je k dispozícii),
 * názov, dátum, počet strán. Klik → otvorí PDF v prehliadači cez expo-web-browser.
 *
 * Pre seniorov silná funkcia — môžu si prečítať noviny aj keď im papier zmizol.
 */

import { AppHeader } from '@/components/AppHeader'
import { Card, EmptyState } from '@/components/ui'
import { ObecneNoviny, useTenant } from '@/src/config/tenant'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { Image } from 'expo-image'
import * as WebBrowser from 'expo-web-browser'
import { useMemo } from 'react'
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

function formatDatum(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NovinyScreen() {
  const t = useThemeColors()
  const tenant = useTenant()
  const noviny = tenant.obecneNoviny ?? []

  // Zoskupené podľa roku, najnovšie hore
  const skupiny = useMemo(() => {
    const map = new Map<number, ObecneNoviny[]>()
    noviny.forEach(n => {
      if (!map.has(n.rok)) map.set(n.rok, [])
      map.get(n.rok)!.push(n)
    })
    // Zoraď roky DESC, čísla v rámci roka DESC
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([rok, items]) => ({
        rok,
        items: items.sort((a, b) => b.cislo - a.cislo),
      }))
  }, [noviny])

  async function otvorPdf(noviny: ObecneNoviny) {
    try {
      await WebBrowser.openBrowserAsync(noviny.pdfUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      })
    } catch {
      Linking.openURL(noviny.pdfUrl)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.surface} />
      <AppHeader title="📰 Život obce" subtitle="Archív obecných novín" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {noviny.length === 0 ? (
          <EmptyState
            icon="📰"
            title="Žiadne čísla zatiaľ"
            description="Obecné noviny budú v archíve čoskoro. Najprv ich obec musí pridať do systému."
          />
        ) : (
          <>
            {/* Najnovšie číslo prominentne */}
            {skupiny[0]?.items[0] && (
              <View style={{ marginBottom: spacing.xl }}>
                <Text style={[styles.sectionLabel, { color: t.textMuted }]}>
                  NAJNOVŠIE VYDANIE
                </Text>
                <TouchableOpacity
                  style={[styles.featuredCard, { backgroundColor: t.surface, shadowColor: t.shadow }]}
                  activeOpacity={0.85}
                  onPress={() => otvorPdf(skupiny[0].items[0])}
                >
                  {skupiny[0].items[0].coverUrl ? (
                    <Image
                      source={{ uri: skupiny[0].items[0].coverUrl }}
                      style={styles.featuredCover}
                      contentFit="cover"
                      transition={250}
                    />
                  ) : (
                    <View style={[styles.featuredCover, styles.featuredCoverPlaceholder, { backgroundColor: t.primary }]}>
                      <Text style={styles.featuredCoverEmoji}>📰</Text>
                      <Text style={styles.featuredCoverYear}>
                        {skupiny[0].items[0].rok}
                      </Text>
                    </View>
                  )}
                  <View style={styles.featuredInfo}>
                    <Text style={[styles.featuredTitle, { color: t.text }]} numberOfLines={2}>
                      {skupiny[0].items[0].nazov ?? `Číslo ${skupiny[0].items[0].cislo}/${skupiny[0].items[0].rok}`}
                    </Text>
                    <Text style={[styles.featuredDatum, { color: t.textMuted }]}>
                      {formatDatum(skupiny[0].items[0].datum)}
                    </Text>
                    {skupiny[0].items[0].pocetStran && (
                      <Text style={[styles.featuredMeta, { color: t.textMuted }]}>
                        📄 {skupiny[0].items[0].pocetStran} strán
                      </Text>
                    )}
                    <View style={[styles.openPdfBtn, { backgroundColor: t.primary }]}>
                      <Text style={styles.openPdfBtnText}>📄 Otvoriť PDF</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Archív podľa roku */}
            {skupiny.map(({ rok, items }, ri) => {
              // Prvé číslo už ukazujeme prominentne — preskočíme
              const archivItems = ri === 0 ? items.slice(1) : items
              if (archivItems.length === 0) return null
              return (
                <View key={rok} style={{ marginBottom: spacing.xl }}>
                  <Text style={[styles.sectionLabel, { color: t.textMuted }]}>
                    {ri === 0 ? 'STARŠIE ČÍSLA' : `ROK ${rok}`}
                  </Text>
                  <View style={{ gap: spacing.md }}>
                    {archivItems.map(item => (
                      <Card
                        key={item.id}
                        onPress={() => otvorPdf(item)}
                        padding={0}
                      >
                        <View style={styles.itemRow}>
                          <View style={[styles.itemThumb, { backgroundColor: t.primaryLight }]}>
                            <Text style={[styles.itemThumbEmoji, { color: t.primary }]}>📰</Text>
                            <Text style={[styles.itemThumbYear, { color: t.primary }]}>{rok}</Text>
                          </View>
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={[styles.itemTitle, { color: t.text }]} numberOfLines={2}>
                              {item.nazov ?? `Číslo ${item.cislo}/${item.rok}`}
                            </Text>
                            <Text style={[styles.itemDatum, { color: t.textMuted }]}>
                              {formatDatum(item.datum)}
                              {item.pocetStran ? ` · ${item.pocetStran} strán` : ''}
                            </Text>
                          </View>
                          <Text style={[styles.itemChevron, { color: t.primary }]}>›</Text>
                        </View>
                      </Card>
                    ))}
                  </View>
                </View>
              )
            })}

            <Text style={[styles.footer, { color: t.textPlaceholder }]}>
              Archív obsahuje vydania ŽIVOTA OBCE. Tlačené verzie sú k dispozícii na obecnom úrade.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },

  sectionLabel: { ...typo.label, marginBottom: spacing.sm },

  // Featured (najnovšie číslo)
  featuredCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  featuredCover: { width: 110, height: 160 },
  featuredCoverPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  featuredCoverEmoji: { fontSize: 36, color: '#FFFFFF' },
  featuredCoverYear: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 4 },
  featuredInfo: { flex: 1, padding: spacing.md, gap: 4 },
  featuredTitle: { ...typo.h3 },
  featuredDatum: { ...typo.caption, fontWeight: '600' },
  featuredMeta: { ...typo.micro, marginTop: 2 },
  openPdfBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  openPdfBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // Archive item
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  itemThumb: {
    width: 50, height: 50, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  itemThumbEmoji: { fontSize: 20 },
  itemThumbYear: { fontSize: 10, fontWeight: '900' },
  itemTitle: { ...typo.h3 },
  itemDatum: { ...typo.caption, fontWeight: '600' },
  itemChevron: { fontSize: 24, fontWeight: '300' },

  footer: { ...typo.micro, textAlign: 'center', marginTop: spacing.lg },
})
