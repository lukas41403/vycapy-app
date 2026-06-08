/**
 * Detail inzerátu — všetky fotky, popis, kontakt, action buttons.
 */

import { Badge } from '@/components/ui'
import { useBookmark } from '@/src/hooks/useBookmarks'
import {
  INZERAT_KATEGORIE,
  INZERAT_TYPY,
  Inzerat,
} from '@/src/hooks/useSusedskyPredaj'
import { zdielaj } from '@/src/lib/share'
import { supabase } from '@/src/lib/supabase'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, spacing, typo } from '@/src/theme/tokens'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const { width: SCREEN_W } = Dimensions.get('window')

function formatCena(inz: Inzerat): string {
  if (inz.typ === 'zadarmo') return 'Zadarmo'
  if (inz.typ === 'kupim' || inz.typ === 'hladam') return 'Hľadá sa'
  if (inz.cena == null) return 'Dohodou'
  return `${inz.cena.toLocaleString('sk-SK')} ${inz.mena ?? 'EUR'}`
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('sk-SK', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function InzeratDetail() {
  const router = useRouter()
  const t = useThemeColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [inz, setInz] = useState<Inzerat | null>(null)
  const [loading, setLoading] = useState(true)
  const [fotoIdx, setFotoIdx] = useState(0)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('susedsky_predaj')
        .select('*')
        .eq('id', id)
        .single()
      setInz(data as Inzerat)
      setLoading(false)
    }
    fetch()
  }, [id])

  const bookmark = useBookmark(
    inz
      ? {
          id: inz.id,
          kind: 'inzerat',
          title: inz.nazov,
          podtitul: formatCena(inz),
          kategoria: inz.kategoria,
        }
      : null,
  )

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!inz) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={[typo.h2, { color: t.text }]}>Inzerát neexistuje</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: t.primary, marginTop: 16, fontWeight: '800' }}>← Späť</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const typMeta = INZERAT_TYPY.find(x => x.id === inz.typ)!
  const katMeta = INZERAT_KATEGORIE.find(k => k.id === inz.kategoria)

  function zavolat() {
    if (!inz?.telefon) return
    const num = inz.telefon.replace(/\s/g, '')
    Alert.alert(
      'Zavolať?',
      `${inz.meno}\n${inz.telefon}`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        { text: 'Zavolať', onPress: () => Linking.openURL(`tel:${num}`) },
      ],
    )
  }

  function napisat() {
    if (!inz?.email) return
    const subject = encodeURIComponent(`Inzerát: ${inz.nazov}`)
    const body = encodeURIComponent(
      `Dobrý deň ${inz.meno},\n\nzaujal ma váš inzerát "${inz.nazov}" v obecnej aplikácii.\n\nS pozdravom`
    )
    Linking.openURL(`mailto:${inz.email}?subject=${subject}&body=${body}`)
  }

  async function zdielatInz() {
    if (!inz) return
    await zdielaj({
      title: inz.nazov,
      message:
        `${typMeta.emoji} ${typMeta.label}: ${inz.nazov}\n` +
        `${formatCena(inz)}\n` +
        (inz.popis ? `\n${inz.popis.slice(0, 200)}\n` : '') +
        `\nKontakt: ${inz.meno}\n` +
        (inz.telefon ? `📞 ${inz.telefon}\n` : '') +
        `\nViac v aplikácii Výčapy-Opatovce`,
    })
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.surface} />

      {/* Nav bar */}
      <View style={[styles.navBar, { borderBottomColor: t.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 16, color: t.primary, fontWeight: '700' }}>← Späť</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={bookmark.toggle}
            style={[styles.iconBtn, { backgroundColor: t.primaryLight }]}
            accessibilityRole="button"
            accessibilityLabel={bookmark.isMarked ? 'Odstrániť z môjho zoznamu' : 'Pridať do môjho zoznamu'}
          >
            <Text style={[styles.iconText, { color: t.primary }]}>
              {bookmark.isMarked ? '🔖' : '🏷️'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={zdielatInz}
            style={[styles.iconBtn, { backgroundColor: t.primaryLight }]}
            accessibilityRole="button"
            accessibilityLabel="Zdieľať"
          >
            <Text style={[styles.iconText, { color: t.primary }]}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* FOTKY — carousel */}
        {inz.foto_urls && inz.foto_urls.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W)
                setFotoIdx(idx)
              }}
            >
              {inz.foto_urls.map((url, i) => (
                <Image
                  key={i}
                  source={{ uri: url }}
                  style={{ width: SCREEN_W, height: 320, backgroundColor: '#EEE' }}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
            {inz.foto_urls.length > 1 && (
              <View style={styles.dotsRow}>
                {inz.foto_urls.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i === fotoIdx ? '#FFF' : 'rgba(255,255,255,0.5)' },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.fotkaPlaceholder, { backgroundColor: typMeta.farba + '22' }]}>
            <Text style={{ fontSize: 96 }}>{katMeta?.emoji ?? typMeta.emoji}</Text>
          </View>
        )}

        {/* Obsah */}
        <View style={{ padding: spacing.lg }}>
          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: spacing.sm }}>
            <Badge
              label={`${typMeta.emoji} ${typMeta.label}`}
              tone="info"
              style={{ backgroundColor: typMeta.farba + '22' }}
              textStyle={{ color: typMeta.farba }}
            />
            {katMeta && <Badge label={`${katMeta.emoji} ${katMeta.label}`} tone="neutral" />}
            {inz.stav === 'rezervovane' && <Badge label="Rezervované" tone="warning" />}
            {inz.stav === 'predane' && <Badge label="Predané" tone="success" />}
          </View>

          {/* Názov */}
          <Text style={[styles.nazov, { color: t.text }]}>{inz.nazov}</Text>
          <Text style={[styles.cena, { color: typMeta.farba }]}>{formatCena(inz)}</Text>

          {/* Popis */}
          {inz.popis && (
            <>
              <View style={[styles.divider, { backgroundColor: t.borderLight }]} />
              <Text style={[styles.popis, { color: t.textSecondary }]}>{inz.popis}</Text>
            </>
          )}

          {/* Meta */}
          <View style={[styles.metaBox, { backgroundColor: t.surfaceAlt }]}>
            <Text style={[styles.metaText, { color: t.textMuted }]}>
              📅 Pridané: {formatDatum(inz.created_at)}
            </Text>
            {inz.expiruje_at && (
              <Text style={[styles.metaText, { color: t.textMuted }]}>
                ⏳ Platí do: {formatDatum(inz.expiruje_at)}
              </Text>
            )}
          </View>

          {/* Kontakt */}
          <View style={[styles.kontaktBox, { backgroundColor: t.surface, borderColor: typMeta.farba }]}>
            <Text style={[styles.kontaktLabel, { color: t.textMuted }]}>KONTAKT</Text>
            <Text style={[styles.kontaktMeno, { color: t.text }]}>👤 {inz.meno}</Text>

            <View style={styles.kontaktBtnRow}>
              {inz.telefon && (
                <TouchableOpacity
                  style={[styles.kontaktBtn, { backgroundColor: typMeta.farba }]}
                  onPress={zavolat}
                  activeOpacity={0.85}
                >
                  <Text style={styles.kontaktBtnEmoji}>📞</Text>
                  <Text style={styles.kontaktBtnText}>Zavolať</Text>
                </TouchableOpacity>
              )}
              {inz.email && (
                <TouchableOpacity
                  style={[styles.kontaktBtn, { backgroundColor: t.surfaceAlt, borderWidth: 2, borderColor: typMeta.farba }]}
                  onPress={napisat}
                  activeOpacity={0.85}
                >
                  <Text style={styles.kontaktBtnEmoji}>✉️</Text>
                  <Text style={[styles.kontaktBtnText, { color: typMeta.farba }]}>Napísať</Text>
                </TouchableOpacity>
              )}
            </View>

            {inz.telefon && (
              <Text style={[styles.kontaktSub, { color: t.textMuted }]}>
                📞 {inz.telefon}
              </Text>
            )}
            {inz.email && (
              <Text style={[styles.kontaktSub, { color: t.textMuted }]}>
                ✉️ {inz.email}
              </Text>
            )}
          </View>

          <Text style={[styles.disclaimer, { color: t.textPlaceholder }]}>
            Obec nie je zodpovedná za obsah inzerátov ani transakcie medzi občanmi.
            Nevhodný obsah nahláste cez Hlásenie podnetov.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },

  navBar: {
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  iconText: { fontSize: 18, fontWeight: '800' },

  fotkaPlaceholder: {
    width: '100%', height: 240,
    justifyContent: 'center', alignItems: 'center',
  },
  dotsRow: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },

  nazov: { ...typo.display, fontSize: 24, marginBottom: 8 },
  cena: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },

  divider: { height: 1, marginVertical: spacing.lg },
  popis: { ...typo.body, lineHeight: 22 },

  metaBox: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  metaText: { fontSize: 12, fontWeight: '600' },

  kontaktBox: {
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    padding: spacing.lg,
    gap: 8,
  },
  kontaktLabel: { ...typo.label, marginBottom: 2 },
  kontaktMeno: { ...typo.h3 },
  kontaktBtnRow: { flexDirection: 'row', gap: 8, marginTop: spacing.sm, flexWrap: 'wrap' },
  kontaktBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.lg, paddingVertical: 12,
    borderRadius: radius.md,
  },
  kontaktBtnEmoji: { fontSize: 18 },
  kontaktBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  kontaktSub: { fontSize: 12, marginTop: 2 },

  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.lg, lineHeight: 15 },
})
