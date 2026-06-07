/**
 * Detail služby — kontakt, hodiny, špeciálne akcie.
 *
 * Pre Zdravotnícke stredisko zobrazí zoznam lekárov, každý s vlastným
 * rozvrhom a tlačidlom "Zavolať lekárovi".
 *
 * Pre Poštu zobrazí špeciálnu akciu "Podržanie zásielky" s návodom čo
 * povedať pri telefonáte.
 */

import { AtmosphereBackground, Badge, Button, Card, Icon, IconName, PressableScale, SectionHeader } from '@/components/ui'
import { Ordinant, SluzbaAkcia, useTenant } from '@/src/config/tenant'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SLUZBA_ICON: Record<string, IconName> = {
  zdravotnictvo: 'sluzby', lekaren: 'sluzby', farsky: 'farske', veterina: 'leaf', posta: 'document', iny: 'sluzby',
}
const sluzbaIcon = (kat: string): IconName => SLUZBA_ICON[kat] ?? 'sluzby'

const DEN_LABEL: Record<string, string> = {
  pondelok: 'Pondelok', utorok: 'Utorok', streda: 'Streda',
  stvrtok: 'Štvrtok', piatok: 'Piatok', sobota: 'Sobota', nedela: 'Nedeľa',
}

function formatTel(t: string): string {
  const c = t.replace(/\D/g, '')
  if (c.length === 9 && c.startsWith('0')) return c.replace(/(\d{4})(\d{3})(\d{2,3})/, '$1 $2 $3')
  if (c.startsWith('037')) return c.replace(/(\d{3})(\d{2})(\d{3})(\d{2})?/, '$1 / $2 $3 $4').trim()
  if (c.length === 3) return c
  return t
}

function dnesnyDen(): string {
  const dni = ['nedela','pondelok','utorok','streda','stvrtok','piatok','sobota']
  return dni[new Date().getDay()]
}

export default function SluzbaDetailScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()
  const { id } = useLocalSearchParams<{ id: string }>()

  const sluzba = useMemo(() => tenant.sluzby.find(s => s.id === id), [tenant.sluzby, id])
  const dnes = dnesnyDen()

  if (!sluzba) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top']}>
        <View style={styles.notFoundBox}>
          <Icon name="search" size={48} color={t.textMuted} />
          <Text style={[styles.notFoundTitle, { color: t.text }]}>Služba neexistuje</Text>
          <Button title="Späť" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    )
  }

  function zavolatTel(tel: string, meno?: string) {
    Alert.alert(
      'Zavolať?',
      `${meno ?? sluzba!.nazov}\n${formatTel(tel)}`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        { text: 'Zavolať', onPress: () => Linking.openURL(`tel:${tel}`) },
      ],
    )
  }

  function vykonajAkciu(a: SluzbaAkcia) {
    if (a.typ === 'tel') {
      // Ak má popis — ukáž návod predtým
      if (a.popis) {
        Alert.alert(
          a.label,
          a.popis + `\n\n📞 ${formatTel(a.hodnota)}`,
          [
            { text: 'Zrušiť', style: 'cancel' },
            { text: 'Zavolať', onPress: () => Linking.openURL(`tel:${a.hodnota}`) },
          ],
        )
      } else {
        zavolatTel(a.hodnota)
      }
    } else if (a.typ === 'mail') {
      Linking.openURL(`mailto:${a.hodnota}`)
    } else if (a.typ === 'web') {
      Linking.openURL(a.hodnota)
    } else {
      Alert.alert(a.label, a.popis ?? a.hodnota)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.primary }]}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn} scaleTo={0.94} accessibilityLabel="Späť">
          <Icon name="chevronBack" size={20} color="#FFFFFF" /><Text style={styles.backText}>Späť</Text>
        </PressableScale>
        <View style={styles.headerRow}>
          <View style={styles.headerIconBox}>
            <Icon name={sluzbaIcon(sluzba.kategoria)} size={28} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{sluzba.nazov}</Text>
            {sluzba.podtitul && <Text style={styles.headerSub}>{sluzba.podtitul}</Text>}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Kontakty box */}
        {(sluzba.adresa || sluzba.telefon || sluzba.mobil || sluzba.email || sluzba.web || sluzba.vedenie) && (
          <Card style={{ marginBottom: spacing.lg }}>
            {sluzba.vedenie && (
              <Text style={[styles.vedenie, { color: t.textSecondary }]}>
                {sluzba.vedenie}
              </Text>
            )}
            {sluzba.adresa && (
              <View style={styles.kontaktRow}>
                <Icon name="location" size={18} color={t.textMuted} />
                <Text style={[styles.kontaktText, { color: t.text }]}>{sluzba.adresa}</Text>
              </View>
            )}
            {sluzba.telefon && (
              <PressableScale style={styles.kontaktRow} scaleTo={0.98} onPress={() => zavolatTel(sluzba.telefon!)} accessibilityLabel={`Zavolať ${formatTel(sluzba.telefon)}`}>
                <Icon name="kontakty" size={18} color={t.primary} />
                <Text style={[styles.kontaktText, styles.kontaktLink, { color: t.primary }]}>{formatTel(sluzba.telefon)}</Text>
              </PressableScale>
            )}
            {sluzba.mobil && (
              <PressableScale style={styles.kontaktRow} scaleTo={0.98} onPress={() => zavolatTel(sluzba.mobil!)} accessibilityLabel={`Zavolať mobil ${formatTel(sluzba.mobil)}`}>
                <Icon name="phonePortrait" size={18} color={t.primary} />
                <Text style={[styles.kontaktText, styles.kontaktLink, { color: t.primary }]}>{formatTel(sluzba.mobil)}</Text>
              </PressableScale>
            )}
            {sluzba.email && (
              <PressableScale style={styles.kontaktRow} scaleTo={0.98} onPress={() => Linking.openURL(`mailto:${sluzba.email}`)} accessibilityLabel="E-mail">
                <Icon name="mail" size={18} color={t.primary} />
                <Text style={[styles.kontaktText, styles.kontaktLink, { color: t.primary }]}>{sluzba.email}</Text>
              </PressableScale>
            )}
            {sluzba.web && (
              <PressableScale style={styles.kontaktRow} scaleTo={0.98} onPress={() => Linking.openURL(sluzba.web!)} accessibilityLabel="Web">
                <Icon name="globe" size={18} color={t.primary} />
                <Text style={[styles.kontaktText, styles.kontaktLink, { color: t.primary }]} numberOfLines={1}>{sluzba.web.replace(/^https?:\/\//, '')}</Text>
              </PressableScale>
            )}
            {sluzba.facebook && (
              <PressableScale style={styles.kontaktRow} scaleTo={0.98} onPress={() => Linking.openURL(sluzba.facebook!)} accessibilityLabel="Facebook">
                <Icon name="globe" size={18} color={t.primary} />
                <Text style={[styles.kontaktText, styles.kontaktLink, { color: t.primary }]}>Facebook stránka</Text>
              </PressableScale>
            )}
          </Card>
        )}

        {/* Špeciálne akcie — pre Poštu "Podržanie zásielky" */}
        {sluzba.akcie && sluzba.akcie.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Rýchle akcie" />
            <View style={{ gap: spacing.sm }}>
              {sluzba.akcie.map(a => {
                const aIcon: IconName = a.typ === 'tel' ? 'kontakty' : a.typ === 'mail' ? 'mail' : a.typ === 'web' ? 'globe' : 'flash'
                return (
                  <PressableScale
                    key={a.id}
                    style={[styles.akciaCard, { backgroundColor: t.surface, shadowColor: t.shadow }]}
                    scaleTo={0.98}
                    onPress={() => vykonajAkciu(a)}
                    accessibilityLabel={a.label}
                  >
                    <View style={[styles.akciaIconBox, { backgroundColor: t.primaryLight }]}>
                      <Icon name={aIcon} size={20} color={t.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.akciaLabel, { color: t.text }]}>{a.label}</Text>
                      {a.popis && (
                        <Text style={[styles.akciaPopis, { color: t.textMuted }]} numberOfLines={2}>{a.popis}</Text>
                      )}
                    </View>
                    <Icon name="chevron" size={20} color={t.textPlaceholder} />
                  </PressableScale>
                )
              })}
            </View>
          </View>
        )}

        {/* Otváracie hodiny */}
        {sluzba.hodiny && sluzba.hodiny.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Otváracie hodiny" />
            <Card padding={0}>
              {sluzba.hodiny.map((h, i) => {
                const jeDnes = h.den === dnes
                return (
                  <View
                    key={h.den}
                    style={[
                      styles.hodinyRow,
                      jeDnes && { backgroundColor: t.primaryLight },
                      i < sluzba.hodiny!.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.borderLight },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.hodinyDen,
                        { color: jeDnes ? t.primary : t.text, fontWeight: jeDnes ? '900' : '700' },
                      ]}>
                        {DEN_LABEL[h.den]}{jeDnes ? ' · DNES' : ''}
                      </Text>
                      {h.poznamka && (
                        <Text style={[styles.hodinyPoznamka, { color: t.textMuted }]}>
                          {h.poznamka}
                        </Text>
                      )}
                    </View>
                    <Text style={[
                      styles.hodinyCas,
                      { color: h.hodiny ? (jeDnes ? t.primary : t.text) : t.textPlaceholder },
                    ]}>
                      {h.hodiny ?? 'Zatvorené'}
                    </Text>
                  </View>
                )
              })}
            </Card>
          </View>
        )}

        {/* Ordinanti (lekári) */}
        {sluzba.ordinanti && sluzba.ordinanti.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <SectionHeader title="Lekári a špecialisti" />
            <View style={{ gap: spacing.md }}>
              {sluzba.ordinanti.map(o => (
                <LekarKarta
                  key={o.id}
                  lekar={o}
                  dnes={dnes}
                  onCall={(tel) => zavolatTel(tel, o.meno)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Poznámka */}
        {sluzba.poznamka && (
          <View style={[styles.poznamkaBox, { backgroundColor: t.surfaceAlt, borderLeftColor: t.primary }]}>
            <Icon name="info" size={16} color={t.primary} />
            <Text style={[styles.poznamkaText, { color: t.textSecondary }]}>{sluzba.poznamka}</Text>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Karta lekára ─────────────────────────────────────────────────────────
function LekarKarta({
  lekar, dnes, onCall,
}: {
  lekar: Ordinant
  dnes: string
  onCall: (tel: string) => void
}) {
  const t = useThemeColors()
  const dnesHod = lekar.ordinacneHodiny.find(h => h.den === dnes)
  const otvorene = !!dnesHod?.hodiny

  return (
    <Card padding={0}>
      <View style={styles.lekarHead}>
        <View style={[styles.lekarAvatar, { backgroundColor: t.primaryLight }]}>
          <Text style={[styles.lekarAvatarText, { color: t.primary }]}>
            {lekar.meno.split(' ').filter(p => /^[A-Z]/.test(p)).slice(0,2).map(p => p[0]).join('')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.lekarMeno, { color: t.text }]} numberOfLines={1}>
            {lekar.meno}
          </Text>
          <Text style={[styles.lekarSpec, { color: t.textMuted }]} numberOfLines={2}>
            {lekar.specializacia}
          </Text>
          {dnesHod && (
            <View style={styles.lekarStatusRow}>
              <View style={[
                styles.statusDot,
                { backgroundColor: otvorene ? '#2E7D32' : '#C62828' },
              ]} />
              <Text style={[
                styles.lekarStatus,
                { color: otvorene ? '#1B5E20' : '#8E1F1F' },
              ]}>
                {otvorene ? `DNES ${dnesHod.hodiny}` : 'Dnes neordinuje'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Kontakty + zavolať */}
      <View style={[styles.lekarContacts, { borderTopColor: t.borderLight }]}>
        {lekar.telefon && (
          <PressableScale style={[styles.lekarBtn, { backgroundColor: t.primary }]} scaleTo={0.96} onPress={() => onCall(lekar.telefon!)} accessibilityLabel={`Zavolať ${formatTel(lekar.telefon)}`}>
            <Icon name="kontakty" size={14} color="#FFFFFF" /><Text style={styles.lekarBtnText}>{formatTel(lekar.telefon)}</Text>
          </PressableScale>
        )}
        {lekar.mobil && (
          <PressableScale style={[styles.lekarBtn, { backgroundColor: t.secondary }]} scaleTo={0.96} onPress={() => onCall(lekar.mobil!)} accessibilityLabel={`Zavolať mobil ${formatTel(lekar.mobil)}`}>
            <Icon name="phonePortrait" size={14} color="#FFFFFF" /><Text style={styles.lekarBtnText}>{formatTel(lekar.mobil)}</Text>
          </PressableScale>
        )}
      </View>

      {/* Rozvrh — kompaktný */}
      <View style={[styles.lekarRozvrh, { borderTopColor: t.borderLight }]}>
        <Text style={[styles.lekarRozvrhLabel, { color: t.textMuted }]}>
          ROZVRH
        </Text>
        {lekar.ordinacneHodiny.map(h => (
          <View key={h.den} style={styles.lekarHodinyRow}>
            <Text style={[
              styles.lekarHodinyDen,
              {
                color: h.den === dnes ? t.primary : t.textSecondary,
                fontWeight: h.den === dnes ? '900' : '700',
              },
            ]}>
              {DEN_LABEL[h.den].slice(0, 2)}
            </Text>
            <Text style={[
              styles.lekarHodinyCas,
              { color: h.hodiny ? (h.den === dnes ? t.primary : t.text) : t.textPlaceholder },
            ]}>
              {h.hodiny ?? '—'}
            </Text>
            {h.poznamka && (
              <Text style={[styles.lekarHodinyPoznamka, { color: t.textMuted }]} numberOfLines={1}>
                {h.poznamka}
              </Text>
            )}
          </View>
        ))}
      </View>

      {lekar.poznamka && (
        <Text style={[styles.lekarPoznamka, { color: t.textMuted, borderTopColor: t.borderLight }]}>
          {lekar.poznamka}
        </Text>
      )}
    </Card>
  )
}

// ─── Štýly ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 8 },
  backText: { color: '#FFFFFF', ...typo.bodyB },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIconBox: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', ...typo.h1 },
  headerSub: { color: 'rgba(255,255,255,0.9)', ...typo.caption, fontWeight: '600', marginTop: 2 },

  scroll: { padding: spacing.lg },

  // Kontakty box
  vedenie: { ...typo.captionB, marginBottom: spacing.sm },
  kontaktRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 8,
  },
  kontaktIcon: { fontSize: 18, width: 24 },
  kontaktText: { ...typo.body, flex: 1 },
  kontaktLink: { fontWeight: '700' },

  // Akcie
  akciaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  akciaIconBox: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  akciaLabel: { ...typo.h3 },
  akciaPopis: { ...typo.caption, marginTop: 2 },

  // Hodiny
  hodinyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  hodinyDen: { ...typo.body },
  hodinyPoznamka: { ...typo.micro, marginTop: 2 },
  hodinyCas: { ...typo.bodyB },

  // Lekár karta
  lekarHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  lekarAvatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  lekarAvatarText: { fontSize: 16, fontWeight: '900' },
  lekarMeno: { ...typo.h3 },
  lekarSpec: { ...typo.caption, marginTop: 2 },
  lekarStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  lekarStatus: { ...typo.micro, fontWeight: '800' },

  lekarContacts: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexWrap: 'wrap',
  },
  lekarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  lekarBtnText: { color: '#FFFFFF', ...typo.captionB },

  lekarRozvrh: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    gap: 4,
  },
  lekarRozvrhLabel: { ...typo.label, marginBottom: 4 },
  lekarHodinyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lekarHodinyDen: { width: 28, fontSize: 12 },
  lekarHodinyCas: { fontSize: 12, minWidth: 100 },
  lekarHodinyPoznamka: { fontSize: 11, flex: 1, fontStyle: 'italic' },

  lekarPoznamka: {
    fontSize: 12, lineHeight: 17,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    fontStyle: 'italic',
  },

  // Poznámka
  poznamkaBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: spacing.md,
  },
  poznamkaText: { ...typo.caption, lineHeight: 19, flex: 1 },

  notFoundBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
  notFoundTitle: { ...typo.h2 },
})
