import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router'
import { ClipboardList, Cross, ScanBarcode } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { apoteke, apotekaPoId, cestoTrazeno, lijekPoId } from '../../data/mockData'
import { jeAktivna, opisRoka, punNazivLijeka } from '../../lib/format'
import { PretragaLijeka } from '../../components/PretragaLijeka'
import { RedApoteke } from '../../components/RedApoteke'
import { Dugme, OznakaRezervacije, PraznoStanje } from '../../components/ui'

export default function Pocetna() {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { rezervacije } = useApp()
  const [skenira, setSkenira] = useState(false)

  const dezurne = apoteke.filter((a) => a.dezurna).sort((a, b) => a.udaljenostKm - b.udaljenostKm)
  const aktivne = rezervacije.filter((r) => r.moja && jeAktivna(r.status))

  return (
    <>
      <section aria-labelledby="naslov-pocetna" className="max-w-4xl">
        <h1 id="naslov-pocetna" className="text-[2.75rem] leading-[1.05]">
          Pronađite lijek u apoteci u blizini
        </h1>
        <p className="mt-3 max-w-[60ch] text-lg text-muted">
          Provjerite koja od {apoteke.length} apoteka u Sarajevu ima lijek na stanju, rezervišite ga i preuzmite u roku od dva sata.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <PretragaLijeka velicina="velika" id="pretraga-pocetna" />
          </div>
          <Dugme varijanta="sekundarno" velicina="veliko" className="h-16 sm:w-auto" onClick={() => setSkenira(true)}>
            <ScanBarcode aria-hidden className="size-5" />
            Skeniraj kutiju
          </Dugme>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span id="cesto-trazeno" className="mr-1 text-sm text-muted">
            Često traženo:
          </span>
          <ul aria-labelledby="cesto-trazeno" className="contents">
            {cestoTrazeno.map((id) => {
              const l = lijekPoId(id)!
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/pacijent/pretraga?lijek=${id}`)}
                    className="min-h-11 rounded-full border border-border bg-surface px-4 text-sm font-semibold hover:border-primary hover:text-primary"
                  >
                    {l.naziv} {l.jacina.split('/')[0]}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <ol className="mt-10 grid gap-6 border-t border-border pt-6 text-sm sm:grid-cols-3" aria-label="Kako funkcioniše rezervacija">
          {[
            ['Pretražite', 'Upišite naziv lijeka ili aktivnu tvar.'],
            ['Rezervišite', 'Izaberite apoteku koja ima lijek na stanju.'],
            ['Preuzmite', 'Pokažite kod rezervacije u roku od 2 sata.'],
          ].map(([naslov, opis], i) => (
            <li key={naslov} className="flex gap-3">
              <span aria-hidden className="etiketa grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                {i + 1}
              </span>
              <span>
                <strong className="block">{naslov}</strong>
                <span className="text-muted">{opis}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 grid items-start gap-6 xl:grid-cols-12">
        <section aria-labelledby="dezurne-naslov" className="panel overflow-hidden xl:col-span-7">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <Cross aria-hidden className="krst-svijetli size-6" strokeWidth={2.75} />
              <div>
                <h2 id="dezurne-naslov" className="text-xl">
                  Dežurne apoteke večeras
                </h2>
                <p className="text-sm text-muted">Otvorene cijelu noć, do nedjelje u 08:00</p>
              </div>
            </div>
            <Link to="/pacijent/dezurne" className="min-h-11 content-center rounded-md px-2 text-sm font-semibold text-primary hover:underline">
              Prikaži na mapi
            </Link>
          </div>
          <div className="divide-y divide-border">
            {dezurne.map((a) => (
              <RedApoteke key={a.id} apoteka={a} />
            ))}
          </div>
        </section>

        <section aria-labelledby="moje-naslov" className="panel overflow-hidden xl:col-span-5">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 id="moje-naslov" className="text-xl">
              Aktivne rezervacije
            </h2>
            <Link to="/pacijent/rezervacije" className="min-h-11 content-center rounded-md px-2 text-sm font-semibold text-primary hover:underline">
              Sve rezervacije
            </Link>
          </div>
          {aktivne.length === 0 ? (
            <PraznoStanje ikona={<ClipboardList className="size-7" />} naslov="Nemate aktivnih rezervacija" opis="Pretražite lijek iznad i rezervišite ga u apoteci." />
          ) : (
            <ul className="divide-y divide-border">
              {aktivne.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{punNazivLijeka(lijekPoId(r.lijekId)!)}</p>
                    <OznakaRezervacije status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {r.kod}, {apotekaPoId(r.apotekaId)!.naziv}. Preuzmite {opisRoka(r.rokPreuzimanja)}.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {skenira && (
        <Skener
          onOdustani={() => setSkenira(false)}
          onPrepoznato={() => {
            setSkenira(false)
            prikaziToast('Prepoznato: Brufen 400 mg')
            navigate('/pacijent/pretraga?lijek=brufen-400')
          }}
        />
      )}
    </>
  )
}

/** Simulacija skeniranja bar-koda: nakon 1,5 s "prepozna" Brufen 400. */
function Skener({ onOdustani, onPrepoznato }: { onOdustani: () => void; onPrepoznato: () => void }) {
  const odustaniRef = useRef<HTMLButtonElement>(null)
  const callbacks = useRef({ onOdustani, onPrepoznato })
  callbacks.current = { onOdustani, onPrepoznato }

  useEffect(() => {
    odustaniRef.current?.focus()
    const t = window.setTimeout(() => callbacks.current.onPrepoznato(), 1500)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && callbacks.current.onOdustani()
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Skeniranje kutije lijeka" className="fixed inset-0 z-[60] grid place-items-center bg-[rgb(4_14_10/0.92)] p-6 text-white">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/25 bg-neutral-800">
          <div className="absolute inset-6 rounded-xl border-4 border-dashed border-white/70" />
          <div className="skener-linija absolute inset-x-6 h-0.5 bg-emerald-300 shadow-[0_0_12px_2px] shadow-emerald-300" />
        </div>
        <div className="text-center" aria-live="polite">
          <p className="text-xl font-bold">Skeniranje kutije…</p>
          <p className="text-white/80">Držite bar-kod lijeka ispred kamere</p>
        </div>
        <button ref={odustaniRef} type="button" onClick={onOdustani} className="min-h-11 rounded-lg border-2 border-white px-6 font-semibold hover:bg-white/10">
          Odustani
        </button>
      </div>
    </div>,
    document.body,
  )
}
