import { SADA, lijekovi, type Apoteka, type Interval, type Lijek, type StatusRezervacije, type StatusZalihe } from '../data/mockData'

const DANI = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota']
const DANI_KRATKO = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub']

const uMinute = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const dvocifreno = (n: number) => String(n).padStart(2, '0')

export const formatVrijeme = (d: Date) => `${dvocifreno(d.getHours())}:${dvocifreno(d.getMinutes())}`

export const formatDatum = (d: Date) => `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}.`

export const nazivDana = (d: Date) => DANI[d.getDay()]

export function intervalZaDan(apoteka: Apoteka, dan: number): Interval | null {
  if (dan === 0) return apoteka.radnoVrijeme.nedjelja
  if (dan === 6) return apoteka.radnoVrijeme.subota
  return apoteka.radnoVrijeme.radniDani
}

export function jeOtvorenoSada(apoteka: Apoteka): boolean {
  if (apoteka.dezurna) return true
  const interval = intervalZaDan(apoteka, SADA.getDay())
  if (!interval) return false
  const sada = SADA.getHours() * 60 + SADA.getMinutes()
  return sada >= uMinute(interval.od) && sada < uMinute(interval.do)
}

/** Prvi sljedeći trenutak otvaranja (za zatvorene apoteke). */
export function sljedeceOtvaranje(apoteka: Apoteka): Date | null {
  const sadaMin = SADA.getHours() * 60 + SADA.getMinutes()
  for (let pomak = 0; pomak < 8; pomak++) {
    const dan = new Date(SADA)
    dan.setDate(SADA.getDate() + pomak)
    const interval = intervalZaDan(apoteka, dan.getDay())
    if (!interval) continue
    const od = uMinute(interval.od)
    if (pomak === 0 && od <= sadaMin) continue
    dan.setHours(Math.floor(od / 60), od % 60, 0, 0)
    return dan
  }
  return null
}

export function opisRadnogVremena(apoteka: Apoteka): { tekst: string; otvoreno: boolean } {
  if (apoteka.dezurna) return { tekst: 'Dežurna · otvoreno 24 h', otvoreno: true }
  if (jeOtvorenoSada(apoteka)) {
    const interval = intervalZaDan(apoteka, SADA.getDay())!
    return { tekst: `Otvoreno do ${interval.do}`, otvoreno: true }
  }
  const sljedece = sljedeceOtvaranje(apoteka)
  if (!sljedece) return { tekst: 'Zatvoreno', otvoreno: false }
  return { tekst: `Zatvoreno · otvara ${DANI_KRATKO[sljedece.getDay()]} ${formatVrijeme(sljedece)}`, otvoreno: false }
}

export function formatInterval(interval: Interval | null) {
  return interval ? `${interval.od} – ${interval.do}` : 'zatvoreno'
}

/** Rok preuzimanja: 2 sata od sada, ili 2 sata od otvaranja ako je apoteka zatvorena. */
export function izracunajRok(apoteka: Apoteka): Date {
  const pocetak = jeOtvorenoSada(apoteka) ? SADA : (sljedeceOtvaranje(apoteka) ?? SADA)
  return new Date(pocetak.getTime() + 120 * 60_000)
}

export function opisRoka(rok: Date) {
  const istiDan = rok.toDateString() === SADA.toDateString()
  const sutra = new Date(SADA)
  sutra.setDate(SADA.getDate() + 1)
  if (istiDan) return `danas do ${formatVrijeme(rok)}`
  if (rok.toDateString() === sutra.toDateString()) return `do ${formatVrijeme(rok)} (iza ponoći)`
  return `${nazivDana(rok)}, ${formatDatum(rok)} do ${formatVrijeme(rok)}`
}

export function prijeKoliko(min: number) {
  if (min < 1) return 'upravo'
  if (min < 60) return `prije ${min} min`
  const h = Math.floor(min / 60)
  const ostatak = min % 60
  if (h >= 24) {
    const dana = Math.floor(h / 24)
    return dana === 1 ? 'jučer' : `prije ${dana} dana`
  }
  return ostatak ? `prije ${h} h ${ostatak} min` : `prije ${h} h`
}

export const minutaOd = (d: Date) => Math.max(0, Math.round((SADA.getTime() - d.getTime()) / 60_000))

export const formatKM = (iznos: number) => `${iznos.toFixed(2).replace('.', ',')} KM`

export const formatKm = (km: number) => `${km.toFixed(1).replace('.', ',')} km`

/** Bosanska množina: 1 apoteka, 2–4 apoteke, 5+ apoteka (11–14 → apoteka). */
export function mnozina(n: number, jedan: string, dvaDoCetiri: string, pet: string) {
  const d = n % 10
  const s = n % 100
  if (d === 1 && s !== 11) return jedan
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return dvaDoCetiri
  return pet
}

export const punNazivLijeka = (l: Lijek) => `${l.naziv} ${l.jacina}`

export const STATUS_ZALIHE_TEKST: Record<StatusZalihe, string> = {
  na_stanju: 'Na stanju',
  malo: 'Malo na stanju',
  nema: 'Nema na stanju',
}

/** Kako pacijent vidi status rezervacije. */
export const STATUS_REZERVACIJE_PACIJENT: Record<StatusRezervacije, string> = {
  na_cekanju: 'Na čekanju',
  potvrdjeno: 'Na čekanju',
  spremno: 'Spremno za preuzimanje',
  preuzeto: 'Preuzeto',
  otkazano: 'Otkazano',
}

/** Kako farmaceut vidi status rezervacije. */
export const STATUS_REZERVACIJE_FARMACEUT: Record<StatusRezervacije, string> = {
  na_cekanju: 'Nova',
  potvrdjeno: 'Potvrđena',
  spremno: 'Spremna',
  preuzeto: 'Preuzeta',
  otkazano: 'Odbijena / otkazana',
}

export const jeAktivna = (s: StatusRezervacije) => s === 'na_cekanju' || s === 'potvrdjeno' || s === 'spremno'

/** Normalizacija za pretragu: mala slova, bez dijakritike. */
export const normalizuj = (s: string) =>
  s
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

export function pretraziLijekove(upit: string): Lijek[] {
  const u = normalizuj(upit)
  if (!u) return []
  return lijekovi.filter((l) => normalizuj(`${l.naziv} ${l.jacina} ${l.aktivnaTvar}`).includes(u))
}
