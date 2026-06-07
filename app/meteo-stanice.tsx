/**
 * Meteo stanice obce — kvalita vzduchu + teplota + vlhkosť.
 *
 * Občania vidia v reálnom čase merania z obecných meteostaníc rozmiestnených
 * po obci (centrum, pri škole, pri ihrisku, atď.). Pre každú stanicu:
 *   - AQI (European Air Quality Index) so semaforom (zelená/žltá/červená)
 *   - PM2.5 a PM10 mikročastice
 *   - Teplota a vlhkosť
 *   - GPS poloha + mapa s pinmi všetkých staníc
 *
 * Stav: defenzívne — ak stĺpce aqi/pm25/pm10 v DB neexistujú alebo neobsahujú
 * dáta, stanica sa zobrazí so správou "Stanica zatiaľ neposiela dáta".
 *
 * Pre demo bez fyzickej stanice — admin môže pridať jednu virtuálnu stanicu
 * v Supabase a periodicky ju aktualizovať z Open-Meteo cez cron job.
 */

import LeafletMap, { LeafletMarker } from '@/components/LeafletMap'
import { AtmosphereBackground, Badge, Card, EmptyState, Icon, IconName, PressableScale } from '@/components/ui'
import { useTenant } from '@/src/config/tenant'
import { useObecneZariadenia, Zariadenie } from '@/src/hooks/useObecneZariadenia'
import { aqiLabel } from '@/src/hooks/useWeather'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const METEO_FARBA = '#00838F'

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const min = Math.round((Date.now() - d.getTime()) / 60000)
  if (min < 1) return 'práve teraz'
  if (min < 60) return `pred ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `pred ${h} h`
  const days = Math.round(h / 24)
  return `pred ${days} dňami`
}

export default function MeteoStaniceScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()
  const { zariadenia, loading, nacitaj } = useObecneZariadenia()
  const [vybranaId, setVybranaId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filtruj iba meteo stanice
  const stanice = useMemo(
    () => zariadenia.filter(z => z.typ === 'meteo'),
    [zariadenia],
  )

  // Najlepšia (najnižšia AQI) a najhoršia stanica — pre dashboard pohľad
  const aqiAgregat = useMemo(() => {
    const sValuesAqi = stanice
      .filter(s => s.aqi != null)
      .map(s => ({ id: s.id, nazov: s.nazov, aqi: s.aqi! }))
    if (sValuesAqi.length === 0) return null
    sValuesAqi.sort((a, b) => a.aqi - b.aqi)
    const avg = sValuesAqi.reduce((a, b) => a + b.aqi, 0) / sValuesAqi.length
    return {
      najmensia: sValuesAqi[0],
      najvacsia: sValuesAqi[sValuesAqi.length - 1],
      priemer: Math.round(avg),
      celkom: sValuesAqi.length,
    }
  }, [stanice])

  // Markers pre mapu
  const markers: LeafletMarker[] = useMemo(() =>
    stanice
      .filter(s => s.lat != null && s.lng != null)
      .map(s => {
        const meta = s.aqi != null ? aqiLabel(s.aqi) : { color: '#9E9E9E', label: '—', rada: '' }
        return {
          id: s.id,
          lat: s.lat!, lng: s.lng!,
          color: meta.color,
          emoji: '📡',
          label: `${s.nazov} · AQI ${s.aqi ?? '—'}`,
          active: s.id === vybranaId,
        }
      }),
  [stanice, vybranaId])

  async function handleRefresh() {
    setRefreshing(true)
    await nacitaj()
    setRefreshing(false)
  }

  const vybrana = vybranaId ? stanice.find(s => s.id === vybranaId) : null

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]} edges={['top']}>
      <AtmosphereBackground tint={METEO_FARBA} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: METEO_FARBA }]}>
        <PressableScale onPress={() => router.back()} style={styles.back} scaleTo={0.94} accessibilityLabel="Späť">
          <Icon name="chevronBack" size={20} color="#FFFFFF" /><Text style={styles.backText}>Späť</Text>
        </PressableScale>
        <View style={styles.headerTitleRow}>
          <Icon name="meteo" size={22} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Meteo stanice</Text>
        </View>
        <Text style={styles.headerSub}>
          {stanice.length} {stanice.length === 1 ? 'stanica' : stanice.length < 5 ? 'stanice' : 'staníc'}
          {' '}v obci {tenant.nazov}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={METEO_FARBA}
            colors={[METEO_FARBA]}
          />
        }
      >
        {loading && stanice.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={METEO_FARBA} />
            <Text style={[styles.loadingText, { color: t.textMuted }]}>Načítavam stanice…</Text>
          </View>
        ) : stanice.length === 0 ? (
          <EmptyState
            icon="meteo"
            title="Žiadne meteo stanice"
            description={
              'V tabuľke obecne_zariadenia zatiaľ nie sú zariadenia typu "meteo". ' +
              'Admin obce môže pridať stanicu cez Supabase Table editor — typ = "meteo", ' +
              'a periodicky aktualizovať aqi/pm25/pm10/teplota/vlhkosť cez cron job z Open-Meteo.'
            }
            actionLabel="Pridať novú obec"
            onAction={() => router.push('/admin' as never)}
          />
        ) : (
          <>
            {/* Agregátna karta */}
            {aqiAgregat && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[styles.sectionLabel, { color: t.textMuted }]}>
                  AKTUÁLNY STAV V OBCI
                </Text>
                <Card variant="accent" accentColor={aqiLabel(aqiAgregat.priemer).color}>
                  <View style={styles.agregatRow}>
                    <View style={[
                      styles.agregatCircle,
                      { backgroundColor: aqiLabel(aqiAgregat.priemer).color },
                    ]}>
                      <Text style={styles.agregatNum}>{aqiAgregat.priemer}</Text>
                      <Text style={styles.agregatLabel}>AQI</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.agregatTitle, { color: aqiLabel(aqiAgregat.priemer).color }]}>
                        {aqiLabel(aqiAgregat.priemer).label}
                      </Text>
                      <Text style={[styles.agregatSub, { color: t.textSecondary }]}>
                        Priemer zo {aqiAgregat.celkom} {aqiAgregat.celkom === 1 ? 'stanice' : 'staníc'}
                      </Text>
                      <Text style={[styles.agregatRada, { color: t.textSecondary }]}>
                        {aqiLabel(aqiAgregat.priemer).rada}
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>
            )}

            {/* Mapa */}
            {markers.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[styles.sectionLabel, { color: t.textMuted }]}>
                  POLOHA STANÍC
                </Text>
                <LeafletMap
                  center={tenant.mapaCentrum}
                  zoom={15}
                  markers={markers}
                  onMarkerPress={(id) => setVybranaId(id)}
                  fitBoundsToMarkers
                  style={{ height: 280 }}
                />
              </View>
            )}

            {/* Zoznam staníc */}
            <Text style={[styles.sectionLabel, { color: t.textMuted }]}>
              DETAIL STANÍC
            </Text>
            <View style={{ gap: spacing.md }}>
              {stanice.map(s => (
                <StanicaKarta
                  key={s.id}
                  stanica={s}
                  vybrana={vybranaId === s.id}
                  onPress={() => setVybranaId(vybranaId === s.id ? null : s.id)}
                />
              ))}
            </View>

            {/* Footer */}
            <Text style={[styles.footer, { color: t.textPlaceholder }]}>
              Vidíte nepravdepodobné hodnoty? Nahláste cez Hlásenie porúch.
              {'\n'}AQI škála: 0-20 výborná, 20-40 dobrá, 40-60 stredná, 60-80 zlá, 80+ veľmi zlá.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Karta jednej stanice ─────────────────────────────────────────────────
function StanicaKarta({ stanica: s, vybrana, onPress }: {
  stanica: Zariadenie
  vybrana: boolean
  onPress: () => void
}) {
  const t = useThemeColors()
  const aqi = s.aqi != null ? aqiLabel(s.aqi) : null
  const maData = s.aqi != null || s.pm25 != null || s.teplota != null

  return (
    <Card
      onPress={onPress}
      variant={vybrana ? 'accent' : 'elevated'}
      accentColor={aqi?.color}
      padding={0}
    >
      <View style={styles.staniceObsah}>
        <View style={styles.staniceTop}>
          <View style={[styles.staniceIkona, { backgroundColor: (aqi?.color ?? '#9E9E9E') + '22' }]}>
            <Icon name="meteo" size={22} color={aqi?.color ?? '#9E9E9E'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.staniceNazov, { color: t.text }]} numberOfLines={1}>
              {s.nazov}
            </Text>
            {s.ulica && (
              <View style={styles.staniceUlicaRow}>
                <Icon name="location" size={12} color={t.textMuted} />
                <Text style={[styles.staniceUlica, { color: t.textMuted }]} numberOfLines={1}>{s.ulica}</Text>
              </View>
            )}
          </View>
          {aqi && (
            <View style={[styles.aqiPill, { backgroundColor: aqi.color }]}>
              <Text style={styles.aqiPillNum}>{s.aqi}</Text>
              <Text style={styles.aqiPillLabel}>AQI</Text>
            </View>
          )}
        </View>

        {!maData && (
          <View style={[styles.noData, { backgroundColor: t.surfaceAlt }]}>
            <Icon name="time" size={14} color={t.textMuted} />
            <Text style={[styles.noDataText, { color: t.textMuted }]}>Stanica zatiaľ neposiela dáta. Čakáme na prvý odpočet.</Text>
          </View>
        )}

        {maData && (
          <View style={[styles.metrikRow, { borderTopColor: t.borderLight }]}>
            {s.teplota != null && (
              <Metrika icon="meteo" color="#EF6C00" hodnota={`${s.teplota.toFixed(1)}°`} label="Teplota" />
            )}
            {s.vlhkost != null && (
              <Metrika icon="humidity" color="#0288D1" hodnota={`${Math.round(s.vlhkost)}%`} label="Vlhkosť" />
            )}
            {s.pm25 != null && (
              <Metrika icon="leaf" color="#2E7D32" hodnota={s.pm25.toFixed(1)} label="PM2.5" />
            )}
            {s.pm10 != null && (
              <Metrika icon="leaf" color="#00838F" hodnota={s.pm10.toFixed(1)} label="PM10" />
            )}
          </View>
        )}

        {vybrana && aqi && (
          <View style={[styles.radaBox, { backgroundColor: aqi.color + '11', borderLeftColor: aqi.color }]}>
            <Badge label={aqi.label} tone="info" style={{ backgroundColor: aqi.color, marginBottom: 6 }} textStyle={{ color: '#FFFFFF' }} />
            <Text style={[styles.radaText, { color: t.textSecondary }]}>
              {aqi.rada}
            </Text>
          </View>
        )}

        <Text style={[styles.lastUpdate, { color: t.textPlaceholder }]}>
          Aktualizované: {formatRelative(s.updated_at)}
        </Text>
      </View>
    </Card>
  )
}

function Metrika({ icon, color, hodnota, label }: { icon: IconName; color: string; hodnota: string; label: string }) {
  const t = useThemeColors()
  return (
    <View style={styles.metrikBox}>
      <Icon name={icon} size={18} color={color} />
      <Text style={[styles.metrikHodnota, { color: t.text }]}>{hodnota}</Text>
      <Text style={[styles.metrikLabel, { color: t.textMuted }]}>{label}</Text>
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

  sectionLabel: { ...typo.label, marginBottom: spacing.sm },

  // Agregátna karta
  agregatRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  agregatCircle: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  agregatNum: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  agregatLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '800', marginTop: -2 },
  agregatTitle: { ...typo.h3 },
  agregatSub: { ...typo.micro, marginTop: 2, fontWeight: '700' },
  agregatRada: { ...typo.caption, marginTop: 6, lineHeight: 18 },

  // Stanica karta
  staniceObsah: { padding: spacing.md, gap: spacing.sm },
  staniceTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  staniceIkona: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  staniceNazov: { ...typo.h3 },
  staniceUlicaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  staniceUlica: { ...typo.caption, flexShrink: 1 },

  aqiPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    alignItems: 'center',
    minWidth: 54,
  },
  aqiPillNum: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  aqiPillLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 9, fontWeight: '900', marginTop: -2 },

  noData: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  noDataText: { ...typo.caption, fontStyle: 'italic', flex: 1 },

  metrikRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metrikBox: { flex: 1, alignItems: 'center', minWidth: 70 },
  metrikEmoji: { fontSize: 18 },
  metrikHodnota: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  metrikLabel: { ...typo.micro, marginTop: 1 },

  radaBox: {
    borderRadius: radius.sm,
    borderLeftWidth: 4,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  radaText: { ...typo.caption, lineHeight: 18 },

  lastUpdate: { ...typo.micro, textAlign: 'right', marginTop: 4 },

  footer: {
    ...typo.micro,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 16,
  },
})
