import { useTranslation } from 'react-i18next';
import '../../styles/alerts.css';

const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  const { t } = useTranslation(['common']);

  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button 
            className="btn btn-danger" 
            onClick={onConfirm}
          >
            {t('confirm')}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onCancel}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
