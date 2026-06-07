import { ErbBadge } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { supabase } from '@/src/lib/supabase'
import { Image } from 'expo-image'
// ── expo-image-picker ─────────────────────────────────────────────────────
// Akonáhle spustíš `npx expo install expo-image-picker`, odkomentuj nasledovný
// riadok a zmaž `ImagePicker = null` fallback nižšie.
// import * as ImagePicker from 'expo-image-picker'
const ImagePicker: any = null
// ──────────────────────────────────────────────────────────────────────────
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
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
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])

  const [aktTab, setAktTab] = useState<'prehlad' | 'hlasenia' | 'aktuality' | 'podujatia' | 'prenajmy' | 'ankety' | 'farske'>('prehlad')
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
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const nove = hlasenia.filter(h => h.status === 'nove')

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={t.primary} />

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.taby}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <TouchableOpacity
          style={[styles.tab, aktTab === 'prehlad' && styles.tabActive]}
          onPress={() => setAktTab('prehlad')}
        >
          <Text
            style={[styles.tabText, aktTab === 'prehlad' && styles.tabTextActive]}
            numberOfLines={1}
          >
            📊 Prehľad
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, aktTab === 'hlasenia' && styles.tabActive]}
          onPress={() => setAktTab('hlasenia')}
        >
          <Text
            style={[styles.tabText, aktTab === 'hlasenia' && styles.tabTextActive]}
            numberOfLines={1}
          >
            ⚠️ Podnety{nove.length > 0 ? ` (${nove.length})` : ''}
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
        <TouchableOpacity
          style={[styles.tab, aktTab === 'farske' && styles.tabActive]}
          onPress={() => setAktTab('farske')}
        >
          <Text
            style={[styles.tabText, aktTab === 'farske' && styles.tabTextActive]}
            numberOfLines={1}
          >
            ⛪ Fara
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {aktTab === 'prehlad' ? (
        <AdminDashboard hlasenia={hlasenia} onGoTab={(tab) => setAktTab(tab as any)} />
      ) : aktTab === 'hlasenia' ? (
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={t.primary} />
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
      ) : aktTab === 'ankety' ? (
        <AnketyAdminPanel />
      ) : (
        <FarskeOznamyAdmin />
      )}
    </SafeAreaView>
  )
}

type PublishMode = 'koncept' | 'ihned' | 'naplanovat'

function NovAktualitaForm() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const publishStyles = useMemo(() => makePublishStyles(t), [t])

  const [podtab, setPodtab] = useState<'nova' | 'zoznam'>('nova')
  const [aktuality, setAktuality] = useState<AktualitaItem[]>([])
  const [nacitavam, setNacitavam] = useState(false)
  const [title, setTitle] = useState('')
  const [perex, setPerex] = useState('')
  const [body, setBody] = useState('')
  const [kategoria, setKategoria] = useState('oznam')
  const [loading, setLoading] = useState(false)
  const [publishMode, setPublishMode] = useState<PublishMode>('ihned')
  const [scheduledDate, setScheduledDate] = useState('')   // RRRR-MM-DD
  const [scheduledTime, setScheduledTime] = useState('')   // HH:MM
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

  /** Vráti ISO timestamp pre naplánované publikovanie, alebo null pri chybe. */
  function parseScheduledIso(): string | null {
    if (!scheduledDate) return null
    const cas = scheduledTime || '08:00'
    const iso = `${scheduledDate}T${cas}:00`
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
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

    // Validácia naplánovania
    let scheduledIso: string | null = null
    if (publishMode === 'naplanovat') {
      scheduledIso = parseScheduledIso()
      if (!scheduledIso) {
        Alert.alert('Neplatný čas', 'Zadajte platný dátum (RRRR-MM-DD) a čas (HH:MM) pre naplánovanie.')
        return
      }
      if (new Date(scheduledIso).getTime() < Date.now() - 60000) {
        Alert.alert(
          'Čas v minulosti',
          'Naplánovaný čas musí byť v budúcnosti. Pre okamžité publikovanie použite "Publikovať ihneď".',
        )
        return
      }
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

    // Mapping publish mode → DB stĺpce
    //   koncept     → is_published=false, published_at=null
    //   ihned       → is_published=true,  published_at=now()
    //   naplanovat  → is_published=true,  published_at=scheduledIso (v budúcnosti)
    const dbRecord = {
      title: title.trim(),
      perex: perex.trim() || null,
      body: body.trim(),
      kategoria,
      cover_url: coverUrl,
      is_published: publishMode !== 'koncept',
      published_at:
        publishMode === 'ihned'      ? new Date().toISOString()
      : publishMode === 'naplanovat' ? scheduledIso
      : null,
    }

    const { error } = await supabase.from('aktuality').insert(dbRecord)
    setLoading(false)
    if (error) {
      Alert.alert('Chyba', 'Aktualitu sa nepodarilo uložiť.\n\n' + error.message)
    } else {
      const sprava =
        publishMode === 'ihned'      ? 'Aktualita bola publikovaná.'
      : publishMode === 'naplanovat' ? `Naplánované na ${new Date(scheduledIso!).toLocaleString('sk-SK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.`
      :                                 'Uložené ako koncept.'
      Alert.alert('Hotovo!', sprava)
      setTitle(''); setPerex(''); setBody(''); setKategoria('oznam'); setCoverUri(null)
      setScheduledDate(''); setScheduledTime('')
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
                  <Text style={{ fontSize: 13, color: t.textMuted, marginTop: 8, fontWeight: '600' }}>
                    Klikni pre výber fotky
                  </Text>
                  <Text style={{ fontSize: 11, color: t.textPlaceholder, marginTop: 2 }}>
                    Pomer 16:9 odporúčaný
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.formLabel}>Titulok *</Text>
            <TextInput style={styles.input} placeholder="Titulok aktuality..."
              placeholderTextColor={t.textPlaceholder} value={title} onChangeText={setTitle} />
            <Text style={styles.formLabel}>Perex (krátky úvod)</Text>
            <TextInput style={[styles.input, { height: 80 }]}
              placeholder="Krátky popis..." placeholderTextColor={t.textPlaceholder}
              value={perex} onChangeText={setPerex} multiline textAlignVertical="top" />
            <Text style={styles.formLabel}>Text aktuality *</Text>
            <TextInput style={[styles.input, { height: 160 }]}
              placeholder="Celý text..." placeholderTextColor={t.textPlaceholder}
              value={body} onChangeText={setBody} multiline textAlignVertical="top" />
            {/* Publikovanie — 3 stavy */}
            <Text style={styles.formLabel}>Publikovanie</Text>
            <View style={publishStyles.modeRow}>
              <PublishModeBtn
                emoji="💾"
                label="Koncept"
                sub="Uložiť, nepublikovať"
                active={publishMode === 'koncept'}
                onPress={() => setPublishMode('koncept')}
              />
              <PublishModeBtn
                emoji="🚀"
                label="Ihneď"
                sub="Publikovať teraz"
                active={publishMode === 'ihned'}
                onPress={() => setPublishMode('ihned')}
              />
              <PublishModeBtn
                emoji="🕒"
                label="Naplánovať"
                sub="V určitý čas"
                active={publishMode === 'naplanovat'}
                onPress={() => setPublishMode('naplanovat')}
              />
            </View>

            {publishMode === 'naplanovat' && (
              <View style={publishStyles.scheduleBox}>
                <Text style={publishStyles.scheduleHint}>
                  📅 Aktualita sa automaticky zobrazí občanom v zadaný čas.
                </Text>
                <View style={publishStyles.scheduleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.formLabel, { marginBottom: 6 }]}>Dátum *</Text>
                    <TextInput
                      style={[styles.input, { marginBottom: 0 }]}
                      placeholder="2026-06-15"
                      placeholderTextColor={t.textPlaceholder}
                      value={scheduledDate}
                      onChangeText={setScheduledDate}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={{ width: 110 }}>
                    <Text style={[styles.formLabel, { marginBottom: 6 }]}>Čas</Text>
                    <TextInput
                      style={[styles.input, { marginBottom: 0 }]}
                      placeholder="08:00"
                      placeholderTextColor={t.textPlaceholder}
                      value={scheduledTime}
                      onChangeText={setScheduledTime}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <SchedulePreset label="Zajtra 8:00" onPress={() => {
                      const d = new Date(); d.setDate(d.getDate() + 1)
                      setScheduledDate(d.toISOString().slice(0, 10)); setScheduledTime('08:00')
                    }} />
                    <SchedulePreset label="Pondelok 7:00" onPress={() => {
                      const d = new Date()
                      const dow = d.getDay()           // 0 = nedeľa
                      const dni = (1 + 7 - dow) % 7 || 7
                      d.setDate(d.getDate() + dni)
                      setScheduledDate(d.toISOString().slice(0, 10)); setScheduledTime('07:00')
                    }} />
                    <SchedulePreset label="O hodinu" onPress={() => {
                      const d = new Date(Date.now() + 60 * 60 * 1000)
                      setScheduledDate(d.toISOString().slice(0, 10))
                      setScheduledTime(d.toTimeString().slice(0, 5))
                    }} />
                  </View>
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }, { marginTop: 16 }]}
              onPress={publikovatAktualitu} disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={t.onPrimary} />
                : <Text style={styles.submitBtnText}>
                    {publishMode === 'ihned'      ? '🚀 Publikovať teraz'
                   : publishMode === 'naplanovat' ? '🕒 Naplánovať'
                   :                                 '💾 Uložiť koncept'}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {nacitavam ? (
            <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />
          ) : aktuality.map(a => {
            // Určenie stavu: published / scheduled / koncept
            const now = Date.now()
            const pubTime = a.published_at ? new Date(a.published_at).getTime() : null
            const stav: 'pub' | 'plan' | 'konc' =
              !a.is_published || !pubTime ? 'konc'
            : pubTime > now                ? 'plan'
            :                                'pub'

            const stavMeta = {
              pub:  { bg: t.status.success.bg, fg: t.status.success.fg, label: '✓ Pub.' },
              plan: { bg: t.status.warning.bg, fg: t.status.warning.fg, label: '🕒 Naplán.' },
              konc: { bg: t.status.neutral.bg, fg: t.status.neutral.fg, label: '💾 Konc.' },
            }[stav]

            return (
              <View key={a.id} style={styles.karta}>
                <View style={styles.kartaHeader}>
                  <View style={styles.kartaInfo}>
                    <Text style={styles.kartaKategoria}>
                      {AKTUALITA_KATEGORIE_LABEL[a.kategoria]?.toUpperCase()}
                    </Text>
                    <Text style={styles.kartaPopis} numberOfLines={2}>{a.title}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: stavMeta.bg }]}>
                    <Text style={[styles.statusText, { color: stavMeta.fg }]}>
                      {stavMeta.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.kartaDatum}>
                  {stav === 'pub' && a.published_at &&
                    `Publikované: ${new Date(a.published_at).toLocaleDateString('sk-SK', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}`
                  }
                  {stav === 'plan' && a.published_at &&
                    `⏰ Bude publikované: ${new Date(a.published_at).toLocaleDateString('sk-SK', {
                      weekday: 'long', day: 'numeric', month: 'long',
                      hour: '2-digit', minute: '2-digit',
                    })}`
                  }
                  {stav === 'konc' && 'Nepublikované (koncept)'}
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {/* Quick action: naplánovanú aktualitu publikovať okamžite */}
                  {stav === 'plan' && (
                    <TouchableOpacity
                      style={[styles.akciaBtn, { backgroundColor: t.status.success.bg }]}
                      onPress={async () => {
                        Alert.alert(
                          'Publikovať teraz?',
                          'Aktualita sa zobrazí občanom okamžite. Zrušíte tým naplánovanie.',
                          [
                            { text: 'Zrušiť', style: 'cancel' },
                            {
                              text: 'Publikovať',
                              onPress: async () => {
                                await supabase
                                  .from('aktuality')
                                  .update({ published_at: new Date().toISOString() })
                                  .eq('id', a.id)
                                nacitajAktuality()
                              },
                            },
                          ],
                        )
                      }}
                    >
                      <Text style={[styles.akciaBtnText, { color: t.status.success.fg }]}>
                        🚀 Publikovať teraz
                      </Text>
                    </TouchableOpacity>
                  )}
                  {/* Quick action: koncept publikovať teraz */}
                  {stav === 'konc' && (
                    <TouchableOpacity
                      style={[styles.akciaBtn, { backgroundColor: t.status.success.bg }]}
                      onPress={async () => {
                        await supabase
                          .from('aktuality')
                          .update({
                            is_published: true,
                            published_at: new Date().toISOString(),
                          })
                          .eq('id', a.id)
                        nacitajAktuality()
                      }}
                    >
                      <Text style={[styles.akciaBtnText, { color: t.status.success.fg }]}>
                        🚀 Publikovať
                      </Text>
                    </TouchableOpacity>
                  )}
                  {/* Skryť publikované */}
                  {stav === 'pub' && (
                    <TouchableOpacity
                      style={[styles.akciaBtn, { backgroundColor: t.status.warning.bg }]}
                      onPress={async () => {
                        Alert.alert(
                          'Skryť aktualitu?',
                          'Aktualita prestane byť viditeľná občanom. Môžete ju neskôr znova publikovať.',
                          [
                            { text: 'Zrušiť', style: 'cancel' },
                            {
                              text: 'Skryť',
                              onPress: async () => {
                                await supabase
                                  .from('aktuality')
                                  .update({ is_published: false })
                                  .eq('id', a.id)
                                nacitajAktuality()
                              },
                            },
                          ],
                        )
                      }}
                    >
                      <Text style={[styles.akciaBtnText, { color: t.status.warning.fg }]}>
                        👁️‍🗨️ Skryť
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.akciaBtn, { backgroundColor: t.status.danger.bg }]}
                    onPress={() => zmazAktualitu(a.id)}
                  >
                    <Text style={[styles.akciaBtnText, { color: t.status.danger.fg }]}>🗑️ Zmazať</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

function NovePodujatieForm() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const publishStyles = useMemo(() => makePublishStyles(t), [t])

  const [title, setTitle] = useState('')
  const [popis, setPopis] = useState('')
  const [kategoria, setKategoria] = useState('ine')
  const [datumOd, setDatumOd] = useState('')
  const [cas, setCas] = useState('')
  const [miesto, setMiesto] = useState('')
  const [loading, setLoading] = useState(false)

  // Publish mode pre podujatia — pozor: ide o "kedy ho zverejniť na verejnosti",
  // nie kedy sa koná. Samotný čas konania je datumOd + cas.
  const [publishMode, setPublishMode] = useState<PublishMode>('ihned')
  const [publishDate, setPublishDate] = useState('')
  const [publishTime, setPublishTime] = useState('')

  function parsePublishIso(): string | null {
    if (!publishDate) return null
    const t = publishTime || '08:00'
    const d = new Date(`${publishDate}T${t}:00`)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  }

  async function ulozPodujatie() {
    if (title.trim().length < 3) {
      Alert.alert('Chýba názov', 'Názov musí mať aspoň 3 znaky.')
      return
    }
    if (!datumOd) {
      Alert.alert('Chýba dátum', 'Zadajte dátum podujatia.')
      return
    }

    // Validácia naplánovania zverejnenia
    let publishIso: string | null = null
    if (publishMode === 'naplanovat') {
      publishIso = parsePublishIso()
      if (!publishIso) {
        Alert.alert('Neplatný čas zverejnenia', 'Zadajte dátum a čas kedy sa má podujatie zverejniť občanom.')
        return
      }
      if (new Date(publishIso).getTime() < Date.now() - 60000) {
        Alert.alert('Čas v minulosti', 'Naplánovaný čas zverejnenia musí byť v budúcnosti.')
        return
      }
    }

    const datum = new Date(`${datumOd}T${cas || '00:00'}`)
    setLoading(true)

    const record: any = {
      title: title.trim(),
      popis: popis.trim() || null,
      kategoria,
      datum_od: datum.toISOString(),
      miesto: miesto.trim() || null,
      is_published: publishMode !== 'koncept',
    }
    // publish_at len ak je definovaný — DB ho ignoruje ak stĺpec neexistuje
    if (publishMode === 'naplanovat') record.publish_at = publishIso
    else if (publishMode === 'ihned') record.publish_at = new Date().toISOString()
    else record.publish_at = null

    const { error } = await supabase.from('podujatia').insert(record)
    setLoading(false)
    if (error) {
      Alert.alert('Chyba', 'Podujatie sa nepodarilo uložiť.\n\n' + error.message)
    } else {
      const sprava =
        publishMode === 'ihned'      ? 'Podujatie pridané a zverejnené.'
      : publishMode === 'naplanovat' ? `Pridané, zverejnené bude ${new Date(publishIso!).toLocaleString('sk-SK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.`
      :                                 'Uložené ako koncept.'
      Alert.alert('Hotovo!', sprava)
      setTitle(''); setPopis(''); setDatumOd(''); setCas(''); setMiesto(''); setKategoria('ine')
      setPublishDate(''); setPublishTime('')
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
          placeholderTextColor={t.textPlaceholder} value={title} onChangeText={setTitle} />
        <Text style={styles.formLabel}>Dátum * (RRRR-MM-DD)</Text>
        <TextInput style={styles.input} placeholder="napr. 2026-06-15"
          placeholderTextColor={t.textPlaceholder} value={datumOd} onChangeText={setDatumOd} />
        <Text style={styles.formLabel}>Čas (HH:MM)</Text>
        <TextInput style={styles.input} placeholder="napr. 15:00"
          placeholderTextColor={t.textPlaceholder} value={cas} onChangeText={setCas} />
        <Text style={styles.formLabel}>Miesto</Text>
        <TextInput style={styles.input} placeholder="napr. Kultúrny dom"
          placeholderTextColor={t.textPlaceholder} value={miesto} onChangeText={setMiesto} />
        <Text style={styles.formLabel}>Popis</Text>
        <TextInput style={[styles.input, { height: 100 }]}
          placeholder="Krátky popis podujatia..."
          placeholderTextColor={t.textPlaceholder} value={popis} onChangeText={setPopis}
          multiline textAlignVertical="top" />

        {/* Zverejnenie — 3 stavy */}
        <Text style={styles.formLabel}>Zverejnenie</Text>
        <View style={publishStyles.modeRow}>
          <PublishModeBtn
            emoji="💾"
            label="Koncept"
            sub="Iba uložiť"
            active={publishMode === 'koncept'}
            onPress={() => setPublishMode('koncept')}
          />
          <PublishModeBtn
            emoji="🚀"
            label="Ihneď"
            sub="Zverejniť teraz"
            active={publishMode === 'ihned'}
            onPress={() => setPublishMode('ihned')}
          />
          <PublishModeBtn
            emoji="🕒"
            label="Naplánovať"
            sub="V určitý čas"
            active={publishMode === 'naplanovat'}
            onPress={() => setPublishMode('naplanovat')}
          />
        </View>

        {publishMode === 'naplanovat' && (
          <View style={publishStyles.scheduleBox}>
            <Text style={publishStyles.scheduleHint}>
              📅 Podujatie sa objaví v kalendári občanov v tento čas. Samotné konanie podujatia
              sa nemení ({datumOd || 'dátum'} {cas || ''}).
            </Text>
            <View style={publishStyles.scheduleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { marginBottom: 6 }]}>Zverejniť dňa *</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 0 }]}
                  placeholder="2026-06-15"
                  placeholderTextColor={t.textPlaceholder}
                  value={publishDate}
                  onChangeText={setPublishDate}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ width: 110 }}>
                <Text style={[styles.formLabel, { marginBottom: 6 }]}>Čas</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 0 }]}
                  placeholder="08:00"
                  placeholderTextColor={t.textPlaceholder}
                  value={publishTime}
                  onChangeText={setPublishTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <SchedulePreset label="Zajtra 8:00" onPress={() => {
                  const d = new Date(); d.setDate(d.getDate() + 1)
                  setPublishDate(d.toISOString().slice(0, 10)); setPublishTime('08:00')
                }} />
                <SchedulePreset label="Týždeň pred" onPress={() => {
                  if (!datumOd) { Alert.alert('Najprv dátum konania', 'Zadajte dátum konania podujatia.'); return }
                  const d = new Date(datumOd)
                  d.setDate(d.getDate() - 7)
                  setPublishDate(d.toISOString().slice(0, 10)); setPublishTime('08:00')
                }} />
                <SchedulePreset label="O hodinu" onPress={() => {
                  const d = new Date(Date.now() + 60 * 60 * 1000)
                  setPublishDate(d.toISOString().slice(0, 10))
                  setPublishTime(d.toTimeString().slice(0, 5))
                }} />
              </View>
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }, { marginTop: 16 }]}
          onPress={ulozPodujatie} disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={t.onPrimary} />
            : <Text style={styles.submitBtnText}>
                {publishMode === 'ihned'      ? '🚀 Pridať a zverejniť'
               : publishMode === 'naplanovat' ? '🕒 Naplánovať zverejnenie'
               :                                 '💾 Uložiť koncept'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function PrenajmyZoznam() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])

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
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    )
  }

  if (chyba) {
    return (
      <View style={[styles.list, { gap: 12 }]}>
        <View style={[styles.formCard, { borderLeftWidth: 4, borderLeftColor: t.primary }]}>
          <Text style={[styles.formLabel, { color: t.primary }]}>Nepodarilo sa načítať prenájmy</Text>
          <Text style={{ fontSize: 13, color: t.textSecondary, lineHeight: 19 }}>{chyba}</Text>
          <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 8, lineHeight: 18 }}>
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
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const prenajomStyles = useMemo(() => makePrenajomStyles(t), [t])

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
        <ActivityIndicator size="small" color={t.primary} style={{ marginTop: 12 }} />
      ) : (
        <View style={styles.akcie}>
          {aktStatus !== 'schvalene' && (
            <TouchableOpacity
              style={[styles.akciaBtn, { backgroundColor: t.status.success.bg }]}
              onPress={() => onZmenStatus(z.id, 'schvalene')}
            >
              <Text style={[styles.akciaBtnText, { color: t.status.success.fg }]}>Schváliť ✓</Text>
            </TouchableOpacity>
          )}
          {aktStatus !== 'zamietnute' && (
            <TouchableOpacity
              style={[styles.akciaBtn, { backgroundColor: t.status.danger.bg }]}
              onPress={() => onZmenStatus(z.id, 'zamietnute')}
            >
              <Text style={[styles.akciaBtnText, { color: t.status.danger.fg }]}>Zamietnuť</Text>
            </TouchableOpacity>
          )}
          {aktStatus !== 'nove' && (
            <TouchableOpacity
              style={[styles.akciaBtn, { backgroundColor: t.status.info.bg }]}
              onPress={() => onZmenStatus(z.id, 'nove')}
            >
              <Text style={[styles.akciaBtnText, { color: t.status.info.fg }]}>Označiť ako nové</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const makePrenajomStyles = (t: ThemeColors) => StyleSheet.create({
  detailGrid: {
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailIcon: { fontSize: 14, width: 18 },
  detailText: { fontSize: 13, color: t.textSecondary, fontWeight: '500' },
  poznamka: {
    fontSize: 13,
    color: t.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
    backgroundColor: t.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  kontakty: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  kontaktBtn: {
    backgroundColor: t.secondaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  kontaktBtnEmail: { backgroundColor: t.status.info.bg },
  kontaktBtnText: { fontSize: 12, fontWeight: '700', color: t.secondary },
  kontaktBtnEmailText: { color: t.status.info.fg },
  prijate: {
    fontSize: 11, color: t.textPlaceholder, marginTop: 2,
  },
})

function AnketyAdminPanel() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])

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
              placeholderTextColor={t.textPlaceholder}
              value={otazka} onChangeText={setOtazka}
              multiline
            />
            <Text style={styles.formLabel}>Popis (voliteľné)</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Bližšie informácie pre občanov..."
              placeholderTextColor={t.textPlaceholder}
              value={popis} onChangeText={setPopis}
              multiline textAlignVertical="top"
            />
            <Text style={styles.formLabel}>Deadline (voliteľné, formát YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="napr. 2026-06-30"
              placeholderTextColor={t.textPlaceholder}
              value={deadline} onChangeText={setDeadline}
            />
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={vytvor} disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={t.onPrimary} />
                : <Text style={styles.submitBtnText}>🗳️ Spustiť anketu</Text>}
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: t.textMuted, textAlign: 'center', marginTop: 12 }}>
              Občania uvidia anketu v menu „Viac → Ankety obce".
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {nacitavam && <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />}
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
                  { backgroundColor: a.je_aktivna ? t.status.success.bg : t.status.neutral.bg }
                ]}>
                  <Text style={[styles.statusText, {
                    color: a.je_aktivna ? t.status.success.fg : t.status.neutral.fg
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
                    backgroundColor: a.je_aktivna ? t.status.warning.bg : t.status.success.bg
                  }]}
                  onPress={() => toggleAktivna(a.id, a.je_aktivna)}
                >
                  <Text style={[styles.akciaBtnText, {
                    color: a.je_aktivna ? t.status.warning.fg : t.status.success.fg
                  }]}>
                    {a.je_aktivna ? '⏸ Ukončiť' : '▶ Aktivovať'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.akciaBtn, { backgroundColor: t.status.danger.bg }]}
                  onPress={() => zmaz(a.id)}
                >
                  <Text style={[styles.akciaBtnText, { color: t.status.danger.fg }]}>🗑️ Zmazať</Text>
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
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])

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
                style={{ width: 88, height: 88, borderRadius: 10, backgroundColor: t.divider }}
                contentFit="cover"
              />
            ))}
          </View>
        </ScrollView>
      )}
      {updating ? (
        <ActivityIndicator size="small" color={t.primary} style={{ marginTop: 12 }} />
      ) : (
        <View style={styles.akcie}>
          {h.status !== 'v_rieseni' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: t.status.warning.bg }]} onPress={() => onZmenStatus(h.id, 'v_rieseni')}>
              <Text style={[styles.akciaBtnText, { color: t.status.warning.fg }]}>V riešení</Text>
            </TouchableOpacity>
          )}
          {h.status !== 'vyriesene' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: t.status.success.bg }]} onPress={() => onZmenStatus(h.id, 'vyriesene')}>
              <Text style={[styles.akciaBtnText, { color: t.status.success.fg }]}>Vyriešené ✓</Text>
            </TouchableOpacity>
          )}
          {h.status !== 'zamietnute' && (
            <TouchableOpacity style={[styles.akciaBtn, { backgroundColor: t.status.danger.bg }]} onPress={() => onZmenStatus(h.id, 'zamietnute')}>
              <Text style={[styles.akciaBtnText, { color: t.status.danger.fg }]}>Zamietnuť</Text>
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

// ─── Publish mode helper komponenty ───────────────────────────────────────
function PublishModeBtn({ emoji, label, sub, active, onPress }: {
  emoji: string; label: string; sub: string; active: boolean; onPress: () => void
}) {
  const t = useThemeColors()
  const publishStyles = useMemo(() => makePublishStyles(t), [t])

  return (
    <TouchableOpacity
      style={[publishStyles.modeBtn, active && publishStyles.modeBtnActive]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={publishStyles.modeEmoji}>{emoji}</Text>
      <Text style={[publishStyles.modeLabel, active && { color: t.primary }]}>{label}</Text>
      <Text style={[publishStyles.modeSub, active && { color: t.primary }]} numberOfLines={2}>{sub}</Text>
    </TouchableOpacity>
  )
}

function SchedulePreset({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useThemeColors()
  const publishStyles = useMemo(() => makePublishStyles(t), [t])

  return (
    <TouchableOpacity
      style={publishStyles.preset}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={publishStyles.presetText}>{label}</Text>
    </TouchableOpacity>
  )
}

const makePublishStyles = (t: ThemeColors) => StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: {
    flex: 1,
    backgroundColor: t.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 4,
    minHeight: 90,
  },
  modeBtnActive: {
    backgroundColor: t.primaryLight,
    borderColor: t.primary,
  },
  modeEmoji: { fontSize: 24 },
  modeLabel: { fontSize: 13, fontWeight: '800', color: t.text, letterSpacing: 0.1 },
  modeSub: { fontSize: 10, color: t.textMuted, textAlign: 'center', fontWeight: '600', lineHeight: 13 },

  scheduleBox: {
    backgroundColor: t.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    borderLeftWidth: 4,
    borderLeftColor: t.primary,
  },
  scheduleHint: {
    fontSize: 12, color: t.textSecondary, marginBottom: 12, lineHeight: 17, fontWeight: '600',
  },
  scheduleRow: { flexDirection: 'row', gap: 10 },

  preset: {
    backgroundColor: t.surface,
    borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: t.border,
  },
  presetText: { fontSize: 12, color: t.textSecondary, fontWeight: '700' },
})

// ─── FARSKÉ OZNAMY — admin podtab ─────────────────────────────────────────
function FarskeOznamyAdmin() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])

  const [podtab, setPodtab] = useState<'nova' | 'zoznam'>('nova')
  const [typ, setTyp] = useState<'omsa' | 'smutok' | 'krst' | 'sobas' | 'ohlaska' | 'oznam'>('omsa')
  const [nazov, setNazov] = useState('')
  const [popis, setPopis] = useState('')
  const [datumOd, setDatumOd] = useState('')
  const [cas, setCas] = useState('')
  const [miesto, setMiesto] = useState('Kostol Výčapy-Opatovce')
  const [loading, setLoading] = useState(false)
  const [zoznam, setZoznam] = useState<any[]>([])
  const [nacitavam, setNacitavam] = useState(false)
  const [chyba, setChyba] = useState<string | null>(null)

  const TYPY_LABEL: Record<string, string> = {
    omsa: '🙏 Sv. omša',
    smutok: '🕯️ Smútočný',
    krst: '👶 Krst',
    sobas: '💒 Sobáš',
    ohlaska: '📣 Ohláška',
    oznam: '📋 Oznam',
  }

  async function nacitajZoznam() {
    setNacitavam(true)
    setChyba(null)
    const { data, error } = await supabase
      .from('farske_oznamy')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) {
      setChyba(error.message)
    } else {
      setZoznam(data || [])
    }
    setNacitavam(false)
  }

  async function vytvor() {
    if (nazov.trim().length < 3) {
      Alert.alert('Krátky názov', 'Názov musí mať aspoň 3 znaky.')
      return
    }
    setLoading(true)
    let datumIso: string | null = null
    if (datumOd) {
      try {
        datumIso = new Date(`${datumOd}T${cas || '00:00'}:00`).toISOString()
      } catch {}
    }
    const { error } = await supabase.from('farske_oznamy').insert({
      typ,
      nazov: nazov.trim(),
      popis: popis.trim() || null,
      datum_od: datumIso,
      miesto: miesto.trim() || null,
      je_aktivny: true,
    })
    setLoading(false)
    if (error) {
      Alert.alert(
        'Chyba',
        'Oznam sa nepodarilo uložiť.\n\n' + error.message +
        '\n\nTip: skontrolujte že tabuľka `farske_oznamy` existuje v Supabase (SQL skript je v useFarskeOznamy.ts).',
      )
    } else {
      Alert.alert('Hotovo!', 'Farský oznam bol pridaný.')
      setNazov(''); setPopis(''); setDatumOd(''); setCas('')
    }
  }

  async function zmaz(id: string) {
    Alert.alert('Zmazať oznam?', 'Túto akciu nemožno vrátiť.', [
      { text: 'Zrušiť', style: 'cancel' },
      {
        text: 'Zmazať', style: 'destructive',
        onPress: async () => {
          await supabase.from('farske_oznamy').delete().eq('id', id)
          nacitajZoznam()
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
            ✍️ Nový oznam
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.podtab, podtab === 'zoznam' && styles.podtabActive]}
          onPress={() => { setPodtab('zoznam'); nacitajZoznam() }}
        >
          <Text style={[styles.podtabText, podtab === 'zoznam' && styles.podtabTextActive]}>
            📋 Zoznam
          </Text>
        </TouchableOpacity>
      </View>

      {podtab === 'nova' ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Typ oznamu</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {Object.entries(TYPY_LABEL).map(([k, label]) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.katBtn, typ === k && styles.katBtnActive]}
                    onPress={() => setTyp(k as any)}
                  >
                    <Text style={[styles.katBtnText, typ === k && styles.katBtnTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.formLabel}>Názov *</Text>
            <TextInput style={styles.input}
              placeholder={typ === 'smutok' ? 'napr. Zomrel Ján Novák' : typ === 'sobas' ? 'napr. Sobáš Peter & Mária' : 'napr. Sobotná sv. omša'}
              placeholderTextColor={t.textPlaceholder}
              value={nazov} onChangeText={setNazov} />

            <Text style={styles.formLabel}>Dátum (RRRR-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2026-06-15"
              placeholderTextColor={t.textPlaceholder} value={datumOd} onChangeText={setDatumOd} />

            <Text style={styles.formLabel}>Čas (HH:MM)</Text>
            <TextInput style={styles.input} placeholder="18:00"
              placeholderTextColor={t.textPlaceholder} value={cas} onChangeText={setCas} />

            <Text style={styles.formLabel}>Miesto</Text>
            <TextInput style={styles.input} placeholder="Kostol Výčapy-Opatovce"
              placeholderTextColor={t.textPlaceholder} value={miesto} onChangeText={setMiesto} />

            <Text style={styles.formLabel}>Popis / detail</Text>
            <TextInput style={[styles.input, { height: 120 }]}
              placeholder={typ === 'smutok' ? 'Vek, dátum a miesto pohrebu...' : 'Detaily oznamu...'}
              placeholderTextColor={t.textPlaceholder} value={popis} onChangeText={setPopis}
              multiline textAlignVertical="top" />

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={vytvor} disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={t.onPrimary} />
                : <Text style={styles.submitBtnText}>⛪ Uverejniť oznam</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {nacitavam && <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />}
          {chyba && (
            <View style={[styles.formCard, { borderLeftWidth: 4, borderLeftColor: t.primary }]}>
              <Text style={[styles.formLabel, { color: t.primary }]}>Tabuľka neexistuje</Text>
              <Text style={{ fontSize: 13, color: t.textSecondary, lineHeight: 19 }}>
                {chyba}
              </Text>
              <Text style={{ fontSize: 12, color: t.textMuted, marginTop: 8, lineHeight: 18 }}>
                Tip: spustite SQL skript zo súboru `src/hooks/useFarskeOznamy.ts` v Supabase SQL editore.
              </Text>
            </View>
          )}
          {!nacitavam && !chyba && zoznam.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>⛪</Text>
              <Text style={styles.emptyText}>Žiadne farské oznamy</Text>
            </View>
          )}
          {!nacitavam && zoznam.map(o => (
            <View key={o.id} style={styles.karta}>
              <View style={styles.kartaHeader}>
                <View style={styles.kartaInfo}>
                  <Text style={styles.kartaKategoria}>
                    {TYPY_LABEL[o.typ]?.toUpperCase() ?? o.typ.toUpperCase()}
                  </Text>
                  <Text style={styles.kartaPopis} numberOfLines={2}>{o.nazov}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: o.je_aktivny ? t.status.success.bg : t.status.neutral.bg }
                ]}>
                  <Text style={[styles.statusText, {
                    color: o.je_aktivny ? t.status.success.fg : t.status.neutral.fg
                  }]}>
                    {o.je_aktivny ? 'Aktívny' : 'Skrytý'}
                  </Text>
                </View>
              </View>
              {o.datum_od && (
                <Text style={styles.kartaDatum}>
                  📅 {new Date(o.datum_od).toLocaleDateString('sk-SK', {
                    weekday: 'short', day: 'numeric', month: 'long',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              )}
              {o.popis && (
                <Text style={[styles.kartaDatum, { color: t.textSecondary, marginTop: 6 }]} numberOfLines={3}>
                  {o.popis}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.akciaBtn, { backgroundColor: t.status.danger.bg, marginTop: 10, alignSelf: 'flex-start' }]}
                onPress={() => zmaz(o.id)}
              >
                <Text style={[styles.akciaBtnText, { color: t.status.danger.fg }]}>🗑️ Zmazať</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

// ─── ADMIN DASHBOARD — KPI prehľad navrchu ────────────────────────────────
function AdminDashboard({
  hlasenia,
  onGoTab,
}: {
  hlasenia: Hlasenie[]
  onGoTab: (tab: string) => void
}) {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const dashStyles = useMemo(() => makeDashStyles(t), [t])

  const [aktualityCount, setAktualityCount] = useState<number | null>(null)
  const [najblizsiVyvoz, setNajblizsiVyvoz] = useState<{ typ: string; datum: string } | null>(null)
  const [posledneOtazky, setPosledneOtazky] = useState<{ obsah: string; created_at: string }[]>([])

  useEffect(() => {
    nacitaj()
  }, [])

  async function nacitaj() {
    const today = new Date().toISOString().split('T')[0]

    // Počet publikovaných aktualít
    const { count: aktCount } = await supabase
      .from('aktuality')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
    setAktualityCount(aktCount ?? 0)

    // Najbližší vývoz
    const { data: odpadData } = await supabase
      .from('odpady_kalendar')
      .select('datum, typ:odpady_typy(nazov)')
      .gte('datum', today)
      .order('datum', { ascending: true })
      .limit(1)
    const first = (odpadData as any)?.[0]
    if (first) {
      setNajblizsiVyvoz({ typ: first.typ?.nazov ?? 'Odpad', datum: first.datum })
    }

    // Posledné 3 Marta otázky (rola=user)
    const { data: konv } = await supabase
      .from('ai_konverzacie')
      .select('obsah, created_at')
      .eq('rola', 'user')
      .order('created_at', { ascending: false })
      .limit(3)
    setPosledneOtazky((konv as any) || [])
  }

  const aktivnePodnety = hlasenia.filter(h => h.status === 'nove' || h.status === 'v_rieseni').length
  const novePodnety = hlasenia.filter(h => h.status === 'nove').length

  const formatVyvoz = (datum: string) => {
    const d = new Date(datum)
    const dnes = new Date()
    dnes.setHours(0,0,0,0); d.setHours(0,0,0,0)
    const dni = Math.round((d.getTime() - dnes.getTime()) / 86400000)
    if (dni === 0) return 'Dnes'
    if (dni === 1) return 'Zajtra'
    return `Za ${dni} dní`
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {/* Top KPI strip — 2x2 */}
      <View style={dashStyles.kpiGrid}>
        <TouchableOpacity
          style={dashStyles.kpiCard}
          activeOpacity={0.85}
          onPress={() => onGoTab('hlasenia')}
        >
          <Text style={dashStyles.kpiEmoji}>⚠️</Text>
          <Text style={[dashStyles.kpiNumber, novePodnety > 0 && { color: t.brand.red }]}>
            {aktivnePodnety}
          </Text>
          <Text style={dashStyles.kpiLabel}>aktívnych podnetov</Text>
          {novePodnety > 0 && (
            <View style={dashStyles.kpiBadge}>
              <Text style={dashStyles.kpiBadgeText}>{novePodnety} nových</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={dashStyles.kpiCard}
          activeOpacity={0.85}
          onPress={() => onGoTab('aktuality')}
        >
          <Text style={dashStyles.kpiEmoji}>📰</Text>
          <Text style={dashStyles.kpiNumber}>{aktualityCount ?? '—'}</Text>
          <Text style={dashStyles.kpiLabel}>publikovaných aktualít</Text>
        </TouchableOpacity>

        <View style={dashStyles.kpiCard}>
          <Text style={dashStyles.kpiEmoji}>🗑️</Text>
          <Text style={[dashStyles.kpiNumber, { fontSize: 18 }]}>
            {najblizsiVyvoz ? formatVyvoz(najblizsiVyvoz.datum) : '—'}
          </Text>
          <Text style={dashStyles.kpiLabel}>{najblizsiVyvoz ? `vývoz: ${najblizsiVyvoz.typ}` : 'nie je naplánovaný'}</Text>
        </View>

        <TouchableOpacity
          style={dashStyles.kpiCard}
          activeOpacity={0.85}
          onPress={() => onGoTab('aktuality')}
        >
          <Text style={dashStyles.kpiEmoji}>⚡</Text>
          <Text style={[dashStyles.kpiNumber, { color: t.primary, fontSize: 18 }]}>+ Nové</Text>
          <Text style={dashStyles.kpiLabel}>publikovať oznam</Text>
        </TouchableOpacity>
      </View>

      {/* Posledné Marta otázky */}
      <View style={dashStyles.section}>
        <Text style={dashStyles.sectionLabel}>POSLEDNÉ OTÁZKY PRE MARTU</Text>
        {posledneOtazky.length === 0 ? (
          <View style={dashStyles.emptyMini}>
            <Text style={dashStyles.emptyMiniText}>
              Zatiaľ žiadne otázky. Marta čaká na občanov.
            </Text>
          </View>
        ) : (
          posledneOtazky.map((q, i) => (
            <View key={i} style={dashStyles.qBox}>
              <Text style={dashStyles.qEmoji}>💬</Text>
              <View style={{ flex: 1 }}>
                <Text style={dashStyles.qText} numberOfLines={2}>{q.obsah}</Text>
                <Text style={dashStyles.qDate}>
                  {new Date(q.created_at).toLocaleDateString('sk-SK', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Quick actions — 30s flow */}
      <View style={dashStyles.section}>
        <Text style={dashStyles.sectionLabel}>RÝCHLE AKCIE (do 30 sekúnd)</Text>
        <TouchableOpacity style={dashStyles.quickRow} onPress={() => onGoTab('aktuality')}>
          <Text style={dashStyles.quickEmoji}>📢</Text>
          <View style={{ flex: 1 }}>
            <Text style={dashStyles.quickTitle}>Publikovať oznam</Text>
            <Text style={dashStyles.quickSub}>Titulok + text → publish</Text>
          </View>
          <Text style={dashStyles.quickChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dashStyles.quickRow} onPress={() => onGoTab('hlasenia')}>
          <Text style={dashStyles.quickEmoji}>✅</Text>
          <View style={{ flex: 1 }}>
            <Text style={dashStyles.quickTitle}>Vyriešiť podnet</Text>
            <Text style={dashStyles.quickSub}>{novePodnety > 0 ? `${novePodnety} nových čaká` : 'Žiadne nové'}</Text>
          </View>
          <Text style={dashStyles.quickChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dashStyles.quickRow} onPress={() => onGoTab('podujatia')}>
          <Text style={dashStyles.quickEmoji}>📅</Text>
          <View style={{ flex: 1 }}>
            <Text style={dashStyles.quickTitle}>Pridať podujatie</Text>
            <Text style={dashStyles.quickSub}>Názov + dátum → save</Text>
          </View>
          <Text style={dashStyles.quickChevron}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const makeDashStyles = (t: ThemeColors) => StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  kpiCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: t.surface,
    borderRadius: 14,
    padding: 14,
    minHeight: 110,
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  kpiEmoji: { fontSize: 22, marginBottom: 4 },
  kpiNumber: { fontSize: 26, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, color: t.textMuted, marginTop: 2, fontWeight: '600' },
  kpiBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: t.brand.red,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 8,
  },
  kpiBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  section: { marginTop: 16, gap: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: t.textMuted,
    letterSpacing: 0.8, marginBottom: 6,
  },

  qBox: {
    flexDirection: 'row',
    backgroundColor: t.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 6,
  },
  qEmoji: { fontSize: 18 },
  qText: { fontSize: 13, color: t.text, lineHeight: 18, fontWeight: '500' },
  qDate: { fontSize: 11, color: t.textPlaceholder, marginTop: 4 },

  emptyMini: {
    backgroundColor: t.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyMiniText: { fontSize: 12, color: t.textMuted, textAlign: 'center' },

  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 6,
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickEmoji: { fontSize: 24 },
  quickTitle: { fontSize: 14, fontWeight: '700', color: t.text },
  quickSub: { fontSize: 11, color: t.textMuted, marginTop: 1 },
  quickChevron: { fontSize: 24, color: t.textPlaceholder, fontWeight: '300' },
})

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  header: {
    backgroundColor: t.primary,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: t.onPrimary, fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 1 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  logoutText: { color: t.onPrimary, fontSize: 13, fontWeight: '700' },
  taby: {
    backgroundColor: t.surface,
    borderBottomWidth: 1, borderBottomColor: t.borderLight,
    maxHeight: 50,
  },
  tab: { paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: t.primary },
  tabText: { fontSize: 11, fontWeight: '600', color: t.textMuted },
  tabTextActive: { color: t.primary, fontWeight: '700' },
  podtaby: {
    flexDirection: 'row', backgroundColor: t.background,
    borderBottomWidth: 1, borderBottomColor: t.borderLight,
  },
  podtab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  podtabActive: { borderBottomWidth: 2, borderBottomColor: t.primary },
  podtabText: { fontSize: 13, fontWeight: '600', color: t.textMuted },
  podtabTextActive: { color: t.primary, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  sekcia: { fontSize: 13, fontWeight: '700', color: t.textSecondary, marginBottom: 4, marginTop: 4 },
  formCard: {
    backgroundColor: t.surface, borderRadius: 14, padding: 16,
    shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  formLabel: { fontSize: 13, fontWeight: '700', color: t.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: t.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: t.text, marginBottom: 16,
    backgroundColor: t.surface,
  },
  katBtn: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: t.surfaceAlt, borderWidth: 1.5, borderColor: t.border,
  },
  katBtnActive: { backgroundColor: t.primaryLight, borderColor: t.primary },
  katBtnText: { fontSize: 13, fontWeight: '600', color: t.textSecondary },
  katBtnTextActive: { color: t.primary, fontWeight: '700' },
  publikovatRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: t.border, justifyContent: 'center', padding: 2,
  },
  toggleActive: { backgroundColor: t.secondary },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: t.surface },
  toggleKnobActive: { alignSelf: 'flex-end' },
  submitBtn: {
    backgroundColor: t.primary, borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  submitBtnText: { color: t.onPrimary, fontSize: 15, fontWeight: '700' },
  karta: {
    backgroundColor: t.surface, borderRadius: 14, padding: 16,
    shadowColor: t.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  kartaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  kartaEmoji: { fontSize: 28 },
  kartaInfo: { flex: 1 },
  kartaKategoria: { fontSize: 12, fontWeight: '800', color: t.text, letterSpacing: 0.5 },
  kartaDatum: { fontSize: 11, color: t.textPlaceholder, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  kartaPopis: { fontSize: 14, color: t.textSecondary, lineHeight: 20, marginBottom: 6 },
  kartaAdresa: { fontSize: 12, color: t.textMuted, marginBottom: 4 },
  akcie: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  akciaBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  akciaBtnText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: t.textMuted, fontWeight: '600' },
  historiaContainer: {
    marginTop: 12, borderTopWidth: 1,
    borderTopColor: t.divider, paddingTop: 10, gap: 6,
  },
  historiaTitle: { fontSize: 10, fontWeight: '800', color: t.textPlaceholder, letterSpacing: 1, marginBottom: 4 },
  historiaZaznam: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historiaText: { fontSize: 12, color: t.textSecondary },
  historiaDatum: { fontSize: 11, color: t.textPlaceholder },

  // Cover picker pre nová aktualita
  coverPickerBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: t.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  coverPickerPlaceholder: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: t.surfaceAlt,
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
