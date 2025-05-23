# Architecture CSS Modulaire

## Présentation

Ce document présente l'architecture CSS modulaire implémentée dans le projet Organiz'Asso. Cette approche vise à améliorer la maintenabilité, la réutilisabilité et la cohérence visuelle de l'interface utilisateur en séparant les préoccupations et en organisant le code CSS de manière structurée.

## Organisation des fichiers

L'architecture CSS est divisée en modules fonctionnels, chacun avec une responsabilité spécifique :

| Fichier | Description |
|---------|-------------|
| **`base.css`** | Variables globales, reset CSS et styles fondamentaux |
| **`layout.css`** | Structure générale, grilles et conteneurs |
| **`buttons.css`** | Styles pour les boutons et éléments d'action |
| **`forms.css`** | Styles pour les formulaires et champs de saisie |
| **`navigation.css`** | Menus, barres de navigation et éléments de navigation |
| **`messages.css`** | Composants spécifiques à la messagerie |
| **`private-messages.css`** | Styles pour les messages privés entre utilisateurs |
| **`forums.css`** | Styles pour les forums de discussion |
| **`alerts.css`** | Notifications, alertes et indicateurs d'état |
| **`animations.css`** | Effets d'animation et transitions |
| **`auth.css`** | Styles pour les pages d'authentification (login/register) |
| **`AdminPanel.css`** | Interface d'administration |
| **`user.css`** | Styles pour les profils et éléments relatifs aux utilisateurs |
| **`utilities.css`** | Classes utilitaires pour des ajustements rapides |
| **`themes.css`** | Système de thèmes (clair/sombre) |
| **`index.css`** | Point d'entrée qui importe tous les modules CSS |
| **`animations.css`** | Transitions et animations |
| **`index.css`** | Point d'entrée principal important tous les modules |

## Méthodologie et conventions

### Principes de nommage

Nous appliquons une variante simplifiée de la méthodologie BEM (Block, Element, Modifier) :

```css
/* Bloc : représente un composant autonome */
.block {}

/* Élément : partie d'un bloc qui ne peut pas exister seul */
.block-element {}

/* Modificateur : variante ou état d'un bloc */
.block.modifier {}
```

### Système de thèmes

L'application prend en charge des thèmes clairs et sombres via l'attribut `data-theme` sur l'élément racine :

```html
<!-- Thème clair (défaut) -->
<html data-theme="light">

<!-- Thème sombre -->
<html data-theme="dark">
```

Les variables CSS dans `themes.css` s'adaptent automatiquement au thème actif.

## Système de classes utilitaires

Des classes utilitaires sont disponibles pour des ajustements rapides sans nécessiter de CSS personnalisé :

### Espacement

- Margin: `m-1` à `m-6`, `mt-1` (top), `mr-1` (right), `mb-1` (bottom), `ml-1` (left)
- Padding: `p-1` à `p-6`, `pt-1` (top), `pr-1` (right), `pb-1` (bottom), `pl-1` (left)

### Typographie

- Alignement: `text-left`, `text-center`, `text-right`
- Style: `font-bold`, `font-italic`, `text-uppercase`
- Taille: `text-sm`, `text-md`, `text-lg`, `text-xl`

### Disposition (Layout)

- Flexbox: `d-flex`, `flex-row`, `flex-column`, `flex-wrap`
- Alignement: `items-center`, `justify-between`, `justify-center`

### Couleurs

- Texte: `text-primary`, `text-secondary`, `text-error`
- Arrière-plan: `bg-surface`, `bg-primary`, `bg-secondary`

## Composants d'alerte et notifications

Le système inclut plusieurs variantes d'alertes pour différents contextes :

```jsx
{/* Alertes contextuelles avec icônes */}
<div className="alert alert-success alert-icon">Opération réussie!</div>
<div className="alert alert-error alert-icon">Une erreur est survenue</div>
<div className="alert alert-info alert-icon">Information importante</div>
<div className="alert alert-warning alert-icon">Attention</div>

{/* Badges et indicateurs d'état */}
<span className="badge">Nouveau</span>
<span className="badge badge-error">Urgent</span>
<span className="status-dot status-online"></span>
```

## Formulaires standardisés

Exemple d'implémentation d'un formulaire avec nos styles standardisés :

```jsx
<form className="form">
  <h3 className="form-title">Créer un compte</h3>
  
  <div className="form-group">
    <label htmlFor="name">Nom complet</label>
    <input id="name" className="form-control" type="text" />
  </div>
  
  <div className="form-group">
    <label htmlFor="email">Email</label>
    <input id="email" className="form-control" type="email" />
    <div className="form-error">Email invalide</div>
  </div>
  
  <div className="checkbox">
    <input type="checkbox" id="accept" />
    <label htmlFor="accept">J'accepte les conditions</label>
  </div>
  
  <div className="form-actions">
    <button type="button" className="btn btn-secondary">Annuler</button>
    <button type="submit" className="btn btn-primary">S'inscrire</button>
  </div>
</form>
```

## Système de messagerie

Voici l'implémentation recommandée pour les composants de messagerie :

```jsx
<li className="message-item">
  <div className="message-header">
    <div className="message-author">
      <div className="avatar">JD</div>
      <div className="message-author-name">Jane Doe</div>
    </div>
    <time className="message-date">Aujourd'hui à 14:30</time>
  </div>
  
  <div className="message-content">
    Voici un exemple de message dans notre système CSS modulaire amélioré.
  </div>
  
  <div className="message-actions">
    <button className="message-action-btn reply-button">
      <span>Répondre</span>
    </button>
    <button className="message-action-btn like-button">
      <span>J'aime</span>
      <span className="message-badge">5</span>
    </button>
    <button className="message-action-btn share-button">
      <span>Partager</span>
    </button>
  </div>
</li>
```

## Responsive Design

Notre architecture CSS adopte l'approche "mobile-first", avec des points d'arrêt (breakpoints) standardisés :

```css
/* Mobile (par défaut) */
/* Tablettes et petits écrans */
@media (min-width: 768px) { ... }
/* Ordinateurs portables et écrans moyens */
@media (min-width: 1024px) { ... }
/* Grands écrans */
@media (min-width: 1280px) { ... }
```

## Modules spécifiques

### Interface d'administration (AdminPanel.css)

Styles dédiés au tableau de bord administratif et à ses composants :

```jsx
<div className="admin-panel">
  <div className="admin-sidebar">
    <div className="admin-nav-item active">Utilisateurs</div>
    <div className="admin-nav-item">Statistiques</div>
    <div className="admin-nav-item">Configuration</div>
  </div>
  <div className="admin-content">
    <div className="admin-card">
      <h3 className="admin-card-title">Gestion des utilisateurs</h3>
      <div className="admin-data-table">
        {/* Contenu du tableau */}
      </div>
    </div>
  </div>
</div>
```

### Forums de discussion (forums.css)

Styles pour la section forums et discussions thématiques :

```jsx
<div className="forum-container">
  <div className="forum-header">
    <h2 className="forum-title">Forum Général</h2>
    <span className="forum-stats">24 sujets · 128 messages</span>
  </div>
  <div className="topic-list">
    <div className="topic-item">
      <div className="topic-icon unread"></div>
      <div className="topic-content">
        <h3 className="topic-title">Annonce importante</h3>
        <div className="topic-meta">
          <span className="topic-author">Par Admin</span>
          <span className="topic-date">23/05/2025</span>
        </div>
      </div>
      <div className="topic-stats">
        <span className="replies-count">15 réponses</span>
        <span className="views-count">342 vues</span>
      </div>
    </div>
  </div>
</div>
```

### Messages privés (private-messages.css)

Styles spécifiques pour le système de messagerie privée :

```jsx
<div className="pm-container">
  <div className="pm-sidebar">
    <div className="pm-search">
      <input type="text" placeholder="Rechercher..." className="pm-search-input" />
    </div>
    <div className="pm-conversation-list">
      <div className="pm-conversation active">
        <div className="avatar">ML</div>
        <div className="pm-conversation-info">
          <div className="pm-conversation-name">Marie Leclerc</div>
          <div className="pm-conversation-preview">Bonjour, as-tu reçu mon...</div>
        </div>
        <div className="pm-conversation-time">14:30</div>
      </div>
    </div>
  </div>
  <div className="pm-content">
    {/* Messages et formulaire de réponse */}
  </div>
</div>
```

### Authentification (auth.css)

Styles pour les pages de connexion, inscription et récupération de mot de passe :

```jsx
<div className="auth-container">
  <div className="auth-card">
    <div className="auth-header">
      <img src="/logo.svg" alt="Logo" className="auth-logo" />
      <h2 className="auth-title">Connexion</h2>
    </div>
    <div className="auth-form">
      {/* Formulaire de connexion */}
    </div>
    <div className="auth-footer">
      <a href="#" className="auth-link">Mot de passe oublié?</a>
      <a href="#" className="auth-link">Créer un compte</a>
    </div>
  </div>
</div>
```

### Profils utilisateurs (user.css)

Styles pour les pages de profil et paramètres utilisateur :

```jsx
<div className="user-profile">
  <div className="user-header">
    <div className="user-avatar large">ML</div>
    <div className="user-info">
      <h2 className="user-name">Marie Leclerc</h2>
      <div className="user-role">Administratrice</div>
      <div className="user-stats">
        <span>Membre depuis: 15/03/2025</span>
        <span>42 messages</span>
      </div>
    </div>
  </div>
  <div className="user-tabs">
    <div className="user-tab active">Activité</div>
    <div className="user-tab">Informations</div>
    <div className="user-tab">Paramètres</div>
  </div>
  <div className="user-content">
    {/* Contenu du profil */}
  </div>
</div>
```

## Bonnes pratiques

1. **Éviter les ID pour le styling** - Utilisez des classes pour tous les styles
2. **Respecter la portée des modules** - N'ajoutez des styles que dans le fichier approprié
3. **Privilégier la composition** - Combiner des classes existantes avant d'en créer de nouvelles
4. **Éviter !important** - Réservez-le uniquement pour les classes utilitaires critiques
5. **Maintenez la documentation** - Mettez à jour ce document lorsque de nouveaux patterns sont créés

---

## Informations sur la documentation

**Titre** : Architecture CSS Modulaire - Organiz'Asso  
**Type de document** : Documentation technique  
**Contexte** : Projet universitaire de développement web  
**Dernière mise à jour** : 23/05/2025  
**Auteurs** : Équipe de développement Organiz'Asso
