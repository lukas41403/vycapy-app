import { supabase } from '@/src/lib/supabase'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    ActivityIndicator, SafeAreaView, StyleSheet,
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
      <View style={styles.container}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>V–O</Text>
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
            placeholderTextColor="#BBB"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Heslo</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#BBB"
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
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Prihlásiť sa</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  container: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 32,
  },
  logoBadge: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#1B5E20',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 20, letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: 40 },
  form: { width: '100%', maxWidth: 400 },
  errorBox: {
    backgroundColor: '#FFEBEE', borderRadius: 10,
    padding: 12, marginBottom: 16,
  },
  errorText: { color: '#C62828', fontSize: 14, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: '#444', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1A1A1A',
    backgroundColor: '#fff', marginBottom: 16,
  },
  btn: {
    backgroundColor: '#1B5E20', borderRadius: 14,
    padding: 18, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})