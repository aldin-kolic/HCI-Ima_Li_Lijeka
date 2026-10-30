import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppProvider, useApp } from './context/AppContext'
import { ToastProvider, ToastViewport } from './context/ToastContext'
import { Okvir } from './components/Okvir'
import Pocetna from './pages/pacijent/Pocetna'
import Rezultati from './pages/pacijent/Rezultati'
import DetaljApoteke from './pages/pacijent/DetaljApoteke'
import MojeRezervacije from './pages/pacijent/MojeRezervacije'
import Dezurne from './pages/pacijent/Dezurne'
import Podesavanja from './pages/Podesavanja'
import Prijava from './pages/farmaceut/Prijava'
import Pregled from './pages/farmaceut/Pregled'
import DolazneRezervacije from './pages/farmaceut/DolazneRezervacije'
import StanjeLijekova from './pages/farmaceut/StanjeLijekova'

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/pacijent" replace />} />
            <Route path="/pacijent" element={<Okvir uloga="pacijent" />}>
              <Route index element={<Pocetna />} />
              <Route path="pretraga" element={<Rezultati />} />
              <Route path="apoteka/:apotekaId" element={<DetaljApoteke />} />
              <Route path="rezervacije" element={<MojeRezervacije />} />
              <Route path="dezurne" element={<Dezurne />} />
              <Route path="podesavanja" element={<Podesavanja uloga="pacijent" />} />
            </Route>
            <Route path="/farmaceut/prijava" element={<Prijava />} />
            <Route path="/farmaceut" element={<FarmaceutZastita />}>
              <Route index element={<Pregled />} />
              <Route path="rezervacije" element={<DolazneRezervacije />} />
              <Route path="zalihe" element={<StanjeLijekova />} />
              <Route path="podesavanja" element={<Podesavanja uloga="farmaceut" />} />
            </Route>
            <Route path="*" element={<Navigate to="/pacijent" replace />} />
          </Routes>
          <ToastViewport />
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  )
}

/** Farmaceutski dio je dostupan tek nakon (simulirane) prijave. */
function FarmaceutZastita() {
  const { farmaceutPrijavljen } = useApp()
  if (!farmaceutPrijavljen) return <Navigate to="/farmaceut/prijava" replace />
  return <Okvir uloga="farmaceut" />
}
