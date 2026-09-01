import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import OpenScene from './components/open/OpenScene'
import { Grain } from './components/Grain'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Grain />
    <OpenScene />
  </StrictMode>,
)
