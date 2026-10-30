import { useState } from 'react'
import { BarChart3, Table } from 'lucide-react'
import { mnozina } from '../lib/format'
import { Segmenti } from './ui'

/**
 * Stubičasti grafikon jedne serije (rezervacije po satu).
 * Prema dataviz skillu: jedna boja (provjerena validatorom), bez legende jer naslov imenuje seriju,
 * tanki stupci s razmakom, zaobljen samo vrh, prigušena mreža, oznaka samo na vrhuncu i trenutnom satu,
 * tooltip na prelazak mišem i tabelarni prikaz kao alternativa.
 */
export function GrafikonPoSatu({ podaci, trenutniSat, naslovId }: { podaci: { sat: number; broj: number }[]; trenutniSat: number; naslovId: string }) {
  const [prikaz, setPrikaz] = useState<'grafikon' | 'tabela'>('grafikon')
  const [hover, setHover] = useState<number | null>(null)

  const W = 640
  const H = 240
  const lijevo = 32
  const dno = 28
  const vrh = 20
  const maks = Math.max(10, ...podaci.map((p) => p.broj))
  const korak = (W - lijevo) / podaci.length
  const sirina = korak - 8
  const y = (v: number) => H - dno - (v / maks) * (H - dno - vrh)
  const vrhunac = podaci.reduce((a, b) => (b.broj > a.broj ? b : a))
  const ukupno = podaci.reduce((s, p) => s + p.broj, 0)
  const mreza = [0, 5, 10].filter((v) => v <= maks)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Ukupno danas: <strong className="text-fg">{ukupno}</strong>. Najviše u {String(vrhunac.sat).padStart(2, '0')} h ({vrhunac.broj}).
        </p>
        <Segmenti
          oznaka="Prikaz podataka"
          vrijednost={prikaz}
          onChange={setPrikaz}
          opcije={[
            { vrijednost: 'grafikon', tekst: 'Grafikon', ikona: <BarChart3 aria-hidden className="size-4" /> },
            { vrijednost: 'tabela', tekst: 'Tabela', ikona: <Table aria-hidden className="size-4" /> },
          ]}
        />
      </div>

      {prikaz === 'tabela' ? (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Broj rezervacija po satu</caption>
            <thead className="sticky top-0 bg-surface-2 text-muted">
              <tr>
                <th scope="col" className="px-4 py-2">
                  Sat
                </th>
                <th scope="col" className="px-4 py-2 text-right">
                  Rezervacije
                </th>
              </tr>
            </thead>
            <tbody className="zebra">
              {podaci.map((p) => (
                <tr key={p.sat}>
                  <th scope="row" className="px-4 py-1.5 font-normal">
                    {String(p.sat).padStart(2, '0')}:00 – {String(p.sat + 1).padStart(2, '0')}:00
                  </th>
                  <td className="px-4 py-1.5 text-right font-semibold">{p.broj}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            role="img"
            aria-labelledby={naslovId}
            aria-describedby={`${naslovId}-opis`}
            onMouseLeave={() => setHover(null)}
          >
            <desc id={`${naslovId}-opis`}>
              Rezervacije po satu od 08 do 22 h. Ukupno {ukupno}, najviše u {vrhunac.sat} h ({vrhunac.broj}). Za tačne vrijednosti izaberite prikaz Tabela.
            </desc>
            {mreza.map((v) => (
              <g key={v}>
                <line x1={lijevo} x2={W} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={v === 0 ? 1.5 : 1} />
                <text x={lijevo - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
                  {v}
                </text>
              </g>
            ))}
            {podaci.map((p, i) => {
              const x = lijevo + i * korak + 4
              const yv = y(p.broj)
              const h = H - dno - yv
              const r = Math.min(4, h)
              const aktivno = hover === i
              const istakni = p.sat === vrhunac.sat || p.sat === trenutniSat
              return (
                <g key={p.sat} onMouseEnter={() => setHover(i)}>
                  {/* Površina za hover veća od stupca */}
                  <rect x={lijevo + i * korak} y={vrh} width={korak} height={H - dno - vrh} fill={aktivno ? 'var(--surface-2)' : 'transparent'} />
                  <path
                    d={`M${x},${H - dno} V${yv + r} Q${x},${yv} ${x + r},${yv} H${x + sirina - r} Q${x + sirina},${yv} ${x + sirina},${yv + r} V${H - dno} Z`}
                    fill="var(--chart)"
                    opacity={hover === null || aktivno ? 1 : 0.55}
                  />
                  {istakni && (
                    <text x={x + sirina / 2} y={yv - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--fg)">
                      {p.broj}
                    </text>
                  )}
                  <text x={x + sirina / 2} y={H - 8} textAnchor="middle" fontSize="11" fill={p.sat === trenutniSat ? 'var(--fg)' : 'var(--muted)'} fontWeight={p.sat === trenutniSat ? 700 : 400}>
                    {String(p.sat).padStart(2, '0')}
                  </text>
                </g>
              )
            })}
          </svg>
          {hover !== null && (
            <div
              role="tooltip"
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md bg-fg px-2.5 py-1.5 text-sm whitespace-nowrap text-bg shadow"
              style={{ left: `${((lijevo + hover * korak + korak / 2) / W) * 100}%` }}
            >
              {String(podaci[hover].sat).padStart(2, '0')}:00–{String(podaci[hover].sat + 1).padStart(2, '0')}:00: <strong>{podaci[hover].broj}</strong>{' '}
              {mnozina(podaci[hover].broj, 'rezervacija', 'rezervacije', 'rezervacija')}
              {podaci[hover].sat === trenutniSat && ' (sada)'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
