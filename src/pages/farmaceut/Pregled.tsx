import { Link } from 'react-router'
import { CircleX, Hourglass, Inbox, PackageCheck, Search, TriangleAlert } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { APOTEKA_FARMACEUTA_ID, FARMACEUT_IME, SADA, lijekPoId, lijekovi, pretrageDanas, rezervacijePoSatu } from '../../data/mockData'
import { formatDatum, formatVrijeme, minutaOd, mnozina, prijeKoliko, punNazivLijeka } from '../../lib/format'
import { useAkcijeRezervacije } from '../../lib/akcije'
import { GrafikonPoSatu } from '../../components/GrafikonPoSatu'
import { Dugme, PraznoStanje, ZaglavljeStranice, cx } from '../../components/ui'

/** Pregled (dashboard) za farmaceuta: šta traži pažnju sada. */
export default function Pregled() {
  const prikaziToast = useToast()
  const { rezervacije, zalihe, promijeniZalihu } = useApp()
  const promijeni = useAkcijeRezervacije()
  const stanje = zalihe[APOTEKA_FARMACEUTA_ID]
  const ovdje = rezervacije.filter((r) => r.apotekaId === APOTEKA_FARMACEUTA_ID)
  const nove = ovdje.filter((r) => r.status === 'na_cekanju').sort((a, b) => a.kreirano.getTime() - b.kreirano.getTime())
  const spremne = ovdje.filter((r) => r.status === 'spremno')
  const nema = lijekovi.filter((l) => stanje[l.id].status === 'nema')
  const malo = lijekovi.filter((l) => stanje[l.id].status === 'malo')
  const trazeniNema = [...nema].sort((a, b) => (pretrageDanas[b.id] ?? 0) - (pretrageDanas[a.id] ?? 0))

  // Nove rezervacije iz prototipa se dodaju trenutnom satu, da grafikon reaguje
  const noveSada = ovdje.filter((r) => r.kreirano.getTime() === SADA.getTime()).length
  const podaci = rezervacijePoSatu.map((p) => (p.sat === SADA.getHours() ? { ...p, broj: p.broj + noveSada } : p))

  const pokazatelji = [
    { tekst: 'Čeka potvrdu', broj: nove.length, Ikona: Hourglass, to: '/farmaceut/rezervacije', boja: 'text-info bg-info-soft' },
    { tekst: 'Spremno za preuzimanje', broj: spremne.length, Ikona: PackageCheck, to: '/farmaceut/rezervacije', boja: 'text-ok bg-ok-soft' },
    { tekst: 'Malo na stanju', broj: malo.length, Ikona: TriangleAlert, to: '/farmaceut/zalihe?stanje=malo', boja: 'text-warn bg-warn-soft' },
    { tekst: 'Nema na stanju', broj: nema.length, Ikona: CircleX, to: '/farmaceut/zalihe?stanje=nema', boja: 'text-bad bg-bad-soft' },
  ]

  return (
    <>
      <ZaglavljeStranice
        naslov={`Dobro veče, ${FARMACEUT_IME.split(' ')[0]}`}
        opis={`Apoteka Centar je večeras dežurna. Subota, ${formatDatum(SADA)} u ${formatVrijeme(SADA)}.`}
      />

      <section aria-label="Stanje ukratko" className="panel grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
        {pokazatelji.map(({ tekst, broj, Ikona, to, boja }, i) => (
          <Link
            key={tekst}
            to={to}
            data-bez-podvlake
            className={cx(
              'flex items-center gap-4 px-5 py-5 hover:bg-surface-2/60',
              i > 0 && 'border-t border-border sm:border-t-0',
              i % 2 === 1 && 'sm:border-l',
              i >= 2 && 'sm:border-t xl:border-t-0',
              i > 0 && 'xl:border-l',
              'border-border',
            )}
          >
            <span aria-hidden className={cx('grid size-11 shrink-0 place-items-center rounded-lg', boja)}>
              <Ikona className="size-5" />
            </span>
            <span>
              <span className="etiketa block text-[2rem] leading-none">{broj}</span>
              <span className="text-sm text-muted">{tekst}</span>
            </span>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-12">
        <section aria-labelledby="graf-naslov" className="panel p-5 xl:col-span-7">
          <h2 id="graf-naslov" className="mb-1 text-xl">
            Rezervacije danas po satu
          </h2>
          <GrafikonPoSatu podaci={podaci} trenutniSat={SADA.getHours()} naslovId="graf-naslov" />
        </section>

        <div className="space-y-6 xl:col-span-5">
          <section aria-labelledby="nove-naslov" className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="nove-naslov" className="text-xl">
                Čeka vašu potvrdu
              </h2>
              <Link to="/farmaceut/rezervacije" className="min-h-11 content-center rounded-md px-2 text-sm font-semibold text-primary hover:underline">
                Sve rezervacije
              </Link>
            </div>
            {nove.length === 0 ? (
              <PraznoStanje ikona={<Inbox className="size-7" />} naslov="Sve je potvrđeno" opis="Nove rezervacije pojavit će se ovdje i u obavijestima." />
            ) : (
              <ul className="divide-y divide-border">
                {nove.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {r.kod}: {punNazivLijeka(lijekPoId(r.lijekId)!)} × {r.kolicina}
                      </p>
                      <p className="text-sm text-muted">
                        {r.pacijent}, {prijeKoliko(minutaOd(r.kreirano))}
                      </p>
                    </div>
                    <Dugme velicina="malo" onClick={() => promijeni(r, 'potvrdjeno')}>
                      Potvrdi
                    </Dugme>
                    <Dugme velicina="malo" varijanta="sekundarno" onClick={() => promijeni(r, 'spremno')}>
                      Spremno
                    </Dugme>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="trazeno-naslov" className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 id="trazeno-naslov" className="text-xl">
                Traženo, a nema na stanju
              </h2>
              <p className="text-sm text-muted">Pacijenti danas traže ove lijekove. Ako su stigli, označite ih.</p>
            </div>
            {trazeniNema.length === 0 ? (
              <p className="px-5 py-6 text-muted">Svi lijekovi su na stanju.</p>
            ) : (
              <ul className="divide-y divide-border">
                {trazeniNema.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                    <Search aria-hidden className="size-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{punNazivLijeka(l)}</p>
                      <p className="text-sm text-muted">
                        Traženo {pretrageDanas[l.id] ?? 0} {mnozina(pretrageDanas[l.id] ?? 0, 'put', 'puta', 'puta')} danas
                      </p>
                    </div>
                    <Dugme
                      velicina="malo"
                      varijanta="sekundarno"
                      onClick={() => {
                        const prije = stanje[l.id]
                        promijeniZalihu(APOTEKA_FARMACEUTA_ID, l.id, 'na_stanju')
                        prikaziToast(`${punNazivLijeka(l)}: na stanju`, {
                          akcija: { tekst: 'Poništi', onClick: () => promijeniZalihu(APOTEKA_FARMACEUTA_ID, l.id, prije.status, prije.azuriranoPrijeMin) },
                        })
                      }}
                    >
                      Označi na stanju
                    </Dugme>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
