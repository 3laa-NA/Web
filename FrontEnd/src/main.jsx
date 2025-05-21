import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './i18n' // Import i18n configuration
import './styles/index.css' // Import du nouveau système CSS modulaire

// Point d'entrée principal de l'application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div>Chargement...</div>}>
      <App />
    </Suspense>
  </StrictMode>,
)
