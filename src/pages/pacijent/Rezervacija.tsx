import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Check, Loader2, Minus, PackageX, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { apotekaPoId, lijekPoId } from '../../data/mockData'
import { formatKM, izracunajRok, opisRoka, punNazivLijeka } from '../../lib/format'
import { Dugme, OznakaRadnogVremena, OznakaRecept, OznakaZalihe, PraznoStanje, Zaglavlje, cx } from '../../components/ui'

export default function Rezervacija() {
  const { apotekaId = '', lijekId = '' } = useParams()
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { zalihe, kreirajRezervaciju } = useApp()
  const apoteka = apotekaPoId(apotekaId)
  const lijek = lijekPoId(lijekId)

  const [kolicina, setKolicina] = useState(1)
  // Recept je unaprijed označen, da potvrda ostane na jednom tapu (najviše 3 tapa do rezervacije)
  const [receptPonijet, setReceptPonijet] = useState(true)
  const [napomena, setNapomena] = useState('')
  const [salje, setSalje] = useState(false)

  if (!apoteka || !lijek) {
    return (
      <>
        <Zaglavlje naslov="Rezervacija" nazad="/pacijent" />
        <PraznoStanje ikona={<PackageX className="size-8" />} naslov="Rezervacija nije moguća" opis="Apoteka ili lijek nisu pronađeni.">
          <Dugme onClick={() => navigate('/pacijent')}>Na početnu</Dugme>
        </PraznoStanje>
      </>
    )
  }

  const stavka = zalihe[apoteka.id][lijek.id]
  const maks = stavka.status === 'malo' ? 2 : 5
  const mozePotvrditi = stavka.status !== 'nema' && (!lijek.naRecept || receptPonijet) && !salje

  const potvrdi = () => {
    setSalje(true)
    // Simulirano slanje zahtjeva
    window.setTimeout(() => {
      const rezervacija = kreirajRezervaciju({ apotekaId: apoteka.id, lijekId: lijek.id, kolicina, receptPonijet: lijek.naRecept && receptPonijet, napomena: napomena.trim() })
      prikaziToast(`Rezervacija ${rezervacija.kod} je poslana`)
      navigate(`/pacijent/rezervacija-uspjeh/${rezervacija.id}`, { replace: true })
    }, 550)
  }

  return (
    <>
      <Zaglavlje naslov="Rezervacija" podnaslov={apoteka.naziv} nazad />
      <div className="space-y-4 p-4 pb-6">
        <section className="kartica p-4" aria-label="Sažetak">
          <p className="text-lg font-bold">{punNazivLijeka(lijek)}</p>
          <p className="text-sm text-muted">
            {lijek.oblik} · {formatKM(lijek.cijenaKM)} po pakovanju
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OznakaZalihe status={stavka.status} />
            {lijek.naRecept && <OznakaRecept />}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <p className="font-semibold">{apoteka.naziv}</p>
            <p className="text-sm text-muted">{apoteka.adresa}</p>
            <OznakaRadnogVremena apoteka={apoteka} />
          </div>
        </section>

        <section className="kartica p-4">
          <h2 id="kolicina-oznaka" className="font-bold">
            Količina
          </h2>
          <div className="mt-2 flex items-center gap-3" role="group" aria-labelledby="kolicina-oznaka">
            <button
              type="button"
              aria-label="Smanji količinu"
              disabled={kolicina <= 1}
              onClick={() => setKolicina((k) => k - 1)}
              className="grid size-12 place-items-center rounded-xl border-2 border-border bg-surface disabled:opacity-40"
            >
              <Minus aria-hidden className="size-5" />
            </button>
            <output aria-live="polite" className="w-16 text-center text-2xl font-bold">
              {kolicina}
            </output>
            <button
              type="button"
              aria-label="Povećaj količinu"
              disabled={kolicina >= maks}
              onClick={() => setKolicina((k) => k + 1)}
              className="grid size-12 place-items-center rounded-xl border-2 border-border bg-surface disabled:opacity-40"
            >
              <Plus aria-hidden className="size-5" />
            </button>
            <span className="ml-auto text-right">
              <span className="block text-sm text-muted">Ukupno</span>
              <span className="text-lg font-bold">{formatKM(lijek.cijenaKM * kolicina)}</span>
            </span>
          </div>
          {stavka.status === 'malo' && <p className="mt-2 text-sm text-warn">Malo na stanju – moguće rezervisati najviše {maks} pakovanja.</p>}
        </section>

        {lijek.naRecept && (
          <section className="kartica p-4">
            <h2 className="font-bold">Recept</h2>
            <p className="mt-1 text-sm text-muted">Ovaj lijek se izdaje samo uz recept. Farmaceut će ga provjeriti pri preuzimanju.</p>
            <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-3">
              <input type="checkbox" checked={receptPonijet} onChange={(e) => setReceptPonijet(e.target.checked)} className="peer sr-only" />
              <span
                aria-hidden
                className={cx(
                  'grid size-7 shrink-0 place-items-center rounded-lg border-2 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]',
                  receptPonijet ? 'border-primary bg-primary text-primary-fg' : 'border-muted bg-surface',
                )}
              >
                {receptPonijet && <Check className="size-5" />}
              </span>
              <span className="font-semibold">Ponijeću recept prilikom preuzimanja</span>
            </label>
            {!receptPonijet && (
              <p className="mt-2 text-sm text-bad" role="alert">
                Bez recepta apoteka ne može izdati ovaj lijek.
              </p>
            )}
          </section>
        )}

        <section className="kartica p-4">
          <label htmlFor="napomena" className="font-bold">
            Napomena za apoteku <span className="font-normal text-muted">(nije obavezno)</span>
          </label>
          <textarea
            id="napomena"
            rows={2}
            value={napomena}
            onChange={(e) => setNapomena(e.target.value)}
            placeholder="npr. Dolazim oko 23 h"
            className="mt-2 w-full rounded-xl border-2 border-border bg-surface p-3 placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </section>

        <p className="text-sm text-muted">
          Rezervacija važi 2 sata – preuzmite lijek <strong className="text-fg">{opisRoka(izracunajRok(apoteka))}</strong>.
        </p>

        <Dugme velicina="veliko" className="w-full" disabled={!mozePotvrditi} onClick={potvrdi} aria-busy={salje}>
          {salje ? (
            <>
              <Loader2 aria-hidden className="size-5 animate-spin" />
              Šaljem rezervaciju…
            </>
          ) : (
            `Potvrdi rezervaciju · ${formatKM(lijek.cijenaKM * kolicina)}`
          )}
        </Dugme>
      </div>
    </>
  )
}
