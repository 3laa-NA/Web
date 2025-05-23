# Guide d'Installation - Organiz'Asso

Ce document fournit les instructions détaillées pour installer et configurer l'application Organiz'Asso, comprenant les composants Frontend et Backend.

## Prérequis système

- **Node.js** (version 16.0 ou supérieure)
- **MongoDB** (version 4.4 ou supérieure)
- **Git** (pour la gestion du code source)
- **Espace disque** : minimum 500 Mo recommandé
- **RAM** : minimum 2 Go recommandé pour le développement

## 1. Installation du Backend (API)

1. Ouvrez un terminal à la racine du dossier `BackEnd` :

   ```bash
   cd BackEnd
   ```

2. Installez les dépendances Node.js requises :

   ```bash
   npm install
   ```

3. Configuration de l'environnement :
   - Créez un fichier `.env` basé sur le modèle `.env.example`
   - Configurez les variables suivantes :
     - `DB_URI` : URI de connexion à votre base de données MongoDB
     - `JWT_SECRET` : Clé secrète pour les tokens d'authentification
     - `PORT` : Port du serveur (défaut : 8000)
     - `NODE_ENV` : Environnement (`development`, `production` ou `test`)

4. Initialisez la base de données avec les données de départ :

   ```bash
   npm run init-db
   ```

5. Démarrez le serveur d'API en mode développement :

   ```bash
   npm run dev
   ```

Le serveur API sera accessible à l'adresse : <http://localhost:8000>

> **Note** : Pour un environnement de production, utilisez `npm start` au lieu de `npm run dev`

## 2. Installation du Frontend (Interface utilisateur)

1. Ouvrez un nouveau terminal et accédez au dossier `FrontEnd` :

   ```bash
   cd FrontEnd
   ```

2. Installez les dépendances Node.js du frontend :

   ```bash
   npm install
   ```

3. Configuration de l'environnement :
   - Créez un fichier `.env` contenant les variables suivantes :

   ```bash
   VITE_API_URL=http://localhost:8000/api
   VITE_APP_VERSION=1.0.0
   VITE_DEFAULT_LANGUAGE=fr
   ```

4. Démarrez le serveur de développement Vite :

   ```bash
   npm run dev
   ```

L'interface utilisateur sera accessible à l'adresse : <http://localhost:5173>

> **Note** : Pour générer une version optimisée pour la production, utilisez la commande `npm run build`

## 3. Vérification de l'installation

1. Accédez à l'interface utilisateur via votre navigateur à l'adresse <http://localhost:5173>.
2. Connectez-vous en utilisant les identifiants de test :
   - Identifiant : `admin@organiz-asso.fr`
   - Mot de passe : `admin123`
3. Vérifiez que l'indicateur de statut de connexion au backend (coin supérieur droit) est actif et vert.
4. Testez la création d'un message pour confirmer le bon fonctionnement de la base de données.


Consultez le fichier `.env.example` dans le dossier Backend et ajustez vos variables d'environnement en conséquence.

## Résolution des problèmes courants

Le tableau ci-dessous présente les problèmes fréquemment rencontrés et leurs solutions :

| Problème | Solution |
|----------|----------|
| Erreur de connexion à MongoDB | Vérifiez que le service MongoDB est bien lancé |
| Port déjà utilisé | Modifiez les ports dans les fichiers de configuration |
| Erreurs d'installation NPM | Essayez `npm cache clean --force` puis réinstallez |

## Support technique

Pour toute assistance technique :

- Consultez la documentation complète dans le dossier `docs/`
- Créez un ticket sur le dépôt GitHub du projet
- Contactez l'équipe de développement : <support@organiz-asso.fr>

---

## Informations sur le document

**Projet** : Organiz'Asso - Application de gestion associative  
**Type** : Guide d'installation  
**Version** : 1.2.0  
**Date de dernière mise à jour** : 23/05/2025  
**Contexte** : Cours de Développement Web Avancé - Sorbonne Université
