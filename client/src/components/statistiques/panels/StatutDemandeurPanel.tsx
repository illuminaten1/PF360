import React from 'react'
import { StatistiquesStatutDemandeur } from '../types'
import GenericStatsTable from './GenericStatsTable'

interface StatutDemandeurPanelProps {
  statsStatut: StatistiquesStatutDemandeur[] | undefined
}

const StatutDemandeurPanel: React.FC<StatutDemandeurPanelProps> = ({ statsStatut }) => {
  const transformedData = statsStatut?.map(stat => ({
    label: stat.statutDemandeur,
    nombreDemandes: stat.nombreDemandes,
    pourcentage: stat.pourcentage
  }))

  return <GenericStatsTable data={transformedData} labelHeader="Statut" />
}

export default StatutDemandeurPanel