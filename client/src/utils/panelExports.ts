import dayjs from 'dayjs'

// Lazy load ExcelJS only when needed
const getExcelJS = async () => {
  const ExcelJS = await import('exceljs')
  return ExcelJS.default
}

export interface ExportableData {
  [key: string]: any
}

export const exportToExcel = async (data: ExportableData[], filename: string, sheetName: string = 'Data') => {
  if (!data || data.length === 0) {
    throw new Error('Aucune donnée à exporter')
  }

  // Lazy load ExcelJS
  const ExcelJS = await getExcelJS()

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  if (data.length > 0) {
    const headers = Object.keys(data[0])

    // Définir les colonnes
    worksheet.columns = headers.map(header => ({
      header: header.charAt(0).toUpperCase() + header.slice(1),
      key: header,
      width: 20
    }))

    // Ajouter les données
    data.forEach(row => {
      worksheet.addRow(row)
    })

    // Styler l'en-tête
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

    // Appliquer un filtre automatique
    worksheet.autoFilter = {
      from: 'A1',
      to: { row: 1, column: headers.length }
    }
  }

  // Générer le buffer et télécharger
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })

  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const date = dayjs().format('YYYY-MM-DD')
  link.download = `${filename}-${date}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const createExportHandler = (getData: () => ExportableData[], filename: string, sheetName?: string) => {
  return async () => {
    try {
      const data = getData()
      await exportToExcel(data, filename, sheetName)
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
      throw error
    }
  }
}