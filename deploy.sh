#!/bin/bash
echo "🚀 Démarrage du déploiement..."

cd /opt/PF360
# Fetch les dernières modifications
git fetch origin

# Force la synchronisation avec la branche distante
echo "🔄 Synchronisation avec origin/main..."
git reset --hard origin/main

# Mise à jour backend si nécessaire
cd server
if [ -f "package.json" ]; then
    npm install --production
    npx prisma generate
    # npx prisma migrate deploy  # Si vous avez des migrations
fi

# Rebuild frontend si nécessaire
cd ../client
if [ -f "package.json" ]; then
    npm install
    # Nettoyer le cache Vite avant le build
    echo "🧹 Nettoyage du cache Vite..."
    rm -rf dist/ node_modules/.vite .vite
    NODE_OPTIONS="--max-old-space-size=4096" npm run build
fi

# Redémarrage des services
pm2 restart all

echo "✅ Déploiement terminé"
pm2 status