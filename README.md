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
- PostgreSQL
- Docker (optionnel)

### Backend
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend
```bash
cd client
npm install
npm start
```

## Scripts disponibles

- `npm run dev` - Démarrage en mode développement
- `npm run build` - Build de production
- `npm start` - Démarrage en mode production