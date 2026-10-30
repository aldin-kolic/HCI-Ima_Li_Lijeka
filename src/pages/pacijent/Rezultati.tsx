import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRightLeft, ChevronRight, List, Map as MapIkona, PackageX, SearchX, FilterX } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { apoteke, cestoTrazeno, lijekPoId, type Lijek } from '../../data/mockData'
import { formatKM, jeOtvorenoSada, mnozina, pretraziLijekove, punNazivLijeka } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { KarticaApoteke } from '../../components/KarticaApoteke'
import { LegendaMape, SvgMapa } from '../../components/SvgMapa'
import { Dugme, FilterCip, OznakaRecept, PraznoStanje, Segmenti, SkeletonKartice, Zaglavlje } from '../../components/ui'

export default function Rezultati() {
  const [params] = useSearchParams()
  const lijek = lijekPoId(params.get('lijek') ?? '')
  if (lijek) return <RezultatiZaLijek key={lijek.id} lijek={lijek} />
  return <RezultatiTeksta upit={params.get('q') ?? ''} />
}

/** Pretraga slobodnim tekstom: ili izbor između više lijekova, ili "nema rezultata". */
function RezultatiTeksta({ upit }: { upit: string }) {
  const navigate = useNavigate()
  const pogoci = pretraziLijekove(upit)
  const ucitava = useSimuliranoUcitavanje(upit)

  return (
    <>
      <Zaglavlje naslov={`„${upit}"`} podnaslov="Rezultati pretrage" nazad="/pacijent" />
      <div className="p-4">
        {ucitava ? (
          <SkeletonKartice broj={2} />
        ) : pogoci.length === 0 ? (
          <PraznoStanje
            ikona={<SearchX className="size-8" />}
            naslov={`Nismo pronašli „${upit}"`}
            opis="Provjerite kako je naziv napisan ili pokušajte s aktivnom tvari (npr. ibuprofen, paracetamol). Možete i skenirati kutiju lijeka."
          >
            <Dugme onClick={() => navigate('/pacijent')}>Nova pretraga</Dugme>
            <p className="mt-3 text-sm font-semibold text-muted">Ili izaberite često traženi lijek:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {cestoTrazeno.map((id) => {
                const l = lijekPoId(id)!
                return (
                  <Link
                    key={id}
                    to={`/pacijent/pretraga?lijek=${id}`}
                    data-bez-podvlake
                    className="inline-flex min-h-11 items-center rounded-full border-2 border-border bg-surface px-4 text-sm font-semibold hover:border-primary"
                  >
                    {l.naziv}
                  </Link>
                )
              })}
            </div>
          </PraznoStanje>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted" aria-live="polite">
              Pronađeno {pogoci.length} {mnozina(pogoci.length, 'lijek', 'lijeka', 'lijekova')}. Izaberite tačan lijek:
            </p>
            <ul className="space-y-2">
              {pogoci.map((l) => (
                <li key={l.id}>
                  <Link to={`/pacijent/pretraga?lijek=${l.id}`} data-bez-podvlake className="kartica flex min-h-16 items-center gap-3 p-4 hover:shadow-md">
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{punNazivLijeka(l)}</span>
                      <span className="block text-sm text-muted">
                        {l.oblik} · {l.aktivnaTvar}
                      </span>
                    </span>
                    {l.naRecept && <OznakaRecept />}
                    <ChevronRight aria-hidden className="size-5 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}

type Prikaz = 'lista' | 'mapa'

function RezultatiZaLijek({ lijek }: { lijek: Lijek }) {
  const navigate = useNavigate()
  const { zalihe } = useApp()
  const [params, setParams] = useSearchParams()
  const ucitava = useSimuliranoUcitavanje(lijek.id)

  const prikaz: Prikaz = params.get('prikaz') === 'mapa' ? 'mapa' : 'lista'
  const samoOtvorene = params.get('otvoreno') === '1'
  const samoNaStanju = params.get('naStanju') === '1'

  // Filteri i prikaz se čuvaju u URL-u, pa "Nazad" vraća isto stanje
  const postavi = (kljuc: string, vrijednost: string | null) => {
    const novi = new URLSearchParams(params)
    if (vrijednost === null) novi.delete(kljuc)
    else novi.set(kljuc, vrijednost)
    setParams(novi, { replace: true })
  }

  const sve = apoteke
    .map((apoteka) => ({ apoteka, stavka: zalihe[apoteka.id][lijek.id] }))
    .sort((a, b) => a.apoteka.udaljenostKm - b.apoteka.udaljenostKm)
  const dostupne = sve.filter((r) => r.stavka.status !== 'nema')
  const nigdje = dostupne.length === 0
  const prikazane = sve.filter((r) => (!samoOtvorene || jeOtvorenoSada(r.apoteka)) && (!samoNaStanju || r.stavka.status !== 'nema'))

  const [odabrana, setOdabrana] = useState<string | undefined>(() => (dostupne[0] ?? sve[0]).apoteka.id)
  const odabraniRed = prikazane.find((r) => r.apoteka.id === odabrana) ?? prikazane[0]

  const zamjene = lijek.zamjene.map((id) => lijekPoId(id)!).map((z) => ({
    lijek: z,
    brojApoteka: apoteke.filter((a) => zalihe[a.id][z.id].status !== 'nema').length,
  }))

  return (
    <>
      <Zaglavlje naslov={punNazivLijeka(lijek)} podnaslov={`${lijek.oblik} · ${formatKM(lijek.cijenaKM)}`} nazad="/pacijent" />

      <div className="space-y-3 p-4">
        {lijek.naRecept && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <OznakaRecept /> Za preuzimanje ponesite recept.
          </p>
        )}

        <Segmenti<Prikaz>
          oznaka="Način prikaza"
          vrijednost={prikaz}
          onChange={(v) => postavi('prikaz', v === 'mapa' ? 'mapa' : null)}
          opcije={[
            { vrijednost: 'lista', tekst: 'Lista', ikona: <List aria-hidden className="size-4" /> },
            { vrijednost: 'mapa', tekst: 'Mapa', ikona: <MapIkona aria-hidden className="size-4" /> },
          ]}
        />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filteri">
          <FilterCip aktivan={samoOtvorene} onClick={() => postavi('otvoreno', samoOtvorene ? null : '1')}>
            Otvoreno sada
          </FilterCip>
          <FilterCip aktivan={samoNaStanju} onClick={() => postavi('naStanju', samoNaStanju ? null : '1')}>
            Samo na stanju
          </FilterCip>
        </div>

        {ucitava ? (
          <SkeletonKartice />
        ) : (
          <>
            <p className="text-sm text-muted" aria-live="polite">
              {nigdje
                ? 'Lijek trenutno nije dostupan ni u jednoj apoteci.'
                : `Dostupno u ${dostupne.length} od ${sve.length} apoteka · prikazano ${prikazane.length}, sortirano po udaljenosti`}
            </p>

            {nigdje && <NemaNigdje lijek={lijek} zamjene={zamjene} />}

            {!nigdje && prikazane.length === 0 && (
              <PraznoStanje
                ikona={<FilterX className="size-8" />}
                naslov="Nijedna apoteka ne odgovara filterima"
                opis={`${dostupne.length} ${mnozina(dostupne.length, 'apoteka ima', 'apoteke imaju', 'apoteka ima')} ovaj lijek, ali nijedna nije otvorena sada uz odabrane filtere.`}
              >
                <Dugme
                  onClick={() => {
                    const novi = new URLSearchParams(params)
                    novi.delete('otvoreno')
                    novi.delete('naStanju')
                    setParams(novi, { replace: true })
                  }}
                >
                  Ukloni filtere
                </Dugme>
                <Dugme varijanta="sekundarno" onClick={() => navigate('/pacijent/dezurne')}>
                  Pogledaj dežurne apoteke
                </Dugme>
              </PraznoStanje>
            )}

            {prikazane.length > 0 &&
              (prikaz === 'lista' ? (
                <ul className="space-y-3">
                  {prikazane.map(({ apoteka, stavka }) => (
                    <li key={apoteka.id}>
                      <KarticaApoteke apoteka={apoteka} lijek={lijek} stavka={stavka} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <SvgMapa pinovi={prikazane.map((r) => ({ apoteka: r.apoteka, status: r.stavka.status }))} odabrana={odabraniRed?.apoteka.id} onOdaberi={setOdabrana} />
                  <LegendaMape />
                  {odabraniRed && (
                    <div className="mt-3" aria-live="polite">
                      <KarticaApoteke apoteka={odabraniRed.apoteka} lijek={lijek} stavka={odabraniRed.stavka} />
                    </div>
                  )}
                </div>
              ))}

            {!nigdje && zamjene.length > 0 && (
              <section aria-labelledby="zamjene" className="pt-2">
                <h2 id="zamjene" className="mb-2 text-sm font-semibold text-muted">
                  Generička zamjena (isti sastav)
                </h2>
                {zamjene.map((z) => (
                  <KarticaZamjene key={z.lijek.id} lijek={z.lijek} brojApoteka={z.brojApoteka} uporedi={lijek} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}

function NemaNigdje({ lijek, zamjene }: { lijek: Lijek; zamjene: { lijek: Lijek; brojApoteka: number }[] }) {
  const navigate = useNavigate()
  const dostupneZamjene = zamjene.filter((z) => z.brojApoteka > 0)
  return (
    <div className="space-y-3">
      <div className="kartica flex gap-3 border-warn/40 bg-warn-soft p-4 text-warn">
        <PackageX aria-hidden className="size-6 shrink-0" />
        <p>
          <strong>{punNazivLijeka(lijek)}</strong> trenutno nema ni u jednoj od {apoteke.length} apoteka.
        </p>
      </div>

      {dostupneZamjene.length > 0 ? (
        <>
          <h2 className="font-bold">Predlažemo generičku zamjenu</h2>
          {dostupneZamjene.map((z) => (
            <KarticaZamjene key={z.lijek.id} lijek={z.lijek} brojApoteka={z.brojApoteka} uporedi={lijek} istaknuto />
          ))}
          <p className="text-sm text-muted">Zamjenu uvijek potvrdite s farmaceutom ili ljekarom.</p>
        </>
      ) : (
        <div className="kartica p-4">
          <h2 className="font-bold">Šta možete uraditi?</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>Pozovite dežurnu apoteku – farmaceut može predložiti zamjenu ili naručiti lijek.</li>
            <li>Provjerite ponovo kasnije – apoteke ažuriraju zalihe više puta dnevno.</li>
            <li>Pitajte svog ljekara za drugi lijek sa sličnim djelovanjem.</li>
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Dugme onClick={() => navigate('/pacijent/dezurne')}>Pogledaj dežurne apoteke</Dugme>
            <Dugme varijanta="sekundarno" onClick={() => navigate('/pacijent')}>
              Nova pretraga
            </Dugme>
          </div>
        </div>
      )}
    </div>
  )
}

function KarticaZamjene({ lijek, brojApoteka, uporedi, istaknuto }: { lijek: Lijek; brojApoteka: number; uporedi: Lijek; istaknuto?: boolean }) {
  const razlika = uporedi.cijenaKM - lijek.cijenaKM
  return (
    <Link
      to={`/pacijent/pretraga?lijek=${lijek.id}`}
      data-bez-podvlake
      className={`kartica flex items-center gap-3 p-4 hover:shadow-md ${istaknuto ? 'border-2 border-primary' : ''}`}
    >
      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <ArrowRightLeft className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{punNazivLijeka(lijek)}</span>
        <span className="block text-sm text-muted">
          {lijek.aktivnaTvar} · {formatKM(lijek.cijenaKM)}
          {razlika > 0 && ` (${formatKM(razlika)} jeftinije)`}
        </span>
        <span className="block text-sm font-semibold text-ok">
          {brojApoteka > 0 ? `Dostupno u ${brojApoteka} ${mnozina(brojApoteka, 'apoteci', 'apoteke', 'apoteka')}` : 'Trenutno nije dostupno'}
        </span>
      </span>
      <ChevronRight aria-hidden className="size-5 text-muted" />
    </Link>
  )
}
