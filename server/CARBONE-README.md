# 🎯 API Génération de Documents avec Carbone

## Configuration

1. **Template requis**: Utilisez la page **Templates** de l'admin pour uploader un template de type "règlement" **au format ODT**
2. **Variables**: Consultez `templates/EXEMPLE-variables-disponibles.txt` pour toutes les variables disponibles
3. **Système intégré**: Utilise le système de versioning et gestion des templates existant

## Routes API

### 📋 Lister les paiements
```http
GET /api/generate-documents/paiements
Authorization: Bearer YOUR_TOKEN
```

**Réponse**: Liste des paiements avec infos de base

### 📄 Générer une fiche de paiement
```http
POST /api/generate-documents/fiche-paiement/:paiementId
Authorization: Bearer YOUR_TOKEN
```

**Paramètres**: `paiementId` = ID du paiement dans la base
**Réponse**: Fichier ODT généré avec toutes les données

## Données injectées

L'API récupère automatiquement :
- ✅ **Paiement** avec toutes ses propriétés
- ✅ **Utilisateur** créateur
- ✅ **SGAMI** associé  
- ✅ **PCE** (si présent)
- ✅ **Dossier** associé
- ✅ **Demandes** du dossier
- ✅ **Décisions** associées au paiement

## Test

1. Démarrez le serveur: `npm run dev`
2. Listez les paiements: `GET /api/generate-documents/paiements`
3. Générez un document: `POST /api/generate-documents/fiche-paiement/{ID}`

## Structure des données

Toutes les variables utilisent la structure Prisma:
```
{
  d: {
    paiement: { ... },
    utilisateur: { ... },
    sgami: { ... },
    pce: { ... },
    dossier: { ... },
    demandes: [ ... ],
    decisions: [ ... ],
    dateGeneration: "..."
  }
}
```

## Log

Chaque génération est automatiquement logguée avec:
- Action: `GENERATE_FICHE_PAIEMENT`
- Détail: Numéro et bénéficiaire
- Entité: `Paiement`
- Entité ID: `paiementId`