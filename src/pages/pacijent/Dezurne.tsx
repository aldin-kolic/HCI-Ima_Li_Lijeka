import { useState } from 'react'
import { Cross } from 'lucide-react'
import { SADA, apoteke } from '../../data/mockData'
import { formatDatum, formatVrijeme } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { RedApoteke } from '../../components/RedApoteke'
import { LegendaMape, SvgMapa } from '../../components/SvgMapa'
import { SkeletonRedovi, ZaglavljeStranice } from '../../components/ui'

export default function Dezurne() {
  const ucitava = useSimuliranoUcitavanje('dezurne', 450)
  const dezurne = apoteke.filter((a) => a.dezurna).sort((a, b) => a.udaljenostKm - b.udaljenostKm)
  const [odabrana, setOdabrana] = useState(dezurne[0].id)

  return (
    <>
      <ZaglavljeStranice
        naslov={
          <span className="flex items-center gap-3">
            <Cross aria-hidden className="krst-svijetli size-8" strokeWidth={2.75} />
            Dežurne apoteke
          </span>
        }
        opis={`Subota, ${formatDatum(SADA)} Sada je ${formatVrijeme(SADA)}. Ove apoteke rade cijelu noć, do nedjelje u 08:00.`}
      />
      <div className="grid items-start gap-6 xl:grid-cols-12">
        <section aria-label="Lista dežurnih apoteka" className="panel overflow-hidden xl:col-span-7">
          {ucitava ? (
            <SkeletonRedovi broj={3} />
          ) : (
            <div className="divide-y divide-border">
              {dezurne.map((a) => (
                <RedApoteke key={a.id} apoteka={a} aktivna={a.id === odabrana} onAktiviraj={() => setOdabrana(a.id)} />
              ))}
            </div>
          )}
        </section>
        <aside aria-label="Mapa dežurnih apoteka" className="xl:sticky xl:top-24 xl:col-span-5">
          <SvgMapa pinovi={dezurne.map((a) => ({ apoteka: a, status: 'dezurna' }))} odabrana={odabrana} onOdaberi={setOdabrana} />
          <LegendaMape dezurne />
        </aside>
      </div>
    </>
  )
}
