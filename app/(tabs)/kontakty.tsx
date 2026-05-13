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
  { den: 'Utorok', cas: '07:30 – 12:00 | 12:30 – 15:30' },
  { den: 'Streda', cas: '07:30 – 12:00 | 12:30 – 17:00' },
  { den: 'Štvrtok', cas: 'Nestránkový deň' },
  { den: 'Piatok', cas: '07:30 – 12:00' },
]

export default function KontaktyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Kontakty</Text>
          <Text style={styles.headerSub}>Obecný úrad Výčapy-Opatovce</Text>
        </View>

        {/* ADRESA */}
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
              const jeStvrток = h.den === 'Štvrtok'
              const jeDnes = new Date().toLocaleDateString('sk-SK', { weekday: 'long' })
                .toLowerCase() === h.den.toLowerCase()
              return (
                <View key={i} style={[
                  styles.hodinyRow,
                  i < URADNE_HODINY.length - 1 && styles.hodinyRowBorder,
                  jeDnes && styles.hodinyRowDnes,
                ]}>
                  <Text style={[styles.hodinyDen, jeDnes && styles.hodinyDenDnes]}>
                    {h.den} {jeDnes && '← dnes'}
                  </Text>
                  <Text style={[
                    styles.hodinyČas,
                    jeStvrток && styles.hodinyStvrток,
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
                    onPress={() => Linking.openURL(`tel:${k.telefon.replace(/\s/g, '')}`)}
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
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#EEEEEE',
  },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#888', marginTop: 4 },

  adresaKarta: {
    backgroundColor: '#1B5E20', margin: 16, borderRadius: 16,
    padding: 18, gap: 12,
  },
  adresaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adresaEmoji: { fontSize: 18, width: 24 },
  adresaText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  adresaLink: { fontSize: 14, color: '#fff', fontWeight: '600', textDecorationLine: 'underline' },

  sekcia: { paddingHorizontal: 16, marginBottom: 16 },
  seklabel: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },

  hodinyKarta: {
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  hodinyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
  },
  hodinyRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  hodinyRowDnes: { backgroundColor: '#E8F5E9' },
  hodinyDen: { fontSize: 14, fontWeight: '600', color: '#333' },
  hodinyDenDnes: { color: '#2E7D32' },
  hodinyČas: { fontSize: 13, color: '#555' },
  hodinyStvrток: { color: '#C62828', fontStyle: 'italic' },

  kontaktKarta: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  kontaktHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  kontaktEmoji: { fontSize: 32 },
  kontaktInfo: { flex: 1 },
  kontaktMeno: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  kontaktFunkcia: { fontSize: 13, color: '#888', marginTop: 2 },
  kontaktAkcie: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  kontaktBtn: {
    backgroundColor: '#E8F5E9', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  kontaktBtnEmail: { backgroundColor: '#E3F2FD' },
  kontaktBtnText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  kontaktBtnEmailText: { color: '#1565C0' },
})