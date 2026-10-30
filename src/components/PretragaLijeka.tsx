import { useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import { Search, X } from 'lucide-react'
import type { Lijek } from '../data/mockData'
import { pretraziLijekove } from '../lib/format'
import { OznakaRecept, cx } from './ui'

const MAKS_PRIJEDLOGA = 6

/**
 * Pretraga lijeka s automatskim prijedlozima (ARIA combobox).
 * "velika" je na početnoj, "kompaktna" u gornjoj traci; obje se fokusiraju prečicom "/".
 */
export function PretragaLijeka({ velicina, id }: { velicina: 'velika' | 'kompaktna'; id: string }) {
  const navigate = useNavigate()
  const [upit, setUpit] = useState('')
  const [otvoren, setOtvoren] = useState(false)
  const [aktivni, setAktivni] = useState(-1)
  const listaId = useId()

  const prijedlozi = useMemo(() => pretraziLijekove(upit).slice(0, MAKS_PRIJEDLOGA), [upit])
  const prikaziListu = otvoren && upit.trim().length > 0
  const velika = velicina === 'velika'

  const odaberi = (lijek: Lijek) => {
    setOtvoren(false)
    setUpit('')
    navigate(`/pacijent/pretraga?lijek=${lijek.id}`)
  }

  const naSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (aktivni >= 0 && prijedlozi[aktivni]) return odaberi(prijedlozi[aktivni])
    if (!upit.trim()) return
    const svi = pretraziLijekove(upit)
    if (svi.length === 1) return odaberi(svi[0])
    setOtvoren(false)
    navigate(`/pacijent/pretraga?q=${encodeURIComponent(upit.trim())}`)
    setUpit('')
  }

  const naTipku = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (upit) setUpit('')
      else (e.target as HTMLInputElement).blur()
      setAktivni(-1)
      return
    }
    if (!prikaziListu || prijedlozi.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAktivni((i) => (i + 1) % prijedlozi.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAktivni((i) => (i <= 0 ? prijedlozi.length - 1 : i - 1))
    }
  }

  return (
    <form role="search" onSubmit={naSubmit} className={cx('relative', velika ? 'w-full' : 'w-full max-w-md')}>
      <label htmlFor={id} className={velika ? 'mb-2 block text-lg font-semibold' : 'sr-only'}>
        Koji lijek tražite?
      </label>
      <div className="relative">
        <Search aria-hidden className={cx('pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted', velika ? 'left-5 size-6' : 'left-3.5 size-5')} />
        <input
          id={id}
          data-pretraga={velicina}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={prikaziListu && prijedlozi.length > 0}
          aria-controls={listaId}
          aria-activedescendant={aktivni >= 0 ? `${listaId}-${aktivni}` : undefined}
          aria-describedby={`${id}-pomoc`}
          placeholder={velika ? 'Naziv lijeka ili aktivna tvar, npr. Brufen, paracetamol' : 'Pretraži lijek'}
          value={upit}
          onChange={(e) => {
            setUpit(e.target.value)
            setOtvoren(true)
            setAktivni(-1)
          }}
          onFocus={() => setOtvoren(true)}
          onBlur={() => setOtvoren(false)}
          onKeyDown={naTipku}
          className={cx(
            'w-full border border-border bg-surface placeholder:text-muted focus:border-primary focus:outline-none',
            velika ? 'h-16 rounded-xl pr-14 pl-14 text-lg shadow-[0_1px_0_var(--border)]' : 'h-11 rounded-lg pr-12 pl-11',
          )}
        />
        <span id={`${id}-pomoc`} className="sr-only">
          Strelicama birate prijedlog, Enter otvara rezultate. Prečica: kosa crta.
        </span>
        {upit ? (
          <button
            type="button"
            aria-label="Obriši pretragu"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setUpit('')}
            className={cx('absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-fg', velika ? 'right-2.5' : 'right-0')}
          >
            <X aria-hidden className="size-5" />
          </button>
        ) : (
          <kbd aria-hidden className={cx('absolute top-1/2 -translate-y-1/2', velika ? 'right-5' : 'right-3')}>
            /
          </kbd>
        )}
      </div>

      {prikaziListu && (
        <div className="panel absolute inset-x-0 top-full z-40 mt-1 overflow-hidden shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)]">
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
                    <p>
                      <span className="etiketa text-lg">{l.naziv}</span> <span className="font-semibold text-primary">{l.jacina}</span>
                    </p>
                    <p className="truncate text-sm text-muted">
                      {l.oblik}, {l.aktivnaTvar}
                    </p>
                  </div>
                  {l.naRecept && <OznakaRecept />}
                </li>
              ))}
            </ul>
          ) : (
            <p id={listaId} className="px-4 py-3 text-sm text-muted">
              Nema lijeka „{upit.trim()}" u bazi. Provjerite naziv ili pokušajte s aktivnom tvari, npr. <em>ibuprofen</em>.
            </p>
          )}
        </div>
      )}
    </form>
  )
}
