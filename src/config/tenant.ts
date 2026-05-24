/**
 * Tenant config — white-label dáta jednej konkrétnej obce.
 *
 * Single source of truth pre:
 *   - názov obce, slogan, IČO/DIČ (pre administratívne dokumenty)
 *   - hlavná farba (brand), prípadne sekundárna
 *   - kontakty obecného úradu
 *   - úradné hodiny
 *   - typy odpadov (kód → názov + farba)
 *   - kategórie podnetov
 *   - lokálne odkazy (web, FB, IG)
 *
 * Pre nasadenie pre inú obec:
 *   - skopírovať `vycapyOpatovce` → upraviť hodnoty → zmeniť `ACTIVE_TENANT`
 *   - prípadne neskôr presunúť do Supabase ako `obec_config` tabuľku
 *
 * Pristupuje sa cez `useTenant()` hook alebo priamo `getTenant()`.
 */

export type DenVTyzdni =
  | 'pondelok' | 'utorok' | 'streda' | 'stvrtok' | 'piatok' | 'sobota' | 'nedela'

export type UradneHodiny = {
  den: DenVTyzdni
  hodiny: string | null // null = zatvorené
}

export type TypOdpadu = {
  kod: string             // napr. 'komunal', 'plast', 'papier'
  nazov: string
  farba: string
  ikona: string           // emoji alebo SF symbol
  popis?: string
}

export type KategoriaPodnetu = {
  id: string
  label: string
  emoji: string
}

// ─── Služby v obci (zdravotníctvo, pošta, fara, vet, lekáreň) ────────────
export type SluzbaKategoria = 'farsky' | 'lekaren' | 'zdravotnictvo' | 'veterina' | 'posta' | 'iny'

export type OrdinacnyDen = {
  den: DenVTyzdni
  hodiny: string | null     // "7:00 – 11:00" alebo viac segmentov "7:15-12:00 | 12:30-14:30"
  poznamka?: string          // napr. "Ambulancia Dolné Lefantovce"
}

/** Lekár alebo iná osoba ktorá ordinuje v rámci služby (pre zdravotnícke stredisko). */
export type Ordinant = {
  id: string
  meno: string               // "MUDr. Jozef Kolenčík"
  specializacia: string      // "Všeobecný lekár pre dospelých"
  telefon?: string
  mobil?: string
  email?: string
  ordinacneHodiny: OrdinacnyDen[]
  poznamka?: string          // "Ordinácia aj v Dolných Lefantovciach"
}

// ─── Voľný čas v okolí ───────────────────────────────────────────────────
export type VolnyCasKategoria =
  | 'cyklotrasa' | 'turistika' | 'deti' | 'wellness'
  | 'kultura' | 'priroda' | 'sport' | 'vylet'

export type VolnyCasMiesto = {
  id: string
  kategoria: VolnyCasKategoria
  nazov: string
  podtitul?: string            // krátky popis
  popis?: string               // dlhší popis pre detail
  lat: number
  lng: number
  /** Voliteľný web s viac informáciami. */
  web?: string
  /** Odhad času (45 min, 1 deň, …). */
  trvanie?: string
  /** Voliteľné odporúčania (vhodné pre deti, bezbariérové, atď). */
  tagy?: string[]
}

// ─── Body záujmu na mape obce (POI) ──────────────────────────────────────
export type POIKategoria =
  | 'urad' | 'zdravotnictvo' | 'lekaren' | 'posta' | 'veterina'
  | 'kostol' | 'cintorin' | 'sport' | 'kultura' | 'skolstvo'
  | 'obchod' | 'defibrilator' | 'dolezite' | 'iny'

export type PointZaujmu = {
  id: string
  kategoria: POIKategoria
  nazov: string
  podtitul?: string         // krátky popis pre popup
  lat: number               // WGS-84
  lng: number
  /** Voliteľný link na detail služby — sluzba/[id]. */
  sluzbaId?: string
  /** Voliteľný telefón — pre rýchle volanie z popupu. */
  telefon?: string
}

/** Špeciálna akcia služby — napr. "Zavolať pre podržanie zásielky". */
export type SluzbaAkcia = {
  id: string
  label: string              // "Podržanie zásielky"
  icon: string               // emoji
  typ: 'tel' | 'mail' | 'web' | 'info'
  hodnota: string            // tel číslo / email / URL / popis
  popis?: string             // čo treba povedať / čo služba urobí
}

export type Sluzba = {
  id: string
  kategoria: SluzbaKategoria
  nazov: string              // "Zdravotnícke stredisko Výčapy-Opatovce"
  emoji: string              // 🏥
  podtitul?: string          // "Ambulancie všeobecných lekárov, zubár, gynekológia"
  adresa?: string
  telefon?: string
  mobil?: string
  email?: string
  web?: string
  facebook?: string
  vedenie?: string           // "Vedúca: Mária Lapšanská"
  hodiny?: OrdinacnyDen[]    // pre Poštu, Lekáreň, Veterina (jednoduchý rozvrh)
  ordinanti?: Ordinant[]     // pre Zdravotnícke stredisko (zoznam lekárov)
  akcie?: SluzbaAkcia[]      // špeciálne akcie (podržanie zásielky, atď.)
  poznamka?: string          // dlhý text — "Ošetrenie vykonávajú aj v domácnosti"
}

export type Tenant = {
  id: string                            // 'vycapy-opatovce'
  nazov: string                         // 'Výčapy-Opatovce'
  okres?: string                        // 'Nitra'
  region?: string                       // 'Nitriansky kraj'
  slogan?: string                       // 'Obecná aplikácia'
  pocetObyvatelov?: number

  // Brand
  primaryColor: string                  // hex
  primaryDarkColor?: string
  accentColor?: string
  erbAsset?: any                        // require('@/assets/images/erb.png') alebo null

  // Kontakty
  obecnyUrad: {
    nazov: string
    adresa: string
    psc?: string
    telefon: string
    email: string
    web?: string
    ico?: string
    dic?: string
  }
  starosta?: {
    meno: string
    telefon?: string
    email?: string
  }

  // Úradné hodiny
  uradneHodiny: UradneHodiny[]

  // Lokálne dáta
  typyOdpadov: TypOdpadu[]
  kategoriePodnetov: KategoriaPodnetu[]
  sluzby: Sluzba[]

  // Mapa — centrum obce + body záujmu
  mapaCentrum: { lat: number; lng: number; zoom: number }
  pointyZaujmu: PointZaujmu[]
  volnyCasMiesta: VolnyCasMiesto[]

  // Social
  socialLinks?: {
    web?: string
    facebook?: string
    instagram?: string
    youtube?: string
  }

  // Marta system prompt prefix — kontext pre AI referentku
  martaContextSummary: string
}

// ─────────────────────────────────────────────────────────────────────────
// DEFAULT TENANT — Výčapy-Opatovce
// ─────────────────────────────────────────────────────────────────────────

export const vycapyOpatovce: Tenant = {
  id: 'vycapy-opatovce',
  nazov: 'Výčapy-Opatovce',
  okres: 'Nitra',
  region: 'Nitriansky kraj',
  slogan: 'Obecná aplikácia',
  pocetObyvatelov: 1900,

  primaryColor: '#C62828',
  primaryDarkColor: '#8E1F1F',
  accentColor: '#F9A825',
  erbAsset: null,

  obecnyUrad: {
    nazov: 'Obecný úrad Výčapy-Opatovce',
    adresa: 'Výčapy-Opatovce',
    telefon: '037 / 77 951 51',
    email: 'info@vycapy-opatovce.sk',
    web: 'https://www.vycapy-opatovce.sk',
  },

  uradneHodiny: [
    { den: 'pondelok', hodiny: '7:30 – 15:30' },
    { den: 'utorok',   hodiny: '7:30 – 15:30' },
    { den: 'streda',   hodiny: '7:30 – 17:00' },
    { den: 'stvrtok',  hodiny: '7:30 – 15:30' },
    { den: 'piatok',   hodiny: '7:30 – 13:00' },
    { den: 'sobota',   hodiny: null },
    { den: 'nedela',   hodiny: null },
  ],

  typyOdpadov: [
    { kod: 'komunal',   nazov: 'Komunálny odpad',  farba: '#37474F', ikona: '🗑️' },
    { kod: 'plast',     nazov: 'Plast',            farba: '#FFB300', ikona: '♻️' },
    { kod: 'papier',    nazov: 'Papier',           farba: '#1976D2', ikona: '📦' },
    { kod: 'sklo',      nazov: 'Sklo',             farba: '#388E3C', ikona: '🍾' },
    { kod: 'biologicky',nazov: 'Bioodpad',         farba: '#6D4C41', ikona: '🌿' },
    { kod: 'kovy',      nazov: 'Kovy',             farba: '#757575', ikona: '🔩' },
    { kod: 'objemny',   nazov: 'Objemný odpad',    farba: '#C2185B', ikona: '🛋️' },
  ],

  kategoriePodnetov: [
    { id: 'cesta',       label: 'Cesta / chodník',     emoji: '🛣️' },
    { id: 'osvietenie',  label: 'Verejné osvetlenie',  emoji: '💡' },
    { id: 'zelen',       label: 'Zeleň / stromy',      emoji: '🌳' },
    { id: 'voda',        label: 'Voda / kanalizácia',  emoji: '💧' },
    { id: 'odpad',       label: 'Odpad / kontajnery',  emoji: '🗑️' },
    { id: 'vandalizmus', label: 'Vandalizmus',         emoji: '🚨' },
    { id: 'doprava',     label: 'Doprava / značenie',  emoji: '🚦' },
    { id: 'ine',         label: 'Iné',                 emoji: '📋' },
  ],

  // ─── SLUŽBY V OBCI ──────────────────────────────────────────────────
  // Dáta sú z oficiálnej stránky obce (máj 2026).
  // Zmenu hodín treba aktualizovať tu — alebo neskôr presunúť do Supabase.
  sluzby: [
    {
      id: 'zdravotnicke-stredisko',
      kategoria: 'zdravotnictvo',
      nazov: 'Zdravotnícke stredisko',
      emoji: '🏥',
      podtitul: 'Všeobecní lekári, zubár, gynekológia',
      adresa: 'Výčapská 472/2, Výčapy-Opatovce',
      ordinanti: [
        {
          id: 'kolencik',
          meno: 'MUDr. Jozef Kolenčík',
          specializacia: 'Všeobecný lekár pre dospelých',
          telefon: '037779504',           // 037/77 950 46 — zjednodušený fmt
          ordinacneHodiny: [
            { den: 'pondelok', hodiny: '07:00 – 11:00', poznamka: 'Výčapy-Opatovce' },
            { den: 'utorok',   hodiny: '11:00 – 16:00', poznamka: 'Výčapy-Opatovce' },
            { den: 'streda',   hodiny: '07:00 – 11:00', poznamka: 'Výčapy-Opatovce' },
            { den: 'stvrtok',  hodiny: '11:00 – 14:00', poznamka: 'Výčapy-Opatovce' },
            { den: 'piatok',   hodiny: '10:00 – 12:00', poznamka: 'Výčapy-Opatovce' },
          ],
          poznamka: 'V ostatnom čase ordinuje v Dolných Lefantovciach.',
        },
        {
          id: 'uramova',
          meno: 'MUDr. Viera Uramová',
          specializacia: 'Všeobecný lekár pre deti a dorast',
          telefon: '037779504',           // 037/77 950 48
          mobil: '0905964255',
          ordinacneHodiny: [
            { den: 'pondelok', hodiny: '07:00 – 11:00', poznamka: 'Ambulancia VO; popoludní Lefantovce' },
            { den: 'utorok',   hodiny: '12:00 – 16:00', poznamka: 'Ambulancia VO; ráno návštevy' },
            { den: 'streda',   hodiny: '12:00 – 15:00', poznamka: 'Ambulancia VO; ráno Lefantovce' },
            { den: 'stvrtok',  hodiny: '07:00 – 12:00', poznamka: 'Ambulancia VO; popoludní prevencia' },
            { den: 'piatok',   hodiny: '10:30 – 13:00', poznamka: 'Ambulancia VO; ráno Lefantovce' },
          ],
        },
        {
          id: 'knotekova',
          meno: 'MUDr. Alžbeta Knoteková',
          specializacia: 'Zubná ambulancia',
          mobil: '0911116222',
          ordinacneHodiny: [
            { den: 'pondelok', hodiny: '07:15 – 15:30' },
            { den: 'utorok',   hodiny: '07:15 – 15:30' },
            { den: 'streda',   hodiny: '07:15 – 15:30' },
            { den: 'stvrtok',  hodiny: '07:15 – 15:30' },
            { den: 'piatok',   hodiny: '07:00 – 14:00' },
          ],
        },
        {
          id: 'kubalova',
          meno: 'MUDr. Mária Kubalová',
          specializacia: 'Gynekologicko-pôrodnícka ambulancia',
          mobil: '0915737926',
          ordinacneHodiny: [
            { den: 'pondelok', hodiny: null },
            { den: 'utorok',   hodiny: null },
            { den: 'streda',   hodiny: '07:00 – 15:00' },
            { den: 'stvrtok',  hodiny: null },
            { den: 'piatok',   hodiny: null },
          ],
          poznamka: 'Pre nové pacientky volajte 0915 737 926.',
        },
      ],
    },

    {
      id: 'lekaren',
      kategoria: 'lekaren',
      nazov: 'Lekáreň Sv. Cyrila a Metoda',
      emoji: '💊',
      podtitul: 'Voľne predajné lieky aj na recept',
      adresa: 'Výčapská 480/8, Výčapy-Opatovce',
      telefon: '037779520',                    // 037/77 952 03
      vedenie: 'Vedúca: RNDr. Darina Janoušková',
      hodiny: [
        { den: 'pondelok', hodiny: '08:00 – 14:00' },
        { den: 'utorok',   hodiny: '08:00 – 14:00' },
        { den: 'streda',   hodiny: '08:00 – 14:00' },
        { den: 'stvrtok',  hodiny: '08:00 – 14:00' },
        { den: 'piatok',   hodiny: '08:00 – 14:00' },
        { den: 'sobota',   hodiny: null },
        { den: 'nedela',   hodiny: null },
      ],
    },

    {
      id: 'veterina',
      kategoria: 'veterina',
      nazov: 'Veterinárna ambulancia',
      emoji: '🐾',
      podtitul: 'MVDr. Slavomíra Kunová',
      adresa: 'Výčapská 470/10, Výčapy-Opatovce (budova pošty, za mäsiarstvom)',
      mobil: '0918699956',
      facebook: 'https://www.facebook.com/profile.php?id=100036393136477',
      hodiny: [
        // Vet má variabilný rozvrh — typický týždeň v máji 2026
        { den: 'pondelok', hodiny: null },
        { den: 'utorok',   hodiny: '14:00 – 17:00' },
        { den: 'streda',   hodiny: '14:00 – 17:00', poznamka: 'Niektoré stredy' },
        { den: 'stvrtok',  hodiny: '14:00 – 17:00', poznamka: 'Niektoré štvrtky' },
        { den: 'piatok',   hodiny: null },
        { den: 'sobota',   hodiny: '09:00 – 12:00', poznamka: '1× za 2 týždne' },
        { den: 'nedela',   hodiny: null },
      ],
      poznamka:
        'Veterinárka má každý týždeň iné hodiny. Aktuálny rozvrh nájdete na Facebooku alebo zavolajte 0918 699 956. ' +
        'V prípade potreby vykonáva ošetrenie aj priamo v domácnosti.',
      akcie: [
        { id: 'fb', label: 'Aktuálny rozvrh na FB', icon: '📘', typ: 'web', hodnota: 'https://www.facebook.com/profile.php?id=100036393136477' },
        { id: 'vol', label: 'Zavolať veterinárke', icon: '📞', typ: 'tel', hodnota: '0918699956' },
      ],
    },

    {
      id: 'posta',
      kategoria: 'posta',
      nazov: 'Pošta Výčapy-Opatovce',
      emoji: '📮',
      podtitul: 'Listy, balíky, výplaty dôchodkov',
      adresa: 'Výčapská 470/10, Výčapy-Opatovce',
      telefon: '037779512',                    // 037/77 951 20
      vedenie: 'Vedúca pošty: Mária Lapšanská',
      hodiny: [
        { den: 'pondelok', hodiny: '07:15 – 12:00 | 12:30 – 14:30' },
        { den: 'utorok',   hodiny: '07:15 – 12:00 | 12:30 – 14:30' },
        { den: 'streda',   hodiny: '07:15 – 11:00 | 14:00 – 17:00' },
        { den: 'stvrtok',  hodiny: '07:15 – 12:00 | 12:30 – 14:30' },
        { den: 'piatok',   hodiny: '07:15 – 12:00 | 12:30 – 14:30' },
        { den: 'sobota',   hodiny: null },
        { den: 'nedela',   hodiny: null },
      ],
      akcie: [
        {
          id: 'podrzanie',
          label: 'Podržanie zásielky (dlhšie)',
          icon: '📦',
          typ: 'tel',
          hodnota: '037779512',
          popis:
            'Ak nebudete doma a chcete aby pošta podržala zásielku dlhšie ako štandardných 18 dní, ' +
            'zavolajte priamo na poštu. Povedzte vaše meno, adresu a dátum, dokedy potrebujete zásielku podržať. ' +
            'Pošta to môže predĺžiť na základe dohody.',
        },
        {
          id: 'volat',
          label: 'Zavolať na poštu',
          icon: '📞',
          typ: 'tel',
          hodnota: '037779512',
        },
      ],
    },

    {
      id: 'farsky-urad',
      kategoria: 'farsky',
      nazov: 'Farský úrad Výčapy-Opatovce',
      emoji: '⛪',
      podtitul: 'Sväté omše, krsty, sobáše, pohreby',
      adresa: 'Výčapy-Opatovce',
      web: 'http://vycapy-opatovce.fara.sk/',
      hodiny: [
        // Typický rozvrh slovenských farností — admin môže upraviť
        { den: 'pondelok', hodiny: '18:00', poznamka: 'Sv. omša' },
        { den: 'utorok',   hodiny: '18:00', poznamka: 'Sv. omša' },
        { den: 'streda',   hodiny: null },
        { den: 'stvrtok',  hodiny: '18:00', poznamka: 'Sv. omša' },
        { den: 'piatok',   hodiny: '18:00', poznamka: 'Sv. omša' },
        { den: 'sobota',   hodiny: '18:00', poznamka: 'Sv. omša s nedeľnou platnosťou' },
        { den: 'nedela',   hodiny: '08:00 | 10:30', poznamka: 'Sv. omše' },
      ],
      poznamka:
        'Aktuálne ohlášky, smútočné oznamy a sviatky nájdete v sekcii Farské oznamy. ' +
        'Krsty, sobáše a pohreby si dohodnite osobne s pánom farárom.',
    },
  ],

  // ─── MAPA OBCE ───────────────────────────────────────────────────────
  // Centrum obce Výčapy-Opatovce — približne križovatka Výčapská ulica
  // Hodnoty admin obce môže upraviť cez Supabase (neskôr) alebo priamo tu.
  mapaCentrum: { lat: 48.4053, lng: 18.1430, zoom: 16 },

  pointyZaujmu: [
    {
      id: 'obecny-urad',
      kategoria: 'urad',
      nazov: 'Obecný úrad',
      podtitul: 'Výčapská 467/14',
      lat: 48.4053, lng: 18.1432,
      telefon: '037779515',
    },
    {
      id: 'zdravotnicke-stredisko-poi',
      kategoria: 'zdravotnictvo',
      nazov: 'Zdravotnícke stredisko',
      podtitul: 'Lekári, zubár, gynekológia',
      lat: 48.4059, lng: 18.1428,
      sluzbaId: 'zdravotnicke-stredisko',
    },
    {
      id: 'lekaren-poi',
      kategoria: 'lekaren',
      nazov: 'Lekáreň Sv. Cyrila a Metoda',
      podtitul: 'Výčapská 480/8 · Po-Pia 8-14',
      lat: 48.4066, lng: 18.1422,
      sluzbaId: 'lekaren',
      telefon: '037779520',
    },
    {
      id: 'posta-poi',
      kategoria: 'posta',
      nazov: 'Pošta',
      podtitul: 'Výčapská 470/10',
      lat: 48.4055, lng: 18.1435,
      sluzbaId: 'posta',
      telefon: '037779512',
    },
    {
      id: 'veterina-poi',
      kategoria: 'veterina',
      nazov: 'Veterinárna ambulancia',
      podtitul: 'MVDr. Kunová · za mäsiarstvom',
      lat: 48.4056, lng: 18.1436,
      sluzbaId: 'veterina',
      telefon: '0918699956',
    },
    {
      id: 'kostol',
      kategoria: 'kostol',
      nazov: 'Kostol',
      podtitul: 'Farský kostol Výčapy-Opatovce',
      lat: 48.4048, lng: 18.1438,
      sluzbaId: 'farsky-urad',
    },
    {
      id: 'sportova-hala',
      kategoria: 'sport',
      nazov: 'Športová hala',
      podtitul: 'Kapacita 200 osôb · Prenájom cez aplikáciu',
      lat: 48.4035, lng: 18.1465,
    },
    {
      id: 'futbalove-ihrisko',
      kategoria: 'sport',
      nazov: 'Futbalové ihrisko FC Výčapy-Opatovce',
      podtitul: 'Domáce zápasy Oblastnej ligy',
      lat: 48.4030, lng: 18.1480,
    },
    {
      id: 'multifunkcne-centrum',
      kategoria: 'kultura',
      nazov: 'Obecné multifunkčné centrum',
      podtitul: 'Bývalé kino ZOBOR · Kultúrne podujatia',
      lat: 48.4050, lng: 18.1442,
    },
    {
      id: 'kniznica',
      kategoria: 'kultura',
      nazov: 'Obecná knižnica',
      podtitul: 'V kaštieli · Bezbariérový prístup',
      lat: 48.4045, lng: 18.1440,
    },
    {
      id: 'zs',
      kategoria: 'skolstvo',
      nazov: 'Základná škola',
      podtitul: 'ZŠ Výčapy-Opatovce',
      lat: 48.4072, lng: 18.1410,
    },
    {
      id: 'ms',
      kategoria: 'skolstvo',
      nazov: 'Materská škola',
      podtitul: 'MŠ Výčapy-Opatovce',
      lat: 48.4080, lng: 18.1395,
    },
    {
      id: 'cintorin',
      kategoria: 'cintorin',
      nazov: 'Cintorín',
      podtitul: 'Obecný cintorín',
      lat: 48.4015, lng: 18.1395,
    },
    {
      id: 'defibrilator',
      kategoria: 'defibrilator',
      nazov: 'Defibrilátor (AED)',
      podtitul: 'Verejne dostupný · pri obecnom úrade',
      lat: 48.4053, lng: 18.1433,
    },
    {
      id: 'zberny-dvor',
      kategoria: 'dolezite',
      nazov: 'Zberný dvor',
      podtitul: 'Veľkoobjemový odpad, stavebný odpad',
      lat: 48.4002, lng: 18.1380,
    },
  ],

  // ─── VOĽNÝ ČAS V OKOLÍ ──────────────────────────────────────────────
  // Reálne miesta v okruhu cca 50 km od Výčapov-Opatoviec (Nitriansky kraj).
  // Pre nasadenie pre inú obec — vymeňte za relevantné miesta okolia.
  volnyCasMiesta: [
    // ─── Do 10 km ────────────────────────────────────────────────────
    {
      id: 'cyklo-nitra',
      kategoria: 'cyklotrasa',
      nazov: 'Cyklotrasa Výčapy-Opatovce — Nitra',
      podtitul: 'Asfaltová trasa pozdĺž Nitry, ~9 km',
      popis: 'Pohodlná cyklocesta do krajského mesta. Vhodná aj pre menšie deti a začiatočníkov. Pri Nitre nadväzuje na cyklookruh okolo mesta.',
      lat: 48.3700, lng: 18.1100,
      trvanie: '30 min cyklom',
      tagy: ['Vhodné pre deti', 'Asfalt', 'Mestský okruh nadväzuje'],
    },
    {
      id: 'nitra-hrad',
      kategoria: 'kultura',
      nazov: 'Nitriansky hrad',
      podtitul: 'Národná kultúrna pamiatka',
      popis: 'Najstaršie kresťanské miesto na Slovensku. Bazilika sv. Emeráma, hradné múzeum, výhľady na mesto. Vstupné cca 5 €.',
      lat: 48.3186, lng: 18.0866,
      web: 'https://www.nitrianskyhrad.sk',
      trvanie: '2-3 hodiny',
      tagy: ['Múzeum', 'Vstupné'],
    },
    {
      id: 'nitra-kalvaria',
      kategoria: 'priroda',
      nazov: 'Nitrianska Kalvária',
      podtitul: 'Pútnické miesto s výhľadom',
      popis: 'Lesopark s krížovou cestou na vrchu Kalvária. Krásne výhľady na mesto a Žibricu. Vhodné na nedeľnú prechádzku.',
      lat: 48.3175, lng: 18.0810,
      trvanie: '1-2 hodiny',
      tagy: ['Zadarmo', 'Prechádzka', 'Výhľady'],
    },
    {
      id: 'park-pod-borinou',
      kategoria: 'priroda',
      nazov: 'Park pod Borinou (Nitra)',
      podtitul: 'Mestský park · ihriská · jazierko',
      popis: 'Veľký mestský park s detskými ihriskami, jazierkom s kačicami a sieťou chodníkov. Ideálne pre rodiny s deťmi.',
      lat: 48.3232, lng: 18.0788,
      trvanie: '1-3 hodiny',
      tagy: ['Vhodné pre deti', 'Detské ihriská', 'Zadarmo'],
    },
    {
      id: 'agrokomplex',
      kategoria: 'kultura',
      nazov: 'Agrokomplex Nitra',
      podtitul: 'Výstavisko s atrakciami počas akcií',
      popis: 'Najväčšie výstavné centrum na Slovensku. Počas roka mnoho akcií — Agrokomplex, Hortikomplex, Autosalón, Vianočné trhy.',
      lat: 48.3236, lng: 18.1119,
      trvanie: 'celý deň',
      tagy: ['Akcie sezónne'],
    },
    {
      id: 'lefantovce-kostol',
      kategoria: 'kultura',
      nazov: 'Kostol Dolné Lefantovce',
      podtitul: 'Barokový kostol · ~8 km',
      popis: 'Pekný barokový kostol s pozoruhodnými freskami. Susedná obec s peknou cestou pomedzi vinice.',
      lat: 48.4710, lng: 18.1790,
      trvanie: '30 min',
      tagy: ['Zadarmo'],
    },

    // ─── 10-20 km ────────────────────────────────────────────────────
    {
      id: 'arboretum-mlynany',
      kategoria: 'priroda',
      nazov: 'Arborétum Mlyňany',
      podtitul: 'Botanická záhrada · ~22 km',
      popis: 'Najväčšie arborétum strednej Európy. 67 ha, vyše 2200 druhov drevín. Ázijská záhrada, ruže, sezónne kvitnutie. Vstupné cca 4 €.',
      lat: 48.3216, lng: 18.3756,
      web: 'https://www.arboretum.sav.sk',
      trvanie: 'pol dňa',
      tagy: ['Vhodné pre deti', 'Vstupné', 'Sezónne'],
    },
    {
      id: 'topolcianky-zamok',
      kategoria: 'kultura',
      nazov: 'Zámok Topoľčianky',
      podtitul: 'Klasicistický kaštieľ · ~24 km',
      popis: 'Bývalá letná rezidencia prezidenta. Zámocký park v anglickom štýle, múzeum nábytku, expozícia drevených zámkov. Vstupné cca 8 €.',
      lat: 48.4173, lng: 18.4135,
      web: 'https://www.zamoktopolcianky.sk',
      trvanie: '3-4 hodiny',
      tagy: ['Múzeum', 'Vstupné', 'Park'],
    },
    {
      id: 'topolcianky-zubria',
      kategoria: 'deti',
      nazov: 'Zubria zvernica Topoľčianky',
      podtitul: 'Jediná zubria rezervácia na SK · ~25 km',
      popis: 'Pozorovanie zubrov hôrnych vo voľnom výbehu. Pozorovacia veža, info centrum. Najlepší čas: ráno alebo večer.',
      lat: 48.4290, lng: 18.4350,
      trvanie: '1-2 hodiny',
      tagy: ['Vhodné pre deti', 'Zvieratá', 'Zadarmo'],
    },
    {
      id: 'topolcianky-zrebcin',
      kategoria: 'deti',
      nazov: 'Národný žrebčín Topoľčianky',
      podtitul: 'Chov koní · prehliadky · ~24 km',
      popis: 'Historický žrebčín so 400-ročnou tradíciou. Prehliadky stajní, ukážky koní lipicanov a huculov. Vhodné pre deti.',
      lat: 48.4145, lng: 18.4205,
      trvanie: '1-2 hodiny',
      tagy: ['Vhodné pre deti', 'Kone'],
    },
    {
      id: 'zibrica',
      kategoria: 'turistika',
      nazov: 'Žibrica',
      podtitul: 'Vrch Tribeča · 617 m · ~14 km',
      popis: 'Najvyšší vrch v Podzoborskej časti Tribeča. Turistický chodník zo Žirian alebo Štitár. Krásne výhľady na Nitru a okolie.',
      lat: 48.3858, lng: 18.1900,
      trvanie: '3-5 hodín',
      tagy: ['Turistika', 'Výhľady', 'Stredne náročné'],
    },
    {
      id: 'velky-tribec',
      kategoria: 'turistika',
      nazov: 'Veľký Tribeč',
      podtitul: 'Najvyšší vrch Tribeča · 829 m · ~22 km',
      popis: 'Zalesnená kupola s rozhľadňou. Vystúpiť možno z Klátovej Novej Vsi alebo z Velčíc. Náročnejšia turistika.',
      lat: 48.5078, lng: 18.3650,
      trvanie: '5-7 hodín',
      tagy: ['Turistika', 'Náročné', 'Les'],
    },

    // ─── 20-50 km ────────────────────────────────────────────────────
    {
      id: 'topolciansky-hrad',
      kategoria: 'kultura',
      nazov: 'Topoľčiansky hrad',
      podtitul: 'Zrúcanina hradu · ~28 km',
      popis: 'Romantické ruiny hradu zo 13. storočia. Krátka turistika lesom k hradu, výhľad na Považský Inovec a Tríbeč.',
      lat: 48.5750, lng: 18.0700,
      trvanie: '2-3 hodiny',
      tagy: ['Turistika', 'Zadarmo', 'Hrad'],
    },
    {
      id: 'hlohovec-zamok',
      kategoria: 'kultura',
      nazov: 'Hlohovský zámok',
      podtitul: 'Renovovaný kaštieľ · ~30 km',
      popis: 'Klasicistický zámok s parkom a múzeom. Krásne renovované interiéry, hudobné podujatia. Vstupné cca 5 €.',
      lat: 48.4291, lng: 17.8047,
      trvanie: '2-3 hodiny',
      tagy: ['Múzeum', 'Vstupné', 'Park'],
    },
    {
      id: 'kostolany-rotunda',
      kategoria: 'kultura',
      nazov: 'Rotunda v Kostoľanoch pod Tribečom',
      podtitul: 'Najstaršie románske dielo SR · ~26 km',
      popis: 'Predrománska rotunda Sv. Juraja z 10. storočia. Národná kultúrna pamiatka, jedinečné stredoveké fresky.',
      lat: 48.4862, lng: 18.2945,
      trvanie: '1 hodina',
      tagy: ['Pamiatka', 'Vstupné'],
    },
    {
      id: 'duchonka',
      kategoria: 'wellness',
      nazov: 'Vodná nádrž Duchonka',
      podtitul: 'Letné kúpanie · ~35 km',
      popis: 'Obľúbená priehrada v lese pod Tríbečom. Kúpanie, požičovňa lodiek, reštaurácie, ubytovanie. V lete preplnené.',
      lat: 48.6090, lng: 18.0930,
      trvanie: 'celý deň',
      tagy: ['Vhodné pre deti', 'Kúpanie', 'Letné'],
    },
    {
      id: 'piestany-kupele',
      kategoria: 'wellness',
      nazov: 'Kúpele Piešťany',
      podtitul: 'Termálne kúpele svetového mena · ~45 km',
      popis: 'Slávne kúpele s termálnou vodou. Kúpalisko Eva (verejné, lacné), Thermia Park (drahšie), Kolonádový most.',
      lat: 48.5870, lng: 17.8290,
      web: 'https://www.piestany.sk',
      trvanie: 'celý deň',
      tagy: ['Wellness', 'Vstupné', 'Termálna voda'],
    },
    {
      id: 'lavice-kupalisko',
      kategoria: 'wellness',
      nazov: 'Termálne kúpalisko Levice',
      podtitul: 'Termal Levice · ~40 km',
      popis: 'Vonkajšie aj kryté termálne bazény. Tobogány, vírivky. Vhodné celoročne, hlavne v zime krytá hala.',
      lat: 48.2125, lng: 18.6065,
      trvanie: 'pol dňa',
      tagy: ['Vhodné pre deti', 'Wellness', 'Celoročné'],
    },
    {
      id: 'cyklookruh-podzoborsky',
      kategoria: 'cyklotrasa',
      nazov: 'Cyklookruh Podzoborská hrádza',
      podtitul: 'Vínny okruh okolo Zobora · ~35 km celkom',
      popis: 'Cyklotrasa pomedzi vinohrady, obce Lefantovce, Žirany, Štitáre, Pohranice. Možnosť ochutnávky vína po ceste.',
      lat: 48.4500, lng: 18.1500,
      web: 'http://podzobor.zombeek.sk/',
      trvanie: 'celý deň',
      tagy: ['Cyklotrasa', 'Vinohrady', 'Náročnejšie'],
    },
    {
      id: 'gymniks-nitra',
      kategoria: 'deti',
      nazov: 'Detský zábavný park GymNiks (Nitra)',
      podtitul: 'Krytá herňa pre deti · ~10 km',
      popis: 'Trampolíny, lezecká stena, lego herňa, narodeninové oslavy. Ideálne v daždivý deň.',
      lat: 48.3050, lng: 18.0950,
      trvanie: '2-3 hodiny',
      tagy: ['Vhodné pre deti', 'Vstupné', 'Kryté'],
    },
    {
      id: 'aquapark-poprad-mimo',
      // necháme placeholder pre prípady mimo 50km dosahu — admin si zmaže
      kategoria: 'sport',
      nazov: 'Tenisové kurty Mojmírovce',
      podtitul: 'Verejné kurty · ~18 km',
      popis: 'Antukové kurty na rezerváciu. Aj Padel kurty.',
      lat: 48.2700, lng: 18.1700,
      trvanie: '1-2 hodiny',
      tagy: ['Tenis', 'Padel'],
    },
  ],

  socialLinks: {
    web: 'https://www.vycapy-opatovce.sk',
  },

  martaContextSummary: [
    'Obec Výčapy-Opatovce sa nachádza v okrese Nitra v Nitrianskom kraji.',
    'Má približne 1900 obyvateľov. Obecný úrad sídli na adrese Výčapy-Opatovce.',
    'Telefón na úrad: 037 / 77 951 51, email: info@vycapy-opatovce.sk.',
    'Úradné hodiny: Po, Ut, Št 7:30-15:30, Streda 7:30-17:00, Piatok 7:30-13:00.',
    'V obci pôsobí futbalový klub FC Výčapy-Opatovce hrajúci Oblastnú ligu.',
    'Občania majú k dispozícii športovú halu, ktorú si môžu prenajať.',
  ].join(' '),
}

// ─────────────────────────────────────────────────────────────────────────
// Active tenant — neskôr cez Supabase / build-time env
// ─────────────────────────────────────────────────────────────────────────

const ACTIVE_TENANT: Tenant = vycapyOpatovce

export function getTenant(): Tenant {
  return ACTIVE_TENANT
}

// ─── React hook ───────────────────────────────────────────────────────────
// Kvôli kompatibilite s hooks chained calls neskôr (pre Supabase-driven config)
// to wrappneme do hooku — teraz vracia konštantu, neskôr zhodne signatúru.

import { useMemo } from 'react'

export function useTenant(): Tenant {
  return useMemo(() => getTenant(), [])
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Najbližší úradný deň + dnes je otvorené? */
export function uradStatusDnes(t: Tenant = getTenant()): {
  jeOtvoreneTeraz: boolean
  hodinyDnes: string | null
  dalsiOtvoreneny?: { den: string; hodiny: string }
} {
  const dni: DenVTyzdni[] = ['nedela','pondelok','utorok','streda','stvrtok','piatok','sobota']
  const today = new Date()
  const todayKey = dni[today.getDay()]
  const todayRecord = t.uradneHodiny.find(h => h.den === todayKey)

  let jeOtvoreneTeraz = false
  if (todayRecord?.hodiny) {
    // Parse "7:30 – 15:30" formát
    const m = todayRecord.hodiny.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/)
    if (m) {
      const [, fh, fm, th, tm] = m
      const start = Number(fh) * 60 + Number(fm)
      const end   = Number(th) * 60 + Number(tm)
      const now   = today.getHours() * 60 + today.getMinutes()
      jeOtvoreneTeraz = now >= start && now < end
    }
  }

  // Hľadaj ďalší otvorený deň
  let dalsiOtvoreneny: { den: string; hodiny: string } | undefined
  for (let i = 1; i <= 7; i++) {
    const idx = (today.getDay() + i) % 7
    const key = dni[idx]
    const r = t.uradneHodiny.find(h => h.den === key)
    if (r?.hodiny) {
      dalsiOtvoreneny = { den: key, hodiny: r.hodiny }
      break
    }
  }

  return {
    jeOtvoreneTeraz,
    hodinyDnes: todayRecord?.hodiny ?? null,
    dalsiOtvoreneny,
  }
}
