# TODO Before Production

Liste des tâches à effectuer avant la mise en production.

## Base de données et Recherche

### Modal de liaison demande-dossier
- [ ] **Ajouter recherche insensible à la casse** dans `/server/routes/dossiers/list.js`
  - Localisation : Ligne ~17-46, fonction de recherche
  - Action : Ajouter `mode: 'insensitive'` aux critères de recherche Prisma
  - Raison : SQLite (dev) ne supporte pas `mode: 'insensitive'`, mais PostgreSQL (prod) oui
  - Code à modifier :
    ```javascript
    numero: {
      contains: searchTerm,
      mode: 'insensitive'  // <- Ajouter cette ligne
    }
    ```
  - Appliquer sur tous les champs de recherche : `numero`, `nomDossier`, `nom`, `prenom`

## Validation des données

### Définition des valeurs possibles pour les champs
- [ ] **Valeurs des énumérations** : Définir et valider les valeurs autorisées pour les champs suivants
  - Localisation : Commentaires en bas du schéma Prisma (`/server/prisma/schema.prisma`)
  - Action : Convertir les commentaires en validation Zod côté serveur et contraintes UI côté client
  - Champs concernés :
    - `Role` : "ADMIN" | "REDACTEUR" | "GREFFIER"
    - `TypeDemande` : "VICTIME" | "MIS_EN_CAUSE"
    - `Position` : "EN_SERVICE" | "HORS_SERVICE"
    - `TypeDecision` : "AJ" | "AJE" | "PJ" | "REJET"
    - `MotifRejet` : Valeurs prédéfinies pour les motifs de rejet
    - `EmissionTitrePerception` : "OUI" | "NON"
    - `QualiteBeneficiaire` : Liste des qualités de bénéficiaires autorisées
    - `ConventionJointeFRI` : "OUI" | "NON"
    - `StatutDemandeur` : "OG" | "OCTA" | "SOG" | "CSTAGN" | "GAV" | "Civil" | "Réserviste" | "Retraité" | "Ayant-droit"
    - `Grade` : Liste complète des grades militaires et civils
    - `Branche` : "GD" | "GM" | "GR" | "État-Major" | "GIE SPÉ" | "DG et ORG. CENTRAUX" | "GIGN"
    - `FormationAdministrative` : Liste des formations administratives françaises
    - `Departement` : Liste des départements et codes spéciaux
    - `ContexteMissionnel` : Liste des contextes missionnels
  - Raison : Éviter les erreurs de saisie et garantir la cohérence des données

## Autres points de vérification

- [ ] **Variables d'environnement** : Vérifier que toutes les variables nécessaires sont configurées
- [ ] **Migrations Prisma** : S'assurer que toutes les migrations sont appliquées en production
- [ ] **Performance** : Vérifier les index de base de données pour les recherches fréquentes
- [ ] **Logs** : Configurer les niveaux de logs appropriés pour la production

---

*Généré le 2025-09-09*