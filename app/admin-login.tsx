import { ErbBadge } from '@/components/AppHeader'
import { C } from '@/constants/colors'
import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator, SafeAreaView, StatusBar, StyleSheet,
    Text, TextInput, TouchableOpacity, View,
} from 'react-native'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function login() {
    if (!email || !password) {
      setError('Vyplňte email a heslo.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError('Nesprávny email alebo heslo.')
    } else {
      router.replace('/admin')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <ErbBadge variant="plain" />
        </View>
        <Text style={styles.title}>Admin panel</Text>
        <Text style={styles.sub}>Výčapy-Opatovce</Text>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@vycapy-opatovce.sk"
            placeholderTextColor={C.textPlaceholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Heslo</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={C.textPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={login}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={C.onPrimary} />
              : <Text style={styles.btnText}>Prihlásiť sa</Text>
            }
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Prístup len pre poverené osoby obecného úradu.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  container: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 32,
  },
  logoWrap: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 4 },
  sub: { fontSize: 14, color: C.textMuted, marginBottom: 40 },
  form: { width: '100%', maxWidth: 400 },
  errorBox: {
    backgroundColor: C.primaryLight, borderRadius: 10,
    padding: 12, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: C.primary,
  },
  errorText: { color: C.brand.redDark, fontSize: 14, textAlign: 'center', fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', color: C.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, padding: 14,
    fontSize: 15, color: C.text,
    backgroundColor: C.surface, marginBottom: 16,
  },
  btn: {
    backgroundColor: C.primary, borderRadius: 14,
    padding: 18, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: C.onPrimary, fontSize: 16, fontWeight: '700' },
  disclaimer: {
    fontSize: 12, color: C.textMuted, textAlign: 'center',
    marginTop: 20, lineHeight: 18,
  },
})
