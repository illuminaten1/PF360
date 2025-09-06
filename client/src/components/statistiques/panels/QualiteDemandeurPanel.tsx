import React from 'react'
import { StatistiquesQualiteDemandeur } from '../types'
import GenericStatsTable from './GenericStatsTable'

interface QualiteDemandeurPanelProps {
  statsQualite: StatistiquesQualiteDemandeur[] | undefined
}

const QualiteDemandeurPanel: React.FC<QualiteDemandeurPanelProps> = ({ statsQualite }) => {
  const transformedData = statsQualite?.map(stat => ({
    label: stat.qualite === 'VICTIME' ? 'Victime' : 'Mis en cause',
    nombreDemandes: stat.nombreDemandes,
    pourcentage: stat.pourcentage
  }))

  return <GenericStatsTable data={transformedData} labelHeader="Qualité" />
}

export default QualiteDemandeurPanel