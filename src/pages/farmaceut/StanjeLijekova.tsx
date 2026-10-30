import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowDown, ArrowUp, ArrowUpDown, Search, SearchX } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { APOTEKA_FARMACEUTA_ID, lijekovi, type Lijek, type StatusZalihe } from '../../data/mockData'
import { STATUS_ZALIHE_TEKST, formatKM, normalizuj, prijeKoliko, punNazivLijeka } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { Dugme, FilterCip, IKONA_ZALIHE, OznakaRecept, Paginacija, PraznoStanje, SkeletonRedovi, ZaglavljeStranice, cx } from '../../components/ui'

const STATUSI: { status: StatusZalihe; tekst: string; aktivno: string }[] = [
  { status: 'na_stanju', tekst: 'Ima', aktivno: 'bg-ok text-surface border-ok' },
  { status: 'malo', tekst: 'Malo', aktivno: 'bg-warn text-surface border-warn' },
  { status: 'nema', tekst: 'Nema', aktivno: 'bg-bad text-surface border-bad' },
]

type Kolona = 'naziv' | 'cijena' | 'stanje' | 'azurirano'
const PO_STRANICI = 8
const RANG = { na_stanju: 0, malo: 1, nema: 2 }

export default function StanjeLijekova() {
  const prikaziToast = useToast()
  const { zalihe, promijeniZalihu } = useApp()
  const [params, setParams] = useSearchParams()
  const [upit, setUpit] = useState('')
  const [sort, setSort] = useState<{ kolona: Kolona; smjer: 1 | -1 }>({ kolona: 'naziv', smjer: 1 })
  const [stranica, setStranica] = useState(1)
  const ucitava = useSimuliranoUcitavanje('zalihe', 500)
  const stanje = zalihe[APOTEKA_FARMACEUTA_ID]
  const filter = (params.get('stanje') as StatusZalihe | null) ?? null

  const postaviFilter = (s: StatusZalihe | null) => {
    setParams(s ? { stanje: s } : {}, { replace: true })
    setStranica(1)
  }

  const vrijednost = (l: Lijek): string | number =>
    sort.kolona === 'naziv' ? l.naziv : sort.kolona === 'cijena' ? l.cijenaKM : sort.kolona === 'stanje' ? RANG[stanje[l.id].status] : stanje[l.id].azuriranoPrijeMin

  const filtrirani = lijekovi
    .filter((l) => normalizuj(`${l.naziv} ${l.jacina} ${l.aktivnaTvar}`).includes(normalizuj(upit)) && (!filter || stanje[l.id].status === filter))
    .sort((a, b) => {
      const [x, y] = [vrijednost(a), vrijednost(b)]
      return (typeof x === 'string' ? x.localeCompare(y as string, 'bs') : x - (y as number)) * sort.smjer
    })
  const ukupnoStranica = Math.max(1, Math.ceil(filtrirani.length / PO_STRANICI))
  const str = Math.min(stranica, ukupnoStranica)
  const prikazani = filtrirani.slice((str - 1) * PO_STRANICI, str * PO_STRANICI)
  const broj = (s: StatusZalihe) => lijekovi.filter((l) => stanje[l.id].status === s).length

  const zaglavlje = (kolona: Kolona, tekst: string, desno?: boolean) => {
    const aktivna = sort.kolona === kolona
    const Ikona = !aktivna ? ArrowUpDown : sort.smjer === 1 ? ArrowUp : ArrowDown
    return (
      <th scope="col" aria-sort={aktivna ? (sort.smjer === 1 ? 'ascending' : 'descending') : 'none'} className={cx('px-3 py-1', desno && 'text-right')}>
        <button
          type="button"
          onClick={() => setSort(aktivna ? { kolona, smjer: sort.smjer === 1 ? -1 : 1 } : { kolona, smjer: 1 })}
          className={cx('inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-semibold hover:text-fg', aktivna && 'text-fg')}
        >
          {tekst}
          <Ikona aria-hidden className="size-4" />
        </button>
      </th>
    )
  }

  return (
    <>
      <ZaglavljeStranice naslov="Stanje lijekova" opis="Promijenite stanje jednim klikom. Pacijenti vide promjenu odmah u rezultatima pretrage." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative">
          <span className="sr-only">Pretraži lijekove</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            id="pretraga-zaliha"
            type="search"
            data-pretraga="kompaktna"
            value={upit}
            onChange={(e) => {
              setUpit(e.target.value)
              setStranica(1)
            }}
            placeholder="Naziv lijeka ili aktivna tvar"
            className="h-11 w-72 rounded-lg border border-border bg-surface pr-3 pl-9 text-sm placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </label>
        <div role="group" aria-label="Filtriraj po stanju" className="flex flex-wrap gap-2">
          <FilterCip aktivan={filter === null} onClick={() => postaviFilter(null)}>
            Sve ({lijekovi.length})
          </FilterCip>
          {STATUSI.map((s) => (
            <FilterCip key={s.status} aktivan={filter === s.status} onClick={() => postaviFilter(filter === s.status ? null : s.status)}>
              {STATUS_ZALIHE_TEKST[s.status]} ({broj(s.status)})
            </FilterCip>
          ))}
        </div>
      </div>

      <section aria-label="Tabela zaliha" className="panel overflow-x-auto">
        {ucitava ? (
          <SkeletonRedovi broj={6} />
        ) : filtrirani.length === 0 ? (
          <PraznoStanje ikona={<SearchX className="size-7" />} naslov="Nema lijekova za ovu pretragu" opis="Provjerite naziv ili uklonite filter stanja.">
            <Dugme
              varijanta="sekundarno"
              onClick={() => {
                setUpit('')
                postaviFilter(null)
              }}
            >
              Očisti pretragu i filter
            </Dugme>
          </PraznoStanje>
        ) : (
          <>
            <table className="w-full min-w-[48rem] text-left">
              <caption className="sr-only">Stanje lijekova u Apoteci Centar. Kolone se sortiraju klikom na naslov.</caption>
              <thead className="bg-surface-2 text-sm text-muted">
                <tr>
                  {zaglavlje('naziv', 'Lijek')}
                  {zaglavlje('cijena', 'Cijena', true)}
                  {zaglavlje('azurirano', 'Ažurirano')}
                  {zaglavlje('stanje', 'Stanje')}
                </tr>
              </thead>
              <tbody className="zebra">
                {prikazani.map((l) => {
                  const stavka = stanje[l.id]
                  return (
                    <tr key={l.id}>
                      <th scope="row" className="px-5 py-3 font-normal">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{l.naziv}</span>
                          <span className="text-muted">{l.jacina}</span>
                          {l.naRecept && <OznakaRecept />}
                        </span>
                        <span className="block text-sm text-muted">
                          {l.oblik}, {l.aktivnaTvar}
                        </span>
                      </th>
                      <td className="px-5 py-3 text-right whitespace-nowrap">{formatKM(l.cijenaKM)}</td>
                      <td className="px-5 py-3 text-sm whitespace-nowrap text-muted">{prijeKoliko(stavka.azuriranoPrijeMin)}</td>
                      <td className="px-5 py-2">
                        <div role="group" aria-label={`Stanje: ${punNazivLijeka(l)}`} className="inline-flex gap-1">
                          {STATUSI.map((s) => {
                            const odabrano = stavka.status === s.status
                            const Ikona = IKONA_ZALIHE[s.status]
                            return (
                              <button
                                key={s.status}
                                type="button"
                                aria-pressed={odabrano}
                                aria-label={STATUS_ZALIHE_TEKST[s.status]}
                                onClick={() => {
                                  if (odabrano) return
                                  promijeniZalihu(APOTEKA_FARMACEUTA_ID, l.id, s.status)
                                  prikaziToast(`${punNazivLijeka(l)}: ${STATUS_ZALIHE_TEKST[s.status].toLowerCase()}`, {
                                    akcija: { tekst: 'Poništi', onClick: () => promijeniZalihu(APOTEKA_FARMACEUTA_ID, l.id, stavka.status, stavka.azuriranoPrijeMin) },
                                  })
                                }}
                                className={cx(
                                  'inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors',
                                  odabrano ? s.aktivno : 'border-border bg-surface text-muted hover:border-fg hover:text-fg',
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
            <Paginacija
              stranica={str}
              ukupnoStranica={ukupnoStranica}
              onChange={setStranica}
              opis={`Prikazano ${(str - 1) * PO_STRANICI + 1}–${Math.min(str * PO_STRANICI, filtrirani.length)} od ${filtrirani.length}`}
            />
          </>
        )}
      </section>
    </>
  )
}
