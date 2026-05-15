/**
 * Konštanty pre Senior mód.
 *
 * Aplikujú sa cez useSeniorMode hook v komponentoch, ktoré chcú podporovať
 * zvýšenú prístupnosť pre starších občanov.
 */

export const SENIOR = {
  fontSize: {
    small: 18,    // namiesto 12
    body: 22,     // namiesto 15
    title: 28,    // namiesto 20
    heading: 36,  // namiesto 24
  },
  spacing: {
    padding: 24,  // namiesto 16
    gap: 20,      // namiesto 12
  },
  touchTarget: 70, // min výška tlačidla v px (WCAG odporúčanie pre seniorov)
  highContrast: true,
  colors: {
    background: '#FFFFFF',
    text: '#000000',
    primary: '#C62828',
    border: '#000000',
  },
} as const

// Telefón obecného úradu — používa sa pre "Zavolať na úrad"
export const OBECNY_TELEFON = '037779515' // 037 / 77 951 51 → bez medzier pre tel: URL

// Kontaktná osoba (default — môže ísť do AsyncStorage nastavení)
export const DEFAULT_SOS_KONTAKT = {
  meno: 'Záchranná služba',
  telefon: '112',
}
