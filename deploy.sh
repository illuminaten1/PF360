#!/bin/bash
echo "🚀 Démarrage du déploiement..."

cd /opt/PF360
git pull

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
    NODE_OPTIONS="--max-old-space-size=4096" npm run build
fi

# Redémarrage des services
pm2 restart all

echo "✅ Déploiement terminé"
pm2 status