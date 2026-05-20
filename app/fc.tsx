/**
 * FC Výčapy-Opatovce — sekcia futbalového klubu.
 *
 * Interný tab bar (nie bottom nav):
 *   📅 Program  — nadchádzajúce zápasy
 *   📊 Výsledky — odohraté zápasy
 *   👥 Hráči    — kádra rozdelená podľa pozícií
 *   🔗 Futbalnet — odkaz na oficiálnu stránku
 */

import { C } from '@/constants/colors'
import { Hrac, useFcHraci, useFcZapasy, Zapas } from '@/src/hooks/useFc'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const FC_GREEN = '#1B5E20'
const FC_GREEN_LIGHT = '#E8F5E9'
const FUTBALNET_URL =
  'https://sportnet.sme.sk/futbalnet/k/zdruzenie-fc-vycapy-opatovce/tim/dospeli-m-a/program/'

type TabKey = 'program' | 'vysledky' | 'hraci' | 'futbalnet'

export default function FcScreen() {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('program')

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={FC_GREEN} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Späť</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>FC</Text>
            <Text style={styles.logoVO}>V-O</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>FC Výčapy-Opatovce</Text>
            <Text style={styles.headerSub}>Oblastná liga Nitra · Sezóna 2025/26</Text>
          </View>
        </View>
      </View>

      {/* Interný tab bar */}
      <View style={styles.tabBar}>
        {([
          { id: 'program',   emoji: '📅', label: 'Program'  },
          { id: 'vysledky',  emoji: '📊', label: 'Výsledky' },
          { id: 'hraci',     emoji: '👥', label: 'Hráči'    },
          { id: 'futbalnet', emoji: '🔗', label: 'Futbalnet'},
        ] as const).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text
              style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}
              numberOfLines={1}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Obsah */}
      {tab === 'program'   && <ProgramTab />}
      {tab === 'vysledky'  && <VysledkyTab />}
      {tab === 'hraci'     && <HraciTab />}
      {tab === 'futbalnet' && <FutbalnetTab />}
    </SafeAreaView>
  )
}

// ─── Program ───────────────────────────────────────────────────────────────
function ProgramTab() {
  const { zapasy, loading, error } = useFcZapasy()
  const [view, setView] = useState<'list' | 'month'>('list')
  const nadchadzajuce = zapasy
    .filter(z => z.goly_my == null)
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())

  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} hint="Skontroluj že tabuľka fc_zapasy existuje v Supabase." />

  if (nadchadzajuce.length === 0) {
    return <Empty emoji="📅" title="Žiadne nadchádzajúce zápasy" />
  }

  // Group by month for month view
  const podlaMesiaca = nadchadzajuce.reduce((acc, z) => {
    const m = new Date(z.datum).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })
    const key = m.charAt(0).toUpperCase() + m.slice(1)
    if (!acc[key]) acc[key] = []
    acc[key].push(z)
    return acc
  }, {} as Record<string, typeof nadchadzajuce>)

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      <View style={styles.fcModeBar}>
        <TouchableOpacity
          style={[styles.fcModeBtn, view === 'list' && styles.fcModeBtnActive]}
          onPress={() => setView('list')}
        >
          <Text style={[styles.fcModeBtnText, view === 'list' && styles.fcModeBtnTextActive]}>
            ☰ Zoznam
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fcModeBtn, view === 'month' && styles.fcModeBtnActive]}
          onPress={() => setView('month')}
        >
          <Text style={[styles.fcModeBtnText, view === 'month' && styles.fcModeBtnTextActive]}>
            📅 Mesiac
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'list' ? (
        nadchadzajuce.map(z => <ZapasKarta key={z.id} zapas={z} typ="program" />)
      ) : (
        Object.entries(podlaMesiaca).map(([m, zList]) => (
          <View key={m} style={{ gap: 12, marginBottom: 8 }}>
            <View style={styles.fcMonthHeader}>
              <View style={styles.fcMonthLine} />
              <Text style={styles.fcMonthLabel}>{m}</Text>
              <View style={styles.fcMonthLine} />
            </View>
            {zList.map(z => <ZapasKarta key={z.id} zapas={z} typ="program" />)}
          </View>
        ))
      )}
    </ScrollView>
  )
}

// ─── Výsledky ──────────────────────────────────────────────────────────────
function VysledkyTab() {
  const { zapasy, loading, error } = useFcZapasy()
  const odohrate = zapasy
    .filter(z => z.goly_my != null && z.goly_supar != null)
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())

  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} hint="Skontroluj že tabuľka fc_zapasy existuje v Supabase." />

  if (odohrate.length === 0) {
    return <Empty emoji="📊" title="Žiadne odohraté zápasy" />
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {odohrate.map(z => <ZapasKarta key={z.id} zapas={z} typ="vysledok" />)}
    </ScrollView>
  )
}

function ZapasKarta({ zapas, typ }: { zapas: Zapas; typ: 'program' | 'vysledok' }) {
  const datum = new Date(zapas.datum)
  const denStr = datum.toLocaleDateString('sk-SK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const cas = datum.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })

  const open = () => {
    if (zapas.futbalnet_url) Linking.openURL(zapas.futbalnet_url)
  }

  // Výsledok výpočet
  let vysledokTyp: 'vyhra' | 'prehra' | 'remiza' | null = null
  if (typ === 'vysledok' && zapas.goly_my != null && zapas.goly_supar != null) {
    if (zapas.goly_my > zapas.goly_supar) vysledokTyp = 'vyhra'
    else if (zapas.goly_my < zapas.goly_supar) vysledokTyp = 'prehra'
    else vysledokTyp = 'remiza'
  }
  const vysledokConfig = {
    vyhra:  { label: '✓ Výhra',  color: FC_GREEN, bg: FC_GREEN_LIGHT },
    prehra: { label: '✗ Prehra', color: C.brand.red, bg: C.primaryLight },
    remiza: { label: '= Remíza', color: '#616161',  bg: '#EEEEEE' },
  }

  return (
    <TouchableOpacity
      style={styles.zapasKarta}
      activeOpacity={zapas.futbalnet_url ? 0.85 : 1}
      onPress={open}
    >
      {/* horný riadok: doma/vonku */}
      <View style={styles.zapasTop}>
        <View style={[
          styles.domaBadge,
          { backgroundColor: zapas.je_doma ? FC_GREEN_LIGHT : '#ECEFF1' }
        ]}>
          <Text style={[
            styles.domaText,
            { color: zapas.je_doma ? FC_GREEN : '#37474F' }
          ]}>
            {zapas.je_doma ? '🏠 DOMA' : '✈️ VONKU'}
          </Text>
        </View>
        {typ === 'vysledok' && vysledokTyp && (
          <View style={[styles.vysledokBadge, { backgroundColor: vysledokConfig[vysledokTyp].bg }]}>
            <Text style={[styles.vysledokBadgeText, { color: vysledokConfig[vysledokTyp].color }]}>
              {vysledokConfig[vysledokTyp].label}
            </Text>
          </View>
        )}
      </View>

      {/* tímy + výsledok */}
      {typ === 'program' ? (
        <Text style={styles.zapasTitle}>vs {zapas.supar}</Text>
      ) : (
        <View style={styles.skoreRow}>
          <Text style={styles.skoreTeam}>FC V-O</Text>
          <View style={styles.skoreBox}>
            <Text style={[
              styles.skoreText,
              vysledokTyp === 'vyhra' && { color: FC_GREEN },
              vysledokTyp === 'prehra' && { color: C.brand.red },
            ]}>
              {zapas.goly_my} : {zapas.goly_supar}
            </Text>
          </View>
          <Text style={styles.skoreTeam} numberOfLines={1}>{zapas.supar}</Text>
        </View>
      )}

      {/* meta */}
      <View style={styles.zapasMeta}>
        <Text style={styles.zapasMetaText}>📅 {denStr.charAt(0).toUpperCase() + denStr.slice(1)}</Text>
        {typ === 'program' && (
          <Text style={styles.zapasMetaText}>⏰ {cas}</Text>
        )}
        {zapas.miesto && (
          <Text style={styles.zapasMetaText}>📍 {zapas.miesto}</Text>
        )}
        <Text style={styles.zapasMetaText}>🏆 {zapas.sutaz}</Text>
      </View>

      {typ === 'program' && zapas.futbalnet_url && (
        <View style={styles.zapasFooter}>
          <Text style={styles.zapasLink}>Detail na Futbalnet →</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

// ─── Hráči ─────────────────────────────────────────────────────────────────
function HraciTab() {
  const { hraci, loading, error } = useFcHraci()

  if (loading) return <Loading />
  if (error) return <ErrorBox msg={error} hint="Skontroluj že tabuľka fc_hraci existuje v Supabase." />

  const treneri = hraci.filter(h => h.je_trener)
  const brankari = hraci.filter(h => !h.je_trener && h.pozicia === 'brankár')
  const obrancovia = hraci.filter(h => !h.je_trener && h.pozicia === 'obranca')
  const zaloznici = hraci.filter(h => !h.je_trener && h.pozicia === 'záložník')
  const utocnici = hraci.filter(h => !h.je_trener && h.pozicia === 'útočník')

  if (hraci.length === 0) {
    return <Empty emoji="👥" title="Káder zatiaľ neuvedený" />
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {treneri.length > 0 && (
        <HraciSekcia titul="🎯 Tréneri" hraci={treneri} jeTrener />
      )}
      {brankari.length > 0   && <HraciSekcia titul="🥅 Brankári"   hraci={brankari} />}
      {obrancovia.length > 0 && <HraciSekcia titul="🛡️ Obrancovia" hraci={obrancovia} />}
      {zaloznici.length > 0  && <HraciSekcia titul="⚙️ Záložníci"  hraci={zaloznici} />}
      {utocnici.length > 0   && <HraciSekcia titul="⚔️ Útočníci"   hraci={utocnici} />}
    </ScrollView>
  )
}

function HraciSekcia({ titul, hraci, jeTrener }: {
  titul: string
  hraci: Hrac[]
  jeTrener?: boolean
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.hraciSekciaTitul}>{titul}</Text>
      <View style={styles.hraciGrid}>
        {hraci.map(h => (
          <View key={h.id} style={styles.hracKarta}>
            <View style={[styles.hracCislo, jeTrener && styles.hracCisloTrener]}>
              <Text style={[styles.hracCisloText, jeTrener && styles.hracCisloTrenerText]}>
                {jeTrener ? 'T' : (h.cislo_dresu ?? '–')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hracMeno} numberOfLines={1}>{h.meno}</Text>
              <Text style={styles.hracPriezvisko} numberOfLines={1}>{h.priezvisko}</Text>
              {!jeTrener && (
                <Text style={styles.hracPozicia}>{h.pozicia}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── Futbalnet tab ─────────────────────────────────────────────────────────
function FutbalnetTab() {
  return (
    <ScrollView contentContainerStyle={styles.futbalnetWrap} showsVerticalScrollIndicator={false}>
      <View style={styles.futbalnetCard}>
        <View style={styles.futbalnetLogo}>
          <Text style={styles.futbalnetLogoText}>FN</Text>
        </View>
        <Text style={styles.futbalnetTitle}>Futbalnet.sk</Text>
        <Text style={styles.futbalnetSub}>
          Oficiálne výsledky, tabuľka a program pre FC Výčapy-Opatovce
          v Oblastnej lige Nitra.
        </Text>

        <TouchableOpacity
          style={styles.futbalnetBtn}
          activeOpacity={0.85}
          onPress={() => Linking.openURL(FUTBALNET_URL)}
        >
          <Text style={styles.futbalnetBtnText}>Otvoriť Futbalnet →</Text>
        </TouchableOpacity>

        <Text style={styles.futbalnetUrl} numberOfLines={1}>
          sportnet.sme.sk/futbalnet/...
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>O klube</Text>
        <Text style={styles.infoText}>
          FC Výčapy-Opatovce pôsobí v Oblastnej lige Nitra. Domáce zápasy hráme
          na obecnom ihrisku v športovom areáli. Pravidelné tréningy, mládežnícke
          družstvá aj reprezentačný A-tím — sledujte nás na Futbalnet.sk.
        </Text>
      </View>
    </ScrollView>
  )
}

// ─── Pomocné komponenty ────────────────────────────────────────────────────
function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={FC_GREEN} />
    </View>
  )
}

function ErrorBox({ msg, hint }: { msg: string; hint?: string }) {
  return (
    <View style={{ padding: 16 }}>
      <View style={[styles.errBox, { borderLeftColor: C.brand.red }]}>
        <Text style={styles.errTitle}>Nepodarilo sa načítať dáta</Text>
        <Text style={styles.errMsg}>{msg}</Text>
        {hint && <Text style={styles.errHint}>{hint}</Text>}
      </View>
    </View>
  )
}

function Empty({ emoji, title }: { emoji: string; title: string }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 56 }}>{emoji}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginTop: 8 }}>{title}</Text>
    </View>
  )
}

// ─── Štýly ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  // Header
  header: {
    backgroundColor: FC_GREEN,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
  },
  back: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  logoText: { color: FC_GREEN, fontSize: 14, fontWeight: '900', lineHeight: 16 },
  logoVO: { color: FC_GREEN, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  headerTitle: {
    color: '#FFFFFF', fontSize: 20, fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 10, paddingHorizontal: 4,
    alignItems: 'center', gap: 2,
  },
  tabActive: { borderBottomWidth: 3, borderBottomColor: FC_GREEN },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: C.textMuted },
  tabLabelActive: { color: FC_GREEN, fontWeight: '800' },

  // List a karty
  list: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  zapasKarta: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    gap: 10,
  },
  zapasTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  domaBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  domaText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  vysledokBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  vysledokBadgeText: { fontSize: 11, fontWeight: '800' },

  zapasTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  skoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skoreTeam: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  skoreBox: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: C.surfaceAlt,
    borderRadius: 10,
    minWidth: 78, alignItems: 'center',
  },
  skoreText: { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 1 },

  zapasMeta: { gap: 4 },
  zapasMetaText: { fontSize: 13, color: C.textSecondary },

  zapasFooter: {
    borderTopWidth: 1, borderTopColor: C.divider,
    paddingTop: 10, marginTop: 4,
  },
  zapasLink: { fontSize: 13, fontWeight: '700', color: FC_GREEN },

  // Hráči
  hraciSekciaTitul: {
    fontSize: 12, fontWeight: '800', color: C.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 8,
  },
  hraciGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hracKarta: {
    flexBasis: '48%', flexGrow: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  hracCislo: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: FC_GREEN,
    justifyContent: 'center', alignItems: 'center',
  },
  hracCisloTrener: { backgroundColor: C.brand.gold },
  hracCisloText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  hracCisloTrenerText: { color: '#5D4037' },
  hracMeno: { fontSize: 12, color: C.textMuted },
  hracPriezvisko: { fontSize: 14, fontWeight: '800', color: C.text },
  hracPozicia: { fontSize: 10, color: C.textPlaceholder, textTransform: 'uppercase', letterSpacing: 0.3 },

  // Futbalnet
  futbalnetWrap: { padding: 16, gap: 14 },
  futbalnetCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 24, alignItems: 'center', gap: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  futbalnetLogo: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: FC_GREEN,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  futbalnetLogoText: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  futbalnetTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  futbalnetSub: {
    fontSize: 14, color: C.textSecondary,
    textAlign: 'center', lineHeight: 21,
    marginBottom: 8, paddingHorizontal: 8,
  },
  futbalnetBtn: {
    backgroundColor: FC_GREEN,
    borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 28,
    alignSelf: 'stretch', alignItems: 'center',
  },
  futbalnetBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  futbalnetUrl: { fontSize: 11, color: C.textPlaceholder, marginTop: 4 },

  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 14, padding: 16, gap: 8,
    borderLeftWidth: 4, borderLeftColor: FC_GREEN,
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  infoText: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },

  // Error
  errBox: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    borderLeftWidth: 4, gap: 6,
  },
  errTitle: { fontSize: 14, fontWeight: '800', color: C.brand.red },
  errMsg: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },
  errHint: { fontSize: 12, color: C.textMuted, lineHeight: 18 },

  // Mode bar v Program tabe
  fcModeBar: {
    flexDirection: 'row', gap: 8, marginBottom: 4,
  },
  fcModeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: C.surfaceAlt, alignItems: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  fcModeBtnActive: { backgroundColor: FC_GREEN_LIGHT, borderColor: FC_GREEN },
  fcModeBtnText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  fcModeBtnTextActive: { color: FC_GREEN },

  fcMonthHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 4, marginBottom: 4,
  },
  fcMonthLine: { flex: 1, height: 1, backgroundColor: C.border },
  fcMonthLabel: {
    fontSize: 12, fontWeight: '800', color: C.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
})
