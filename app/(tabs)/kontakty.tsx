import { AppHeader } from '@/components/AppHeader'
import { AnimatedEntrance, AtmosphereBackground, Icon, IconTile, PressableScale } from '@/components/ui'
import { C } from '@/constants/colors'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useMemo } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const KONTAKTY = [
  { meno: 'Ing. Jozef Holúbek',      funkcia: 'Starosta obce',                telefon: '0907 167 383',     email: 'starosta@vycapy-opatovce.sk',           gradient: C.gradients.gold },
  { meno: 'Ing. Jarmila Bernátová',  funkcia: 'Prednostka obecného úradu',    telefon: '0908 726 873',     email: 'jarmila.bernatova@vycapy-opatovce.sk',  gradient: C.gradients.blue },
  { meno: 'Bc. Dáša Dávidová',       funkcia: 'Účtovníčka obce',              telefon: '0904 617 009',     email: 'dasa.davidova@vycapy-opatovce.sk',      gradient: C.gradients.teal },
  { meno: 'Ing. Lucia Augustíneková',funkcia: 'Referentka',                   telefon: '037 / 77 951 51',  email: 'lucia.augustinekova@vycapy-opatovce.sk',gradient: C.gradients.purple },
  { meno: 'Mgr. Lujza Balková',      funkcia: 'Referentka',                   telefon: '037 / 77 951 51',  email: 'lujza.balkova@vycapy-opatovce.sk',      gradient: C.gradients.indigo },
  { meno: 'Ing. Mária Pekárová',     funkcia: 'Hlavný kontrolór obce',        telefon: null,               email: 'hlavnykontrolor@vycapy-opatovce.sk',    gradient: C.gradients.slate },
]

const URADNE_HODINY = [
  { den: 'Pondelok', cas: '07:30 – 12:00 | 12:30 – 16:00' },
  { den: 'Utorok',   cas: '07:30 – 12:00 | 12:30 – 15:30' },
  { den: 'Streda',   cas: '07:30 – 12:00 | 12:30 – 17:00' },
  { den: 'Štvrtok',  cas: 'Nestránkový deň' },
  { den: 'Piatok',   cas: '07:30 – 12:00' },
]

export default function KontaktyScreen() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AtmosphereBackground />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <AppHeader title="Kontakty" subtitle="Obecný úrad Výčapy-Opatovce" />

        {/* ADRESA — brandová karta */}
        <AnimatedEntrance delay={0} style={styles.sekcia}>
          <View style={styles.adresaKarta}>
            <View style={styles.decorCircle} />
            <View style={styles.adresaRow}>
              <Icon name="location" size={18} color="#FFFFFF" />
              <View>
                <Text style={styles.adresaText}>Výčapská 467/14</Text>
                <Text style={styles.adresaText}>951 44 Výčapy-Opatovce</Text>
              </View>
            </View>
            <PressableScale style={styles.adresaRow} scaleTo={0.97} onPress={() => Linking.openURL('tel:037779515')} accessibilityLabel="Zavolať na úrad">
              <Icon name="kontakty" size={18} color="#FFFFFF" />
              <Text style={styles.adresaLink}>037 / 77 951 51</Text>
            </PressableScale>
            <PressableScale style={styles.adresaRow} scaleTo={0.97} onPress={() => Linking.openURL('mailto:info@vycapy-opatovce.sk')} accessibilityLabel="Napísať e-mail">
              <Icon name="aktuality" size={18} color="#FFFFFF" />
              <Text style={styles.adresaLink}>info@vycapy-opatovce.sk</Text>
            </PressableScale>
          </View>
        </AnimatedEntrance>

        {/* ÚRADNÉ HODINY */}
        <AnimatedEntrance delay={70} style={styles.sekcia}>
          <View style={styles.seklabelRow}>
            <Icon name="time" size={16} color={t.primary} />
            <Text style={styles.seklabel}>Úradné hodiny</Text>
          </View>
          <View style={styles.hodinyKarta}>
            {URADNE_HODINY.map((h, i) => {
              const jeStvrtok = h.den === 'Štvrtok'
              const jeDnes = new Date().toLocaleDateString('sk-SK', { weekday: 'long' }).toLowerCase() === h.den.toLowerCase()
              return (
                <View key={i} style={[styles.hodinyRow, i < URADNE_HODINY.length - 1 && styles.hodinyRowBorder, jeDnes && styles.hodinyRowDnes]}>
                  <Text style={[styles.hodinyDen, jeDnes && styles.hodinyDenDnes]}>{h.den}{jeDnes && ' · dnes'}</Text>
                  <Text style={[styles.hodinyCas, jeStvrtok && styles.hodinyStvrtok, jeDnes && styles.hodinyDenDnes]}>{h.cas}</Text>
                </View>
              )
            })}
          </View>
        </AnimatedEntrance>

        {/* ZAMESTNANCI */}
        <AnimatedEntrance delay={140} style={styles.sekcia}>
          <View style={styles.seklabelRow}>
            <Icon name="people" size={16} color={t.primary} />
            <Text style={styles.seklabel}>Zamestnanci úradu</Text>
          </View>
          {KONTAKTY.map((k, i) => (
            <View key={i} style={styles.kontaktKarta}>
              <View style={styles.kontaktHeader}>
                <IconTile name="person" gradient={k.gradient} size={44} iconSize={22} />
                <View style={styles.kontaktInfo}>
                  <Text style={styles.kontaktMeno}>{k.meno}</Text>
                  <Text style={styles.kontaktFunkcia}>{k.funkcia}</Text>
                </View>
              </View>
              <View style={styles.kontaktAkcie}>
                {k.telefon && (
                  <PressableScale style={styles.kontaktBtn} scaleTo={0.96} onPress={() => Linking.openURL(`tel:${k.telefon!.replace(/\s/g, '')}`)} accessibilityLabel={`Zavolať ${k.meno}`}>
                    <Icon name="kontakty" size={14} color={t.secondary} />
                    <Text style={styles.kontaktBtnText}>{k.telefon}</Text>
                  </PressableScale>
                )}
                <PressableScale style={[styles.kontaktBtn, styles.kontaktBtnEmail]} scaleTo={0.96} onPress={() => Linking.openURL(`mailto:${k.email}`)} accessibilityLabel={`Napísať e-mail ${k.meno}`}>
                  <Icon name="aktuality" size={14} color={t.status.info.fg} />
                  <Text style={[styles.kontaktBtnText, styles.kontaktBtnEmailText]}>Email</Text>
                </PressableScale>
              </View>
            </View>
          ))}
        </AnimatedEntrance>
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  sekcia: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },

  adresaKarta: {
    backgroundColor: t.primary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md,
    overflow: 'hidden', ...shadows.md, shadowColor: C.brand.red,
  },
  decorCircle: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)', right: -50, top: -60 },
  adresaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  adresaText: { ...typo.body, color: 'rgba(255,255,255,0.92)', lineHeight: 20 },
  adresaLink: { ...typo.bodyB, color: '#FFFFFF', textDecorationLine: 'underline' },

  seklabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  seklabel: { ...typo.h2, color: t.text },

  hodinyKarta: { backgroundColor: t.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadows.sm, shadowColor: t.shadow },
  hodinyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  hodinyRowBorder: { borderBottomWidth: 1, borderBottomColor: t.divider },
  hodinyRowDnes: { backgroundColor: t.accentLight },
  hodinyDen: { ...typo.bodyB, color: t.text },
  hodinyDenDnes: { color: t.accentDark },
  hodinyCas: { ...typo.caption, color: t.textSecondary },
  hodinyStvrtok: { color: C.brand.red, fontStyle: 'italic' },

  kontaktKarta: { backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm, shadowColor: t.shadow },
  kontaktHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  kontaktInfo: { flex: 1 },
  kontaktMeno: { ...typo.h3, color: t.text },
  kontaktFunkcia: { ...typo.caption, color: t.textMuted, marginTop: 2 },
  kontaktAkcie: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  kontaktBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.secondaryLight, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  kontaktBtnEmail: { backgroundColor: t.status.info.bg },
  kontaktBtnText: { ...typo.captionB, color: t.secondary },
  kontaktBtnEmailText: { color: t.status.info.fg },
})
