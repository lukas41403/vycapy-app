-- ════════════════════════════════════════════════════════════════════════
--  Demo seed dáta — pre prezentáciu starostovi.
--  Spusti AŽ PO `supabase-setup.sql`. Pridáva 15+ aktualít, 10+ podujatí,
--  5+ rezervácií haly a niekoľko hlásení porúch.
--
--  Bezpečne spustiteľné viackrát — používa ON CONFLICT DO NOTHING / WHERE NOT EXISTS.
-- ════════════════════════════════════════════════════════════════════════


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


-- ════════════════════════════════════════════════════════════════════════
-- Kontrola počtov:
SELECT 'aktuality'        AS t, count(*) FROM public.aktuality
UNION ALL SELECT 'podujatia',       count(*) FROM public.podujatia
UNION ALL SELECT 'prenajom_haly',   count(*) FROM public.prenajom_haly
UNION ALL SELECT 'hlaseniaporuchy', count(*) FROM public.hlaseniaporuchy;
-- ════════════════════════════════════════════════════════════════════════
