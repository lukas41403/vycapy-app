import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

type HistoriaZaznam = {
  novy_status: string
  stary_status: string
  created_at: string
}

type Hlasenie = {
  id: string
  kategoria: string
  popis: string
  adresa: string | null
  status: string
  created_at: string
  historia?: HistoriaZaznam[]
}

const STATUS_FARBY: Record<string, { bg: string; text: string; label: string }> = {
  nove:       { bg: '#E3F2FD', text: '#1565C0', label: 'Nové' },
  v_rieseni:  { bg: '#FFF8E1', text: '#F57F17', label: 'V riešení' },
  vyriesene:  { bg: '#E8F5E9', text: '#2E7D32', label: 'Vyriešené' },
  zamietnute: { bg: '#FFEBEE', text: '#C62828', label: 'Zamietnuté' },
}

const KATEGORIA_EMOJI: Record<string, string> = {
  cesta: '🛣️', osvietenie: '💡', zelen: '🌳',
  voda: '💧', odpad: '🗑️', ine: '📋',
}

const AKTUALITA_KATEGORIE = ['oznam', 'akcia', 'uzavierka', 'vypadok', 'sport', 'ine']
const AKTUALITA_KATEGORIE_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

const PODUJATIE_KATEGORIE = [
  { id: 'kultura', label: '🎭 Kultúra' },
  { id: 'sport', label: '⚽ Šport' },
  { id: 'slavnost', label: '🎉 Slávnosť' },
  { id: 'kino', label: '🎬 Kino' },
  { id: 'divadlo', label: '🎪 Divadlo' },
  { id: 'deti', label: '🎈 Pre deti' },
  { id: 'ine', label: '📅 Iné' },
]

export default function AdminScreen() {
  const [aktTab, setAktTab] = useState<'hlasenia' | 'aktuality' | 'podujatia'>('hlasenia')
  const [hlasenia, setHlasenia] = useState<Hlasenie[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/admin-login')
    })
  }, [])

  useEffect(() => {
    nacitajHlasenia()
  }, [])

  async function nacitajHlasenia() {
    setLoading(true)
    const { data } = await supabase
      .from('hlaseniaporuchy')
      .select(`
        id, kategoria, popis, adresa, status, created_at,
        historia:hlasenia_historia(novy_status, stary_status, created_at)
      `)
      .order('created_at', { ascending: false })
    setHlasenia((data as unknown as Hlasenie[]) || [])
    setLoading(false)
  }

  async function zmenStatus(id: string, novyStatus: string) {
    setUpdating(id)
    const stareHlasenie = hlasenia.find(h => h.id === id)
    await supabase.from('hlaseniaporuchy').update({ status: novyStatus }).eq('id', id)
    await supabase.from('hlasenia_historia').insert({
      hlasenie_id: id,
      stary_status: stareHlasenie?.status,
      novy_status: novyStatus,
    })
    await nacitajHlasenia()
    setUpdating(null)
  }

  const nove = hlasenia.filter(h => h.status === 'nove')

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>V–O</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin panel</Text>
            <Text style={styles.headerSub}>Výčapy-Opatovce</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await supabase.auth.signOut()
            router.replace('/admin-login')
          }}
        >
          <Text style={styles.logoutText}>Odhlásiť</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.taby}>
        <TouchableOpacity
          style={[styles.tab, aktTab === 'hlasenia' && styles.tabActive]}
          onPress={() => setAktTab('hlasenia')}
        >
          <Text style={[styles.tabText, aktTab === 'hlasenia' && styles.tabTextActive]}>
            ⚠️ Hlásenia {nove.length > 0 && `(${nove.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, aktTab === 'aktuality' && styles.tabActive]}
          onPress={() => setAktTab('aktuality')}
        >
          <Text style={[styles.tabText, aktTab === 'aktuality' && styles.tabTextActive]}>
            📰 Aktuality
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, aktTab === 'podujatia' && styles.tabActive]}
          onPress={() => setAktTab('podujatia')}
        >
          <Text style={[styles.tabText, aktTab === 'podujatia' && styles.tabTextActive]}>
            📅 Podujatia
          </Text>
        </TouchableOpacity>
      </View>

      {aktTab === 'hlasenia' ? (
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {nove.length > 0 && (
              <>
                <Text style={styles.sekcia}>🔴 Nové hlásenia ({nove.length})</Text>
                {nove.map(h => (
                  <HlasenieKarta key={h.id} hlasenie={h} updating={updating === h.id} onZmenStatus={zmenStatus} />
                ))}
              </>
            )}
            {hlasenia.filter(h => h.status !== 'nove').length > 0 && (
              <>
                <Text style={[styles.sekcia, { marginTop: 8 }]}>📋 Ostatné hlásenia</Text>
                {hlasenia.filter(h => h.status !== 'nove').map(h => (
                  <HlasenieKarta key={h.id} hlasenie={h} updating={updating === h.id} onZmenStatus={zmenStatus} />
                ))}
              </>
            )}
            {hlasenia.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>Žiadne hlásenia</Text>
              </View>
            )}
          </ScrollView>
        )
      ) : aktTab === 'aktuality' ? (
        <NovAktualitaForm />
      ) : (
        <NovePodujatieForm />
      )}
    </SafeAreaView>
  )
}

function NovAktualitaForm() {
  const [title, setTitle] = useState('')
  const [perex, setPerex] = useState('')
  const [body, setBody] = useState('')
  const [kategoria, setKategoria] = useState('oznam')
  const [loading, setLoading] = useState(false)
  const [publikovat, setPublikovat] = useState(true)

  async function publikovatAktualitu() {
    if (title.trim().length < 3) {
      Alert.alert('Chýba titulok', 'Titulok musí mať aspoň 3 znaky.')
      return
    }
    if (body.trim().length < 10) {
      Alert.alert('Chýba text', 'Text aktuality musí mať aspoň 10 znakov.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('aktuality').insert({
      title: title.trim(),
      perex: perex.trim() || null,
      body: body.trim(),
      kategoria,
      is_published: publikovat,
      published_at: publikovat ? new Date().toISOString() : null,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Chyba', 'Aktualitu sa nepodarilo uložiť.')
    } else {
      Alert.alert('Hotovo!', publikovat ? 'Aktualita bola publikovaná.' : 'Uložená ako koncept.')
      setTitle('')
      setPerex('')
      setBody('')
      setKategoria('oznam')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      <Text style={styles.sekcia}>✍️ Nová aktualita</Text>
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Kategória</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {AKTUALITA_KATEGORIE.map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.katBtn, kategoria === k && styles.katBtnActive]}
                onPress={() => setKategoria(k)}
              >
                <Text style={[styles.katBtnText, kategoria === k && styles.katBtnTextActive]}>
                  {AKTUALITA_KATEGORIE_LABEL[k]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.formLabel}>Titulok *</Text>
        <TextInput
          style={styles.input}
          placeholder="Titulok aktuality..."
          placeholderTextColor="#BBB"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.formLabel}>Perex (krátky úvod)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Krátky popis ktorý sa zobrazí v zozname..."
          placeholderTextColor="#BBB"
          value={perex}
          onChangeText={setPerex}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.formLabel}>Text aktuality *</Text>
        <TextInput
          style={[styles.input, { height: 160 }]}
          placeholder="Celý text aktuality..."
          placeholderTextColor="#BBB"
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.publikovatRow}>
          <Text style={styles.formLabel}>Publikovať ihneď</Text>
          <TouchableOpacity
            style={[styles.toggle, publikovat && styles.toggleActive]}
            onPress={() => setPublikovat(!publikovat)}
          >
            <View style={[styles.toggleKnob, publikovat && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={publikovatAktualitu}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>{publikovat ? '🚀 Publikovať' : '💾 Uložiť koncept'}</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function NovePodujatieForm() {
  const [title, setTitle] = useState('')
  const [popis, setPopis] = useState('')
  const [kategoria, setKategoria] = useState('ine')
  const [datumOd, setDatumOd] = useState('')
  const [cas, setCas] = useState('')
  const [miesto, setMiesto] = useState('')
  const [loading, setLoading] = useState(false)

  async function ulozPodujatie() {
    if (title.trim().length < 3) {
      Alert.alert('Chýba názov', 'Názov musí mať aspoň 3 znaky.')
      return
    }
    if (!datumOd) {
      Alert.alert('Chýba dátum', 'Zadajte dátum podujatia.')
      return
    }
    const datum = new Date(`${datumOd}T${cas || '00:00'}`)
    setLoading(true)
    const { error } = await supabase.from('podujatia').insert({
      title: title.trim(),
      popis: popis.trim() || null,
      kategoria,
      datum_od: datum.toISOString(),
      miesto: miesto.trim() || null,
      is_published: true,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Chyba', 'Podujatie sa nepodarilo uložiť.')
    } else {
      Alert.alert('Hotovo!', 'Podujatie bolo pridané do kalendára.')
      setTitle('')
      setPopis('')
      setDatumOd('')
      setCas('')
      setMiesto('')
      setKategoria('ine')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      <Text style={styles.sekcia}>📅 Nové podujatie</Text>
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Kategória</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PODUJATIE_KATEGORIE.map(k => (
              <TouchableOpacity
                key={k.id}
                style={[styles.katBtn, kategoria === k.id && styles.katBtnActive]}
                onPress={() => setKategoria(k.id)}
              >
                <Text style={[styles.katBtnText, kategoria === k.id && styles.katBtnTextActive]}>
                  {k.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.formLabel}>Názov podujatia *</Text>
        <TextInput
          style={styles.input}
          placeholder="napr. Deň obce 2026"
          placeholderTextColor="#BBB"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.formLabel}>Dátum * (RRRR-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="napr. 2026-06-15"
          placeholderTextColor="#BBB"
          value={datumOd}
          onChangeText={setDatumOd}
        />

        <Text style={styles.formLabel}>Čas (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="napr. 15:00"
          placeholderTextColor="#BBB"
          value={cas}
          onChangeText={setCas}
        />

        <Text style={styles.formLabel}>Miesto</Text>
        <TextInput
          style={styles.input}
          placeholder="napr. Kultúrny dom"
          placeholderTextColor="#BBB"
          value={miesto}
          onChangeText={setMiesto}
        />

        <Text style={styles.formLabel}>Popis</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Krátky popis podujatia..."
          placeholderTextColor="#BBB"
          value={popis}
          onChangeText={setPopis}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={ulozPodujatie}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>📅 Pridať do kalendára</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function HlasenieKarta({ hlasenie: h, updating, onZmenStatus }: {
  hlasenie: Hlasenie
  updating: boolean
  onZmenStatus: (id: string, status: string) => void
}) {
  const statusInfo = STATUS_FARBY[h.status] ?? STATUS_FARBY.nove
  const datum = new Date(h.created_at).toLocaleDateString('sk-SK', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  return (
    <View style={styles.karta}>
      <View style={styles.kartaHeader}>
        <Text style={styles.kartaEmoji}>{KATEGORIA_EMOJI[h.kategoria] ?? '📋'}</Text>
        <View style={styles.kartaInfo}>
          <Text style={styles.kartaKategoria}>{h.kategoria.toUpperCase()}</Text>
          <Text style={styles.kartaDatum}>{datum}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <Text style={styles.kartaPopis}>{h.popis}</Text>
      {h.adresa && <Text style={styles.kartaAdresa}>📍 {h.adresa}</Text>}

      {updating ? (
        <ActivityIndicator size="small" color="#2E7D32" style={{ marginTop: 12 }} />
      ) : (
        <View style={styles.akcie}>
          {h.status !== 'v_rieseni' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: '#FFF8E1' }]} onPress={() => onZmenStatus(h.id, 'v_rieseni')}>
              <Text style={[styles.akciaBtnText, { color: '#F57F17' }]}>V riešení</Text>
            </TouchableOpacity>
          )}
          {h.status !== 'vyriesene' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => onZmenStatus(h.id, 'vyriesene')}>
              <Text style={[styles.akciaBtnText, { color: '#2E7D32' }]}>Vyriešené ✓</Text>
            </TouchableOpacity>
          )}
          {h.status !== 'zamietnute' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => onZmenStatus(h.id, 'zamietnute')}>
              <Text style={[styles.akciaBtnText, { color: '#C62828' }]}>Zamietnuť</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {h.historia && h.historia.length > 0 && (
        <View style={styles.historiaContainer}>
          <Text style={styles.historiaTitle}>HISTÓRIA ZMIEN</Text>
          {h.historia
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((z, i) => (
              <View key={i} style={styles.historiaZaznam}>
                <Text style={styles.historiaText}>
                  {STATUS_FARBY[z.stary_status]?.label ?? z.stary_status} → {STATUS_FARBY[z.novy_status]?.label ?? z.novy_status}
                </Text>
                <Text style={styles.historiaDatum}>
                  {new Date(z.created_at).toLocaleDateString('sk-SK', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  taby: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#2E7D32' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#2E7D32' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  sekcia: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 4, marginTop: 4 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#1A1A1A', marginBottom: 16,
  },
  katBtn: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  katBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  katBtnText: { fontSize: 13, fontWeight: '600', color: '#666' },
  katBtnTextActive: { color: '#2E7D32' },
  publikovatRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: '#DDD', justifyContent: 'center', padding: 2,
  },
  toggleActive: { backgroundColor: '#2E7D32' },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  toggleKnobActive: { alignSelf: 'flex-end' },
  submitBtn: {
    backgroundColor: '#2E7D32', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  karta: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  kartaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  kartaEmoji: { fontSize: 28 },
  kartaInfo: { flex: 1 },
  kartaKategoria: { fontSize: 12, fontWeight: '800', color: '#333', letterSpacing: 0.5 },
  kartaDatum: { fontSize: 11, color: '#AAA', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  kartaPopis: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 6 },
  kartaAdresa: { fontSize: 12, color: '#888', marginBottom: 4 },
  akcie: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  akciaBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  akciaBtnText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: '600' },
  historiaContainer: {
    marginTop: 12, borderTopWidth: 1,
    borderTopColor: '#F0F0F0', paddingTop: 10, gap: 6,
  },
  historiaTitle: { fontSize: 10, fontWeight: '800', color: '#CCC', letterSpacing: 1, marginBottom: 4 },
  historiaZaznam: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historiaText: { fontSize: 12, color: '#666' },
  historiaDatum: { fontSize: 11, color: '#BBB' },
})