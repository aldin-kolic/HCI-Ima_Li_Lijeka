import type { KeyboardEvent } from 'react'
import { MOJA_LOKACIJA, type Apoteka, type StatusZalihe } from '../data/mockData'
import { STATUS_ZALIHE_TEKST } from '../lib/format'

export type StatusPina = StatusZalihe | 'dezurna'

export interface PinMape {
  apoteka: Apoteka
  status: StatusPina
}

const BOJA: Record<StatusPina, string> = {
  na_stanju: 'var(--ok)',
  malo: 'var(--warn)',
  nema: 'var(--bad)',
  dezurna: 'var(--primary)',
}

/** Znak unutar pina – status se ne prenosi samo bojom. */
function Znak({ status }: { status: StatusPina }) {
  const stil = { stroke: 'var(--surface)', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  switch (status) {
    case 'na_stanju':
      return <path d="M-4.5,-19 l3,3.2 l6,-6.4" {...stil} />
    case 'malo':
      return (
        <>
          <path d="M0,-24.5 L0,-19" {...stil} />
          <circle cx="0" cy="-14.8" r="1.5" fill="var(--surface)" />
        </>
      )
    case 'nema':
      return <path d="M-4,-23 L4,-15 M4,-23 L-4,-15" {...stil} />
    case 'dezurna':
      return <path d="M0,-24 L0,-14 M-5,-19 L5,-19" {...stil} />
  }
}

export function SvgMapa({ pinovi, odabrana, onOdaberi }: { pinovi: PinMape[]; odabrana?: string; onOdaberi: (id: string) => void }) {
  const naTipku = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOdaberi(id)
    }
  }

  // Odabrani pin se crta zadnji da bude iznad ostalih
  const sortirani = [...pinovi].sort((a, b) => Number(a.apoteka.id === odabrana) - Number(b.apoteka.id === odabrana))

  return (
    <div className="panel overflow-hidden">
      <svg viewBox="0 0 360 260" className="block h-auto w-full" role="group" aria-label="Mapa dijela Sarajeva s apotekama">
        <rect width="360" height="260" fill="var(--map-land)" />
        {/* Brda */}
        <path d="M0,0 H360 V70 C320,82 290,48 250,36 C210,26 180,70 130,74 C80,78 40,96 0,104 Z" fill="var(--map-hill)" />
        <path d="M120,260 C150,224 200,214 250,200 C300,188 330,176 360,170 V260 Z" fill="var(--map-hill)" />
        {/* Parkovi */}
        <ellipse cx="246" cy="96" rx="12" ry="8" fill="var(--map-park)" />
        <ellipse cx="18" cy="238" rx="26" ry="14" fill="var(--map-park)" />
        {/* Ceste */}
        <g stroke="var(--map-road)" strokeLinecap="round" fill="none">
          <path d="M0,178 C60,162 120,142 180,130 S244,114 300,104 L360,96" strokeWidth="6" />
          <path d="M256,30 L262,78 L278,108" strokeWidth="4" />
          <path d="M170,196 L214,170 L252,152" strokeWidth="4" />
          <path d="M34,206 L72,186 L112,166" strokeWidth="4" />
          <path d="M96,162 L128,130" strokeWidth="3" />
        </g>
        {/* Miljacka */}
        <path d="M0,196 C40,190 80,182 120,170 S200,148 240,141 S300,127 360,120" stroke="var(--map-water)" strokeWidth="7" fill="none" strokeLinecap="round" />
        <text x="306" y="140" fontSize="9" fontStyle="italic" fill="var(--map-label)">
          Miljacka
        </text>
        <text x="300" y="232" fontSize="9" fill="var(--map-label)">
          Trebević
        </text>

        {/* Moja lokacija */}
        <g aria-label="Vaša lokacija" role="img">
          <circle cx={MOJA_LOKACIJA.x} cy={MOJA_LOKACIJA.y} r="11" fill="var(--info)" opacity="0.18" />
          <circle cx={MOJA_LOKACIJA.x} cy={MOJA_LOKACIJA.y} r="5.5" fill="var(--info)" stroke="var(--surface)" strokeWidth="2" />
        </g>

        {sortirani.map(({ apoteka, status }) => {
          const aktivna = apoteka.id === odabrana
          return (
            <g
              key={apoteka.id}
              role="button"
              tabIndex={0}
              aria-pressed={aktivna}
              aria-label={`${apoteka.naziv}, ${status === 'dezurna' ? 'dežurna' : STATUS_ZALIHE_TEKST[status].toLowerCase()}`}
              onClick={() => onOdaberi(apoteka.id)}
              onKeyDown={(e) => naTipku(e, apoteka.id)}
              transform={`translate(${apoteka.mapa.x} ${apoteka.mapa.y}) scale(${aktivna ? 1.3 : 1})`}
              className="cursor-pointer outline-none [&:focus-visible>.fokus]:opacity-100"
            >
              {/* Nevidljiva površina za dodir: r=25 u viewBoxu ≈ 45 px kad je mapa široka ~330 px */}
              <circle cx="0" cy="-14" r="25" fill="transparent" />
              <circle className="fokus" cx="0" cy="-17" r="16" fill="none" stroke="var(--focus)" strokeWidth="3" opacity="0" />
              <path
                d="M0,0 C-2,-6 -11,-10 -11,-19 a11,11 0 1,1 22,0 C11,-10 2,-6 0,0 Z"
                fill={BOJA[status]}
                stroke={aktivna ? 'var(--fg)' : 'var(--surface)'}
                strokeWidth={aktivna ? 2 : 1.5}
              />
              <Znak status={status} />
              <text y="12" textAnchor="middle" fontSize="8.5" fontWeight={aktivna ? 700 : 600} fill="var(--map-label)" paintOrder="stroke" stroke="var(--map-land)" strokeWidth="3">
                {apoteka.naselje}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function LegendaMape({ dezurne }: { dezurne?: boolean }) {
  const stavke: { status: StatusPina; tekst: string }[] = dezurne
    ? [{ status: 'dezurna', tekst: 'Dežurna apoteka' }]
    : [
        { status: 'na_stanju', tekst: 'Na stanju' },
        { status: 'malo', tekst: 'Malo' },
        { status: 'nema', tekst: 'Nema' },
      ]
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Legenda mape">
      {stavke.map((s) => (
        <li key={s.status} className="flex items-center gap-1.5">
          <svg viewBox="-12 -31 24 32" className="h-5 w-4" aria-hidden>
            <path d="M0,0 C-2,-6 -11,-10 -11,-19 a11,11 0 1,1 22,0 C11,-10 2,-6 0,0 Z" fill={BOJA[s.status]} />
            <Znak status={s.status} />
          </svg>
          {s.tekst}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-3 rounded-full border-2 border-surface bg-info" />
        Vi ste ovdje
      </li>
    </ul>
  )
}
