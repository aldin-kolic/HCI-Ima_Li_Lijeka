// Svi podaci u prototipu su izmišljeni i hardkodirani. Nema backenda ni API poziva.

export type StatusZalihe = 'na_stanju' | 'malo' | 'nema'

export type StatusRezervacije =
  | 'na_cekanju' // pacijent poslao, apoteka još nije odgovorila
  | 'potvrdjeno' // apoteka potvrdila, priprema lijek (pacijent i dalje vidi "Na čekanju")
  | 'spremno' // spremno za preuzimanje
  | 'preuzeto'
  | 'otkazano'

export interface Interval {
  od: string // "HH:MM"
  do: string // "HH:MM"
}

export interface RadnoVrijeme {
  radniDani: Interval | null // ponedjeljak – petak
  subota: Interval | null
  nedjelja: Interval | null
}

export interface Apoteka {
  id: string
  naziv: string
  adresa: string
  naselje: string
  telefon: string
  udaljenostKm: number
  dezurna: boolean // dežurna večeras (otvoreno 24 h)
  radnoVrijeme: RadnoVrijeme
  /** Koordinate na stilizovanoj SVG mapi (viewBox 0 0 360 260). */
  mapa: { x: number; y: number }
}

export interface Lijek {
  id: string
  naziv: string
  jacina: string
  oblik: string
  naRecept: boolean
  cijenaKM: number
  aktivnaTvar: string
  /** ID-jevi generičkih zamjena (isti sastav, drugi proizvođač). */
  zamjene: string[]
}

export interface StavkaZalihe {
  status: StatusZalihe
  azuriranoPrijeMin: number
}

export interface Rezervacija {
  id: string
  kod: string
  apotekaId: string
  lijekId: string
  kolicina: number
  receptPonijet: boolean
  napomena: string
  status: StatusRezervacije
  kreirano: Date
  rokPreuzimanja: Date
  pacijent: string
  /** Rezervacije trenutnog korisnika (vide se u "Moje rezervacije"). */
  moja: boolean
  razlogOtkazivanja?: string
}

/** Fiksirano "sada" za cijeli prototip: subota, 31. 10. 2026. u 22:30. */
export const SADA = new Date(2026, 9, 31, 22, 30)

export const prijeMinuta = (min: number) => new Date(SADA.getTime() - min * 60_000)

/** Lokacija korisnika na mapi (Marijin Dvor). */
export const MOJA_LOKACIJA = { x: 236, y: 132 }

/** Apoteka u koju je farmaceut "ulogovan". */
export const APOTEKA_FARMACEUTA_ID = 'centar'

export const PACIJENT_IME = 'Emina B.'

export const apoteke: Apoteka[] = [
  {
    id: 'marijin-dvor',
    naziv: 'Apoteka Marijin Dvor',
    adresa: 'Zmaja od Bosne 6',
    naselje: 'Marijin Dvor',
    telefon: '033 205 114',
    udaljenostKm: 0.4,
    dezurna: false,
    radnoVrijeme: { radniDani: { od: '07:30', do: '20:00' }, subota: { od: '08:00', do: '15:00' }, nedjelja: null },
    mapa: { x: 226, y: 118 },
  },
  {
    id: 'centar',
    naziv: 'Apoteka Centar',
    adresa: 'Ferhadija 12',
    naselje: 'Centar',
    telefon: '033 444 120',
    udaljenostKm: 1.1,
    dezurna: true,
    radnoVrijeme: { radniDani: { od: '07:00', do: '22:00' }, subota: { od: '08:00', do: '20:00' }, nedjelja: { od: '09:00', do: '14:00' } },
    mapa: { x: 280, y: 108 },
  },
  {
    id: 'grbavica',
    naziv: 'Apoteka Grbavica',
    adresa: 'Zagrebačka 21',
    naselje: 'Grbavica',
    telefon: '033 712 330',
    udaljenostKm: 1.3,
    dezurna: false,
    radnoVrijeme: { radniDani: { od: '08:00', do: '20:00' }, subota: { od: '08:00', do: '20:00' }, nedjelja: null },
    mapa: { x: 214, y: 166 },
  },
  {
    id: 'kosevo',
    naziv: 'Apoteka Koševo',
    adresa: 'Bolnička 7',
    naselje: 'Koševo',
    telefon: '033 297 041',
    udaljenostKm: 1.8,
    dezurna: false,
    radnoVrijeme: { radniDani: { od: '07:00', do: '19:00' }, subota: { od: '08:00', do: '14:00' }, nedjelja: null },
    mapa: { x: 258, y: 58 },
  },
  {
    id: 'bascarsija',
    naziv: 'Apoteka Baščaršija',
    adresa: 'Sarači 41',
    naselje: 'Stari Grad',
    telefon: '033 532 908',
    udaljenostKm: 2.2,
    dezurna: false,
    radnoVrijeme: { radniDani: { od: '08:00', do: '20:00' }, subota: { od: '09:00', do: '17:00' }, nedjelja: null },
    mapa: { x: 322, y: 100 },
  },
  {
    id: 'otoka',
    naziv: 'Apoteka Otoka',
    adresa: 'Bulevar Meše Selimovića 85',
    naselje: 'Otoka',
    telefon: '033 761 552',
    udaljenostKm: 4.6,
    dezurna: true,
    radnoVrijeme: { radniDani: { od: '07:00', do: '21:00' }, subota: { od: '08:00', do: '18:00' }, nedjelja: null },
    mapa: { x: 128, y: 128 },
  },
  {
    id: 'alipasino',
    naziv: 'Apoteka Alipašino Polje',
    adresa: 'Džemala Bijedića 140',
    naselje: 'Alipašino Polje',
    telefon: '033 543 276',
    udaljenostKm: 5.3,
    dezurna: false,
    radnoVrijeme: { radniDani: { od: '07:00', do: '23:00' }, subota: { od: '08:00', do: '23:00' }, nedjelja: { od: '10:00', do: '18:00' } },
    mapa: { x: 96, y: 162 },
  },
  {
    id: 'ilidza',
    naziv: 'Apoteka Ilidža',
    adresa: 'Butmirska cesta 14',
    naselje: 'Ilidža',
    telefon: '033 628 815',
    udaljenostKm: 9.8,
    dezurna: true,
    radnoVrijeme: { radniDani: { od: '07:00', do: '21:00' }, subota: { od: '08:00', do: '16:00' }, nedjelja: null },
    mapa: { x: 34, y: 206 },
  },
]

export const lijekovi: Lijek[] = [
  { id: 'brufen-400', naziv: 'Brufen', jacina: '400 mg', oblik: 'tablete', naRecept: false, cijenaKM: 6.9, aktivnaTvar: 'ibuprofen', zamjene: ['ibuprofen-400'] },
  { id: 'ibuprofen-400', naziv: 'Ibuprofen', jacina: '400 mg', oblik: 'tablete', naRecept: false, cijenaKM: 4.2, aktivnaTvar: 'ibuprofen', zamjene: ['brufen-400'] },
  { id: 'panadol-500', naziv: 'Panadol', jacina: '500 mg', oblik: 'tablete', naRecept: false, cijenaKM: 5.8, aktivnaTvar: 'paracetamol', zamjene: ['paracetamol-500'] },
  { id: 'paracetamol-500', naziv: 'Paracetamol', jacina: '500 mg', oblik: 'tablete', naRecept: false, cijenaKM: 2.9, aktivnaTvar: 'paracetamol', zamjene: ['panadol-500'] },
  { id: 'augmentin-1g', naziv: 'Augmentin', jacina: '875 mg/125 mg', oblik: 'film tablete', naRecept: true, cijenaKM: 16.4, aktivnaTvar: 'amoksicilin + klavulanska kiselina', zamjene: ['amoksiklav-1g'] },
  { id: 'amoksiklav-1g', naziv: 'Amoksicilin/klavulanska kiselina', jacina: '875 mg/125 mg', oblik: 'film tablete', naRecept: true, cijenaKM: 11.2, aktivnaTvar: 'amoksicilin + klavulanska kiselina', zamjene: ['augmentin-1g'] },
  { id: 'nurofen-sirup', naziv: 'Nurofen za djecu', jacina: '100 mg/5 ml', oblik: 'sirup', naRecept: false, cijenaKM: 9.5, aktivnaTvar: 'ibuprofen', zamjene: [] },
  { id: 'aspirin-500', naziv: 'Aspirin', jacina: '500 mg', oblik: 'tablete', naRecept: false, cijenaKM: 7.3, aktivnaTvar: 'acetilsalicilna kiselina', zamjene: [] },
  { id: 'controloc-20', naziv: 'Controloc', jacina: '20 mg', oblik: 'gastrorezistentne tablete', naRecept: true, cijenaKM: 18.6, aktivnaTvar: 'pantoprazol', zamjene: ['pantoprazol-20'] },
  { id: 'pantoprazol-20', naziv: 'Pantoprazol', jacina: '20 mg', oblik: 'gastrorezistentne tablete', naRecept: true, cijenaKM: 9.9, aktivnaTvar: 'pantoprazol', zamjene: ['controloc-20'] },
  { id: 'cetirizin-10', naziv: 'Cetirizin', jacina: '10 mg', oblik: 'tablete', naRecept: false, cijenaKM: 4.5, aktivnaTvar: 'cetirizin', zamjene: [] },
  { id: 'ventolin', naziv: 'Ventolin', jacina: '100 mcg/doza', oblik: 'inhalator', naRecept: true, cijenaKM: 8.7, aktivnaTvar: 'salbutamol', zamjene: [] },
  { id: 'lazolvan-sirup', naziv: 'Lazolvan', jacina: '15 mg/5 ml', oblik: 'sirup', naRecept: false, cijenaKM: 8.4, aktivnaTvar: 'ambroksol', zamjene: [] },
  { id: 'concor-5', naziv: 'Concor', jacina: '5 mg', oblik: 'tablete', naRecept: true, cijenaKM: 7.9, aktivnaTvar: 'bisoprolol', zamjene: [] },
  { id: 'linex', naziv: 'Linex', jacina: '280 mg', oblik: 'kapsule', naRecept: false, cijenaKM: 12.8, aktivnaTvar: 'probiotske kulture', zamjene: [] },
]

/** Lijekovi koji se nude kao brzi izbor na početnoj. */
export const cestoTrazeno = ['brufen-400', 'panadol-500', 'augmentin-1g', 'nurofen-sirup']

/**
 * Matrica stanja: jedan red po lijeku, jedan znak po apoteci (redoslijed kao u `apoteke`).
 * N = na stanju, M = malo na stanju, - = nema
 *
 *                 MD Ce Gr Ko Ba Ot Al Il
 */
const MATRICA: Record<string, string> = {
  'brufen-400':      'NNM-N-MN',
  'ibuprofen-400':   'MN-NNM-N',
  'panadol-500':     'NNNMNNMN',
  'paracetamol-500': 'NMNNNNNN',
  'augmentin-1g':    '--------', // nema nigdje → prijedlog generičke zamjene
  'amoksiklav-1g':   'MN-N-NM-',
  'nurofen-sirup':   'N-MN-NN-',
  'aspirin-500':     'NNNNMNNN',
  'controloc-20':    '-M-N--N-',
  'pantoprazol-20':  'NNMNN-NN',
  'cetirizin-10':    'NNNNNMNN',
  'ventolin':        '--------', // nema nigdje, bez zamjene → "šta dalje"
  'lazolvan-sirup':  'M-NNM-NN',
  'concor-5':        'NNN-NNMN',
  'linex':           'NMN-N-NN',
}

/** Koliko je minuta prošlo od zadnjeg ažuriranja zaliha, po apoteci. */
const AZURIRANO_PRIJE: Record<string, number> = {
  'marijin-dvor': 8,
  centar: 15,
  grbavica: 42,
  kosevo: 95,
  bascarsija: 27,
  otoka: 4,
  alipasino: 63,
  ilidza: 130,
}

const ZNAK_U_STATUS: Record<string, StatusZalihe> = { N: 'na_stanju', M: 'malo', '-': 'nema' }

export type MatricaZaliha = Record<string, Record<string, StavkaZalihe>>

export function pocetnaMatricaZaliha(): MatricaZaliha {
  const rezultat: MatricaZaliha = {}
  apoteke.forEach((apoteka, ai) => {
    rezultat[apoteka.id] = {}
    lijekovi.forEach((lijek, li) => {
      rezultat[apoteka.id][lijek.id] = {
        status: ZNAK_U_STATUS[MATRICA[lijek.id][ai]],
        azuriranoPrijeMin: AZURIRANO_PRIJE[apoteka.id] + ((li * 11) % 37),
      }
    })
  })
  return rezultat
}

export function pocetneRezervacije(): Rezervacija[] {
  return [
    // 3 rezervacije trenutnog pacijenta, u različitim statusima
    {
      id: 'r-3907',
      kod: 'RZ-3907',
      apotekaId: 'centar',
      lijekId: 'panadol-500',
      kolicina: 1,
      receptPonijet: false,
      napomena: '',
      status: 'spremno',
      kreirano: prijeMinuta(50),
      rokPreuzimanja: prijeMinuta(50 - 120),
      pacijent: PACIJENT_IME,
      moja: true,
    },
    {
      id: 'r-4112',
      kod: 'RZ-4112',
      apotekaId: 'centar',
      lijekId: 'amoksiklav-1g',
      kolicina: 1,
      receptPonijet: true,
      napomena: 'Recept je od doktorice porodične medicine.',
      status: 'na_cekanju',
      kreirano: prijeMinuta(12),
      rokPreuzimanja: prijeMinuta(12 - 120),
      pacijent: PACIJENT_IME,
      moja: true,
    },
    {
      id: 'r-2675',
      kod: 'RZ-2675',
      apotekaId: 'grbavica',
      lijekId: 'cetirizin-10',
      kolicina: 2,
      receptPonijet: false,
      napomena: '',
      status: 'preuzeto',
      kreirano: new Date(2026, 9, 28, 17, 5),
      rokPreuzimanja: new Date(2026, 9, 28, 19, 5),
      pacijent: PACIJENT_IME,
      moja: true,
    },
    // Rezervacije drugih pacijenata – vidi ih samo farmaceut u Apoteci Centar
    {
      id: 'r-4135',
      kod: 'RZ-4135',
      apotekaId: 'centar',
      lijekId: 'brufen-400',
      kolicina: 2,
      receptPonijet: false,
      napomena: 'Dolazim oko 23 h.',
      status: 'na_cekanju',
      kreirano: prijeMinuta(6),
      rokPreuzimanja: prijeMinuta(6 - 120),
      pacijent: 'Amra H.',
      moja: false,
    },
    {
      id: 'r-4098',
      kod: 'RZ-4098',
      apotekaId: 'centar',
      lijekId: 'controloc-20',
      kolicina: 1,
      receptPonijet: true,
      napomena: '',
      status: 'potvrdjeno',
      kreirano: prijeMinuta(25),
      rokPreuzimanja: prijeMinuta(25 - 120),
      pacijent: 'Kenan M.',
      moja: false,
    },
  ]
}

export interface Obavijest {
  id: string
  uloga: 'pacijent' | 'farmaceut'
  naslov: string
  tekst: string
  kreirano: Date
  procitano: boolean
  link?: string
}

export function pocetneObavijesti(): Obavijest[] {
  return [
    {
      id: 'o-1',
      uloga: 'pacijent',
      naslov: 'Lijek je spreman za preuzimanje',
      tekst: 'Panadol 500 mg čeka vas u Apoteci Centar. Kod: RZ-3907.',
      kreirano: prijeMinuta(18),
      procitano: false,
      link: '/pacijent/rezervacije',
    },
    {
      id: 'o-2',
      uloga: 'pacijent',
      naslov: 'Rezervacija je preuzeta',
      tekst: 'Cetirizin 10 mg, Apoteka Grbavica. Hvala što koristite Ima li lijeka?',
      kreirano: new Date(2026, 9, 28, 18, 2),
      procitano: true,
      link: '/pacijent/rezervacije?prikaz=zavrsene',
    },
    {
      id: 'o-3',
      uloga: 'farmaceut',
      naslov: 'Nova rezervacija RZ-4135',
      tekst: 'Amra H. rezerviše Brufen 400 mg × 2.',
      kreirano: prijeMinuta(6),
      procitano: false,
      link: '/farmaceut/rezervacije',
    },
    {
      id: 'o-4',
      uloga: 'farmaceut',
      naslov: 'Nova rezervacija RZ-4112',
      tekst: 'Emina B. rezerviše Amoksicilin/klavulanska kiselina 875 mg/125 mg. Lijek je na recept.',
      kreirano: prijeMinuta(12),
      procitano: false,
      link: '/farmaceut/rezervacije',
    },
  ]
}

/** Broj rezervacija po satu za današnji dan u Apoteci Centar (za grafikon na pregledu farmaceuta). */
export const rezervacijePoSatu: { sat: number; broj: number }[] = [
  { sat: 8, broj: 3 }, { sat: 9, broj: 5 }, { sat: 10, broj: 7 }, { sat: 11, broj: 6 }, { sat: 12, broj: 4 },
  { sat: 13, broj: 3 }, { sat: 14, broj: 5 }, { sat: 15, broj: 4 }, { sat: 16, broj: 6 }, { sat: 17, broj: 8 },
  { sat: 18, broj: 9 }, { sat: 19, broj: 6 }, { sat: 20, broj: 5 }, { sat: 21, broj: 4 }, { sat: 22, broj: 3 },
]

/** Koliko puta su pacijenti danas tražili lijek (za "traženo, a nema na stanju"). */
export const pretrageDanas: Record<string, number> = {
  'augmentin-1g': 14, ventolin: 9, 'nurofen-sirup': 11, 'controloc-20': 6, 'brufen-400': 23, 'panadol-500': 19,
  'lazolvan-sirup': 7, 'concor-5': 4, linex: 5, 'aspirin-500': 8, 'cetirizin-10': 6, 'amoksiklav-1g': 10,
  'ibuprofen-400': 9, 'paracetamol-500': 12, 'pantoprazol-20': 3,
}

export const FARMACEUT_IME = 'Selma K.'

export const apotekaPoId = (id: string) => apoteke.find((a) => a.id === id)
export const lijekPoId = (id: string) => lijekovi.find((l) => l.id === id)
