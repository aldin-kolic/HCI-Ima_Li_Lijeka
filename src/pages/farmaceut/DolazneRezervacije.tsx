import { useState } from 'react'
import { Check, FileText, Inbox, PackageCheck, User, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { APOTEKA_FARMACEUTA_ID, apotekaPoId, lijekPoId, type Rezervacija, type StatusRezervacije } from '../../data/mockData'
import { jeAktivna, minutaOd, opisRoka, prijeKoliko, punNazivLijeka } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { Dugme, OznakaRezervacije, OznakaZalihe, PraznoStanje, Segmenti, SkeletonKartice, Zaglavlje } from '../../components/ui'

type Kartica = 'aktivne' | 'zavrsene'

const REDOSLIJED: Record<StatusRezervacije, number> = { na_cekanju: 0, potvrdjeno: 1, spremno: 2, preuzeto: 3, otkazano: 4 }

const PORUKE: Partial<Record<StatusRezervacije, string>> = {
  potvrdjeno: 'potvrđena',
  spremno: 'označena kao spremna – pacijent je obaviješten',
  preuzeto: 'označena kao preuzeta',
  otkazano: 'odbijena',
}

export default function DolazneRezervacije() {
  const prikaziToast = useToast()
  const { rezervacije, zalihe, promijeniStatusRezervacije } = useApp()
  const [kartica, setKartica] = useState<Kartica>('aktivne')
  const ucitava = useSimuliranoUcitavanje(kartica, 400)
  const apoteka = apotekaPoId(APOTEKA_FARMACEUTA_ID)!

  const mojeApoteke = rezervacije.filter((r) => r.apotekaId === APOTEKA_FARMACEUTA_ID)
  const aktivne = mojeApoteke.filter((r) => jeAktivna(r.status)).sort((a, b) => REDOSLIJED[a.status] - REDOSLIJED[b.status] || b.kreirano.getTime() - a.kreirano.getTime())
  const zavrsene = mojeApoteke.filter((r) => !jeAktivna(r.status))
  const prikazane = kartica === 'aktivne' ? aktivne : zavrsene

  // Jedan klik mijenja status; greška se ispravlja dugmetom "Poništi" u toastu
  const promijeni = (r: Rezervacija, status: StatusRezervacije) => {
    const prethodni = r.status
    promijeniStatusRezervacije(r.id, status, status === 'otkazano' ? 'Apoteka je odbila rezervaciju' : undefined)
    prikaziToast(`${r.kod} ${PORUKE[status]}`, {
      tip: status === 'otkazano' ? 'info' : 'uspjeh',
      akcija: { tekst: 'Poništi', onClick: () => promijeniStatusRezervacije(r.id, prethodni) },
    })
  }

  return (
    <>
      <Zaglavlje naslov="Dolazne rezervacije" podnaslov={apoteka.naziv} />
      <div className="space-y-3 p-4">
        <Segmenti<Kartica>
          oznaka="Vrsta rezervacija"
          vrijednost={kartica}
          onChange={setKartica}
          opcije={[
            { vrijednost: 'aktivne', tekst: `Aktivne (${aktivne.length})` },
            { vrijednost: 'zavrsene', tekst: `Završene (${zavrsene.length})` },
          ]}
        />

        {ucitava ? (
          <SkeletonKartice />
        ) : prikazane.length === 0 ? (
          <PraznoStanje
            ikona={<Inbox className="size-8" />}
            naslov={kartica === 'aktivne' ? 'Nema novih rezervacija' : 'Nema završenih rezervacija'}
            opis={kartica === 'aktivne' ? 'Nove rezervacije pacijenata pojavit će se ovdje.' : 'Preuzete i odbijene rezervacije pojavit će se ovdje.'}
          />
        ) : (
          <ul className="space-y-3">
            {prikazane.map((r) => {
              const lijek = lijekPoId(r.lijekId)!
              return (
                <li key={r.id}>
                  <article className={`kartica p-4 ${r.status === 'na_cekanju' ? 'border-2 border-info' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold tracking-wide">{r.kod}</p>
                      <OznakaRezervacije status={r.status} uloga="farmaceut" />
                    </div>
                    <h3 className="mt-2 text-lg font-bold">
                      {punNazivLijeka(lijek)} × {r.kolicina}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted">Zaliha u apoteci:</span>
                      <OznakaZalihe status={zalihe[APOTEKA_FARMACEUTA_ID][lijek.id].status} />
                    </div>
                    <p className="mt-2 flex items-center gap-2 text-sm">
                      <User aria-hidden className="size-4 text-muted" />
                      {r.pacijent} · {prijeKoliko(minutaOd(r.kreirano))}
                    </p>
                    {lijek.naRecept && (
                      <p className="mt-1 flex items-center gap-2 text-sm text-info">
                        <FileText aria-hidden className="size-4" />
                        Na recept – {r.receptPonijet ? 'pacijent donosi recept' : 'recept nije potvrđen'}
                      </p>
                    )}
                    {r.napomena && <p className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">„{r.napomena}"</p>}
                    {jeAktivna(r.status) && <p className="mt-2 text-sm text-muted">Rok za preuzimanje: {opisRoka(r.rokPreuzimanja)}</p>}

                    {r.status === 'na_cekanju' && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Dugme onClick={() => promijeni(r, 'potvrdjeno')}>
                          <Check aria-hidden className="size-4" />
                          Potvrdi
                        </Dugme>
                        <Dugme varijanta="sekundarno" onClick={() => promijeni(r, 'spremno')}>
                          Spremno
                        </Dugme>
                        <Dugme varijanta="opasno" onClick={() => promijeni(r, 'otkazano')}>
                          <X aria-hidden className="size-4" />
                          Odbij
                        </Dugme>
                      </div>
                    )}
                    {r.status === 'potvrdjeno' && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Dugme onClick={() => promijeni(r, 'spremno')}>
                          <PackageCheck aria-hidden className="size-4" />
                          Spremno
                        </Dugme>
                        <Dugme varijanta="opasno" onClick={() => promijeni(r, 'otkazano')}>
                          <X aria-hidden className="size-4" />
                          Odbij
                        </Dugme>
                      </div>
                    )}
                    {r.status === 'spremno' && (
                      <Dugme className="mt-4 w-full" onClick={() => promijeni(r, 'preuzeto')}>
                        <Check aria-hidden className="size-4" />
                        Označi kao preuzeto
                      </Dugme>
                    )}
                  </article>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
