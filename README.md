# PF360

Application de gestion des demandes d'aide juridique pour les militaires.

## Architecture

- **Frontend**: React avec TypeScript
- **Backend**: Node.js avec Express
- **Base de données**: PostgreSQL avec Prisma
- **Authentification**: JWT

## Structure du projet

```
├── client/          # Application React
├── server/          # API Express
├── docker-compose.yml
└── .env.example
```

## Installation

### Prérequis
- Node.js 18+

### Installation rapide
```bash
npm run setup
```

Cette commande va :
1. Installer toutes les dépendances (client + serveur)
2. Générer le client Prisma
3. Créer la base de données SQLite
4. Insérer les données de test

### Configuration des fichiers d'environnement
Après l'installation, copiez les fichiers de configuration :

```bash
# Requis pour le serveur
cp server/.env.example server/.env

# Recommandé pour le client (optionnel)
cp client/.env.example client/.env
```

**Note :** Le fichier `.env` du client n'est pas strictement nécessaire car l'application utilise des valeurs par défaut appropriées pour le développement local. Cependant, il est recommandé de le copier pour pouvoir personnaliser facilement l'URL de l'API si nécessaire.

### Démarrage
```bash
# Démarrer client et serveur simultanément
npm run dev

# Ou séparément :
npm run dev:server  # Serveur sur port 3001
npm run dev:client  # Client sur port 3000
```

### Identifiants de connexion
- **Admin** : `admin` / `admin123`
- **Utilisateur** : `test` / `test123`

## Fonctionnalités implémentées

### ✅ Core Features
- **Authentification JWT** avec gestion des rôles (Admin/Utilisateur)
- **Dashboard** avec vue d'ensemble
- **Gestion des dossiers** avec table interactive et modal de création/édition
- **Interface responsive** avec navigation sidebar
- **Validation des formulaires** avec React Hook Form + Zod
- **Gestion d'état** avec React Query pour le cache des données

### ✅ Backend
- **API REST** complète avec Express.js
- **Base de données** SQLite avec Prisma ORM
- **Modèles de données** complets (User, Demande, Dossier, etc.)
- **Middleware d'authentification** et protection des routes
- **Logging utilisateur** pour audit trail
- **Seed database** avec données de test

### ✅ Frontend
- **React + TypeScript** avec Vite
- **Tailwind CSS** pour le styling
- **Interface professionnelle** adaptée au contexte militaire
- **Composants réutilisables** (tables, modals, formulaires)
- **Gestion des erreurs** avec toast notifications
- **Routes protégées** selon les rôles utilisateur

### 🚧 À implémenter
- Pages Demandes, Décisions, Conventions, Paiements
- Génération de documents avec Carbone
- Export Excel avec ExcelJS
- Suivi automatique 2 mois
- Gestion des attendus
- Docker containerization

## Scripts disponibles

- `npm run setup` - Installation complète et configuration
- `npm run dev` - Démarrage client + serveur
- `npm run dev:server` - Serveur uniquement (port 3001)
- `npm run dev:client` - Client uniquement (port 3000)
- `npm run build` - Build de production
- `npm start` - Démarrage en mode production
- `npm run prisma:generate` - Générer le client Prisma
- `npm run prisma:push` - Synchroniser le schéma avec la DB
- `npm run prisma:seed` - Insérer les données de test

## URLs de l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Health Check** : http://localhost:3001/api/health