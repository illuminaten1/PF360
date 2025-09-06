import React from 'react'
import { StatistiquesTypeInfraction } from '../types'
import GenericStatsTable from './GenericStatsTable'

interface TypeInfractionPanelProps {
  statsInfractions: StatistiquesTypeInfraction[] | undefined
}

const TypeInfractionPanel: React.FC<TypeInfractionPanelProps> = ({ statsInfractions }) => {
  const transformedData = statsInfractions?.map(stat => ({
    label: stat.qualificationInfraction,
    nombreDemandes: stat.nombreDemandes,
    pourcentage: stat.pourcentage
  }))

  return <GenericStatsTable data={transformedData} labelHeader="Type" />
}

export default TypeInfractionPanel