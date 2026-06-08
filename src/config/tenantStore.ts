/**
 * Multi-tenant store — vyber aktívnu obec.
 *
 * Architektúra:
 *   - **Build-time:** appka má v `tenant.ts` jeden default Tenant (Výčapy-Opatovce)
 *   - **Runtime:** po prvom spustení appky sa môže obec načítať zo Supabase
 *     tabuľky `obce`, alebo ostane defaultná
 *   - **Voľba:** ak nasadiš jeden APK pre viac obcí, urobíš pri prvom
 *     spustení obrazovku výberu obce — vybraná obec sa uloží do AsyncStorage
 *
 * Pre **dnešok** používame iba defaultný tenant (Výčapy-Opatovce).
 * Multi-tenant store je pripravený pre fázu 2 — keď budeš mať druhú obec.
 *
 * Použitie v appke nemení sa:
 *   const tenant = useTenant()   // hook vráti aktuálne aktívnu obec
 */

import { getTenant, Tenant, vycapyOpatovce } from './tenant'

// Defenzívny AsyncStorage — ak balík nie je inštalovaný, fallback in-memory
let AsyncStorage: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AsyncStorage = require('@react-native-async-storage/async-storage').default
} catch {
  AsyncStorage = null
}

const STORAGE_KEY = 'tenant_active_id_v1'

// ─── Lokálny register tenantov ────────────────────────────────────────────
// Pre nasadenie pre viac obcí pridáš sem ďalšie Tenant objekty (alebo si
// ich budeš ťahať dynamicky zo Supabase tabuľky `obce`).
const TENANT_REGISTRY: Record<string, Tenant> = {
  [vycapyOpatovce.id]: vycapyOpatovce,
  // 'velky-kyr': velkyKyr,
  // 'lefantovce': lefantovce,
}

// ─── Module-level state ───────────────────────────────────────────────────
let activeTenant: Tenant = vycapyOpatovce
const subscribers = new Set<(t: Tenant) => void>()

function notify() {
  subscribers.forEach(fn => fn(activeTenant))
}

// ─── Public API ───────────────────────────────────────────────────────────

/** Vráti aktuálne aktívnu obec. */
export function getActiveTenant(): Tenant {
  return activeTenant
}

/** Vráti zoznam všetkých dostupných obcí (build-time registry). */
export function listAvailableTenants(): Tenant[] {
  return Object.values(TENANT_REGISTRY)
}

/** Nastav aktívny tenant podľa ID. */
export async function setActiveTenant(tenantId: string): Promise<boolean> {
  const t = TENANT_REGISTRY[tenantId]
  if (!t) return false
  activeTenant = t
  notify()
  if (AsyncStorage) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, tenantId)
    } catch {
      // ignore
    }
  }
  return true
}

/**
 * Inicializácia — volaj raz pri starte appky.
 * Načíta uloženú voľbu z AsyncStorage a aktivuje ju.
 */
export async function initTenantStore(): Promise<Tenant> {
  if (!AsyncStorage) return activeTenant
  try {
    const id = await AsyncStorage.getItem(STORAGE_KEY)
    if (id && TENANT_REGISTRY[id]) {
      activeTenant = TENANT_REGISTRY[id]
      notify()
    }
  } catch {
    // ignore
  }
  return activeTenant
}

/** Subscribe na zmeny aktívneho tenantu — pre React Context provider. */
export function subscribeTenant(callback: (t: Tenant) => void): () => void {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

// ─── DB-driven tenant loading (future) ────────────────────────────────────
//
// Keď budeš mať vlastnú SaaS infraštruktúru, môžeš tenant config presunúť
// do Supabase tabuľky `obce`:
//
//   CREATE TABLE obce (
//     id text PRIMARY KEY,
//     nazov text NOT NULL,
//     primary_color text NOT NULL,
//     config_json jsonb NOT NULL,  -- celý Tenant objekt
//     je_aktivny boolean DEFAULT true,
//     created_at timestamptz DEFAULT now()
//   );
//
// Potom by si tu pridal funkciu:
//
//   export async function loadTenantsFromDb(supabase) {
//     const { data } = await supabase.from('obce').select('*').eq('je_aktivny', true)
//     data?.forEach(row => {
//       TENANT_REGISTRY[row.id] = row.config_json as Tenant
//     })
//   }

// ─── Default export pre okamžité použitie ─────────────────────────────────
// Zachováva existujúce `getTenant()` API.
export { getTenant, vycapyOpatovce }
