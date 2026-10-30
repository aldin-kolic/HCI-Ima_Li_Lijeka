import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { ArrowLeft, CircleCheck, CircleX, Clock, FileText, Moon, PackageCheck, TriangleAlert, Ban, Hourglass } from 'lucide-react'
import type { Apoteka, StatusRezervacije, StatusZalihe } from '../data/mockData'
import { STATUS_ZALIHE_TEKST, STATUS_REZERVACIJE_FARMACEUT, STATUS_REZERVACIJE_PACIJENT, opisRadnogVremena } from '../lib/format'

export const cx = (...klase: (string | false | null | undefined)[]) => klase.filter(Boolean).join(' ')

/* ---------- Dugmad ---------- */

type Varijanta = 'primarno' | 'sekundarno' | 'tiho' | 'opasno'

const VARIJANTE: Record<Varijanta, string> = {
  primarno: 'bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-45',
  sekundarno: 'border-2 border-primary text-primary bg-surface hover:bg-primary-soft disabled:opacity-45',
  tiho: 'text-primary hover:bg-primary-soft disabled:opacity-45',
  opasno: 'border-2 border-bad text-bad bg-surface hover:bg-bad-soft disabled:opacity-45',
}

export function Dugme({
  varijanta = 'primarno',
  velicina = 'srednje',
  className,
  children,
  ...props
}: ComponentProps<'button'> & { varijanta?: Varijanta; velicina?: 'srednje' | 'veliko' }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed',
        velicina === 'veliko' ? 'min-h-14 px-5 text-base' : 'min-h-11 px-4 text-sm',
        VARIJANTE[varijanta],
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ---------- Zaglavlje ekrana ---------- */

export function Zaglavlje({ naslov, podnaslov, nazad, desno }: { naslov: string; podnaslov?: string; nazad?: string | true; desno?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-border bg-bg/95 px-2 py-2 backdrop-blur">
      {nazad && (
        <button
          type="button"
          onClick={() => (nazad === true ? navigate(-1) : navigate(nazad))}
          aria-label="Nazad"
          className="grid size-11 shrink-0 place-items-center rounded-xl text-fg hover:bg-surface-2"
        >
          <ArrowLeft aria-hidden className="size-6" />
        </button>
      )}
      <div className={cx('min-w-0 flex-1', !nazad && 'pl-2')}>
        <h1 className="truncate text-lg leading-tight font-bold">{naslov}</h1>
        {podnaslov && <p className="truncate text-sm text-muted">{podnaslov}</p>}
      </div>
      {desno}
    </header>
  )
}

/* ---------- Oznake statusa (boja + ikona + tekst) ---------- */

const ZALIHA_STIL: Record<StatusZalihe, { klase: string; Ikona: typeof CircleCheck }> = {
  na_stanju: { klase: 'bg-ok-soft text-ok border-ok/30', Ikona: CircleCheck },
  malo: { klase: 'bg-warn-soft text-warn border-warn/30', Ikona: TriangleAlert },
  nema: { klase: 'bg-bad-soft text-bad border-bad/30', Ikona: CircleX },
}

export function OznakaZalihe({ status, kratko }: { status: StatusZalihe; kratko?: boolean }) {
  const { klase, Ikona } = ZALIHA_STIL[status]
  const tekst = kratko ? { na_stanju: 'Ima', malo: 'Malo', nema: 'Nema' }[status] : STATUS_ZALIHE_TEKST[status]
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold whitespace-nowrap', klase)}>
      <Ikona aria-hidden className="size-4" />
      {tekst}
    </span>
  )
}

export const IKONA_ZALIHE = { na_stanju: CircleCheck, malo: TriangleAlert, nema: CircleX }

const REZERVACIJA_STIL: Record<StatusRezervacije, { klase: string; Ikona: typeof CircleCheck }> = {
  na_cekanju: { klase: 'bg-info-soft text-info border-info/30', Ikona: Hourglass },
  potvrdjeno: { klase: 'bg-info-soft text-info border-info/30', Ikona: Hourglass },
  spremno: { klase: 'bg-ok-soft text-ok border-ok/30', Ikona: PackageCheck },
  preuzeto: { klase: 'bg-surface-2 text-muted border-border', Ikona: CircleCheck },
  otkazano: { klase: 'bg-bad-soft text-bad border-bad/30', Ikona: Ban },
}

export function OznakaRezervacije({ status, uloga = 'pacijent' }: { status: StatusRezervacije; uloga?: 'pacijent' | 'farmaceut' }) {
  const { klase, Ikona } = REZERVACIJA_STIL[status]
  const tekst = uloga === 'pacijent' ? STATUS_REZERVACIJE_PACIJENT[status] : STATUS_REZERVACIJE_FARMACEUT[status]
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold whitespace-nowrap', klase)}>
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
    <span className="inline-flex items-center gap-1 rounded-md bg-info-soft px-1.5 py-0.5 text-xs font-bold text-info">
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
        'inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors',
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
}: {
  vrijednost: T
  opcije: { vrijednost: T; tekst: string; ikona?: ReactNode }[]
  onChange: (v: T) => void
  oznaka: string
}) {
  return (
    <div role="group" aria-label={oznaka} className="flex rounded-xl bg-surface-2 p-1">
      {opcije.map((o) => (
        <button
          key={o.vrijednost}
          type="button"
          aria-pressed={vrijednost === o.vrijednost}
          onClick={() => onChange(o.vrijednost)}
          className={cx(
            'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors',
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
    <button
      type="button"
      role="switch"
      aria-checked={ukljuceno}
      onClick={() => onChange(!ukljuceno)}
      className="flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left"
    >
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

/* ---------- Stanja: učitavanje i prazno ---------- */

export function SkeletonKartice({ broj = 3 }: { broj?: number }) {
  return (
    <div aria-busy="true" aria-label="Učitavanje…" className="space-y-3">
      {Array.from({ length: broj }, (_, i) => (
        <div key={i} className="kartica space-y-3 p-4">
          <div className="skeleton h-5 w-2/3 rounded-md" />
          <div className="skeleton h-4 w-1/2 rounded-md" />
          <div className="flex gap-2">
            <div className="skeleton h-7 w-28 rounded-full" />
            <div className="skeleton h-7 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PraznoStanje({ ikona, naslov, opis, children }: { ikona: ReactNode; naslov: string; opis?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-primary-soft text-primary">{ikona}</div>
      <h2 className="text-lg font-bold">{naslov}</h2>
      {opis && <p className="mt-1 text-muted">{opis}</p>}
      {children && <div className="mt-5 flex w-full flex-col gap-2">{children}</div>}
    </div>
  )
}

/* ---------- Potvrdni dijalog ---------- */

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
  const odustaniRef = useRef<HTMLButtonElement>(null)
  const potvrdiRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!otvoren) return
    const prethodni = document.activeElement as HTMLElement | null
    odustaniRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOdustani()
      if (e.key === 'Tab') {
        // Zadrži fokus unutar dijaloga
        e.preventDefault()
        const sljedeci = document.activeElement === odustaniRef.current ? potvrdiRef.current : odustaniRef.current
        sljedeci?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prethodni?.focus()
    }
  }, [otvoren, onOdustani])

  const host = document.getElementById('modal-root')
  if (!otvoren || !host) return null

  return createPortal(
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={onOdustani}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dijalog-naslov"
        aria-describedby="dijalog-poruka"
        onClick={(e) => e.stopPropagation()}
        className="kartica w-full p-5 shadow-xl"
      >
        <h2 id="dijalog-naslov" className="text-lg font-bold">
          {naslov}
        </h2>
        <p id="dijalog-poruka" className="mt-2 text-muted">
          {poruka}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2">
          <Dugme ref={odustaniRef} varijanta="sekundarno" onClick={onOdustani}>
            {odustani}
          </Dugme>
          <Dugme ref={potvrdiRef} varijanta={opasno ? 'opasno' : 'primarno'} onClick={onPotvrdi}>
            {potvrdi}
          </Dugme>
        </div>
      </div>
    </div>,
    host,
  )
}
