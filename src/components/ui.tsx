import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { Ban, ChevronLeft, ChevronRight, CircleCheck, CircleX, Clock, FileText, Hourglass, Moon, PackageCheck, TriangleAlert, X } from 'lucide-react'
import type { Apoteka, Lijek, StatusRezervacije, StatusZalihe } from '../data/mockData'
import { STATUS_REZERVACIJE_FARMACEUT, STATUS_REZERVACIJE_PACIJENT, STATUS_ZALIHE_TEKST, opisRadnogVremena } from '../lib/format'

export const cx = (...klase: (string | false | null | undefined)[]) => klase.filter(Boolean).join(' ')

/* ---------- Dugmad ---------- */

type Varijanta = 'primarno' | 'sekundarno' | 'tiho' | 'opasno' | 'opasno-puno'

const VARIJANTE: Record<Varijanta, string> = {
  primarno: 'bg-primary text-primary-fg hover:bg-primary-hover',
  sekundarno: 'border border-border bg-surface text-fg hover:border-primary hover:text-primary',
  tiho: 'text-primary hover:bg-primary-soft',
  opasno: 'border border-bad/40 bg-surface text-bad hover:bg-bad-soft',
  'opasno-puno': 'bg-bad text-surface hover:opacity-90',
}

export function Dugme({
  varijanta = 'primarno',
  velicina = 'srednje',
  className,
  children,
  ...props
}: ComponentProps<'button'> & { varijanta?: Varijanta; velicina?: 'malo' | 'srednje' | 'veliko' }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        velicina === 'veliko' ? 'min-h-12 px-5 text-base' : velicina === 'malo' ? 'min-h-11 px-3 text-sm' : 'min-h-11 px-4 text-sm',
        VARIJANTE[varijanta],
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Ikonsko dugme – uvijek ima aria-label i tooltip s istim tekstom. */
export function IkonaDugme({ oznaka, className, children, ...props }: ComponentProps<'button'> & { oznaka: string }) {
  return (
    <button
      type="button"
      aria-label={oznaka}
      data-tooltip={oznaka}
      {...props}
      className={cx('relative grid size-11 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg', className)}
    >
      {children}
    </button>
  )
}

/* ---------- Zaglavlje stranice s mrvicama (breadcrumbs) ---------- */

export function ZaglavljeStranice({
  naslov,
  opis,
  mrvice,
  akcije,
  children,
}: {
  naslov: ReactNode
  opis?: ReactNode
  mrvice?: { tekst: string; to?: string }[]
  akcije?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="mb-6">
      {mrvice && (
        <nav aria-label="Putanja" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
            {mrvice.map((m, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight aria-hidden className="size-3.5" />}
                {m.to ? (
                  <Link to={m.to} className="rounded px-0.5 hover:text-primary hover:underline">
                    {m.tekst}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-fg">
                    {m.tekst}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[2rem]">{naslov}</h1>
          {opis && <p className="mt-1 max-w-[65ch] text-muted">{opis}</p>}
        </div>
        {akcije && <div className="flex flex-wrap gap-2">{akcije}</div>}
      </div>
      {children}
    </div>
  )
}

/* ---------- Naziv lijeka kao etiketa s kutije ---------- */

export function EtiketaLijeka({ lijek, velicina = 'srednja' }: { lijek: Lijek; velicina?: 'mala' | 'srednja' | 'velika' }) {
  const naziv = velicina === 'velika' ? 'text-[2.25rem] leading-none' : velicina === 'mala' ? 'text-base leading-tight' : 'text-xl leading-tight'
  const jacina = velicina === 'velika' ? 'text-base px-2 py-0.5' : 'text-xs px-1.5 py-px'
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={cx('etiketa', naziv)}>{lijek.naziv}</span>
      <span className={cx('rounded-sm border-l-4 border-primary bg-primary-soft font-semibold whitespace-nowrap text-primary', jacina)}>{lijek.jacina}</span>
    </span>
  )
}

/* ---------- Oznake statusa (boja + ikona + tekst, nikad samo boja) ---------- */

const ZALIHA_STIL: Record<StatusZalihe, { klase: string; Ikona: typeof CircleCheck }> = {
  na_stanju: { klase: 'bg-ok-soft text-ok', Ikona: CircleCheck },
  malo: { klase: 'bg-warn-soft text-warn', Ikona: TriangleAlert },
  nema: { klase: 'bg-bad-soft text-bad', Ikona: CircleX },
}

export const IKONA_ZALIHE = { na_stanju: CircleCheck, malo: TriangleAlert, nema: CircleX }

export function OznakaZalihe({ status, kratko }: { status: StatusZalihe; kratko?: boolean }) {
  const { klase, Ikona } = ZALIHA_STIL[status]
  const tekst = kratko ? { na_stanju: 'Ima', malo: 'Malo', nema: 'Nema' }[status] : STATUS_ZALIHE_TEKST[status]
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-semibold whitespace-nowrap', klase)}>
      <Ikona aria-hidden className="size-4" />
      {tekst}
    </span>
  )
}

const REZERVACIJA_STIL: Record<StatusRezervacije, { klase: string; Ikona: typeof CircleCheck }> = {
  na_cekanju: { klase: 'bg-info-soft text-info', Ikona: Hourglass },
  potvrdjeno: { klase: 'bg-info-soft text-info', Ikona: Hourglass },
  spremno: { klase: 'bg-ok-soft text-ok', Ikona: PackageCheck },
  preuzeto: { klase: 'bg-surface-2 text-muted', Ikona: CircleCheck },
  otkazano: { klase: 'bg-bad-soft text-bad', Ikona: Ban },
}

export function OznakaRezervacije({ status, uloga = 'pacijent' }: { status: StatusRezervacije; uloga?: 'pacijent' | 'farmaceut' }) {
  const { klase, Ikona } = REZERVACIJA_STIL[status]
  const tekst = uloga === 'pacijent' ? STATUS_REZERVACIJE_PACIJENT[status] : STATUS_REZERVACIJE_FARMACEUT[status]
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-semibold whitespace-nowrap', klase)}>
      <Ikona aria-hidden className="size-4" />
      {tekst}
    </span>
  )
}

export function OznakaRadnogVremena({ apoteka }: { apoteka: Apoteka }) {
  const { tekst, otvoreno } = opisRadnogVremena(apoteka)
  const Ikona = apoteka.dezurna ? Moon : Clock
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-sm font-medium', otvoreno ? 'text-ok' : 'text-muted')}>
      <Ikona aria-hidden className="size-4 shrink-0" />
      {tekst}
    </span>
  )
}

export function OznakaRecept() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-info-soft px-1.5 py-0.5 text-xs font-bold text-info" data-tooltip="Izdaje se samo uz recept ljekara">
      <FileText aria-hidden className="size-3.5" />
      Na recept
    </span>
  )
}

/* ---------- Kontrole ---------- */

export function FilterCip({ aktivan, onClick, children }: { aktivan: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={aktivan}
      onClick={onClick}
      className={cx(
        'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors',
        aktivan ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-surface text-fg hover:border-primary',
      )}
    >
      {aktivan && <CircleCheck aria-hidden className="size-4" />}
      {children}
    </button>
  )
}

export function Segmenti<T extends string>({
  vrijednost,
  opcije,
  onChange,
  oznaka,
  className,
}: {
  vrijednost: T
  opcije: { vrijednost: T; tekst: string; ikona?: ReactNode }[]
  onChange: (v: T) => void
  oznaka: string
  className?: string
}) {
  return (
    <div role="group" aria-label={oznaka} className={cx('inline-flex rounded-lg border border-border bg-surface-2 p-1', className)}>
      {opcije.map((o) => (
        <button
          key={o.vrijednost}
          type="button"
          aria-pressed={vrijednost === o.vrijednost}
          onClick={() => onChange(o.vrijednost)}
          className={cx(
            'flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold whitespace-nowrap transition-colors',
            vrijednost === o.vrijednost ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
          )}
        >
          {o.ikona}
          {o.tekst}
        </button>
      ))}
    </div>
  )
}

export function Prekidac({ ukljuceno, onChange, oznaka, opis }: { ukljuceno: boolean; onChange: (v: boolean) => void; oznaka: string; opis?: string }) {
  return (
    <button type="button" role="switch" aria-checked={ukljuceno} onClick={() => onChange(!ukljuceno)} className="flex min-h-16 w-full items-center gap-4 px-5 py-3 text-left hover:bg-surface-2/60">
      <span className="flex-1">
        <span className="block font-semibold">{oznaka}</span>
        {opis && <span className="block text-sm text-muted">{opis}</span>}
      </span>
      <span aria-hidden className={cx('relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors', ukljuceno ? 'border-primary bg-primary' : 'border-muted bg-surface-2')}>
        <span className={cx('absolute top-0.5 size-5 rounded-full transition-all', ukljuceno ? 'left-[1.4rem] bg-primary-fg' : 'left-0.5 bg-muted')} />
      </span>
    </button>
  )
}

export function Paginacija({ stranica, ukupnoStranica, onChange, opis }: { stranica: number; ukupnoStranica: number; onChange: (s: number) => void; opis: string }) {
  if (ukupnoStranica <= 1) return <p className="px-5 py-3 text-sm text-muted">{opis}</p>
  return (
    <nav aria-label="Stranice tabele" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
      <p className="text-sm text-muted">{opis}</p>
      <div className="flex items-center gap-1">
        <IkonaDugme oznaka="Prethodna stranica" disabled={stranica === 1} onClick={() => onChange(stranica - 1)} className="disabled:opacity-40">
          <ChevronLeft aria-hidden className="size-5" />
        </IkonaDugme>
        {Array.from({ length: ukupnoStranica }, (_, i) => i + 1).map((s) => (
          <button
            key={s}
            type="button"
            aria-current={s === stranica ? 'page' : undefined}
            aria-label={`Stranica ${s}`}
            onClick={() => onChange(s)}
            className={cx('grid size-11 place-items-center rounded-lg text-sm font-semibold', s === stranica ? 'bg-primary text-primary-fg' : 'hover:bg-surface-2')}
          >
            {s}
          </button>
        ))}
        <IkonaDugme oznaka="Sljedeća stranica" disabled={stranica === ukupnoStranica} onClick={() => onChange(stranica + 1)} className="disabled:opacity-40">
          <ChevronRight aria-hidden className="size-5" />
        </IkonaDugme>
      </div>
    </nav>
  )
}

/* ---------- Stanja: učitavanje i prazno ---------- */

export function SkeletonRedovi({ broj = 4 }: { broj?: number }) {
  return (
    <div aria-busy="true" aria-label="Učitavanje…" className="divide-y divide-border">
      {Array.from({ length: broj }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-1/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
          <div className="skeleton h-7 w-28 rounded-md" />
          <div className="skeleton h-11 w-28 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function PraznoStanje({ ikona, naslov, opis, children }: { ikona: ReactNode; naslov: string; opis?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-full bg-primary-soft text-primary">{ikona}</div>
      <h2 className="text-xl">{naslov}</h2>
      {opis && <p className="mt-1 max-w-[52ch] text-muted">{opis}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}

/* ---------- Modal (zadržava fokus, Esc zatvara, klik izvan ne gubi unos) ---------- */

const FOKUSABILNI = 'button:not(:disabled), [href], input:not(:disabled), textarea:not(:disabled), select, [tabindex]:not([tabindex="-1"])'

export function Modal({
  otvoren,
  onZatvori,
  naslovId,
  opisId,
  uloga = 'dialog',
  sirina = 'max-w-lg',
  children,
}: {
  otvoren: boolean
  onZatvori: () => void
  naslovId: string
  opisId?: string
  uloga?: 'dialog' | 'alertdialog'
  sirina?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onZatvoriRef = useRef(onZatvori)
  onZatvoriRef.current = onZatvori

  useEffect(() => {
    if (!otvoren) return
    const prethodni = document.activeElement as HTMLElement | null
    const prvi = ref.current?.querySelector<HTMLElement>('[data-autofokus]') ?? ref.current?.querySelector<HTMLElement>(FOKUSABILNI)
    prvi?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onZatvoriRef.current()
      }
      if (e.key === 'Tab' && ref.current) {
        const el = [...ref.current.querySelectorAll<HTMLElement>(FOKUSABILNI)]
        if (el.length === 0) return
        const [prviEl, zadnji] = [el[0], el[el.length - 1]]
        if (e.shiftKey && document.activeElement === prviEl) {
          e.preventDefault()
          zadnji.focus()
        } else if (!e.shiftKey && document.activeElement === zadnji) {
          e.preventDefault()
          prviEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = overflow
      prethodni?.focus()
    }
  }, [otvoren])

  if (!otvoren) return null
  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[rgb(6_20_15/0.55)] p-4">
      <div ref={ref} role={uloga} aria-modal="true" aria-labelledby={naslovId} aria-describedby={opisId} className={cx('panel ulaz w-full shadow-2xl', sirina)}>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function ZaglavljeModala({ id, naslov, onZatvori }: { id: string; naslov: ReactNode; onZatvori: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
      <h2 id={id} className="pt-2 text-xl">
        {naslov}
      </h2>
      <IkonaDugme oznaka="Zatvori" onClick={onZatvori}>
        <X aria-hidden className="size-5" />
      </IkonaDugme>
    </div>
  )
}

export function PotvrdniDijalog({
  otvoren,
  naslov,
  poruka,
  potvrdi,
  odustani = 'Odustani',
  opasno,
  onPotvrdi,
  onOdustani,
}: {
  otvoren: boolean
  naslov: string
  poruka: string
  potvrdi: string
  odustani?: string
  opasno?: boolean
  onPotvrdi: () => void
  onOdustani: () => void
}) {
  return (
    <Modal otvoren={otvoren} onZatvori={onOdustani} naslovId="dijalog-naslov" opisId="dijalog-poruka" uloga="alertdialog" sirina="max-w-md">
      <div className="p-6">
        <h2 id="dijalog-naslov" className="text-xl">
          {naslov}
        </h2>
        <p id="dijalog-poruka" className="mt-2 text-muted">
          {poruka}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Dugme varijanta="sekundarno" onClick={onOdustani} data-autofokus>
            {odustani}
          </Dugme>
          <Dugme varijanta={opasno ? 'opasno-puno' : 'primarno'} onClick={onPotvrdi}>
            {potvrdi}
          </Dugme>
        </div>
      </div>
    </Modal>
  )
}
