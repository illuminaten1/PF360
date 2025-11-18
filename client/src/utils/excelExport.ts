import { Demande } from '@/types'
import dayjs from 'dayjs'

// Lazy load ExcelJS only when needed
const getExcelJS = async () => {
  const ExcelJS = await import('exceljs')
  return ExcelJS.default
}

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

  // Lazy load ExcelJS
  const ExcelJS = await getExcelJS()

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

// Fonction pour formater les valeurs de cellules selon leur type
const formatCellValue = (cell: any, getValue: () => any, row: Demande): string => {
  try {
    const columnId = cell.column.id
    const value = getValue()

    // Gestion spéciale pour les colonnes calculées
    if (columnId === 'militaire') {
      const grade = row.grade?.gradeAbrege || ''
      const nom = row.nom || ''
      const prenom = row.prenom || ''
      return `${grade} ${prenom} ${nom}`.trim()
    }

    if (columnId === 'assigneA') {
      const assigneA = row.assigneA
      if (!assigneA) return 'Non assigné'
      return `${assigneA.grade} ${assigneA.prenom} ${assigneA.nom}`.trim()
    }

    if (columnId === 'creePar') {
      const creePar = row.creePar
      if (!creePar) return ''
      return `${creePar.grade} ${creePar.prenom} ${creePar.nom}`.trim()
    }

    if (columnId === 'modifiePar') {
      const modifiePar = row.modifiePar
      if (!modifiePar) return ''
      return `${modifiePar.grade} ${modifiePar.prenom} ${modifiePar.nom}`.trim()
    }

    if (columnId === 'dossier') {
      return row.dossier?.numero || 'Aucun dossier'
    }

    if (columnId === 'soutiens') {
      const soutiens = []
      if (row.soutienPsychologique) soutiens.push('Psy')
      if (row.soutienSocial) soutiens.push('Social')
      if (row.soutienMedical) soutiens.push('Médical')
      return soutiens.join(', ')
    }

    if (columnId === 'badges') {
      const badges = row.badges
      if (!badges?.length) return ''
      return badges.map(badgeRel => badgeRel.badge.nom).join(', ')
    }

    if (columnId === 'baps') {
      const baps = row.baps
      if (!baps?.length) return ''
      return baps.map(bapRel => bapRel.bap.nomBAP).join(', ')
    }

    if (columnId === 'decisions') {
      const decisions = row.decisions
      if (!decisions?.length) return ''
      return decisions.map(decisionRel => {
        const decision = decisionRel.decision
        let result = decision.type
        if (decision.dateSignature) {
          result += ` (${dayjs(decision.dateSignature).format('DD/MM/YYYY')})`
        }
        return result
      }).join(', ')
    }

    if (columnId === 'conventions') {
      const conventions = row.conventions
      if (!conventions?.length) return ''
      return conventions.map(conventionRel => {
        const convention = conventionRel.convention
        let result = `${convention.numero} - ${convention.type}`
        if (convention.montantHT) {
          result += ` (${convention.montantHT.toLocaleString('fr-FR')} €)`
        }
        if (convention.avocat) {
          result += ` - ${convention.avocat.prenom} ${convention.avocat.nom}`
        }
        return result
      }).join('; ')
    }

    // Formatage des dates
    if (columnId.includes('date') || columnId.includes('Date')) {
      if (value && typeof value === 'string') {
        return dayjs(value).format('DD/MM/YYYY')
      }
    }

    // Formatage des types
    if (columnId === 'type') {
      return value === 'VICTIME' ? 'Victime' : 'Mis en cause'
    }

    // Formatage des positions
    if (columnId === 'position') {
      if (!value) return ''
      return value === 'EN_SERVICE' ? 'En service' : 'Hors service'
    }

    // Formatage des parties civiles
    if (columnId === 'partieCivile') {
      return value ? 'Oui' : 'Non'
    }

    // Formatage des montants
    if (columnId === 'montantPartieCivile') {
      if (!value) return ''
      return `${value.toLocaleString('fr-FR')} €`
    }

    // Valeur par défaut
    return value != null ? String(value) : ''
  } catch (error) {
    console.warn('Erreur lors du formatage de la cellule:', error)
    return ''
  }
}

export const exportDemandesTableFiltered = async (table: any) => {
  // Récupérer les données filtrées
  const filteredData = table.getFilteredRowModel().rows.map((row: any) => row.original)

  // Récupérer les colonnes visibles
  const visibleColumns = table.getVisibleLeafColumns()

  // Générer les colonnes d'export basées sur les colonnes visibles
  const columns: ExcelColumn[] = visibleColumns.map((column: any) => {
    const header = typeof column.columnDef.header === 'string'
      ? column.columnDef.header
      : column.id

    return {
      header,
      accessor: (row: Demande) => {
        // Créer un objet cell factice pour utiliser la logique de formatage existante
        const cell = { column: { id: column.id } }
        const getValue = () => {
          if (column.columnDef.accessorFn) {
            return column.columnDef.accessorFn(row)
          }
          if (column.columnDef.accessorKey) {
            return getNestedProperty(row, column.columnDef.accessorKey)
          }
          return null
        }
        return formatCellValue(cell, getValue, row)
      },
      width: getColumnWidth(column.id)
    }
  })

  const filename = `Export_Demandes_Filtrees_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`

  await exportToExcel({
    filename,
    sheetName: 'Demandes filtrées',
    columns,
    data: filteredData
  })
}

// Fonction pour définir la largeur des colonnes selon leur type
const getColumnWidth = (columnId: string): number => {
  const widthMap: { [key: string]: number } = {
    'numeroDS': 15,
    'type': 15,
    'militaire': 25,
    'nigend': 15,
    'statutDemandeur': 20,
    'branche': 15,
    'formationAdministrative': 25,
    'departement': 15,
    'unite': 20,
    'dateReception': 18,
    'dateFaits': 18,
    'dateAudience': 18,
    'commune': 20,
    'codePostal': 15,
    'position': 15,
    'contexteMissionnel': 25,
    'qualificationInfraction': 25,
    'qualificationsPenales': 25,
    'resume': 35,
    'blessures': 25,
    'partieCivile': 15,
    'montantPartieCivile': 15,
    'soutiens': 20,
    'assigneA': 25,
    'creePar': 25,
    'modifiePar': 25,
    'createdAt': 18,
    'updatedAt': 18,
    'dossier': 20,
    'decisions': 30,
    'conventions': 35,
    'badges': 25,
    'baps': 25,
    'adressePostaleLigne1': 30,
    'adressePostaleLigne2': 30,
    'telephoneProfessionnel': 18,
    'telephonePersonnel': 18,
    'emailProfessionnel': 25,
    'emailPersonnel': 25,
    'commentaireDecision': 35,
    'commentaireConvention': 35
  }

  return widthMap[columnId] || 20
}