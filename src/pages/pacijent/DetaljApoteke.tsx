import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Cross, MapPin, Navigation, Phone, Search, Store } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { SADA, apotekaPoId, lijekPoId, lijekovi } from '../../data/mockData'
import { formatInterval, formatKM, formatKm, izracunajRok, jeOtvorenoSada, normalizuj, opisRoka, prijeKoliko, punNazivLijeka } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { SvgMapa } from '../../components/SvgMapa'
import { Dugme, EtiketaLijeka, OznakaRadnogVremena, OznakaRecept, OznakaZalihe, PraznoStanje, SkeletonRedovi, ZaglavljeStranice, cx } from '../../components/ui'

export default function DetaljApoteke() {
  const { apotekaId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { zalihe, otvoriRezervaciju } = useApp()
  const [filter, setFilter] = useState('')
  const apoteka = apotekaPoId(apotekaId)
  const lijek = lijekPoId(params.get('lijek') ?? '')
  const ucitava = useSimuliranoUcitavanje(apotekaId, 450)

  if (!apoteka) {
    return (
      <PraznoStanje ikona={<Store className="size-7" />} naslov="Apoteka nije pronađena" opis="Link je možda zastario. Vratite se na pretragu.">
        <Dugme onClick={() => navigate('/pacijent')}>Na početnu</Dugme>
      </PraznoStanje>
    )
  }

  const stavka = lijek ? zalihe[apoteka.id][lijek.id] : undefined
  const otvoreno = jeOtvorenoSada(apoteka)
  const danas = SADA.getDay()
  const raspored = [
    { dan: 'Ponedjeljak – petak', interval: apoteka.radnoVrijeme.radniDani, aktivan: danas >= 1 && danas <= 5 },
    { dan: 'Subota', interval: apoteka.radnoVrijeme.subota, aktivan: danas === 6 },
    { dan: 'Nedjelja', interval: apoteka.radnoVrijeme.nedjelja, aktivan: danas === 0 },
  ]
  const svi = lijekovi.filter((l) => normalizuj(`${l.naziv} ${l.aktivnaTvar}`).includes(normalizuj(filter)))

  return (
    <>
      <ZaglavljeStranice
        mrvice={[
          { tekst: 'Početna', to: '/pacijent' },
          ...(lijek ? [{ tekst: punNazivLijeka(lijek), to: `/pacijent/pretraga?lijek=${lijek.id}` }] : [{ tekst: 'Dežurne apoteke', to: '/pacijent/dezurne' }]),
          { tekst: apoteka.naziv },
        ]}
        naslov={
          <span className="flex items-center gap-3">
            {apoteka.dezurna && <Cross aria-hidden className="krst-svijetli size-8 shrink-0" strokeWidth={2.75} />}
            {apoteka.naziv}
          </span>
        }
        opis={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              {apoteka.adresa}, {apoteka.naselje}. {formatKm(apoteka.udaljenostKm)} od vas.
            </span>
            <OznakaRadnogVremena apoteka={apoteka} />
          </span>
        }
        akcije={
          <>
            <Dugme varijanta="sekundarno" onClick={() => prikaziToast(`Pozivanje ${apoteka.telefon} (simulacija)`, { tip: 'info' })}>
              <Phone aria-hidden className="size-4" />
              Pozovi {apoteka.telefon}
            </Dugme>
            <Dugme varijanta="sekundarno" onClick={() => prikaziToast(`Navigacija do: ${apoteka.adresa} (simulacija)`, { tip: 'info' })}>
              <Navigation aria-hidden className="size-4" />
              Navigacija
            </Dugme>
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          {lijek && stavka && (
            <section aria-labelledby="trazeni-lijek" className="panel p-6">
              <h2 id="trazeni-lijek" className="sr-only">
                Traženi lijek
              </h2>
              {ucitava ? (
                <div className="space-y-3">
                  <div className="skeleton h-8 w-1/2 rounded" />
                  <div className="skeleton h-7 w-40 rounded-md" />
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <EtiketaLijeka lijek={lijek} />
                    <p className="mt-1 text-sm text-muted">
                      {lijek.oblik}, {formatKM(lijek.cijenaKM)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <OznakaZalihe status={stavka.status} />
                      {lijek.naRecept && <OznakaRecept />}
                      <span className="text-xs text-muted">ažurirano {prijeKoliko(stavka.azuriranoPrijeMin)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Dugme velicina="veliko" disabled={stavka.status === 'nema'} onClick={() => otvoriRezervaciju(apoteka.id, lijek.id)}>
                      {stavka.status === 'nema' ? 'Nema na stanju' : 'Rezerviši'}
                    </Dugme>
                    {stavka.status === 'nema' ? (
                      <Link to={`/pacijent/pretraga?lijek=${lijek.id}&naStanju=1`} className="text-sm font-semibold text-primary underline">
                        Prikaži apoteke koje ga imaju
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">Preuzimanje {opisRoka(izracunajRok(apoteka))}</span>
                    )}
                  </div>
                </div>
              )}
              {!otvoreno && stavka.status !== 'nema' && !ucitava && (
                <p className="mt-4 rounded-lg bg-info-soft px-4 py-3 text-sm text-info">
                  Apoteka je sada zatvorena. Rezervacija važi 2 sata od otvaranja.
                </p>
              )}
            </section>
          )}

          <section aria-labelledby="zalihe-naslov" className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 id="zalihe-naslov" className="text-xl">
                Zalihe u apoteci
              </h2>
              <label className="relative">
                <span className="sr-only">Filtriraj lijekove</span>
                <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filtriraj lijekove"
                  className="h-11 w-56 rounded-lg border border-border bg-surface pr-3 pl-9 text-sm placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </label>
            </div>
            {ucitava ? (
              <SkeletonRedovi broj={5} />
            ) : svi.length === 0 ? (
              <p className="px-5 py-8 text-center text-muted">Nijedan lijek ne odgovara „{filter}".</p>
            ) : (
              <table className="w-full text-left">
                <caption className="sr-only">Stanje svih lijekova u apoteci {apoteka.naziv}</caption>
                <thead className="bg-surface-2 text-sm text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-2 font-semibold">
                      Lijek
                    </th>
                    <th scope="col" className="px-5 py-2 font-semibold">
                      Cijena
                    </th>
                    <th scope="col" className="px-5 py-2 font-semibold">
                      Stanje
                    </th>
                    <th scope="col" className="px-5 py-2">
                      <span className="sr-only">Akcija</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="zebra">
                  {svi.map((l) => {
                    const s = zalihe[apoteka.id][l.id]
                    return (
                      <tr key={l.id} className={cx(l.id === lijek?.id && 'outline-2 -outline-offset-2 outline-primary')}>
                        <th scope="row" className="px-5 py-2 font-normal">
                          <span className="font-semibold">{l.naziv}</span> <span className="text-muted">{l.jacina}</span>
                        </th>
                        <td className="px-5 py-2 whitespace-nowrap">{formatKM(l.cijenaKM)}</td>
                        <td className="px-5 py-2">
                          <OznakaZalihe status={s.status} kratko />
                        </td>
                        <td className="px-5 py-1 text-right">
                          {s.status !== 'nema' && (
                            <Dugme varijanta="tiho" velicina="malo" onClick={() => otvoriRezervaciju(apoteka.id, l.id)} aria-label={`Rezerviši ${punNazivLijeka(l)}`}>
                              Rezerviši
                            </Dugme>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:col-span-5">
          <section aria-labelledby="radno-vrijeme" className="panel p-5">
            <h2 id="radno-vrijeme" className="text-xl">
              Radno vrijeme
            </h2>
            {apoteka.dezurna && <p className="mt-1 text-sm font-semibold text-ok">Večeras dežurna – otvoreno cijelu noć.</p>}
            <dl className="mt-3 divide-y divide-border">
              {raspored.map((r) => (
                <div key={r.dan} className={cx('flex justify-between py-2', r.aktivan && 'font-bold')}>
                  <dt>
                    {r.dan}
                    {r.aktivan && <span className="ml-1 text-sm font-normal text-muted">(danas)</span>}
                  </dt>
                  <dd>{formatInterval(r.interval)}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="lokacija">
            <h2 id="lokacija" className="mb-2 flex items-center gap-2 text-xl">
              <MapPin aria-hidden className="size-5 text-muted" />
              Lokacija
            </h2>
            <SvgMapa pinovi={[{ apoteka, status: stavka?.status ?? 'dezurna' }]} odabrana={apoteka.id} onOdaberi={() => {}} />
          </section>
        </aside>
      </div>
    </>
  )
}
