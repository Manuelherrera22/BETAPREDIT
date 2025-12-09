/**
 * CSV Export Utilities
 * Funciones para exportar datos a CSV
 */

/**
 * Convierte un array de objetos a formato CSV
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  // Crear header row
  const headerRow = headers.map(h => h.label).join(',')
  
  // Crear data rows
  const dataRows = data.map(item => {
    return headers.map(header => {
      const value = item[header.key]
      // Escapar comillas y envolver en comillas si contiene comas o comillas
      if (value === null || value === undefined) return ''
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(',')
  })
  
  // Combinar header y data
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Descarga un string como archivo CSV
 */
export function downloadCSV(content: string, filename: string): void {
  // Crear BOM para UTF-8 (ayuda con Excel)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Limpiar URL
  URL.revokeObjectURL(url)
}

/**
 * Exporta datos a CSV y descarga el archivo
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  filename: string
): void {
  if (data.length === 0) {
    throw new Error('No hay datos para exportar')
  }
  
  const csvContent = convertToCSV(data, headers)
  downloadCSV(csvContent, filename)
}

