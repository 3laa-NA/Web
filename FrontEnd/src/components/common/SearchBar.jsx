import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Barre de recherche pour filtrer les messages
// Utilise la fonction onSearch fournie en prop pour transmettre la requête
function SearchBar({ onSearch }) {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState('');

  // Gestionnaire pour soumettre la recherche
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search')}
        aria-label={t('search')}
      />
      <button type="submit" aria-label={t('search')}>🔍</button>
    </form>
  );
}

export default SearchBar;
