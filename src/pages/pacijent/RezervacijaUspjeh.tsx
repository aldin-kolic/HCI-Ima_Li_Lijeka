import { useNavigate, useParams } from 'react-router'
import { CircleCheckBig, Clock, MapPin, SearchX } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { apotekaPoId, lijekPoId } from '../../data/mockData'
import { formatKM, opisRoka, punNazivLijeka } from '../../lib/format'
import { Dugme, OznakaRezervacije, PraznoStanje, Zaglavlje } from '../../components/ui'

export default function RezervacijaUspjeh() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { rezervacije } = useApp()
  const rezervacija = rezervacije.find((r) => r.id === id)

  if (!rezervacija) {
    return (
      <>
        <Zaglavlje naslov="Rezervacija" nazad="/pacijent" />
        <PraznoStanje ikona={<SearchX className="size-8" />} naslov="Rezervacija nije pronađena">
          <Dugme onClick={() => navigate('/pacijent/rezervacije')}>Moje rezervacije</Dugme>
        </PraznoStanje>
      </>
    )
  }

  const apoteka = apotekaPoId(rezervacija.apotekaId)!
  const lijek = lijekPoId(rezervacija.lijekId)!

  return (
    <div className="flex min-h-full flex-col px-5 pt-10 pb-6">
      <div className="text-center">
        <span aria-hidden className="mx-auto grid size-20 place-items-center rounded-full bg-ok-soft text-ok">
          <CircleCheckBig className="size-11" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">Rezervacija je poslana!</h1>
        <p className="mt-1 text-muted">Javićemo vam kad lijek bude spreman za preuzimanje.</p>
      </div>

      <section className="kartica mt-6 p-5 text-center" aria-label="Kod rezervacije">
        <p className="text-sm font-semibold text-muted">Kod rezervacije</p>
        <p className="mt-1 text-4xl font-extrabold tracking-wider text-primary">{rezervacija.kod}</p>
        <p className="mt-2 text-sm text-muted">Pokažite ovaj kod farmaceutu.</p>
        <div className="mt-3 flex justify-center">
          <OznakaRezervacije status={rezervacija.status} />
        </div>
      </section>

      <section className="kartica mt-3 space-y-3 p-4">
        <p className="font-bold">
          {punNazivLijeka(lijek)} × {rezervacija.kolicina}
          <span className="float-right">{formatKM(lijek.cijenaKM * rezervacija.kolicina)}</span>
        </p>
        <p className="flex items-start gap-2 text-sm">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <span>
            {apoteka.naziv}, {apoteka.adresa}
          </span>
        </p>
        <p className="flex items-start gap-2 text-sm">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <span>
            Rok za preuzimanje: <strong>{opisRoka(rezervacija.rokPreuzimanja)}</strong> (2 sata)
          </span>
        </p>
        {rezervacija.receptPonijet && <p className="rounded-xl bg-info-soft p-3 text-sm text-info">Ne zaboravite ponijeti recept.</p>}
      </section>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Dugme velicina="veliko" onClick={() => navigate('/pacijent/rezervacije')}>
          Moje rezervacije
        </Dugme>
        <Dugme varijanta="tiho" onClick={() => navigate('/pacijent')}>
          Nazad na početnu
        </Dugme>
      </div>
    </div>
  )
}
