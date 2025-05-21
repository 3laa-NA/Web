/**
 * Centralized error handling utilities
 * Provides consistent error handling across the application
 */

/**
 * Formats and logs an error to console with additional context information
 * @param {Error|string} error - The error object or message
 * @param {string} context - The component or function context where error occurred
 * @param {Object} additionalInfo - Any additional information useful for debugging
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
 * Extracts a user-friendly error message from different error formats
 * @param {Error|Object|string} error - The error object
 * @param {string} fallbackMessage - Default message if no useful message can be extracted
 * @returns {string} A user-friendly error message
 */
export const getErrorMessage = (error, fallbackMessage = 'Une erreur inattendue s\'est produite') => {
  if (!error) return fallbackMessage;
  
  // Handle string errors
  if (typeof error === 'string') return error;
  
  // Handle Error objects
  if (error instanceof Error) return error.message;
  
  // Handle API error responses
  if (error.message) return error.message;
  if (error.data?.message) return error.data.message;
  if (error.response?.data?.message) return error.response.data.message;
  
  // Default case
  return fallbackMessage;
};

/**
 * Determines if an error should be displayed to the user
 * Some errors are expected and shouldn't interrupt the user experience
 * @param {Error|Object|string} error - The error to evaluate
 * @returns {boolean} True if error should be shown to user
 */
export const shouldDisplayError = (error) => {
  // Network errors should be shown
  if (error?.message?.includes('Network Error')) return true;
  
  // Server unavailable errors should be shown
  if (error?.message?.includes('Server unavailable')) return true;
  
  // For API errors, check status code
  const status = error?.response?.status || error?.status;
  
  // 4xx errors often need user attention
  if (status >= 400 && status < 500) return true;
  
  // 500 errors should notify the user
  if (status >= 500) return true;
  
  // For unknown error types, default to showing them
  return true;
};

/**
 * Handles an error with consistent logging and returns user-friendly message
 * @param {Error|Object|string} error - The error to handle
 * @param {string} context - The component or function context
 * @param {string} fallbackMessage - Default user message
 * @returns {string} User-friendly error message
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