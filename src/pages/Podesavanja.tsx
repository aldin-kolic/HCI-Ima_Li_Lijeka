import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { LogOut, RotateCcw } from 'lucide-react'
import { useApp, type VelicinaFonta } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { PrekidacUloge, type Uloga } from '../components/PrekidacUloge'
import { Dugme, PotvrdniDijalog, Prekidac, Zaglavlje, cx } from '../components/ui'

const VELICINE: { vrijednost: VelicinaFonta; tekst: string; uzorak: string }[] = [
  { vrijednost: 0, tekst: 'Normalna', uzorak: 'text-base' },
  { vrijednost: 1, tekst: 'Veća', uzorak: 'text-lg' },
  { vrijednost: 2, tekst: 'Najveća', uzorak: 'text-xl' },
]

export default function Podesavanja({ uloga, onPromijeniUlogu }: { uloga: Uloga; onPromijeniUlogu: (u: Uloga) => void }) {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { postavke, azurirajPostavke, resetujPrototip, setFarmaceutPrijavljen } = useApp()
  const [resetDijalog, setResetDijalog] = useState(false)
  const zatvoriReset = useCallback(() => setResetDijalog(false), [])

  return (
    <>
      <Zaglavlje naslov="Podešavanja" podnaslov="Pristupačnost i prikaz" />
      <div className="space-y-5 p-4 pb-8">
        <section aria-labelledby="velicina-fonta">
          <h2 id="velicina-fonta" className="mb-2 font-bold">
            Veličina teksta
          </h2>
          <div role="radiogroup" aria-labelledby="velicina-fonta" className="grid grid-cols-3 gap-2">
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
                    'flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 font-semibold transition-colors',
                    odabrano ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface hover:border-primary',
                  )}
                >
                  <span aria-hidden className={cx('leading-none font-bold', v.uzorak)}>
                    Aa
                  </span>
                  <span className="text-sm">{v.tekst}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-sm text-muted">Promjena se odmah primjenjuje na cijelu aplikaciju.</p>
        </section>

        <section aria-labelledby="prikaz" className="kartica divide-y divide-border overflow-hidden">
          <h2 id="prikaz" className="sr-only">
            Prikaz
          </h2>
          <Prekidac oznaka="Tamni način rada" opis="Manje svjetla, ugodnije noću" ukljuceno={postavke.tamniNacin} onChange={(v) => azurirajPostavke({ tamniNacin: v })} />
          <Prekidac
            oznaka="Visoki kontrast"
            opis="Jače boje, deblji okviri i podvučeni linkovi"
            ukljuceno={postavke.visokiKontrast}
            onChange={(v) => azurirajPostavke({ visokiKontrast: v })}
          />
          <Prekidac oznaka="Zvučne povratne informacije" opis="Kratki zvuk pri potvrdi ili grešci" ukljuceno={postavke.zvukovi} onChange={(v) => azurirajPostavke({ zvukovi: v })} />
        </section>

        {/* Na mobitelu nema prekidača iznad okvira telefona, pa je ovdje */}
        <section aria-labelledby="uloga" className="md:hidden">
          <h2 id="uloga" className="mb-2 font-bold">
            Prikaz prototipa
          </h2>
          <PrekidacUloge uloga={uloga} onChange={onPromijeniUlogu} />
        </section>

        <section className="space-y-2 border-t border-border pt-5">
          {uloga === 'farmaceut' && (
            <Dugme
              varijanta="sekundarno"
              className="w-full"
              onClick={() => {
                setFarmaceutPrijavljen(false)
                navigate('/farmaceut/prijava')
                prikaziToast('Odjavljeni ste', { tip: 'info' })
              }}
            >
              <LogOut aria-hidden className="size-4" />
              Odjavi se
            </Dugme>
          )}
          <Dugme varijanta="tiho" className="w-full" onClick={() => setResetDijalog(true)}>
            <RotateCcw aria-hidden className="size-4" />
            Vrati podatke prototipa na početak
          </Dugme>
        </section>
      </div>

      <PotvrdniDijalog
        otvoren={resetDijalog}
        naslov="Vratiti prototip na početak?"
        poruka="Sve nove rezervacije i promjene zaliha bit će poništene. Podešavanja pristupačnosti ostaju."
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
