# Système CSS Modulaire

Ce projet utilise une architecture CSS modulaire qui sépare les préoccupations et facilite la maintenance du code.

## Structure des fichiers

- **`base.css`**: Variables, reset et styles fondamentaux
- **`layout.css`**: Mise en page générale, grille et conteneurs
- **`buttons.css`**: Tous les styles pour les boutons et éléments d'action
- **`forms.css`**: Styles pour formulaires et champs de saisie
- **`navigation.css`**: Styles pour la navigation et menus
- **`messages.css`**: Styles pour les composants de messagerie
- **`alerts.css`**: Alertes, notifications, badges et indicateurs d'état
- **`utilities.css`**: Classes utilitaires (marges, padding, couleurs...)
- **`themes.css`**: Gestion des thèmes (clair/sombre)
- **`animations.css`**: Animations et transitions
- **`index.css`**: Point d'entrée qui importe tous les modules

## Conventions de nommage

Nous utilisons une approche basée sur des classes BEM simplifiée :

- `.block` - Conteneur principal
- `.block-element` - Sous-élément d'un bloc
- `.block.modifier` - Variante d'un bloc

## Thèmes

Le système gère automatiquement les thèmes en utilisant l'attribut data-theme sur l'élément racine :

```html
<html data-theme="dark">
```

## Classes utilitaires

Des classes utilitaires sont disponibles pour des ajustements rapides sans créer de CSS personnalisé :

- Espacement: `m-1`, `p-2`, `mt-3`, etc.
- Typographie: `text-center`, `font-bold`, etc.
- Couleurs: `text-primary`, `bg-surface`, etc.
- Layout: `d-flex`, `items-center`, etc.

## Alertes et notifications

Le système fournit différents types d'alertes et notifications :

```jsx
{/* Alertes contextuelles */}
<div className="alert alert-success alert-icon">Opération réussie!</div>
<div className="alert alert-error alert-icon">Une erreur est survenue</div>
<div className="alert alert-info alert-icon">Information importante</div>
<div className="alert alert-warning alert-icon">Attention</div>

{/* Badges et indicateurs d'état */}
<span className="badge">Nouveau</span>
<span className="badge badge-error">Important</span>
<span className="status-dot status-online"></span>
```

## Formulaires stylisés

Exemple de formulaire avec nos nouveaux styles :

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

## Messages et discussions

Exemple d'un composant de message avec notre nouveau design :

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

Le système est "mobile-first" avec des media queries pour les écrans plus grands.
