/**
 * Senior — Kontakty.
 *
 * Volací zoznam:
 *   - Systémové kontakty (úrad, starosta, 112, 155, 158, 150, lekár, lekáreň)
 *   - Vlastné kontakty občana (manželka, syn, sused, osobný lekár)
 *   - "+ Pridať vlastný kontakt" → presmeruje na nastavenia
 *
 * Veľké tlačidlá s telefónnym číslom čitateľne pod menom.
 */

import {
  CustomKontakt,
  FONT_SCALES,
  formatTelefon,
  SENIOR,
  SystemKontakt,
  SYSTEM_KONTAKTY,
} from '@/constants/seniorMode'
import { useSeniorMode } from '@/hooks/useSeniorMode'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type Skupina = { titulok: string; emoji: string; items: (SystemKontakt | (CustomKontakt & { systemTag?: undefined }))[] }

export default function SeniorKontaktyScreen() {
  const router = useRouter()
  const { fontScale, customKontakty } = useSeniorMode()
  const F = FONT_SCALES[fontScale]

  // Zoskupenie kontaktov
  const skupiny: Skupina[] = useMemo(() => {
    const obec   = SYSTEM_KONTAKTY.filter(k => k.tag === 'Obec')
    const nudza  = SYSTEM_KONTAKTY.filter(k => k.tag === 'Núdza')
    const zdrav  = SYSTEM_KONTAKTY.filter(k => k.tag === 'Zdravie')
    return [
      { titulok: 'Vlastné kontakty', emoji: '👥', items: customKontakty },
      { titulok: 'Núdzové linky',    emoji: '🆘', items: nudza },
      { titulok: 'Obec',             emoji: '🏛️', items: obec },
      { titulok: 'Zdravie',          emoji: '💊', items: zdrav },
    ]
  }, [customKontakty])

  function zavolat(telefon: string, meno: string) {
    Alert.alert(
      'Zavolať?',
      `${meno}\n${formatTelefon(telefon)}`,
      [
        { text: 'Zrušiť', style: 'cancel' },
        { text: 'Zavolať', onPress: () => Linking.openURL(`tel:${telefon}`) },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Späť"
        >
          <Text style={[styles.backText, { fontSize: F.body }]}>← Späť</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: F.heading }]}>📞 Kontakty</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {skupiny.map(skupina => {
          if (skupina.items.length === 0 && skupina.titulok !== 'Vlastné kontakty') return null
          return (
            <View key={skupina.titulok} style={styles.skupina}>
              <Text style={[styles.skupinaTitulok, { fontSize: F.body }]}>
                {skupina.emoji} {skupina.titulok.toUpperCase()}
              </Text>

              {skupina.items.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { fontSize: F.small }]}>
                    Zatiaľ nemáte vlastné kontakty.
                  </Text>
                </View>
              ) : (
                skupina.items.map((k) => (
                  <TouchableOpacity
                    key={k.id}
                    style={styles.kontaktCard}
                    activeOpacity={0.85}
                    onPress={() => zavolat(k.telefon, k.meno)}
                    accessibilityRole="button"
                    accessibilityLabel={`Zavolať ${k.meno}, číslo ${formatTelefon(k.telefon)}`}
                  >
                    <Text style={[styles.kontaktEmoji, { fontSize: F.heading }]}>
                      {('emoji' in k && k.emoji) ? k.emoji : '👤'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.kontaktMeno, { fontSize: F.title }]} numberOfLines={1}>
                        {k.meno}
                      </Text>
                      {'vztah' in k && k.vztah && (
                        <Text style={[styles.kontaktVztah, { fontSize: F.small }]}>
                          {k.vztah}
                        </Text>
                      )}
                      <Text style={[styles.kontaktTel, { fontSize: F.body }]}>
                        {formatTelefon(k.telefon)}
                      </Text>
                    </View>
                    <View style={styles.callBtn}>
                      <Text style={[styles.callBtnText, { fontSize: F.body }]}>
                        ZAVOLAŤ
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {skupina.titulok === 'Vlastné kontakty' && (
                <TouchableOpacity
                  style={styles.addBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push('/senior-nastavenia' as never)}
                  accessibilityRole="button"
                  accessibilityLabel="Pridať vlastný kontakt"
                >
                  <Text style={[styles.addBtnEmoji, { fontSize: F.title }]}>＋</Text>
                  <Text style={[styles.addBtnText, { fontSize: F.body }]}>
                    Pridať vlastný kontakt
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SENIOR.colors.background },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 3, borderBottomColor: SENIOR.colors.text,
    gap: 8,
  },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { color: SENIOR.colors.primary, fontWeight: '800' },
  title: { fontWeight: '900', color: SENIOR.colors.text },

  scroll: { padding: 20, gap: 28 },

  skupina: { gap: 14 },
  skupinaTitulok: {
    fontWeight: '900',
    color: SENIOR.colors.text,
    letterSpacing: 0.8,
  },

  empty: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: SENIOR.colors.borderLight,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: { color: SENIOR.colors.textSecondary, fontWeight: '600' },

  kontaktCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 3,
    borderColor: SENIOR.colors.text,
    minHeight: 88,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  kontaktEmoji: {},
  kontaktMeno: { fontWeight: '900', color: SENIOR.colors.text },
  kontaktVztah: { color: SENIOR.colors.textSecondary, marginTop: 2, fontWeight: '600' },
  kontaktTel: { color: SENIOR.colors.text, marginTop: 4, fontWeight: '700' },
  callBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  callBtnText: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.5 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SENIOR.colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  addBtnEmoji: { color: '#FFFFFF', fontWeight: '900' },
  addBtnText: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.3 },
})
