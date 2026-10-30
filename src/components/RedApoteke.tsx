import { Link } from 'react-router'
import { MapPin, Phone } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import type { Apoteka, Lijek, StavkaZalihe } from '../data/mockData'
import { formatKM, formatKm, prijeKoliko } from '../lib/format'
import { Dugme, IkonaDugme, OznakaRadnogVremena, OznakaZalihe, cx } from './ui'

/**
 * Red apoteke u listi. Naziv vodi na detalj ("više na zahtjev"), a "Rezerviši" otvara dijalog direktno
 * (kraći put do cilja). Prelazak mišem/fokus označava apoteku na mapi.
 */
export function RedApoteke({
  apoteka,
  lijek,
  stavka,
  aktivna,
  onAktiviraj,
}: {
  apoteka: Apoteka
  lijek?: Lijek
  stavka?: StavkaZalihe
  aktivna?: boolean
  onAktiviraj?: () => void
}) {
  const { otvoriRezervaciju } = useApp()
  const prikaziToast = useToast()
  const detalj = `/pacijent/apoteka/${apoteka.id}${lijek ? `?lijek=${lijek.id}` : ''}`
  const mozeRezervacija = lijek && stavka && stavka.status !== 'nema'

  return (
    <article
      onMouseEnter={onAktiviraj}
      onFocusCapture={onAktiviraj}
      className={cx('@container relative px-5 py-4 transition-colors', aktivna ? 'bg-primary-soft/60' : 'hover:bg-surface-2/50')}
    >
      {aktivna && <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary" />}
      {/* Container query: u uskom prostoru (mobilni, kartica uz mapu) dijelovi idu jedan ispod drugog */}
      <div className="flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:gap-6">
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-lg font-bold" style={{ fontStretch: 'normal' }}>
          <Link to={detalj} className="hover:text-primary hover:underline">
            {apoteka.naziv}
          </Link>
        </h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
          <MapPin aria-hidden className="size-4 shrink-0" />
          <span>
            <strong className="font-semibold text-fg">{formatKm(apoteka.udaljenostKm)}</strong> od vas, {apoteka.adresa}
          </span>
        </p>
        <div className="mt-1">
          <OznakaRadnogVremena apoteka={apoteka} />
        </div>
      </div>

      {lijek && stavka ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 @xl:shrink-0 @xl:flex-nowrap">
          <div className="@xl:w-36 @xl:text-right">
            <OznakaZalihe status={stavka.status} />
            <p className="mt-1 text-xs text-muted">ažurirano {prijeKoliko(stavka.azuriranoPrijeMin)}</p>
          </div>
          <span className="font-bold @xl:w-20 @xl:text-right">{formatKM(lijek.cijenaKM)}</span>
          <Dugme
            disabled={!mozeRezervacija}
            onClick={() => otvoriRezervaciju(apoteka.id, lijek.id)}
            aria-label={mozeRezervacija ? `Rezerviši ${lijek.naziv} u apoteci ${apoteka.naziv}` : `${apoteka.naziv}: nema na stanju`}
            className="ml-auto w-28 @xl:ml-0"
          >
            {mozeRezervacija ? 'Rezerviši' : 'Nema'}
          </Dugme>
        </div>
      ) : (
        <IkonaDugme oznaka={`Pozovi ${apoteka.telefon}`} onClick={() => prikaziToast(`Pozivanje ${apoteka.telefon} (simulacija)`, { tip: 'info' })}>
          <Phone aria-hidden className="size-5" />
        </IkonaDugme>
      )}
      </div>
    </article>
  )
}
