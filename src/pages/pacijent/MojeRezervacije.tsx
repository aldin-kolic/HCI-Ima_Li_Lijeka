import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ClipboardList, Clock, MapPin } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { apotekaPoId, lijekPoId, type Rezervacija } from '../../data/mockData'
import { formatDatum, formatKM, formatVrijeme, jeAktivna, opisRoka, punNazivLijeka } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { Dugme, OznakaRezervacije, PotvrdniDijalog, PraznoStanje, SkeletonKartice, Zaglavlje } from '../../components/ui'

export default function MojeRezervacije() {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { rezervacije, promijeniStatusRezervacije } = useApp()
  const ucitava = useSimuliranoUcitavanje('moje-rezervacije', 450)
  const [zaOtkazivanje, setZaOtkazivanje] = useState<Rezervacija | null>(null)

  const moje = rezervacije.filter((r) => r.moja).sort((a, b) => b.kreirano.getTime() - a.kreirano.getTime())
  const aktivne = moje.filter((r) => jeAktivna(r.status))
  const zavrsene = moje.filter((r) => !jeAktivna(r.status))

  const odustani = useCallback(() => setZaOtkazivanje(null), [])
  const otkazi = () => {
    if (!zaOtkazivanje) return
    promijeniStatusRezervacije(zaOtkazivanje.id, 'otkazano', 'Otkazao pacijent')
    prikaziToast(`Rezervacija ${zaOtkazivanje.kod} je otkazana`)
    setZaOtkazivanje(null)
  }

  return (
    <>
      <Zaglavlje naslov="Moje rezervacije" />
      <div className="p-4">
        {ucitava ? (
          <SkeletonKartice />
        ) : moje.length === 0 ? (
          <PraznoStanje ikona={<ClipboardList className="size-8" />} naslov="Još nemate rezervacija" opis="Pronađite lijek i rezervišite ga u apoteci – bit će vas čekati 2 sata.">
            <Dugme onClick={() => navigate('/pacijent')}>Pretraži lijekove</Dugme>
          </PraznoStanje>
        ) : (
          <>
            <section aria-labelledby="aktivne">
              <h2 id="aktivne" className="mb-2 text-sm font-semibold text-muted">
                Aktivne ({aktivne.length})
              </h2>
              {aktivne.length === 0 ? (
                <div className="kartica p-4 text-center text-muted">
                  Nemate aktivnih rezervacija.{' '}
                  <Link to="/pacijent" className="font-semibold text-primary underline">
                    Pretraži lijekove
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {aktivne.map((r) => (
                    <li key={r.id}>
                      <KarticaRezervacije rezervacija={r} onOtkazi={() => setZaOtkazivanje(r)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {zavrsene.length > 0 && (
              <section aria-labelledby="zavrsene" className="mt-6">
                <h2 id="zavrsene" className="mb-2 text-sm font-semibold text-muted">
                  Završene ({zavrsene.length})
                </h2>
                <ul className="space-y-3">
                  {zavrsene.map((r) => (
                    <li key={r.id}>
                      <KarticaRezervacije rezervacija={r} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <PotvrdniDijalog
        otvoren={!!zaOtkazivanje}
        naslov="Otkazati rezervaciju?"
        poruka={zaOtkazivanje ? `Rezervacija ${zaOtkazivanje.kod} (${punNazivLijeka(lijekPoId(zaOtkazivanje.lijekId)!)}) bit će otkazana, a lijek vraćen u prodaju. Ova radnja se ne može poništiti.` : ''}
        potvrdi="Da, otkaži rezervaciju"
        odustani="Ne, zadrži je"
        opasno
        onPotvrdi={otkazi}
        onOdustani={odustani}
      />
    </>
  )
}

function KarticaRezervacije({ rezervacija: r, onOtkazi }: { rezervacija: Rezervacija; onOtkazi?: () => void }) {
  const apoteka = apotekaPoId(r.apotekaId)!
  const lijek = lijekPoId(r.lijekId)!
  const aktivna = jeAktivna(r.status)

  return (
    <article className={`kartica p-4 ${r.status === 'spremno' ? 'border-2 border-ok' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted">{r.kod}</p>
          <h3 className="font-bold">
            {punNazivLijeka(lijek)} × {r.kolicina}
          </h3>
        </div>
        <span className="font-bold whitespace-nowrap">{formatKM(lijek.cijenaKM * r.kolicina)}</span>
      </div>
      <div className="mt-2">
        <OznakaRezervacije status={r.status} />
      </div>
      {r.status === 'potvrdjeno' && <p className="mt-2 text-sm text-info">Apoteka je potvrdila rezervaciju i priprema lijek.</p>}
      {r.status === 'spremno' && <p className="mt-2 text-sm font-semibold text-ok">Lijek vas čeka – pokažite kod {r.kod} farmaceutu.</p>}
      {r.status === 'otkazano' && r.razlogOtkazivanja && <p className="mt-2 text-sm text-muted">{r.razlogOtkazivanja}.</p>}

      <p className="mt-3 flex items-start gap-2 text-sm">
        <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        {apoteka.naziv}, {apoteka.adresa}
      </p>
      <p className="mt-1 flex items-start gap-2 text-sm">
        <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        {aktivna ? (
          <span>
            Preuzeti <strong>{opisRoka(r.rokPreuzimanja)}</strong>
          </span>
        ) : (
          <span className="text-muted">
            {formatDatum(r.kreirano)} u {formatVrijeme(r.kreirano)}
          </span>
        )}
      </p>

      {aktivna && onOtkazi && (
        <Dugme varijanta="opasno" className="mt-4 w-full" onClick={onOtkazi}>
          Otkaži rezervaciju
        </Dugme>
      )}
    </article>
  )
}
