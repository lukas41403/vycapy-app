/**
 * AI Referentka Marta — chat UI s quick actions + voice ready.
 *
 * Diferenciátor: nie generický chatbot, ale "AI referent konkrétnej obce".
 * Quick actions sú sticky pod inputom — vždy dostupné, brutálne zlepšujú onboarding.
 * Mikrofón button je pripravený pre voice input (audio capture neskôr cez expo-av).
 */

import { Badge } from '@/components/ui'
import { useTenant } from '@/src/config/tenant'
import {
  generujSessionId,
  opytajSaReferentky,
  Sprava,
  ulozKonverzaciu,
} from '@/src/lib/referentka'
import { useThemeColors } from '@/src/theme/ThemeContext'
import { radius, shadows, spacing, touchTarget, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const MARTA_FIALOVA = '#6A1B9A'
const MARTA_LIGHT = '#F3E5F5'

/** Quick actions — fix-set frekventovaných intentov. */
type QuickAction = {
  id: string
  emoji: string
  label: string         // krátky label na chip
  prompt: string        // celá veta, ktorá sa pošle Marte
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'odpad',    emoji: '🗑️', label: 'Zber odpadu',     prompt: 'Kedy je najbližší zber odpadu? Aké typy odpadu sa zbierajú v tomto týždni?' },
  { id: 'nahlasit', emoji: '⚠️', label: 'Nahlásiť problém', prompt: 'Chcem nahlásiť problém v obci. Kam mám ísť v aplikácii a aké údaje budem potrebovať?' },
  { id: 'hodiny',   emoji: '🕐', label: 'Úradné hodiny',   prompt: 'Aké sú úradné hodiny obecného úradu? Je dnes otvorené?' },
  { id: 'ziadost',  emoji: '📝', label: 'Podať žiadosť',   prompt: 'Chcem podať žiadosť na obecný úrad. Aké možnosti mám a ako postupovať?' },
  { id: 'kontakty', emoji: '📞', label: 'Kontakty',        prompt: 'Aké sú kontakty na obec? Telefón, email, adresa?' },
  { id: 'pobyt',    emoji: '🏠', label: 'Trvalý pobyt',    prompt: 'Ako si vybavím prihlásenie na trvalý pobyt v obci?' },
]

export default function ReferentkaScreen() {
  const router = useRouter()
  const t = useThemeColors()
  const tenant = useTenant()

  // Personalizovaná úvodná správa s kontextom obce
  const UVODNA_SPRAVA: Sprava = {
    rola: 'assistant',
    obsah:
      `Dobrý deň! Som Marta, vaša AI referentka ${tenant.obecnyUrad.nazov}. ` +
      `Som tu 24 hodín denne a rada vám pomôžem s informáciami o našej obci, úradných hodinách, ` +
      `odpadoch, podaniach a kontaktoch.\n\nVyberte si rýchlu otázku alebo napíšte vlastnú.`,
  }

  const [spravy, setSpravy] = useState<Sprava[]>([UVODNA_SPRAVA])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [chyba, setChyba] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)
  const sessionId = useRef(generujSessionId())

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
  }, [spravy, thinking])

  async function poslat(text: string) {
    const trimnute = text.trim()
    if (!trimnute || thinking) return

    const userSprava: Sprava = { rola: 'user', obsah: trimnute }
    const noveSpravy = [...spravy, userSprava]
    setSpravy(noveSpravy)
    setInput('')
    setThinking(true)
    setChyba(null)

    ulozKonverzaciu(sessionId.current, 'user', trimnute)

    const historia = spravy.filter(s => s !== UVODNA_SPRAVA || spravy[0] === UVODNA_SPRAVA)

    try {
      const odpoved = await opytajSaReferentky(trimnute, historia)
      const martaSprava: Sprava = { rola: 'assistant', obsah: odpoved }
      setSpravy(prev => [...prev, martaSprava])
      ulozKonverzaciu(sessionId.current, 'assistant', odpoved)
    } catch (e: any) {
      setChyba(e?.message ?? 'Neznáma chyba')
      setSpravy(prev => [
        ...prev,
        {
          rola: 'assistant',
          obsah:
            `⚠️ Prepáčte, momentálne vás neviem obslúžiť. Skúste prosím neskôr alebo ` +
            `kontaktujte úrad priamo: ${tenant.obecnyUrad.telefon} alebo ${tenant.obecnyUrad.email}.`,
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  function handleVoicePress() {
    // Voice input — placeholder. Pre plnú funkčnosť:
    //   1. npx expo install expo-av expo-speech
    //   2. requestPermissionsAsync()
    //   3. recordAsync() → STT (cez OpenAI Whisper API alebo Google STT)
    //   4. setInput(transcribed) alebo priamo poslat(transcribed)
    Alert.alert(
      'Hlasový vstup',
      'Pre Martu pripravujeme možnosť hovoriť do mikrofónu. Funkcia bude dostupná v ďalšej verzii aplikácie.',
      [{ text: 'OK' }],
    )
  }

  function zacniZnova() {
    setSpravy([UVODNA_SPRAVA])
    setChyba(null)
    sessionId.current = generujSessionId()
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={MARTA_FIALOVA} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={10}>
            <Text style={styles.backText}>← Späť</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={zacniZnova} style={styles.resetBtn} hitSlop={10}>
            <Text style={styles.resetText}>↻ Nový chat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Marta</Text>
            <Text style={styles.headerSub}>AI referentka · {tenant.nazov}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online 24/7 · Odpovedá za sekundy</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chat}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {spravy.map((s, i) => (
            <Bublina key={i} sprava={s} />
          ))}
          {thinking && <TypingIndicator />}

          {/* Initial quick actions — väčšie, vizuálne dôraznejšie */}
          {spravy.length <= 1 && !thinking && (
            <View style={styles.initialQA}>
              <View style={styles.initialBadgeRow}>
                <Badge label="RÝCHLY ŠTART" tone="accent" />
              </View>
              <Text style={[styles.qaTitle, { color: t.text }]}>
                S čím vám môžem pomôcť?
              </Text>
              <View style={styles.qaGrid}>
                {QUICK_ACTIONS.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.qaCard}
                    onPress={() => poslat(a.prompt)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={a.label}
                  >
                    <Text style={styles.qaEmoji}>{a.emoji}</Text>
                    <Text style={styles.qaLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {chyba && (
            <View style={styles.errBox}>
              <Text style={styles.errText} numberOfLines={3}>
                Chyba: {chyba}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Sticky quick actions strip — viditeľné aj počas chatu */}
        {spravy.length > 1 && !thinking && (
          <View style={[styles.stickyQA, { backgroundColor: t.surface, borderTopColor: t.borderLight }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stickyQARow}
              keyboardShouldPersistTaps="handled"
            >
              {QUICK_ACTIONS.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.stickyChip}
                  onPress={() => poslat(a.prompt)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.stickyChipText}>{a.emoji}  {a.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input row */}
        <View style={[styles.inputRow, { backgroundColor: t.surface, borderTopColor: t.borderLight }]}>
          {/* Mikrofón */}
          <TouchableOpacity
            style={styles.micBtn}
            onPress={handleVoicePress}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Hlasový vstup"
          >
            <Text style={styles.micText}>🎤</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: t.surfaceAlt, color: t.text }]}
            placeholder="Napíšte správu pre Martu…"
            placeholderTextColor={t.textPlaceholder}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={() => poslat(input)}
            returnKeyType="send"
            editable={!thinking}
            blurOnSubmit
            accessibilityLabel="Správa pre Martu"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || thinking) && { backgroundColor: t.border },
            ]}
            onPress={() => poslat(input)}
            disabled={!input.trim() || thinking}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Odoslať správu"
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Bublina ─────────────────────────────────────────────────────────────
function Bublina({ sprava }: { sprava: Sprava }) {
  const t = useThemeColors()
  const jeUser = sprava.rola === 'user'
  return (
    <View style={[styles.bublinaRow, jeUser && styles.bublinaRowUser]}>
      {!jeUser && (
        <View style={styles.bublinaAvatar}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
        </View>
      )}
      <View
        style={[
          styles.bublina,
          jeUser
            ? { backgroundColor: t.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: t.surfaceAlt, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text style={[styles.bublinaText, { color: jeUser ? t.onPrimary : t.text }]}>
          {sprava.obsah}
        </Text>
      </View>
    </View>
  )
}

// ─── Typing indikátor ─────────────────────────────────────────────────────
function TypingIndicator() {
  const t = useThemeColors()
  const a = useRef(new Animated.Value(0)).current
  const b = useRef(new Animated.Value(0)).current
  const c = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: 400, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      )
    const anims = [animate(a, 0), animate(b, 150), animate(c, 300)]
    anims.forEach(an => an.start())
    return () => anims.forEach(an => an.stop())
  }, [a, b, c])

  const dot = (v: Animated.Value) => ({
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
  })

  return (
    <View style={styles.bublinaRow}>
      <View style={styles.bublinaAvatar}>
        <Text style={{ fontSize: 16 }}>🤖</Text>
      </View>
      <View style={[styles.bublina, { backgroundColor: t.surfaceAlt, flexDirection: 'row', gap: 5, paddingHorizontal: 16, paddingVertical: 14, borderBottomLeftRadius: 4 }]}>
        <Animated.View style={[styles.typingDot, dot(a)]} />
        <Animated.View style={[styles.typingDot, dot(b)]} />
        <Animated.View style={[styles.typingDot, dot(c)]} />
      </View>
    </View>
  )
}

// ─── Štýly ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    backgroundColor: MARTA_FIALOVA,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  back: { paddingVertical: 4 },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  resetText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 28 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2, fontWeight: '600' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#69F0AE' },
  onlineText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Chat
  chat: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },

  bublinaRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, maxWidth: '100%' },
  bublinaRowUser: { justifyContent: 'flex-end' },
  bublinaAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: MARTA_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  bublina: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bublinaText: { ...typo.body },

  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#888' },

  // Initial quick actions (väčšia mriežka)
  initialQA: { marginTop: spacing.xl, gap: spacing.md },
  initialBadgeRow: { flexDirection: 'row' },
  qaTitle: { ...typo.h2, marginBottom: spacing.sm },
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  qaCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 88,
    backgroundColor: MARTA_LIGHT,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: MARTA_FIALOVA + '33',
    justifyContent: 'center',
    gap: 6,
    ...shadows.sm,
  },
  qaEmoji: { fontSize: 24 },
  qaLabel: { fontSize: 14, fontWeight: '700', color: MARTA_FIALOVA, letterSpacing: -0.1 },

  // Sticky quick actions (počas chatu)
  stickyQA: {
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
  },
  stickyQARow: { paddingHorizontal: spacing.md, gap: spacing.sm },
  stickyChip: {
    backgroundColor: MARTA_LIGHT,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: MARTA_FIALOVA + '33',
  },
  stickyChipText: { fontSize: 13, fontWeight: '700', color: MARTA_FIALOVA },

  // Error
  errBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#C62828',
  },
  errText: { fontSize: 12, color: '#8E1F1F' },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: 1,
  },
  micBtn: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: touchTarget.min / 2,
    backgroundColor: MARTA_LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  micText: { fontSize: 22 },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: touchTarget.min,
  },
  sendBtn: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: touchTarget.min / 2,
    backgroundColor: MARTA_FIALOVA,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: -2 },
})
