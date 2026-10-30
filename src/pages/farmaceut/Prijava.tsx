import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { Cross, Loader2, Store } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { APOTEKA_FARMACEUTA_ID, FARMACEUT_IME, apotekaPoId } from '../../data/mockData'
import { Dugme } from '../../components/ui'

/** Prijava bez prave autentifikacije – samo dugme. */
export default function Prijava() {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { farmaceutPrijavljen, setFarmaceutPrijavljen } = useApp()
  const [prijavljuje, setPrijavljuje] = useState(false)
  const apoteka = apotekaPoId(APOTEKA_FARMACEUTA_ID)!

  if (farmaceutPrijavljen) return <Navigate to="/farmaceut" replace />

  const prijavi = () => {
    setPrijavljuje(true)
    window.setTimeout(() => {
      setFarmaceutPrijavljen(true)
      prikaziToast(`Dobro veče, ${FARMACEUT_IME}`)
      navigate('/farmaceut', { replace: true })
    }, 500)
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-nav p-12 text-nav-fg lg:flex">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-signal text-nav">
            <Cross className="size-6" strokeWidth={2.75} />
          </span>
          <span className="etiketa text-2xl">Ima li lijeka?</span>
        </div>
        <div>
          <Cross aria-hidden className="krst-svijetli mb-8 size-24" strokeWidth={2.5} />
          <p className="max-w-[24ch] font-display text-[2.75rem] leading-[1.05] font-bold" style={{ fontStretch: '80%' }}>
            Pacijenti vide vaše zalihe čim ih ažurirate.
          </p>
          <p className="mt-4 max-w-[48ch] text-nav-muted">Potvrdite rezervacije, označite lijek kao spreman i mijenjajte stanje zaliha jednim klikom.</p>
        </div>
        <p className="text-sm text-nav-muted">Portal za farmaceute</p>
      </div>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-[2rem]">Prijava</h1>
          <p className="mt-1 text-muted">Prijavite se u apoteku u kojoj ste večeras u smjeni.</p>

          <div className="panel mt-8 flex items-center gap-3 p-4">
            <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Store className="size-6" />
            </span>
            <div>
              <p className="font-bold">{apoteka.naziv}</p>
              <p className="text-sm text-muted">mr. ph. {FARMACEUT_IME}</p>
            </div>
          </div>

          <Dugme velicina="veliko" className="mt-4 w-full" onClick={prijavi} disabled={prijavljuje} aria-busy={prijavljuje}>
            {prijavljuje ? (
              <>
                <Loader2 aria-hidden className="size-5 animate-spin" />
                Prijavljujem…
              </>
            ) : (
              'Prijavi se'
            )}
          </Dugme>
          <p className="mt-3 text-center text-sm text-muted">Prototip: prijava ne traži lozinku.</p>
          <p className="mt-10 text-center text-sm">
            <Link to="/pacijent" className="font-semibold text-primary hover:underline">
              Nazad na aplikaciju za pacijente
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
