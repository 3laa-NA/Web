# Guide d'implémentation de l'internationalisation (i18n)

## Introduction

Ce document détaille l'architecture et les conventions d'utilisation du système d'internationalisation implémenté dans l'application Organiz'Asso. Notre solution repose sur les bibliothèques `i18next` et `react-i18next` pour offrir une expérience utilisateur multilingue complète.

## Architecture du système

Notre système de traduction est structuré de manière modulaire pour faciliter la maintenance et l'extension des capacités linguistiques de l'application.

### Fichiers de traduction

Les traductions sont stockées dans des fichiers JSON organisés par langue dans le répertoire `/public/locales` :

```plaintext
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

L'application utilise trois espaces de noms principaux pour organiser logiquement les traductions :

- `common` : Éléments UI de base (boutons, titres, navigation)
- `auth` : Tout ce qui concerne l'authentification
- `features` : Fonctionnalités spécifiques (messages, profil, administration)

## Implémentation technique

### Utilisation dans les composants React

Voici comment implémenter les traductions dans vos composants React :

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

### Conventions de nommage des clés

Nous utilisons une structure hiérarchique pour les clés de traduction :

```plaintext
messages.reply        👍 Bien
messages.replyTo      👍 Bien
messageReply          👎 Éviter
```

## Bonnes pratiques

1. **Français comme langue par défaut** : Notre application utilise le français comme langue par défaut dans le contexte universitaire.

2. **Commentaires en français** : Pour la cohérence, tous les commentaires dans le code doivent être en français.

3. **Utilisation des hooks** : Utilisez directement le hook `useTranslation` dans chaque composant plutôt que de passer par le contexte global.

4. **Valeurs par défaut** : Toujours fournir une valeur par défaut pour les clés qui pourraient manquer :
   
   ```jsx
   t('key.might.be.missing', { defaultValue: 'Texte par défaut' })
   ```

5. **Organisation par domaine fonctionnel** :
   - Clés commençant par `messages.` dans l'espace features pour les textes liés aux messages
   - Clés commençant par `profile.` dans l'espace features pour les textes liés au profil
   - Clés commençant par `admin.` dans l'espace features pour les fonctionnalités administratives

6. **Synchronisation des langues** : Ajoutez systématiquement les nouvelles clés aux deux langues (français et anglais)

## Processus d'ajout de nouvelles traductions

1. Identifiez l'espace de noms approprié pour votre nouvelle fonctionnalité
2. Ajoutez la clé et sa traduction dans les fichiers des deux langues (fr et en)
3. Utilisez la nouvelle clé dans vos composants avec le bon espace de noms
4. Vérifiez que la traduction s'affiche correctement dans les deux langues

## Extension du support linguistique

Pour ajouter une nouvelle langue à l'application :

1. Créez un nouveau dossier dans `/public/locales/` avec le code de langue (ex: `de` pour allemand)
2. Copiez les fichiers JSON d'une langue existante dans ce nouveau dossier
3. Traduisez toutes les valeurs tout en conservant les clés inchangées
4. Ajoutez la langue dans la liste `AVAILABLE_LANGUAGES` dans `src/utils/i18n.js`
5. Mettez à jour le composant `LanguageSwitcher` pour inclure la nouvelle option

## Outils de développement

Pour faciliter la gestion des traductions, plusieurs outils sont disponibles :

- **Script de vérification** : Exécutez `npm run check-translations` pour identifier les clés manquantes
- **Extraction automatique** : Utilisez le plugin i18next pour extraire automatiquement les clés de traduction
- **Prévisualisation** : Le mode développement permet de voir les clés de traduction manquantes

## Ressources additionnelles

- [Documentation officielle i18next](https://www.i18next.com/)
- [Guide react-i18next](https://react.i18next.com/)
- [Bonnes pratiques d'internationalisation](https://phrase.com/blog/posts/i18n-best-practices/)

---

## Informations sur le document

**Projet** : Organiz'Asso - Application de gestion associative  
**Contexte** : Projet universitaire de développement web  
**Dernière mise à jour** : 23/05/2025  
**Auteurs** : Équipe de développement Organiz'Asso
