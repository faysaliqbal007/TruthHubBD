import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '../app/globals.css'
import '../app/spatial.css'
import '../app/effects.css'
import '../app/alerts.css'
import '../app/clarity.css'
import '../app/editorial.css'
import '../app/editorial-civic.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
