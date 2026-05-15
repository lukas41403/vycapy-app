/**
 * Detail aktuality — article layout.
 */

import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type Aktualita = {
  id: string
  title: string
  perex: string | null
  body: string
  kategoria: string
  published_at: string | null
  cover_url: string | null
}

const KATEGORIA_FARBY: Record<string, { bg: string; text: string }> = {
  oznam:     { bg: C.status.info.bg,    text: C.status.info.fg },
  akcia:     { bg: C.status.success.bg, text: C.status.success.fg },
  uzavierka: { bg: '#FFF3E0',           text: '#E65100' },
  vypadok:   { bg: C.status.danger.bg,  text: C.status.danger.fg },
  sport:     { bg: '#E3F2FD',           text: '#1565C0' },
  ine:       { bg: '#ECEFF1',           text: '#37474F' },
}

const KATEGORIA_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

const KATEGORIA_PLACEHOLDER: Record<string, { bg: string; emoji: string }> = {
  oznam:     { bg: '#90A4AE', emoji: '📋' },
  akcia:     { bg: '#1B5E20', emoji: '🎉' },
  uzavierka: { bg: '#C62828', emoji: '🚧' },
  vypadok:   { bg: '#C62828', emoji: '⚠️' },
  sport:     { bg: '#1565C0', emoji: '⚽' },
  ine:       { bg: '#607D8B', emoji: '📰' },
}

export default function AktualitaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [aktualita, setAktualita] = useState<Aktualita | null>(null)
  const [loading, setLoading] = useState(true)
  const [ulozene, setUlozene] = useState(false)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('aktuality')
        .select('*')
        .eq('id', id)
        .single()
      setAktualita(data)
      setLoading(false)
    }
    fetch()
  }, [id])

  async function zdielat() {
    if (!aktualita) return
    try {
      await Share.share({
        title: aktualita.title,
        message: `${aktualita.title}\n\n${aktualita.perex || aktualita.body.slice(0, 200) + '...'}\n\n— Obec Výčapy-Opatovce`,
      })
    } catch {
      Alert.alert('Chyba', 'Zdieľanie zlyhalo.')
    }
  }

  const kat = aktualita
    ? (KATEGORIA_FARBY[aktualita.kategoria] ?? KATEGORIA_FARBY.ine)
    : null
  const placeholder = aktualita
    ? (KATEGORIA_PLACEHOLDER[aktualita.kategoria] ?? KATEGORIA_PLACEHOLDER.ine)
    : null

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Späť</Text>
        </TouchableOpacity>
        {aktualita && (
          <TouchableOpacity onPress={zdielat} style={styles.shareIcon}>
            <Text style={styles.shareIconText}>↗</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      )}

      {!loading && aktualita && kat && placeholder && (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          {aktualita.cover_url ? (
            <View style={styles.heroWrap}>
              <Image
                source={{ uri: aktualita.cover_url }}
                style={styles.heroImage}
                contentFit="cover"
                transition={300}
              />
              <View style={styles.heroOverlay} pointerEvents="none" />
            </View>
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: placeholder.bg }]}>
              <Text style={styles.heroPlaceholderEmoji}>{placeholder.emoji}</Text>
              <View style={styles.heroOverlay} pointerEvents="none" />
            </View>
          )}

          <View style={styles.content}>
            {/* Meta */}
            <View style={styles.meta}>
              <View style={[styles.badge, { backgroundColor: kat.bg }]}>
                <Text style={[styles.badgeText, { color: kat.text }]}>
                  {KATEGORIA_LABEL[aktualita.kategoria] ?? aktualita.kategoria}
                </Text>
              </View>
              <Text style={styles.datum}>
                {aktualita.published_at
                  ? new Date(aktualita.published_at).toLocaleDateString('sk-SK', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : ''}
              </Text>
            </View>

            {/* Titulok */}
            <Text style={styles.title}>{aktualita.title}</Text>
            <View style={styles.divider} />

            {/* Perex */}
            {aktualita.perex && (
              <Text style={styles.perex}>{aktualita.perex}</Text>
            )}

            {/* Body */}
            <Text style={styles.body}>{aktualita.body}</Text>

            {/* Akcie */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={zdielat}
                activeOpacity={0.8}
              >
                <Text style={styles.actionPrimaryText}>↗  Zdieľať</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionSecondary]}
                activeOpacity={0.8}
                onPress={() => setUlozene(u => !u)}
              >
                <Text style={styles.actionSecondaryText}>
                  {ulozene ? '★  Uložené' : '☆  Uložiť'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.disclaimer}>
              Zdroj: Oficiálna aplikácia obce Výčapy-Opatovce
            </Text>
          </View>
        </ScrollView>
      )}

      {!loading && !aktualita && (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>🔍</Text>
          <Text style={styles.errorText}>Aktualita sa nenašla</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const HERO_HEIGHT = 280

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
    backgroundColor: C.surface,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: C.primary, fontWeight: '700' },
  shareIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  shareIconText: { fontSize: 18, color: C.primary, fontWeight: '800' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  errorIcon: { fontSize: 48 },
  errorText: { fontSize: 16, color: C.textMuted },

  scroll: { paddingBottom: 40 },

  heroWrap: { position: 'relative' },
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: C.surfaceAlt,
  },
  heroPlaceholder: {
    width: '100%',
    height: HERO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderEmoji: { fontSize: 96, opacity: 0.9 },
  heroOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  content: { padding: 20 },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  badge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  datum: { fontSize: 13, color: C.textPlaceholder },

  title: {
    fontSize: 28, fontWeight: '800', color: C.text,
    lineHeight: 36, letterSpacing: -0.5, marginBottom: 16,
  },

  divider: { height: 2, backgroundColor: C.divider, marginBottom: 18, width: 40 },

  perex: {
    fontSize: 18,
    color: C.textSecondary,
    lineHeight: 27,
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 20,
  },

  body: { fontSize: 16, color: C.text, lineHeight: 26 },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionPrimary: { backgroundColor: C.primary },
  actionPrimaryText: { color: C.onPrimary, fontSize: 15, fontWeight: '700' },
  actionSecondary: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  actionSecondaryText: { color: C.text, fontSize: 15, fontWeight: '700' },

  disclaimer: {
    fontSize: 12, color: C.textMuted, textAlign: 'center',
    marginTop: 24, lineHeight: 18,
  },
})