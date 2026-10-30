import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Cross, Loader2, Store } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { APOTEKA_FARMACEUTA_ID, apotekaPoId } from '../../data/mockData'
import { Dugme } from '../../components/ui'

/** Prijava bez prave autentifikacije – samo dugme. */
export default function Prijava() {
  const navigate = useNavigate()
  const prikaziToast = useToast()
  const { farmaceutPrijavljen, setFarmaceutPrijavljen } = useApp()
  const [prijavljuje, setPrijavljuje] = useState(false)
  const apoteka = apotekaPoId(APOTEKA_FARMACEUTA_ID)!

  if (farmaceutPrijavljen) return <Navigate to="/farmaceut/rezervacije" replace />

  const prijavi = () => {
    setPrijavljuje(true)
    window.setTimeout(() => {
      setFarmaceutPrijavljen(true)
      prikaziToast(`Prijavljeni ste – ${apoteka.naziv}`)
      navigate('/farmaceut/rezervacije', { replace: true })
    }, 500)
  }

  return (
    <main className="skrol flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-16 pb-8">
      <div className="text-center">
        <span aria-hidden className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary text-primary-fg">
          <Cross className="size-9" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">Ima li lijeka?</h1>
        <p className="text-muted">Portal za farmaceute</p>
      </div>

      <div className="kartica mt-10 flex items-center gap-3 p-4">
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Store className="size-6" />
        </span>
        <div>
          <p className="font-bold">{apoteka.naziv}</p>
          <p className="text-sm text-muted">
            {apoteka.adresa} · mr. ph. Selma K.
          </p>
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
    </main>
  )
}
