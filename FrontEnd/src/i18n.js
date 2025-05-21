/**
 * Configuration de la traduction i18n
 * Ce fichier importe la configuration de utils/i18n
 * pour éviter toute duplication
 */
import { i18n } from './utils/i18n';

// Langue par défaut : français
const savedLanguage = localStorage.getItem('language');
if (!savedLanguage) {
  localStorage.setItem('language', 'fr');
  i18n.changeLanguage('fr');
}

export default i18n;
