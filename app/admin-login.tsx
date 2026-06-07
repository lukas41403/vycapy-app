import { ErbBadge } from '@/components/AppHeader'
import { AtmosphereBackground, Button, Icon, Input } from '@/components/ui'
import { supabase } from '@/src/lib/supabase'
import { ThemeColors, useThemeColors } from '@/src/theme/ThemeContext'
import { fonts, radius, shadows, spacing, typo } from '@/src/theme/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AdminLogin() {
  const t = useThemeColors()
  const styles = useMemo(() => makeStyles(t), [t])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function login() {
    if (!email || !password) { setError('Vyplňte email a heslo.'); return }
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('Nesprávny email alebo heslo.')
    else router.replace('/admin' as never)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AtmosphereBackground />
      <View style={styles.container}>
        <View style={styles.logoWrap}><ErbBadge variant="plain" /></View>
        <Text style={styles.title}>Admin panel</Text>
        <Text style={styles.sub}>Výčapy-Opatovce</Text>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Icon name="hlasenie" size={16} color={t.primary} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <Input label="Email" icon="aktuality" placeholder="admin@vycapy-opatovce.sk" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" containerStyle={styles.gap} />
          <Input label="Heslo" icon="admin" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry containerStyle={styles.gap} />
          <Button title="Prihlásiť sa" variant="primary" size="lg" fullWidth loading={loading} onPress={login} icon={<Icon name="shield" size={16} color="#FFFFFF" />} style={{ marginTop: spacing.sm }} />
          <Text style={styles.disclaimer}>Prístup len pre poverené osoby obecného úradu.</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const makeStyles = (t: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.background },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  logoWrap: { width: 88, height: 88, borderRadius: radius.xl, backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderLight, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, ...shadows.md, shadowColor: t.shadow },
  title: { fontFamily: fonts.display, fontSize: 28, color: t.text, marginBottom: 4 },
  sub: { ...typo.body, color: t.textMuted, marginBottom: spacing.xxl },
  form: { width: '100%', maxWidth: 400 },
  gap: { marginBottom: spacing.md },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: t.primaryLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: t.primary },
  errorText: { color: t.primaryDark, ...typo.caption, fontFamily: 'Inter_600SemiBold', flex: 1 },
  disclaimer: { ...typo.caption, color: t.textMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 18 },
})
