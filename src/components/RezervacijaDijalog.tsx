import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, CircleCheckBig, Clock, Loader2, MapPin, Minus, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { apotekaPoId, lijekPoId, type Rezervacija } from '../data/mockData'
import { formatKM, izracunajRok, jeOtvorenoSada, opisRoka } from '../lib/format'
import { Dugme, EtiketaLijeka, Modal, OznakaRadnogVremena, OznakaRecept, OznakaZalihe, ZaglavljeModala, cx } from './ui'

const MAKS_NAPOMENA = 200

/** Globalni dijalog za rezervaciju – otvara se preko `otvoriRezervaciju()` iz konteksta. */
export function RezervacijaDijalog() {
  const { rezervacijaZa, zatvoriRezervaciju } = useApp()
  return (
    <Modal otvoren={!!rezervacijaZa} onZatvori={zatvoriRezervaciju} naslovId="rezervacija-naslov" sirina="max-w-xl">
      {/* key resetuje formu za svaku novu rezervaciju */}
      {rezervacijaZa && <Sadrzaj key={`${rezervacijaZa.apotekaId}-${rezervacijaZa.lijekId}`} {...rezervacijaZa} onZatvori={zatvoriRezervaciju} />}
    </Modal>
  )
}

function Sadrzaj({ apotekaId, lijekId, onZatvori }: { apotekaId: string; lijekId: string; onZatvori: () => void }) {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { zalihe, kreirajRezervaciju } = useApp()
  const apoteka = apotekaPoId(apotekaId)!
  const lijek = lijekPoId(lijekId)!
  const stavka = zalihe[apoteka.id][lijek.id]

  const [kolicina, setKolicina] = useState(1)
  // Recept je unaprijed označen, da potvrda ostane jedan klik (najviše 3 klika od početne do rezervacije)
  const [receptPonijet, setReceptPonijet] = useState(true)
  const [napomena, setNapomena] = useState('')
  const [salje, setSalje] = useState(false)
  const [gotova, setGotova] = useState<Rezervacija | null>(null)

  // Nakon slanja sadržaj dijaloga se mijenja – fokus prelazi na glavno dugme ekrana uspjeha
  useEffect(() => {
    if (gotova) document.querySelector<HTMLElement>('[role="dialog"] [data-autofokus]')?.focus()
  }, [gotova])

  const maks = stavka.status === 'malo' ? 2 : 5
  const mozePotvrditi = stavka.status !== 'nema' && (!lijek.naRecept || receptPonijet) && !salje
  const ukupno = lijek.cijenaKM * kolicina

  const potvrdi = () => {
    setSalje(true)
    window.setTimeout(() => {
      const r = kreirajRezervaciju({ apotekaId, lijekId, kolicina, receptPonijet: lijek.naRecept && receptPonijet, napomena: napomena.trim() })
      prikaziToast(`Rezervacija ${r.kod} je poslana apoteci`)
      setGotova(r)
      setSalje(false)
    }, 550)
  }

  if (gotova) {
    return (
      <>
        <ZaglavljeModala id="rezervacija-naslov" naslov="Rezervacija je poslana" onZatvori={onZatvori} />
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
              <CircleCheckBig className="size-8" />
            </span>
            <div>
              <p className="text-sm text-muted">Kod rezervacije – pokažite ga farmaceutu</p>
              <p className="etiketa text-[2.5rem] leading-none text-primary">{gotova.kod}</p>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">Lijek</dt>
            <dd className="font-semibold">
              {lijek.naziv} {lijek.jacina} × {gotova.kolicina} ({formatKM(lijek.cijenaKM * gotova.kolicina)})
            </dd>
            <dt className="text-muted">Apoteka</dt>
            <dd>
              {apoteka.naziv}, {apoteka.adresa}
            </dd>
            <dt className="text-muted">Preuzmite</dt>
            <dd className="font-semibold">{opisRoka(gotova.rokPreuzimanja)}</dd>
          </dl>
          <p className="mt-4 rounded-lg bg-info-soft px-4 py-3 text-sm text-info">
            Dobit ćete obavještenje kad apoteka pripremi lijek.{gotova.receptPonijet && ' Ne zaboravite recept.'}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-6 py-4">
          <Dugme varijanta="sekundarno" onClick={onZatvori}>
            Zatvori
          </Dugme>
          <Dugme
            data-autofokus
            onClick={() => {
              onZatvori()
              navigate('/pacijent/rezervacije')
            }}
          >
            Otvori moje rezervacije
          </Dugme>
        </div>
      </>
    )
  }

  return (
    <>
      <ZaglavljeModala id="rezervacija-naslov" naslov="Rezervacija lijeka" onZatvori={onZatvori} />
      <div className="space-y-5 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <EtiketaLijeka lijek={lijek} />
            <p className="mt-1 text-sm text-muted">
              {lijek.oblik}, {formatKM(lijek.cijenaKM)} po pakovanju
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OznakaZalihe status={stavka.status} />
            {lijek.naRecept && <OznakaRecept />}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-surface-2 px-4 py-3">
          <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" />
          <div>
            <p className="font-semibold">{apoteka.naziv}</p>
            <p className="text-sm text-muted">{apoteka.adresa}</p>
            <OznakaRadnogVremena apoteka={apoteka} />
          </div>
        </div>

        <fieldset>
          <legend className="font-semibold">Količina</legend>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              aria-label="Smanji količinu"
              disabled={kolicina <= 1}
              onClick={() => setKolicina((k) => k - 1)}
              className="grid size-11 place-items-center rounded-lg border border-border bg-surface hover:border-primary disabled:opacity-40"
            >
              <Minus aria-hidden className="size-5" />
            </button>
            <output aria-live="polite" className="w-10 text-center text-2xl font-bold">
              {kolicina}
            </output>
            <button
              type="button"
              aria-label="Povećaj količinu"
              disabled={kolicina >= maks}
              onClick={() => setKolicina((k) => k + 1)}
              className="grid size-11 place-items-center rounded-lg border border-border bg-surface hover:border-primary disabled:opacity-40"
            >
              <Plus aria-hidden className="size-5" />
            </button>
            <span className="text-sm text-muted">
              {stavka.status === 'malo' ? `Malo na stanju – najviše ${maks} pakovanja` : `Najviše ${maks} pakovanja`}
            </span>
          </div>
        </fieldset>

        {lijek.naRecept && (
          <div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" checked={receptPonijet} onChange={(e) => setReceptPonijet(e.target.checked)} className="peer sr-only" />
              <span
                aria-hidden
                className={cx(
                  'grid size-6 shrink-0 place-items-center rounded-md border-2 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]',
                  receptPonijet ? 'border-primary bg-primary text-primary-fg' : 'border-muted bg-surface',
                )}
              >
                {receptPonijet && <Check className="size-4" />}
              </span>
              <span className="font-semibold">Ponijeću recept prilikom preuzimanja</span>
            </label>
            <p className={cx('mt-1 pl-9 text-sm', receptPonijet ? 'text-muted' : 'text-bad')} role={receptPonijet ? undefined : 'alert'}>
              {receptPonijet ? 'Farmaceut provjerava recept pri preuzimanju.' : 'Bez recepta apoteka ne može izdati ovaj lijek. Označite polje da nastavite.'}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="napomena" className="font-semibold">
            Napomena za apoteku <span className="font-normal text-muted">(nije obavezno)</span>
          </label>
          <textarea
            id="napomena"
            rows={2}
            maxLength={MAKS_NAPOMENA}
            value={napomena}
            onChange={(e) => setNapomena(e.target.value)}
            placeholder="npr. Dolazim oko 23 h"
            aria-describedby="napomena-brojac"
            className="mt-2 w-full rounded-lg border border-border bg-surface p-3 placeholder:text-muted focus:border-primary focus:outline-none"
          />
          <p id="napomena-brojac" className="text-right text-xs text-muted">
            {napomena.length}/{MAKS_NAPOMENA}
          </p>
        </div>

        <p className="flex items-start gap-2 text-sm">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
          <span>
            Rezervacija važi 2 sata{!jeOtvorenoSada(apoteka) && ' od otvaranja apoteke'}. Preuzmite lijek <strong>{opisRoka(izracunajRok(apoteka))}</strong>.
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
        <p>
          <span className="text-sm text-muted">Ukupno </span>
          <span className="text-xl font-bold">{formatKM(ukupno)}</span>
        </p>
        <div className="flex gap-2">
          <Dugme varijanta="sekundarno" onClick={onZatvori}>
            Odustani
          </Dugme>
          <Dugme data-autofokus disabled={!mozePotvrditi} onClick={potvrdi} aria-busy={salje}>
            {salje ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Šaljem…
              </>
            ) : (
              'Potvrdi rezervaciju'
            )}
          </Dugme>
        </div>
      </div>
    </>
  )
}
