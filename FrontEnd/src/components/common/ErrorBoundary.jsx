import { Component } from 'react';
import { withTranslation } from 'react-i18next';

// Composant de gestion d'erreurs pour toute l'application
// Capture les erreurs dans les composants enfants et affiche une UI de repli
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  // Méthode statique qui capture l'erreur et met à jour l'état
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  // Méthode de cycle de vie appelée après qu'une erreur a été levée
  // Permet de journaliser l'erreur et de stocker des informations supplémentaires
  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    const { t } = this.props;
    
    // Si une erreur a été détectée, affiche l'interface de secours
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>{t('errorBoundary.title')}</h2>
          <p>{t('errorBoundary.message')}</p>
          <details>
            <summary>{t('errorBoundary.errorDetails')}</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>{t('errorBoundary.componentStack')}</p>
            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </details>
          <button onClick={() => window.location.reload()}>{t('refreshPage')}</button>
        </div>
      );
    }    // Si tout va bien, rendre les enfants normalement
    return this.props.children;
  }
}

export default withTranslation('common')(ErrorBoundary);
