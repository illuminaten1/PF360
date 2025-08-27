import * as XLSX from 'xlsx'
import { Demande } from '@/types'
import dayjs from 'dayjs'

interface ExcelColumn {
  header: string
  accessor: string | ((row: Demande) => any)
  formatter?: (value: any) => string
}

interface ExportOptions {
  filename: string
  sheetName: string
  columns: ExcelColumn[]
  data: Demande[]
}

export const exportToExcel = (options: ExportOptions) => {
  const { filename, sheetName, columns, data } = options

  // Créer les en-têtes
  const headers = columns.map(col => col.header)

  // Créer les données transformées
  const rows = data.map(row => {
    return columns.map(col => {
      let value: any

      if (typeof col.accessor === 'string') {
        // Accès direct à une propriété
        value = getNestedProperty(row, col.accessor)
      } else {
        // Fonction d'accès personnalisée
        value = col.accessor(row)
      }

      // Appliquer le formateur si défini
      if (col.formatter && value !== null && value !== undefined) {
        return col.formatter(value)
      }

      // Valeur par défaut pour les valeurs nulles/undefined
      if (value === null || value === undefined) {
        return ''
      }

      return value
    })
  })

  // Créer la feuille de calcul
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Ajuster la largeur des colonnes
  const colWidths = headers.map((_, colIndex) => {
    const headerLength = headers[colIndex].length
    const maxDataLength = Math.max(
      ...rows.map(row => String(row[colIndex] || '').length)
    )
    return { wch: Math.max(headerLength, maxDataLength, 10) }
  })
  worksheet['!cols'] = colWidths

  // Créer le classeur
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Télécharger le fichier
  XLSX.writeFile(workbook, filename)
}

// Fonction utilitaire pour accéder aux propriétés imbriquées
const getNestedProperty = (obj: any, path: string): any => {
  return path.split('.').reduce((current, prop) => {
    return current && current[prop] !== undefined ? current[prop] : null
  }, obj)
}

// Configurations d'export pour les différentes tables
export const exportRevueDecisions = (data: Demande[], selectedUser?: { nom: string; prenom: string; grade?: string }) => {
  const userInfo = selectedUser 
    ? `${selectedUser.grade ? `${selectedUser.grade} ` : ''}${selectedUser.prenom} ${selectedUser.nom}`
    : 'Utilisateur'

  const columns: ExcelColumn[] = [
    {
      header: 'Nom',
      accessor: 'nom'
    },
    {
      header: 'Prénom',
      accessor: 'prenom'
    },
    {
      header: 'Qualité',
      accessor: 'type',
      formatter: (value: string) => value === 'VICTIME' ? 'Victime' : 'Mis en cause'
    },
    {
      header: 'Date de réception',
      accessor: 'dateReception',
      formatter: (value: string) => value ? dayjs(value).format('DD/MM/YYYY') : ''
    },
    {
      header: 'Dossier',
      accessor: (row: Demande) => row.dossier?.numero || 'Non lié'
    },
    {
      header: 'Commentaire',
      accessor: 'commentaireDecision',
      formatter: (value: string) => value || 'Aucun commentaire'
    }
  ]

  const filename = `Revue_Decisions_${userInfo.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.xlsx`

  exportToExcel({
    filename,
    sheetName: 'Demandes sans décision',
    columns,
    data
  })
}

export const exportRevueConventions = (data: Demande[], selectedUser?: { nom: string; prenom: string; grade?: string }) => {
  const userInfo = selectedUser 
    ? `${selectedUser.grade ? `${selectedUser.grade} ` : ''}${selectedUser.prenom} ${selectedUser.nom}`
    : 'Utilisateur'

  const columns: ExcelColumn[] = [
    {
      header: 'Nom',
      accessor: 'nom'
    },
    {
      header: 'Prénom',
      accessor: 'prenom'
    },
    {
      header: 'Qualité',
      accessor: 'type',
      formatter: (value: string) => value === 'VICTIME' ? 'Victime' : 'Mis en cause'
    },
    {
      header: 'Date de décision PJ',
      accessor: (row: Demande) => {
        const decisionPj = row.decisions?.find(decisionItem => 
          decisionItem.decision.type === 'PJ'
        )
        return decisionPj?.decision.dateSignature || null
      },
      formatter: (value: string) => value ? dayjs(value).format('DD/MM/YYYY') : '-'
    },
    {
      header: 'Dossier',
      accessor: (row: Demande) => row.dossier?.numero || 'Non lié'
    },
    {
      header: 'Commentaire',
      accessor: 'commentaireConvention',
      formatter: (value: string) => value || 'Aucun commentaire'
    }
  ]

  const filename = `Revue_Conventions_${userInfo.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.xlsx`

  exportToExcel({
    filename,
    sheetName: 'Demandes PJ sans convention',
    columns,
    data
  })
}