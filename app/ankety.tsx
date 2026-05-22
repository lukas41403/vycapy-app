/**
 * Ankety — občania hlasujú o otázkach obecného úradu.
 *
 * Zoznam aktívnych ankiet, kliknutie na anketu otvorí hlasovací panel
 * s tromi tlačidlami: Pre / Proti / Zdržiavam sa.
 * Po hlasovaní sa zobrazí výsledok v percentách a počet hlasov.
 *
 * Identifikácia hlasujúceho: device-level ID (v memory pre demo).
 * V produkcii uložiť do SecureStore.
 */

import { C } from '@/constants/colors'
import {
    Anketa,
    Odpoved,
    useAktivneAnkety,
    useAnketaVysledok,
} from '@/src/hooks/useAnkety'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

const ANKETA_FIALOVA = '#7B1FA2'
const ANKETA_LIGHT = '#F3E5F5'

export default function AnketyScreen() {
  const router = useRouter()
  const { ankety, loading, error, reload } = useAktivneAnkety()

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={ANKETA_FIALOVA} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Späť</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.headerEmoji}>🗳️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Ankety obce</Text>
            <Text style={styles.headerSub}>Vyjadrite svoj názor</Text>
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ANKETA_FIALOVA} />
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Nepodarilo sa načítať ankety</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Text style={styles.errorHint}>
            Tip: vytvorte tabuľky ankety a hlasy v Supabase (SQL je v komentári v src/hooks/useAnkety.ts).
          </Text>
          <TouchableOpacity style={styles.errorBtn} onPress={reload}>
            <Text style={styles.errorBtnText}>Skúsiť znova</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && ankety.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🗳️</Text>
          <Text style={styles.emptyTitle}>Žiadne aktívne ankety</Text>
          <Text style={styles.emptyText}>
            Momentálne neprebieha žiadne hlasovanie. Sledujte appku — keď
            starosta zverejní novú otázku, dáme vám vedieť.
          </Text>
        </View>
      )}

      {!loading && !error && ankety.length > 0 && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {ankety.map(a => <AnketaKarta key={a.id} anketa={a} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function AnketaKarta({ anketa }: { anketa: Anketa }) {
  const { vysledok, hlasuj } = useAnketaVysledok(anketa.id)
  const [posielam, setPosielam] = useState<Odpoved | null>(null)

  const total = vysledok.total
  const pct = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100)

  async function hlasujKlik(o: Odpoved) {
    if (vysledok.mojHlas) {
      Alert.alert('Už ste hlasovali', 'V tejto ankete ste už zaznamenali svoj hlas.')
      return
    }
    setPosielam(o)
    try {
      await hlasuj(o)
      Alert.alert('Ďakujeme!', 'Váš hlas bol zaznamenaný.')
    } catch (e: any) {
      Alert.alert('Chyba', e?.message ?? 'Hlas sa nepodarilo odoslať.')
    } finally {
      setPosielam(null)
    }
  }

  const deadlineStr = anketa.deadline
    ? new Date(anketa.deadline).toLocaleDateString('sk-SK', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <View style={styles.karta}>
      <Text style={styles.otazka}>{anketa.otazka}</Text>
      {anketa.popis && <Text style={styles.popis}>{anketa.popis}</Text>}

      {deadlineStr && (
        <Text style={styles.deadline}>⏰ Hlasovanie končí: {deadlineStr}</Text>
      )}

      {/* Tlačidlá hlasovania */}
      {!vysledok.mojHlas ? (
        <View style={styles.btnRow}>
          <HlasBtn
            label="✓ Pre"
            color={C.secondary}
            disabled={posielam !== null}
            loading={posielam === 'pre'}
            onPress={() => hlasujKlik('pre')}
          />
          <HlasBtn
            label="✗ Proti"
            color={C.brand.red}
            disabled={posielam !== null}
            loading={posielam === 'proti'}
            onPress={() => hlasujKlik('proti')}
          />
          <HlasBtn
            label="? Zdržiavam"
            color="#757575"
            disabled={posielam !== null}
            loading={posielam === 'zdrziavam'}
            onPress={() => hlasujKlik('zdrziavam')}
          />
        </View>
      ) : (
        <View style={styles.mojHlasBox}>
          <Text style={styles.mojHlasText}>
            ✓ Hlasoval(a) ste: <Text style={{ fontWeight: '900' }}>
              {vysledok.mojHlas === 'pre' ? 'Pre'
                : vysledok.mojHlas === 'proti' ? 'Proti' : 'Zdržiavam sa'}
            </Text>
          </Text>
        </View>
      )}

      {/* Výsledky */}
      {total > 0 && (
        <View style={styles.vysledky}>
          <Text style={styles.vysledkyTitul}>Výsledky ({total} {total === 1 ? 'hlas' : total < 5 ? 'hlasy' : 'hlasov'})</Text>
          <VysledokBar label="Pre"          n={vysledok.pre}        pct={pct(vysledok.pre)}        color={C.secondary} />
          <VysledokBar label="Proti"        n={vysledok.proti}      pct={pct(vysledok.proti)}      color={C.brand.red} />
          <VysledokBar label="Zdržiavam sa" n={vysledok.zdrziavam}  pct={pct(vysledok.zdrziavam)}  color="#757575" />
        </View>
      )}
    </View>
  )
}

function HlasBtn({ label, color, disabled, loading, onPress }: {
  label: string
  color: string
  disabled: boolean
  loading: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.hlasBtn, { backgroundColor: color }, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color="#fff" />
        : <Text style={styles.hlasBtnText}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

function VysledokBar({ label, n, pct, color }: {
  label: string
  n: number
  pct: number
  color: string
}) {
  return (
    <View style={styles.vysledokRow}>
      <Text style={styles.vysledokLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.vysledokPct, { color }]}>{pct}%</Text>
      <Text style={styles.vysledokN}>({n})</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  header: {
    backgroundColor: ANKETA_FIALOVA,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18,
  },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerEmoji: { fontSize: 38 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 8 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 19 },

  errorBox: { margin: 16, padding: 16, backgroundColor: C.surface, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: C.brand.red, gap: 6 },
  errorTitle: { fontSize: 15, fontWeight: '800', color: C.brand.red },
  errorMsg: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },
  errorHint: { fontSize: 12, color: C.textMuted, lineHeight: 18, marginTop: 4 },
  errorBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: ANKETA_FIALOVA, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  errorBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  list: { padding: 16, gap: 14 },

  karta: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
    gap: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: ANKETA_FIALOVA,
  },
  otazka: {
    fontSize: 17, fontWeight: '800', color: C.text,
    lineHeight: 23, letterSpacing: -0.2,
  },
  popis: { fontSize: 14, color: C.textSecondary, lineHeight: 20 },
  deadline: { fontSize: 12, color: C.textMuted, fontWeight: '600' },

  btnRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  hlasBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  hlasBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  mojHlasBox: {
    backgroundColor: ANKETA_LIGHT,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    alignItems: 'center',
  },
  mojHlasText: { color: ANKETA_FIALOVA, fontWeight: '700', fontSize: 13 },

  vysledky: {
    borderTopWidth: 1,
    borderTopColor: C.divider,
    paddingTop: 12,
    marginTop: 8,
    gap: 8,
  },
  vysledkyTitul: {
    fontSize: 11, fontWeight: '800', color: C.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4,
  },
  vysledokRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vysledokLabel: { fontSize: 12, color: C.textSecondary, width: 90, fontWeight: '600' },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: C.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  vysledokPct: { fontSize: 12, fontWeight: '800', width: 36, textAlign: 'right' },
  vysledokN: { fontSize: 11, color: C.textPlaceholder, width: 30 },
})
