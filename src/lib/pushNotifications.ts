/**
 * Push notifikácie — Expo Push Tokens.
 *
 * ─── Setup ──────────────────────────────────────────────────────────────
 * 1. Spustí sa `registerForPushNotifications()` raz pri starte appky
 *    (napríklad v RootLayout useEffect)
 * 2. Token sa uloží do Supabase tabuľky push_tokens
 * 3. Starosta v dashboarde napíše varovanie → backend (Edge Function alebo
 *    cron) prečíta tokeny a pošle push cez Expo Push API.
 *
 * ─── Závislosti ─────────────────────────────────────────────────────────
 * Pre plnú funkčnosť nainštaluj:
 *   npx expo install expo-notifications expo-device
 *
 * Bez týchto balíkov funkcia `registerForPushNotifications()` vráti null
 * a appka pokračuje normálne (defenzívny fallback).
 *
 * ─── Supabase SQL ───────────────────────────────────────────────────────
 *   CREATE TABLE IF NOT EXISTS public.push_tokens (
 *     token text PRIMARY KEY,
 *     platform text,
 *     last_seen timestamptz DEFAULT now(),
 *     created_at timestamptz DEFAULT now()
 *   );
 *   ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "tokens_upsert" ON push_tokens FOR INSERT WITH CHECK (true);
 *   CREATE POLICY "tokens_update" ON push_tokens FOR UPDATE USING (true);
 */

import { supabase } from './supabase'

// Defenzívne importy — nezvalí Metro ak balíky nie sú nainštalované.
// Odkomentuj po `npx expo install expo-notifications expo-device`:
// import * as Notifications from 'expo-notifications'
// import * as Device from 'expo-device'
const Notifications: any = null
const Device: any = null

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || !Device) {
    // Balíky nie sú nainštalované — appka funguje bez push.
    return null
  }

  if (!Device.isDevice) {
    // Push notifikácie nefungujú v simulátore.
    return null
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync()
    let finalStatus = existing
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return null

    const tokenResp = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    })
    const token = tokenResp?.data
    if (!token) return null

    // Upsert do DB
    await supabase
      .from('push_tokens')
      .upsert(
        {
          token,
          platform: Device.osName ?? 'unknown',
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'token' },
      )
    return token
  } catch (e) {
    console.warn('[push] register zlyhal:', e)
    return null
  }
}

/**
 * Pošle push varovanie všetkým registrovaným zariadeniam.
 * Pre demo: posiela synchronne z klienta. Pre produkciu odporúčam
 * Supabase Edge Function aby Expo Access Token nebol v client bundle.
 */
export async function odoslatVarovanie(input: {
  title: string
  body: string
  data?: Record<string, any>
}): Promise<{ ok: number; chyba: number; total: number }> {
  // Načítaj všetky tokeny
  const { data: rows, error } = await supabase
    .from('push_tokens')
    .select('token')
    .order('last_seen', { ascending: false })
    .limit(2000)
  if (error || !rows) {
    throw new Error(error?.message ?? 'Nepodarilo sa načítať tokeny.')
  }
  const tokens = rows.map((r: any) => r.token).filter(Boolean)
  if (tokens.length === 0) {
    return { ok: 0, chyba: 0, total: 0 }
  }

  // Expo Push API podporuje batch (max 100 na request)
  let ok = 0, chyba = 0
  const batches: string[][] = []
  for (let i = 0; i < tokens.length; i += 100) {
    batches.push(tokens.slice(i, i + 100))
  }

  for (const batch of batches) {
    const messages = batch.map(token => ({
      to: token,
      sound: 'default',
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    }))
    try {
      const resp = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      })
      if (resp.ok) {
        const r = await resp.json()
        const data = r?.data ?? []
        ok += data.filter((d: any) => d.status === 'ok').length
        chyba += data.filter((d: any) => d.status !== 'ok').length
      } else {
        chyba += batch.length
      }
    } catch {
      chyba += batch.length
    }
  }

  return { ok, chyba, total: tokens.length }
}
