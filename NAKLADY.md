# 💰 Náklady aplikácie Výčapy-Opatovce

Kalkulácia pre obec ~1900 obyvateľov pri predpokladaných troch scenároch:

| Scenár | Aktívni používatelia | Marta dotazov / mesiac |
|---|---|---|
| **Pilot** (prvý mesiac) | ~100 (5% adopcia) | ~200 |
| **Reálne** (6 mesiacov+) | ~600 (30% adopcia) | ~1 200 |
| **Maximálne** (rok+) | ~1 200 (60% adopcia) | ~5 000 |

---

## 📊 Mesačné prevádzkové náklady

### 1. Supabase (databáza + storage + auth)

**Free tier** (50 000 MAU, 500 MB DB, 5 GB egress, 1 GB storage):
- **Pilot:** ✅ stačí free tier
- **Reálne:** ✅ stačí free tier (600 MAU << 50 000 limit)
- **Maximálne:** ⚠️ pravdepodobne hranica storage (foto z podnetov + susedský predaj + cover aktualít rastie ~1 GB/rok)

**Pro tier** ($25/mesiac, 8 GB DB, 100 GB egress, 100 GB storage, 100 000 MAU):
- Pre obec 1900 obyvateľov — **nepotrebné v prvom roku**.
- Odporúčam upgrade až keď free tier dosiahneš na 80% kapacite (Supabase Dashboard vidíš v Settings → Billing).

**📌 Tip:** automatické čistenie starých dát môžeš nastaviť cez Supabase SQL (mazať podnety > 1 rok ako "vyriesene", expirovať inzeráty po 30 dňoch — to už mám naskriptované).

### 2. Anthropic API (Marta — AI referentka)

**Claude Sonnet 4** ceny (apríl 2026):
- Input tokens: $3 / 1M
- Output tokens: $15 / 1M
- Priemerný Marta dotaz: ~500 vstupných + 200 výstupných tokenov
- **Cena za 1 dotaz: ~$0,005** (asi 0,5 centa)

| Scenár | Mesačné dotazy | Náklad | Ročne |
|---|---|---|---|
| Pilot | 200 | ~$1,00 | ~$12 (12 €) |
| Reálne | 1 200 | ~$6,00 | ~$72 (68 €) |
| Maximálne | 5 000 | ~$25,00 | ~$300 (282 €) |

**📌 Bezpečnostná poznámka:** API kľúč máš v `EXPO_PUBLIC_*` čo znamená v JS bundle. Pre produkciu **silno odporúčam** presunúť cez Supabase Edge Function — tam ostane kľúč na serveri a útočník ho nevie vytiahnuť z APK súboru. Bez tohto môže ktokoľvek z appky vyťahať kľúč a ťahať si Marta queries na tvojej karte. **Plán: skôr než ideš production, urobíme Edge Function.**

### 3. Open-Meteo (počasie + kvalita vzduchu)

**Zadarmo** pre nekomerčné a low-traffic použitie. Bez API kľúča, bez registrácie. Limit ~10 000 requestov/deň, ktorý nikdy nedosiahneš.

**Náklad:** 0 €

### 4. OpenStreetMap (mapy)

**Zadarmo** cez tile servery. Žiadne API kľúče, žiadne limity pre normálne použitie.

**Náklad:** 0 €

### 5. Expo Push notifikácie

**Zadarmo** cez Expo Push API. Bez limitu pre osobné/komunitné použitie.

**Náklad:** 0 €

---

## 🏪 Jednorázové náklady (publikácia na App Store / Google Play)

### Apple Developer Program (povinný pre iOS)
- **$99/rok** ≈ **~93 €/rok**
- Bez tohto si nemôžeš publikovať na App Store
- Platí sa každý rok obnovenie
- Zahŕňa TestFlight pre interné testovanie

### Google Play Developer
- **$25 jednorázovo** ≈ **~23 €**
- Doživotne, žiadne ročné poplatky
- Zahŕňa internal testing track

### EAS Build (Expo Application Services)
- **Free tier:** 30 buildov/mesiac stačí pre 1-2 obce
- **Production plán:** $19/mesiac ak by si chcel viac (nepotrebné teraz)
- Build APK/IPA na cloude bez vlastného Mac/PC

### Doména (voliteľné)
- `vycapy-opatovce-app.sk` cez SK-NIC: **~15 €/rok**
- Iba ak chceš mať custom landing page; pre samotnú appku netreba

---

## 💼 Súhrnná kalkulácia ročne

### Scenár 1: PILOT (prvé 3 mesiace, ~100 používateľov)

| Položka | Cena |
|---|---|
| Supabase Free | 0 € |
| Anthropic API | 12 € |
| Apple Developer | 93 € |
| Google Play | 23 € (jednorázovo) |
| EAS Build Free | 0 € |
| **SPOLU prvý rok** | **~130 €** |
| **SPOLU ďalšie roky** | **~105 €/rok** |

### Scenár 2: REÁLNE (po 6 mesiacoch, 600 používateľov)

| Položka | Cena |
|---|---|
| Supabase Free | 0 € |
| Anthropic API | 68 € |
| Apple Developer | 93 € |
| Google Play (amortized) | 5 € |
| EAS Build Free | 0 € |
| **SPOLU ročne** | **~166 €** |

### Scenár 3: MAXIMÁLNE (po roku, 1200 používateľov)

| Položka | Cena |
|---|---|
| Supabase Pro (ak prerastieš) | 282 € |
| Anthropic API | 282 € |
| Apple Developer | 93 € |
| Google Play (amortized) | 5 € |
| EAS Build Free | 0 € |
| **SPOLU ročne** | **~662 €** |

---

## 📈 Porovnanie s konkurenciou (Vidanto a podobné)

| Riešenie | Cena/rok pre obec | Vlastníctvo dát |
|---|---|---|
| **Vidanto + WebyGroup web** | ~600-1200 €/rok (viazané na webhosting) | WebyGroup |
| **Tvoja aplikácia (reálne)** | ~166 €/rok | **Tvoja obec** |
| **Tvoja aplikácia (max)** | ~662 €/rok | **Tvoja obec** |

**Argument pre starostu:** *"Aplikácia stojí menej ako tlačené obecné noviny mesačne, a obec má plnú kontrolu nad dátami."*

---

## 💡 Ako môžeš zarábať / nahradiť náklady

Ak chceš z toho urobiť biznis pre viac obcí:

1. **Predaj inej obci** — white-label za 500-2000 €/rok podľa veľkosti obce
   - 1 obec ti pokryje všetky náklady aj s 10× rezervou
   - 5 obcí = ~5000 €/rok profit
   - Realistický cieľ: 10-20 obcí v Nitrianskom kraji za 2 roky

2. **Sponzorovaný obsah lokálnych firiem**
   - Lekáreň, vínohrad, autoservis — banner pri službách
   - Susedský predaj → "Promovaný inzerát" za 5 €
   - ~50-100 €/mesiac z 1900-člennej obce

3. **Štátne / EÚ granty na digitalizáciu obcí**
   - MIRRI granty na digitalizáciu samospráv
   - PRV — Program rozvoja vidieka
   - Realistický grant 5-15 000 € na pilot v 2-3 obciach

---

## 🎯 Prvý rok — najreálnejší odhad

**Tvoje náklady prvý rok:** ~130-200 €

**Ako to získať od obce:**
- Mesačná licencia: 15-20 €/mesiac (180-240 €/rok)
- Jednorázový setup fee: 200-500 €
- **Celkom za prvú obec: ~400-700 € v prvom roku**

Obec ušetrí oproti Vidanto/WebyGroup ~500 €/rok a získa lepší produkt. Tvoj zisk za prvú obec ~250-500 € v prvom roku, ďalšie roky ~100-150 €/rok čistý profit z jednej obce.

S 10 obcami za 3 roky: **~3000-5000 € čistý ročný profit** + možnosť scale na 50+ obcí.

---

## ⚠️ Ako mažeš znížiť náklady

1. **Marta cache odpovedí** — ak občan pýta "Kedy je úrad otvorený?" → cache odpoveď pre 24h. Zníži API call o ~60%.
2. **Open-Meteo cache** — už máš 30 min in-memory cache, ďalej znížiš API calls
3. **Storage limit** — automaticky komprimuj fotky na max 1 MB pred upload (môžem dorobiť)
4. **Cleanup cron** — po 1 roku zmazať podnety so statusom "vyriesene" (zachovaj len agregátne čísla)
5. **Supabase Free čo najdlhšie** — sledovať dashboard, pri 80% kapacite začať čistiť

---

*Posledná aktualizácia: 3. júna 2026*
