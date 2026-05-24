/**
 * Detail počasia — celodenná predpoveď + 7 dní + kvalita vzduchu.
 *
 * Sekcie:
 *   1. Hero — aktuálne počasie veľko
 *   2. Hodinová predpoveď (24h, horizontálny scroll)
 *   3. Týždenný prehľad (7d)
 *   4. Kvalita vzduchu (PM2.5, PM10, AQI s odporúčaním)
 *   5. Detaily — vietor, vlhkosť, východ/západ slnka
 *
 * Dáta: Open-Meteo (žiadny API kľúč).
 */

import { Card } from '@/components/ui'
import { useTenant } from '@/src/config/tenant'
import { useWeather } from '@/src/hooks/useWeather'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const POCASIE_MODRA = '#0277BD'

function formatCas(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })
}

function formatDen(iso: string, idx: number): { hlavny: string; sub: string } {
  if (idx === 0) return { hlavny: 'Dnes', sub: new Date(iso).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' }) }
  if (idx === 1) return { hlavny: 'Zajtra', sub: new Date(iso).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' }) }
  const d = new Date(iso)
  const den = d.toLocaleDateString('sk-SK', { weekday: 'short' })
  return {
    hlavny: den.charAt(0).toUpperCase() + den.slice(1),
    sub: d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' }),
  }
}

function smerVietra(deg: number): string {
  const smery = ['S', 'SV', 'V', 'JV', 'J', 'JZ', 'Z', 'SZ']
  return smery[Math.round(deg / 45) % 8]
}

export default function PocasieScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()
  const { data, loading, error, refresh } = useWeather(tenant.mapaCentrum.lat, tenant.mapaCentrum.lng)

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={POCASIE_MODRA} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: POCASIE_MODRA }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Text style={styles.backText}>← Späť</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>☁️ Počasie</Text>
        <Text style={styles.headerSub}>{tenant.nazov} · zdroj: Open-Meteo</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            onRefresh={refresh}
            tintColor={POCASIE_MODRA}
            colors={[POCASIE_MODRA]}
          />
        }
      >
        {loading && !data && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={POCASIE_MODRA} />
            <Text style={[styles.loadingText, { color: t.textMuted }]}>Načítavam predpoveď…</Text>
          </View>
        )}

        {error && !data && (
          <Card>
            <Text style={[typo.h3, { color: t.text, marginBottom: 4 }]}>⚠️ Nepodarilo sa načítať</Text>
            <Text style={[typo.caption, { color: t.textMuted }]}>{error}</Text>
            <TouchableOpacity
              onPress={refresh}
              style={[styles.retryBtn, { backgroundColor: POCASIE_MODRA, marginTop: spacing.sm }]}
            >
              <Text style={styles.retryBtnText}>Skúsiť znova</Text>
            </TouchableOpacity>
          </Card>
        )}

        {data && (
          <>
            {/* Hero — aktuálne */}
            <View style={[styles.hero, { backgroundColor: t.surface }]}>
              <Text style={styles.heroEmoji}>{data.emoji}</Text>
              <Text style={[styles.heroTeplota, { color: t.text }]}>{data.teplota}°</Text>
              <Text style={[styles.heroPopis, { color: t.textSecondary }]}>{data.popis}</Text>
              <Text style={[styles.heroPocit, { color: t.textMuted }]}>
                Pocitová teplota {data.teplotaPocit}°
              </Text>
            </View>

            {/* Doplnkové info */}
            <View style={styles.detailRow}>
              <DetailBox emoji="💨" label="Vietor" value={`${data.vietor} km/h`} sub={smerVietra(data.smerVietra)} />
              <DetailBox emoji="💧" label="Vlhkosť" value={`${data.vlhkost}%`} />
              {data.daily[0] && (
                <>
                  <DetailBox emoji="🌅" label="Východ" value={formatCas(data.daily[0].vychod)} />
                  <DetailBox emoji="🌇" label="Západ" value={formatCas(data.daily[0].zapad)} />
                </>
              )}
            </View>

            {/* Kvalita vzduchu */}
            {data.aqi && data.aqi.european != null && (
              <View style={{ marginTop: spacing.lg }}>
                <Text style={[styles.sectionTitle, { color: t.textMuted }]}>KVALITA VZDUCHU</Text>
                <View style={[
                  styles.aqiCard,
                  { backgroundColor: t.surface, borderLeftColor: data.aqi.europeanColor },
                ]}>
                  <View style={styles.aqiTop}>
                    <View style={[styles.aqiBig, { backgroundColor: data.aqi.europeanColor }]}>
                      <Text style={styles.aqiBigNum}>{data.aqi.european}</Text>
                      <Text style={styles.aqiBigLabel}>EU AQI</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.aqiLabel, { color: data.aqi.europeanColor }]}>
                        {data.aqi.europeanLabel}
                      </Text>
                      <Text style={[styles.aqiRada, { color: t.textSecondary }]}>
                        {data.aqi.rada}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.aqiPm, { borderTopColor: t.borderLight }]}>
                    {data.aqi.pm25 != null && (
                      <View style={styles.aqiPmItem}>
                        <Text style={[styles.aqiPmNum, { color: t.text }]}>
                          {data.aqi.pm25.toFixed(1)}
                        </Text>
                        <Text style={[styles.aqiPmLabel, { color: t.textMuted }]}>
                          PM2.5 µg/m³
                        </Text>
                      </View>
                    )}
                    {data.aqi.pm10 != null && (
                      <View style={styles.aqiPmItem}>
                        <Text style={[styles.aqiPmNum, { color: t.text }]}>
                          {data.aqi.pm10.toFixed(1)}
                        </Text>
                        <Text style={[styles.aqiPmLabel, { color: t.textMuted }]}>
                          PM10 µg/m³
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Hodinová predpoveď */}
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[styles.sectionTitle, { color: t.textMuted }]}>NASLEDUJÚCICH 24 HODÍN</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                {data.hourly.map((h, i) => {
                  const cas = formatCas(h.cas)
                  return (
                    <View key={h.cas} style={[styles.hourBox, { backgroundColor: t.surface }]}>
                      <Text style={[styles.hourCas, { color: t.textMuted }]}>
                        {i === 0 ? 'Teraz' : cas}
                      </Text>
                      <Text style={styles.hourEmoji}>{h.emoji}</Text>
                      <Text style={[styles.hourTeplota, { color: t.text }]}>{h.teplota}°</Text>
                      {h.pravdepodobnostZrazok > 5 && (
                        <Text style={[styles.hourRain, { color: '#0288D1' }]}>
                          {h.pravdepodobnostZrazok}%
                        </Text>
                      )}
                    </View>
                  )
                })}
              </ScrollView>
            </View>

            {/* 7-dňový prehľad */}
            <View style={{ marginTop: spacing.lg }}>
              <Text style={[styles.sectionTitle, { color: t.textMuted }]}>NASLEDUJÚCICH 7 DNÍ</Text>
              <Card padding={0}>
                {data.daily.map((d, i) => {
                  const { hlavny, sub } = formatDen(d.datum, i)
                  return (
                    <View
                      key={d.datum}
                      style={[
                        styles.dayRow,
                        i < data.daily.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.borderLight },
                      ]}
                    >
                      <View style={{ width: 80 }}>
                        <Text style={[styles.dayHlavny, { color: t.text }]}>{hlavny}</Text>
                        <Text style={[styles.daySub, { color: t.textMuted }]}>{sub}</Text>
                      </View>
                      <Text style={styles.dayEmoji}>{d.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dayPopis, { color: t.textSecondary }]} numberOfLines={1}>
                          {d.popis}
                        </Text>
                        {d.pravdepodobnostZrazok > 5 && (
                          <Text style={[styles.dayRain, { color: '#0288D1' }]}>
                            💧 {d.pravdepodobnostZrazok}% · {d.zrazky.toFixed(1)} mm
                          </Text>
                        )}
                      </View>
                      <View style={styles.dayTemp}>
                        <Text style={[styles.dayMax, { color: t.text }]}>{d.teplotaMax}°</Text>
                        <Text style={[styles.dayMin, { color: t.textMuted }]}>{d.teplotaMin}°</Text>
                      </View>
                    </View>
                  )
                })}
              </Card>
            </View>

            {/* Footer */}
            <Text style={[styles.footer, { color: t.textPlaceholder }]}>
              Aktualizované: {new Date(data.cas).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
              {'\n'}Dáta © Open-Meteo · WMO predpovedný systém
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function DetailBox({ emoji, label, value, sub }: {
  emoji: string; label: string; value: string; sub?: string
}) {
  const t = useThemeColors()
  return (
    <View style={[styles.detailBox, { backgroundColor: t.surface }]}>
      <Text style={styles.detailEmoji}>{emoji}</Text>
      <Text style={[styles.detailValue, { color: t.text }]}>{value}</Text>
      <Text style={[styles.detailLabel, { color: t.textMuted }]}>{label}</Text>
      {sub && <Text style={[styles.detailSub, { color: t.textPlaceholder }]}>{sub}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: 4,
  },
  back: { alignSelf: 'flex-start' },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  headerTitle: { color: '#FFFFFF', ...typo.h1 },
  headerSub: { color: 'rgba(255,255,255,0.9)', ...typo.caption, fontWeight: '600' },

  loadingBox: { padding: 60, alignItems: 'center', gap: 12 },
  loadingText: { ...typo.caption, fontWeight: '600' },

  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // Hero
  hero: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
  },
  heroEmoji: { fontSize: 96, lineHeight: 110 },
  heroTeplota: { fontSize: 72, fontWeight: '900', letterSpacing: -3, marginTop: -10 },
  heroPopis: { ...typo.h3, marginTop: -4 },
  heroPocit: { ...typo.caption, marginTop: 4 },

  // Detail row
  detailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailBox: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  detailEmoji: { fontSize: 22 },
  detailValue: { fontSize: 14, fontWeight: '900', marginTop: 4 },
  detailLabel: { fontSize: 10, fontWeight: '600', marginTop: -1 },
  detailSub: { fontSize: 10, fontWeight: '700', marginTop: 1 },

  sectionTitle: { ...typo.label, marginBottom: spacing.sm },

  // AQI
  aqiCard: {
    borderRadius: radius.lg,
    borderLeftWidth: 5,
    overflow: 'hidden',
  },
  aqiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  aqiBig: {
    width: 80, height: 80, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  aqiBigNum: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  aqiBigLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '800', marginTop: -2 },
  aqiLabel: { ...typo.h3 },
  aqiRada: { ...typo.caption, marginTop: 4, lineHeight: 18 },
  aqiPm: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
    borderTopWidth: 1,
  },
  aqiPmItem: { flex: 1 },
  aqiPmNum: { fontSize: 18, fontWeight: '900' },
  aqiPmLabel: { ...typo.micro, marginTop: 2 },

  // Hourly
  hourBox: {
    width: 64,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  hourCas: { fontSize: 11, fontWeight: '700' },
  hourEmoji: { fontSize: 26 },
  hourTeplota: { fontSize: 15, fontWeight: '900' },
  hourRain: { fontSize: 10, fontWeight: '800' },

  // Daily
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  dayHlavny: { fontSize: 14, fontWeight: '800' },
  daySub: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  dayEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  dayPopis: { ...typo.caption },
  dayRain: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  dayTemp: { flexDirection: 'row', alignItems: 'baseline', gap: 6, minWidth: 70, justifyContent: 'flex-end' },
  dayMax: { fontSize: 16, fontWeight: '900' },
  dayMin: { fontSize: 13, fontWeight: '700' },

  footer: {
    ...typo.micro,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 16,
  },
})
