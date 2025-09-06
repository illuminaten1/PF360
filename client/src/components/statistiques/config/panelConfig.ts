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
    default: return 'Panneau'
  }
}

export const PANEL_ORDER: PanelKey[] = [
  'general', 'users', 'extraction', 'badges', 'reponseBrpf', 
  'bap', 'qualite', 'infractions', 'contexte', 'formation', 
  'branche', 'statut', 'autocontrole', 'fluxmensuels', 'fluxhebdo'
]