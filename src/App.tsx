import { useEffect, useRef, type ReactNode } from 'react'
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { BatteryFull, ClipboardList, House, Inbox, Moon, Package, Settings, Signal, Wifi } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider, ToastViewport } from './context/ToastContext'
import { APOTEKA_FARMACEUTA_ID, SADA } from './data/mockData'
import { formatVrijeme } from './lib/format'
import { cx } from './components/ui'
import { PrekidacUloge, type Uloga } from './components/PrekidacUloge'
import Pocetna from './pages/pacijent/Pocetna'
import Rezultati from './pages/pacijent/Rezultati'
import DetaljApoteke from './pages/pacijent/DetaljApoteke'
import Rezervacija from './pages/pacijent/Rezervacija'
import RezervacijaUspjeh from './pages/pacijent/RezervacijaUspjeh'
import MojeRezervacije from './pages/pacijent/MojeRezervacije'
import Dezurne from './pages/pacijent/Dezurne'
import Podesavanja from './pages/Podesavanja'
import Prijava from './pages/farmaceut/Prijava'
import DolazneRezervacije from './pages/farmaceut/DolazneRezervacije'
import StanjeLijekova from './pages/farmaceut/StanjeLijekova'

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <Okvir />
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  )
}

/** Hook za prebacivanje uloge – vraća korisnika na zadnji ekran na kojem je bio u toj ulozi. */
function useUloga() {
  const location = useLocation()
  const navigate = useNavigate()
  const uloga: Uloga = location.pathname.startsWith('/farmaceut') ? 'farmaceut' : 'pacijent'
  const zadnje = useRef<Record<Uloga, string>>({ pacijent: '/pacijent', farmaceut: '/farmaceut' })

  useEffect(() => {
    zadnje.current[uloga] = location.pathname + location.search
  }, [location, uloga])

  return { uloga, promijeni: (u: Uloga) => u !== uloga && navigate(zadnje.current[u]) }
}

function Okvir() {
  const { uloga, promijeni } = useUloga()

  return (
    <div className="flex min-h-dvh flex-col items-center md:justify-center md:gap-4 md:py-4">
      {/* Na desktopu: opis prototipa i prekidač uloga iznad okvira telefona */}
      <div className="hidden flex-col items-center gap-3 md:flex">
        <p className="text-sm text-muted">
          Hi-fi prototip <strong className="text-fg">„Ima li lijeka?"</strong> · simulirano vrijeme: subota, 31. 10. 2026. u {formatVrijeme(SADA)}
        </p>
        <PrekidacUloge uloga={uloga} onChange={promijeni} />
      </div>

      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg md:h-[min(844px,calc(100dvh-7.5rem))] md:w-[390px] md:rounded-[48px] md:border-[10px] md:border-neutral-900 md:shadow-2xl">
        <StatusnaTraka />
        <Routes>
          <Route path="/" element={<Navigate to="/pacijent" replace />} />
          <Route path="/pacijent" element={<PacijentLayout />}>
            <Route index element={<Pocetna />} />
            <Route path="pretraga" element={<Rezultati />} />
            <Route path="apoteka/:apotekaId" element={<DetaljApoteke />} />
            <Route path="rezervacija/:apotekaId/:lijekId" element={<Rezervacija />} />
            <Route path="rezervacija-uspjeh/:id" element={<RezervacijaUspjeh />} />
            <Route path="rezervacije" element={<MojeRezervacije />} />
            <Route path="dezurne" element={<Dezurne />} />
            <Route path="podesavanja" element={<Podesavanja uloga="pacijent" onPromijeniUlogu={promijeni} />} />
          </Route>
          <Route path="/farmaceut/prijava" element={<Prijava />} />
          <Route path="/farmaceut" element={<FarmaceutLayout />}>
            <Route index element={<Navigate to="rezervacije" replace />} />
            <Route path="rezervacije" element={<DolazneRezervacije />} />
            <Route path="zalihe" element={<StanjeLijekova />} />
            <Route path="podesavanja" element={<Podesavanja uloga="farmaceut" onPromijeniUlogu={promijeni} />} />
          </Route>
          <Route path="*" element={<Navigate to="/pacijent" replace />} />
        </Routes>
        <ToastViewport />
        <div id="modal-root" />
      </div>
    </div>
  )
}

/** Lažna statusna traka telefona (samo na desktopu), prikazuje fiksirano vrijeme. */
function StatusnaTraka() {
  return (
    <div aria-hidden className="hidden h-9 shrink-0 items-center justify-between bg-bg px-7 pt-1 text-sm font-semibold md:flex">
      <span>{formatVrijeme(SADA)}</span>
      <span className="flex items-center gap-1.5">
        <Signal className="size-4" />
        <Wifi className="size-4" />
        <BatteryFull className="size-5" />
      </span>
    </div>
  )
}

/** Sadržaj koji se skrola + donja navigacija. Skrol se vraća na vrh pri promjeni ekrana. */
function Ekran({ navigacija }: { navigacija?: ReactNode }) {
  const { pathname } = useLocation()
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    ref.current?.scrollTo(0, 0)
  }, [pathname])
  return (
    <>
      <main ref={ref} className="skrol min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {navigacija}
    </>
  )
}

interface StavkaNavigacije {
  to: string
  tekst: string
  Ikona: typeof House
  end?: boolean
  znacka?: number
}

function DonjaNavigacija({ stavke, oznaka }: { stavke: StavkaNavigacije[]; oznaka: string }) {
  return (
    <nav aria-label={oznaka} className="shrink-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:pb-3">
      <ul className="flex">
        {stavke.map(({ to, tekst, Ikona, end, znacka }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              data-bez-podvlake
              className={({ isActive }) =>
                cx(
                  'flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold no-underline transition-colors',
                  isActive ? 'text-primary' : 'text-muted hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cx('relative grid h-8 w-14 place-items-center rounded-full transition-colors', isActive && 'bg-primary-soft')}>
                    <Ikona aria-hidden className="size-5" />
                    {!!znacka && (
                      <span className="absolute -top-1 right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[0.7rem] font-bold text-surface">
                        {znacka}
                        <span className="sr-only"> novo</span>
                      </span>
                    )}
                  </span>
                  {tekst}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function PacijentLayout() {
  const { rezervacije } = useApp()
  const spremne = rezervacije.filter((r) => r.moja && r.status === 'spremno').length
  return (
    <Ekran
      navigacija={
        <DonjaNavigacija
          oznaka="Glavna navigacija"
          stavke={[
            { to: '/pacijent', tekst: 'Početna', Ikona: House, end: true },
            { to: '/pacijent/dezurne', tekst: 'Dežurne', Ikona: Moon },
            { to: '/pacijent/rezervacije', tekst: 'Rezervacije', Ikona: ClipboardList, znacka: spremne },
            { to: '/pacijent/podesavanja', tekst: 'Podešavanja', Ikona: Settings },
          ]}
        />
      }
    />
  )
}

function FarmaceutLayout() {
  const { farmaceutPrijavljen, rezervacije } = useApp()
  if (!farmaceutPrijavljen) return <Navigate to="/farmaceut/prijava" replace />
  const nove = rezervacije.filter((r) => r.apotekaId === APOTEKA_FARMACEUTA_ID && r.status === 'na_cekanju').length
  return (
    <Ekran
      navigacija={
        <DonjaNavigacija
          oznaka="Navigacija farmaceuta"
          stavke={[
            { to: '/farmaceut/rezervacije', tekst: 'Rezervacije', Ikona: Inbox, znacka: nove },
            { to: '/farmaceut/zalihe', tekst: 'Stanje lijekova', Ikona: Package },
            { to: '/farmaceut/podesavanja', tekst: 'Podešavanja', Ikona: Settings },
          ]}
        />
      }
    />
  )
}

