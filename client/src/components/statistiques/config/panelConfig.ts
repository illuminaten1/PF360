import { PanelKey } from '../types'

export const getPanelTitle = (id: PanelKey): string => {
  switch (id) {
    case 'general': return 'Demandes'
    case 'users': return 'Utilisateurs'
    case 'bap': return 'BAP'
    case 'qualite': return 'Qualité du demandeur'
    case 'infractions': return 'Type d\'infraction'
    case 'contexte': return 'Contexte missionnel'
    case 'formation': return 'Formation administrative'
    case 'branche': return 'Branche'
    case 'statut': return 'Statut demandeur'
    case 'badges': return 'Badges'
    case 'reponseBrpf': return 'Réponse BRPF'
    case 'autocontrole': return 'Auto-contrôle'
    case 'fluxmensuels': return 'Flux mensuels'
    case 'fluxhebdo': return 'Flux hebdomadaires'
    case 'extraction': return 'Extraction mensuelle pour BAA / SP'
    case 'budget': return 'Budget'
    case 'statistiquesBudgetaires': return 'Statistiques d\'engagement'
    case 'engagementServicePayeur': return 'Engagement par service payeur'
    case 'engagementDepensesMensuelles': return 'Engagement des dépenses par mois'
    default: return 'Panneau'
  }
}

export const PANEL_ORDER_ADMINISTRATIF: PanelKey[] = [
  'general', 'users', 'extraction', 'badges', 'reponseBrpf', 
  'bap', 'qualite', 'infractions', 'contexte', 'formation', 
  'branche', 'statut', 'autocontrole', 'fluxmensuels', 'fluxhebdo'
]

export const PANEL_ORDER_BUDGETAIRE: PanelKey[] = [
  'budget', 'statistiquesBudgetaires', 'engagementServicePayeur', 'engagementDepensesMensuelles'
]

// Pour la compatibilité avec l'existant
export const PANEL_ORDER = PANEL_ORDER_ADMINISTRATIF