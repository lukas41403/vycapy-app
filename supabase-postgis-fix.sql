-- ════════════════════════════════════════════════════════════════════════
-- 🔧 FIX: spatial_ref_sys — RLS Disabled v public schéme
-- ════════════════════════════════════════════════════════════════════════
--
-- spatial_ref_sys je PostGIS systémová tabuľka s mapovaním projekcií
-- (EPSG kódy). Obsah je verejne známy a nie je citlivý.
--
-- V Supabase ju vlastní `supabase_admin` role, preto bežný používateľ
-- nemôže ALTER TABLE ... ENABLE RLS. Skúsime 3 stratégie postupne.
-- Stačí ak prejde jedna z nich — linter bude spokojný.
--
-- Spusti v Supabase SQL editore. Ak chyby vidíš v output logu, prečítaj
-- "RAISE NOTICE" hlášky na konci.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Stratégia 1: priame ENABLE RLS ──────────────────────────────────
-- Funguje ak máš dostatočné práva. V Supabase zvyčajne NIE.
DO $$ BEGIN
  ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ Stratégia 1: RLS enabled priamo.';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠️ Stratégia 1 zlyhala: insufficient_privilege. Skúšam stratégiu 2…';
  WHEN others THEN
    RAISE NOTICE '⚠️ Stratégia 1 zlyhala: %. Skúšam stratégiu 2…', SQLERRM;
END $$;

-- ─── Stratégia 2: cez supabase_admin role (ak existuje) ──────────────
-- Niektoré Supabase projekty dovoľujú prepnúť role.
DO $$ BEGIN
  SET LOCAL ROLE supabase_admin;
  ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "spatial_ref_sys_read_public" ON public.spatial_ref_sys
    FOR SELECT USING (true);
  RESET ROLE;
  RAISE NOTICE '✅ Stratégia 2: RLS enabled cez supabase_admin role.';
EXCEPTION
  WHEN insufficient_privilege THEN
    BEGIN RESET ROLE; EXCEPTION WHEN others THEN NULL; END;
    RAISE NOTICE '⚠️ Stratégia 2 zlyhala. Skúšam stratégiu 3…';
  WHEN invalid_parameter_value THEN
    BEGIN RESET ROLE; EXCEPTION WHEN others THEN NULL; END;
    RAISE NOTICE '⚠️ Stratégia 2: supabase_admin role neexistuje. Skúšam stratégiu 3…';
  WHEN others THEN
    BEGIN RESET ROLE; EXCEPTION WHEN others THEN NULL; END;
    RAISE NOTICE '⚠️ Stratégia 2 zlyhala: %. Skúšam stratégiu 3…', SQLERRM;
END $$;

-- ─── Stratégia 3: postgres role ──────────────────────────────────────
DO $$ BEGIN
  SET LOCAL ROLE postgres;
  ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "spatial_ref_sys_read_public" ON public.spatial_ref_sys
    FOR SELECT USING (true);
  RESET ROLE;
  RAISE NOTICE '✅ Stratégia 3: RLS enabled cez postgres role.';
EXCEPTION
  WHEN duplicate_object THEN
    BEGIN RESET ROLE; EXCEPTION WHEN others THEN NULL; END;
    RAISE NOTICE 'ℹ️ Policy už existuje (predošlá stratégia bola úspešná).';
  WHEN insufficient_privilege THEN
    BEGIN RESET ROLE; EXCEPTION WHEN others THEN NULL; END;
    RAISE NOTICE '⚠️ Stratégia 3 tiež zlyhala. Pozri inštrukcie nižšie.';
  WHEN others THEN
    BEGIN RESET ROLE; EXCEPTION WHEN others THEN NULL; END;
    RAISE NOTICE '⚠️ Stratégia 3 zlyhala: %. Pozri inštrukcie nižšie.', SQLERRM;
END $$;

-- ─── Verifikácia ─────────────────────────────────────────────────────
DO $$
DECLARE rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE oid = 'public.spatial_ref_sys'::regclass;

  IF rls_enabled THEN
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ HOTOVO: spatial_ref_sys má RLS enabled.';
    RAISE NOTICE '════════════════════════════════════════════════════════';
  ELSE
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '⚠️ SQL fix nezabral. Skús cez Supabase Dashboard:';
    RAISE NOTICE '   1. https://supabase.com/dashboard/project/_/database/tables';
    RAISE NOTICE '   2. Vyber public → spatial_ref_sys';
    RAISE NOTICE '   3. Klikni "Enable RLS"';
    RAISE NOTICE '';
    RAISE NOTICE 'Ak nepomôže ani Dashboard, je to akceptovateľné varovanie:';
    RAISE NOTICE 'spatial_ref_sys obsahuje VEREJNE ZNÁME EPSG kódy projekcií,';
    RAISE NOTICE 'žiadne citlivé dáta. Linter je tu prísnejší než reálna hrozba.';
    RAISE NOTICE '════════════════════════════════════════════════════════';
  END IF;
END $$;
