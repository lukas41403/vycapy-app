-- ════════════════════════════════════════════════════════════════════════
--  Demo seed dáta — pre prezentáciu starostovi.
--  Spusti AŽ PO `supabase-setup.sql`. Pridáva 15+ aktualít, 10+ podujatí,
--  5+ rezervácií haly a niekoľko hlásení porúch.
--
--  Bezpečne spustiteľné viackrát — používa ON CONFLICT DO NOTHING / WHERE NOT EXISTS.
-- ════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────
-- 🔧 PRE-FIX: oprava CHECK constraintov ak existujú so zlými hodnotami
-- (potrebné keď boli tabuľky vytvorené ručne predtým)
-- ────────────────────────────────────────────────────────────────────────

-- prenajom_haly.status musí akceptovať 'nove','schvalene','zamietnute'
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.prenajom_haly'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.prenajom_haly DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;
DO $$ BEGIN
  ALTER TABLE public.prenajom_haly
    ADD CONSTRAINT prenajom_haly_status_check
    CHECK (status IN ('nove','schvalene','zamietnute'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- hlaseniaporuchy.status musí akceptovať 'nove','v_rieseni','vyriesene','zamietnute'
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.hlaseniaporuchy'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.hlaseniaporuchy DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;
DO $$ BEGIN
  ALTER TABLE public.hlaseniaporuchy
    ADD CONSTRAINT hlaseniaporuchy_status_check
    CHECK (status IN ('nove','v_rieseni','vyriesene','zamietnute'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- aktuality.kategoria
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.aktuality'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%kategoria%'
  LOOP
    EXECUTE 'ALTER TABLE public.aktuality DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;
DO $$ BEGIN
  ALTER TABLE public.aktuality
    ADD CONSTRAINT aktuality_kategoria_check
    CHECK (kategoria IN ('oznam','akcia','uzavierka','vypadok','sport','ine'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- podujatia.kategoria
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.podujatia'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%kategoria%'
  LOOP
    EXECUTE 'ALTER TABLE public.podujatia DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;
DO $$ BEGIN
  ALTER TABLE public.podujatia
    ADD CONSTRAINT podujatia_kategoria_check
    CHECK (kategoria IN ('kultura','sport','slavnost','kino','divadlo','deti','ine'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Verifikácia že constrainty sú správne:
DO $$
DECLARE
  prenajom_def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO prenajom_def
  FROM pg_constraint
  WHERE conrelid = 'public.prenajom_haly'::regclass
    AND contype = 'c'
    AND conname = 'prenajom_haly_status_check';
  RAISE NOTICE 'prenajom_haly_status_check: %', prenajom_def;
END $$;



-- ────────────────────────────────────────────────────────────────────────
-- AKTUALITY (15+)
-- ────────────────────────────────────────────────────────────────────────

INSERT INTO public.aktuality (title, perex, body, kategoria, is_published, published_at, cover_url) VALUES
  ('Komunikácia bude opravená',
   'Hlavná ulica dostane nový asfalt v júni 2026.',
   E'Vážení občania,\n\noznamujeme vám, že počas mesiaca jún 2026 sa uskutoční rekonštrukcia Hlavnej ulice. Práce budú prebiehať v dvoch etapách. Občanov žiadame o trpezlivosť a rešpektovanie dopravného značenia.\n\nĎakujeme.',
   'oznam', true, '2026-05-12 09:00+00',
   'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=800&q=80'),

  ('Jarné upratovanie obce',
   'V sobotu 17. mája od 8:00 sa stretneme pri obecnom úrade.',
   E'Pripravte si rukavice a vrecia — obec zabezpečí občerstvenie. Vyčistíme cestu k potoku a okolie ihriska. Tešíme sa na hojnú účasť.',
   'akcia', true, '2026-05-10 14:00+00',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'),

  ('Nové detské ihrisko pri škôlke',
   'Projekt schválený. Realizácia začína v júli.',
   E'Vďaka dotácii z eurofondov vznikne v areáli materskej školy nové detské ihrisko s 12 hracími prvkami. Súčasťou bude aj nový plot a okrasná zeleň.',
   'akcia', true, '2026-05-08 11:00+00',
   'https://images.unsplash.com/photo-1575364289203-8b8f23ef2f4b?w=800&q=80'),

  ('Plánovaný výpadok vody 22. mája',
   'Z dôvodu opráv vodovodu od 8:00 do 14:00.',
   E'Západoslovenská vodárenská spoločnosť oznamuje plánovaný výpadok pitnej vody dňa 22. 5. 2026. Postihnuté ulice: Hlavná, Školská, Záhradná. Náhradné zásobovanie cisternou bude pri obecnom úrade.',
   'vypadok', true, '2026-05-15 07:00+00',
   'https://images.unsplash.com/photo-1504016798967-59a258e9d78c?w=800&q=80'),

  ('Futbalový turnaj o pohár starostu',
   'Sobota 7. júna, ihrisko TJ. Vstup voľný.',
   E'Pozývame vás na tradičný futbalový turnaj 3 obcí. Štart 9:00, finále o 16:00. Bohatý program pre deti, občerstvenie zabezpečené.',
   'sport', true, '2026-05-13 12:00+00',
   'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80'),

  ('Zápis do MŠ',
   'Zápis prebehne 3.–4. júna v budove materskej školy.',
   E'Potrebné doklady: rodný list dieťaťa, občiansky preukaz zákonného zástupcu. Zápis prebieha od 8:00 do 16:00.',
   'oznam', true, '2026-05-11 10:00+00',
   'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80'),

  ('Stavanie mája — pozvánka',
   'Sobota 30. apríla pred kultúrnym domom o 18:00.',
   E'Tradícia, ktorá nesmie chýbať. Hudba: ľudová kapela Nitrania. Občerstvenie a tombola.',
   'akcia', true, '2026-04-25 15:00+00',
   'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80'),

  ('Uzávierka Záhradnej ulice 18.–20. mája',
   'Z dôvodu rekonštrukcie kanalizácie.',
   E'Obchádzka cez Školskú ulicu. Prosíme občanov o pochopenie a opatrnú jazdu. Pre peších bude prístup zachovaný.',
   'uzavierka', true, '2026-05-14 08:30+00',
   NULL),

  ('Vianočné posedenie seniorov',
   'Plánujeme na 14. december 2026.',
   E'Obec pripravuje tradičné posedenie. Prihlášky cez obecný úrad alebo seniorský klub.',
   'akcia', true, '2026-05-09 13:00+00',
   NULL),

  ('Beh okolo obce — 5. ročník',
   'Štart 14. júna pri obecnom úrade.',
   E'5 km trasa pre dospelých, 1 km pre deti. Registrácia od 8:00, štart 9:30. Štartovné 5 €.',
   'sport', true, '2026-05-07 16:00+00',
   'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80'),

  ('Zber elektroodpadu',
   'Sobota 24. mája od 8:00 pri obecnom úrade.',
   E'Bezplatný zber: televízory, chladničky, počítače, žiarivky, batérie.',
   'oznam', true, '2026-05-06 09:00+00',
   NULL),

  ('Nový projekt: cyklotrasa',
   'Žiadame občanov o vyjadrenie v ankete.',
   E'V menu Viac → Ankety obce nájdete novú otázku k cyklotrase popri potoku Nitrica. Vaše hlasovanie ovplyvní finálne rozhodnutie zastupiteľstva.',
   'oznam', true, '2026-05-16 10:00+00',
   'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80'),

  ('Slávnosť dňa obce 2026',
   'Sobota 14. júna od 14:00. Hlavná hviezda: Kollárovci.',
   E'Bohatý kultúrny program, vystúpenia detí, jarmok remesiel, ohňostroj. Tešíme sa na vás!',
   'akcia', true, '2026-05-05 10:00+00',
   'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80'),

  ('Výpadok elektriny ohlásený',
   'Hlavná ul. 1–25, štvrtok 23. mája 9:00–11:00.',
   E'Plánované práce na rozvodnej sieti. Plánujte spotrebiče vopred. Ďakujeme za pochopenie.',
   'vypadok', true, '2026-05-17 08:00+00',
   NULL),

  ('Tenisový turnaj seniorov',
   'Nedeľa 25. mája na obecných kurtoch.',
   E'Otvorený turnaj pre hráčov 50+. Prihlášky do piatka, štartovné 3 €. Občerstvenie zabezpečené.',
   'sport', true, '2026-05-18 11:00+00',
   NULL)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────
-- PODUJATIA (10+)
-- ────────────────────────────────────────────────────────────────────────

INSERT INTO public.podujatia (title, popis, kategoria, datum_od, miesto, is_published) VALUES
  ('Stavanie mája', 'Tradičná akcia pri kultúrnom dome s ľudovou hudbou.', 'slavnost', '2026-05-30 18:00+00', 'Pred kultúrnym domom', true),
  ('Deň matiek', 'Vystúpenie detí MŠ a folklórneho súboru. Občerstvenie zabezpečené.', 'kultura', '2026-05-25 15:00+00', 'Kultúrny dom', true),
  ('Futbalový turnaj o pohár starostu', 'Turnaj 3 obcí — Výčapy, Cabaj, Pohranice. Zápasy od 9:00.', 'sport', '2026-06-07 09:00+00', 'Ihrisko TJ', true),
  ('Beh okolo obce — 5. ročník', '5 km dospelí, 1 km deti. Štartovné 5 €.', 'sport', '2026-06-14 09:30+00', 'Obecný úrad', true),
  ('Slávnosť dňa obce', 'Hlavná hviezda Kollárovci. Jarmok, ohňostroj.', 'slavnost', '2026-06-14 14:00+00', 'Námestie + ihrisko', true),
  ('Letné kino: Slúha dvoch pánov', 'Komédia pod hviezdami. Vstupné dobrovoľné.', 'kino', '2026-06-21 21:30+00', 'Park pri kostole', true),
  ('Tanečná zábava — Open Air', 'Hrá kapela Vatra. Vstup 8 €.', 'kultura', '2026-06-28 20:00+00', 'Pri kultúrnom dome', true),
  ('Detský deň — hry a súťaže', 'Skákací hrad, maľovanie na tvár, sladkosti.', 'deti', '2026-06-01 14:00+00', 'Detské ihrisko', true),
  ('Divadelné predstavenie: Statky-zmätky', 'Ochotníci z Čierneho lesa.', 'divadlo', '2026-07-05 19:00+00', 'Kultúrny dom', true),
  ('Tenisový turnaj seniorov', 'Otvorený turnaj 50+. Vstupné 3 €.', 'sport', '2026-05-25 09:00+00', 'Tenisové kurty', true),
  ('Hodová slávnosť', 'Tradičné hody s jarmokom a hudobnou produkciou.', 'slavnost', '2026-08-15 12:00+00', 'Námestie', true)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────
-- REZERVÁCIE HALY (5+) — pre kalendár obsadenosti
-- ────────────────────────────────────────────────────────────────────────

INSERT INTO public.prenajom_haly (meno, email, telefon, datum, cas_od, cas_do, ucel, pocet_osob, status) VALUES
  ('Klub stolného tenisu', 'stolnytenis@vycapy.sk', '0905 111 222', '2026-05-22', '17:00', '20:00', 'sport', 12, 'schvalene'),
  ('Rodina Novákovcov',    'jan.novak@email.sk',    '0905 333 444', '2026-05-24', '15:00', '22:00', 'oslava', 60, 'schvalene'),
  ('Firma TECHNIA s.r.o.', 'office@technia.sk',     '0905 555 666', '2026-05-30', '09:00', '17:00', 'firemne', 40, 'schvalene'),
  ('Divadelný súbor',      'divadlo@vycapy.sk',     '0905 777 888', '2026-06-05', '18:00', '22:00', 'kultura', 80, 'schvalene'),
  ('Volejbalový klub',     'volejbal@vycapy.sk',    '0905 999 000', '2026-06-12', '19:00', '21:00', 'sport', 20, 'schvalene'),
  ('Mgr. Pavol Sloboda',   'p.sloboda@email.sk',    '0905 121 212', '2026-06-20', '14:00', '22:00', 'oslava', 100, 'nove')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────
-- HLÁSENIA PORÚCH (príklady)
-- ────────────────────────────────────────────────────────────────────────

INSERT INTO public.hlaseniaporuchy (kategoria, popis, adresa, status) VALUES
  ('osvietenie', 'Pri obchode Coop nesvieti druhá pouličná lampa už týždeň.', 'Hlavná ul., pri obchode Coop', 'v_rieseni'),
  ('cesta', 'Veľká diera v ceste pri zákrute na Školskú ul. Nebezpečné pre cyklistov.', 'Križovatka Hlavná × Školská', 'nove'),
  ('zelen', 'Spadnutý konár stromu blokuje chodník po búrke.', 'Park pri kostole', 'vyriesene'),
  ('voda', 'Tečie hydrant pri ihrisku TJ, voda padá na cestu.', 'Pri ihrisku TJ', 'nove'),
  ('odpad', 'Kontajner na plasty pri škole je preplnený 3 dni.', 'Školská ul., pred ZŠ', 'v_rieseni')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────
-- RSS SYNC DEMO — 3 aktuality "stiahnuté" z WebyGroup webu
-- (markované cez source='webygroup' aby admin UI ukázal odznak)
-- ────────────────────────────────────────────────────────────────────────

-- Defenzívne doplnenie stĺpcov ak chýbajú
ALTER TABLE public.aktuality
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;
DO $$ BEGIN
  CREATE UNIQUE INDEX aktuality_external_id_unique
    ON public.aktuality (external_id) WHERE external_id IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

INSERT INTO public.aktuality
  (title, perex, body, kategoria, is_published, published_at, external_id, source, synced_at, cover_url)
VALUES
  ('Zber VEĽKOOBJEMOVÉHO odpadu',
   'Sobota 23. mája 2026, 8:00–12:00 na zbernom dvore.',
   E'Obecný úrad oznamuje, že zber veľkoobjemového odpadu sa uskutoční v sobotu 23. mája 2026 v čase od 8:00 do 12:00 hod. na zbernom dvore.\n\n— stiahnuté automaticky z vycapy-opatovce.sk',
   'oznam', true, '2026-05-20 09:00+00',
   'https://www.vycapy-opatovce.sk/zber-velkoobjemoveho-odpadu-oznam-9/mid/517379/',
   'webygroup',
   now() - interval '15 minutes',
   NULL),

  ('Obecný úrad vyzýva občanov k zvýšenej ostražitosti',
   'V obci bol zaznamenaný výskyt podozrivého bieleho vozidla.',
   E'V našej obci bol zaznamenaný výskyt podozrivého bieleho vozidla, ktorého posádka sa pod zámienkou výkupu železa snažila nadviazať kontakt so skupinou detí.\n\nVďaka duchaprítomnosti detí bola ŠPZ vozidla zaznamenaná a prípadom sa zaoberá polícia.\n\n— stiahnuté automaticky z vycapy-opatovce.sk',
   'vypadok', true, '2026-05-18 14:00+00',
   'https://www.vycapy-opatovce.sk/obecny-urad-vyzyva-obcanov-k-zvysenej-ostrazitosti-oznam/',
   'webygroup',
   now() - interval '15 minutes',
   NULL),

  ('Mimoriadne odpočty stavu vodomerov',
   'ZsVS vykoná odpočty od 15. mája do 13. júna 2026.',
   E'Západoslovenská vodárenská spoločnosť bude v období od 15. mája 2026 do 13. júna 2026 vykonávať mimoriadne odpočty stavu vodomerov.\n\nZisťovanie stavu vodomerov budú vykonávať zamestnanci ZsVS v pracovných dňoch a pracovnom čase určenom spoločnosťou.\n\n— stiahnuté automaticky z vycapy-opatovce.sk',
   'oznam', true, '2026-05-15 08:00+00',
   'https://www.vycapy-opatovce.sk/mimoriadne-odpocty-stavu-vodomerov-oznam/',
   'webygroup',
   now() - interval '15 minutes',
   NULL)
ON CONFLICT (external_id) DO NOTHING;

-- Záznam v sync logu (aby admin UI ukázal "Posledný sync pred 15 min")
INSERT INTO public.rss_sync_log
  (feed_url, feed_kind, pocet_novych, pocet_aktualizovanych, pocet_chyba, trvanie_ms, created_at)
VALUES
  ('https://www.vycapy-opatovce.sk/get_rss.php?id=1_atom_1395',
   'aktuality', 3, 0, 0, 412, now() - interval '15 minutes'),
  ('https://www.vycapy-opatovce.sk/get_rss.php?id=3_atom',
   'podujatia', 0, 2, 0, 287, now() - interval '15 minutes'),
  ('https://www.vycapy-opatovce.sk/get_rss.php?id=1_atom_16042',
   'farske_oznamy', 1, 0, 0, 156, now() - interval '15 minutes')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────
-- FARSKÉ OZNAMY (5 ukážkových)
-- ────────────────────────────────────────────────────────────────────────

INSERT INTO public.farske_oznamy (typ, nazov, popis, datum_od, miesto, je_aktivny) VALUES
  ('omsa', 'Nedeľná sv. omša',
   'Pravidelná nedeľná sv. omša s ohláškami.',
   (now() + interval '2 days')::date + time '10:30',
   'Kostol Výčapy-Opatovce', true),

  ('omsa', 'Sobotná sv. omša s nedeľnou platnosťou',
   'Pre tých, ktorí v nedeľu cestujú.',
   (now() + interval '1 day')::date + time '18:00',
   'Kostol Výčapy-Opatovce', true),

  ('smutok', 'Smútočné oznámenie — Mária Kováčová',
   E'S hlbokou bôľou v srdci oznamujeme, že nás vo veku 87 rokov navždy opustila Mária Kováčová.\n\nPohrebná svätá omša bude v utorok o 14:00, posledná rozlúčka na cintoríne.\n\nNech odpočíva v pokoji.',
   (now() + interval '3 days')::date + time '14:00',
   'Kostol a cintorín Výčapy-Opatovce', true),

  ('krst', 'Krst dieťatka Jakubka',
   'Zoznamy krstných rodičov sú v sakristii.',
   (now() + interval '7 days')::date + time '11:00',
   'Kostol Výčapy-Opatovce', true),

  ('ohlaska', 'Ohláška: Peter Nový a Mária Krásna',
   E'Ohlasujem manželstvo medzi:\n• Peter Nový, syn Jána a Anny\n• Mária Krásna, dcéra Petra a Evy\n\nKto by vedel o prekážke, nech oznámi pánovi farárovi.',
   (now() + interval '14 days')::date + time '10:30',
   'Kostol Výčapy-Opatovce', true)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────
-- SUSEDSKÝ PREDAJ — 5 ukážkových inzerátov
-- ────────────────────────────────────────────────────────────────────────

INSERT INTO public.susedsky_predaj (typ, kategoria, nazov, popis, cena, meno, telefon, stav, je_schvaleny) VALUES
  ('predam', 'detske',
   'Detský bicykel CTM, veľkosť 24',
   E'Predám detský bicykel značky CTM, veľkosť 24 palcov. Vhodný pre deti 7-10 rokov. Stav primeraný veku, plne funkčný. Možno vyskúšať pred kúpou.',
   45.00, 'Peter z Hlavnej', '0905 123 456', 'aktivny', true),

  ('zadarmo', 'domacnost',
   'Sklenené poháre — odovzdám',
   E'Mám doma 30 sklenených pohárov rôznych veľkostí. Sťahujem sa, nepotrebujem ich. Kto má záujem, ozvite sa.',
   NULL, 'Anna', '0908 111 222', 'aktivny', true),

  ('hladam', 'praca',
   'Hľadám pomoc pri kosení záhrady',
   E'Som dôchodkyňa, hľadám spoľahlivú osobu (najlepšie z obce), ktorá by mi občas pokosila záhradu cca 300 m². Odmena dohodou.',
   NULL, 'Helena z Lipovej', '0908 987 654', 'aktivny', true),

  ('predam', 'zahrada',
   'Kosačka HONDA, málo používaná',
   E'Benzínová kosačka HONDA, nová pred 2 rokmi. Predávam pretože som kúpil traktor. Plne funkčná, servisovaná.',
   180.00, 'Ján z Polnej', '0903 555 333', 'aktivny', true),

  ('kupim', 'auto',
   'Kúpim malý starší automobil',
   E'Hľadám staršie auto pre dcéru, ktorá sa učí jazdiť. Stav primeraný, max 1500 € a STK aspoň 6 mesiacov.',
   NULL, 'Tomáš', '0905 666 777', 'aktivny', true)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────────
-- ODPADY — Typy + ukážkový kalendár najbližšie 6 vývozov
-- ────────────────────────────────────────────────────────────────────────

-- Defenzívne doplnenie stĺpcov ak tabuľka existovala s inou schémou
ALTER TABLE public.odpady_typy
  ADD COLUMN IF NOT EXISTS kod text,
  ADD COLUMN IF NOT EXISTS farba text DEFAULT '#888888',
  ADD COLUMN IF NOT EXISTS ikona text;

DO $$ BEGIN
  ALTER TABLE public.odpady_typy ADD CONSTRAINT odpady_typy_kod_unique UNIQUE (kod);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN unique_violation THEN NULL; END $$;

INSERT INTO public.odpady_typy (kod, nazov, farba, ikona) VALUES
  ('komunal',    'Komunálny odpad',     '#37474F', '🗑️'),
  ('plast',      'Plast a kovové obaly','#FFB300', '♻️'),
  ('papier',     'Papier',              '#1976D2', '📦'),
  ('sklo',       'Sklo',                '#388E3C', '🍾'),
  ('biologicky', 'Bioodpad',            '#6D4C41', '🌿')
ON CONFLICT (kod) DO NOTHING;

-- Kalendár vývozu — používame subquery cez typ_id FK
ALTER TABLE public.odpady_kalendar
  ADD COLUMN IF NOT EXISTS typ_id uuid,
  ADD COLUMN IF NOT EXISTS poznamka text;

INSERT INTO public.odpady_kalendar (typ_id, datum, poznamka)
SELECT t.id, v.datum::date, v.poznamka
FROM (VALUES
  ('komunal',    (now() + interval '2 days'),  'Vyložte kontajner ráno pred 6:00'),
  ('plast',      (now() + interval '5 days'),  'Vyložte vo vreciach a zaviazané'),
  ('papier',     (now() + interval '12 days'), NULL),
  ('komunal',    (now() + interval '16 days'), NULL),
  ('biologicky', (now() + interval '19 days'), 'Bioodpad apríl-november každé 2 týždne'),
  ('sklo',       (now() + interval '26 days'), NULL)
) AS v(kod, datum, poznamka)
JOIN public.odpady_typy t ON t.kod = v.kod
WHERE NOT EXISTS (
  SELECT 1 FROM public.odpady_kalendar k
  WHERE k.typ_id = t.id AND k.datum = v.datum::date
);


-- ────────────────────────────────────────────────────────────────────────
-- METEO STANICA — 1 ukážková (centrum obce, s reálnymi hodnotami)
-- ────────────────────────────────────────────────────────────────────────

INSERT INTO public.obecne_zariadenia
  (nazov, typ, ulica, lat, lng, teplota, vlhkost, aqi, pm25, pm10, updated_at)
VALUES
  ('Meteo stanica Centrum',
   'meteo',
   'Výčapská 467/14 (pri obecnom úrade)',
   48.4053, 18.1432,
   18.5, 68.0,
   32, 12.5, 18.2,
   now() - interval '15 minutes')
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════════════════════════════
-- Kontrola počtov:
SELECT 'aktuality'        AS t, count(*) FROM public.aktuality
UNION ALL SELECT 'podujatia',       count(*) FROM public.podujatia
UNION ALL SELECT 'prenajom_haly',   count(*) FROM public.prenajom_haly
UNION ALL SELECT 'hlaseniaporuchy', count(*) FROM public.hlaseniaporuchy
UNION ALL SELECT 'farske_oznamy',   count(*) FROM public.farske_oznamy
UNION ALL SELECT 'susedsky_predaj', count(*) FROM public.susedsky_predaj
UNION ALL SELECT 'odpady_kalendar', count(*) FROM public.odpady_kalendar
UNION ALL SELECT 'obecne_zariadenia', count(*) FROM public.obecne_zariadenia;
-- ════════════════════════════════════════════════════════════════════════
