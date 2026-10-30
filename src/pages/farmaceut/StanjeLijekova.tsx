import { useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { APOTEKA_FARMACEUTA_ID, apotekaPoId, lijekovi, type StatusZalihe } from '../../data/mockData'
import { STATUS_ZALIHE_TEKST, normalizuj, prijeKoliko, punNazivLijeka } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { Dugme, FilterCip, IKONA_ZALIHE, OznakaRecept, PraznoStanje, Zaglavlje, cx } from '../../components/ui'

const STATUSI: { status: StatusZalihe; tekst: string; aktivno: string }[] = [
  { status: 'na_stanju', tekst: 'Ima', aktivno: 'bg-ok text-surface border-ok' },
  { status: 'malo', tekst: 'Malo', aktivno: 'bg-warn text-surface border-warn' },
  { status: 'nema', tekst: 'Nema', aktivno: 'bg-bad text-surface border-bad' },
]

export default function StanjeLijekova() {
  const prikaziToast = useToast()
  const { zalihe, promijeniZalihu } = useApp()
  const [upit, setUpit] = useState('')
  const [filter, setFilter] = useState<StatusZalihe | null>(null)
  const ucitava = useSimuliranoUcitavanje('zalihe', 500)
  const apoteka = apotekaPoId(APOTEKA_FARMACEUTA_ID)!
  const stanje = zalihe[APOTEKA_FARMACEUTA_ID]

  const prikazani = lijekovi.filter(
    (l) => normalizuj(`${l.naziv} ${l.jacina} ${l.aktivnaTvar}`).includes(normalizuj(upit)) && (!filter || stanje[l.id].status === filter),
  )

  const broj = (s: StatusZalihe) => lijekovi.filter((l) => stanje[l.id].status === s).length

  return (
    <>
      <Zaglavlje naslov="Stanje lijekova" podnaslov={apoteka.naziv} />
      <div className="space-y-3 p-4">
        <div className="relative">
          <label htmlFor="pretraga-zaliha" className="sr-only">
            Pretraži lijekove
          </label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input
            id="pretraga-zaliha"
            type="search"
            value={upit}
            onChange={(e) => setUpit(e.target.value)}
            placeholder="Pretraži lijek ili aktivnu tvar"
            className="h-12 w-full rounded-xl border-2 border-border bg-surface pr-3 pl-12 placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtriraj po stanju">
          <FilterCip aktivan={filter === null} onClick={() => setFilter(null)}>
            Sve ({lijekovi.length})
          </FilterCip>
          {STATUSI.map((s) => (
            <FilterCip key={s.status} aktivan={filter === s.status} onClick={() => setFilter(filter === s.status ? null : s.status)}>
              {s.tekst} ({broj(s.status)})
            </FilterCip>
          ))}
        </div>

        {ucitava ? (
          <div aria-busy="true" className="kartica divide-y divide-border">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="skeleton h-5 flex-1 rounded-md" />
                <div className="skeleton h-11 w-40 rounded-xl" />
              </div>
            ))}
          </div>
        ) : prikazani.length === 0 ? (
          <PraznoStanje ikona={<SearchX className="size-8" />} naslov="Nema lijekova za ovu pretragu" opis="Provjerite naziv ili uklonite filter.">
            <Dugme
              varijanta="sekundarno"
              onClick={() => {
                setUpit('')
                setFilter(null)
              }}
            >
              Očisti pretragu i filter
            </Dugme>
          </PraznoStanje>
        ) : (
          <table className="kartica block w-full overflow-hidden">
            <caption className="sr-only">Stanje lijekova u apoteci {apoteka.naziv}. Status se mijenja jednim dodirom.</caption>
            <thead className="block bg-surface-2 text-left text-xs font-semibold text-muted">
              <tr className="flex justify-between">
                <th scope="col" className="px-3 py-2">
                  Lijek
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Stanje
                </th>
              </tr>
            </thead>
            <tbody className="block">
              {prikazani.map((l) => {
                const stavka = stanje[l.id]
                return (
                  // Red se prelama: kad nema mjesta (veći font), dugmad prelaze ispod naziva
                  <tr key={l.id} className="flex flex-wrap items-center justify-between gap-x-2 border-t border-border px-3 py-3">
                    <th scope="row" className="min-w-[8.5rem] flex-1 text-left font-normal">
                      <span className="block leading-tight font-semibold">{l.naziv}</span>
                      <span className="block text-sm text-muted">
                        {l.jacina} · {l.oblik}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        {l.naRecept && <OznakaRecept />}
                        {prijeKoliko(stavka.azuriranoPrijeMin)}
                      </span>
                    </th>
                    <td className="ml-auto pt-1">
                      <div role="group" aria-label={`Stanje: ${punNazivLijeka(l)}`} className="inline-flex gap-1">
                        {STATUSI.map((s) => {
                          const odabrano = stavka.status === s.status
                          const Ikona = IKONA_ZALIHE[s.status]
                          return (
                            <button
                              key={s.status}
                              type="button"
                              aria-pressed={odabrano}
                              aria-label={`${STATUS_ZALIHE_TEKST[s.status]}`}
                              onClick={() => {
                                if (odabrano) return
                                promijeniZalihu(APOTEKA_FARMACEUTA_ID, l.id, s.status)
                                prikaziToast(`${punNazivLijeka(l)}: ${STATUS_ZALIHE_TEKST[s.status].toLowerCase()}`, {
                                  akcija: { tekst: 'Poništi', onClick: () => promijeniZalihu(APOTEKA_FARMACEUTA_ID, l.id, stavka.status) },
                                })
                              }}
                              className={cx(
                                'flex h-12 w-12 flex-col items-center justify-center rounded-xl border-2 text-[0.7rem] font-bold transition-colors',
                                odabrano ? s.aktivno : 'border-border bg-surface text-muted hover:border-fg',
                              )}
                            >
                              <Ikona aria-hidden className="size-4" />
                              {s.tekst}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
