/**
 * Icon — jednotný icon systém aplikácie.
 *
 * Pravidlo: žiadne emoji ako ikony v UI. Vždy cez <Icon name="..." />.
 * Tým získame konzistentný vzhľad naprieč platformami (emoji vyzerajú
 * na každom zariadení inak), jednotnú hrúbku ťahu a ovládateľnú farbu/veľkosť.
 *
 * Primárna sada: **Ionicons** (čisté, ladia s iOS aj Androidom).
 * Pre pár špecializovaných glyphov, ktoré Ionicons nemá (počasie),
 * sa interne použije MaterialCommunityIcons — volajúci to nerieši,
 * stačí sémantický `name`.
 *
 * Použitie:
 *   <Icon name="domov" />
 *   <Icon name="hlasenie" size={28} color={t.primary} />
 *   <Icon name="domov" variant="outline" />   // pre neaktívny tab
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { ComponentProps } from 'react'
import { useThemeColors } from '@/src/theme/ThemeContext'

type IonName = ComponentProps<typeof Ionicons>['name']
type MciName = ComponentProps<typeof MaterialCommunityIcons>['name']

type IconDef =
  | { lib: 'ion'; glyph: IonName; outline?: IonName }
  | { lib: 'mci'; glyph: MciName; outline?: MciName }

const ion = (glyph: IonName, outline?: IonName): IconDef => ({ lib: 'ion', glyph, outline })
const mci = (glyph: MciName, outline?: MciName): IconDef => ({ lib: 'mci', glyph, outline })

/**
 * Sémantická mapa: koncept appky → glyph.
 * Filled je default; `outline` sa použije pri variant="outline"
 * (typicky neaktívny tab). Kde outline chýba, padne späť na filled.
 */
const ICONS = {
  // ── Navigácia / hlavné sekcie ──────────────────────────────
  domov:       ion('home', 'home-outline'),
  aktuality:   ion('newspaper', 'newspaper-outline'),
  odpady:      ion('trash-bin', 'trash-bin-outline'),
  viac:        ion('grid', 'grid-outline'),

  // ── Funkcie obce ───────────────────────────────────────────
  hlasenie:    ion('alert-circle', 'alert-circle-outline'),
  podujatia:   ion('calendar', 'calendar-outline'),
  prenajom:    ion('basketball', 'basketball-outline'),
  kontakty:    ion('call', 'call-outline'),
  marta:       ion('chatbubble-ellipses', 'chatbubble-ellipses-outline'),
  pocasie:     ion('partly-sunny', 'partly-sunny-outline'),
  cestovny:    ion('bus', 'bus-outline'),
  sluzby:      ion('medkit', 'medkit-outline'),
  farske:      ion('megaphone', 'megaphone-outline'),
  okolie:      ion('compass', 'compass-outline'),
  fc:          ion('football', 'football-outline'),
  ankety:      ion('bar-chart', 'bar-chart-outline'),
  senior:      ion('accessibility', 'accessibility-outline'),
  spravaObce:  ion('bulb', 'bulb-outline'),
  mapa:        ion('map', 'map-outline'),
  admin:       ion('lock-closed', 'lock-closed-outline'),
  meteo:       ion('thermometer', 'thermometer-outline'),

  // ── UI / utility ───────────────────────────────────────────
  chevron:       ion('chevron-forward'),
  chevronBack:   ion('chevron-back'),
  close:         ion('close'),
  check:         ion('checkmark'),
  checkCircle:   ion('checkmark-circle', 'checkmark-circle-outline'),
  arrowRight:    ion('arrow-forward'),
  refresh:       ion('refresh'),
  location:      ion('location', 'location-outline'),
  time:          ion('time', 'time-outline'),
  info:          ion('information-circle', 'information-circle-outline'),
  search:        ion('search'),
  add:           ion('add'),
  ellipsis:      ion('ellipsis-horizontal'),
  list:          ion('list'),
  grid:          ion('grid', 'grid-outline'),
  film:          ion('film', 'film-outline'),
  music:         ion('musical-notes', 'musical-notes-outline'),
  happy:         ion('happy', 'happy-outline'),
  theater:       ion('sparkles'),
  ticket:        ion('ticket', 'ticket-outline'),
  document:      ion('document-text', 'document-text-outline'),
  send:          ion('send'),
  camera:        ion('camera', 'camera-outline'),
  trophy:        ion('trophy', 'trophy-outline'),
  shield:        ion('shield-checkmark', 'shield-checkmark-outline'),
  bookmark:      ion('bookmark', 'bookmark-outline'),
  share:         ion('share-social', 'share-social-outline'),
  star:          ion('star', 'star-outline'),
  globe:         ion('globe', 'globe-outline'),
  flash:         ion('flash', 'flash-outline'),
  water:         ion('water', 'water-outline'),
  leaf:          ion('leaf', 'leaf-outline'),
  image:         ion('image', 'image-outline'),
  bus2:          ion('bus'),
  construct:     ion('construct', 'construct-outline'),
  bulb:          ion('bulb', 'bulb-outline'),
  mic:           ion('mic', 'mic-outline'),
  arrowUp:       ion('arrow-up'),
  mail:          ion('mail', 'mail-outline'),
  phonePortrait: ion('phone-portrait', 'phone-portrait-outline'),
  bicycle:       ion('bicycle'),
  walk:          ion('walk'),
  chevronDown:   ion('chevron-down'),
  pdf:           ion('document-attach', 'document-attach-outline'),
  notifications: ion('notifications', 'notifications-outline'),
  people:        ion('people', 'people-outline'),
  person:        ion('person', 'person-outline'),
  sparkles:      ion('sparkles'),
  tag:           ion('pricetag', 'pricetag-outline'),
  navigate:      ion('navigate'),

  // ── Téma (prepínač vzhľadu) ────────────────────────────────
  sun:         ion('sunny', 'sunny-outline'),
  moon:        ion('moon', 'moon-outline'),
  settings:    ion('settings', 'settings-outline'),

  // ── Počasie (MaterialCommunityIcons — Ionicons ich nemá) ───
  wind:        mci('weather-windy'),
  humidity:    mci('water-percent'),
  rain:        mci('weather-pouring'),
  recyklacia:  mci('recycle'),
} satisfies Record<string, IconDef>

export type IconName = keyof typeof ICONS

type Props = {
  name: IconName
  size?: number
  color?: string
  /** "filled" (default) alebo "outline" (napr. neaktívny tab). */
  variant?: 'filled' | 'outline'
  /** Prístupnosť: ak je ikona čisto dekoračná, nechaj prázdne (skryje sa). */
  accessibilityLabel?: string
  style?: ComponentProps<typeof Ionicons>['style']
}

export function Icon({ name, size = 24, color, variant = 'filled', accessibilityLabel, style }: Props) {
  const t = useThemeColors()
  const def = ICONS[name]
  const tint = color ?? t.text

  const a11y = accessibilityLabel
    ? { accessibilityLabel, accessible: true }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no' as const }

  if (def.lib === 'mci') {
    const glyph = (variant === 'outline' && def.outline ? def.outline : def.glyph) as MciName
    return <MaterialCommunityIcons name={glyph} size={size} color={tint} style={style} {...a11y} />
  }

  const glyph = (variant === 'outline' && def.outline ? def.outline : def.glyph) as IonName
  return <Ionicons name={glyph} size={size} color={tint} style={style} {...a11y} />
}

export default Icon
