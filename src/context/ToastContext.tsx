import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useApp } from './AppContext'

export type TipToasta = 'uspjeh' | 'greska' | 'info'

interface Toast {
  id: number
  poruka: string
  tip: TipToasta
  akcija?: { tekst: string; onClick: () => void }
}

type PrikaziToast = (poruka: string, opcije?: { tip?: TipToasta; akcija?: Toast['akcija'] }) => void

interface ToastState {
  prikazi: PrikaziToast
  toast: Toast | null
  zatvori: () => void
}

const ToastContext = createContext<ToastState | null>(null)

const IKONE = { uspjeh: CircleCheck, greska: CircleAlert, info: Info }
const ZVUCI = { uspjeh: 'success', greska: 'error', info: 'notification' } as const

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const tajmer = useRef<number | undefined>(undefined)
  const { pustiZvuk } = useApp()

  const zatvori = useCallback(() => {
    window.clearTimeout(tajmer.current)
    setToast(null)
  }, [])

  const prikazi = useCallback<PrikaziToast>(
    (poruka, opcije = {}) => {
      const tip = opcije.tip ?? 'uspjeh'
      window.clearTimeout(tajmer.current)
      setToast({ id: Date.now(), poruka, tip, akcija: opcije.akcija })
      pustiZvuk(ZVUCI[tip])
      tajmer.current = window.setTimeout(() => setToast(null), opcije.akcija ? 6000 : 3500)
    },
    [pustiZvuk],
  )

  const vrijednost = useMemo(() => ({ prikazi, toast, zatvori }), [prikazi, toast, zatvori])

  return <ToastContext.Provider value={vrijednost}>{children}</ToastContext.Provider>
}

/** Prikaz toasta (snackbar) – donji desni ugao, kao u većini web aplikacija. */
export function ToastViewport() {
  const { toast, zatvori } = useContext(ToastContext)!
  const Ikona = toast ? IKONE[toast.tip] : null
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed right-4 bottom-4 z-[70] flex w-[min(28rem,calc(100vw-2rem))] justify-end sm:right-6 sm:bottom-6">
      {toast && Ikona && (
        <div
          key={toast.id}
          className="ulaz pointer-events-auto flex w-full items-center gap-3 rounded-lg bg-fg py-2 pr-2 pl-4 text-bg shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)]"
        >
          <Ikona aria-hidden className="size-5 shrink-0" />
          <p className="flex-1 py-1.5 text-sm font-medium">{toast.poruka}</p>
          {toast.akcija && (
            <button
              type="button"
              onClick={() => {
                toast.akcija!.onClick()
                zatvori()
              }}
              className="min-h-11 rounded-md px-3 text-sm font-bold underline underline-offset-2"
            >
              {toast.akcija.tekst}
            </button>
          )}
          <button type="button" onClick={zatvori} aria-label="Zatvori obavještenje" className="grid size-11 shrink-0 place-items-center rounded-md">
            <X aria-hidden className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast mora biti unutar <ToastProvider>')
  return ctx.prikazi
}
