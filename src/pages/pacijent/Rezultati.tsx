import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowRightLeft, ChevronRight, FilterX, List, Map as MapIkona, PackageX, SearchX } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { apoteke, cestoTrazeno, lijekPoId, type Lijek } from '../../data/mockData'
import { formatKM, jeOtvorenoSada, mnozina, pretraziLijekove, punNazivLijeka } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { RedApoteke } from '../../components/RedApoteke'
import { LegendaMape, SvgMapa } from '../../components/SvgMapa'
import { Dugme, EtiketaLijeka, FilterCip, OznakaRecept, PraznoStanje, Segmenti, SkeletonRedovi, ZaglavljeStranice, cx } from '../../components/ui'

export default function Rezultati() {
  const [params] = useSearchParams()
  const lijek = lijekPoId(params.get('lijek') ?? '')
  if (lijek) return <RezultatiZaLijek key={lijek.id} lijek={lijek} />
  return <RezultatiTeksta upit={params.get('q') ?? ''} />
}

/** Pretraga slobodnim tekstom: izbor između više lijekova ili "nema rezultata". */
function RezultatiTeksta({ upit }: { upit: string }) {
  const navigate = useNavigate()
  const pogoci = pretraziLijekove(upit)
  const ucitava = useSimuliranoUcitavanje(upit)

  return (
    <>
      <ZaglavljeStranice
        naslov={`Rezultati za „${upit}"`}
        mrvice={[{ tekst: 'Početna', to: '/pacijent' }, { tekst: 'Pretraga' }]}
        opis={!ucitava && pogoci.length > 0 ? `Pronađeno ${pogoci.length} ${mnozina(pogoci.length, 'lijek', 'lijeka', 'lijekova')}. Izaberite tačan lijek i jačinu.` : undefined}
      />
      <div className="panel max-w-3xl overflow-hidden">
        {ucitava ? (
          <SkeletonRedovi broj={2} />
        ) : pogoci.length === 0 ? (
          <PraznoStanje
            ikona={<SearchX className="size-7" />}
            naslov={`Nema lijeka „${upit}" u bazi`}
            opis="Provjerite kako je naziv napisan ili pretražite po aktivnoj tvari, npr. ibuprofen ili paracetamol. Možete i skenirati kutiju lijeka na početnoj."
          >
            <Dugme onClick={() => navigate('/pacijent')}>Nova pretraga</Dugme>
            {cestoTrazeno.map((id) => (
              <Dugme key={id} varijanta="sekundarno" onClick={() => navigate(`/pacijent/pretraga?lijek=${id}`)}>
                {lijekPoId(id)!.naziv}
              </Dugme>
            ))}
          </PraznoStanje>
        ) : (
          <ul className="divide-y divide-border">
            {pogoci.map((l) => (
              <li key={l.id}>
                <Link to={`/pacijent/pretraga?lijek=${l.id}`} data-bez-podvlake className="flex min-h-16 items-center gap-4 px-5 py-3 hover:bg-surface-2/60">
                  <span className="min-w-0 flex-1">
                    <EtiketaLijeka lijek={l} velicina="mala" />
                    <span className="block text-sm text-muted">
                      {l.oblik}, {l.aktivnaTvar}
                    </span>
                  </span>
                  {l.naRecept && <OznakaRecept />}
                  <ChevronRight aria-hidden className="size-5 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

type Prikaz = 'lista' | 'mapa'
type Sortiranje = 'udaljenost' | 'zaliha' | 'azurirano'

const RANG_ZALIHE = { na_stanju: 0, malo: 1, nema: 2 }

function RezultatiZaLijek({ lijek }: { lijek: Lijek }) {
  const navigate = useNavigate()
  const { zalihe } = useApp()
  const [params, setParams] = useSearchParams()
  const ucitava = useSimuliranoUcitavanje(lijek.id)

  const prikaz: Prikaz = params.get('prikaz') === 'mapa' ? 'mapa' : 'lista'
  const sortiranje = (params.get('sort') as Sortiranje) || 'udaljenost'
  const samoOtvorene = params.get('otvoreno') === '1'
  const samoNaStanju = params.get('naStanju') === '1'

  // Filteri, sortiranje i prikaz se čuvaju u URL-u – "Nazad" i osvježavanje vraćaju isto stanje
  const postavi = (izmjene: Record<string, string | null>) => {
    const novi = new URLSearchParams(params)
    Object.entries(izmjene).forEach(([k, v]) => (v === null ? novi.delete(k) : novi.set(k, v)))
    setParams(novi, { replace: true })
  }

  const sve = apoteke.map((apoteka) => ({ apoteka, stavka: zalihe[apoteka.id][lijek.id] }))
  const dostupne = sve.filter((r) => r.stavka.status !== 'nema')
  const nigdje = dostupne.length === 0
  const prikazane = sve
    .filter((r) => (!samoOtvorene || jeOtvorenoSada(r.apoteka)) && (!samoNaStanju || r.stavka.status !== 'nema'))
    .sort((a, b) => {
      if (sortiranje === 'zaliha') return RANG_ZALIHE[a.stavka.status] - RANG_ZALIHE[b.stavka.status] || a.apoteka.udaljenostKm - b.apoteka.udaljenostKm
      if (sortiranje === 'azurirano') return a.stavka.azuriranoPrijeMin - b.stavka.azuriranoPrijeMin
      return a.apoteka.udaljenostKm - b.apoteka.udaljenostKm
    })

  const [odabrana, setOdabrana] = useState<string | undefined>(() => [...dostupne].sort((a, b) => a.apoteka.udaljenostKm - b.apoteka.udaljenostKm)[0]?.apoteka.id)
  const odabraniRed = prikazane.find((r) => r.apoteka.id === odabrana)

  const zamjene = lijek.zamjene.map((id) => lijekPoId(id)!).map((z) => ({
    lijek: z,
    brojApoteka: apoteke.filter((a) => zalihe[a.id][z.id].status !== 'nema').length,
  }))

  const mapa = (
    <div>
      <SvgMapa pinovi={prikazane.map((r) => ({ apoteka: r.apoteka, status: r.stavka.status }))} odabrana={odabraniRed?.apoteka.id} onOdaberi={setOdabrana} />
      <LegendaMape />
      {odabraniRed && (
        <div className="panel mt-3 overflow-hidden" aria-live="polite">
          <RedApoteke apoteka={odabraniRed.apoteka} lijek={lijek} stavka={odabraniRed.stavka} />
        </div>
      )}
    </div>
  )

  return (
    <>
      <ZaglavljeStranice
        mrvice={[{ tekst: 'Početna', to: '/pacijent' }, { tekst: 'Pretraga' }, { tekst: punNazivLijeka(lijek) }]}
        naslov={<EtiketaLijeka lijek={lijek} velicina="velika" />}
        opis={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {lijek.oblik[0].toUpperCase() + lijek.oblik.slice(1)}, aktivna tvar {lijek.aktivnaTvar}. Cijena {formatKM(lijek.cijenaKM)}.
            </span>
            {lijek.naRecept && <OznakaRecept />}
          </span>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filteri" className="flex flex-wrap gap-2">
          <FilterCip aktivan={samoOtvorene} onClick={() => postavi({ otvoreno: samoOtvorene ? null : '1' })}>
            Otvoreno sada
          </FilterCip>
          <FilterCip aktivan={samoNaStanju} onClick={() => postavi({ naStanju: samoNaStanju ? null : '1' })}>
            Samo na stanju
          </FilterCip>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Sortiraj po</span>
          <select
            value={sortiranje}
            onChange={(e) => postavi({ sort: e.target.value === 'udaljenost' ? null : e.target.value })}
            className="min-h-11 rounded-lg border border-border bg-surface px-3 font-semibold focus:border-primary"
          >
            <option value="udaljenost">udaljenosti</option>
            <option value="zaliha">stanju zalihe</option>
            <option value="azurirano">zadnjem ažuriranju</option>
          </select>
        </label>
        <Segmenti<Prikaz>
          className="ml-auto xl:hidden"
          oznaka="Način prikaza"
          vrijednost={prikaz}
          onChange={(v) => postavi({ prikaz: v === 'mapa' ? 'mapa' : null })}
          opcije={[
            { vrijednost: 'lista', tekst: 'Lista', ikona: <List aria-hidden className="size-4" /> },
            { vrijednost: 'mapa', tekst: 'Mapa', ikona: <MapIkona aria-hidden className="size-4" /> },
          ]}
        />
      </div>

      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {ucitava
          ? 'Učitavam zalihe…'
          : nigdje
            ? `Lijek trenutno nije dostupan ni u jednoj od ${sve.length} apoteka.`
            : `Na stanju u ${dostupne.length} od ${sve.length} apoteka. Prikazano ${prikazane.length}.`}
      </p>

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <div className={cx('space-y-6 xl:col-span-7', prikaz === 'mapa' && 'hidden xl:block')}>
          {nigdje && !ucitava && <NemaNigdje lijek={lijek} zamjene={zamjene} />}

          <section aria-label="Apoteke" className="panel overflow-hidden">
            {ucitava ? (
              <SkeletonRedovi />
            ) : prikazane.length === 0 ? (
              <PraznoStanje
                ikona={<FilterX className="size-7" />}
                naslov="Nijedna apoteka ne odgovara filterima"
                opis={
                  nigdje
                    ? 'Ovaj lijek trenutno nema nijedna apoteka.'
                    : `${dostupne.length} ${mnozina(dostupne.length, 'apoteka ima', 'apoteke imaju', 'apoteka ima')} ovaj lijek, ali nijedna nije otvorena sada.`
                }
              >
                <Dugme onClick={() => postavi({ otvoreno: null, naStanju: null })}>Ukloni filtere</Dugme>
                <Dugme varijanta="sekundarno" onClick={() => navigate('/pacijent/dezurne')}>
                  Pogledaj dežurne apoteke
                </Dugme>
              </PraznoStanje>
            ) : (
              <div className="divide-y divide-border">
                {prikazane.map(({ apoteka, stavka }) => (
                  <RedApoteke
                    key={apoteka.id}
                    apoteka={apoteka}
                    lijek={lijek}
                    stavka={stavka}
                    aktivna={apoteka.id === odabraniRed?.apoteka.id}
                    onAktiviraj={() => setOdabrana(apoteka.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {!nigdje && zamjene.length > 0 && !ucitava && (
            <section aria-labelledby="zamjene">
              <h2 id="zamjene" className="mb-2 text-xl">
                Generička zamjena
              </h2>
              <p className="mb-3 text-sm text-muted">Isti sastav, drugi proizvođač. Zamjenu potvrdite s farmaceutom.</p>
              {zamjene.map((z) => (
                <KarticaZamjene key={z.lijek.id} lijek={z.lijek} brojApoteka={z.brojApoteka} uporedi={lijek} />
              ))}
            </section>
          )}
        </div>

        <aside aria-label="Mapa apoteka" className={cx('xl:sticky xl:top-24 xl:col-span-5', prikaz === 'lista' && 'hidden xl:block')}>
          {ucitava ? <div className="skeleton aspect-[360/260] rounded-xl" /> : mapa}
        </aside>
      </div>
    </>
  )
}

function NemaNigdje({ lijek, zamjene }: { lijek: Lijek; zamjene: { lijek: Lijek; brojApoteka: number }[] }) {
  const navigate = useNavigate()
  const dostupneZamjene = zamjene.filter((z) => z.brojApoteka > 0)
  return (
    <div className="space-y-4">
      <div className="panel flex gap-3 border-warn/40 bg-warn-soft p-5 text-warn">
        <PackageX aria-hidden className="size-6 shrink-0" />
        <p>
          <strong>{punNazivLijeka(lijek)}</strong> trenutno nema ni u jednoj apoteci.
          {dostupneZamjene.length > 0 ? ' Dostupna je generička zamjena istog sastava.' : ' Pogledajte šta možete uraditi.'}
        </p>
      </div>
      {dostupneZamjene.length > 0 ? (
        dostupneZamjene.map((z) => <KarticaZamjene key={z.lijek.id} lijek={z.lijek} brojApoteka={z.brojApoteka} uporedi={lijek} istaknuto />)
      ) : (
        <div className="panel p-5">
          <h2 className="text-xl">Šta možete uraditi?</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>Pozovite dežurnu apoteku – farmaceut može predložiti zamjenu ili naručiti lijek.</li>
            <li>Provjerite ponovo kasnije – apoteke ažuriraju zalihe više puta dnevno.</li>
            <li>Pitajte svog ljekara za drugi lijek sa sličnim djelovanjem.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
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
      aria-label={`Prikaži zamjenu ${punNazivLijeka(lijek)}`}
      className={cx('panel flex items-center gap-4 p-5 hover:border-primary', istaknuto && 'border-2 border-primary')}
    >
      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <ArrowRightLeft className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <EtiketaLijeka lijek={lijek} velicina="mala" />
        <span className="mt-1 block text-sm text-muted">
          {lijek.aktivnaTvar}, {formatKM(lijek.cijenaKM)}
          {razlika > 0 && `, ${formatKM(razlika)} jeftinije`}
        </span>
        <span className="block text-sm font-semibold text-ok">
          {brojApoteka > 0 ? `Na stanju u ${brojApoteka} ${mnozina(brojApoteka, 'apoteci', 'apoteke', 'apoteka')}` : 'Trenutno nije dostupno'}
        </span>
      </span>
      <span className="hidden text-sm font-semibold text-primary sm:block">Prikaži zamjenu</span>
      <ChevronRight aria-hidden className="size-5 text-muted" />
    </Link>
  )
}
