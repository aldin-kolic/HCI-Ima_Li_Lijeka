import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { MapPin, Navigation, Phone, Store } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { SADA, apotekaPoId, lijekPoId, lijekovi } from '../../data/mockData'
import { formatInterval, formatKM, formatKm, izracunajRok, jeOtvorenoSada, opisRoka, prijeKoliko, punNazivLijeka } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { Dugme, OznakaRadnogVremena, OznakaRecept, OznakaZalihe, PraznoStanje, SkeletonKartice, Zaglavlje, cx } from '../../components/ui'

export default function DetaljApoteke() {
  const { apotekaId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { zalihe } = useApp()
  const apoteka = apotekaPoId(apotekaId)
  const lijek = lijekPoId(params.get('lijek') ?? '')
  const ucitava = useSimuliranoUcitavanje(apotekaId, 400)

  if (!apoteka) {
    return (
      <>
        <Zaglavlje naslov="Apoteka" nazad="/pacijent" />
        <PraznoStanje ikona={<Store className="size-8" />} naslov="Apoteka nije pronađena">
          <Dugme onClick={() => navigate('/pacijent')}>Na početnu</Dugme>
        </PraznoStanje>
      </>
    )
  }

  const stavka = lijek ? zalihe[apoteka.id][lijek.id] : undefined
  const otvoreno = jeOtvorenoSada(apoteka)
  const danas = SADA.getDay() // 6 = subota
  const raspored = [
    { dan: 'Ponedjeljak – petak', interval: apoteka.radnoVrijeme.radniDani, aktivan: danas >= 1 && danas <= 5 },
    { dan: 'Subota', interval: apoteka.radnoVrijeme.subota, aktivan: danas === 6 },
    { dan: 'Nedjelja', interval: apoteka.radnoVrijeme.nedjelja, aktivan: danas === 0 },
  ]

  return (
    <>
      <Zaglavlje naslov={apoteka.naziv} podnaslov={apoteka.naselje} nazad />
      <div className="space-y-4 p-4">
        <section className="kartica p-4">
          <p className="flex items-start gap-2">
            <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" />
            <span>
              {apoteka.adresa}, Sarajevo
              <span className="block text-sm text-muted">{formatKm(apoteka.udaljenostKm)} od vas</span>
            </span>
          </p>
          <p className="mt-2 flex items-center gap-2">
            <Phone aria-hidden className="size-5 shrink-0 text-muted" />
            {apoteka.telefon}
          </p>
          <div className="mt-2">
            <OznakaRadnogVremena apoteka={apoteka} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Dugme varijanta="sekundarno" onClick={() => prikaziToast(`Pozivanje ${apoteka.telefon}… (simulacija)`, { tip: 'info' })}>
              <Phone aria-hidden className="size-4" />
              Pozovi
            </Dugme>
            <Dugme varijanta="sekundarno" onClick={() => prikaziToast(`Navigacija do: ${apoteka.adresa} (simulacija)`, { tip: 'info' })}>
              <Navigation aria-hidden className="size-4" />
              Navigacija
            </Dugme>
          </div>
        </section>

        {lijek && stavka && (
          <section className="kartica p-4" aria-labelledby="trazeni-lijek">
            <h2 id="trazeni-lijek" className="text-sm font-semibold text-muted">
              Traženi lijek
            </h2>
            {ucitava ? (
              <div className="mt-2">
                <div className="skeleton h-6 w-2/3 rounded-md" />
                <div className="skeleton mt-2 h-8 w-32 rounded-full" />
              </div>
            ) : (
              <>
                <p className="mt-1 text-lg font-bold">{punNazivLijeka(lijek)}</p>
                <p className="text-sm text-muted">
                  {lijek.oblik} · {formatKM(lijek.cijenaKM)}
                </p>
                {lijek.naRecept && (
                  <div className="mt-1">
                    <OznakaRecept />
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <OznakaZalihe status={stavka.status} />
                  <span className="text-xs text-muted">ažurirano {prijeKoliko(stavka.azuriranoPrijeMin)}</span>
                </div>
                {!otvoreno && stavka.status !== 'nema' && (
                  <p className="mt-3 rounded-xl bg-info-soft p-3 text-sm text-info">
                    Apoteka je sada zatvorena. Rezervacija važi 2 sata od otvaranja – lijek možete preuzeti {opisRoka(izracunajRok(apoteka))}.
                  </p>
                )}
              </>
            )}
            <Dugme
              velicina="veliko"
              className="mt-4 w-full"
              disabled={ucitava || stavka.status === 'nema'}
              onClick={() => navigate(`/pacijent/rezervacija/${apoteka.id}/${lijek.id}`)}
            >
              {stavka.status === 'nema' ? 'Nije moguće rezervisati – nema na stanju' : 'Rezerviši'}
            </Dugme>
            {stavka.status === 'nema' && (
              <Link to={`/pacijent/pretraga?lijek=${lijek.id}&naStanju=1`} className="mt-3 block text-center font-semibold text-primary underline">
                Prikaži apoteke koje imaju ovaj lijek
              </Link>
            )}
          </section>
        )}

        <section className="kartica p-4" aria-labelledby="radno-vrijeme">
          <h2 id="radno-vrijeme" className="font-bold">
            Radno vrijeme
          </h2>
          {apoteka.dezurna && <p className="mt-1 text-sm font-semibold text-ok">Večeras dežurna – otvoreno cijelu noć.</p>}
          <dl className="mt-2 divide-y divide-border">
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

        {!lijek && (
          <section className="kartica p-4" aria-labelledby="zalihe-apoteke">
            <h2 id="zalihe-apoteke" className="font-bold">
              Zalihe lijekova
            </h2>
            {ucitava ? (
              <div className="mt-3">
                <SkeletonKartice broj={1} />
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {lijekovi.map((l) => (
                  <li key={l.id}>
                    <Link
                      to={`/pacijent/apoteka/${apoteka.id}?lijek=${l.id}`}
                      data-bez-podvlake
                      className="flex min-h-12 items-center justify-between gap-2 py-2 hover:text-primary"
                    >
                      <span className="text-sm font-medium">{punNazivLijeka(l)}</span>
                      <OznakaZalihe status={zalihe[apoteka.id][l.id].status} kratko />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  )
}
