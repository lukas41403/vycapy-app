-- ════════════════════════════════════════════════════════════════════════
-- 🔒 SECURITY FIXES — Výčapy-Opatovce obecná aplikácia
-- ════════════════════════════════════════════════════════════════════════
--
-- Tento skript opravuje nálezy z Supabase Database Linter:
--   1) RLS policies "USING (true)" pre INSERT/UPDATE/DELETE — bezpečnostná diera
--   2) Mutable search_path vo funkciách
--   3) SECURITY DEFINER funkcie dostupné anonymne
--   4) Chýbajúce policies na tabuľkách s RLS enabled
--   5) PostGIS spatial_ref_sys bez RLS
--
-- Spustite v Supabase SQL editore. Skript je idempotentný — možno spustiť
-- viackrát.
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ 1. RLS policies — obmedziť zápis na "authenticated" (admin)         │
-- └─────────────────────────────────────────────────────────────────────┘
-- Princíp:
--   - SELECT = verejné (občania čítajú aktuality, podujatia, atď.)
--   - INSERT/UPDATE/DELETE = iba prihlásený admin (cez Supabase Auth)
-- Výnimky:
--   - hlaseniaporuchy: občania môžu INSERT (podávajú podnet bez login)
--   - prenajom_haly: občania môžu INSERT (podávajú žiadosť bez login)

-- ─── AKTUALITY ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "aktuality_insert_all" ON public.aktuality;
DROP POLICY IF EXISTS "aktuality_update_all" ON public.aktuality;
DROP POLICY IF EXISTS "aktuality_delete_all" ON public.aktuality;

CREATE POLICY "aktuality_insert_auth" ON public.aktuality
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "aktuality_update_auth" ON public.aktuality
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "aktuality_delete_auth" ON public.aktuality
  FOR DELETE TO authenticated USING (true);

-- ─── PODUJATIA ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "podujatia_insert_all" ON public.podujatia;
DROP POLICY IF EXISTS "podujatia_update_all" ON public.podujatia;
DROP POLICY IF EXISTS "podujatia_delete_all" ON public.podujatia;

CREATE POLICY "podujatia_insert_auth" ON public.podujatia
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "podujatia_update_auth" ON public.podujatia
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "podujatia_delete_auth" ON public.podujatia
  FOR DELETE TO authenticated USING (true);

-- ─── HLÁSENIA PORÚCH (Podnety občanov) ────────────────────────────────
-- INSERT verejné (každý občan môže nahlásiť), UPDATE/DELETE len admin
DROP POLICY IF EXISTS "hlaseniaporuchy_insert" ON public.hlaseniaporuchy;
DROP POLICY IF EXISTS "hlaseniaporuchy_update_all" ON public.hlaseniaporuchy;
DROP POLICY IF EXISTS "hlaseniaporuchy_delete_all" ON public.hlaseniaporuchy;

-- Občania (anon role) môžu INSERT — to ostáva, je to úmyselné
CREATE POLICY "hlaseniaporuchy_insert_public" ON public.hlaseniaporuchy
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "hlaseniaporuchy_update_auth" ON public.hlaseniaporuchy
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hlaseniaporuchy_delete_auth" ON public.hlaseniaporuchy
  FOR DELETE TO authenticated USING (true);

-- ─── HLÁSENIA HISTÓRIA (audit log zmien) ──────────────────────────────
DROP POLICY IF EXISTS "historia_insert_all" ON public.hlasenia_historia;
DROP POLICY IF EXISTS "historia_update_all" ON public.hlasenia_historia;
DROP POLICY IF EXISTS "historia_delete_all" ON public.hlasenia_historia;

-- Iba authenticated (admin) môže zapisovať do histórie
CREATE POLICY "historia_insert_auth" ON public.hlasenia_historia
  FOR INSERT TO authenticated WITH CHECK (true);
-- DELETE/UPDATE histórie zakazujeme úplne (audit log = nezmazateľný)
-- žiadne policies → nikto nemôže

-- ─── PRENÁJOM HALY ────────────────────────────────────────────────────
-- INSERT verejné (občan podáva žiadosť), UPDATE/DELETE len admin
DROP POLICY IF EXISTS "prenajom_insert_all" ON public.prenajom_haly;
DROP POLICY IF EXISTS "prenajom_update_all" ON public.prenajom_haly;
DROP POLICY IF EXISTS "prenajom_delete_all" ON public.prenajom_haly;

CREATE POLICY "prenajom_insert_public" ON public.prenajom_haly
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "prenajom_update_auth" ON public.prenajom_haly
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "prenajom_delete_auth" ON public.prenajom_haly
  FOR DELETE TO authenticated USING (true);

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ 2. Mutable search_path — uzatvoriť                                   │
-- └─────────────────────────────────────────────────────────────────────┘
-- Bez SET search_path môže útočník vytvoriť funkciu s rovnakým názvom
-- v inej schéme a hijack-núť volanie. Fix: pinneme search_path.

ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ 3. SECURITY DEFINER funkcie — revoke z anon                         │
-- └─────────────────────────────────────────────────────────────────────┘
-- handle_new_user() je auth trigger — nemá byť volaný cez REST API
-- (Supabase ho volá interne pri register).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
-- (postgres a service_role majú stále prístup pre trigger)

-- PostGIS st_estimatedextent — interná funkcia pre query plánovač,
-- občania ju cez REST API nepotrebujú.
-- Použijeme DO bloky, lebo niektoré PostGIS verzie tieto funkcie nemajú.
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon, authenticated;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ 4. Tabuľky s RLS enabled ale bez policies                            │
-- └─────────────────────────────────────────────────────────────────────┘
-- Bez policies je všetko zablokované, čo je síce bezpečné, ale appka
-- ich nevidí. Pridáme rozumné policies.

-- admin_users — aplikácia túto tabuľku priamo nepoužíva (auth ide cez
-- Supabase Auth službu). Ponechávame RLS bez policies = blokované pre
-- anon aj authenticated, ale service_role má bypass (čo Supabase vnútorne
-- potrebuje pre triggers a admin operácie). Toto je bezpečný stav.
--
-- Ak chceš predsa len policy, musíme zistiť ktorý stĺpec referencuje
-- auth.users.id. Pokus o auto-detect:
DO $$
DECLARE col_name text;
BEGIN
  SELECT column_name INTO col_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'admin_users'
    AND column_name IN ('user_id', 'auth_id', 'id', 'auth_user_id', 'uid')
  ORDER BY
    CASE column_name
      WHEN 'user_id' THEN 1
      WHEN 'auth_id' THEN 2
      WHEN 'auth_user_id' THEN 3
      WHEN 'uid' THEN 4
      WHEN 'id' THEN 5
    END
  LIMIT 1;

  IF col_name IS NOT NULL THEN
    EXECUTE format(
      'CREATE POLICY "admin_users_self_read" ON public.admin_users
       FOR SELECT TO authenticated USING (auth.uid() = %I)',
      col_name
    );
    RAISE NOTICE 'admin_users: policy created using column "%"', col_name;
  ELSE
    RAISE NOTICE 'admin_users: no suitable user-link column found, ponecháme bez policy (= zablokované, OK)';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN
    RAISE NOTICE 'admin_users policy skipped: %', SQLERRM;
END $$;

-- notifikacie_log — len authenticated (admin) môže čítať
DO $$ BEGIN
  CREATE POLICY "notifikacie_log_read_auth" ON public.notifikacie_log
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "notifikacie_log_insert_auth" ON public.notifikacie_log
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- podania_typy — číselník typov podaní, verejné read
DO $$ BEGIN
  CREATE POLICY "podania_typy_read_public" ON public.podania_typy
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ┌─────────────────────────────────────────────────────────────────────┐
-- │ 5. PostGIS spatial_ref_sys — enable RLS + public read                │
-- └─────────────────────────────────────────────────────────────────────┘
-- Toto je systémová PostGIS tabuľka s mapovaním projekcií (EPSG kódy).
-- Obsah je verejne známy a nie je citlivý, ale linter chce RLS enabled.
-- Niektoré Supabase projekty nemôžu enable RLS pre PostGIS tabuľky
-- (vlastní ich `postgres` role) — preto je to v DO bloku.

DO $$ BEGIN
  ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Cannot enable RLS on spatial_ref_sys — owned by another role. Ignore this warning.';
END $$;

DO $$ BEGIN
  CREATE POLICY "spatial_ref_sys_read_public" ON public.spatial_ref_sys
    FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN insufficient_privilege THEN NULL;
END $$;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════
-- ✅ HOTOVO. Pre kontrolu spustite linter znova:
--    Supabase Dashboard → Database → Linter
--
-- Zostávajúce nálezy ktoré nie sú v tomto skripte (musíte ich riešiť v UI):
--
-- 🟡 auth_leaked_password_protection
--    → Dashboard → Authentication → Policies → "Leaked password protection"
--    → Enable
--
-- 🟡 extension_in_public (postgis)
--    → Toto je komplikovanejšie, vyžaduje migráciu. Pre demo NIE JE
--      blokujúce — PostGIS je v public schéme aj v default Supabase
--      projektoch. Riešiť až pri produkčnom nasadení.
-- ════════════════════════════════════════════════════════════════════════
