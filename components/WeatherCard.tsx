/**
 * WeatherCard — kompaktný počasie widget pre domovskú obrazovku.
 *
 * Tri stavy:
 *   - Loading: skeleton shimmer
 *   - Error: tichá hláška + retry button
 *   - Data: emoji + teplota + popis + AQI badge + dnešná pravdepodobnosť dažďa
 *
 * Klik na kartu → otvorí /pocasie pre celodenný prehľad.
 */

import { useTenant } from '@/src/config/tenant'
import { useWeather } from '@/src/hooks/useWeather'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export function WeatherCard() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()
  const { data, loading, error, refresh } = useWeather(tenant.mapaCentrum.lat, tenant.mapaCentrum.lng)

  // Loading state
  if (loading && !data) {
    return (
      <View style={[styles.card, { backgroundColor: t.surface, shadowColor: t.shadow }]}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={t.primary} />
          <Text style={[styles.loadingText, { color: t.textMuted }]}>Načítavam počasie…</Text>
        </View>
      </View>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: t.surface, shadowColor: t.shadow }]}
        onPress={refresh}
        activeOpacity={0.8}
      >
        <View style={styles.loadingRow}>
          <Text style={{ fontSize: 24 }}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: t.text }]}>Počasie nedostupné</Text>
            <Text style={[styles.errSub, { color: t.textMuted }]}>Klepnutím skúsiť znova</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Pravdepodobnosť dažďa v ďalších 12h
  const next12h = data.hourly.slice(0, 12)
  const maxRainProb = Math.max(...next12h.map(h => h.pravdepodobnostZrazok))
  const totalRain = next12h.reduce((acc, h) => acc + h.zrazky, 0)

  // Dnešná max/min teplota
  const dnes = data.daily[0]

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: t.surface, shadowColor: t.shadow }]}
      onPress={() => router.push('/pocasie' as never)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Počasie: ${data.teplota} stupňov, ${data.popis}. Klepnutím otvoríte detail.`}
    >
      {/* Hlavný riadok */}
      <View style={styles.mainRow}>
        <Text style={styles.emoji}>{data.emoji}</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.teplotaRow}>
            <Text style={[styles.teplota, { color: t.text }]}>{data.teplota}°</Text>
            {dnes && (
              <Text style={[styles.teplotaMinMax, { color: t.textMuted }]}>
                {dnes.teplotaMax}° / {dnes.teplotaMin}°
              </Text>
            )}
          </View>
          <Text style={[styles.popis, { color: t.textSecondary }]} numberOfLines={1}>
            {data.popis} · Pocit {data.teplotaPocit}°
          </Text>
        </View>

        {/* AQI badge */}
        {data.aqi && data.aqi.european != null && (
          <View style={[styles.aqiBadge, { backgroundColor: data.aqi.europeanColor + '22', borderColor: data.aqi.europeanColor }]}>
            <Text style={[styles.aqiNum, { color: data.aqi.europeanColor }]}>
              {data.aqi.european}
            </Text>
            <Text style={[styles.aqiLabel, { color: data.aqi.europeanColor }]}>
              AQI
            </Text>
          </View>
        )}
      </View>

      {/* Doplnkový riadok — vietor, vlhkosť, dažď */}
      <View style={[styles.subRow, { borderTopColor: t.borderLight }]}>
        <SubInfo emoji="💨" value={`${data.vietor} km/h`} label="Vietor" />
        <SubInfo emoji="💧" value={`${data.vlhkost}%`} label="Vlhkosť" />
        <SubInfo
          emoji="🌧️"
          value={maxRainProb > 30 ? `${maxRainProb}%` : (totalRain > 0 ? `${totalRain.toFixed(1)} mm` : '0 %')}
          label="Dnes"
        />
      </View>
    </TouchableOpacity>
  )
}

function SubInfo({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  const t = useThemeColors()
  return (
    <View style={styles.subItem}>
      <Text style={styles.subEmoji}>{emoji}</Text>
      <View>
        <Text style={[styles.subValue, { color: t.text }]}>{value}</Text>
        <Text style={[styles.subLabel, { color: t.textMuted }]}>{label}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  loadingRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  loadingText: { ...typo.caption, fontWeight: '600' },
  errSub: { ...typo.micro, marginTop: 2 },

  mainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 48, lineHeight: 56 },
  teplotaRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' },
  teplota: { fontSize: 36, fontWeight: '900', letterSpacing: -1.5 },
  teplotaMinMax: { ...typo.caption, fontWeight: '700' },
  popis: { ...typo.caption, marginTop: 2 },
  title: { ...typo.h3 },

  aqiBadge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 54,
  },
  aqiNum: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  aqiLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: -2 },

  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  subItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  subEmoji: { fontSize: 18 },
  subValue: { fontSize: 13, fontWeight: '800' },
  subLabel: { fontSize: 10, fontWeight: '600', marginTop: -1 },
})

export default WeatherCard
