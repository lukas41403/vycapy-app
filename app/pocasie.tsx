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

import { Card, Icon, IconName, PressableScale } from '@/components/ui'
import { useTenant } from '@/src/config/tenant'
import { useWeather } from '@/src/hooks/useWeather'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, spacing, typo } from '@/src/theme/tokens'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const POCASIE_MODRA = '#0277BD'

type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name']
function weatherGlyph(code: number, isDay = true): MciName {
  if (code === 0 || code === 1) return isDay ? 'weather-sunny' : 'weather-night'
  if (code === 2) return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy'
  if (code === 3) return 'weather-cloudy'
  if (code === 45 || code === 48) return 'weather-fog'
  if (code >= 51 && code <= 55) return 'weather-partly-rainy'
  if ((code >= 61 && code <= 65) || code === 80 || code === 81) return 'weather-rainy'
  if (code === 82) return 'weather-pouring'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'weather-snowy'
  if (code >= 95) return 'weather-lightning-rainy'
  return 'weather-cloudy'
}

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
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: POCASIE_MODRA }]}>
        <PressableScale onPress={() => router.back()} style={styles.back} scaleTo={0.94} accessibilityLabel="Späť">
          <Icon name="chevronBack" size={20} color="#FFFFFF" /><Text style={styles.backText}>Späť</Text>
        </PressableScale>
        <View style={styles.headerTitleRow}>
          <Icon name="pocasie" size={22} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Počasie</Text>
        </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Icon name="info" size={18} color={t.text} />
              <Text style={[typo.h3, { color: t.text }]}>Nepodarilo sa načítať</Text>
            </View>
            <Text style={[typo.caption, { color: t.textMuted }]}>{error}</Text>
            <PressableScale onPress={refresh} style={[styles.retryBtn, { backgroundColor: POCASIE_MODRA, marginTop: spacing.sm }]} scaleTo={0.96}>
              <Text style={styles.retryBtnText}>Skúsiť znova</Text>
            </PressableScale>
          </Card>
        )}

        {data && (
          <>
            {/* Hero — aktuálne */}
            <View style={[styles.hero, { backgroundColor: t.surface }]}>
              <MaterialCommunityIcons name={weatherGlyph(data.kod, data.jeDen)} size={92} color={POCASIE_MODRA} />
              <Text style={[styles.heroTeplota, { color: t.text }]}>{data.teplota}°</Text>
              <Text style={[styles.heroPopis, { color: t.textSecondary }]}>{data.popis}</Text>
              <Text style={[styles.heroPocit, { color: t.textMuted }]}>
                Pocitová teplota {data.teplotaPocit}°
              </Text>
            </View>

            {/* Doplnkové info */}
            <View style={styles.detailRow}>
              <DetailBox icon="wind" label="Vietor" value={`${data.vietor} km/h`} sub={smerVietra(data.smerVietra)} />
              <DetailBox icon="humidity" label="Vlhkosť" value={`${data.vlhkost}%`} />
              {data.daily[0] && (
                <>
                  <DetailBox icon="sun" label="Východ" value={formatCas(data.daily[0].vychod)} />
                  <DetailBox icon="moon" label="Západ" value={formatCas(data.daily[0].zapad)} />
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
                      <MaterialCommunityIcons name={weatherGlyph(h.kod)} size={26} color={POCASIE_MODRA} />
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
                      <View style={styles.dayEmoji}><MaterialCommunityIcons name={weatherGlyph(d.kod)} size={26} color={POCASIE_MODRA} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dayPopis, { color: t.textSecondary }]} numberOfLines={1}>
                          {d.popis}
                        </Text>
                        {d.pravdepodobnostZrazok > 5 && (
                          <View style={styles.dayRainRow}>
                            <Icon name="rain" size={12} color="#0288D1" />
                            <Text style={[styles.dayRain, { color: '#0288D1' }]}>{d.pravdepodobnostZrazok}% · {d.zrazky.toFixed(1)} mm</Text>
                          </View>
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

function DetailBox({ icon, label, value, sub }: {
  icon: IconName; label: string; value: string; sub?: string
}) {
  const t = useThemeColors()
  return (
    <View style={[styles.detailBox, { backgroundColor: t.surface }]}>
      <Icon name={icon} size={20} color={POCASIE_MODRA} />
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
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', marginBottom: 6 },
  backText: { color: '#FFFFFF', ...typo.bodyB },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { color: '#FFFFFF', ...typo.h1 },
  headerSub: { color: 'rgba(255,255,255,0.9)', ...typo.caption, fontFamily: 'Inter_600SemiBold', marginTop: 2 },

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
  dayEmoji: { width: 36, alignItems: 'center' },
  dayPopis: { ...typo.caption },
  dayRainRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dayRain: { fontSize: 11, fontWeight: '700' },
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
