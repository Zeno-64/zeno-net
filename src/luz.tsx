import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Fundo from './components/Fundo'
import PainelLuz from './components/PainelLuz'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Fundo />
      <PainelLuz />
    </main>
  </StrictMode>,
)
