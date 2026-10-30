import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  APOTEKA_FARMACEUTA_ID,
  SADA,
  PACIJENT_IME,
  apotekaPoId,
  lijekPoId,
  pocetnaMatricaZaliha,
  pocetneObavijesti,
  pocetneRezervacije,
  type MatricaZaliha,
  type Obavijest,
  type Rezervacija,
  type StatusRezervacije,
  type StatusZalihe,
} from '../data/mockData'
import { izracunajRok, punNazivLijeka } from '../lib/format'

export type VelicinaFonta = 0 | 1 | 2
export type Uloga = 'pacijent' | 'farmaceut'

export interface Postavke {
  velicinaFonta: VelicinaFonta
  tamniNacin: boolean
  visokiKontrast: boolean
  zvukovi: boolean
}

const POCETNE_POSTAVKE: Postavke = { velicinaFonta: 0, tamniNacin: false, visokiKontrast: false, zvukovi: true }
const KLJUC_POSTAVKI = 'ima-li-lijeka:postavke'
const VELICINE_FONTA = ['100%', '112.5%', '125%']

export type Zvuk = 'click' | 'success' | 'error' | 'notification'

interface NovaRezervacija {
  apotekaId: string
  lijekId: string
  kolicina: number
  receptPonijet: boolean
  napomena: string
}

interface AppState {
  zalihe: MatricaZaliha
  rezervacije: Rezervacija[]
  obavijesti: Obavijest[]
  postavke: Postavke
  farmaceutPrijavljen: boolean
  /** Otvoren dijalog za rezervaciju (može se otvoriti s bilo kojeg ekrana). */
  rezervacijaZa: { apotekaId: string; lijekId: string } | null
  otvoriRezervaciju: (apotekaId: string, lijekId: string) => void
  zatvoriRezervaciju: () => void
  kreirajRezervaciju: (nova: NovaRezervacija) => Rezervacija
  promijeniStatusRezervacije: (id: string, status: StatusRezervacije, opcije?: { razlog?: string; tiho?: boolean }) => void
  promijeniZalihu: (apotekaId: string, lijekId: string, status: StatusZalihe, azuriranoPrijeMin?: number) => void
  oznaciProcitano: (uloga: Uloga, id?: string) => void
  azurirajPostavke: (izmjena: Partial<Postavke>) => void
  setFarmaceutPrijavljen: (v: boolean) => void
  resetujPrototip: () => void
  pustiZvuk: (zvuk: Zvuk) => void
}

const AppContext = createContext<AppState | null>(null)

function ucitajPostavke(): Postavke {
  try {
    const sacuvano = localStorage.getItem(KLJUC_POSTAVKI)
    return sacuvano ? { ...POCETNE_POSTAVKE, ...JSON.parse(sacuvano) } : POCETNE_POSTAVKE
  } catch {
    return POCETNE_POSTAVKE
  }
}

let brojacObavijesti = 100

export function AppProvider({ children }: { children: ReactNode }) {
  const [zalihe, setZalihe] = useState(pocetnaMatricaZaliha)
  const [rezervacije, setRezervacije] = useState(pocetneRezervacije)
  const [obavijesti, setObavijesti] = useState(pocetneObavijesti)
  const [postavke, setPostavke] = useState(ucitajPostavke)
  const [farmaceutPrijavljen, setFarmaceutPrijavljen] = useState(false)
  const [rezervacijaZa, setRezervacijaZa] = useState<AppState['rezervacijaZa']>(null)
  const [sljedeciKod, setSljedeciKod] = useState(4821)
  const rezervacijeRef = useRef(rezervacije)
  rezervacijeRef.current = rezervacije

  // Podešavanja pristupačnosti se primjenjuju globalno na <html>; pamte se u localStorage
  useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = VELICINE_FONTA[postavke.velicinaFonta]
    root.classList.toggle('dark', postavke.tamniNacin)
    root.classList.toggle('hc', postavke.visokiKontrast)
    localStorage.setItem(KLJUC_POSTAVKI, JSON.stringify(postavke))
  }, [postavke])

  const pustiZvuk = useCallback(
    (zvuk: Zvuk) => {
      if (!postavke.zvukovi) return
      const audio = new Audio(`/zvukovi/${zvuk}.mp3`)
      audio.volume = 0.5
      audio.play().catch(() => {})
    },
    [postavke.zvukovi],
  )

  const dodajObavijest = useCallback((o: Omit<Obavijest, 'id' | 'kreirano' | 'procitano'>) => {
    setObavijesti((sve) => [{ ...o, id: `o-${++brojacObavijesti}`, kreirano: SADA, procitano: false }, ...sve])
  }, [])

  const kreirajRezervaciju = useCallback(
    (nova: NovaRezervacija) => {
      const apoteka = apotekaPoId(nova.apotekaId)!
      const lijek = lijekPoId(nova.lijekId)!
      const rezervacija: Rezervacija = {
        ...nova,
        id: `r-${sljedeciKod}`,
        kod: `RZ-${sljedeciKod}`,
        status: 'na_cekanju',
        kreirano: SADA,
        rokPreuzimanja: izracunajRok(apoteka),
        pacijent: PACIJENT_IME,
        moja: true,
      }
      setSljedeciKod((k) => k + 1)
      setRezervacije((r) => [rezervacija, ...r])
      if (apoteka.id === APOTEKA_FARMACEUTA_ID) {
        dodajObavijest({
          uloga: 'farmaceut',
          naslov: `Nova rezervacija ${rezervacija.kod}`,
          tekst: `${PACIJENT_IME} rezerviše ${punNazivLijeka(lijek)} × ${nova.kolicina}.`,
          link: '/farmaceut/rezervacije',
        })
      }
      return rezervacija
    },
    [sljedeciKod, dodajObavijest],
  )

  const promijeniStatusRezervacije = useCallback<AppState['promijeniStatusRezervacije']>(
    (id, status, opcije = {}) => {
      const r = rezervacijeRef.current.find((x) => x.id === id)
      setRezervacije((sve) => sve.map((x) => (x.id === id ? { ...x, status, razlogOtkazivanja: opcije.razlog } : x)))
      // Pacijent dobija obavijest kad apoteka promijeni status njegove rezervacije
      if (!r || !r.moja || opcije.tiho || opcije.razlog === 'Otkazao pacijent') return
      const apoteka = apotekaPoId(r.apotekaId)!
      const lijek = punNazivLijeka(lijekPoId(r.lijekId)!)
      const poruke: Partial<Record<StatusRezervacije, [string, string]>> = {
        potvrdjeno: ['Apoteka je potvrdila rezervaciju', `${apoteka.naziv} priprema ${lijek}. Kod: ${r.kod}.`],
        spremno: ['Lijek je spreman za preuzimanje', `${lijek} čeka vas u apoteci ${apoteka.naziv}. Kod: ${r.kod}.`],
        otkazano: ['Apoteka je odbila rezervaciju', `${apoteka.naziv} ne može izdati ${lijek}. Potražite drugu apoteku.`],
      }
      const p = poruke[status]
      if (p) dodajObavijest({ uloga: 'pacijent', naslov: p[0], tekst: p[1], link: '/pacijent/rezervacije' })
    },
    [dodajObavijest],
  )

  const promijeniZalihu = useCallback((apotekaId: string, lijekId: string, status: StatusZalihe, azuriranoPrijeMin = 0) => {
    setZalihe((z) => ({ ...z, [apotekaId]: { ...z[apotekaId], [lijekId]: { status, azuriranoPrijeMin } } }))
  }, [])

  const oznaciProcitano = useCallback((uloga: Uloga, id?: string) => {
    setObavijesti((sve) => sve.map((o) => (o.uloga === uloga && (!id || o.id === id) ? { ...o, procitano: true } : o)))
  }, [])

  const azurirajPostavke = useCallback((izmjena: Partial<Postavke>) => {
    setPostavke((p) => ({ ...p, ...izmjena }))
  }, [])

  const resetujPrototip = useCallback(() => {
    setZalihe(pocetnaMatricaZaliha())
    setRezervacije(pocetneRezervacije())
    setObavijesti(pocetneObavijesti())
    setSljedeciKod(4821)
    setFarmaceutPrijavljen(false)
  }, [])

  const otvoriRezervaciju = useCallback((apotekaId: string, lijekId: string) => setRezervacijaZa({ apotekaId, lijekId }), [])
  const zatvoriRezervaciju = useCallback(() => setRezervacijaZa(null), [])

  const vrijednost = useMemo<AppState>(
    () => ({
      zalihe,
      rezervacije,
      obavijesti,
      postavke,
      farmaceutPrijavljen,
      rezervacijaZa,
      otvoriRezervaciju,
      zatvoriRezervaciju,
      kreirajRezervaciju,
      promijeniStatusRezervacije,
      promijeniZalihu,
      oznaciProcitano,
      azurirajPostavke,
      setFarmaceutPrijavljen,
      resetujPrototip,
      pustiZvuk,
    }),
    [
      zalihe, rezervacije, obavijesti, postavke, farmaceutPrijavljen, rezervacijaZa, otvoriRezervaciju, zatvoriRezervaciju,
      kreirajRezervaciju, promijeniStatusRezervacije, promijeniZalihu, oznaciProcitano, azurirajPostavke, resetujPrototip, pustiZvuk,
    ],
  )

  return <AppContext.Provider value={vrijednost}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp mora biti unutar <AppProvider>')
  return ctx
}
