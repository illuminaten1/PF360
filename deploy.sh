#!/bin/bash
echo "🚀 Démarrage du déploiement..."

cd /opt/PF360
# Fetch les dernières modifications
git fetch origin

# Force la synchronisation avec la branche distante
echo "🔄 Synchronisation avec origin/main..."
git reset --hard origin/main

# PAUSE pour permettre la modification des variables d'environnement
echo "⚠️  ATTENTION: Les fichiers .env ont été réinitialisés !"
echo "📝 Veuillez maintenant modifier vos variables d'environnement :"
echo "   - client/.env.production (VITE_API_URL)"
echo "   - server/.env.production (si nécessaire)"
echo ""
read -p "Appuyez sur ENTRÉE pour continuer le déploiement une fois les modifications terminées..."

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