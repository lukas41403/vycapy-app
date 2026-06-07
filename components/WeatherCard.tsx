/**
 * WeatherCard — farebný, animovaný počasie widget pre domovskú obrazovku.
 *
 * - Pozadie = gradient podľa aktuálneho počasia a dennej doby (obloha).
 * - Weather ikona jemne „pláva" (reanimated, len transform → GPU-friendly).
 * - Biely text + ikony pre maximálny kontrast na sýtom gradiente.
 * - Klik → /pocasie.
 */

import { Icon, PressableScale } from '@/components/ui'
import { useTenant } from '@/src/config/tenant'
import { useWeather } from '@/src/hooks/useWeather'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

/** WMO kód → weather ikona (MCI). */
function weatherGlyph(code: number, isDay: boolean): MciName {
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

/** WMO kód + deň/noc → gradient pozadia karty (obloha). */
function weatherGradient(code: number, isDay: boolean): readonly [string, string] {
  if (code === 0 || code === 1) return isDay ? ['#5CB8F5', '#1E78D6'] : ['#243B6B', '#0E1A3A']
  if (code === 2) return isDay ? ['#5BA3E0', '#2E6FC9'] : ['#2E3A66', '#18223F']
  if (code === 3) return ['#8AA6C8', '#46608A']
  if (code === 45 || code === 48) return ['#94A7BC', '#5A7184']
  if (code >= 51 && code <= 55) return ['#6EA0C2', '#3E6A86']
  if ((code >= 61 && code <= 65) || code === 80 || code === 81) return ['#5B86A6', '#33536B']
  if (code === 82) return ['#4A6E89', '#26384A']
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['#9FC5EC', '#5E7FB5']
  if (code >= 95) return ['#5E4B8B', '#2E2350']
  return ['#8AA6C8', '#46608A']
}

const W = 'rgba(255,255,255,0.92)'
const W_DIM = 'rgba(255,255,255,0.72)'

export function WeatherCard() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()
  const { data, loading, error, refresh } = useWeather(tenant.mapaCentrum.lat, tenant.mapaCentrum.lng)

  // Plávajúca animácia weather ikony
  const reduced = useReducedMotion()
  const float = useSharedValue(0)
  useEffect(() => {
    if (reduced) return
    float.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1600 }),
        withTiming(0, { duration: 1600 }),
      ),
      -1,
      true,
    )
  }, [reduced, float])
  const iconAnim = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }))

  // Loading
  if (loading && !data) {
    return (
      <View style={[styles.cardFlat, { backgroundColor: t.surface, shadowColor: t.shadow }]}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={t.primary} />
          <Text style={[styles.loadingText, { color: t.textMuted }]}>Načítavam počasie…</Text>
        </View>
      </View>
    )
  }

  // Error
  if (error || !data) {
    return (
      <PressableScale style={[styles.cardFlat, { backgroundColor: t.surface, shadowColor: t.shadow }]} onPress={refresh} accessibilityLabel="Počasie nedostupné, skúsiť znova">
        <View style={styles.loadingRow}>
          <Icon name="info" size={24} color={t.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: t.text }]}>Počasie nedostupné</Text>
            <Text style={[styles.errSub, { color: t.textMuted }]}>Klepnutím skúsiť znova</Text>
          </View>
          <Icon name="refresh" size={20} color={t.textMuted} />
        </View>
      </PressableScale>
    )
  }

  const next12h = data.hourly.slice(0, 12)
  const maxRainProb = Math.max(...next12h.map(h => h.pravdepodobnostZrazok))
  const totalRain = next12h.reduce((acc, h) => acc + h.zrazky, 0)
  const dnes = data.daily[0]
  const glyph = weatherGlyph(data.kod, data.jeDen)
  const grad = weatherGradient(data.kod, data.jeDen)

  return (
    <PressableScale
      style={[styles.shadowWrap, { shadowColor: grad[1] }]}
      onPress={() => router.push('/pocasie' as never)}
      accessibilityLabel={`Počasie: ${data.teplota} stupňov, ${data.popis}. Klepnutím otvoríte detail.`}
    >
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        {/* dekoračný kruh */}
        <View style={styles.decorCircle} />

        <View style={styles.mainRow}>
          <Animated.View style={iconAnim}>
            <MaterialCommunityIcons name={glyph} size={52} color="#FFFFFF" />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <View style={styles.teplotaRow}>
              <Text style={styles.teplota}>{data.teplota}°</Text>
              {dnes && <Text style={styles.teplotaMinMax}>{dnes.teplotaMax}° / {dnes.teplotaMin}°</Text>}
            </View>
            <Text style={styles.popis} numberOfLines={1}>{data.popis} · Pocit {data.teplotaPocit}°</Text>
          </View>

          {data.aqi && data.aqi.european != null && (
            <View style={styles.aqiBadge}>
              <View style={[styles.aqiDot, { backgroundColor: data.aqi.europeanColor }]} />
              <Text style={styles.aqiNum}>{data.aqi.european}</Text>
              <Text style={styles.aqiLabel}>AQI</Text>
            </View>
          )}
        </View>

        <View style={styles.subRow}>
          <SubInfo icon="wind" value={`${data.vietor} km/h`} label="Vietor" />
          <View style={styles.subDivider} />
          <SubInfo icon="humidity" value={`${data.vlhkost}%`} label="Vlhkosť" />
          <View style={styles.subDivider} />
          <SubInfo
            icon="rain"
            value={maxRainProb > 30 ? `${maxRainProb}%` : (totalRain > 0 ? `${totalRain.toFixed(1)} mm` : '0 %')}
            label="Dnes"
          />
        </View>
      </LinearGradient>
    </PressableScale>
  )
}

function SubInfo({ icon, value, label }: { icon: 'wind' | 'humidity' | 'rain'; value: string; label: string }) {
  return (
    <View style={styles.subItem}>
      <Icon name={icon} size={18} color={W} />
      <View>
        <Text style={styles.subValue}>{value}</Text>
        <Text style={styles.subLabel}>{label}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  shadowWrap: { borderRadius: radius.lg, ...shadows.lg },
  card: { borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden' },
  decorCircle: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)', right: -54, top: -54,
  },

  cardFlat: { borderRadius: radius.lg, padding: spacing.lg, ...shadows.md },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  loadingText: { ...typo.caption, fontWeight: '600' },
  errSub: { ...typo.micro, marginTop: 2 },
  title: { ...typo.h3 },

  mainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  teplotaRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' },
  teplota: { fontSize: 38, fontWeight: '900', letterSpacing: -1.5, color: '#FFFFFF' },
  teplotaMinMax: { ...typo.caption, fontWeight: '800', color: W_DIM },
  popis: { ...typo.caption, marginTop: 2, color: W, fontWeight: '600' },

  aqiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  aqiDot: { width: 8, height: 8, borderRadius: 4 },
  aqiNum: { fontSize: 15, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  aqiLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: W },

  subRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', gap: spacing.sm,
  },
  subDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' },
  subItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  subValue: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  subLabel: { fontSize: 10, fontWeight: '600', marginTop: -1, color: W_DIM },
})

export default WeatherCard
