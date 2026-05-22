/**
 * Starosta dashboard — IoT a infraštruktúra obce.
 *
 * Sekcie:
 *   1. Verejné osvetlenie — toggle prepínače pre každú ulicu
 *   2. Senzory (read-only) — hladina potoka, teplota, kontajner
 *   3. Rýchle akcie — varovanie občanom, štatistiky
 *
 * Prístup: po prihlásení (rovnaký flow ako /admin).
 */

import { C } from '@/constants/colors'
import { useObecneZariadenia, Zariadenie } from '@/src/hooks/useObecneZariadenia'
import { odoslatVarovanie } from '@/src/lib/pushNotifications'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function StarostaDashboard() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const {
    zariadenia, loading, error, nacitaj,
    toggleStav, nastavitVsetkyOsvetlenia,
  } = useObecneZariadenia()

  // Push notifikácie modal
  const [pushOpen, setPushOpen] = useState(false)
  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  const [pushSending, setPushSending] = useState(false)

  async function poslaPush() {
    if (pushTitle.trim().length < 3 || pushBody.trim().length < 5) {
      Alert.alert('Vyplňte správu', 'Titulok aspoň 3 znaky, text aspoň 5 znakov.')
      return
    }
    setPushSending(true)
    try {
      const r = await odoslatVarovanie({
        title: pushTitle.trim(),
        body: pushBody.trim(),
      })
      Alert.alert(
        'Hotovo',
        `Odoslané: ${r.ok}\nChyby: ${r.chyba}\nCelkom tokenov: ${r.total}`,
      )
      setPushTitle(''); setPushBody(''); setPushOpen(false)
    } catch (e: any) {
      Alert.alert(
        'Chyba',
        e?.message ?? 'Push sa nepodarilo odoslať.' +
        '\n\nTip: vytvor tabuľku push_tokens v Supabase a nainštaluj `expo-notifications`.',
      )
    } finally {
      setPushSending(false)
    }
  }

  // Auth gate — rovnaký pattern ako v admin.tsx
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/admin-login')
      else setAuthChecked(true)
    })
  }, [router])

  if (!authChecked) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const osvetlenia = zariadenia.filter(z => z.typ === 'osvetlenie')
  const senzory = zariadenia.filter(z => z.typ !== 'osvetlenie')
  const zapnutych = osvetlenia.filter(o => o.stav).length

  function otvorPushModal() {
    setPushOpen(true)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.brand.redDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Späť</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={nacitaj}>
            <Text style={styles.refreshBtn}>↻ Obnoviť</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>💡 Starosta dashboard</Text>
        <Text style={styles.headerSub}>Ing. Jozef Holúbek · Správa obce</Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Nepodarilo sa načítať zariadenia</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Text style={styles.errorHint}>
            Tip: vytvorte tabuľku obecne_zariadenia v Supabase (SQL je v zadaní).
          </Text>
          <TouchableOpacity style={styles.errorBtn} onPress={nacitaj}>
            <Text style={styles.errorBtnText}>Skúsiť znova</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ─── SEKCIA 1: VEREJNÉ OSVETLENIE ──────────────────────── */}
          <Sekcia title="Verejné osvetlenie" sub={`${zapnutych} / ${osvetlenia.length} zapnutých`}>
            <View style={styles.hromadne}>
              <TouchableOpacity
                style={[styles.hromBtn, styles.hromBtnZap]}
                onPress={() => nastavitVsetkyOsvetlenia(true)}
              >
                <Text style={styles.hromBtnText}>💡 Všetko zapnúť</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.hromBtn, styles.hromBtnVyp]}
                onPress={() => nastavitVsetkyOsvetlenia(false)}
              >
                <Text style={styles.hromBtnText}>🌑 Všetko vypnúť</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.karta}>
              {osvetlenia.map((o, i) => (
                <View
                  key={o.id}
                  style={[
                    styles.osvRow,
                    i < osvetlenia.length - 1 && styles.osvRowBorder,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.osvNazov}>{o.nazov}</Text>
                    {o.ulica && <Text style={styles.osvUlica}>{o.ulica}</Text>}
                  </View>
                  <View style={styles.osvStav}>
                    <Text style={[
                      styles.osvStavText,
                      { color: o.stav ? C.secondary : C.textPlaceholder },
                    ]}>
                      {o.stav ? 'ZAP' : 'VYP'}
                    </Text>
                    <Switch
                      value={!!o.stav}
                      onValueChange={(v) => toggleStav(o.id, v)}
                      trackColor={{ false: C.border, true: C.secondary + '88' }}
                      thumbColor={o.stav ? C.secondary : '#F4F4F4'}
                      ios_backgroundColor={C.border}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Sekcia>

          {/* ─── SEKCIA 2: SENZORY ─────────────────────────────────── */}
          <Sekcia title="Senzory" sub="Aktuálne hodnoty (read-only)">
            <View style={{ gap: 10 }}>
              {senzory.map(s => <SenzorKarta key={s.id} z={s} />)}
              {senzory.length === 0 && (
                <Text style={styles.muted}>Žiadne senzory zatiaľ.</Text>
              )}
            </View>
          </Sekcia>

          {/* ─── SEKCIA 3: RÝCHLE AKCIE ────────────────────────────── */}
          <Sekcia title="Rýchle akcie">
            <TouchableOpacity
              style={styles.akciaBtn}
              activeOpacity={0.85}
              onPress={otvorPushModal}
            >
              <Text style={styles.akciaBtnEmoji}>🔴</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.akciaBtnTitle}>Poslať varovanie občanom</Text>
                <Text style={styles.akciaBtnSub}>Push notifikácia do appky</Text>
              </View>
              <Text style={styles.akciaBtnChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.akciaBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/admin' as never)}
            >
              <Text style={styles.akciaBtnEmoji}>📊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.akciaBtnTitle}>Štatistiky hlásení</Text>
                <Text style={styles.akciaBtnSub}>Otvor admin panel</Text>
              </View>
              <Text style={styles.akciaBtnChevron}>›</Text>
            </TouchableOpacity>
          </Sekcia>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* PUSH MODAL */}
      <Modal
        visible={pushOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPushOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🔴 Varovanie občanom</Text>
            <Text style={styles.modalSub}>
              Notifikácia príde všetkým, čo majú appku nainštalovanú.
            </Text>

            <Text style={styles.modalLabel}>Titulok</Text>
            <TextInput
              style={styles.modalInput}
              value={pushTitle}
              onChangeText={setPushTitle}
              placeholder="napr. Výpadok vody"
              placeholderTextColor={C.textPlaceholder}
              maxLength={60}
            />

            <Text style={styles.modalLabel}>Text správy</Text>
            <TextInput
              style={[styles.modalInput, { height: 100 }]}
              value={pushBody}
              onChangeText={setPushBody}
              placeholder="napr. Dnes 14:00–16:00 bude prerušená dodávka..."
              placeholderTextColor={C.textPlaceholder}
              multiline
              textAlignVertical="top"
              maxLength={240}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setPushOpen(false)}
              >
                <Text style={styles.modalBtnCancelText}>Zrušiť</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSend, pushSending && { opacity: 0.6 }]}
                onPress={poslaPush}
                disabled={pushSending}
              >
                {pushSending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalBtnSendText}>📨 Odoslať</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Sub-komponenty ────────────────────────────────────────────────────────
function Sekcia({ title, sub, children }: {
  title: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.sekcia}>
      <View style={styles.sekciaHead}>
        <Text style={styles.sekciaTitle}>{title}</Text>
        {sub && <Text style={styles.sekciaSub}>{sub}</Text>}
      </View>
      {children}
    </View>
  )
}

function SenzorKarta({ z }: { z: Zariadenie }) {
  const hodnota = z.posledna_hodnota
  const jednotka = z.jednotka ?? ''

  // ── Hladina potoka — farebný indikátor podľa hodnoty
  if (z.typ === 'senzor_vody') {
    const farba =
      hodnota == null ? C.textMuted :
      hodnota < 60 ? C.secondary :
      hodnota < 80 ? '#F57F17' :
      C.brand.red
    const stav =
      hodnota == null ? 'N/A' :
      hodnota < 60 ? 'V poriadku' :
      hodnota < 80 ? 'Zvýšená' :
      'Kritická'
    return (
      <View style={styles.karta}>
        <View style={styles.senRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.senLabel}>💧 {z.nazov}</Text>
            {z.ulica && <Text style={styles.osvUlica}>{z.ulica}</Text>}
            <View style={[styles.senBadge, { backgroundColor: farba + '22' }]}>
              <Text style={[styles.senBadgeText, { color: farba }]}>{stav}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.senHodnota, { color: farba }]}>
              {hodnota ?? '—'}<Text style={styles.senJednotka}>{jednotka}</Text>
            </Text>
          </View>
        </View>
      </View>
    )
  }

  // ── Kontajner — progress bar
  if (z.typ === 'kontajner') {
    const pct = Math.min(100, Math.max(0, hodnota ?? 0))
    const farba = pct < 50 ? C.secondary : pct < 80 ? '#F57F17' : C.brand.red
    return (
      <View style={styles.karta}>
        <Text style={styles.senLabel}>🗑️ {z.nazov}</Text>
        {z.ulica && <Text style={styles.osvUlica}>{z.ulica}</Text>}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: farba }]} />
        </View>
        <Text style={[styles.progressText, { color: farba }]}>
          {pct}% naplnené
        </Text>
      </View>
    )
  }

  // ── Meteo / iné — jednoduchá hodnota
  return (
    <View style={styles.karta}>
      <View style={styles.senRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.senLabel}>
            {z.typ === 'meteo' ? '🌡️ ' : '📡 '}{z.nazov}
          </Text>
          {z.ulica && <Text style={styles.osvUlica}>{z.ulica}</Text>}
        </View>
        <Text style={styles.senHodnota}>
          {hodnota ?? '—'}<Text style={styles.senJednotka}>{jednotka}</Text>
        </Text>
      </View>
    </View>
  )
}

// ─── Štýly ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: C.brand.redDark,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 8,
  },
  backBtn: { color: C.onPrimary, fontSize: 15, fontWeight: '700' },
  refreshBtn: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  headerTitle: {
    color: C.onPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -0.3,
  },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },

  errorBox: { margin: 16, padding: 16, backgroundColor: C.surface, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: C.primary, gap: 6 },
  errorTitle: { fontSize: 15, fontWeight: '800', color: C.primary },
  errorMsg: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },
  errorHint: { fontSize: 12, color: C.textMuted, lineHeight: 18, marginTop: 4 },
  errorBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  errorBtnText: { color: C.onPrimary, fontWeight: '700', fontSize: 14 },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  sekcia: { marginBottom: 24 },
  sekciaHead: { marginBottom: 10 },
  sekciaTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sekciaSub: { fontSize: 12, color: C.textPlaceholder, marginTop: 2 },

  // Hromadné akcie
  hromadne: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  hromBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  hromBtnZap: { backgroundColor: C.secondaryLight },
  hromBtnVyp: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  hromBtnText: { fontSize: 13, fontWeight: '700', color: C.text },

  karta: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  // Osvetlenie row
  osvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  osvRowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  osvNazov: { fontSize: 14, fontWeight: '700', color: C.text },
  osvUlica: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  osvStav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  osvStavText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, width: 28, textAlign: 'right' },

  // Senzor karta
  senRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  senLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  senHodnota: { fontSize: 26, fontWeight: '800', color: C.text },
  senJednotka: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  senBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  senBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  // Progress
  progressTrack: {
    height: 12,
    backgroundColor: C.surfaceAlt,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: { height: '100%', borderRadius: 6 },
  progressText: { fontSize: 12, fontWeight: '700', marginTop: 6 },

  muted: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },

  // Akcie buttons
  akciaBtn: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  akciaBtnEmoji: { fontSize: 28 },
  akciaBtnTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  akciaBtnSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  akciaBtnChevron: { fontSize: 28, color: C.textPlaceholder, fontWeight: '300' },

  // Modal pre push
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '900', color: C.brand.red,
  },
  modalSub: {
    fontSize: 12, color: C.textMuted, marginBottom: 6,
  },
  modalLabel: {
    fontSize: 12, fontWeight: '700', color: C.textSecondary,
    marginTop: 8, marginBottom: 4,
  },
  modalInput: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: C.text,
    borderWidth: 1, borderColor: C.border,
  },
  modalActions: {
    flexDirection: 'row', gap: 10, marginTop: 14,
  },
  modalBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.border,
  },
  modalBtnCancelText: { color: C.text, fontWeight: '700', fontSize: 14 },
  modalBtnSend: { backgroundColor: C.brand.red },
  modalBtnSendText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
