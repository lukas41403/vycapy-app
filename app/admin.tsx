import { ErbBadge } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { Image } from 'expo-image'
// ── expo-image-picker ─────────────────────────────────────────────────────
// Akonáhle spustíš `npx expo install expo-image-picker`, odkomentuj nasledovný
// riadok a zmaž `ImagePicker = null` fallback nižšie.
// import * as ImagePicker from 'expo-image-picker'
const ImagePicker: any = null
// ──────────────────────────────────────────────────────────────────────────
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
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
  foto_urls: string[] | null
  status: string
  created_at: string
  historia?: HistoriaZaznam[]
}

type AktualitaItem = {
  id: string
  title: string
  is_published: boolean
  published_at: string | null
  kategoria: string
}

type PrenajomZiadost = {
  id: string
  meno: string
  email: string
  telefon: string
  datum: string
  cas_od: string
  cas_do: string
  ucel: string
  pocet_osob: number | null
  poznamka: string | null
  status: string | null
  created_at: string
}

const PRENAJOM_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  nove:       { bg: C.status.info.bg,    text: C.status.info.fg,    label: 'Nové' },
  schvalene:  { bg: C.status.success.bg, text: C.status.success.fg, label: 'Schválené' },
  zamietnute: { bg: C.status.danger.bg,  text: C.status.danger.fg,  label: 'Zamietnuté' },
}

const UCEL_LABEL: Record<string, string> = {
  sport: '⚽ Šport / tréning',
  kultura: '🎭 Kultúrna akcia',
  oslava: '🎉 Oslava / party',
  firemne: '💼 Firemné podujatie',
  ine: '📋 Iné',
}

const STATUS_FARBY: Record<string, { bg: string; text: string; label: string }> = {
  nove:       { bg: C.status.info.bg,    text: C.status.info.fg,    label: 'Nové' },
  v_rieseni:  { bg: C.status.warning.bg, text: C.status.warning.fg, label: 'V riešení' },
  vyriesene:  { bg: C.status.success.bg, text: C.status.success.fg, label: 'Vyriešené' },
  zamietnute: { bg: C.status.danger.bg,  text: C.status.danger.fg,  label: 'Zamietnuté' },
}

// status objekt používa { bg, fg } v C.status — premapujeme tu na { bg, text }
function statusInfoFor(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    nove:       { bg: C.status.info.bg,    text: C.status.info.fg,    label: 'Nové' },
    v_rieseni:  { bg: C.status.warning.bg, text: C.status.warning.fg, label: 'V riešení' },
    vyriesene:  { bg: C.status.success.bg, text: C.status.success.fg, label: 'Vyriešené' },
    zamietnute: { bg: C.status.danger.bg,  text: C.status.danger.fg,  label: 'Zamietnuté' },
  }
  return map[status] ?? map.nove
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
  const [aktTab, setAktTab] = useState<'hlasenia' | 'aktuality' | 'podujatia' | 'prenajmy' | 'ankety'>('hlasenia')
  const [hlasenia, setHlasenia] = useState<Hlasenie[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  // Auth gating — kým neoveríme session, render nič, aby admin obsah nikdy
  // neflikol pred redirectom na login.
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/admin-login')
      } else {
        setAuthChecked(true)
      }
    })
  }, [router])

  useEffect(() => {
    if (authChecked) nacitajHlasenia()
  }, [authChecked])

  async function nacitajHlasenia() {
    setLoading(true)
    const { data } = await supabase
      .from('hlaseniaporuchy')
      .select(`
        id, kategoria, popis, adresa, foto_urls, status, created_at,
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

  // Pred overením session nezobrazíme nič, aby nikto nevidel admin obsah
  if (!authChecked) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const nove = hlasenia.filter(h => h.status === 'nove')

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <ErbBadge variant="brand" />
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
          <Text
            style={[styles.tabText, aktTab === 'hlasenia' && styles.tabTextActive]}
            numberOfLines={1}
          >
            ⚠️ Hlásenia{nove.length > 0 ? ` (${nove.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, aktTab === 'aktuality' && styles.tabActive]}
          onPress={() => setAktTab('aktuality')}
        >
          <Text
            style={[styles.tabText, aktTab === 'aktuality' && styles.tabTextActive]}
            numberOfLines={1}
          >
            📰 Aktuality
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, aktTab === 'podujatia' && styles.tabActive]}
          onPress={() => setAktTab('podujatia')}
        >
          <Text
            style={[styles.tabText, aktTab === 'podujatia' && styles.tabTextActive]}
            numberOfLines={1}
          >
            📅 Podujatia
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, aktTab === 'prenajmy' && styles.tabActive]}
          onPress={() => setAktTab('prenajmy')}
        >
          <Text
            style={[styles.tabText, aktTab === 'prenajmy' && styles.tabTextActive]}
            numberOfLines={1}
          >
            🏟️ Prenájmy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, aktTab === 'ankety' && styles.tabActive]}
          onPress={() => setAktTab('ankety')}
        >
          <Text
            style={[styles.tabText, aktTab === 'ankety' && styles.tabTextActive]}
            numberOfLines={1}
          >
            🗳️ Ankety
          </Text>
        </TouchableOpacity>
      </View>

      {aktTab === 'hlasenia' ? (
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.primary} />
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
      ) : aktTab === 'podujatia' ? (
        <NovePodujatieForm />
      ) : aktTab === 'prenajmy' ? (
        <PrenajmyZoznam />
      ) : (
        <AnketyAdminPanel />
      )}
    </SafeAreaView>
  )
}

function NovAktualitaForm() {
  const [podtab, setPodtab] = useState<'nova' | 'zoznam'>('nova')
  const [aktuality, setAktuality] = useState<AktualitaItem[]>([])
  const [nacitavam, setNacitavam] = useState(false)
  const [title, setTitle] = useState('')
  const [perex, setPerex] = useState('')
  const [body, setBody] = useState('')
  const [kategoria, setKategoria] = useState('oznam')
  const [loading, setLoading] = useState(false)
  const [publikovat, setPublikovat] = useState(true)
  const [coverUri, setCoverUri] = useState<string | null>(null)

  async function vybratCover() {
    if (!ImagePicker) {
      Alert.alert(
        'Foto funkcia',
        'Pre nahrávanie cover fotky nainštaluj balík expo-image-picker:\n\n' +
        'npx expo install expo-image-picker\n\n' +
        'Potom odkomentuj `import * as ImagePicker` v admin.tsx.',
      )
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [16, 9],
      allowsEditing: true,
    })
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri)
    }
  }

  async function nacitajAktuality() {
    setNacitavam(true)
    const { data } = await supabase
      .from('aktuality')
      .select('id, title, is_published, published_at, kategoria')
      .order('created_at', { ascending: false })
      .limit(30)
    setAktuality(data || [])
    setNacitavam(false)
  }

  async function zmazAktualitu(id: string) {
    Alert.alert('Zmazať?', 'Naozaj chcete zmazať túto aktualitu?', [
      { text: 'Zrušiť', style: 'cancel' },
      {
        text: 'Zmazať', style: 'destructive',
        onPress: async () => {
          await supabase.from('aktuality').delete().eq('id', id)
          nacitajAktuality()
        }
      }
    ])
  }

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

    // Upload cover ak je vybraný
    let coverUrl: string | null = null
    if (coverUri) {
      try {
        const fileName = `cover-${Date.now()}.jpg`
        const response = await fetch(coverUri)
        const blob = await response.blob()
        const { data, error: upErr } = await supabase.storage
          .from('aktuality-covers')
          .upload(fileName, blob, { contentType: 'image/jpeg' })
        if (!upErr && data) {
          const { data: urlData } = supabase.storage
            .from('aktuality-covers')
            .getPublicUrl(data.path)
          coverUrl = urlData.publicUrl
        }
      } catch (e) {
        console.warn('Cover upload zlyhal:', e)
      }
    }

    const { error } = await supabase.from('aktuality').insert({
      title: title.trim(),
      perex: perex.trim() || null,
      body: body.trim(),
      kategoria,
      cover_url: coverUrl,
      is_published: publikovat,
      published_at: publikovat ? new Date().toISOString() : null,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Chyba', 'Aktualitu sa nepodarilo uložiť.\n\n' + error.message)
    } else {
      Alert.alert('Hotovo!', publikovat ? 'Aktualita bola publikovaná.' : 'Uložená ako koncept.')
      setTitle(''); setPerex(''); setBody(''); setKategoria('oznam'); setCoverUri(null)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.podtaby}>
        <TouchableOpacity
          style={[styles.podtab, podtab === 'nova' && styles.podtabActive]}
          onPress={() => setPodtab('nova')}
        >
          <Text style={[styles.podtabText, podtab === 'nova' && styles.podtabTextActive]}>✍️ Nová</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.podtab, podtab === 'zoznam' && styles.podtabActive]}
          onPress={() => { setPodtab('zoznam'); nacitajAktuality() }}
        >
          <Text style={[styles.podtabText, podtab === 'zoznam' && styles.podtabTextActive]}>📋 Zoznam</Text>
        </TouchableOpacity>
      </View>

      {podtab === 'nova' ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.formLabel}>Cover fotka (voliteľné)</Text>
            <TouchableOpacity onPress={vybratCover} style={styles.coverPickerBtn} activeOpacity={0.8}>
              {coverUri ? (
                <View>
                  <Image
                    source={{ uri: coverUri }}
                    style={{ width: '100%', height: 160, borderRadius: 10 }}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.coverRemove}
                    onPress={() => setCoverUri(null)}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.coverPickerPlaceholder}>
                  <Text style={{ fontSize: 32 }}>🖼️</Text>
                  <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 8, fontWeight: '600' }}>
                    Klikni pre výber fotky
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textPlaceholder, marginTop: 2 }}>
                    Pomer 16:9 odporúčaný
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.formLabel}>Titulok *</Text>
            <TextInput style={styles.input} placeholder="Titulok aktuality..."
              placeholderTextColor={C.textPlaceholder} value={title} onChangeText={setTitle} />
            <Text style={styles.formLabel}>Perex (krátky úvod)</Text>
            <TextInput style={[styles.input, { height: 80 }]}
              placeholder="Krátky popis..." placeholderTextColor={C.textPlaceholder}
              value={perex} onChangeText={setPerex} multiline textAlignVertical="top" />
            <Text style={styles.formLabel}>Text aktuality *</Text>
            <TextInput style={[styles.input, { height: 160 }]}
              placeholder="Celý text..." placeholderTextColor={C.textPlaceholder}
              value={body} onChangeText={setBody} multiline textAlignVertical="top" />
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
              onPress={publikovatAktualitu} disabled={loading}
            >
              {loading ? <ActivityIndicator color={C.onPrimary} />
                : <Text style={styles.submitBtnText}>{publikovat ? '🚀 Publikovať' : '💾 Uložiť koncept'}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {nacitavam ? (
            <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
          ) : aktuality.map(a => (
            <View key={a.id} style={styles.karta}>
              <View style={styles.kartaHeader}>
                <View style={styles.kartaInfo}>
                  <Text style={styles.kartaKategoria}>
                    {AKTUALITA_KATEGORIE_LABEL[a.kategoria]?.toUpperCase()}
                  </Text>
                  <Text style={styles.kartaPopis} numberOfLines={2}>{a.title}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: a.is_published ? C.status.success.bg : C.status.warning.bg }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: a.is_published ? C.status.success.fg : C.status.warning.fg }
                  ]}>
                    {a.is_published ? 'Pub.' : 'Koncept'}
                  </Text>
                </View>
              </View>
              <Text style={styles.kartaDatum}>
                {a.published_at
                  ? new Date(a.published_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Nepublikovaná'}
              </Text>
              <TouchableOpacity
                style={[styles.akciaBtn, { backgroundColor: C.status.danger.bg, marginTop: 10, alignSelf: 'flex-start' }]}
                onPress={() => zmazAktualitu(a.id)}
              >
                <Text style={[styles.akciaBtnText, { color: C.status.danger.fg }]}>🗑️ Zmazať</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
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
      setTitle(''); setPopis(''); setDatumOd(''); setCas(''); setMiesto(''); setKategoria('ine')
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
        <TextInput style={styles.input} placeholder="napr. Deň obce 2026"
          placeholderTextColor={C.textPlaceholder} value={title} onChangeText={setTitle} />
        <Text style={styles.formLabel}>Dátum * (RRRR-MM-DD)</Text>
        <TextInput style={styles.input} placeholder="napr. 2026-06-15"
          placeholderTextColor={C.textPlaceholder} value={datumOd} onChangeText={setDatumOd} />
        <Text style={styles.formLabel}>Čas (HH:MM)</Text>
        <TextInput style={styles.input} placeholder="napr. 15:00"
          placeholderTextColor={C.textPlaceholder} value={cas} onChangeText={setCas} />
        <Text style={styles.formLabel}>Miesto</Text>
        <TextInput style={styles.input} placeholder="napr. Kultúrny dom"
          placeholderTextColor={C.textPlaceholder} value={miesto} onChangeText={setMiesto} />
        <Text style={styles.formLabel}>Popis</Text>
        <TextInput style={[styles.input, { height: 100 }]}
          placeholder="Krátky popis podujatia..."
          placeholderTextColor={C.textPlaceholder} value={popis} onChangeText={setPopis}
          multiline textAlignVertical="top" />
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={ulozPodujatie} disabled={loading}
        >
          {loading ? <ActivityIndicator color={C.onPrimary} />
            : <Text style={styles.submitBtnText}>📅 Pridať do kalendára</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function PrenajmyZoznam() {
  const [ziadosti, setZiadosti] = useState<PrenajomZiadost[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [chyba, setChyba] = useState<string | null>(null)

  useEffect(() => {
    nacitaj()
  }, [])

  async function nacitaj() {
    setLoading(true)
    setChyba(null)
    const { data, error } = await supabase
      .from('prenajom_haly')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // Najčastejšie: stĺpec `status` ešte v tabuľke neexistuje
      setChyba(error.message)
      setZiadosti([])
    } else {
      setZiadosti((data as PrenajomZiadost[]) || [])
    }
    setLoading(false)
  }

  async function zmenStatus(id: string, novyStatus: string) {
    setUpdating(id)
    const { error } = await supabase
      .from('prenajom_haly')
      .update({ status: novyStatus })
      .eq('id', id)
    if (error) {
      Alert.alert('Chyba', 'Stav sa nepodarilo zmeniť.\n\n' + error.message)
    } else {
      await nacitaj()
    }
    setUpdating(null)
  }

  function statusOf(z: PrenajomZiadost) {
    return PRENAJOM_STATUS[z.status || 'nove'] ?? PRENAJOM_STATUS.nove
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  if (chyba) {
    return (
      <View style={[styles.list, { gap: 12 }]}>
        <View style={[styles.formCard, { borderLeftWidth: 4, borderLeftColor: C.primary }]}>
          <Text style={[styles.formLabel, { color: C.primary }]}>Nepodarilo sa načítať prenájmy</Text>
          <Text style={{ fontSize: 13, color: C.textSecondary, lineHeight: 19 }}>{chyba}</Text>
          <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 8, lineHeight: 18 }}>
            Tip: skontrolujte, či má tabuľka prenajom_haly stĺpec status (text, default &apos;nove&apos;).
          </Text>
          <TouchableOpacity style={[styles.submitBtn, { marginTop: 12 }]} onPress={nacitaj}>
            <Text style={styles.submitBtnText}>Skúsiť znova</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const nove = ziadosti.filter(z => (z.status || 'nove') === 'nove')
  const ostatne = ziadosti.filter(z => (z.status || 'nove') !== 'nove')

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {nove.length > 0 && (
        <>
          <Text style={styles.sekcia}>🔴 Nové žiadosti ({nove.length})</Text>
          {nove.map(z => (
            <PrenajomKarta
              key={z.id}
              ziadost={z}
              statusInfo={statusOf(z)}
              updating={updating === z.id}
              onZmenStatus={zmenStatus}
            />
          ))}
        </>
      )}
      {ostatne.length > 0 && (
        <>
          <Text style={[styles.sekcia, { marginTop: 8 }]}>📋 Spracované žiadosti</Text>
          {ostatne.map(z => (
            <PrenajomKarta
              key={z.id}
              ziadost={z}
              statusInfo={statusOf(z)}
              updating={updating === z.id}
              onZmenStatus={zmenStatus}
            />
          ))}
        </>
      )}
      {ziadosti.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏟️</Text>
          <Text style={styles.emptyText}>Žiadne žiadosti o prenájom</Text>
        </View>
      )}
    </ScrollView>
  )
}

function PrenajomKarta({
  ziadost: z,
  statusInfo,
  updating,
  onZmenStatus,
}: {
  ziadost: PrenajomZiadost
  statusInfo: { bg: string; text: string; label: string }
  updating: boolean
  onZmenStatus: (id: string, status: string) => void
}) {
  const datumPrenajmu = new Date(z.datum).toLocaleDateString('sk-SK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const datumPrijatia = new Date(z.created_at).toLocaleDateString('sk-SK', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  const aktStatus = z.status || 'nove'

  return (
    <View style={styles.karta}>
      <View style={styles.kartaHeader}>
        <View style={styles.kartaInfo}>
          <Text style={styles.kartaKategoria}>{UCEL_LABEL[z.ucel] ?? z.ucel}</Text>
          <Text style={styles.kartaPopis} numberOfLines={1}>{z.meno}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <View style={prenajomStyles.detailGrid}>
        <View style={prenajomStyles.detailRow}>
          <Text style={prenajomStyles.detailIcon}>📅</Text>
          <Text style={prenajomStyles.detailText}>
            {datumPrenajmu.charAt(0).toUpperCase() + datumPrenajmu.slice(1)}
          </Text>
        </View>
        <View style={prenajomStyles.detailRow}>
          <Text style={prenajomStyles.detailIcon}>⏰</Text>
          <Text style={prenajomStyles.detailText}>{z.cas_od} – {z.cas_do}</Text>
        </View>
        {z.pocet_osob != null && (
          <View style={prenajomStyles.detailRow}>
            <Text style={prenajomStyles.detailIcon}>👥</Text>
            <Text style={prenajomStyles.detailText}>{z.pocet_osob} osôb</Text>
          </View>
        )}
      </View>

      {z.poznamka && (
        <Text style={prenajomStyles.poznamka}>„{z.poznamka}"</Text>
      )}

      <View style={prenajomStyles.kontakty}>
        <TouchableOpacity
          style={prenajomStyles.kontaktBtn}
          onPress={() => Linking.openURL(`tel:${z.telefon.replace(/\s/g, '')}`)}
        >
          <Text style={prenajomStyles.kontaktBtnText}>📞 {z.telefon}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[prenajomStyles.kontaktBtn, prenajomStyles.kontaktBtnEmail]}
          onPress={() => Linking.openURL(`mailto:${z.email}`)}
        >
          <Text style={[prenajomStyles.kontaktBtnText, prenajomStyles.kontaktBtnEmailText]}>
            ✉️ {z.email}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={prenajomStyles.prijate}>Prijaté: {datumPrijatia}</Text>

      {updating ? (
        <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 12 }} />
      ) : (
        <View style={styles.akcie}>
          {aktStatus !== 'schvalene' && (
            <TouchableOpacity
              style={[styles.akciaBtn, { backgroundColor: C.status.success.bg }]}
              onPress={() => onZmenStatus(z.id, 'schvalene')}
            >
              <Text style={[styles.akciaBtnText, { color: C.status.success.fg }]}>Schváliť ✓</Text>
            </TouchableOpacity>
          )}
          {aktStatus !== 'zamietnute' && (
            <TouchableOpacity
              style={[styles.akciaBtn, { backgroundColor: C.status.danger.bg }]}
              onPress={() => onZmenStatus(z.id, 'zamietnute')}
            >
              <Text style={[styles.akciaBtnText, { color: C.status.danger.fg }]}>Zamietnuť</Text>
            </TouchableOpacity>
          )}
          {aktStatus !== 'nove' && (
            <TouchableOpacity
              style={[styles.akciaBtn, { backgroundColor: C.status.info.bg }]}
              onPress={() => onZmenStatus(z.id, 'nove')}
            >
              <Text style={[styles.akciaBtnText, { color: C.status.info.fg }]}>Označiť ako nové</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const prenajomStyles = StyleSheet.create({
  detailGrid: {
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { fontSize: 14, width: 18 },
  detailText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  poznamka: {
    fontSize: 13,
    color: C.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
    backgroundColor: C.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  kontakty: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  kontaktBtn: {
    backgroundColor: C.secondaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  kontaktBtnEmail: { backgroundColor: C.status.info.bg },
  kontaktBtnText: { fontSize: 12, fontWeight: '700', color: C.secondary },
  kontaktBtnEmailText: { color: C.status.info.fg },
  prijate: {
    fontSize: 11, color: C.textPlaceholder, marginTop: 2,
  },
})

function AnketyAdminPanel() {
  const [podtab, setPodtab] = useState<'nova' | 'zoznam'>('nova')
  const [otazka, setOtazka] = useState('')
  const [popis, setPopis] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [ankety, setAnkety] = useState<any[]>([])
  const [nacitavam, setNacitavam] = useState(false)

  async function nacitajAnkety() {
    setNacitavam(true)
    const { data } = await supabase
      .from('ankety')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    setAnkety(data || [])
    setNacitavam(false)
  }

  async function vytvor() {
    if (otazka.trim().length < 5) {
      Alert.alert('Krátka otázka', 'Otázka musí mať aspoň 5 znakov.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('ankety').insert({
      otazka: otazka.trim(),
      popis: popis.trim() || null,
      deadline: deadline.trim() || null,
      je_aktivna: true,
    })
    setLoading(false)
    if (error) {
      Alert.alert('Chyba', 'Anketu sa nepodarilo vytvoriť.\n\n' + error.message)
    } else {
      Alert.alert('Hotovo!', 'Anketa bola vytvorená a je aktívna.')
      setOtazka(''); setPopis(''); setDeadline('')
    }
  }

  async function toggleAktivna(id: string, jeAktivna: boolean) {
    await supabase
      .from('ankety')
      .update({ je_aktivna: !jeAktivna })
      .eq('id', id)
    nacitajAnkety()
  }

  async function zmaz(id: string) {
    Alert.alert('Zmazať anketu?', 'Vrátane všetkých hlasov.', [
      { text: 'Zrušiť', style: 'cancel' },
      {
        text: 'Zmazať', style: 'destructive',
        onPress: async () => {
          await supabase.from('ankety').delete().eq('id', id)
          nacitajAnkety()
        },
      },
    ])
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.podtaby}>
        <TouchableOpacity
          style={[styles.podtab, podtab === 'nova' && styles.podtabActive]}
          onPress={() => setPodtab('nova')}
        >
          <Text style={[styles.podtabText, podtab === 'nova' && styles.podtabTextActive]}>
            ✍️ Nová anketa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.podtab, podtab === 'zoznam' && styles.podtabActive]}
          onPress={() => { setPodtab('zoznam'); nacitajAnkety() }}
        >
          <Text style={[styles.podtabText, podtab === 'zoznam' && styles.podtabTextActive]}>
            📋 Zoznam
          </Text>
        </TouchableOpacity>
      </View>

      {podtab === 'nova' ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Otázka *</Text>
            <TextInput
              style={styles.input}
              placeholder="napr. Súhlasíte s výstavbou novej cyklotrasy?"
              placeholderTextColor={C.textPlaceholder}
              value={otazka} onChangeText={setOtazka}
              multiline
            />
            <Text style={styles.formLabel}>Popis (voliteľné)</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Bližšie informácie pre občanov..."
              placeholderTextColor={C.textPlaceholder}
              value={popis} onChangeText={setPopis}
              multiline textAlignVertical="top"
            />
            <Text style={styles.formLabel}>Deadline (voliteľné, formát YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="napr. 2026-06-30"
              placeholderTextColor={C.textPlaceholder}
              value={deadline} onChangeText={setDeadline}
            />
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={vytvor} disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={C.onPrimary} />
                : <Text style={styles.submitBtnText}>🗳️ Spustiť anketu</Text>}
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', marginTop: 12 }}>
              Občania uvidia anketu v menu „Viac → Ankety obce".
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {nacitavam && <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />}
          {!nacitavam && ankety.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🗳️</Text>
              <Text style={styles.emptyText}>Žiadne ankety</Text>
            </View>
          )}
          {!nacitavam && ankety.map(a => (
            <View key={a.id} style={styles.karta}>
              <View style={styles.kartaHeader}>
                <View style={styles.kartaInfo}>
                  <Text style={styles.kartaPopis} numberOfLines={2}>{a.otazka}</Text>
                  {a.popis && <Text style={styles.kartaDatum}>{a.popis.slice(0, 80)}{a.popis.length > 80 ? '…' : ''}</Text>}
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: a.je_aktivna ? C.status.success.bg : C.status.neutral.bg }
                ]}>
                  <Text style={[styles.statusText, {
                    color: a.je_aktivna ? C.status.success.fg : C.status.neutral.fg
                  }]}>
                    {a.je_aktivna ? 'Aktívna' : 'Ukončená'}
                  </Text>
                </View>
              </View>
              {a.deadline && (
                <Text style={styles.kartaDatum}>
                  ⏰ Deadline: {new Date(a.deadline).toLocaleDateString('sk-SK')}
                </Text>
              )}
              <View style={styles.akcie}>
                <TouchableOpacity
                  style={[styles.akciaBtn, {
                    backgroundColor: a.je_aktivna ? C.status.warning.bg : C.status.success.bg
                  }]}
                  onPress={() => toggleAktivna(a.id, a.je_aktivna)}
                >
                  <Text style={[styles.akciaBtnText, {
                    color: a.je_aktivna ? C.status.warning.fg : C.status.success.fg
                  }]}>
                    {a.je_aktivna ? '⏸ Ukončiť' : '▶ Aktivovať'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.akciaBtn, { backgroundColor: C.status.danger.bg }]}
                  onPress={() => zmaz(a.id)}
                >
                  <Text style={[styles.akciaBtnText, { color: C.status.danger.fg }]}>🗑️ Zmazať</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

function HlasenieKarta({ hlasenie: h, updating, onZmenStatus }: {
  hlasenie: Hlasenie
  updating: boolean
  onZmenStatus: (id: string, status: string) => void
}) {
  const statusInfo = statusInfoFor(h.status)
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
      {h.foto_urls && h.foto_urls.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8, marginBottom: 4 }}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {h.foto_urls.map((url, i) => (
              <Image
                key={i}
                source={{ uri: url }}
                style={{ width: 88, height: 88, borderRadius: 10, backgroundColor: C.divider }}
                contentFit="cover"
              />
            ))}
          </View>
        </ScrollView>
      )}
      {updating ? (
        <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 12 }} />
      ) : (
        <View style={styles.akcie}>
          {h.status !== 'v_rieseni' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: C.status.warning.bg }]} onPress={() => onZmenStatus(h.id, 'v_rieseni')}>
              <Text style={[styles.akciaBtnText, { color: C.status.warning.fg }]}>V riešení</Text>
            </TouchableOpacity>
          )}
          {h.status !== 'vyriesene' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: C.status.success.bg }]} onPress={() => onZmenStatus(h.id, 'vyriesene')}>
              <Text style={[styles.akciaBtnText, { color: C.status.success.fg }]}>Vyriešené ✓</Text>
            </TouchableOpacity>
          )}
          {h.status !== 'zamietnute' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: C.status.danger.bg }]} onPress={() => onZmenStatus(h.id, 'zamietnute')}>
              <Text style={[styles.akciaBtnText, { color: C.status.danger.fg }]}>Zamietnuť</Text>
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
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: C.onPrimary, fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 1 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  logoutText: { color: C.onPrimary, fontSize: 13, fontWeight: '700' },
  taby: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  tab: { flex: 1, paddingVertical: 14, paddingHorizontal: 4, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: C.primary },
  tabText: { fontSize: 11, fontWeight: '600', color: C.textMuted },
  tabTextActive: { color: C.primary, fontWeight: '700' },
  podtaby: {
    flexDirection: 'row', backgroundColor: C.background,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  podtab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  podtabActive: { borderBottomWidth: 2, borderBottomColor: C.primary },
  podtabText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  podtabTextActive: { color: C.primary, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  sekcia: { fontSize: 13, fontWeight: '700', color: C.textSecondary, marginBottom: 4, marginTop: 4 },
  formCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  formLabel: { fontSize: 13, fontWeight: '700', color: C.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: C.text, marginBottom: 16,
    backgroundColor: C.surface,
  },
  katBtn: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border,
  },
  katBtnActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  katBtnText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  katBtnTextActive: { color: C.primary, fontWeight: '700' },
  publikovatRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: C.border, justifyContent: 'center', padding: 2,
  },
  toggleActive: { backgroundColor: C.secondary },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.surface },
  toggleKnobActive: { alignSelf: 'flex-end' },
  submitBtn: {
    backgroundColor: C.primary, borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  submitBtnText: { color: C.onPrimary, fontSize: 15, fontWeight: '700' },
  karta: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  kartaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  kartaEmoji: { fontSize: 28 },
  kartaInfo: { flex: 1 },
  kartaKategoria: { fontSize: 12, fontWeight: '800', color: C.text, letterSpacing: 0.5 },
  kartaDatum: { fontSize: 11, color: C.textPlaceholder, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  kartaPopis: { fontSize: 14, color: C.textSecondary, lineHeight: 20, marginBottom: 6 },
  kartaAdresa: { fontSize: 12, color: C.textMuted, marginBottom: 4 },
  akcie: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  akciaBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  akciaBtnText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: C.textMuted, fontWeight: '600' },
  historiaContainer: {
    marginTop: 12, borderTopWidth: 1,
    borderTopColor: C.divider, paddingTop: 10, gap: 6,
  },
  historiaTitle: { fontSize: 10, fontWeight: '800', color: C.textPlaceholder, letterSpacing: 1, marginBottom: 4 },
  historiaZaznam: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historiaText: { fontSize: 12, color: C.textSecondary },
  historiaDatum: { fontSize: 11, color: C.textPlaceholder },

  // Cover picker pre nová aktualita
  coverPickerBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  coverPickerPlaceholder: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.surfaceAlt,
  },
  coverRemove: {
    position: 'absolute',
    top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
