# Guide d'implémentation de la traduction (i18n) dans notre application

## Structure et organisation

Notre système de traduction utilise `i18next` avec `react-i18next` et est organisé comme suit :

### Fichiers de traduction
Les traductions sont stockées dans des fichiers JSON dans `/public/locales` :
```
public/
  locales/
    fr/                 # Français (langue par défaut)
      common.json       # Éléments communs de l'interface
      auth.json         # Authentification
      features.json     # Fonctionnalités spécifiques
    en/                 # Anglais
      common.json
      auth.json
      features.json
```

### Espaces de noms (Namespaces)
Nous utilisons trois espaces de noms principaux :
- `common` : Éléments UI de base (boutons, titres, navigation)
- `auth` : Tout ce qui concerne l'authentification
- `features` : Fonctionnalités spécifiques (messages, profil, admin)

## Comment utiliser les traductions

### Dans les composants fonctionnels
```jsx
import { useTranslation } from 'react-i18next';

function MonComposant() {
  const { t } = useTranslation(['common', 'features']);
  
  return (
    <div>
      <h1>{t('monTitre')}</h1>
      
      {/* Pour un texte d'un namespace spécifique */}
      <button>{t('bouton.envoyer', { ns: 'features' })}</button>
      
      {/* Avec une valeur par défaut */}
      <p>{t('texte.manquant', { defaultValue: 'Texte par défaut' })}</p>
      
      {/* Avec des variables */}
      <p>{t('salutation', { nom: 'Marie' })}</p>
    </div>
  );
}
```

### Structure des clés
Utilisez une structure hiérarchique pour les clés :
```
messages.reply        👍 Bien
messages.replyTo      👍 Bien
messageReply          👎 Éviter
```

## Bonnes pratiques

1. **Français comme langue par défaut** : Notre application utilise le français comme langue par défaut.

2. **Commentaires en français** : Tous les commentaires dans le code doivent être en français.

3. **Éviter d'utiliser AppContext pour les traductions** : Utilisez directement le hook `useTranslation` dans chaque composant.

4. **Toujours fournir une valeur par défaut** pour les clés qui pourraient manquer :
   ```jsx
   t('key.might.be.missing', { defaultValue: 'Texte par défaut' })
   ```

5. **Utilisez le namespacing correct** :
   - Clés commençant par `messages.` dans l'espace features pour les textes liés aux messages
   - Clés commençant par `profile.` dans l'espace features pour les textes liés au profil
   - etc.

6. **Ajoutez systématiquement les nouvelles clés aux deux langues** (français et anglais)

## Ajouter de nouvelles traductions

1. Identifiez l'espace de noms approprié
2. Ajoutez la clé et sa traduction aux deux fichiers (fr et en)
3. Utilisez la nouvelle clé dans vos composants avec le bon espace de noms

## Ajouter une nouvelle langue

1. Créez un nouveau dossier dans `/public/locales/` avec le code de langue (ex: `de` pour allemand)
2. Copiez les fichiers JSON d'une langue existante
3. Traduisez toutes les valeurs (gardez les clés inchangées)
4. Ajoutez la langue dans la liste `AVAILABLE_LANGUAGES` dans `src/utils/i18n.js`
