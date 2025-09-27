// Import des modules spécialisés
const {
  getStatistiquesAdministratives,
  getStatistiquesQualiteDemandeur,
  getStatistiquesTypeInfraction,
  getStatistiquesContexteMissionnel,
  getStatistiquesFormationAdministrative,
  getStatistiquesBranche,
  getStatistiquesStatutDemandeur,
  getStatistiquesBadges
} = require('./statistics/administratives');

const {
  getFluxMensuels,
  getFluxHebdomadaires
} = require('./statistics/flux');

const {
  getStatistiquesBAP,
  getAutoControle,
  getExtractionMensuelle,
  getStatistiquesReponseBRPF
} = require('./statistics/controles');

const {
  getStatistiquesBudgetaires,
  getEngagementServicePayeur,
  getEngagementDepensesMensuelles,
  getDepensesOrdonnees,
  getDepensesOrdonneesParSgami,
  getDepensesOrdonneesParPce,
  getDepensesOrdonneesParMois
} = require('./statistics/budgetaires');

const {
  getAnneesDisponibles
} = require('./statistics/utilitaires');

// Re-export toutes les fonctions pour maintenir la compatibilité
module.exports = {
  getStatistiquesAdministratives,
  getStatistiquesBAP,
  getStatistiquesQualiteDemandeur,
  getStatistiquesTypeInfraction,
  getStatistiquesContexteMissionnel,
  getStatistiquesFormationAdministrative,
  getStatistiquesBranche,
  getStatistiquesStatutDemandeur,
  getStatistiquesBadges,
  getFluxMensuels,
  getFluxHebdomadaires,
  getAutoControle,
  getExtractionMensuelle,
  getAnneesDisponibles,
  getStatistiquesReponseBRPF,
  getStatistiquesBudgetaires,
  getEngagementServicePayeur,
  getEngagementDepensesMensuelles,
  getDepensesOrdonnees,
  getDepensesOrdonneesParSgami,
  getDepensesOrdonneesParPce,
  getDepensesOrdonneesParMois
};