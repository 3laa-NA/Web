import { useTranslation } from 'react-i18next';
import AdminPanel from '../admin/AdminPanel';

/**
 * Page qui encapsule le composant AdminPanel
 * Ajoute un titre traduit à la page d'administration
 */
function AdminPage() {
  const { t } = useTranslation('common');
  
  return (
    <div className="page-container">
      <h1>{t('navigation.admin')}</h1>
      <AdminPanel />
    </div>
  );
}

export default AdminPage;
