# Marta Chat — Edge Function

Server-side proxy pre Anthropic API. API kľúč ostáva na serveri (bezpečne), neexponuje sa v mobilnej appke.

## Deploy

```bash
# 1. Nainštaluj Supabase CLI (raz)
npm install -g supabase

# 2. Login a link projektu
supabase login
supabase link --project-ref hionzftqhnxfqcegsnaj

# 3. Nastav secrets (Anthropic API key na serveri)
supabase secrets set ANTHROPIC_API_KEY="sk-ant-api03-…"
supabase secrets set ANTHROPIC_MODEL="claude-sonnet-4-6"

# 4. Deploy funkciu
supabase functions deploy marta-chat --no-verify-jwt
```

Po deploy bude funkcia dostupná na:
```
https://hionzftqhnxfqcegsnaj.supabase.co/functions/v1/marta-chat
```

## Frontend konfigurácia

V `.env` appky sa nastavuje cez `EXPO_PUBLIC_USE_EDGE_FUNCTION`:

- **true** (default) — appka volá Edge Function (bezpečné, produkčné)
- **false** — appka volá Anthropic API priamo (vývojový mode, kľúč v `.env`)

## Rate limiting

Max **10 dotazov / minútu / IP**. Po prekročení vráti HTTP 429.

Cleanup tabuľky `marta_rate_limit` raz za hodinu:
```sql
DELETE FROM public.marta_rate_limit WHERE window_start < now() - interval '5 minutes';
```

Alebo automaticky cez pg_cron (po inštalácii):
```sql
SELECT cron.schedule(
  'marta-rate-limit-cleanup',
  '0 * * * *',
  $$ DELETE FROM public.marta_rate_limit WHERE window_start < now() - interval '5 minutes' $$
);
```

## Testovanie

```bash
curl -X POST https://hionzftqhnxfqcegsnaj.supabase.co/functions/v1/marta-chat \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sprava": "Aké sú úradné hodiny?", "historia": []}'
```

Mala by ti vrátiť JSON:
```json
{
  "odpoved": "Obecný úrad je otvorený v pondelok…",
  "rate_limit_remaining": 9
}
```
