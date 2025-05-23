/**
 * Utilitaires de gestion d'erreurs centralisés
 * Fournit une gestion d'erreurs cohérente dans toute l'application
 */

/**
 * Formate et journalise une erreur dans la console avec des informations contextuelles
 * @param {Error|string} error - L'objet ou le message d'erreur
 * @param {string} context - Le composant ou la fonction où l'erreur s'est produite
 * @param {Object} additionalInfo - Informations supplémentaires utiles pour le débogage
 */
export const logError = (error, context = 'Application', additionalInfo = {}) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  console.error(
    `[${context}] Error: ${errorMessage}`, 
    { 
      error, 
      timestamp: new Date().toISOString(),
      ...additionalInfo 
    }
  );
};

/**
 * Extrait un message d'erreur convivial à partir de différents formats d'erreur
 * @param {Error|Object|string} error - L'objet d'erreur
 * @param {string} fallbackMessage - Message par défaut si aucun message utile ne peut être extrait
 * @returns {string} Un message d'erreur convivial pour l'utilisateur
 */
export const getErrorMessage = (error, fallbackMessage = 'Une erreur inattendue s\'est produite') => {
  if (!error) return fallbackMessage;
    // Gérer les erreurs sous forme de chaînes de caractères
  if (typeof error === 'string') return error;
  
  // Gérer les objets Error
  if (error instanceof Error) return error.message;
  
  // Gérer les réponses d'erreur API
  if (error.message) return error.message;
  if (error.data?.message) return error.data.message;
  if (error.response?.data?.message) return error.response.data.message;
  
  // Cas par défaut
  return fallbackMessage;
};

/**
 * Détermine si une erreur doit être affichée à l'utilisateur
 * Certaines erreurs sont attendues et ne devraient pas interrompre l'expérience utilisateur
 * @param {Error|Object|string} error - L'erreur à évaluer
 * @returns {boolean} Vrai si l'erreur doit être montrée à l'utilisateur
 */
export const shouldDisplayError = (error) => {  // Les erreurs réseau doivent être affichées
  if (error?.message?.includes('Erreur réseau')) return true;
    // Les erreurs de serveur indisponible doivent être affichées
  if (error?.message?.includes('Serveur indisponible')) return true;
    // Pour les erreurs API, vérifier le code de statut
  const status = error?.response?.status || error?.status;
  
  // Les erreurs 4xx nécessitent souvent l'attention de l'utilisateur
  if (status >= 400 && status < 500) return true;
  
  // Les erreurs 500 doivent être notifiées à l'utilisateur
  if (status >= 500) return true;
  
  // Pour les types d'erreurs inconnus, les afficher par défaut
  return true;
};

/**
 * Gère une erreur avec une journalisation cohérente et renvoie un message convivial
 * @param {Error|Object|string} error - L'erreur à gérer
 * @param {string} context - Le contexte du composant ou de la fonction
 * @param {string} fallbackMessage - Message utilisateur par défaut
 * @returns {string} Message d'erreur convivial pour l'utilisateur
 */
export const handleError = (error, context, fallbackMessage) => {
  logError(error, context);
  return getErrorMessage(error, fallbackMessage);
};

export default {
  logError,
  getErrorMessage,
  shouldDisplayError,
  handleError
};