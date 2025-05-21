import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

/**
 * Composant pour protéger les routes nécessitant une authentification
 * Utilise le hook useAuth pour vérifier l'état d'authentification
 * 
 * @param {React.ReactNode} children - Composants enfants à rendre si l'authentification est validée
 * @param {boolean} isAdmin - Indique si la route est réservée aux administrateurs
 */
function ProtectedRoute({ children, isAdmin = false }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation('auth');
    // Afficher un indicateur de chargement pendant la vérification de la session
  if (loading) {
    return <div className="loading">{t('verifyingAuthentication')}</div>;
  }
  
  // Redirection si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirection si la route est réservée aux admins et que l'utilisateur n'est pas admin
  if (isAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Affiche le contenu protégé si les conditions sont remplies
  return children;
}

export default ProtectedRoute;
