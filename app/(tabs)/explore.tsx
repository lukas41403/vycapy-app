/**
 * Odpadový kalendár — 2 zobrazenia:
 *   - list (default): chronologický zoznam najbližších vývozov
 *   - month: kalendárový grid s farebnými bodkami pre dni s vývozom
 */

import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { useOdpady } from '@/src/hooks/useOdpady'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

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

export default function OdpadyScreen() {
  const { odpady, loading, error, refresh } = useOdpady()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <AppHeader
        title="Odpadový kalendár"
        subtitle="Najbližšie vývozy odpadu"
      />

      {!loading && !error && odpady.length > 0 && (
        <View style={styles.modeBar}>
          <ModeBtn
            label="☰ Zoznam"
            active={viewMode === 'list'}
            onPress={() => setViewMode('list')}
          />
          <ModeBtn
            label="📅 Mesiac"
            active={viewMode === 'month'}
            onPress={() => setViewMode('month')}
          />
        </View>
      )}

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Načítavam...</Text>
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Chyba pri načítaní</Text>
        </View>
      )}

      {!loading && !error && odpady.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyTitle}>Žiadne plánované vývozy</Text>
          <Text style={styles.emptyText}>
            Harmonogram bude doplnený. Skontrolujte oficiálnu stránku obce.
          </Text>
        </View>
      )}

      {!loading && !error && odpady.length > 0 && viewMode === 'list' && (
        <FlatList
          data={odpady}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
          }
          renderItem={({ item }) => {
            const { hlavny, sub, urgent } = formatDatum(item.datum)
            return (
              <View style={[styles.card, urgent && styles.cardUrgent]}>
                <View style={[styles.colorBar, { backgroundColor: item.typ.farba }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.typBadge, { backgroundColor: item.typ.farba + '22' }]}>
                      <Text style={[styles.typText, { color: item.typ.farba }]}>
                        {item.typ.nazov}
                      </Text>
                    </View>
                    {item.poznamka && (
                      <Text style={styles.poznamka}>{item.poznamka}</Text>
                    )}
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={[styles.denText, urgent && styles.denUrgent]}>{hlavny}</Text>
                    <Text style={styles.datumText}>{sub}</Text>
                  </View>
                </View>
              </View>
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

// ─── Mode button ────────────────────────────────────────────────────────────
function ModeBtn({ label, active, onPress }: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.modeBtn, active && styles.modeBtnActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

// ─── Mesačný kalendár ───────────────────────────────────────────────────────
type OdpadItem = ReturnType<typeof useOdpady>['odpady'][number]

const MESIACE_SK = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December',
]

function MesacnyKalendar({ odpady }: { odpady: OdpadItem[] }) {
  const [zobrazeny, setZobrazeny] = useState(new Date())
  const [vybrany, setVybrany] = useState<Date | null>(null)

  // Mapa "YYYY-MM-DD" → list odpadov v ten deň
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
  // Po=1, Ut=2, ..., Ne=7. JS getDay vracia Ne=0, takže prepočet:
  const startDay = (prvyDen.getDay() + 6) % 7 // 0=Po
  const dnes = new Date()

  // Vybrané dni
  const vybranyKey = vybrany ? vybrany.toISOString().split('T')[0] : null
  const odpadyVybranehoDna = vybranyKey ? podlaDna[vybranyKey] ?? [] : []

  // Pole buniek (5-6 týždňov)
  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= dniVMesiaci; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  function predchadzajuci() {
    setZobrazeny(new Date(rok, mesiac - 1, 1))
    setVybrany(null)
  }
  function nasledujuci() {
    setZobrazeny(new Date(rok, mesiac + 1, 1))
    setVybrany(null)
  }

  function keyFor(d: number) {
    const date = new Date(rok, mesiac, d)
    return date.toISOString().split('T')[0]
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Mesiac navigátor */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={predchadzajuci} style={styles.navBtn}>
          <Text style={styles.navBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MESIACE_SK[mesiac]} {rok}</Text>
        <TouchableOpacity onPress={nasledujuci} style={styles.navBtn}>
          <Text style={styles.navBtnText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Hlavička dní */}
      <View style={styles.weekHeader}>
        {['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'].map((d, i) => (
          <Text
            key={d}
            style={[
              styles.weekDay,
              (i === 5 || i === 6) && { color: C.textMuted },
            ]}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Grid dní */}
      <View style={styles.calendarGrid}>
        {cells.map((d, idx) => {
          if (d === null) {
            return (
              <View key={idx} style={styles.dayCell}>
                <View style={styles.dayCellInner} />
              </View>
            )
          }
          const key = keyFor(d)
          const odpadyTohoDna = podlaDna[key] ?? []
          const isToday =
            dnes.getFullYear() === rok &&
            dnes.getMonth() === mesiac &&
            dnes.getDate() === d
          const isSelected = vybranyKey === key
          const maOdpad = odpadyTohoDna.length > 0

          // Pri viacerých typoch v jeden deň rozdelíme bunku na farebné pruhy.
          // Pri jednom type celá bunka vyfarbená.
          return (
            <View key={idx} style={styles.dayCell}>
              <TouchableOpacity
                style={[
                  styles.dayCellInner,
                  isToday && !maOdpad && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                ]}
                activeOpacity={0.7}
                onPress={() => setVybrany(new Date(rok, mesiac, d))}
              >
                {/* Farebné pozadie podľa typu(ov) odpadu */}
                {maOdpad && (
                  <View style={styles.dayBgWrap} pointerEvents="none">
                    {odpadyTohoDna.map((o, i) => (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          backgroundColor: o.typ.farba,
                        }}
                      />
                    ))}
                  </View>
                )}

                {/* Číslo dňa */}
                <Text style={[
                  styles.dayNum,
                  isToday && !maOdpad && styles.dayNumToday,
                  maOdpad && styles.dayNumOnColor,
                ]}>
                  {d}
                </Text>

                {/* Názvy typov odpadu — biele písmo na farebnom pozadí */}
                {maOdpad && (
                  <View style={styles.typBlock}>
                    {odpadyTohoDna.slice(0, 2).map((o, i) => (
                      <Text
                        key={i}
                        style={styles.typLabel}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {o.typ.nazov}
                      </Text>
                    ))}
                    {odpadyTohoDna.length > 2 && (
                      <Text style={styles.typMoreText}>
                        +{odpadyTohoDna.length - 2} ďalší
                      </Text>
                    )}
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
              {vybrany.toLocaleDateString('sk-SK', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </Text>
            {odpadyVybranehoDna.length === 0 ? (
              <Text style={styles.detailEmpty}>V tento deň nie je naplánovaný žiadny vývoz.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {odpadyVybranehoDna.map(o => (
                  <View key={o.id} style={styles.detailRow}>
                    <View style={[styles.detailBar, { backgroundColor: o.typ.farba }]} />
                    <View style={{ flex: 1 }}>
                      <View style={[styles.typBadge, { backgroundColor: o.typ.farba + '22', alignSelf: 'flex-start' }]}>
                        <Text style={[styles.typText, { color: o.typ.farba }]}>
                          {o.typ.nazov}
                        </Text>
                      </View>
                      {o.poznamka && (
                        <Text style={[styles.poznamka, { marginTop: 4 }]}>{o.poznamka}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.detailHint}>
            Klikni na deň pre zobrazenie typov odpadu.
          </Text>
        )}
      </View>
    </ScrollView>
  )
}

// ─── Štýly ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingText: { color: C.textMuted, fontSize: 14, marginTop: 8 },
  errorIcon: { fontSize: 36 },
  errorText: { color: C.brand.red, fontSize: 15 },

  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, gap: 8,
  },
  emptyIcon: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyText: {
    fontSize: 14, color: C.textMuted, textAlign: 'center',
    lineHeight: 20, marginTop: 4,
  },

  // Mode bar
  modeBar: {
    flexDirection: 'row',
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 8,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  modeBtn: {
    flex: 1, paddingVertical: 8,
    borderRadius: 8, backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  modeBtnActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  modeBtnText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  modeBtnTextActive: { color: C.primary },

  // LIST
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: C.surface, borderRadius: 14,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardUrgent: { shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  colorBar: { width: 5 },
  cardContent: {
    flex: 1, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    padding: 14,
  },
  cardLeft: { flex: 1, gap: 4 },
  cardRight: { alignItems: 'flex-end' },
  typBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  typText: { fontSize: 13, fontWeight: '700' },
  poznamka: { fontSize: 12, color: C.textMuted },
  denText: { fontSize: 15, fontWeight: '700', color: C.text },
  denUrgent: { color: C.primary },
  datumText: { fontSize: 12, color: C.textPlaceholder, marginTop: 2 },

  // Kalendár navigátor
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  monthTitle: {
    fontSize: 17, fontWeight: '800', color: C.text,
    textTransform: 'capitalize',
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  navBtnText: { fontSize: 18, fontWeight: '900', color: C.primary },

  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8, paddingVertical: 10,
    backgroundColor: C.surface,
  },
  weekDay: {
    flex: 1, textAlign: 'center',
    fontSize: 12, fontWeight: '800', color: C.textSecondary,
    letterSpacing: 0.5,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: C.surface,
  },
  dayCell: {
    // 7 stĺpcov bez gap (gap + width: 100/7% spôsobuje pretekanie)
    // Margin 2px na každú stranu vytvorí 4px efektívny gap medzi bunkami,
    // a bunka má `boxSizing: 'border-box'` semantiku v RN — všetko sa zmestí.
    width: `${100 / 7}%`,
    padding: 2,
    // aspectRatio aplikujeme na vnútorný wrapper aby gap fungoval správne
  },
  dayCellInner: {
    aspectRatio: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  dayCellToday: {
    backgroundColor: C.primaryLight,
  },
  dayCellSelected: {
    borderWidth: 3,
    borderColor: C.accent,
  },

  // Farebné pozadie pre dni s vývozom (vyplní celú bunku, pri 2+ typoch
  // sa rozdelí na rovnaké horizontálne pruhy).
  dayBgWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'column',
  },

  dayNum: { fontSize: 14, fontWeight: '700', color: C.text },
  dayNumToday: { color: C.primary, fontWeight: '900' },
  dayNumOnColor: {
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Názvy typov odpadu v bunke
  typBlock: {
    position: 'absolute',
    bottom: 4,
    left: 2,
    right: 2,
    alignItems: 'center',
    gap: 1,
  },
  typLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    maxWidth: '100%',
  },
  typMoreText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 9,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  // Detail vybraného dňa
  detailBox: {
    margin: 16,
    padding: 14,
    backgroundColor: C.surface,
    borderRadius: 14,
    minHeight: 100,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 14, fontWeight: '800', color: C.text,
    textTransform: 'capitalize',
    marginBottom: 10,
  },
  detailEmpty: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },
  detailHint: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 8 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.background,
    borderRadius: 10,
    padding: 10,
  },
  detailBar: { width: 4, height: 28, borderRadius: 2 },
})
