import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import type { Rezervacija, StatusRezervacije } from '../data/mockData'

const PORUKE: Partial<Record<StatusRezervacije, string>> = {
  potvrdjeno: 'je potvrđena',
  spremno: 'je spremna – pacijent je obaviješten',
  preuzeto: 'je preuzeta',
  otkazano: 'je odbijena – pacijent je obaviješten',
}

/** Farmaceutove akcije nad rezervacijom: jedan klik + "Poništi" u toastu (oporavak od greške). */
export function useAkcijeRezervacije() {
  const prikaziToast = useToast()
  const { promijeniStatusRezervacije } = useApp()
  return (r: Rezervacija, status: StatusRezervacije) => {
    const prethodni = r.status
    promijeniStatusRezervacije(r.id, status, status === 'otkazano' ? { razlog: 'Apoteka je odbila rezervaciju' } : undefined)
    prikaziToast(`Rezervacija ${r.kod} ${PORUKE[status]}`, {
      tip: status === 'otkazano' ? 'info' : 'uspjeh',
      akcija: { tekst: 'Poništi', onClick: () => promijeniStatusRezervacije(r.id, prethodni, { tiho: true }) },
    })
  }
}
