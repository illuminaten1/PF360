import React from 'react'
import { StatistiquesContexteMissionnel } from '../types'
import GenericStatsTable from './GenericStatsTable'

interface ContexteMissionnelPanelProps {
  statsContexte: StatistiquesContexteMissionnel[] | undefined
}

const ContexteMissionnelPanel: React.FC<ContexteMissionnelPanelProps> = ({ statsContexte }) => {
  const transformedData = statsContexte?.map(stat => ({
    label: stat.contexteMissionnel,
    nombreDemandes: stat.nombreDemandes,
    pourcentage: stat.pourcentage
  }))

  return <GenericStatsTable data={transformedData} labelHeader="Contexte" />
}

export default ContexteMissionnelPanel