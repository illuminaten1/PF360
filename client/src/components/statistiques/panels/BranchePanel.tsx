import React from 'react'
import { StatistiquesBranche } from '../types'
import GenericStatsTable from './GenericStatsTable'

interface BranchePanelProps {
  statsBranche: StatistiquesBranche[] | undefined
}

const BranchePanel: React.FC<BranchePanelProps> = ({ statsBranche }) => {
  const transformedData = statsBranche?.map(stat => ({
    label: stat.branche,
    nombreDemandes: stat.nombreDemandes,
    pourcentage: stat.pourcentage
  }))

  return <GenericStatsTable data={transformedData} labelHeader="Branche" />
}

export default BranchePanel