import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator, SafeAreaView, ScrollView,
    StatusBar, StyleSheet, Text, TouchableOpacity, View,
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
  oznam:     C.status.info,
  akcia:     C.status.success,
  uzavierka: { bg: '#FFF3E0', text: '#E65100' },
  vypadok:   C.status.danger,
  sport:     C.status.accent,
  ine:       C.status.neutral,
}

const KATEGORIA_LABEL: Record<string, string> = {
  oznam: 'Oznam', akcia: 'Akcia', uzavierka: 'Uzávierka',
  vypadok: 'Výpadok', sport: 'Šport', ine: 'Iné',
}

export default function AktualitaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [aktualita, setAktualita] = useState<Aktualita | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Späť</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      )}

      {!loading && aktualita && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.meta}>
            <View style={[styles.badge, { backgroundColor: KATEGORIA_FARBY[aktualita.kategoria]?.bg }]}>
              <Text style={[styles.badgeText, { color: KATEGORIA_FARBY[aktualita.kategoria]?.text }]}>
                {KATEGORIA_LABEL[aktualita.kategoria]}
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

          <Text style={styles.title}>{aktualita.title}</Text>
          {aktualita.perex && <Text style={styles.perex}>{aktualita.perex}</Text>}

          <View style={styles.divider} />

          <Text style={styles.body}>{aktualita.body}</Text>
        </ScrollView>
      )}

      {!loading && !aktualita && (
        <View style={styles.center}>
          <Text style={styles.errorText}>Aktualita sa nenašla</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.surface },
  navBar: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.borderLight,
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: C.primary, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  datum: { fontSize: 13, color: C.textPlaceholder },
  title: { fontSize: 26, fontWeight: '800', color: C.text, lineHeight: 34, marginBottom: 12 },
  perex: { fontSize: 17, color: C.textSecondary, lineHeight: 26, marginBottom: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: C.divider, marginBottom: 20 },
  body: { fontSize: 16, color: C.text, lineHeight: 26 },
  errorText: { fontSize: 16, color: C.textMuted },
})
