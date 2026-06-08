# RSS Sync — Edge Function

Automatický sync aktualít, podujatí a farských oznamov z WebyGroup webu obce.

## Deploy

```bash
supabase functions deploy rss-sync --no-verify-jwt
```

## Schedule (každých 15 min)

V Supabase SQL editore raz:

```sql
-- Najprv zapni pg_cron rozšírenie ak nie je
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule sync každých 15 minút
SELECT cron.schedule(
  'webygroup-rss-sync',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hionzftqhnxfqcegsnaj.supabase.co/functions/v1/rss-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Zoznam scheduled jobs
SELECT * FROM cron.job;

-- História behov
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Zrušiť schedule:
-- SELECT cron.unschedule('webygroup-rss-sync');
```

## Manuálne spustenie (pre testovanie)

```bash
curl -X POST https://hionzftqhnxfqcegsnaj.supabase.co/functions/v1/rss-sync \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Mala by vrátiť:
```json
{
  "ok": true,
  "trvanie_ms": 4523,
  "celkom_novych": 2,
  "celkom_aktualizovanych": 0,
  "celkom_chyba": 0,
  "details": [
    { "feed": "aktuality", "novych": 2, "aktualizovanych": 0, "ms": 1234 },
    { "feed": "podujatia", "novych": 0, "aktualizovanych": 0, "ms": 891 },
    { "feed": "farske_oznamy", "novych": 0, "aktualizovanych": 0, "ms": 678 }
  ]
}
```

## Adaptácia pre inú obec

V `index.ts` zmeň pole `FEEDS`:

```typescript
const FEEDS: FeedConfig[] = [
  { url: 'https://www.iná-obec.sk/get_rss.php?id=…', kind: 'aktuality' },
  // ...
]
```

WebyGroup ma rovnaký RSS endpoint pattern pre všetky obce ktoré používa.
