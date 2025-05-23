/**
 * Point d'entrée principal de l'application React
 * Ce fichier initialise l'application et configure les éléments fondamentaux
 */
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './i18n' // Import de la configuration d'internationalisation
import './styles/index.css' // Import du système CSS modulaire

// Rendu de l'application dans l'élément racine
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div>Chargement...</div>}>
      <App />
    </Suspense>
  </StrictMode>,
)
