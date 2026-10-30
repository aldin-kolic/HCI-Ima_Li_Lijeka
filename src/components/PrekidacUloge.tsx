import { Stethoscope, User } from 'lucide-react'
import { Segmenti } from './ui'

export type Uloga = 'pacijent' | 'farmaceut'

export function PrekidacUloge({ uloga, onChange }: { uloga: Uloga; onChange: (u: Uloga) => void }) {
  return (
    <div className="w-72 max-w-full">
      <Segmenti
        oznaka="Prikaz aplikacije za ulogu"
        vrijednost={uloga}
        onChange={onChange}
        opcije={[
          { vrijednost: 'pacijent', tekst: 'Pacijent', ikona: <User aria-hidden className="size-4" /> },
          { vrijednost: 'farmaceut', tekst: 'Farmaceut', ikona: <Stethoscope aria-hidden className="size-4" /> },
        ]}
      />
    </div>
  )
}
