import React from 'react'
import { HTMLTable } from '@blueprintjs/core'

interface ExtractionMensuelleData {
  mois: string
  ddesDePfVictimeUniquementToutesInfractions: number
  dontReservistes: number
  cumulDdeVictime: number
  dontCumulVictimeReservistes: number
  ddesDePfPourViolences: number
  dontDdesDePfPourViolencesSurReservistes: number
  cumulViolences: number
  dontCumulViolencesReservistes: number
}

interface ExtractionMensuelleStats {
  donneesParMois: ExtractionMensuelleData[]
  moyenneParMois: {
    ddesDePfVictimeUniquementToutesInfractions: number
    dontReservistes: number
    ddesDePfPourViolences: number
    dontDdesDePfPourViolencesSurReservistes: number
  }
}

interface ExtractionMensuelleComponentProps {
  stats: ExtractionMensuelleStats | undefined
}

const ExtractionMensuelleComponent: React.FC<ExtractionMensuelleComponentProps> = ({ stats }) => {
  if (!stats || !stats.donneesParMois?.length) {
    return (
      <div className="p-4 h-full overflow-auto">
        <div style={{ textAlign: 'center', color: '#5C7080' }}>
          Aucune donnée disponible
        </div>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const formatDecimal = (num: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(num)
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <HTMLTable 
        striped 
        interactive
        style={{ width: '100%', fontSize: '12px' }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '10px' }}>
              MOIS
            </th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '10px' }}>
              DDES DE PF VICTIME UNIQUEMENT TOUTES INFRACTIONS
            </th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '10px' }}>
              DONT RÉSERVISTES
            </th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '10px' }}>
              CUMUL DDE VICTIME
            </th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '10px' }}>
              DONT CUMUL VICTIME RÉSERVISTES
            </th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '10px' }}>
              DDES DE PF POUR VIOLENCES
            </th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '10px' }}>
              DONT DDES DE PF POUR VIOLENCES SUR RÉSERVISTES
            </th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '10px' }}>
              CUMUL VIOLENCES
            </th>
            <th style={{ textAlign: 'center', padding: '8px', fontSize: '10px' }}>
              DONT CUMUL VIOLENCES RÉSERVISTES
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.donneesParMois.map((data) => (
            <tr key={data.mois}>
              <td style={{ textAlign: 'center', padding: '6px', fontWeight: 500 }}>
                {data.mois}
              </td>
              <td style={{ textAlign: 'center', padding: '6px' }}>
                {formatNumber(data.ddesDePfVictimeUniquementToutesInfractions)}
              </td>
              <td style={{ textAlign: 'center', padding: '6px' }}>
                {formatNumber(data.dontReservistes)}
              </td>
              <td style={{ textAlign: 'center', padding: '6px' }}>
                {formatNumber(data.cumulDdeVictime)}
              </td>
              <td style={{ textAlign: 'center', padding: '6px' }}>
                {formatNumber(data.dontCumulVictimeReservistes)}
              </td>
              <td style={{ textAlign: 'center', padding: '6px' }}>
                {formatNumber(data.ddesDePfPourViolences)}
              </td>
              <td style={{ textAlign: 'center', padding: '6px' }}>
                {formatNumber(data.dontDdesDePfPourViolencesSurReservistes)}
              </td>
              <td style={{ textAlign: 'center', padding: '6px' }}>
                {formatNumber(data.cumulViolences)}
              </td>
              <td style={{ textAlign: 'center', padding: '6px' }}>
                {formatNumber(data.dontCumulViolencesReservistes)}
              </td>
            </tr>
          ))}
          
          <tr style={{ backgroundColor: '#F5F8FA', borderTop: '2px solid #CED9E0' }}>
            <td style={{ textAlign: 'center', padding: '6px', fontWeight: 'bold' }}>
              MOYENNE / MOIS
            </td>
            <td style={{ textAlign: 'center', padding: '6px', fontWeight: 'bold' }}>
              {formatDecimal(stats.moyenneParMois.ddesDePfVictimeUniquementToutesInfractions)}
            </td>
            <td style={{ textAlign: 'center', padding: '6px', fontWeight: 'bold' }}>
              {formatDecimal(stats.moyenneParMois.dontReservistes)}
            </td>
            <td style={{ textAlign: 'center', padding: '6px', fontWeight: 'bold' }}>
              -
            </td>
            <td style={{ textAlign: 'center', padding: '6px', fontWeight: 'bold' }}>
              -
            </td>
            <td style={{ textAlign: 'center', padding: '6px', fontWeight: 'bold' }}>
              {formatDecimal(stats.moyenneParMois.ddesDePfPourViolences)}
            </td>
            <td style={{ textAlign: 'center', padding: '6px', fontWeight: 'bold' }}>
              {formatDecimal(stats.moyenneParMois.dontDdesDePfPourViolencesSurReservistes)}
            </td>
            <td style={{ textAlign: 'center', padding: '6px', fontWeight: 'bold' }}>
              -
            </td>
            <td style={{ textAlign: 'center', padding: '6px', fontWeight: 'bold' }}>
              -
            </td>
          </tr>
        </tbody>
      </HTMLTable>
    </div>
  )
}

export default ExtractionMensuelleComponent