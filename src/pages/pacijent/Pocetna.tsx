import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router'
import { ChevronRight, ClipboardList, Cross, Moon, ScanBarcode, Search, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { apoteke, cestoTrazeno, lijekPoId, type Lijek } from '../../data/mockData'
import { formatKm, jeAktivna, mnozina, pretraziLijekove } from '../../lib/format'
import { Dugme, OznakaRecept, cx } from '../../components/ui'

const MAKS_PRIJEDLOGA = 6

export default function Pocetna() {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { rezervacije } = useApp()
  const [upit, setUpit] = useState('')
  const [otvoren, setOtvoren] = useState(false)
  const [aktivni, setAktivni] = useState(-1)
  const [skenira, setSkenira] = useState(false)
  const listaId = useId()

  const prijedlozi = useMemo(() => pretraziLijekove(upit).slice(0, MAKS_PRIJEDLOGA), [upit])
  const prikaziListu = otvoren && upit.trim().length > 0

  const odaberi = (lijek: Lijek) => navigate(`/pacijent/pretraga?lijek=${lijek.id}`)

  const naSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (aktivni >= 0 && prijedlozi[aktivni]) return odaberi(prijedlozi[aktivni])
    if (!upit.trim()) return
    const svi = pretraziLijekove(upit)
    if (svi.length === 1) return odaberi(svi[0])
    navigate(`/pacijent/pretraga?q=${encodeURIComponent(upit.trim())}`)
  }

  const naTipku = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!prikaziListu || prijedlozi.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAktivni((i) => (i + 1) % prijedlozi.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAktivni((i) => (i <= 0 ? prijedlozi.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOtvoren(false)
      setAktivni(-1)
    }
  }

  const dezurne = apoteke.filter((a) => a.dezurna).sort((a, b) => a.udaljenostKm - b.udaljenostKm)
  const moje = rezervacije.filter((r) => r.moja && jeAktivna(r.status))
  const spremne = moje.filter((r) => r.status === 'spremno').length

  return (
    <div className="px-4 pt-5 pb-8">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-fg">
          <Cross className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl leading-tight font-extrabold">Ima li lijeka?</h1>
          <p className="text-sm text-muted">Pronađite lijek u apoteci u blizini</p>
        </div>
      </div>

      {/* Pretraga s automatskim prijedlozima */}
      <form role="search" onSubmit={naSubmit} className="relative mt-6">
        <label htmlFor="pretraga-lijeka" className="mb-2 block font-semibold">
          Koji lijek tražite?
        </label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input
            id="pretraga-lijeka"
            type="text"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={prikaziListu && prijedlozi.length > 0}
            aria-controls={listaId}
            aria-activedescendant={aktivni >= 0 ? `${listaId}-${aktivni}` : undefined}
            placeholder="npr. Brufen, paracetamol…"
            value={upit}
            onChange={(e) => {
              setUpit(e.target.value)
              setOtvoren(true)
              setAktivni(-1)
            }}
            onFocus={() => setOtvoren(true)}
            onBlur={() => setOtvoren(false)}
            onKeyDown={naTipku}
            className="h-14 w-full rounded-2xl border-2 border-border bg-surface pr-12 pl-12 text-base placeholder:text-muted focus:border-primary focus:outline-none"
          />
          {upit && (
            <button
              type="button"
              aria-label="Obriši pretragu"
              onClick={() => setUpit('')}
              className="absolute top-1/2 right-1.5 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-muted hover:text-fg"
            >
              <X aria-hidden className="size-5" />
            </button>
          )}
        </div>

        {prikaziListu && (
          <div className="kartica absolute inset-x-0 top-full z-30 mt-1 overflow-hidden shadow-lg">
            {prijedlozi.length > 0 ? (
              <ul id={listaId} role="listbox" aria-label="Prijedlozi lijekova">
                {prijedlozi.map((l, i) => (
                  <li
                    key={l.id}
                    id={`${listaId}-${i}`}
                    role="option"
                    aria-selected={i === aktivni}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => odaberi(l)}
                    className={cx('flex min-h-14 cursor-pointer items-center gap-3 border-b border-border px-4 py-2 last:border-0', i === aktivni ? 'bg-primary-soft' : 'hover:bg-surface-2')}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {l.naziv} {l.jacina}
                      </p>
                      <p className="truncate text-sm text-muted">
                        {l.oblik} · {l.aktivnaTvar}
                      </p>
                    </div>
                    {l.naRecept && <OznakaRecept />}
                  </li>
                ))}
              </ul>
            ) : (
              <p id={listaId} className="px-4 py-3 text-sm text-muted">
                Nismo pronašli „{upit.trim()}". Provjerite naziv ili pokušajte s aktivnom tvari (npr. <em>ibuprofen</em>).
              </p>
            )}
          </div>
        )}
      </form>

      <Dugme varijanta="sekundarno" velicina="veliko" className="mt-3 w-full" onClick={() => setSkenira(true)}>
        <ScanBarcode aria-hidden className="size-5" />
        Skeniraj kutiju lijeka
      </Dugme>

      <section className="mt-6" aria-labelledby="cesto-trazeno">
        <h2 id="cesto-trazeno" className="mb-2 text-sm font-semibold text-muted">
          Često traženo
        </h2>
        <div className="flex flex-wrap gap-2">
          {cestoTrazeno.map((id) => {
            const l = lijekPoId(id)!
            return (
              <button
                key={id}
                type="button"
                onClick={() => odaberi(l)}
                className="min-h-11 rounded-full border-2 border-border bg-surface px-4 text-sm font-semibold hover:border-primary"
              >
                {l.naziv} {l.jacina.split('/')[0]}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-6 space-y-3" aria-label="Brzi pristup">
        <Link to="/pacijent/dezurne" data-bez-podvlake className="kartica flex min-h-20 items-center gap-4 p-4 hover:shadow-md">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Moon className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Dežurne apoteke sada</span>
            <span className="block text-sm text-muted">
              {dezurne.length} {mnozina(dezurne.length, 'dežurna', 'dežurne', 'dežurnih')} večeras · najbliža {formatKm(dezurne[0].udaljenostKm)}
            </span>
          </span>
          <ChevronRight aria-hidden className="size-5 text-muted" />
        </Link>
        <Link to="/pacijent/rezervacije" data-bez-podvlake className="kartica flex min-h-20 items-center gap-4 p-4 hover:shadow-md">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <ClipboardList className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Moje rezervacije</span>
            <span className="block text-sm text-muted">
              {moje.length === 0
                ? 'Nemate aktivnih rezervacija'
                : `${moje.length} ${mnozina(moje.length, 'aktivna', 'aktivne', 'aktivnih')}${spremne ? ` · ${spremne} spremno za preuzimanje` : ''}`}
            </span>
          </span>
          <ChevronRight aria-hidden className="size-5 text-muted" />
        </Link>
      </section>

      {skenira && (
        <Skener
          onOdustani={() => setSkenira(false)}
          onPrepoznato={() => {
            setSkenira(false)
            prikaziToast('Prepoznato: Brufen 400 mg')
            navigate('/pacijent/pretraga?lijek=brufen-400')
          }}
        />
      )}
    </div>
  )
}

/** Simulacija skeniranja kutije: nakon 1,5 s "prepozna" Brufen 400. */
function Skener({ onOdustani, onPrepoznato }: { onOdustani: () => void; onPrepoznato: () => void }) {
  const odustaniRef = useRef<HTMLButtonElement>(null)
  // Callbackovi u ref-u, da se tajmer ne restartuje pri svakom renderu roditelja
  const callbacks = useRef({ onOdustani, onPrepoznato })
  callbacks.current = { onOdustani, onPrepoznato }

  useEffect(() => {
    odustaniRef.current?.focus()
    const t = window.setTimeout(() => callbacks.current.onPrepoznato(), 1500)
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && callbacks.current.onOdustani()
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const host = document.getElementById('modal-root')
  if (!host) return null
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Skeniranje kutije lijeka" className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-neutral-950 px-8 text-white">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border-2 border-white/30 bg-neutral-800">
        <div className="absolute inset-6 rounded-2xl border-4 border-dashed border-white/70" />
        <div className="skener-linija absolute inset-x-6 h-0.5 bg-emerald-300 shadow-[0_0_12px_2px] shadow-emerald-300" />
      </div>
      <div className="text-center" aria-live="polite">
        <p className="text-lg font-bold">Skeniranje kutije…</p>
        <p className="text-sm text-white/80">Držite bar-kod unutar okvira</p>
      </div>
      <button ref={odustaniRef} type="button" onClick={onOdustani} className="min-h-11 rounded-xl border-2 border-white px-6 font-semibold hover:bg-white/10">
        Odustani
      </button>
    </div>,
    host,
  )
}
