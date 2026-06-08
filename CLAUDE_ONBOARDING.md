# 🤖 Onboarding prompt pre Claude Code

> **Tento dokument je tvoj kompletný kontext.** Skopíruj jeho obsah do Claude Code (cez `claude --continue` alebo prilož ako system message). Po prečítaní vieš všetko potrebné pre pokračovanie práce na projekte.

---

## 📋 Čo je tento projekt

**Obecná SaaS aplikácia** pre malé samosprávy na Slovensku. Prvá obec: **Výčapy-Opatovce** (~1900 obyvateľov, okres Nitra). Cieľ: **AI-driven operačný systém pre obce**, nie len mobilná verzia obecného webu.

### Biznis model

- **Cieľová obec:** 500–5000 obyvateľov, súčasne používa zastaralý CMS (WebyGroup, Webex)
- **Cena pre obec:** 15–25 €/mesiac (lacnejšie než konkurencia Vidanto)
- **Tvoje náklady na obec:** ~13 €/mesiac (Anthropic API + Apple Developer amortized)
- **Konkurencia:** Vidanto (50+ €/mesiac, iba feed reader z webu), Munipolis, Sme.sk Obce
- **Kľúčový diferenciátor:** AI referentka Marta + reálna mapa + senior mód + automatický RSS sync = **žiadna duplicitná práca pre referentky obce**

### Vlastník/užívateľ

**Lukáš Cepilek** (`lukascepilek03@gmail.com`). Solopreneur. Demo prebieha pred starostom obce Výčapy-Opatovce (Ing. Jozef Holúbek). Ak demo prejde, treba rýchlo škálovať na 5–10 obcí v Nitrianskom kraji.

---

## 🛠️ Tech stack

| Vrstva | Technológia | Prečo |
|---|---|---|
| **Frontend** | Expo SDK 54 + React Native 0.81 + Expo Router 6 | Single codebase iOS + Android + web |
| **Jazyk** | TypeScript strict | Type safety, žiadne `any` ak sa dá vyhnúť |
| **Databáza** | Supabase Postgres + RLS | Hostovaný, RLS = security cez Postgres |
| **Auth** | Supabase Auth (email+heslo) | Pre admin obce |
| **AI** | Anthropic Claude Sonnet 4.6 | Cez Edge Function (bezpečnosť kľúča) |
| **Mapy** | Leaflet + OpenStreetMap vo WebView | Zadarmo, žiadny Google API kľúč |
| **Počasie** | Open-Meteo (zadarmo, bez kľúča) | Aj kvalita vzduchu (PM2.5, PM10, AQI) |
| **PDF** | expo-web-browser | Pre obecné noviny PDF archív |
| **Push** | expo-notifications (lokálne) | Bez backendu, naplánované pri otvorení appky |
| **State** | React hooks + AsyncStorage | Žiadny Redux/Zustand, len module-level state |
| **Theming** | Custom ThemeContext (light/dark/auto) | + senior mód s 3 font scale úrovňami |

### Závislosti v `package.json` (kritické)

```json
{
  "expo": "~54.0.33",
  "expo-router": "~6.0.23",
  "react-native": "0.81.5",
  "react-native-webview": "13.16.0",   // pre Leaflet mapu
  "@supabase/supabase-js": "^2.105.4",
  "expo-image": "~3.0.11",
  "expo-notifications": "~0.32.17",     // lokálne push
  "expo-secure-store": "^55.0.13",
  "expo-web-browser": "~15.0.10"        // PDF noviny, cestovný poriadok
}
```

**Treba doinštalovať (zatiaľ defenzívne fallback):**
- `expo-image-picker` — foto v podnetoch + cover aktualít
- `expo-file-system` + `expo-sharing` — iCal export podujatí
- `@react-native-async-storage/async-storage` — perzistencia bookmarks, tenant, senior nastavenia

---

## 📂 Štruktúra projektu

```
/Users/lukascepilek/vycapy-app/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout, ThemeProvider, init tenant store
│   ├── (tabs)/                   # Bottom tab navigation (4 viditeľné tabs)
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── index.tsx             # 🏠 Domov (počasie + Marta CTA + akcie)
│   │   ├── aktuality.tsx         # 📰 Aktuality (list/grid/month + filter)
│   │   ├── explore.tsx           # ♻️ Odpady (kalendár + push toggle)
│   │   ├── viac.tsx              # ☰ Viac (grid 15+ funkcií)
│   │   ├── hlasenie.tsx          # ⚠️ Podnety (skrytý, dostupný cez router)
│   │   ├── podujatia.tsx
│   │   ├── prenajom.tsx
│   │   └── kontakty.tsx
│   ├── aktualita/[id].tsx        # Detail aktuality + Share/Bookmark/RSS odznak
│   ├── podujatie/[id].tsx        # Detail + iCal export + bookmark
│   ├── sluzba/[id].tsx           # Detail služby (lekár, pošta, fara, …)
│   ├── inzerat/[id].tsx          # Detail susedského inzerátu
│   ├── susedsky-predaj.tsx       # Bazár (predám/kúpim/zadarmo/hľadám)
│   ├── susedsky-predaj/novy.tsx  # Pridať inzerát
│   ├── senior.tsx                # 👴 Senior mód home (6 dlaždíc)
│   ├── senior-aktuality.tsx      # Veľký reader pre seniorov
│   ├── senior-kontakty.tsx       # Volací zoznam s vlastnými kontaktmi
│   ├── senior-marta.tsx          # Marta v zjednodušenej forme
│   ├── senior-nastavenia.tsx     # Veľkosť písma + vlastné kontakty
│   ├── referentka.tsx            # 🤖 Marta full chat
│   ├── sluzby.tsx                # Zoznam služieb obce
│   ├── farske-oznamy.tsx         # ⛪ Omše, smútočné, ohlášky
│   ├── mapa.tsx                  # 🗺️ Leaflet reálna mapa s POI
│   ├── okolie.tsx                # 🌍 Voľný čas 10/20/50 km
│   ├── pocasie.tsx               # ☁️ Detailné počasie + AQI
│   ├── meteo-stanice.tsx         # 📡 IoT meteo stanice
│   ├── cestovny-poriadok.tsx     # 🚌 PDF cestovné poriadky
│   ├── noviny.tsx                # 📰 Život obce — PDF archív
│   ├── moj-zoznam.tsx            # 🔖 Bookmarks
│   ├── admin.tsx                 # Admin panel (KPI + 6 podtabov)
│   ├── admin-login.tsx
│   ├── ankety.tsx
│   ├── fc.tsx                    # FC Výčapy-Opatovce (futbal)
│   └── starosta-dashboard.tsx    # IoT dashboard pre starostu
│
├── components/
│   ├── AppHeader.tsx             # Zdieľaný header s erbom
│   ├── LeafletMap.tsx            # WebView + Leaflet + OSM
│   ├── WeatherCard.tsx           # Počasie widget na home
│   └── ui/                       # Design system primitívy
│       ├── Card.tsx              # elevated | flat | accent
│       ├── Button.tsx            # 5 variantov × 3 size
│       ├── Badge.tsx
│       ├── EmptyState.tsx
│       ├── Skeleton.tsx
│       ├── SectionHeader.tsx
│       ├── WebSourceBadge.tsx    # "🌐 Z webu obce" odznak
│       └── index.ts              # barrel export
│
├── src/
│   ├── config/
│   │   ├── tenant.ts             # Tenant typ + default Výčapy-Opatovce
│   │   └── tenantStore.ts        # Multi-tenant runtime store
│   ├── hooks/
│   │   ├── useAktuality.ts       # SELECT aktuality (filter time)
│   │   ├── usePodujatia.ts       # SELECT podujatia
│   │   ├── useOdpady.ts          # SELECT odpady_kalendar + typy
│   │   ├── useObecneZariadenia.ts # IoT + meteo stanice
│   │   ├── useAnkety.ts          # Hlasovanie
│   │   ├── useFc.ts              # FC zápasy + hráči
│   │   ├── useWeather.ts         # Open-Meteo + AQI (cache 30 min)
│   │   ├── useBookmarks.ts       # AsyncStorage bookmarks
│   │   ├── useFarskeOznamy.ts
│   │   └── useSusedskyPredaj.ts
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── referentka.ts         # Marta (Edge Function ALEBO direct)
│   │   ├── meniny.ts             # Slovenský kalendár menín + sviatkov
│   │   ├── share.ts              # React Native Share wrapper
│   │   ├── ical.ts               # RFC 5545 .ics generátor
│   │   ├── odpadyNotifikacie.ts  # Lokálne push pred vývozom
│   │   └── pushNotifications.ts  # Defenzívne expo-notifications
│   └── theme/
│       ├── ThemeContext.tsx      # light/dark/auto provider
│       └── tokens.ts             # spacing, radius, shadows, typo
│
├── supabase/
│   └── functions/
│       ├── marta-chat/           # Anthropic proxy + rate limit
│       │   ├── index.ts          # Deno Edge Function
│       │   └── README.md
│       └── rss-sync/             # WebyGroup RSS → Supabase
│           ├── index.ts
│           └── README.md
│
├── constants/
│   ├── colors.ts                 # Heraldické farby Výčap-Opatoviec
│   ├── seniorMode.ts             # Font scales + system kontakty
│   └── theme.ts                  # Expo default (nepoužíva sa moc)
│
├── hooks/
│   ├── useSeniorMode.ts          # Senior toggle + font + kontakty
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
│
├── assets/
│   └── images/
│       ├── erb.png               # Erb obce (real, 358 KB)
│       └── …                     # Splash, ikony
│
├── supabase-setup.sql            # 1️⃣ Spustiť ako prvý
├── supabase-security-fixes-v2.sql # 2️⃣ RLS opravy (linter clean)
├── supabase-postgis-fix.sql      # 3️⃣ Voliteľné (spatial_ref_sys)
├── supabase-seed.sql             # 4️⃣ Demo dáta pre prezentáciu
├── .env                          # SUPABASE + ANTHROPIC kľúče
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── package.json
├── tsconfig.json                 # strict, exclude supabase/functions
└── NAKLADY.md                    # Kalkulácia nákladov pre 3 scenáre
```

---

## 🎨 Design systém

### Tokens (`src/theme/tokens.ts`)

```typescript
spacing:  { xs:4, sm:8, md:12, lg:16, xl:24, xxl:32, xxxl:48 }
radius:   { xs:6, sm:8, md:12, lg:16, xl:20, pill:999 }
shadows:  { none, sm, md, lg }                  // 3 levely
typo:     { display, h1, h2, h3, body, bodyB, caption, captionB, label, micro }
touchTarget: { min:44, comfortable:48 }         // a11y
motion:   { fast:150, base:250, slow:400 }
```

**Pravidlo:** Žiadny komponent nesmie hardkódovať `padding: 16` ani `borderRadius: 12`. Vždy cez tokens.

### Farby (`constants/colors.ts`)

Heraldická paleta obce Výčapy-Opatovce:
- `brand.red` `#C62828` — primárka (štít erbu)
- `brand.gold` `#F9A825` — accent (lev)
- `brand.green` `#2E7D32` — secondary (pažiť)
- `brand.white` `#FFFFFF` — strieborná

**Sémantické tokeny:** `primary`, `secondary`, `accent`, `status.{info,success,warning,danger,neutral,accent,brand}`.

### Tmavý mód

Funguje cez `useThemeColors()` hook. **Nikdy nepoužívaj `C.background`** v komponente — vždy `useThemeColors().background`. Heraldické brand farby ostávajú konštantné v oboch módoch, menia sa iba neutral tokens (`text`, `surface`, `border`, …).

### Senior mód

Vlastný systém s 3 font scale úrovňami (`medium`, `large`, `xlarge`). Veľkosti v `FONT_SCALES` v `constants/seniorMode.ts`. Senior obrazovky (`/senior-*`) **úmyselne neviazané na ThemeContext** lebo majú vlastný high-contrast štýl (čierny text na bielom, žiadny dark mode).

---

## 🏗️ Architektúra: Multi-tenant

### Tenant config (`src/config/tenant.ts`)

Single source of truth pre **všetko white-label**:
- Názov obce, IČO, slogan, erb
- Brand farby
- Kontakty (úrad, starosta, …)
- Úradné hodiny
- Typy odpadov
- Kategórie podnetov
- POI (15 bodov záujmu pre mapu)
- Voľnočasové miesta (20 výletov v okolí)
- Sluzby (zdravotnícke, lekáreň, pošta, vet, fara)
- Obecné sviatky (sv. Urban, hody, Deň obce, …)
- Obecné noviny PDF archív
- Marta knowledge context

**Default tenant:** `vycapyOpatovce` v rovnakom súbore.

### Tenant store (`src/config/tenantStore.ts`)

Runtime store pre multi-tenant. Aktuálne **iba 1 tenant**, ale pripravené pre N obcí. Pri nasadení pre druhú obec:

1. Vytvor nový `Tenant` objekt (skopíruj `vycapyOpatovce` a uprav hodnoty)
2. Pridaj do `TENANT_REGISTRY` v `tenantStore.ts`
3. Pridaj záznam do tabuľky `obce` v Supabase
4. (Voliteľne) urob obrazovku výberu obce pri prvom spustení

### Hook `useTenant()`

```typescript
const tenant = useTenant()
// tenant.nazov, tenant.primaryColor, tenant.sluzby, …
// Reaktívne — pri zmene aktívneho tenantu (setActiveTenant) sa re-rendruje
```

### Database tabuľka `obce`

```sql
CREATE TABLE obce (
  id text PRIMARY KEY,
  nazov text NOT NULL,
  primary_color text DEFAULT '#C62828',
  config_json jsonb,
  je_aktivny boolean DEFAULT true
);
```

**Všetkých 7 dátových tabuliek má stĺpec `obec_id`** s defaultom `'vycapy-opatovce'`. Pre druhú obec stačí pridať `obec_id` filter do hookov.

---

## 🤖 Marta (AI referentka)

### Dva režimy

1. **Development (kľúč v JS bundle):** `EXPO_PUBLIC_USE_EDGE_FUNCTION=false`
   - Volá Anthropic API priamo
   - Rýchle pre vývoj, ale kľúč viditeľný v APK

2. **Production (Edge Function, ODPORÚČANÉ):** `EXPO_PUBLIC_USE_EDGE_FUNCTION=true`
   - Volá `supabase/functions/marta-chat`
   - Kľúč na serveri v Supabase secrets
   - Rate limit 10 dotazov/min/IP cez tabuľku `marta_rate_limit`

### Deploy

```bash
supabase login
supabase link --project-ref hionzftqhnxfqcegsnaj

# Secrets cez Dashboard (CLI má bug s smart quotes):
# https://supabase.com/dashboard/project/hionzftqhnxfqcegsnaj/functions/secrets
# Pridaj: ANTHROPIC_API_KEY a ANTHROPIC_MODEL

supabase functions deploy marta-chat --no-verify-jwt
```

### System prompt

Tvrdo natvrdo v `marta-chat/index.ts` aj v `referentka.ts` (DRY violation — pri zmene aktualizuj OBE miesta). Obsahuje:
- Kontakty úrad
- Úradné hodiny
- Zoznam lekárov + rozvrh
- Lekáreň, vet, pošta
- Odpadový kalendár general
- Šport hala
- Núdzové linky

**Pri zmene info v Supabase tabuľke `sluzby` to system prompt nevie.** Treba presunúť system prompt do tenant config (TODO).

### Quick actions (v `app/referentka.tsx`)

6 chips pod inputom (Zber odpadu, Nahlásiť, Úradné hodiny, Podať žiadosť, Kontakty, Trvalý pobyt). Sticky strip aj počas chatu — zlepšuje onboarding.

### Voice (placeholder)

Tlačidlo 🎤 v `referentka.tsx` — Alert *"Pripravujeme"*. Implementácia (~3-4h):
1. `expo-av` recording (push-to-talk)
2. Whisper API cez novú Edge Function
3. TTS cez OpenAI TTS / ElevenLabs (slovenský hlas Eva)
4. UI: veľký mikrofón, vizualizácia waveform

---

## 🔄 RSS Sync z WebyGroup

### Princíp

**Žiadna duplicitná práca pre referentky obce.** Web obce robí WebyGroup CMS, my si oznamy ťaháme.

### Edge Function `rss-sync`

Sťahuje 4 RSS feedy:
- Všeobecné oznamy → `aktuality` (kategória `oznam`)
- Verejná úradná tabuľa → `aktuality` (kategória `oznam`)
- Kultúra a šport → `podujatia`
- Smútočné oznamy → `farske_oznamy` (typ `smutok`)

Upsert podľa `external_id` (URL článku). Nové = INSERT. Existujúce s rovnakým obsahom = skip. Existujúce s iným title/body = UPDATE.

Detect kategórie z titulku (regex):
- *"uzávierka"* → `uzavierka`
- *"výpadok"* → `vypadok`
- *"pozvánka", "akcia"* → `akcia`
- *"zápas", "futbal"* → `sport`

### Cron

```sql
SELECT cron.schedule(
  'webygroup-rss-sync',
  '*/15 * * * *',  -- každých 15 min
  $$ SELECT net.http_post(url := '…/functions/v1/rss-sync', …) $$
);
```

### Source/external_id columns

Všetky 3 tabuľky (`aktuality`, `podujatia`, `farske_oznamy`) majú:
- `external_id text UNIQUE` — URL článku z webygroup
- `source text DEFAULT 'manual'` — `'manual'` (ručne v admin appky) ALEBO `'webygroup'` (sync)
- `synced_at timestamptz` — kedy bol naposledy sync

V UI `<WebSourceBadge>` zobrazuje *"🌐 Z webu obce"* iba pre `source === 'webygroup'`.

### `rss_sync_log` tabuľka

Audit log syncov. Admin dashboard ukazuje *"Posledný sync pred X min"*.

---

## 🗄️ Databáza (Supabase)

### Tabuľky (v poradí spustenia v `supabase-setup.sql`)

| Tabuľka | Účel | source RLS |
|---|---|---|
| `obce` | Multi-tenant register obcí | Public read |
| `aktuality` | Aktuality / oznamy | Public read (iba published) |
| `podujatia` | Kultúrne / športové akcie | Public read |
| `hlaseniaporuchy` | Občianske podnety | Public read |
| `hlasenia_historia` | Audit log zmien stavu | Public read |
| `prenajom_haly` | Žiadosti o prenájom haly | Public read |
| `obecne_zariadenia` | IoT + meteo stanice | — |
| `odpady_typy` | Typy odpadu | Public read |
| `odpady_kalendar` | Plánované vývozy | Public read |
| `ai_konverzacie` | Marta chat history | Insert only |
| `ankety` | Hlasovania | Public read aktívnych |
| `hlasy` | Anketové hlasy | Insert only |
| `fc_hraci`, `fc_zapasy` | Futbal | Public read |
| `push_tokens` | Expo push registrácia | Insert/Update |
| `farske_oznamy` | Omše, smútok, krsty | Public read aktívnych |
| `susedsky_predaj` | Bazár | Public read aktívnych |
| `marta_rate_limit` | Edge Function rate limit | service_role only |
| `notifikacie_log` | Audit notifikácií | authenticated read |
| `rss_sync_log` | Audit RSS syncov | authenticated read |

### RLS pravidlá (po `supabase-security-fixes-v2.sql`)

**Pravidlo:**
- `SELECT` = verejné (občania čítajú)
- `INSERT/UPDATE/DELETE` = iba `authenticated` (admin obce cez Supabase Auth)
- Výnimky:
  - `hlaseniaporuchy.INSERT` = občan môže (s validáciou popis ≥10 znakov)
  - `prenajom_haly.INSERT` = občan môže (s validáciou meno/telefón/email)
  - `susedsky_predaj.INSERT` = občan môže

**Linter clean.** Žiadne `USING (true)`. Všetko cez `(SELECT auth.uid()) IS NOT NULL`.

### Migrácie pre existujúce DB

Setup SQL je **idempotentný** — `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`. **Pri spúšťaní pre existujúcu DB (po ručnom CREATE TABLE) defenzívne pridáva chýbajúce stĺpce.** Dokonca aj CHECK constraints — najprv dropuje staré dynamicky, potom pridáva nový (kvôli starým hodnotám ako `pending` namiesto `nove`).

---

## 🎯 Inventár hotových funkcií

### Pre občanov
- ✅ Domov dashboard (počasie, najdôležitejšie dnes, Marta CTA, akcie, meniny, sviatky)
- ✅ Aktuality (list/grid/month, search, filter kategórie, pinned)
- ✅ Odpadový kalendár (list/month) + push pred vývozom
- ✅ Hlásenie podnetov (foto, GPS, status tracking)
- ✅ Prenájom haly (kalendár obsadenosti + žiadosť)
- ✅ Marta AI referentka (chat + quick actions + voice ready)
- ✅ Mapa obce (Leaflet OSM + 15 POI + Navigovať)
- ✅ Voľný čas v okolí (radius 10/20/50 km, 20 výletov)
- ✅ Počasie + 7-dňová predpoveď + kvalita vzduchu (AQI)
- ✅ Cestovný poriadok (3 PDF linky)
- ✅ Život obce — PDF archív novín (5 čísel)
- ✅ Služby obce (lekár, lekáreň, pošta, fara, vet — reálne dáta)
- ✅ Farské oznamy (omše, smútok, ohlášky, krsty, sobáše)
- ✅ Susedský predaj (bazár predám/kúpim/zadarmo)
- ✅ Ankety obce (hlasovanie)
- ✅ FC Výčapy-Opatovce (program, výsledky, káder)
- ✅ Senior mód (6 dlaždíc, vlastné kontakty, SOS, 3 font scale)
- ✅ Bookmarks ("Môj zoznam")
- ✅ Zdieľanie cez Share API
- ✅ iCal export podujatí (.ics)
- ✅ Sviatky a meniny widget na home
- ✅ Tmavý mód

### Pre admin obce
- ✅ Login (Supabase Auth)
- ✅ Dashboard s KPI (aktívne podnety, aktuality, vývoz, Marta otázky)
- ✅ 7 podtabov: Prehľad / Podnety / Aktuality / Podujatia / Prenájmy / Ankety / Fara
- ✅ Plánované publikovanie aktualít (Koncept / Ihneď / Naplánovať)
- ✅ Plánované publikovanie podujatí
- ✅ Cover image upload pre aktuality
- ✅ Foto upload pre podnety
- ✅ Stav zmena podnetu (nove → v_rieseni → vyriesene)
- ✅ Schvaľovanie prenájmov
- ✅ RSS sync status karta (Posledný sync pred X min)

### Infraštruktúra
- ✅ Multi-tenant (tabuľka `obce`, store, `obec_id` na všetkých tabuľkách)
- ✅ Marta cez Edge Function (kľúč na serveri)
- ✅ Rate limit 10 dotazov/min/IP
- ✅ RSS sync z WebyGroup (Edge Function + pg_cron)
- ✅ Krížová RLS audit (Supabase linter clean)
- ✅ Demo dáta (15 aktualít, 11 podujatí, 6 prenájmov, 5 hlásení, 5 farských, 5 inzerátov)

---

## 📝 Konvencie kódu

### Jazyk komentárov: **slovenčina**

```typescript
/**
 * Hook pre verejnosť — vracia iba aktuality ktoré sú:
 *   1) is_published = true
 *   2) majú published_at v minulosti
 *
 * Naplánované aktuality sa skryjú a automaticky objavia v správny čas.
 */
```

### TypeScript

- **Strict mode.** `any` iba kde inak nejde (Supabase SELECT * vracia generic).
- **Vlastné typy v `src/hooks/use*.ts`** — `export type Aktualita = {…}`.
- **`useMemo` + `useCallback`** kdekoľvek to dáva zmysel pre performance.

### Pojmenovanie

- **Slovensky** všade kde nepôjde do API (state, premenné, komponenty):
  - `aktuality`, `podujatia`, `vyvoz`, `najblizsi`
- **Anglicky** iba pre typescript types (`Aktualita`, `Podujatie`), Supabase column names (Supabase odporúča lowercase_snake_case anyway).
- **Komponenty:** PascalCase (`WebSourceBadge`, `SeniorMode`).
- **Súbory:** camelCase pre lib (`useBookmarks.ts`), kebab-case pre app routes (`susedsky-predaj.tsx`).

### Defenzívne importy

```typescript
// Vzor pre balíčky čo nie sú vždy nainštalované
let ImagePicker: any = null
try {
  ImagePicker = require('expo-image-picker')
} catch { ImagePicker = null }

// Použitie:
if (!ImagePicker) {
  Alert.alert('Foto funkcia', 'Nainštaluj: npx expo install expo-image-picker')
  return
}
```

Toto je v 4 súboroch:
- `app/(tabs)/hlasenie.tsx` (foto v podnetoch)
- `app/admin.tsx` (cover image)
- `src/lib/pushNotifications.ts` (expo-notifications)
- `hooks/useSeniorMode.ts` (AsyncStorage)

### Defenzívne SQL

Všetky migrácie idempotentné:
- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE … ADD COLUMN IF NOT EXISTS`
- `DO $$ BEGIN CREATE POLICY … EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
- Pre constraints s neznámym menom: dynamic SQL ktoré najprv DROPne všetky matching constraints, potom ADD nový.

---

## 🚧 Čo treba dorobiť (po dnešku)

### Vysoká priorita (zlepšuje produkt)

1. **Marta voice — skutočná implementácia** (~3-4h)
   - `expo-av` push-to-talk recording
   - Whisper API cez novú Edge Function `marta-voice`
   - TTS cez OpenAI TTS alebo ElevenLabs (slovenský hlas)
   - UI: veľký mikrofón, waveform vizualizácia
   - **Pre seniorov kritické**

2. **Telefónna linka Marty cez Vapi.ai / Retell** (~30 min setup)
   - Obec dostane slovenské číslo
   - Kto nemá appku, môže Marte zavolať z telefónu
   - **Pre seniorov bez smartfónu zlatá baňa**
   - Cena: ~$0.20-0.40/min hovoru

3. **Fotogaléria obce** (~3h)
   - Supabase Storage bucket `obec-galeria`
   - Tabuľky `galeria_albumy` + `galeria_fotky`
   - Admin upload + tematické albumy (Deň obce, Hody, Vianoce)
   - Občania prezerajú, lajk system **NIE** (užívateľ nechce lajky)

4. **Hlásenia miestneho rozhlasu** (~2h)
   - Obec používa hugoinfo.sk
   - Stream audio feed do appky
   - Audio player cez `expo-av`
   - Občan môže prehrať retroaktívne

5. **Krízový režim** (~3h)
   - Admin v admin paneli zapne *"Krízový režim: Povodne / Výpadok elektriny / Snežová kalamita"*
   - Celá appka má červený banner hore
   - Push všetkým občanom
   - Marta automaticky upozorňuje pri každej otázke
   - **Najsilnejší marketing feature pre starostov**

6. **Defibrilátor AED guide** (~1.5h)
   - Veľká karta (Senior mód: prominentná dlaždica)
   - GPS najbližšieho AED
   - 3-kroky vizuálny návod (SVG)
   - Volaj 155 tlačidlo
   - **Život zachraňujúce**

### Stredná priorita (biznis enabler)

7. **Občianska karta obce** (~2h)
   - Digitálna karta obyvateľa s QR kódom
   - Lokálne obchody dávajú 5-10% zľavu
   - Otvára monetization cez partnerstvá

8. **Triedenie odpadu — kalkulačka "kam patrí?"** (~2h)
   - Search box: *"pizza krabica"* → *"BIO ak špinavá, PAPIER ak čistá"*
   - Statický slovník 100 položiek
   - Quiz mode pre deti

9. **Reálne pridanie druhej obce** (~1 deň)
   - Vybrať testovaciu obec (Lefantovce, Žirany, Štitáre, …)
   - Naplniť tenant config
   - Pridať do `TENANT_REGISTRY` v `tenantStore.ts`
   - Pridať seed do `obce` tabuľky
   - Otestovať `obec_id` filtering vo všetkých hookoch
   - **Kritické pre tvoj biznis** — demo "viacero obcí" je silný argument

### Nižšia priorita

10. **Hodnotenie obecných služieb** (~1.5h) — NPS pre admin
11. **Anonymné nahlásenie korupcie** (~1h) — povinný kanál
12. **Sviatočný kalendár prepojený so sviatkami** — krsty, sobáše, MDŽ
13. **Pohotovostné lekárne Nitra** (~2h) — sezónne pre seniorov
14. **Marta proaktívne upozornenia** (~2h) — daily morning digest

---

## 🐛 Známe bugy / pitfalls

### 1. `expo-notifications` warning v Expo Go

```
WARN expo-notifications: Android Push notifications (remote notifications) functionality
provided by expo-notifications was removed from Expo Go with the release of SDK 53.
Use a development build instead.
```

**Príčina:** Lokálne notifikácie (`scheduleNotificationAsync`) **fungujú** v Expo Go. Remote push (cez Expo Push API) **nefunguje** v Expo Go SDK 53+.

**Riešenie:** pre demo OK ignorovať (používame iba lokálne push pre odpad). Pre produkciu treba `expo-dev-client` build.

### 2. `SafeAreaView` deprecated warning

```
SafeAreaView has been deprecated and will be removed in a future release.
Please use 'react-native-safe-area-context' instead.
```

**Príčina:** React Native odporúča `react-native-safe-area-context`.
**Riešenie:** Refaktor všetkých `import { SafeAreaView } from 'react-native'` → `from 'react-native-safe-area-context'`. ~50 súborov. **Nízka priorita** — funguje to.

### 3. Supabase CLI `secrets set` občas stráca login

```
Access token not provided.
```

**Workaround:** `export SUPABASE_ACCESS_TOKEN="sbp_…"` v termináli. Vygeneruj token na https://supabase.com/dashboard/account/tokens.

### 4. Smart quotes pri `supabase secrets set` cez terminál

Ak skopíruješ príkaz s `"…"` (Unicode ellipsis U+2026), shell ho interpretuje ako non-ASCII a Edge Function dostane corrupted kľúč. **Mám sanitizer** v `marta-chat/index.ts` ktorý odstráni non-ASCII, ale to znamená že kľúč je prázdny → vráti chybu.

**Riešenie:** Nastav secrets cez **Supabase Dashboard web UI**, nie cez CLI. Tam sa nedostávajú smart quotes.

### 5. SQL constraint conflicts pri seed.sql

Ak DB tabuľka existovala s iným CHECK constraint (napr. `status IN ('pending')` namiesto `'nove'`), INSERT vyhodí error. **Mám fix** v setup.sql aj seed.sql: dynamic SQL ktorý dropne všetky `pg_constraint` matching `%status%` a vytvorí nový s našimi hodnotami.

### 6. WebSourceBadge import default vs named

`components/ui/index.ts` exportuje `default as WebSourceBadge`. ESLint má warning `import/no-named-as-default` ale je to **úmyselné** kvôli barrel exportu.

### 7. RSS sync hovorí `aktuality` 2× v outpute

Pretože sú **2 feedy** mapované na `aktuality` (všeobecné oznamy + verejná úradná tabuľa). Konsoliduj v admin UI ak chceš.

---

## 🔐 Bezpečnosť

### API kľúče

- **Supabase ANON_KEY** v `.env` (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) — OK pre verejné použitie, RLS chráni dáta
- **Anthropic API_KEY** dva spôsoby:
  - DEV (`EXPO_PUBLIC_USE_EDGE_FUNCTION=false`): v `.env` ako `EXPO_PUBLIC_ANTHROPIC_API_KEY` → **viditeľné v APK**
  - PROD (`true`): v Supabase secrets, server-side → **bezpečné**

### `.gitignore`

`.env` je v `.gitignore`. **NIKDY** nepushuj `.env` do GitHubu.

### Rotácia kľúčov

Ak si kľúč zdielal kdekoľvek (chat, screenshot, log), **rotuj ho**:
1. https://console.anthropic.com/settings/keys → Revoke
2. Generate new
3. Supabase Dashboard → Functions → Secrets → Update
4. `.env` lokálne tiež update

### Supabase RLS

**Linter clean.** Spustený `supabase-security-fixes-v2.sql`. Žiadne `USING (true)`. Konkrétne políčka:
- Public SELECT
- Authenticated INSERT/UPDATE/DELETE
- Validovaný INSERT pre `hlaseniaporuchy`, `prenajom_haly`, `susedsky_predaj` od anon (length checks)

### Leaked Password Protection

**Treba zapnúť cez UI:** Dashboard → Authentication → Providers → Email → *"Leaked password protection"* checkbox.

---

## 💰 Náklady (full breakdown v `NAKLADY.md`)

### Pre PRVÚ obec, prvý rok (~100 aktívnych userov)

- Supabase Free tier: **0 €**
- Anthropic API: **~12 €/rok** (200 dotazov/mesiac × $0.005)
- Apple Developer: **93 €/rok** (povinný pre iOS)
- Google Play: **23 €** jednorázovo
- Open-Meteo, OSM, Expo Push: **0 €**

**Spolu: ~130 € prvý rok, ~105 €/rok ďalšie roky.**

### Pre REÁLNE použitie (600 userov, ~1200 Marta dotazov/mesiac)

- Anthropic API: **~68 €/rok**
- Ostatné rovnaké

**Spolu: ~166 €/rok.**

### Tvoj profit model

- Predaj obci za **15-20 €/mesiac** = 180-240 €/rok
- Setup fee: **200-500 €** jednorázovo
- **Prvá obec čistý profit:** 50-100 €/rok + setup
- **10 obcí za 3 roky:** ~1500 € čistý ročný profit + scale opportunity

---

## 🎤 Demo scenár pre starostu

```
1. OTVORI APPKU
   "Najprv si vám ukážem ako appku vidí občan."

2. DOMOV
   - Počasie hneď navrchu
   - Meniny + sviatky pill
   - Najdôležitejšie dnes (urgentný oznam alebo vývoz odpadu)
   - Marta CTA blok

3. AKTUALITY
   "Tu vidíte 20+ aktualít — všetky prišli AUTOMATICKY z vášho webu
   vycapy-opatovce.sk. Vaše referentky nemuseli písať nič dvakrát.
   Synchronizácia každých 15 minút."
   → Ukáž odznak "🌐 Z webu obce" na karte
   → Klepni → detail → Karta "Stiahnuté z webu obce · Synchronizované pred X min"

4. MARTA
   "Toto je AI referentka. Občan sa pýta hocičo o obci."
   → Klepni "Kedy je úrad otvorený?"
   → Marta odpovedá za 2 sekundy
   → "A toto vie 24/7. Bez prestávky, bez dovolenky."

5. MAPA OBCE
   "Reálna mapa s každou službou — lekár, lekáreň, pošta, fara, vet.
   Občan klepne pin → Zavolať priamo."

6. SLUŽBY V OBCI
   → Klepni "Zdravotnícke stredisko"
   → Ukáž 4 lekárov s rozvrhmi
   → "Toto sú reálne dáta lekárov z vašej obce."

7. SENIOR MÓD
   "Pre vašich starších obyvateľov — 6 veľkých dlaždíc, SOS,
   vlastné kontakty na rodinu."

8. PODNET OBČANA
   → Klepni "Nahlásiť"
   → "Občan odfotí jamu na ceste, pošle, máte to v admin paneli."

9. ADMIN PANEL (login info admin@…)
   "Tu sledujete dianie:"
   - KPI dashboard
   - "🌐 Synchronizácia s webom — Posledný sync pred 3 min · AKTÍVNE"
   - Posledné Marta otázky
   - Publikovať aktualitu (3-stavový picker: Ihneď / Naplánovať / Koncept)

10. CENA
    "Cena: 15-20 €/mesiac. Konkurencia Vidanto stojí 50+ €/mesiac
    a je iba mobilná verzia webu. My máme AI, mapu, senior mód."
```

---

## 📞 Kontakty pre Claude Code agenta

Ak si Claude Code agent ktorý čítaš tento dokument:

- **Užívateľ:** Lukáš Cepilek (`lukascepilek03@gmail.com`)
- **Repo na lokálu:** `/Users/lukascepilek/vycapy-app`
- **Supabase projekt:** `hionzftqhnxfqcegsnaj` (Výčapy-Opatovce)
- **Supabase Dashboard:** https://supabase.com/dashboard/project/hionzftqhnxfqcegsnaj
- **Expo projekt slug:** `vycapy-opatovce`

### Pred ďalšou úlohou si vždy prečítaj:

1. **`CLAUDE_ONBOARDING.md`** (tento súbor) — overview
2. **`src/config/tenant.ts`** — všetky tenant config dáta
3. **`supabase-setup.sql`** — DB schema
4. **`package.json`** — verzie balíkov

### Postup pri pridávaní novej feature

1. **Plánuj** — vytvor task list cez TaskCreate
2. **DB najprv** — pridaj tabuľky/stĺpce do `supabase-setup.sql` (idempotent ALTER)
3. **Type najprv** — v `src/hooks/use*.ts` definuj `export type Xxx = {…}`
4. **Hook** — `useXxx()` s `loading`, `error`, `refresh`
5. **UI** — komponenty z `components/ui` (Card, Button, Badge, …)
6. **Tokens** — vždy z `src/theme/tokens.ts`, nikdy hardcode
7. **Tenant aware** — všetky obecné dáta cez `useTenant()`, nie cez konštanty
8. **Tmavý mód** — všetky farby cez `useThemeColors()`
9. **Senior friendly** — pre senior obrazovky použiť `FONT_SCALES[fontScale]`
10. **Defenzívne** — ak balík môže chýbať, try/catch + fallback UI
11. **TypeScript check** — `npx tsc --noEmit` pred koncom musí byť `EXIT=0`
12. **Lint** — `npx expo lint` warnings OK, errors nie

### Pri SQL migráciách

- **Vždy idempotent.** `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DO $$ BEGIN … EXCEPTION …`
- **Existujúce tabuľky pravdepodobne majú iné schémy.** Pridaj `ALTER TABLE ADD COLUMN IF NOT EXISTS` pre každý nový stĺpec.
- **CHECK constraints zmení sa dynamickým SQL:**
  ```sql
  DO $$
  DECLARE r record;
  BEGIN
    FOR r IN SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.tabulka'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
      EXECUTE 'ALTER TABLE public.tabulka DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
  END $$;
  ALTER TABLE public.tabulka ADD CONSTRAINT tabulka_status_check CHECK (status IN (…));
  ```

### Edge Function deploy

```bash
supabase login
supabase link --project-ref hionzftqhnxfqcegsnaj

# Secrets cez Dashboard UI (nie CLI, kvôli smart quotes):
# https://supabase.com/dashboard/project/hionzftqhnxfqcegsnaj/functions/secrets

supabase functions deploy NAZOV_FUNKCIE --no-verify-jwt
```

---

## 🎯 Tvoj prvý task ako Claude Code

Po prečítaní tohto dokumentu:

1. Pozri `package.json` aby si videl verzie
2. Pozri `app/(tabs)/index.tsx` aby si videl domovskú obrazovku
3. Pozri `src/config/tenant.ts` aby si videl všetky obecné dáta
4. **Spýtaj sa užívateľa:** *"Aký je ďalší cieľ — chceš pokračovať s nedokončenými features (voice Marta, fotogaléria, krízový režim) alebo pridať druhú obec?"*

---

**Verzia tohto dokumentu:** 1.0  
**Posledná aktualizácia:** 3. júna 2026  
**Autor pôvodnej implementácie:** Claude Sonnet 4.6 (Cowork mode)  
**Trvanie session:** ~12 dní (junior dev junior cofounder mode)

🚀 Veľa šťastia s ďalšou prácou!
