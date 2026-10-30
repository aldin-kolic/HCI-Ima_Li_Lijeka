import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  Bell,
  ClipboardList,
  Cross,
  House,
  Inbox,
  Keyboard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  Stethoscope,
  Sun,
  User,
  X,
} from 'lucide-react'
import { useApp, type Uloga } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { APOTEKA_FARMACEUTA_ID, FARMACEUT_IME, PACIJENT_IME, SADA, apotekaPoId } from '../data/mockData'
import { formatVrijeme, nazivDana, prijeKoliko, minutaOd } from '../lib/format'
import { PretragaLijeka } from './PretragaLijeka'
import { RezervacijaDijalog } from './RezervacijaDijalog'
import { IkonaDugme, Modal, ZaglavljeModala, cx } from './ui'

interface StavkaNavigacije {
  to: string
  tekst: string
  Ikona: typeof House
  end?: boolean
  znacka?: number
  znackaOpis?: string
}

/** Pamti zadnji ekran svake uloge, da prebacivanje uloge vrati korisnika tamo gdje je stao. */
const zadnjaPutanja: Record<Uloga, string> = { pacijent: '/pacijent', farmaceut: '/farmaceut' }

export function useUloga() {
  const location = useLocation()
  const navigate = useNavigate()
  const uloga: Uloga = location.pathname.startsWith('/farmaceut') ? 'farmaceut' : 'pacijent'
  useEffect(() => {
    zadnjaPutanja[uloga] = location.pathname + location.search
  }, [location, uloga])
  return { uloga, promijeni: (u: Uloga) => u !== uloga && navigate(zadnjaPutanja[u]) }
}

/**
 * Okvir aplikacije (konzistentan vizuelni okvir): bočna globalna navigacija lijevo,
 * gornja traka s pretragom i obavijestima, sadržaj u centralnoj pozornici.
 */
export function Okvir({ uloga }: { uloga: Uloga }) {
  const { rezervacije, postavke, azurirajPostavke } = useApp()
  const { pathname } = useLocation()
  const [meniOtvoren, setMeniOtvoren] = useState(false)
  const [precice, setPrecice] = useState(false)

  useEffect(() => {
    setMeniOtvoren(false)
    window.scrollTo(0, 0)
  }, [pathname])

  // Prečice: "/" fokusira pretragu, "?" prikazuje listu prečica
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="alertdialog"]')) return
      if (e.key === '/') {
        const polje = document.querySelector<HTMLInputElement>('[data-pretraga="velika"]') ?? document.querySelector<HTMLInputElement>('[data-pretraga]')
        if (polje) {
          e.preventDefault()
          polje.focus()
        }
      } else if (e.key === '?') {
        e.preventDefault()
        setPrecice(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const stavke: StavkaNavigacije[] =
    uloga === 'pacijent'
      ? [
          { to: '/pacijent', tekst: 'Početna', Ikona: House, end: true },
          { to: '/pacijent/dezurne', tekst: 'Dežurne apoteke', Ikona: Moon },
          {
            to: '/pacijent/rezervacije',
            tekst: 'Moje rezervacije',
            Ikona: ClipboardList,
            znacka: rezervacije.filter((r) => r.moja && r.status === 'spremno').length,
            znackaOpis: 'spremno za preuzimanje',
          },
          { to: '/pacijent/podesavanja', tekst: 'Podešavanja', Ikona: Settings },
        ]
      : [
          { to: '/farmaceut', tekst: 'Pregled', Ikona: LayoutDashboard, end: true },
          {
            to: '/farmaceut/rezervacije',
            tekst: 'Rezervacije',
            Ikona: Inbox,
            znacka: rezervacije.filter((r) => r.apotekaId === APOTEKA_FARMACEUTA_ID && r.status === 'na_cekanju').length,
            znackaOpis: 'novih',
          },
          { to: '/farmaceut/zalihe', tekst: 'Stanje lijekova', Ikona: Package },
          { to: '/farmaceut/podesavanja', tekst: 'Podešavanja', Ikona: Settings },
        ]

  const naPocetnoj = pathname === '/pacijent'

  return (
    <div className="min-h-dvh">
      <a href="#sadrzaj" className="sr-only z-[80] rounded-lg bg-primary px-4 py-3 font-semibold text-primary-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Preskoči na sadržaj
      </a>

      {meniOtvoren && <div className="fixed inset-0 z-40 bg-[rgb(6_20_15/0.5)] lg:hidden" onClick={() => setMeniOtvoren(false)} aria-hidden />}
      <BocnaNavigacija uloga={uloga} stavke={stavke} otvorena={meniOtvoren} onZatvori={() => setMeniOtvoren(false)} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-4 sm:px-8">
            <IkonaDugme oznaka="Otvori meni" className="lg:hidden" onClick={() => setMeniOtvoren(true)}>
              <Menu aria-hidden className="size-6" />
            </IkonaDugme>
            <div className="min-w-0 flex-1">
              {uloga === 'pacijent' ? (
                !naPocetnoj && <PretragaLijeka velicina="kompaktna" id="pretraga-traka" />
              ) : (
                <p className="truncate text-sm text-muted">
                  <strong className="text-fg">{apotekaPoId(APOTEKA_FARMACEUTA_ID)!.naziv}</strong>, dežurna večeras
                </p>
              )}
            </div>
            <p className="hidden text-sm text-muted xl:block">
              {nazivDana(SADA)[0].toUpperCase() + nazivDana(SADA).slice(1)}, {formatVrijeme(SADA)}
            </p>
            <IkonaDugme oznaka="Prečice na tastaturi (?)" onClick={() => setPrecice(true)} className="hidden sm:grid">
              <Keyboard aria-hidden className="size-5" />
            </IkonaDugme>
            <IkonaDugme oznaka={postavke.tamniNacin ? 'Svijetli način' : 'Tamni način'} onClick={() => azurirajPostavke({ tamniNacin: !postavke.tamniNacin })}>
              {postavke.tamniNacin ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
            </IkonaDugme>
            <Obavijesti uloga={uloga} />
            <KorisnickiMeni uloga={uloga} />
          </div>
        </header>

        <main id="sadrzaj" tabIndex={-1} className="mx-auto max-w-[90rem] px-4 py-8 outline-none sm:px-8">
          <Outlet />
        </main>
      </div>

      {uloga === 'pacijent' && <RezervacijaDijalog />}
      <PreciceDijalog otvoren={precice} onZatvori={() => setPrecice(false)} />
    </div>
  )
}

function BocnaNavigacija({ uloga, stavke, otvorena, onZatvori }: { uloga: Uloga; stavke: StavkaNavigacije[]; otvorena: boolean; onZatvori: () => void }) {
  const { promijeni } = useUloga()
  return (
    <aside
      className={cx(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-nav text-nav-fg transition-transform lg:translate-x-0',
        otvorena ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex items-center gap-3 px-5 pt-6 pb-8">
        <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-signal text-nav">
          <Cross className="size-6" strokeWidth={2.75} />
        </span>
        <div>
          <p className="etiketa text-[1.4rem] leading-none">Ima li lijeka?</p>
          <p className="mt-1 text-xs text-nav-muted">{uloga === 'pacijent' ? 'Apoteke u Sarajevu' : 'Portal za farmaceute'}</p>
        </div>
        <button type="button" onClick={onZatvori} aria-label="Zatvori meni" className="ml-auto grid size-11 place-items-center rounded-lg hover:bg-nav-active lg:hidden">
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <nav aria-label="Glavna navigacija" className="flex-1 px-3">
        <ul className="space-y-1">
          {stavke.map(({ to, tekst, Ikona, end, znacka, znackaOpis }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                data-bez-podvlake
                className={({ isActive }) =>
                  cx(
                    'relative flex min-h-12 items-center gap-3 rounded-lg px-3 font-semibold transition-colors',
                    isActive ? 'bg-nav-active text-nav-fg' : 'text-nav-muted hover:bg-nav-active/60 hover:text-nav-fg',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span aria-hidden className="absolute top-2 bottom-2 -left-3 w-1 rounded-r bg-signal" />}
                    <Ikona aria-hidden className="size-5 shrink-0" />
                    <span className="flex-1">{tekst}</span>
                    {!!znacka && (
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-signal px-1.5 text-xs font-bold text-nav">
                        {znacka}
                        <span className="sr-only"> {znackaOpis}</span>
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-nav-border px-5 py-5">
        <p id="prikaz-prototipa" className="mb-2 text-xs text-nav-muted">
          Prikaz prototipa
        </p>
        <div role="group" aria-labelledby="prikaz-prototipa" className="flex rounded-lg bg-nav-active p-1">
          {(
            [
              ['pacijent', 'Pacijent', User],
              ['farmaceut', 'Farmaceut', Stethoscope],
            ] as const
          ).map(([u, tekst, Ikona]) => (
            <button
              key={u}
              type="button"
              aria-pressed={uloga === u}
              onClick={() => promijeni(u)}
              className={cx(
                'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-semibold',
                uloga === u ? 'bg-nav-fg text-nav' : 'text-nav-muted hover:text-nav-fg',
              )}
            >
              <Ikona aria-hidden className="size-4" />
              {tekst}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-nav-muted">Simulirano vrijeme: subota, 31. 10. 2026. u {formatVrijeme(SADA)}</p>
      </div>
    </aside>
  )
}

/** Zatvara popover na klik izvan i na Esc. */
function usePopover() {
  const [otvoren, setOtvoren] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!otvoren) return
    const klik = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOtvoren(false)
    const tipka = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOtvoren(false)
        ref.current?.querySelector<HTMLElement>('button')?.focus()
      }
    }
    document.addEventListener('mousedown', klik)
    document.addEventListener('keydown', tipka)
    return () => {
      document.removeEventListener('mousedown', klik)
      document.removeEventListener('keydown', tipka)
    }
  }, [otvoren])
  return { otvoren, setOtvoren, ref }
}

function Obavijesti({ uloga }: { uloga: Uloga }) {
  const navigate = useNavigate()
  const { obavijesti, oznaciProcitano } = useApp()
  const { otvoren, setOtvoren, ref } = usePopover()
  const panelId = useId()
  const moje = obavijesti.filter((o) => o.uloga === uloga)
  const neprocitane = moje.filter((o) => !o.procitano).length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={otvoren}
        aria-controls={panelId}
        aria-label={`Obavijesti${neprocitane ? `, ${neprocitane} nepročitane` : ''}`}
        data-tooltip="Obavijesti"
        onClick={() => setOtvoren(!otvoren)}
        className="relative grid size-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
      >
        <Bell aria-hidden className="size-5" />
        {neprocitane > 0 && (
          <span aria-hidden className="absolute top-1.5 right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[0.7rem] font-bold text-surface">
            {neprocitane}
          </span>
        )}
      </button>
      {otvoren && (
        <div id={panelId} className="panel ulaz absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden shadow-[0_16px_40px_-16px_rgb(0_0_0/0.35)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-lg">Obavijesti</h2>
            {neprocitane > 0 && (
              <button type="button" onClick={() => oznaciProcitano(uloga)} className="min-h-11 rounded-md px-2 text-sm font-semibold text-primary hover:underline">
                Označi sve kao pročitano
              </button>
            )}
          </div>
          {moje.length === 0 ? (
            <p className="px-4 py-8 text-center text-muted">Nemate obavijesti.</p>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto">
              {moje.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      oznaciProcitano(uloga, o.id)
                      setOtvoren(false)
                      if (o.link) navigate(o.link)
                    }}
                    className={cx('flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-2', !o.procitano && 'bg-primary-soft/40')}
                  >
                    <span aria-hidden className={cx('mt-2 size-2 shrink-0 rounded-full', o.procitano ? 'bg-transparent' : 'bg-primary')} />
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {o.naslov}
                        {!o.procitano && <span className="sr-only"> (nepročitano)</span>}
                      </span>
                      <span className="block text-sm text-muted">{o.tekst}</span>
                      <span className="mt-0.5 block text-xs text-muted">{prijeKoliko(minutaOd(o.kreirano))}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function KorisnickiMeni({ uloga }: { uloga: Uloga }) {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { setFarmaceutPrijavljen } = useApp()
  const { promijeni } = useUloga()
  const { otvoren, setOtvoren, ref } = usePopover()
  const meniId = useId()
  const ime = uloga === 'pacijent' ? PACIJENT_IME : FARMACEUT_IME
  const inicijali = ime
    .split(' ')
    .map((d) => d[0])
    .join('')

  const stavka = (tekst: string, Ikona: typeof House, onClick: () => void) => (
    <li>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          setOtvoren(false)
          onClick()
        }}
        className="flex min-h-11 w-full items-center gap-3 px-4 text-left hover:bg-surface-2"
      >
        <Ikona aria-hidden className="size-4 text-muted" />
        {tekst}
      </button>
    </li>
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={otvoren}
        aria-controls={meniId}
        onClick={() => setOtvoren(!otvoren)}
        className="flex min-h-11 items-center gap-2 rounded-lg pr-2 pl-1 hover:bg-surface-2"
      >
        <span aria-hidden className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-fg">
          {inicijali}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-sm font-semibold">{ime}</span>
          <span className="block text-xs text-muted">{uloga === 'pacijent' ? 'Pacijent' : 'Farmaceut'}</span>
        </span>
      </button>
      {otvoren && (
        <ul id={meniId} role="menu" aria-label="Korisnički meni" className="panel ulaz absolute right-0 z-50 mt-2 w-60 overflow-hidden py-1 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.35)]">
          {stavka('Podešavanja', Settings, () => navigate(`/${uloga}/podesavanja`))}
          {stavka(uloga === 'pacijent' ? 'Prikaži kao farmaceut' : 'Prikaži kao pacijent', uloga === 'pacijent' ? Stethoscope : User, () =>
            promijeni(uloga === 'pacijent' ? 'farmaceut' : 'pacijent'),
          )}
          {uloga === 'farmaceut' &&
            stavka('Odjavi se', LogOut, () => {
              setFarmaceutPrijavljen(false)
              navigate('/farmaceut/prijava')
              prikaziToast('Odjavljeni ste', { tip: 'info' })
            })}
        </ul>
      )}
    </div>
  )
}

function PreciceDijalog({ otvoren, onZatvori }: { otvoren: boolean; onZatvori: () => void }) {
  const red = (tipke: ReactNode, opis: string) => (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt>{opis}</dt>
      <dd className="flex gap-1">{tipke}</dd>
    </div>
  )
  return (
    <Modal otvoren={otvoren} onZatvori={onZatvori} naslovId="precice-naslov" sirina="max-w-md">
      <ZaglavljeModala id="precice-naslov" naslov="Prečice na tastaturi" onZatvori={onZatvori} />
      <dl className="divide-y divide-border px-6 py-3">
        {red(<kbd>/</kbd>, 'Pretraži lijek')}
        {red(<kbd>?</kbd>, 'Prikaži ove prečice')}
        {red(<kbd>Esc</kbd>, 'Zatvori dijalog, meni ili prijedloge')}
        {red(
          <>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <kbd>Enter</kbd>
          </>,
          'Izbor prijedloga u pretrazi',
        )}
        {red(<kbd>Tab</kbd>, 'Sljedeći element')}
      </dl>
    </Modal>
  )
}
