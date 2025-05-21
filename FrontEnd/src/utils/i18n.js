/**
 * Utilitaire i18n
 * Ce module fournit des fonctions pour le support multilingue dans l'application
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Initialisation de i18next
i18n
  // Backend pour charger les traductions depuis /public/locales
  .use(Backend)
  // Détection automatique de la langue de l'utilisateur
  .use(LanguageDetector)
  // Passage de l'instance i18n à react-i18next
  .use(initReactI18next)
  // Initialisation de i18next
  .init({
    // Langue par défaut
    fallbackLng: 'fr',
    // Mode debug, désactivé en production
    debug: process.env.NODE_ENV === 'development',
    // Espaces de noms à charger
    ns: ['common', 'auth', 'features'],
    defaultNS: 'common',
    // Configuration du backend
    backend: {
      // Chemin pour charger les ressources
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Options d'interpolation
    interpolation: {
      escapeValue: false, // Pas nécessaire pour React qui échappe par défaut
    },
    // Paramètres React
    react: {
      useSuspense: true, // Utiliser React Suspense pour le chargement asynchrone
    },
  });

// Stockage de la langue courante globalement pour éviter de la passer partout
let currentLanguage = localStorage.getItem('language') || 'fr';

/**
 * Définir la langue courante pour l'application
 * @param {string} language - Code de langue ('fr' ou 'en')
 */
function setCurrentLanguage(language) {
  if (language === 'fr' || language === 'en') {
    currentLanguage = language;
    localStorage.setItem('language', language);
    i18n.changeLanguage(language);
  }
}

/**
 * Obtenir la langue courante de l'application
 * @returns {string} Le code de langue courant
 */
function getCurrentLanguage() {
  return i18n.language || currentLanguage;
}

/**
 * Fonction de traduction pour obtenir une chaîne traduite
 * Compatible avec l'API précédente pour rétrocompatibilité
 * @param {string} key - Clé de traduction
 * @param {string} [language] - Code de langue ('fr' ou 'en'), utilise la langue courante si non fourni
 * @param {object} [options] - Options à passer à i18next
 * @returns {string} Chaîne traduite ou la clé si la traduction n'existe pas
 */
function t(key, language, options = {}) {// Si le second paramètre est un objet, on considère que ce sont les options, pas la langue
  if (language && typeof language === 'object') {
    options = language;
    language = null;
  }

  // Utiliser la langue spécifique si fournie, sinon utiliser i18next
  if (language) {
    const savedLang = i18n.language;
    i18n.changeLanguage(language);
    const translation = i18n.t(key, options);
    i18n.changeLanguage(savedLang);
    return translation;
  }

  return i18n.t(key, options);
}

/**
 * Pour la rétrocompatibilité - obtenir toutes les traductions pour une langue
 * @deprecated Utiliser la fonction t() avec des espaces de noms à la place
 * @param {string} language - Code de langue ('fr' ou 'en')
 * @returns {Object} Objet contenant les traductions
 */
function getTranslations(language = 'fr') {console.warn('getTranslations est déprécié, utiliser la fonction t() avec des espaces de noms à la place');
  
  // Charger les ressources de manière synchrone (non recommandé mais nécessaire pour la compatibilité)
  const resources = {};
  ['common', 'auth', 'features'].forEach(ns => {
    try {
      // Ceci est un repli et ne remplace pas complètement la fonctionnalité
      // C'est fourni uniquement pour la rétrocompatibilité
      const translations = i18n.getResourceBundle(language, ns) || {};
      Object.assign(resources, translations);
    } catch (error) {
      console.error(`Échec de chargement des traductions pour ${language}/${ns}`, error);
    }
  });
  
  return resources;
}

/**
 * Langues disponibles
 */
const AVAILABLE_LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' }
];

// Exporter directement l'instance i18n et les fonctions pour utilisation dans l'application
export { 
  i18n,
  t,
  setCurrentLanguage,
  getCurrentLanguage,
  AVAILABLE_LANGUAGES,
  getTranslations
};
