import { useState } from 'react'
import { Check, FileText, Inbox, PackageCheck, Search, User, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { APOTEKA_FARMACEUTA_ID, lijekPoId, type Rezervacija, type StatusRezervacije } from '../../data/mockData'
import { formatDatum, formatKM, formatVrijeme, jeAktivna, minutaOd, normalizuj, opisRoka, prijeKoliko, punNazivLijeka } from '../../lib/format'
import { useAkcijeRezervacije } from '../../lib/akcije'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { Dugme, OznakaRezervacije, OznakaZalihe, PraznoStanje, Segmenti, SkeletonRedovi, ZaglavljeStranice, cx } from '../../components/ui'

type Kartica = 'aktivne' | 'zavrsene'

const KOLONE: { status: StatusRezervacije; naslov: string; opis: string }[] = [
  { status: 'na_cekanju', naslov: 'Nove', opis: 'Potvrdite ili odbijte' },
  { status: 'potvrdjeno', naslov: 'Potvrđene', opis: 'Pripremite lijek' },
  { status: 'spremno', naslov: 'Spremne', opis: 'Čekaju pacijenta' },
]

export default function DolazneRezervacije() {
  const { rezervacije } = useApp()
  const [kartica, setKartica] = useState<Kartica>('aktivne')
  const [upit, setUpit] = useState('')
  const ucitava = useSimuliranoUcitavanje(kartica, 400)

  const ovdje = rezervacije
    .filter((r) => r.apotekaId === APOTEKA_FARMACEUTA_ID)
    .filter((r) => normalizuj(`${r.kod} ${r.pacijent} ${lijekPoId(r.lijekId)!.naziv}`).includes(normalizuj(upit)))
  const aktivne = ovdje.filter((r) => jeAktivna(r.status))
  const zavrsene = ovdje.filter((r) => !jeAktivna(r.status))

  return (
    <>
      <ZaglavljeStranice naslov="Rezervacije" opis="Svaka promjena statusa odmah je vidljiva pacijentu. Greška se ispravlja dugmetom Poništi u obavještenju." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmenti<Kartica>
          oznaka="Vrsta rezervacija"
          vrijednost={kartica}
          onChange={setKartica}
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
            data-pretraga="kompaktna"
            value={upit}
            onChange={(e) => setUpit(e.target.value)}
            placeholder="Kod, pacijent ili lijek"
            className="h-11 w-64 rounded-lg border border-border bg-surface pr-3 pl-9 text-sm placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      {kartica === 'aktivne' ? (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {KOLONE.map((k) => {
            const stavke = aktivne.filter((r) => r.status === k.status).sort((a, b) => a.kreirano.getTime() - b.kreirano.getTime())
            return (
              <section key={k.status} aria-labelledby={`kolona-${k.status}`} className="rounded-xl bg-surface-2/70 p-3">
                <div className="mb-3 flex items-baseline justify-between px-2 pt-1">
                  <h2 id={`kolona-${k.status}`} className="text-lg">
                    {k.naslov} <span className="font-sans text-base font-normal text-muted">({stavke.length})</span>
                  </h2>
                  <span className="text-sm text-muted">{k.opis}</span>
                </div>
                {ucitava ? (
                  <div className="panel">
                    <SkeletonRedovi broj={1} />
                  </div>
                ) : stavke.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">{upit ? 'Nema rezultata pretrage' : 'Nema rezervacija'}</p>
                ) : (
                  <ul className="space-y-3">
                    {stavke.map((r) => (
                      <li key={r.id}>
                        <KarticaRezervacije r={r} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <section aria-label="Završene rezervacije" className="panel overflow-x-auto">
          {ucitava ? (
            <SkeletonRedovi broj={3} />
          ) : zavrsene.length === 0 ? (
            <PraznoStanje ikona={<Inbox className="size-7" />} naslov="Nema završenih rezervacija" opis="Preuzete i odbijene rezervacije pojavit će se ovdje." />
          ) : (
            <table className="w-full min-w-[44rem] text-left">
              <thead className="bg-surface-2 text-sm text-muted">
                <tr>
                  {['Kod', 'Pacijent', 'Lijek', 'Status', 'Poslano', 'Iznos'].map((n) => (
                    <th key={n} scope="col" className={cx('px-5 py-3 font-semibold', n === 'Iznos' && 'text-right')}>
                      {n}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="zebra">
                {zavrsene.map((r) => {
                  const l = lijekPoId(r.lijekId)!
                  return (
                    <tr key={r.id}>
                      <td className="px-5 py-3 font-semibold">{r.kod}</td>
                      <td className="px-5 py-3">{r.pacijent}</td>
                      <td className="px-5 py-3">
                        {punNazivLijeka(l)} × {r.kolicina}
                      </td>
                      <td className="px-5 py-3">
                        <OznakaRezervacije status={r.status} uloga="farmaceut" />
                      </td>
                      <td className="px-5 py-3 text-sm">
                        {formatDatum(r.kreirano)} u {formatVrijeme(r.kreirano)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">{formatKM(l.cijenaKM * r.kolicina)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>
      )}
    </>
  )
}

function KarticaRezervacije({ r }: { r: Rezervacija }) {
  const { zalihe } = useApp()
  const promijeni = useAkcijeRezervacije()
  const lijek = lijekPoId(r.lijekId)!
  return (
    <article className={cx('panel p-4', r.status === 'na_cekanju' && 'border-l-4 border-l-info')}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">{r.kod}</p>
        <span className="text-xs text-muted">{prijeKoliko(minutaOd(r.kreirano))}</span>
      </div>
      <h3 className="mt-1 text-lg">
        {punNazivLijeka(lijek)} <span className="font-sans text-base font-normal text-muted">× {r.kolicina}</span>
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Zaliha:</span>
        <OznakaZalihe status={zalihe[APOTEKA_FARMACEUTA_ID][lijek.id].status} kratko />
      </div>
      <p className="mt-2 flex items-center gap-2 text-sm">
        <User aria-hidden className="size-4 text-muted" />
        {r.pacijent}
      </p>
      {lijek.naRecept && (
        <p className="mt-1 flex items-center gap-2 text-sm text-info">
          <FileText aria-hidden className="size-4" />
          Na recept, {r.receptPonijet ? 'pacijent donosi recept' : 'recept nije potvrđen'}
        </p>
      )}
      {r.napomena && <p className="mt-2 rounded-md bg-surface-2 px-3 py-2 text-sm">„{r.napomena}"</p>}
      <p className="mt-2 text-sm text-muted">Rok: {opisRoka(r.rokPreuzimanja)}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {r.status === 'na_cekanju' && (
          <>
            <Dugme velicina="malo" onClick={() => promijeni(r, 'potvrdjeno')}>
              <Check aria-hidden className="size-4" />
              Potvrdi
            </Dugme>
            <Dugme velicina="malo" varijanta="sekundarno" onClick={() => promijeni(r, 'spremno')}>
              Spremno
            </Dugme>
            <Dugme velicina="malo" varijanta="opasno" onClick={() => promijeni(r, 'otkazano')}>
              <X aria-hidden className="size-4" />
              Odbij
            </Dugme>
          </>
        )}
        {r.status === 'potvrdjeno' && (
          <>
            <Dugme velicina="malo" onClick={() => promijeni(r, 'spremno')}>
              <PackageCheck aria-hidden className="size-4" />
              Spremno
            </Dugme>
            <Dugme velicina="malo" varijanta="opasno" onClick={() => promijeni(r, 'otkazano')}>
              <X aria-hidden className="size-4" />
              Odbij
            </Dugme>
          </>
        )}
        {r.status === 'spremno' && (
          <Dugme velicina="malo" onClick={() => promijeni(r, 'preuzeto')}>
            <Check aria-hidden className="size-4" />
            Označi kao preuzeto
          </Dugme>
        )}
      </div>
    </article>
  )
}
