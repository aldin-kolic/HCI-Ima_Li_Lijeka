import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  SADA,
  PACIJENT_IME,
  apotekaPoId,
  pocetnaMatricaZaliha,
  pocetneRezervacije,
  type MatricaZaliha,
  type Rezervacija,
  type StatusRezervacije,
  type StatusZalihe,
} from '../data/mockData'
import { izracunajRok } from '../lib/format'

export type VelicinaFonta = 0 | 1 | 2

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
  postavke: Postavke
  farmaceutPrijavljen: boolean
  kreirajRezervaciju: (nova: NovaRezervacija) => Rezervacija
  promijeniStatusRezervacije: (id: string, status: StatusRezervacije, razlog?: string) => void
  promijeniZalihu: (apotekaId: string, lijekId: string, status: StatusZalihe) => void
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [zalihe, setZalihe] = useState(pocetnaMatricaZaliha)
  const [rezervacije, setRezervacije] = useState(pocetneRezervacije)
  const [postavke, setPostavke] = useState(ucitajPostavke)
  const [farmaceutPrijavljen, setFarmaceutPrijavljen] = useState(false)
  const [sljedeciKod, setSljedeciKod] = useState(4821)

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

  const kreirajRezervaciju = useCallback(
    (nova: NovaRezervacija) => {
      const apoteka = apotekaPoId(nova.apotekaId)!
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
      return rezervacija
    },
    [sljedeciKod],
  )

  const promijeniStatusRezervacije = useCallback((id: string, status: StatusRezervacije, razlog?: string) => {
    setRezervacije((r) => r.map((x) => (x.id === id ? { ...x, status, razlogOtkazivanja: razlog } : x)))
  }, [])

  const promijeniZalihu = useCallback((apotekaId: string, lijekId: string, status: StatusZalihe) => {
    setZalihe((z) => ({ ...z, [apotekaId]: { ...z[apotekaId], [lijekId]: { status, azuriranoPrijeMin: 0 } } }))
  }, [])

  const azurirajPostavke = useCallback((izmjena: Partial<Postavke>) => {
    setPostavke((p) => ({ ...p, ...izmjena }))
  }, [])

  const resetujPrototip = useCallback(() => {
    setZalihe(pocetnaMatricaZaliha())
    setRezervacije(pocetneRezervacije())
    setSljedeciKod(4821)
    setFarmaceutPrijavljen(false)
  }, [])

  const vrijednost = useMemo<AppState>(
    () => ({
      zalihe,
      rezervacije,
      postavke,
      farmaceutPrijavljen,
      kreirajRezervaciju,
      promijeniStatusRezervacije,
      promijeniZalihu,
      azurirajPostavke,
      setFarmaceutPrijavljen,
      resetujPrototip,
      pustiZvuk,
    }),
    [zalihe, rezervacije, postavke, farmaceutPrijavljen, kreirajRezervaciju, promijeniStatusRezervacije, promijeniZalihu, azurirajPostavke, resetujPrototip, pustiZvuk],
  )

  return <AppContext.Provider value={vrijednost}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp mora biti unutar <AppProvider>')
  return ctx
}
