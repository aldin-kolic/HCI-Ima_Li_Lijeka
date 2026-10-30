import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { RotateCcw } from 'lucide-react'
import { useApp, type Uloga, type VelicinaFonta } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Dugme, PotvrdniDijalog, Prekidac, ZaglavljeStranice, cx } from '../components/ui'

const VELICINE: { vrijednost: VelicinaFonta; tekst: string; uzorak: string }[] = [
  { vrijednost: 0, tekst: 'Normalna', uzorak: 'text-lg' },
  { vrijednost: 1, tekst: 'Veća', uzorak: 'text-2xl' },
  { vrijednost: 2, tekst: 'Najveća', uzorak: 'text-3xl' },
]

export default function Podesavanja({ uloga }: { uloga: Uloga }) {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { postavke, azurirajPostavke, resetujPrototip } = useApp()
  const [resetDijalog, setResetDijalog] = useState(false)
  const zatvoriReset = useCallback(() => setResetDijalog(false), [])

  return (
    <>
      <ZaglavljeStranice naslov="Podešavanja" opis="Prilagodite prikaz svojim potrebama. Promjene se odmah primjenjuju na cijelu aplikaciju i pamte se na ovom uređaju." />

      <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="velicina-fonta" className="panel p-5">
          <h2 id="velicina-fonta" className="text-xl">
            Veličina teksta
          </h2>
          <div role="radiogroup" aria-labelledby="velicina-fonta" className="mt-4 grid grid-cols-3 gap-3">
            {VELICINE.map((v) => {
              const odabrano = postavke.velicinaFonta === v.vrijednost
              return (
                <button
                  key={v.vrijednost}
                  type="button"
                  role="radio"
                  aria-checked={odabrano}
                  onClick={() => azurirajPostavke({ velicinaFonta: v.vrijednost })}
                  className={cx(
                    'flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 font-semibold transition-colors',
                    odabrano ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface hover:border-primary',
                  )}
                >
                  <span aria-hidden className={cx('etiketa leading-none', v.uzorak)}>
                    Aa
                  </span>
                  <span className="text-sm">{v.tekst}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="prikaz" className="panel divide-y divide-border overflow-hidden">
          <h2 id="prikaz" className="px-5 pt-5 pb-3 text-xl">
            Prikaz i zvuk
          </h2>
          <Prekidac oznaka="Tamni način rada" opis="Manje svjetla, ugodnije noću" ukljuceno={postavke.tamniNacin} onChange={(v) => azurirajPostavke({ tamniNacin: v })} />
          <Prekidac
            oznaka="Visoki kontrast"
            opis="Jače boje, deblji okviri i podvučeni linkovi"
            ukljuceno={postavke.visokiKontrast}
            onChange={(v) => azurirajPostavke({ visokiKontrast: v })}
          />
          <Prekidac oznaka="Zvučne povratne informacije" opis="Kratak zvuk pri potvrdi, grešci i novoj obavijesti" ukljuceno={postavke.zvukovi} onChange={(v) => azurirajPostavke({ zvukovi: v })} />
        </section>

        <section aria-labelledby="prototip" className="panel p-5 lg:col-span-2">
          <h2 id="prototip" className="text-xl">
            Podaci prototipa
          </h2>
          <p className="mt-1 max-w-[65ch] text-muted">Vratite rezervacije, zalihe i obavijesti na početno stanje, npr. prije snimanja demonstracije. Podešavanja prikaza ostaju.</p>
          <Dugme varijanta="opasno" className="mt-4" onClick={() => setResetDijalog(true)}>
            <RotateCcw aria-hidden className="size-4" />
            Vrati podatke na početak
          </Dugme>
        </section>
      </div>

      <PotvrdniDijalog
        otvoren={resetDijalog}
        naslov="Vratiti podatke na početak?"
        poruka="Sve nove rezervacije, promjene zaliha i obavijesti bit će poništene, a farmaceut odjavljen."
        potvrdi="Vrati na početak"
        opasno
        onOdustani={zatvoriReset}
        onPotvrdi={() => {
          resetujPrototip()
          setResetDijalog(false)
          prikaziToast('Podaci su vraćeni na početno stanje', { tip: 'info' })
          navigate(uloga === 'farmaceut' ? '/farmaceut/prijava' : '/pacijent')
        }}
      />
    </>
  )
}
