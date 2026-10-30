import { useEffect, useState } from 'react'

/** Simulira kratko učitavanje (400–600 ms) kad se promijeni `kljuc`, da se vidi skeleton. */
export function useSimuliranoUcitavanje(kljuc: unknown, ms = 500) {
  const [ucitava, setUcitava] = useState(true)
  const [prethodniKljuc, setPrethodniKljuc] = useState(kljuc)

  // Resetuj odmah pri promjeni ključa (bez treptanja starog sadržaja)
  if (kljuc !== prethodniKljuc) {
    setPrethodniKljuc(kljuc)
    setUcitava(true)
  }

  useEffect(() => {
    const t = window.setTimeout(() => setUcitava(false), ms)
    return () => window.clearTimeout(t)
  }, [kljuc, ms])

  return ucitava
}
