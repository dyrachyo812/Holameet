import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './api/contract'
import { uk } from './i18n/uk'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(uk.missingRoot)
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
