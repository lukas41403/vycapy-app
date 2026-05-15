import { AppHeader } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import {
    Linking, SafeAreaView, ScrollView,
    StatusBar, StyleSheet, Text,
    TouchableOpacity, View,
} from 'react-native'

const KONTAKTY = [
  {
    meno: 'Ing. Jozef Holúbek',
    funkcia: 'Starosta obce',
    telefon: '0907 167 383',
    email: 'starosta@vycapy-opatovce.sk',
    emoji: '👨‍💼',
  },
  {
    meno: 'Ing. Jarmila Bernátová',
    funkcia: 'Prednostka obecného úradu',
    telefon: '0908 726 873',
    email: 'jarmila.bernatova@vycapy-opatovce.sk',
    emoji: '👩‍💼',
  },
  {
    meno: 'Bc. Dáša Dávidová',
    funkcia: 'Účtovníčka obce',
    telefon: '0904 617 009',
    email: 'dasa.davidova@vycapy-opatovce.sk',
    emoji: '👩‍💼',
  },
  {
    meno: 'Ing. Lucia Augustíneková',
    funkcia: 'Referentka',
    telefon: '037 / 77 951 51',
    email: 'lucia.augustinekova@vycapy-opatovce.sk',
    emoji: '👩‍💼',
  },
  {
    meno: 'Mgr. Lujza Balková',
    funkcia: 'Referentka',
    telefon: '037 / 77 951 51',
    email: 'lujza.balkova@vycapy-opatovce.sk',
    emoji: '👩‍💼',
  },
  {
    meno: 'Ing. Mária Pekárová',
    funkcia: 'Hlavný kontrolór obce',
    telefon: null,
    email: 'hlavnykontrolor@vycapy-opatovce.sk',
    emoji: '👩‍💼',
  },
]

const URADNE_HODINY = [
  { den: 'Pondelok', cas: '07:30 – 12:00 | 12:30 – 16:00' },
  { den: 'Utorok',   cas: '07:30 – 12:00 | 12:30 – 15:30' },
  { den: 'Streda',   cas: '07:30 – 12:00 | 12:30 – 17:00' },
  { den: 'Štvrtok',  cas: 'Nestránkový deň' },
  { den: 'Piatok',   cas: '07:30 – 12:00' },
]

export default function KontaktyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <ScrollView showsVerticalScrollIndicator={false}>

        <AppHeader title="Kontakty" subtitle="Obecný úrad Výčapy-Opatovce" />

        {/* ADRESA — brandová karta s farbou obce */}
        <View style={styles.adresaKarta}>
          <View style={styles.adresaRow}>
            <Text style={styles.adresaEmoji}>📍</Text>
            <View>
              <Text style={styles.adresaText}>Výčapská 467/14</Text>
              <Text style={styles.adresaText}>951 44 Výčapy-Opatovce</Text>
            </View>
          </View>
          <View style={styles.adresaRow}>
            <Text style={styles.adresaEmoji}>📞</Text>
            <TouchableOpacity onPress={() => Linking.openURL('tel:037779515')}>
              <Text style={styles.adresaLink}>037 / 77 951 51</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.adresaRow}>
            <Text style={styles.adresaEmoji}>✉️</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:info@vycapy-opatovce.sk')}>
              <Text style={styles.adresaLink}>info@vycapy-opatovce.sk</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ÚRADNÉ HODINY */}
        <View style={styles.sekcia}>
          <Text style={styles.seklabel}>🕐 Úradné hodiny</Text>
          <View style={styles.hodinyKarta}>
            {URADNE_HODINY.map((h, i) => {
              const jeStvrtok = h.den === 'Štvrtok'
              const jeDnes = new Date().toLocaleDateString('sk-SK', { weekday: 'long' })
                .toLowerCase() === h.den.toLowerCase()
              return (
                <View key={i} style={[
                  styles.hodinyRow,
                  i < URADNE_HODINY.length - 1 && styles.hodinyRowBorder,
                  jeDnes && styles.hodinyRowDnes,
                ]}>
                  <Text style={[styles.hodinyDen, jeDnes && styles.hodinyDenDnes]}>
                    {h.den}{jeDnes && ' ← dnes'}
                  </Text>
                  <Text style={[
                    styles.hodinyCas,
                    jeStvrtok && styles.hodinyStvrtok,
                    jeDnes && styles.hodinyDenDnes,
                  ]}>
                    {h.cas}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* ZAMESTNANCI */}
        <View style={styles.sekcia}>
          <Text style={styles.seklabel}>👥 Zamestnanci úradu</Text>
          {KONTAKTY.map((k, i) => (
            <View key={i} style={styles.kontaktKarta}>
              <View style={styles.kontaktHeader}>
                <Text style={styles.kontaktEmoji}>{k.emoji}</Text>
                <View style={styles.kontaktInfo}>
                  <Text style={styles.kontaktMeno}>{k.meno}</Text>
                  <Text style={styles.kontaktFunkcia}>{k.funkcia}</Text>
                </View>
              </View>
              <View style={styles.kontaktAkcie}>
                {k.telefon && (
                  <TouchableOpacity
                    style={styles.kontaktBtn}
                    onPress={() => Linking.openURL(`tel:${k.telefon!.replace(/\s/g, '')}`)}
                  >
                    <Text style={styles.kontaktBtnText}>📞 {k.telefon}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.kontaktBtn, styles.kontaktBtnEmail]}
                  onPress={() => Linking.openURL(`mailto:${k.email}`)}
                >
                  <Text style={[styles.kontaktBtnText, styles.kontaktBtnEmailText]}>
                    ✉️ Email
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },

  // Adresová karta — brandová červená pre maximálnu identifikáciu
  adresaKarta: {
    backgroundColor: C.primary, margin: 16, borderRadius: 16,
    padding: 18, gap: 12,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  adresaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adresaEmoji: { fontSize: 18, width: 24 },
  adresaText: { fontSize: 14, color: 'rgba(255,255,255,0.92)', lineHeight: 20 },
  adresaLink: { fontSize: 14, color: C.onPrimary, fontWeight: '700', textDecorationLine: 'underline' },

  sekcia: { paddingHorizontal: 16, marginBottom: 16 },
  seklabel: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 10 },

  hodinyKarta: {
    backgroundColor: C.surface, borderRadius: 14,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  hodinyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
  },
  hodinyRowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  hodinyRowDnes: { backgroundColor: C.accentLight },
  hodinyDen: { fontSize: 14, fontWeight: '600', color: C.text },
  hodinyDenDnes: { color: C.accentDark, fontWeight: '800' },
  hodinyCas: { fontSize: 13, color: C.textSecondary },
  hodinyStvrtok: { color: C.brand.red, fontStyle: 'italic' },

  kontaktKarta: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16,
    marginBottom: 10,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  kontaktHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  kontaktEmoji: { fontSize: 32 },
  kontaktInfo: { flex: 1 },
  kontaktMeno: { fontSize: 15, fontWeight: '700', color: C.text },
  kontaktFunkcia: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  kontaktAkcie: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  kontaktBtn: {
    backgroundColor: C.secondaryLight, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  kontaktBtnEmail: { backgroundColor: C.status.info.bg },
  kontaktBtnText: { fontSize: 13, fontWeight: '700', color: C.secondary },
  kontaktBtnEmailText: { color: C.status.info.fg },
})
