import { Fragment, useCallback, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ChevronDown, ClipboardList, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { apotekaPoId, lijekPoId, type Rezervacija } from '../../data/mockData'
import { formatDatum, formatKM, formatVrijeme, jeAktivna, normalizuj, opisRoka, punNazivLijeka } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { Dugme, OznakaRezervacije, PotvrdniDijalog, PraznoStanje, Segmenti, SkeletonRedovi, ZaglavljeStranice, cx } from '../../components/ui'

type Kartica = 'aktivne' | 'zavrsene'

export default function MojeRezervacije() {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const [params, setParams] = useSearchParams()
  const { rezervacije, promijeniStatusRezervacije } = useApp()
  const kartica: Kartica = params.get('prikaz') === 'zavrsene' ? 'zavrsene' : 'aktivne'
  const ucitava = useSimuliranoUcitavanje(kartica, 450)
  const [upit, setUpit] = useState('')
  const [otvoreni, setOtvoreni] = useState<string | null>(null)
  const [zaOtkazivanje, setZaOtkazivanje] = useState<Rezervacija | null>(null)

  const moje = rezervacije.filter((r) => r.moja).sort((a, b) => b.kreirano.getTime() - a.kreirano.getTime())
  const aktivne = moje.filter((r) => jeAktivna(r.status))
  const zavrsene = moje.filter((r) => !jeAktivna(r.status))
  const prikazane = (kartica === 'aktivne' ? aktivne : zavrsene).filter((r) => {
    const l = lijekPoId(r.lijekId)!
    const a = apotekaPoId(r.apotekaId)!
    return normalizuj(`${r.kod} ${l.naziv} ${a.naziv}`).includes(normalizuj(upit))
  })

  const odustani = useCallback(() => setZaOtkazivanje(null), [])
  const otkazi = () => {
    if (!zaOtkazivanje) return
    promijeniStatusRezervacije(zaOtkazivanje.id, 'otkazano', { razlog: 'Otkazao pacijent' })
    prikaziToast(`Rezervacija ${zaOtkazivanje.kod} je otkazana`)
    setZaOtkazivanje(null)
  }

  return (
    <>
      <ZaglavljeStranice naslov="Moje rezervacije" opis="Rezervisani lijek čeka vas 2 sata. Kad apoteka pripremi lijek, dobit ćete obavještenje." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmenti<Kartica>
          oznaka="Vrsta rezervacija"
          vrijednost={kartica}
          onChange={(v) => setParams(v === 'zavrsene' ? { prikaz: 'zavrsene' } : {}, { replace: true })}
          opcije={[
            { vrijednost: 'aktivne', tekst: `Aktivne (${aktivne.length})` },
            { vrijednost: 'zavrsene', tekst: `Završene (${zavrsene.length})` },
          ]}
        />
        <label className="relative">
          <span className="sr-only">Pretraži rezervacije</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={upit}
            onChange={(e) => setUpit(e.target.value)}
            placeholder="Kod, lijek ili apoteka"
            className="h-11 w-64 rounded-lg border border-border bg-surface pr-3 pl-9 text-sm placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      <section aria-label={kartica === 'aktivne' ? 'Aktivne rezervacije' : 'Završene rezervacije'} className="panel overflow-x-auto">
        {ucitava ? (
          <SkeletonRedovi broj={3} />
        ) : prikazane.length === 0 ? (
          upit ? (
            <PraznoStanje ikona={<Search className="size-7" />} naslov="Nema rezervacija za ovu pretragu" opis={`Nijedna rezervacija ne sadrži „${upit}".`}>
              <Dugme varijanta="sekundarno" onClick={() => setUpit('')}>
                Očisti pretragu
              </Dugme>
            </PraznoStanje>
          ) : (
            <PraznoStanje
              ikona={<ClipboardList className="size-7" />}
              naslov={kartica === 'aktivne' ? 'Nemate aktivnih rezervacija' : 'Još nema završenih rezervacija'}
              opis={kartica === 'aktivne' ? 'Pronađite lijek i rezervišite ga u apoteci – čeka vas 2 sata.' : 'Preuzete i otkazane rezervacije pojavit će se ovdje.'}
            >
              <Dugme onClick={() => navigate('/pacijent')}>Pretraži lijekove</Dugme>
            </PraznoStanje>
          )
        ) : (
          <table className="w-full min-w-[52rem] text-left">
            <thead className="bg-surface-2 text-sm text-muted">
              <tr>
                <th scope="col" className="w-12 px-3 py-3">
                  <span className="sr-only">Detalji</span>
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Kod
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Lijek
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Apoteka
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">
                  {kartica === 'aktivne' ? 'Preuzimanje' : 'Datum'}
                </th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">
                  Iznos
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  <span className="sr-only">Akcije</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {prikazane.map((r, i) => {
                const lijek = lijekPoId(r.lijekId)!
                const apoteka = apotekaPoId(r.apotekaId)!
                const otvoren = otvoreni === r.id
                return (
                  <Fragment key={r.id}>
                    <tr className={cx('border-t border-border', i % 2 === 1 && 'bg-surface-2/40', r.status === 'spremno' && 'bg-ok-soft/50')}>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          aria-expanded={otvoren}
                          aria-controls={`detalji-${r.id}`}
                          aria-label={`${otvoren ? 'Sakrij' : 'Vidi više'}: ${r.kod}`}
                          onClick={() => setOtvoreni(otvoren ? null : r.id)}
                          className="grid size-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                        >
                          <ChevronDown aria-hidden className={cx('size-5 transition-transform', otvoren && 'rotate-180')} />
                        </button>
                      </td>
                      <td className="px-3 py-2 font-semibold whitespace-nowrap">{r.kod}</td>
                      <td className="px-3 py-2">
                        {punNazivLijeka(lijek)} <span className="text-muted">× {r.kolicina}</span>
                      </td>
                      <td className="px-3 py-2">{apoteka.naziv}</td>
                      <td className="px-3 py-2">
                        <OznakaRezervacije status={r.status} />
                      </td>
                      <td className="px-3 py-2 text-sm">{jeAktivna(r.status) ? opisRoka(r.rokPreuzimanja) : `${formatDatum(r.kreirano)} u ${formatVrijeme(r.kreirano)}`}</td>
                      <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">{formatKM(lijek.cijenaKM * r.kolicina)}</td>
                      <td className="px-5 py-2 text-right">
                        {jeAktivna(r.status) && (
                          <Dugme varijanta="opasno" velicina="malo" onClick={() => setZaOtkazivanje(r)} aria-label={`Otkaži rezervaciju ${r.kod}`}>
                            Otkaži
                          </Dugme>
                        )}
                      </td>
                    </tr>
                    {otvoren && (
                      <tr id={`detalji-${r.id}`} className="bg-surface-2/60">
                        <td />
                        <td colSpan={7} className="px-3 pt-1 pb-4">
                          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                            <div>
                              <dt className="text-muted">Adresa apoteke</dt>
                              <dd>
                                <Link to={`/pacijent/apoteka/${apoteka.id}`} className="font-semibold text-primary hover:underline">
                                  {apoteka.adresa}
                                </Link>
                                , tel. {apoteka.telefon}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted">Poslano</dt>
                              <dd>
                                {formatDatum(r.kreirano)} u {formatVrijeme(r.kreirano)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted">Recept</dt>
                              <dd>{lijek.naRecept ? (r.receptPonijet ? 'Donosim recept' : 'Nije potvrđeno') : 'Nije potreban'}</dd>
                            </div>
                            {r.napomena && (
                              <div className="sm:col-span-3">
                                <dt className="text-muted">Napomena</dt>
                                <dd>„{r.napomena}"</dd>
                              </div>
                            )}
                            {r.status === 'potvrdjeno' && <dd className="text-info sm:col-span-3">Apoteka je potvrdila rezervaciju i priprema lijek.</dd>}
                            {r.razlogOtkazivanja && <dd className="text-bad sm:col-span-3">{r.razlogOtkazivanja}.</dd>}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <PotvrdniDijalog
        otvoren={!!zaOtkazivanje}
        naslov="Otkazati rezervaciju?"
        poruka={
          zaOtkazivanje
            ? `Rezervacija ${zaOtkazivanje.kod} (${punNazivLijeka(lijekPoId(zaOtkazivanje.lijekId)!)}) bit će otkazana, a lijek vraćen u prodaju. Ovo se ne može poništiti.`
            : ''
        }
        potvrdi="Otkaži rezervaciju"
        odustani="Zadrži rezervaciju"
        opasno
        onPotvrdi={otkazi}
        onOdustani={odustani}
      />
    </>
  )
}
