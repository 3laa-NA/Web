import { useTranslation } from 'react-i18next';
import PrivateMessages from '../private-messages/PrivateMessages';

/**
 * Page qui encapsule le composant PrivateMessages
 * Ajoute un titre traduit à la section des messages privés
 */
function PrivateMessagesPage() {
  const { t } = useTranslation('common');
  
  return (
    <div className="page-container">
      <PrivateMessages />
    </div>
  );
}

export default PrivateMessagesPage;
