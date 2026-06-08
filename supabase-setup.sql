-- ════════════════════════════════════════════════════════════════════════
--  Výčapy-Opatovce obecná appka — kompletný setup
--  Spusti všetko v Supabase SQL Editore (https://hionzftqhnxfqcegsnaj.supabase.co)
--  Každý blok môžeš spustiť samostatne; všetky používajú IF NOT EXISTS / ON CONFLICT.
--
--  ⚠️  Po spustení tohto skriptu spustite aj `supabase-security-fixes.sql`
--      ktorý opraví RLS policies podľa Supabase Database Linter odporúčaní.
-- ════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────
-- 0. ZÁKLADNÉ TABUĽKY — kompletný setup pre nasadenie pre novú obec
-- ────────────────────────────────────────────────────────────────────────

-- AKTUALITY
CREATE TABLE IF NOT EXISTS public.aktuality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  perex text,
  body text NOT NULL,
  kategoria text NOT NULL DEFAULT 'oznam'
    CHECK (kategoria IN ('oznam','akcia','uzavierka','vypadok','sport','ine')),
  cover_url text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);
-- Ak tabuľka už existovala bez týchto stĺpcov, doplníme:
ALTER TABLE public.aktuality
  ADD COLUMN IF NOT EXISTS perex text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS kategoria text DEFAULT 'oznam';

-- Zaistíme správny check constraint na kategoria
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

ALTER TABLE public.aktuality
  ADD CONSTRAINT aktuality_kategoria_check
  CHECK (kategoria IN ('oznam','akcia','uzavierka','vypadok','sport','ine'));

CREATE INDEX IF NOT EXISTS aktuality_published_idx ON public.aktuality(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS aktuality_kategoria_idx ON public.aktuality(kategoria);
ALTER TABLE public.aktuality ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "aktuality_read_public" ON public.aktuality
    FOR SELECT USING (is_published = true AND (published_at IS NULL OR published_at <= now()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PODUJATIA
CREATE TABLE IF NOT EXISTS public.podujatia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  popis text,
  kategoria text NOT NULL DEFAULT 'ine'
    CHECK (kategoria IN ('kultura','sport','slavnost','kino','divadlo','deti','ine')),
  datum_od timestamptz NOT NULL,
  datum_do timestamptz,
  miesto text,
  obrazok_url text,
  is_published boolean DEFAULT true,
  publish_at timestamptz,
  created_at timestamptz DEFAULT now()
);
-- Ak tabuľka už existovala bez týchto stĺpcov (vytvorená ručne skôr), doplníme:
ALTER TABLE public.podujatia
  ADD COLUMN IF NOT EXISTS publish_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS obrazok_url text,
  ADD COLUMN IF NOT EXISTS popis text,
  ADD COLUMN IF NOT EXISTS miesto text,
  ADD COLUMN IF NOT EXISTS datum_do timestamptz;

-- Zaistíme správny check constraint na kategoria
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

ALTER TABLE public.podujatia
  ADD CONSTRAINT podujatia_kategoria_check
  CHECK (kategoria IN ('kultura','sport','slavnost','kino','divadlo','deti','ine'));

CREATE INDEX IF NOT EXISTS podujatia_datum_od_idx ON public.podujatia(datum_od);
CREATE INDEX IF NOT EXISTS podujatia_published_idx ON public.podujatia(is_published);
ALTER TABLE public.podujatia ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "podujatia_read_public" ON public.podujatia
    FOR SELECT USING (
      is_published = true
      AND (publish_at IS NULL OR publish_at <= now())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- HLÁSENIA PORÚCH (Podnety občanov)
CREATE TABLE IF NOT EXISTS public.hlaseniaporuchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kategoria text NOT NULL,
  popis text NOT NULL,
  adresa text,
  foto_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'nove'
    CHECK (status IN ('nove','v_rieseni','vyriesene','zamietnute')),
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz DEFAULT now()
);
-- Doplnenie chýbajúcich stĺpcov ak tabuľka existovala:
ALTER TABLE public.hlaseniaporuchy
  ADD COLUMN IF NOT EXISTS adresa text,
  ADD COLUMN IF NOT EXISTS foto_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'nove',
  ADD COLUMN IF NOT EXISTS lat numeric(9,6),
  ADD COLUMN IF NOT EXISTS lng numeric(9,6);

-- Zaistíme správny check constraint na status
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

ALTER TABLE public.hlaseniaporuchy
  ADD CONSTRAINT hlaseniaporuchy_status_check
  CHECK (status IN ('nove','v_rieseni','vyriesene','zamietnute'));

CREATE INDEX IF NOT EXISTS hlasenia_status_idx ON public.hlaseniaporuchy(status);
CREATE INDEX IF NOT EXISTS hlasenia_created_idx ON public.hlaseniaporuchy(created_at DESC);
ALTER TABLE public.hlaseniaporuchy ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "hlasenia_read_public" ON public.hlaseniaporuchy FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- HLÁSENIA HISTÓRIA (audit log zmien)
CREATE TABLE IF NOT EXISTS public.hlasenia_historia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hlasenie_id uuid REFERENCES public.hlaseniaporuchy(id) ON DELETE CASCADE,
  stary_status text,
  novy_status text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS historia_hlasenie_idx ON public.hlasenia_historia(hlasenie_id);
ALTER TABLE public.hlasenia_historia ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "historia_read_public" ON public.hlasenia_historia FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PRENÁJOM HALY
CREATE TABLE IF NOT EXISTS public.prenajom_haly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meno text NOT NULL,
  email text NOT NULL,
  telefon text NOT NULL,
  datum date NOT NULL,
  cas_od text NOT NULL,
  cas_do text NOT NULL,
  ucel text NOT NULL DEFAULT 'ine',
  pocet_osob int,
  poznamka text,
  status text DEFAULT 'nove' CHECK (status IN ('nove','schvalene','zamietnute')),
  created_at timestamptz DEFAULT now()
);
-- Doplnenie chýbajúcich stĺpcov:
ALTER TABLE public.prenajom_haly
  ADD COLUMN IF NOT EXISTS pocet_osob int,
  ADD COLUMN IF NOT EXISTS poznamka text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'nove';

-- Zaistíme správny check constraint na status (ak existoval starý so zlými hodnotami, dropneme)
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

ALTER TABLE public.prenajom_haly
  ADD CONSTRAINT prenajom_haly_status_check
  CHECK (status IN ('nove','schvalene','zamietnute'));

CREATE INDEX IF NOT EXISTS prenajom_datum_idx ON public.prenajom_haly(datum);
CREATE INDEX IF NOT EXISTS prenajom_status_idx ON public.prenajom_haly(status);
ALTER TABLE public.prenajom_haly ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "prenajom_read_public" ON public.prenajom_haly FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket pre fotky podnetov
INSERT INTO storage.buckets (id, name, public)
VALUES ('hlaseniafotos', 'hlaseniafotos', true) ON CONFLICT DO NOTHING;
DO $$ BEGIN
  CREATE POLICY "hlasenia_storage_upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'hlaseniafotos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "hlasenia_storage_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'hlaseniafotos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket pre cover fotky aktualít
INSERT INTO storage.buckets (id, name, public)
VALUES ('aktuality-covers', 'aktuality-covers', true) ON CONFLICT DO NOTHING;

-- ODPADY — typy odpadu a vývozný kalendár
CREATE TABLE IF NOT EXISTS public.odpady_typy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kod text UNIQUE,
  nazov text NOT NULL,
  farba text NOT NULL DEFAULT '#888888',
  ikona text
);
-- Ak tabuľka existovala bez kod, doplníme
ALTER TABLE public.odpady_typy
  ADD COLUMN IF NOT EXISTS kod text,
  ADD COLUMN IF NOT EXISTS farba text DEFAULT '#888888',
  ADD COLUMN IF NOT EXISTS ikona text;
-- Pridáme UNIQUE constraint na kod ak ešte nie je
DO $$ BEGIN
  ALTER TABLE public.odpady_typy ADD CONSTRAINT odpady_typy_kod_unique UNIQUE (kod);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.odpady_kalendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  typ_id uuid REFERENCES public.odpady_typy(id) ON DELETE CASCADE,
  datum date NOT NULL,
  poznamka text,
  created_at timestamptz DEFAULT now()
);
-- Pre prípad existujúcej tabuľky doplníme:
ALTER TABLE public.odpady_kalendar
  ADD COLUMN IF NOT EXISTS typ_id uuid,
  ADD COLUMN IF NOT EXISTS poznamka text;

CREATE INDEX IF NOT EXISTS odpady_kalendar_datum_idx ON public.odpady_kalendar(datum);

ALTER TABLE public.odpady_typy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odpady_kalendar ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "odpady_typy_read_public" ON public.odpady_typy FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "odpady_kalendar_read_public" ON public.odpady_kalendar FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
-- MULTI-TENANT — tabuľka obcí (príprava pre nasadenie pre viac obcí)
-- ════════════════════════════════════════════════════════════════════════
-- V budúcnosti môžeš tenant config presunúť z `src/config/tenant.ts` sem.
-- Pre 1 obec je to nepotrebné (defaultný tenant v kóde stačí).
CREATE TABLE IF NOT EXISTS public.obce (
  id text PRIMARY KEY,              -- 'vycapy-opatovce'
  nazov text NOT NULL,              -- 'Výčapy-Opatovce'
  primary_color text DEFAULT '#C62828',
  config_json jsonb,                -- celý Tenant objekt v JSON
  je_aktivny boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.obce ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "obce_read_public" ON public.obce
    FOR SELECT USING (je_aktivny = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "obce_write_admin" ON public.obce
    FOR ALL TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL)
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed: registrácia Výčap-Opatoviec v tabuľke obcí (idempotent)
INSERT INTO public.obce (id, nazov, primary_color)
VALUES ('vycapy-opatovce', 'Výčapy-Opatovce', '#C62828')
ON CONFLICT (id) DO NOTHING;

-- Multi-tenant column na všetkých dátových tabuľkách (pripravené pre fázu 2)
-- Defaultne 'vycapy-opatovce', neskôr môžeš filtrovať podľa obec_id.
ALTER TABLE public.aktuality        ADD COLUMN IF NOT EXISTS obec_id text REFERENCES public.obce(id) DEFAULT 'vycapy-opatovce';
ALTER TABLE public.podujatia        ADD COLUMN IF NOT EXISTS obec_id text REFERENCES public.obce(id) DEFAULT 'vycapy-opatovce';
ALTER TABLE public.hlaseniaporuchy  ADD COLUMN IF NOT EXISTS obec_id text REFERENCES public.obce(id) DEFAULT 'vycapy-opatovce';
ALTER TABLE public.prenajom_haly    ADD COLUMN IF NOT EXISTS obec_id text REFERENCES public.obce(id) DEFAULT 'vycapy-opatovce';
ALTER TABLE public.farske_oznamy    ADD COLUMN IF NOT EXISTS obec_id text REFERENCES public.obce(id) DEFAULT 'vycapy-opatovce';
ALTER TABLE public.ankety           ADD COLUMN IF NOT EXISTS obec_id text REFERENCES public.obce(id) DEFAULT 'vycapy-opatovce';
ALTER TABLE public.susedsky_predaj  ADD COLUMN IF NOT EXISTS obec_id text REFERENCES public.obce(id) DEFAULT 'vycapy-opatovce';

-- ════════════════════════════════════════════════════════════════════════
-- MARTA RATE LIMIT — pre Edge Function (max 10 dotazov/min/IP)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.marta_rate_limit (
  identifier text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  pocet int NOT NULL DEFAULT 1
);
-- Cleanup starých záznamov — bežne starší ako 5 min môžeme dropnúť
-- Spustite raz za hodinu cez pg_cron alebo manuálne:
--   DELETE FROM public.marta_rate_limit WHERE window_start < now() - interval '5 minutes';

ALTER TABLE public.marta_rate_limit ENABLE ROW LEVEL SECURITY;
-- iba service_role (Edge Function) má prístup — žiadne policies pre anon/authenticated

-- ════════════════════════════════════════════════════════════════════════
-- RSS SYNC METADATA — pre integráciu s WebyGroup CMS
-- ════════════════════════════════════════════════════════════════════════
-- Stĺpce ktoré dovolia rozlíšiť obsah pochádzajúci z RSS feedu obce
-- (https://vycapy-opatovce.sk/get_rss.php?id=…) od manuálne vytvoreného
-- obsahu v admin paneli appky.
--
-- - external_id : URL alebo GUID z RSS položky (unique)
-- - source      : 'manual' | 'webygroup' | 'import'
-- - synced_at   : kedy bol naposledy sync z externého zdroja

ALTER TABLE public.aktuality
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS aktuality_external_id_unique
  ON public.aktuality (external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.podujatia
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS podujatia_external_id_unique
  ON public.podujatia (external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.farske_oznamy
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS synced_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS farske_oznamy_external_id_unique
  ON public.farske_oznamy (external_id) WHERE external_id IS NOT NULL;

-- Tabuľka histórie sync behov (pre admin UI "Posledná synchronizácia")
CREATE TABLE IF NOT EXISTS public.rss_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_url text NOT NULL,
  feed_kind text,                    -- 'aktuality' | 'podujatia' | 'farske_oznamy' | 'odpady'
  pocet_novych int DEFAULT 0,
  pocet_aktualizovanych int DEFAULT 0,
  pocet_chyba int DEFAULT 0,
  trvanie_ms int,
  chyba text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rss_sync_log_created_idx ON public.rss_sync_log(created_at DESC);
ALTER TABLE public.rss_sync_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "rss_sync_log_read_admin" ON public.rss_sync_log
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
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
-- Plánované publikovanie podujatí (publish_at — kedy zverejniť na verejnosti)
-- Pre aktuality používame existujúci stĺpec published_at.
-- ════════════════════════════════════════════════════════════════════════
ALTER TABLE public.podujatia
  ADD COLUMN IF NOT EXISTS publish_at timestamptz;
CREATE INDEX IF NOT EXISTS podujatia_publish_at_idx ON public.podujatia(publish_at);

-- ════════════════════════════════════════════════════════════════════════
-- SUSEDSKÝ PREDAJ — bazár medzi občanmi obce
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.susedsky_predaj (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  typ text NOT NULL CHECK (typ IN ('predam', 'kupim', 'zadarmo', 'hladam')),
  kategoria text NOT NULL,
  nazov text NOT NULL,
  popis text,
  cena numeric(10, 2),                  -- NULL pre "zadarmo" alebo "kupim"
  mena text DEFAULT 'EUR',
  foto_urls text[] DEFAULT '{}',
  meno text NOT NULL,                   -- meno alebo prezývka občana
  telefon text,                          -- aspoň jedno z telefon/email
  email text,
  stav text NOT NULL DEFAULT 'aktivny'
    CHECK (stav IN ('aktivny', 'rezervovane', 'predane', 'zamietnute', 'expirovany')),
  je_schvaleny boolean DEFAULT true,    -- false = čaká na admin schválenie (opt-in moderation)
  expiruje_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sp_typ_idx        ON public.susedsky_predaj(typ);
CREATE INDEX IF NOT EXISTS sp_kategoria_idx  ON public.susedsky_predaj(kategoria);
CREATE INDEX IF NOT EXISTS sp_stav_idx       ON public.susedsky_predaj(stav);
CREATE INDEX IF NOT EXISTS sp_expiruje_idx   ON public.susedsky_predaj(expiruje_at);

ALTER TABLE public.susedsky_predaj ENABLE ROW LEVEL SECURITY;

-- Čítanie: verejné, ale len aktívne a schválené a neexpirované
DO $$ BEGIN
  CREATE POLICY "sp_read_public" ON public.susedsky_predaj
    FOR SELECT USING (
      je_schvaleny = true
      AND stav IN ('aktivny', 'rezervovane')
      AND (expiruje_at IS NULL OR expiruje_at > now())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vkladanie: každý občan (anon) môže pridať s validovanými dátami
DO $$ BEGIN
  CREATE POLICY "sp_insert_validated" ON public.susedsky_predaj
    FOR INSERT TO anon, authenticated
    WITH CHECK (
      length(nazov) BETWEEN 3 AND 100
      AND length(coalesce(popis, '')) BETWEEN 0 AND 2000
      AND length(meno) BETWEEN 2 AND 50
      AND (length(coalesce(telefon, '')) >= 6 OR length(coalesce(email, '')) >= 5)
      AND stav = 'aktivny'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin (authenticated) môže UPDATE / DELETE
DO $$ BEGIN
  CREATE POLICY "sp_update_admin" ON public.susedsky_predaj
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL)
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "sp_delete_admin" ON public.susedsky_predaj
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket pre fotky inzerátov
INSERT INTO storage.buckets (id, name, public)
VALUES ('susedsky-predaj', 'susedsky-predaj', true) ON CONFLICT DO NOTHING;
DO $$ BEGIN
  CREATE POLICY "sp_storage_upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'susedsky-predaj');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "sp_storage_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'susedsky-predaj');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
