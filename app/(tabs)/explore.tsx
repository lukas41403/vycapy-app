/**
 * Odpadový kalendár — 2 zobrazenia:
 *   - list (default): chronologický zoznam najbližších vývozov
 *   - month: kalendárový grid s farebnými dňami pre vývoz
 *
 * Plne theme-aware (makeStyles(t)), jednotný Icon systém.
 */

import { AppHeader } from '@/components/AppHeader'
import { AnimatedEntrance, AtmosphereBackground, EmptyState, Icon, IconName, PressableScale } from '@/components/ui'
import { useOdpady } from '@/src/hooks/useOdpady'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function formatDatum(datum: string) {
  const d = new Date(datum)
  const dnes = new Date()
  const zajtra = new Date()
  zajtra.setDate(dnes.getDate() + 1)
  const jeD = d.toDateString() === dnes.toDateString()
  const jeZ = d.toDateString() === zajtra.toDateString()
  const den = d.toLocaleDateString('sk-SK', { weekday: 'long' })
  const datumStr = d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long' })
  if (jeD) return { hlavny: 'Dnes', sub: datumStr, urgent: true }
  if (jeZ) return { hlavny: 'Zajtra', sub: datumStr, urgent: true }
  return { hlavny: den.charAt(0).toUpperCase() + den.slice(1), sub: datumStr, urgent: false }
}

type ViewMode = 'list' | 'month'
const MODES: { id: ViewMode; label: string; icon: IconName }[] = [
  { id: 'list',  label: 'Zoznam', icon: 'list' },
  { id: 'month', label: 'Mesiac', icon: 'podujatia' },
]

export default function OdpadyScreen() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const { odpady, loading, error, refresh } = useOdpady()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AtmosphereBackground />
      <AppHeader title="Odpadový kalendár" subtitle="Najbližšie vývozy odpadu" />

      {!loading && !error && odpady.length > 0 && (
        <View style={styles.modeBar}>
          {MODES.map(m => {
            const active = viewMode === m.id
            return (
              <PressableScale
                key={m.id}
                style={[styles.modeBtn, active && styles.modeBtnActive]}
                scaleTo={0.96}
                onPress={() => setViewMode(m.id)}
                accessibilityLabel={`Zobrazenie: ${m.label}`}
              >
                <Icon name={m.icon} size={15} color={active ? t.primary : t.textMuted} />
                <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>{m.label}</Text>
              </PressableScale>
            )
          })}
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={styles.loadingText}>Načítavam…</Text>
        </View>
      )}

      {error && (
        <View style={styles.centerPad}>
          <EmptyState icon="info" title="Chyba pri načítaní" description="Skontrolujte pripojenie a skúste to znova." actionLabel="Skúsiť znova" onAction={handleRefresh} />
        </View>
      )}

      {!loading && !error && odpady.length === 0 && (
        <View style={styles.centerPad}>
          <EmptyState icon="odpady" title="Žiadne plánované vývozy" description="Harmonogram bude doplnený. Skontrolujte oficiálnu stránku obce." />
        </View>
      )}

      {!loading && !error && odpady.length > 0 && viewMode === 'list' && (
        <FlatList
          data={odpady}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.primary} />}
          renderItem={({ item }) => {
            const { hlavny, sub, urgent } = formatDatum(item.datum)
            return (
              <AnimatedEntrance>
              <View style={[styles.card, urgent && styles.cardUrgent]}>
                <View style={[styles.colorBar, { backgroundColor: item.typ.farba }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.typBadge, { backgroundColor: item.typ.farba + '1A' }]}>
                      <Icon name="odpady" size={14} color={item.typ.farba} />
                      <Text style={[styles.typText, { color: item.typ.farba }]}>{item.typ.nazov}</Text>
                    </View>
                    {item.poznamka && <Text style={styles.poznamka}>{item.poznamka}</Text>}
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.denText, urgent && styles.denUrgent]}>{hlavny}</Text>
                    <Text style={styles.datumText}>{sub}</Text>
                  </View>
                </View>
              </View>
              </AnimatedEntrance>
            )
          }}
        />
      )}

      {!loading && !error && odpady.length > 0 && viewMode === 'month' && (
        <MesacnyKalendar odpady={odpady} />
      )}
    </SafeAreaView>
  )
}

// ─── Mesačný kalendár ───────────────────────────────────────────────────────
type OdpadItem = ReturnType<typeof useOdpady>['odpady'][number]

const MESIACE_SK = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December',
]

function MesacnyKalendar({ odpady }: { odpady: OdpadItem[] }) {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const [zobrazeny, setZobrazeny] = useState(new Date())
  const [vybrany, setVybrany] = useState<Date | null>(null)

  const podlaDna = useMemo(() => {
    const m: Record<string, OdpadItem[]> = {}
    odpady.forEach(o => {
      const key = new Date(o.datum).toISOString().split('T')[0]
      if (!m[key]) m[key] = []
      m[key].push(o)
    })
    return m
  }, [odpady])

  const rok = zobrazeny.getFullYear()
  const mesiac = zobrazeny.getMonth()
  const prvyDen = new Date(rok, mesiac, 1)
  const dniVMesiaci = new Date(rok, mesiac + 1, 0).getDate()
  const startDay = (prvyDen.getDay() + 6) % 7
  const dnes = new Date()

  const vybranyKey = vybrany ? vybrany.toISOString().split('T')[0] : null
  const odpadyVybranehoDna = vybranyKey ? podlaDna[vybranyKey] ?? [] : []

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= dniVMesiaci; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  function predchadzajuci() { setZobrazeny(new Date(rok, mesiac - 1, 1)); setVybrany(null) }
  function nasledujuci() { setZobrazeny(new Date(rok, mesiac + 1, 1)); setVybrany(null) }
  function keyFor(d: number) { return new Date(rok, mesiac, d).toISOString().split('T')[0] }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
      {/* Mesiac navigátor */}
      <View style={styles.monthNav}>
        <PressableScale onPress={predchadzajuci} style={styles.navBtn} scaleTo={0.9} accessibilityLabel="Predchádzajúci mesiac">
          <Icon name="chevronBack" size={20} color={t.primary} />
        </PressableScale>
        <Text style={styles.monthTitle}>{MESIACE_SK[mesiac]} {rok}</Text>
        <PressableScale onPress={nasledujuci} style={styles.navBtn} scaleTo={0.9} accessibilityLabel="Nasledujúci mesiac">
          <Icon name="chevron" size={20} color={t.primary} />
        </PressableScale>
      </View>

      {/* Hlavička dní */}
      <View style={styles.weekHeader}>
        {['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map((d, i) => (
          <Text key={d} style={[styles.weekDay, (i === 5 || i === 6) && { color: t.textMuted }]}>{d}</Text>
        ))}
      </View>

      {/* Grid dní */}
      <View style={styles.calendarGrid}>
        {cells.map((d, idx) => {
          if (d === null) {
            return <View key={idx} style={styles.dayCell}><View style={styles.dayCellInner} /></View>
          }
          const key = keyFor(d)
          const odpadyTohoDna = podlaDna[key] ?? []
          const isToday = dnes.getFullYear() === rok && dnes.getMonth() === mesiac && dnes.getDate() === d
          const isSelected = vybranyKey === key
          const maOdpad = odpadyTohoDna.length > 0
          return (
            <View key={idx} style={styles.dayCell}>
              <TouchableOpacity
                style={[styles.dayCellInner, isToday && !maOdpad && styles.dayCellToday, isSelected && styles.dayCellSelected]}
                activeOpacity={0.7}
                onPress={() => setVybrany(new Date(rok, mesiac, d))}
              >
                {maOdpad && (
                  <View style={styles.dayBgWrap} pointerEvents="none">
                    {odpadyTohoDna.map((o, i) => (
                      <View key={i} style={{ flex: 1, backgroundColor: o.typ.farba }} />
                    ))}
                  </View>
                )}
                <Text style={[styles.dayNum, isToday && !maOdpad && styles.dayNumToday, maOdpad && styles.dayNumOnColor]}>{d}</Text>
                {maOdpad && (
                  <View style={styles.typBlock}>
                    {odpadyTohoDna.slice(0, 2).map((o, i) => (
                      <Text key={i} style={styles.typLabel} numberOfLines={1} ellipsizeMode="tail">{o.typ.nazov}</Text>
                    ))}
                    {odpadyTohoDna.length > 2 && <Text style={styles.typMoreText}>+{odpadyTohoDna.length - 2} ďalší</Text>}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )
        })}
      </View>

      {/* Detail vybraného dňa */}
      <View style={styles.detailBox}>
        {vybrany ? (
          <>
            <Text style={styles.detailTitle}>
              {vybrany.toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            {odpadyVybranehoDna.length === 0 ? (
              <Text style={styles.detailEmpty}>V tento deň nie je naplánovaný žiadny vývoz.</Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {odpadyVybranehoDna.map(o => (
                  <View key={o.id} style={styles.detailRow}>
                    <View style={[styles.detailBar, { backgroundColor: o.typ.farba }]} />
                    <View style={{ flex: 1 }}>
                      <View style={[styles.typBadge, { backgroundColor: o.typ.farba + '1A', alignSelf: 'flex-start' }]}>
                        <Icon name="odpady" size={14} color={o.typ.farba} />
                        <Text style={[styles.typText, { color: o.typ.farba }]}>{o.typ.nazov}</Text>
                      </View>
                      {o.poznamka && <Text style={[styles.poznamka, { marginTop: 4 }]}>{o.poznamka}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.detailHint}>Klepnite na deň pre zobrazenie typov odpadu.</Text>
        )}
      </View>
    </ScrollView>
  )
}

// ─── Štýly (theme-aware factory) ────────────────────────────────────────────
const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  centerPad: { flex: 1, justifyContent: 'center' },
  loadingText: { ...typo.caption, color: t.textMuted, marginTop: spacing.sm },

  modeBar: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm,
    backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.borderLight,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5,
    paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: t.surfaceAlt,
    borderWidth: 1, borderColor: 'transparent',
  },
  modeBtnActive: { backgroundColor: t.primaryLight, borderColor: t.primary },
  modeBtnText: { fontSize: 12, fontWeight: '700', color: t.textMuted },
  modeBtnTextActive: { color: t.primary },

  list: { padding: spacing.lg, gap: spacing.sm },
  card: {
    backgroundColor: t.surface, borderRadius: radius.lg, flexDirection: 'row', overflow: 'hidden',
    shadowColor: t.shadow, ...shadows.sm,
  },
  cardUrgent: { ...shadows.md, shadowColor: t.shadow },
  colorBar: { width: 5 },
  cardContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  cardLeft: { flex: 1, gap: 4 },
  cardRight: { alignItems: 'flex-end' },
  typBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  typText: { fontSize: 13, fontWeight: '800' },
  poznamka: { ...typo.caption, color: t.textMuted },
  denText: { ...typo.h3, color: t.text },
  denUrgent: { color: t.primary },
  datumText: { ...typo.micro, color: t.textPlaceholder, marginTop: 2 },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.borderLight,
  },
  monthTitle: { ...typo.h2, color: t.text, textTransform: 'capitalize' },
  navBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: t.primaryLight, justifyContent: 'center', alignItems: 'center' },

  weekHeader: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, backgroundColor: t.surface },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', color: t.textSecondary, letterSpacing: 0.5 },

  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6, paddingVertical: 4, backgroundColor: t.surface },
  dayCell: { width: `${100 / 7}%`, padding: 2 },
  dayCellInner: {
    aspectRatio: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 4,
    borderRadius: radius.sm, overflow: 'hidden', position: 'relative',
  },
  dayCellToday: { backgroundColor: t.primaryLight },
  dayCellSelected: { borderWidth: 3, borderColor: t.accent },
  dayBgWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'column' },
  dayNum: { fontSize: 14, fontWeight: '700', color: t.text },
  dayNumToday: { color: t.primary, fontWeight: '900' },
  dayNumOnColor: {
    color: '#FFFFFF', fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  typBlock: { position: 'absolute', bottom: 4, left: 2, right: 2, alignItems: 'center', gap: 1 },
  typLabel: {
    color: '#FFFFFF', fontSize: 10, fontWeight: '800', textAlign: 'center', letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, maxWidth: '100%',
  },
  typMoreText: {
    color: 'rgba(255,255,255,0.9)', fontSize: 9, fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1,
  },

  detailBox: {
    margin: spacing.lg, padding: spacing.md, backgroundColor: t.surface, borderRadius: radius.lg,
    minHeight: 100, shadowColor: t.shadow, ...shadows.sm,
  },
  detailTitle: { ...typo.bodyB, color: t.text, textTransform: 'capitalize', marginBottom: spacing.md },
  detailEmpty: { ...typo.caption, color: t.textMuted, fontStyle: 'italic' },
  detailHint: { ...typo.caption, color: t.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: t.background, borderRadius: radius.md, padding: spacing.md },
  detailBar: { width: 4, height: 28, borderRadius: 2 },
})
