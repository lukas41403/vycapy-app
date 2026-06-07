/**
 * Detail aktuality — editoriálny článok (serif headline, signature flag accent).
 */

import { Badge, Button, FlagBanner, Icon, IconTile, PressableScale } from '@/components/ui'
import { katLabel, katTone, katVisual } from '@/src/config/kategorie'
import { supabase } from '@/src/lib/supabase'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, spacing, typo } from '@/src/theme/tokens'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Aktualita = {
  id: string
  title: string
  perex: string | null
  body: string
  kategoria: string
  published_at: string | null
  cover_url: string | null
}

const HERO_HEIGHT = 280

export default function AktualitaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const [aktualita, setAktualita] = useState<Aktualita | null>(null)
  const [loading, setLoading] = useState(true)
  const [ulozene, setUlozene] = useState(false)

  useEffect(() => {
    async function fetchOne() {
      const { data } = await supabase.from('aktuality').select('*').eq('id', id).single()
      setAktualita(data as Aktualita)
      setLoading(false)
    }
    fetchOne()
  }, [id])

  async function zdielat() {
    if (!aktualita) return
    try {
      await Share.share({
        title: aktualita.title,
        message: `${aktualita.title}\n\n${aktualita.perex || aktualita.body.slice(0, 200) + '…'}\n\n— Obec Výčapy-Opatovce`,
      })
    } catch {
      Alert.alert('Chyba', 'Zdieľanie zlyhalo.')
    }
  }

  const vis = aktualita ? katVisual(aktualita.kategoria) : null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <PressableScale style={styles.backBtn} scaleTo={0.94} onPress={() => router.back()} accessibilityLabel="Späť">
          <Icon name="chevronBack" size={22} color={t.primary} />
          <Text style={styles.backText}>Späť</Text>
        </PressableScale>
        {aktualita && (
          <PressableScale style={styles.shareIcon} scaleTo={0.9} onPress={zdielat} accessibilityLabel="Zdieľať">
            <Icon name="share" size={18} color={t.primary} />
          </PressableScale>
        )}
      </View>

      {loading && <View style={styles.center}><ActivityIndicator size="large" color={t.primary} /></View>}

      {!loading && aktualita && vis && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {aktualita.cover_url ? (
            <View style={styles.heroWrap}>
              <Image source={{ uri: aktualita.cover_url }} style={styles.heroImage} contentFit="cover" transition={300} />
            </View>
          ) : (
            <IconTile name={vis.icon} gradient={vis.gradient} cornerRadius={0} iconSize={88} style={styles.heroPlaceholder} />
          )}

          <View style={styles.content}>
            <View style={styles.meta}>
              <Badge label={katLabel(aktualita.kategoria)} tone={katTone(aktualita.kategoria)} />
              <Text style={styles.datum}>
                {aktualita.published_at ? new Date(aktualita.published_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </Text>
            </View>

            <Text style={styles.title}>{aktualita.title}</Text>
            <FlagBanner width={64} height={4} style={{ marginBottom: spacing.lg }} />

            {aktualita.perex && <Text style={styles.perex}>{aktualita.perex}</Text>}
            <Text style={styles.body}>{aktualita.body}</Text>

            <View style={styles.actions}>
              <Button title="Zdieľať" variant="primary" fullWidth onPress={zdielat} icon={<Icon name="share" size={16} color="#FFFFFF" />} style={{ flex: 1 }} />
              <Button
                title={ulozene ? 'Uložené' : 'Uložiť'}
                variant="outline"
                onPress={() => setUlozene(u => !u)}
                icon={<Icon name={ulozene ? 'bookmark' : 'bookmark'} variant={ulozene ? 'filled' : 'outline'} size={16} color={t.primary} />}
                style={{ flex: 1 }}
              />
            </View>

            <Text style={styles.disclaimer}>Zdroj: Oficiálna aplikácia obce Výčapy-Opatovce</Text>
          </View>
        </ScrollView>
      )}

      {!loading && !aktualita && (
        <View style={styles.center}>
          <Icon name="search" size={44} color={t.textMuted} />
          <Text style={styles.errorText}>Aktualita sa nenašla</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.surface },
  navBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: t.borderLight, backgroundColor: t.surface,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingRight: spacing.sm },
  backText: { ...typo.bodyB, color: t.primary },
  shareIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: t.primaryLight, justifyContent: 'center', alignItems: 'center' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  errorText: { ...typo.body, color: t.textMuted },

  scroll: { paddingBottom: 40 },
  heroWrap: { position: 'relative' },
  heroImage: { width: '100%', height: HERO_HEIGHT, backgroundColor: t.surfaceAlt },
  heroPlaceholder: { width: '100%', height: HERO_HEIGHT, borderRadius: 0 },

  content: { padding: spacing.xl },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  datum: { ...typo.caption, color: t.textPlaceholder },

  title: { fontFamily: fonts.display, fontSize: 30, color: t.text, lineHeight: 38, letterSpacing: -0.6, marginBottom: spacing.md },
  perex: { fontSize: 18, color: t.textSecondary, lineHeight: 27, fontStyle: 'italic', fontFamily: fonts.medium, marginBottom: spacing.lg },
  body: { fontSize: 16, color: t.text, lineHeight: 26, fontFamily: fonts.regular },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  disclaimer: { ...typo.caption, color: t.textMuted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },
})
