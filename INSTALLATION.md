# Guide d'Installation - Organiz'Asso

Ce guide explique comment installer et configurer l'application FrontEnd et BackEnd.

## Prérequis

- Node.js (v16+)
- MongoDB (v4+)
- Git

## 1. Backend (API)

1. Ouvrez un terminal à la racine de `BackEnd` :

   ```bash
   cd BackEnd
   ```

2. Installez les dépendances :

   ```bash
   npm install
   ```

3. Créez le fichier `.env` à partir de `.env.example` et configurez vos variables.

4. Initialisez la base de données :

   ```bash
   npm run init-db
   ```

5. Démarrez le serveur en mode développement :

   ```bash
   npm run dev
   ```

> Serveur accessible sur <http://localhost:8000>.

## 2. Frontend (Interface)

1. Dans un autre terminal, ouvrez `FrontEnd` :

   ```bash
   cd FrontEnd
   ```

2. Installez les dépendances :

   ```bash
   npm install
   ```

3. Créez ou mettez à jour `.env` avec :

   ```bash
   VITE_API_URL=http://localhost:8000/api
   ```

4. Démarrez l'application :

   ```bash
   npm run dev
   ```

> Frontend accessible sur <http://localhost:5173>.

## 3. Vérification

- Connectez-vous avec un compte existant (ex : `admin/admin123`).
- Vérifiez l'indicateur de statut de connexion au backend.

## Support

En cas de problème, consultez la documentation ou contactez <support@organiz-asso.fr>.
