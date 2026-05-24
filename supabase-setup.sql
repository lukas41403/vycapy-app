-- ════════════════════════════════════════════════════════════════════════
--  Výčapy-Opatovce obecná appka — kompletný setup
--  Spusti všetko v Supabase SQL Editore (https://hionzftqhnxfqcegsnaj.supabase.co)
--  Každý blok môžeš spustiť samostatne; všetky používajú IF NOT EXISTS / ON CONFLICT.
-- ════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────
-- 1. STĹPCE — pridanie chýbajúcich polí do existujúcich tabuliek
-- ────────────────────────────────────────────────────────────────────────

-- Status pre prenajom_haly (Wow 2: kalendár obsadenosti)
ALTER TABLE public.prenajom_haly
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'nove';

-- Foto URLs pre hlasenia (Úloha 4: foto v hláseniach)
ALTER TABLE public.hlaseniaporuchy
  ADD COLUMN IF NOT EXISTS foto_urls text[];


-- ────────────────────────────────────────────────────────────────────────
-- 2. STORAGE BUCKETY — pre obrázky
-- ────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('hlaseniafotos', 'hlaseniafotos', true) ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('aktuality-covers', 'aktuality-covers', true) ON CONFLICT DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "hlaseniafotos_upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'hlaseniafotos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "hlaseniafotos_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'hlaseniafotos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "aktuality_covers_upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'aktuality-covers');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "aktuality_covers_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'aktuality-covers');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ────────────────────────────────────────────────────────────────────────
-- 3. STAROSTA DASHBOARD — obecne_zariadenia (IoT)
-- ────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.obecne_zariadenia (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nazov text NOT NULL,
  typ text CHECK (typ IN ('osvetlenie','voda','senzor_vody','meteo','kontajner')) NOT NULL,
  ulica text,
  stav boolean DEFAULT false,
  posledna_hodnota float,
  jednotka text,
  lat double precision,
  lng double precision,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.obecne_zariadenia ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "zariadenia_read" ON public.obecne_zariadenia FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "zariadenia_update" ON public.obecne_zariadenia FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed (len ak ešte nie sú)
INSERT INTO public.obecne_zariadenia (nazov, typ, ulica, stav, posledna_hodnota, jednotka)
SELECT * FROM (VALUES
  ('Osvetlenie — Hlavná ul. sever', 'osvetlenie', 'Hlavná ulica', true,  NULL::float, NULL::text),
  ('Osvetlenie — Hlavná ul. juh',   'osvetlenie', 'Hlavná ulica', true,  NULL, NULL),
  ('Osvetlenie — Školská ul.',      'osvetlenie', 'Školská ulica', true, NULL, NULL),
  ('Osvetlenie — Záhradná ul.',     'osvetlenie', 'Záhradná ulica', false, NULL, NULL),
  ('Osvetlenie — Ihrisko',          'osvetlenie', 'Športový areál', true, NULL, NULL),
  ('Hladina potoka — Nitrica',      'senzor_vody', 'Potok Nitrica',   NULL, 42::float,   'cm'),
  ('Teplota — Obecný úrad',         'meteo',       'Obecný úrad',     NULL, 18.5::float, '°C'),
  ('Kontajner veľkoobjemový',       'kontajner',   'Centrum',         NULL, 65::float,   '%')
) AS s(nazov, typ, ulica, stav, posledna_hodnota, jednotka)
WHERE NOT EXISTS (SELECT 1 FROM public.obecne_zariadenia LIMIT 1);


-- ────────────────────────────────────────────────────────────────────────
-- 4. FC VÝČAPY — hráči a zápasy
-- ────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fc_hraci (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  meno text NOT NULL,
  priezvisko text NOT NULL,
  pozicia text CHECK (pozicia IN ('brankár','obranca','záložník','útočník')) NOT NULL,
  cislo_dresu int,
  foto_url text,
  je_trener boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fc_zapasy (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  datum timestamptz NOT NULL,
  supar text NOT NULL,
  je_doma boolean DEFAULT true,
  goly_my int,
  goly_supar int,
  sutaz text DEFAULT 'Oblastná liga',
  miesto text,
  futbalnet_url text DEFAULT 'https://sportnet.sme.sk/futbalnet/k/zdruzenie-fc-vycapy-opatovce/tim/dospeli-m-a/program/',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fc_hraci ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fc_zapasy ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "fc_hraci_read" ON public.fc_hraci FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "fc_zapasy_read" ON public.fc_zapasy FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Hráči seed
INSERT INTO public.fc_hraci (meno, priezvisko, pozicia, cislo_dresu, je_trener)
SELECT * FROM (VALUES
  ('Miroslav','Kováč','brankár',1,false),('Peter','Novák','obranca',4,false),
  ('Tomáš','Sloboda','obranca',5,false),('Martin','Horváth','obranca',6,false),
  ('Lukáš','Blaho','záložník',8,false),('Jakub','Mináč','záložník',10,false),
  ('Róbert','Tóth','záložník',7,false),('Marek','Sedlák','útočník',9,false),
  ('Filip','Varga','útočník',11,false),('Richard','Bella','obranca',3,false),
  ('Ondrej','Rusnák','záložník',14,false),('Štefan','Krajčí','útočník',17,false),
  ('Jozef','Baláž','brankár',12,false),('Milan','Takáč','obranca',2,false),
  ('Pavel','Holúbek','záložník',16,false),
  ('Ján','Mináč','záložník',NULL::int,true),('Igor','Blaho','záložník',NULL::int,true)
) AS s(meno, priezvisko, pozicia, cislo_dresu, je_trener)
WHERE NOT EXISTS (SELECT 1 FROM public.fc_hraci LIMIT 1);

-- Zápasy seed
INSERT INTO public.fc_zapasy (datum, supar, je_doma, goly_my, goly_supar, sutaz, miesto)
SELECT * FROM (VALUES
  ('2026-05-04 16:00+00'::timestamptz,'TJ Cabaj-Čápor',true, 3::int, 1::int,'Oblastná liga Nitra','Výčapy-Opatovce'),
  ('2026-04-27 15:00+00'::timestamptz,'FK Nová Ves nad Žitavou',false, 0, 2,'Oblastná liga Nitra','Nová Ves nad Žitavou'),
  ('2026-05-25 16:00+00'::timestamptz,'ŠK Lužianky',true, NULL::int, NULL::int,'Oblastná liga Nitra','Výčapy-Opatovce'),
  ('2026-06-01 15:00+00'::timestamptz,'FK Pohranice',false, NULL, NULL,'Oblastná liga Nitra','Pohranice'),
  ('2026-06-08 16:00+00'::timestamptz,'TJ Čechynce',true, NULL, NULL,'Oblastná liga Nitra','Výčapy-Opatovce')
) AS s(datum, supar, je_doma, goly_my, goly_supar, sutaz, miesto)
WHERE NOT EXISTS (SELECT 1 FROM public.fc_zapasy LIMIT 1);


-- ────────────────────────────────────────────────────────────────────────
-- 5. AI REFERENTKA — história konverzácií
-- ────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_konverzacie (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id text NOT NULL,
  rola text CHECK (rola IN ('user','assistant')) NOT NULL,
  obsah text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_konverzacie ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "konverzacie_insert" ON public.ai_konverzacie FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "konverzacie_read" ON public.ai_konverzacie FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ────────────────────────────────────────────────────────────────────────
-- 6. ANKETY — Wow 3
-- ────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ankety (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  otazka text NOT NULL,
  popis text,
  je_aktivna boolean DEFAULT true,
  deadline timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hlasy (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  anketa_id uuid REFERENCES public.ankety(id) ON DELETE CASCADE,
  odpoved text CHECK (odpoved IN ('pre','proti','zdrziavam')) NOT NULL,
  device_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (anketa_id, device_id)
);

ALTER TABLE public.ankety ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hlasy  ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "ankety_read"  ON public.ankety FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ankety_insert" ON public.ankety FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ankety_update" ON public.ankety FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ankety_delete" ON public.ankety FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "hlasy_read"   ON public.hlasy  FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "hlasy_insert" ON public.hlasy  FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed 3 ankety
INSERT INTO public.ankety (otazka, popis, deadline, je_aktivna)
SELECT * FROM (VALUES
  ('Súhlasíte s výstavbou novej cyklotrasy popri potoku Nitrica?',
   'Trasa by mala spájať obec s Výčapmi a Opatovcami. Predpokladaný rozpočet: 85 000 €.',
   '2026-06-30 23:59+00'::timestamptz, true),
  ('Má sa rozšíriť otváracia doba športovej haly cez víkendy?',
   'Súčasné hodiny: 8:00–22:00. Navrhujeme rozšíriť do 24:00 počas víkendov.',
   '2026-07-15 23:59+00'::timestamptz, true),
  ('Akú farbu má mať nová lavička v parku?',
   'Vyberte z troch možností. Pre = červená, Proti = zelená, Zdržiavam = zlatá.',
   NULL::timestamptz, true)
) AS s(otazka, popis, deadline, je_aktivna)
WHERE NOT EXISTS (SELECT 1 FROM public.ankety LIMIT 1);


-- ────────────────────────────────────────────────────────────────────────
-- 7. PUSH NOTIFIKÁCIE — tokens registrácia
-- ────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_tokens (
  token text PRIMARY KEY,
  platform text,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "tokens_read"   ON public.push_tokens FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "tokens_upsert" ON public.push_tokens FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "tokens_update" ON public.push_tokens FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ════════════════════════════════════════════════════════════════════════
-- GPS súradnice pre mapu obce (pridáva sa idempotentne)
-- ════════════════════════════════════════════════════════════════════════
ALTER TABLE public.hlaseniaporuchy
  ADD COLUMN IF NOT EXISTS lat numeric(9,6),
  ADD COLUMN IF NOT EXISTS lng numeric(9,6);

ALTER TABLE public.obecne_zariadenia
  ADD COLUMN IF NOT EXISTS lat numeric(9,6),
  ADD COLUMN IF NOT EXISTS lng numeric(9,6),
  ADD COLUMN IF NOT EXISTS aqi numeric(5,1),       -- European AQI 0-100+
  ADD COLUMN IF NOT EXISTS pm25 numeric(6,2),      -- µg/m³
  ADD COLUMN IF NOT EXISTS pm10 numeric(6,2),      -- µg/m³
  ADD COLUMN IF NOT EXISTS teplota numeric(4,1),   -- °C
  ADD COLUMN IF NOT EXISTS vlhkost numeric(4,1);   -- %

-- Pridať CHECK pre nový typ "meteo" — niektoré inštalácie nepodporujú CHECK,
-- preto je to defenzívne. Ak ešte nemáte typ "meteo" v dáta, môžete ho
-- doplniť ako nový riadok cez Supabase Table editor.

-- ════════════════════════════════════════════════════════════════════════
-- FARSKÉ OZNAMY — omše, smútočné, krsty, sobáše, ohlášky
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.farske_oznamy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  typ text NOT NULL CHECK (typ IN ('omsa','smutok','krst','sobas','ohlaska','oznam')),
  nazov text NOT NULL,
  popis text,
  datum_od timestamptz,
  datum_do timestamptz,
  miesto text DEFAULT 'Kostol Výčapy-Opatovce',
  je_aktivny boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS farske_oznamy_typ_idx ON public.farske_oznamy(typ);
CREATE INDEX IF NOT EXISTS farske_oznamy_datum_idx ON public.farske_oznamy(datum_od);
ALTER TABLE public.farske_oznamy ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "farske_read" ON public.farske_oznamy FOR SELECT USING (je_aktivny = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "farske_write_ins" ON public.farske_oznamy FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "farske_write_upd" ON public.farske_oznamy FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "farske_write_del" ON public.farske_oznamy FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════
-- HOTOVO! Pre kontrolu: tabuľky a buckety
SELECT 'ankety' AS t, count(*) FROM public.ankety
UNION ALL SELECT 'hlasy', count(*) FROM public.hlasy
UNION ALL SELECT 'ai_konverzacie', count(*) FROM public.ai_konverzacie
UNION ALL SELECT 'obecne_zariadenia', count(*) FROM public.obecne_zariadenia
UNION ALL SELECT 'fc_hraci', count(*) FROM public.fc_hraci
UNION ALL SELECT 'fc_zapasy', count(*) FROM public.fc_zapasy
UNION ALL SELECT 'push_tokens', count(*) FROM public.push_tokens
UNION ALL SELECT 'farske_oznamy', count(*) FROM public.farske_oznamy;
-- ════════════════════════════════════════════════════════════════════════
