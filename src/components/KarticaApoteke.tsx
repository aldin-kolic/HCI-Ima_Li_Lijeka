import { Link, useNavigate } from 'react-router'
import { ChevronRight, MapPin } from 'lucide-react'
import type { Apoteka, Lijek, StavkaZalihe } from '../data/mockData'
import { formatKM, formatKm, prijeKoliko } from '../lib/format'
import { Dugme, OznakaRadnogVremena, OznakaZalihe } from './ui'

/** Kartica apoteke. Cijela kartica vodi na detalj, a "Rezerviši" vodi direktno na rezervaciju (kraći put). */
export function KarticaApoteke({ apoteka, lijek, stavka }: { apoteka: Apoteka; lijek?: Lijek; stavka?: StavkaZalihe }) {
  const navigate = useNavigate()
  const detalj = `/pacijent/apoteka/${apoteka.id}${lijek ? `?lijek=${lijek.id}` : ''}`
  const mozeRezervacija = lijek && stavka && stavka.status !== 'nema'

  return (
    <article className="kartica relative p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">
            <Link to={detalj} data-bez-podvlake className="after:absolute after:inset-0 after:rounded-2xl after:content-['']">
              {apoteka.naziv}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin aria-hidden className="size-4 shrink-0" />
            <span className="truncate">
              {formatKm(apoteka.udaljenostKm)} · {apoteka.adresa}
            </span>
          </p>
          <div className="mt-1">
            <OznakaRadnogVremena apoteka={apoteka} />
          </div>
        </div>
        <ChevronRight aria-hidden className="mt-1 size-5 shrink-0 text-muted" />
      </div>

      {lijek && stavka && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
          <OznakaZalihe status={stavka.status} />
          <span className="font-bold">{formatKM(lijek.cijenaKM)}</span>
          <span className="w-full text-xs text-muted">Zaliha ažurirana {prijeKoliko(stavka.azuriranoPrijeMin)}</span>
          {mozeRezervacija && (
            <Dugme
              className="relative z-10 w-full"
              onClick={() => navigate(`/pacijent/rezervacija/${apoteka.id}/${lijek.id}`)}
              aria-label={`Rezerviši ${lijek.naziv} u apoteci ${apoteka.naziv}`}
            >
              Rezerviši
            </Dugme>
          )}
        </div>
      )}
    </article>
  )
}
