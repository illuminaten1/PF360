# TODO Before Production

Liste des tâches à effectuer avant la mise en production.

## Base de données et Recherche

### Modal de liaison demande-dossier
- [ ] **Ajouter recherche insensible à la casse** dans `/server/routes/dossiers.js`
  - Localisation : Ligne ~40-70, fonction de recherche
  - Action : Ajouter `mode: 'insensitive'` aux critères de recherche Prisma
  - Raison : SQLite (dev) ne supporte pas `mode: 'insensitive'`, mais PostgreSQL (prod) oui
  - Code à modifier :
    ```javascript
    numero: {
      contains: searchTerm,
      mode: 'insensitive'  // <- Ajouter cette ligne
    }
    ```
  - Appliquer sur tous les champs de recherche : `numero`, `nom`, `prenom`, `numeroDS`

## Autres points de vérification

- [ ] **Variables d'environnement** : Vérifier que toutes les variables nécessaires sont configurées
- [ ] **Migrations Prisma** : S'assurer que toutes les migrations sont appliquées en production
- [ ] **Performance** : Vérifier les index de base de données pour les recherches fréquentes
- [ ] **Logs** : Configurer les niveaux de logs appropriés pour la production

---

*Généré le 2025-09-09*