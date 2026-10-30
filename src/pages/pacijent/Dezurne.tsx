import { useState } from 'react'
import { List, Map as MapIkona, Moon } from 'lucide-react'
import { SADA, apoteke } from '../../data/mockData'
import { formatDatum, formatVrijeme } from '../../lib/format'
import { useSimuliranoUcitavanje } from '../../lib/hooks'
import { KarticaApoteke } from '../../components/KarticaApoteke'
import { LegendaMape, SvgMapa } from '../../components/SvgMapa'
import { Segmenti, SkeletonKartice, Zaglavlje } from '../../components/ui'

type Prikaz = 'lista' | 'mapa'

export default function Dezurne() {
  const [prikaz, setPrikaz] = useState<Prikaz>('lista')
  const ucitava = useSimuliranoUcitavanje('dezurne', 450)
  const dezurne = apoteke.filter((a) => a.dezurna).sort((a, b) => a.udaljenostKm - b.udaljenostKm)
  const [odabrana, setOdabrana] = useState(dezurne[0].id)
  const odabranaApoteka = dezurne.find((a) => a.id === odabrana)!

  return (
    <>
      <Zaglavlje naslov="Dežurne apoteke" podnaslov={`Večeras, subota ${formatDatum(SADA)}`} />
      <div className="space-y-3 p-4">
        <div className="kartica flex gap-3 bg-primary-soft p-4">
          <Moon aria-hidden className="size-6 shrink-0 text-primary" />
          <p className="text-sm">
            Sada je <strong>{formatVrijeme(SADA)}</strong>. Ove apoteke rade cijelu noć – do nedjelje u 08:00.
          </p>
        </div>

        <Segmenti<Prikaz>
          oznaka="Način prikaza"
          vrijednost={prikaz}
          onChange={setPrikaz}
          opcije={[
            { vrijednost: 'lista', tekst: 'Lista', ikona: <List aria-hidden className="size-4" /> },
            { vrijednost: 'mapa', tekst: 'Mapa', ikona: <MapIkona aria-hidden className="size-4" /> },
          ]}
        />

        {ucitava ? (
          <SkeletonKartice />
        ) : prikaz === 'lista' ? (
          <ul className="space-y-3">
            {dezurne.map((a) => (
              <li key={a.id}>
                <KarticaApoteke apoteka={a} />
              </li>
            ))}
          </ul>
        ) : (
          <>
            <SvgMapa pinovi={dezurne.map((a) => ({ apoteka: a, status: 'dezurna' }))} odabrana={odabrana} onOdaberi={setOdabrana} />
            <LegendaMape dezurne />
            <div className="mt-1" aria-live="polite">
              <KarticaApoteke apoteka={odabranaApoteka} />
            </div>
          </>
        )}
      </div>
    </>
  )
}
