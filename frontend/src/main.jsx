import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import kharchiLogo from './components/image/Kharchi.png'

const faviconEl = document.querySelector("link[rel='icon']") || document.createElement('link')
faviconEl.setAttribute('rel', 'icon')
faviconEl.setAttribute('type', 'image/png')
faviconEl.setAttribute('href', kharchiLogo)
if (!faviconEl.parentNode) {
  document.head.appendChild(faviconEl)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
