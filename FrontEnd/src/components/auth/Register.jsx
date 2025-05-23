import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from '../../hooks/useForm';
import { useAuth } from '../../contexts/AuthContext';
import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { API } from '../../services/api';

function Register() {
  const { t: appT } = useContext(AppContext);
  const { t } = useTranslation(['auth', 'common']);
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  // Form validation function
  const validateForm = (values) => {
    const errors = {};

    if (!values.login) {
      errors.login = t('errors.requiredField');
    }

    if (!values.email) {
      errors.email = t('errors.requiredField');
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = t('errors.invalidEmail');
    }

    if (!values.password) {
      errors.password = t('errors.requiredField');
    } else if (values.password.length < 8) {
      errors.password = t('errors.passwordTooShort');
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = t('errors.requiredField');
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = t('errors.passwordsNotMatch');
    }

    if (!values.firstName) {
      errors.firstName = t('errors.requiredField');
    }    if (!values.lastName) {
      errors.lastName = t('errors.requiredField');
    }

    return errors;
  };
  // Initialize form with useForm hook
  const { values, errors, handleChange, handleSubmit } = useForm(
    {
      login: '',
      email: '', // Bien que non utilisé par l'API, gardé pour la validation côté client
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      bio: '',
      role: 'user' // Changé pour correspondre au rôle par défaut dans le backend
    },
    validateForm,
    submitForm
  );  // Handle form submission
  async function submitForm() {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Préparation des données pour l'API
      const registrationData = { 
        ...values,
        password2: values.confirmPassword // Ajout explicite pour le backend
      };
      
      const response = await API.auth.register(registrationData);
      
      if (response.success) {
        setSuccess(true);
        // Pas de redirection automatique car l'utilisateur doit attendre l'approbation
        // L'utilisateur lira le message expliquant qu'il doit attendre l'approbation d'un administrateur
      } else {
        setError(response.error || t('errors.registrationFailed', { ns: 'auth', defaultValue: 'Registration failed' }));
      }
    } catch (err) {
      setError(err.message || t('errors.registrationFailed', { ns: 'auth', defaultValue: 'Registration failed' }));
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Fonctions pour basculer l'affichage des mots de passe
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
    
  if (success) {
    return (
      <div className="auth-form success-message">
        <h2>{t('success.registrationSuccess', { ns: 'auth', defaultValue: 'Registration Successful' })}</h2>
        <p>{t('success.registrationPendingMessage', { ns: 'auth', defaultValue: 'Your account was created successfully. An administrator will review your request and approve your account. You will be able to login once approved.' })}</p>
        <div className="auth-actions">
          <Link to="/login" className="btn btn-primary">{t('navigation.login', { ns: 'common' })}</Link>
        </div>      </div>
    );
  }
  
  return (
    <div className="auth-container">
      <h2>{t('registerTitle')}</h2>
      
      {error && <div className="error-message">{t(error) || error}</div>}
        <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="login">{t('username', { defaultValue: 'Nom d\'utilisateur' })}</label>
          <input
            type="text"
            id="login"
            name="login"
            value={values.login}
            onChange={handleChange}
            className={errors.login ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.login && <div className="error-text">{errors.login}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="email">{t('email')}</label>
          <input
            type="email"
            id="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.email && <div className="error-text">{errors.email}</div>}
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">{t('firstName')}</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={values.firstName}
              onChange={handleChange}
              className={errors.firstName ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.firstName && <div className="error-text">{errors.firstName}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">{t('lastName')}</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={values.lastName}
              onChange={handleChange}
              className={errors.lastName ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.lastName && <div className="error-text">{errors.lastName}</div>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">{t('password')}</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              disabled={isSubmitting}
            />
            <button 
              type="button" 
              className="toggle-password-btn"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? t('hidePassword', { defaultValue: 'Cacher le mot de passe' }) : t('showPassword', { defaultValue: 'Afficher le mot de passe' })}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.password && <div className="error-text">{errors.password}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              disabled={isSubmitting}
            />
            <button 
              type="button" 
              className="toggle-password-btn"
              onClick={toggleConfirmPasswordVisibility}
              aria-label={showConfirmPassword ? t('hidePassword', { defaultValue: 'Cacher le mot de passe' }) : t('showPassword', { defaultValue: 'Afficher le mot de passe' })}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="bio">{t('profile.bio', { ns: 'features' })} ({t('optional', { defaultValue: 'Optional' })})</label>
          <textarea
            id="bio"
            name="bio"
            value={values.bio}
            onChange={handleChange}
            disabled={isSubmitting}
            rows="3"
          />
        </div>
        
        <div className="auth-actions">
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? t('loading', { ns: 'common' }) : t('registerSubmit')}
          </button>
        </div>
        
        <div className="auth-link">
          <p>{t('alreadyHaveAccount', { defaultValue: 'Already have an account?' })} <Link to="/login">{t('navigation.login', { ns: 'common' })}</Link></p>
        </div>
      </form>
    </div>
  );
}

export default Register;
