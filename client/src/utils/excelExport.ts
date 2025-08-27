import ExcelJS from 'exceljs'
import { Demande } from '@/types'
import dayjs from 'dayjs'

interface ExcelColumn {
  header: string
  accessor: string | ((row: Demande) => any)
  formatter?: (value: any) => string
  width?: number
}

interface ExportOptions {
  filename: string
  sheetName: string
  columns: ExcelColumn[]
  data: Demande[]
}

export const exportToExcel = async (options: ExportOptions) => {
  const { filename, sheetName, columns, data } = options

  // Créer un nouveau classeur
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  // Définir les colonnes avec leurs largeurs
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.header.toLowerCase().replace(/\s+/g, '_'),
    width: col.width || 15
  }))

  // Ajouter les données
  data.forEach(row => {
    const rowData: any = {}
    
    columns.forEach(col => {
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
        value = col.formatter(value)
      }

      // Valeur par défaut pour les valeurs nulles/undefined
      if (value === null || value === undefined) {
        value = ''
      }

      const key = col.header.toLowerCase().replace(/\s+/g, '_')
      rowData[key] = value
    })

    worksheet.addRow(rowData)
  })

  // Styler l'en-tête (première ligne)
  const headerRow = worksheet.getRow(1)
  headerRow.height = 30
  
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Calibri',
      size: 12,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' }
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
  })

  // Styler les lignes de données
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i)
    row.height = 25
    
    // Alternance de couleurs
    const isEvenRow = i % 2 === 0
    const bgColor = isEvenRow ? 'FFF8F9FA' : 'FFFFFFFF'
    
    row.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        size: 11,
        color: { argb: 'FF000000' }
      }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left'
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      }
    })
  }

  // Appliquer un filtre automatique sur l'en-tête
  worksheet.autoFilter = {
    from: 'A1',
    to: { row: 1, column: columns.length }
  }

  // Générer le buffer du fichier
  const buffer = await workbook.xlsx.writeBuffer()

  // Créer un blob et télécharger
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Fonction utilitaire pour accéder aux propriétés imbriquées
const getNestedProperty = (obj: any, path: string): any => {
  return path.split('.').reduce((current, prop) => {
    return current && current[prop] !== undefined ? current[prop] : null
  }, obj)
}

// Configurations d'export pour les différentes tables
export const exportRevueDecisions = async (data: Demande[], selectedUser?: { nom: string; prenom: string; grade?: string }) => {
  const userInfo = selectedUser 
    ? `${selectedUser.grade ? `${selectedUser.grade} ` : ''}${selectedUser.prenom} ${selectedUser.nom}`
    : 'Utilisateur'

  const columns: ExcelColumn[] = [
    {
      header: 'Nom',
      accessor: 'nom',
      width: 18
    },
    {
      header: 'Prénom',
      accessor: 'prenom',
      width: 18
    },
    {
      header: 'Qualité',
      accessor: 'type',
      formatter: (value: string) => value === 'VICTIME' ? 'Victime' : 'Mis en cause',
      width: 15
    },
    {
      header: 'Date de réception',
      accessor: 'dateReception',
      formatter: (value: string) => value ? dayjs(value).format('DD/MM/YYYY') : '',
      width: 18
    },
    {
      header: 'Dossier',
      accessor: (row: Demande) => row.dossier?.numero || 'Non lié',
      width: 20
    },
    {
      header: 'Commentaire',
      accessor: 'commentaireDecision',
      formatter: (value: string) => value || 'Aucun commentaire',
      width: 35
    }
  ]

  const filename = `Revue_Decisions_${userInfo.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.xlsx`

  await exportToExcel({
    filename,
    sheetName: 'Demandes sans décision',
    columns,
    data
  })
}

export const exportRevueConventions = async (data: Demande[], selectedUser?: { nom: string; prenom: string; grade?: string }) => {
  const userInfo = selectedUser 
    ? `${selectedUser.grade ? `${selectedUser.grade} ` : ''}${selectedUser.prenom} ${selectedUser.nom}`
    : 'Utilisateur'

  const columns: ExcelColumn[] = [
    {
      header: 'Nom',
      accessor: 'nom',
      width: 18
    },
    {
      header: 'Prénom',
      accessor: 'prenom',
      width: 18
    },
    {
      header: 'Qualité',
      accessor: 'type',
      formatter: (value: string) => value === 'VICTIME' ? 'Victime' : 'Mis en cause',
      width: 15
    },
    {
      header: 'Date de décision PJ',
      accessor: (row: Demande) => {
        const decisionPj = row.decisions?.find(decisionItem => 
          decisionItem.decision.type === 'PJ'
        )
        return decisionPj?.decision.dateSignature || null
      },
      formatter: (value: string) => value ? dayjs(value).format('DD/MM/YYYY') : '-',
      width: 20
    },
    {
      header: 'Dossier',
      accessor: (row: Demande) => row.dossier?.numero || 'Non lié',
      width: 20
    },
    {
      header: 'Commentaire',
      accessor: 'commentaireConvention',
      formatter: (value: string) => value || 'Aucun commentaire',
      width: 35
    }
  ]

  const filename = `Revue_Conventions_${userInfo.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.xlsx`

  await exportToExcel({
    filename,
    sheetName: 'Demandes PJ sans convention',
    columns,
    data
  })
}