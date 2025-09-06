import React from 'react'
import { StatistiquesFormationAdministrative } from '../types'
import GenericStatsTable from './GenericStatsTable'

interface FormationAdministrativePanelProps {
  statsFormation: StatistiquesFormationAdministrative[] | undefined
}

const FormationAdministrativePanel: React.FC<FormationAdministrativePanelProps> = ({ statsFormation }) => {
  const transformedData = statsFormation?.map(stat => ({
    label: stat.formationAdministrative,
    nombreDemandes: stat.nombreDemandes,
    pourcentage: stat.pourcentage
  }))

  return <GenericStatsTable data={transformedData} labelHeader="FA" />
}

export default FormationAdministrativePanel