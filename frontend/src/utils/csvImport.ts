/**
 * CSV Import Utilities
 * Funciones para importar y parsear archivos CSV
 */

export interface CSVBetRow {
  fecha?: string
  evento?: string
  seleccion?: string
  mercado?: string
  plataforma?: string
  cuota?: string | number
  stake?: string | number
  moneda?: string
  ganancia_potencial?: string | number
  estado?: string
  resultado?: string
  ganancia_real?: string | number
  fecha_resolucion?: string
  notas?: string
  tags?: string
  link?: string
}

/**
 * Parsea un archivo CSV a un array de objetos
 */
export function parseCSV(csvText: string): CSVBetRow[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    throw new Error('El archivo CSV está vacío')
  }

  // Detectar separador (coma o punto y coma)
  const firstLine = lines[0]
  const separator = firstLine.includes(';') ? ';' : ','
  
  // Parsear header
  const headers = parseCSVLine(firstLine, separator).map(h => h.trim().toLowerCase())
  
  // Parsear datos
  const data: CSVBetRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], separator)
    
    if (values.length === 0 || values.every(v => !v.trim())) {
      continue // Saltar líneas vacías
    }
    
    const row: CSVBetRow = {}
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || ''
      row[header as keyof CSVBetRow] = value
    })
    
    data.push(row)
  }
  
  return data
}

/**
 * Parsea una línea CSV respetando comillas
 */
function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === separator && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current)
  
  return result
}

/**
 * Valida y normaliza una fila de CSV a formato de apuesta
 */
export function validateAndNormalizeBetRow(
  row: CSVBetRow,
  rowIndex: number
): { valid: boolean; data?: any; errors: string[] } {
  const errors: string[] = []
  
  // Campos requeridos
  if (!row.plataforma) {
    errors.push(`Fila ${rowIndex + 1}: Falta plataforma`)
  }
  
  if (!row.seleccion) {
    errors.push(`Fila ${rowIndex + 1}: Falta selección`)
  }
  
  // Validar cuota
  const odds = parseFloat(String(row.cuota || 0))
  if (!odds || odds <= 1) {
    errors.push(`Fila ${rowIndex + 1}: Cuota inválida (debe ser > 1.00)`)
  }
  
  // Validar stake
  const stake = parseFloat(String(row.stake || 0))
  if (!stake || stake <= 0) {
    errors.push(`Fila ${rowIndex + 1}: Stake inválido (debe ser > 0)`)
  }
  
  // Validar fecha
  let betPlacedAt: string | undefined
  if (row.fecha) {
    try {
      // Intentar parsear diferentes formatos de fecha
      const dateStr = row.fecha.trim()
      let date: Date
      
      // Formato: DD/MM/YYYY HH:mm o DD/MM/YYYY
      if (dateStr.includes('/')) {
        const parts = dateStr.split(' ')
        const datePart = parts[0].split('/')
        if (datePart.length === 3) {
          date = new Date(
            parseInt(datePart[2]),
            parseInt(datePart[1]) - 1,
            parseInt(datePart[0]),
            parts[1] ? parseInt(parts[1].split(':')[0]) : 0,
            parts[1] ? parseInt(parts[1].split(':')[1]) : 0
          )
        } else {
          throw new Error('Formato de fecha inválido')
        }
      } else {
        // ISO format
        date = new Date(dateStr)
      }
      
      if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida')
      }
      
      betPlacedAt = date.toISOString()
    } catch (error) {
      errors.push(`Fila ${rowIndex + 1}: Fecha inválida (${row.fecha})`)
    }
  } else {
    betPlacedAt = new Date().toISOString()
  }
  
  // Validar estado
  const validStatuses = ['PENDING', 'WON', 'LOST', 'VOID', 'CANCELLED']
  let status = 'PENDING'
  if (row.estado) {
    const statusUpper = row.estado.toUpperCase()
    if (validStatuses.includes(statusUpper)) {
      status = statusUpper
    } else {
      // Mapear estados en español
      const statusMap: Record<string, string> = {
        'PENDIENTE': 'PENDING',
        'GANADA': 'WON',
        'PERDIDA': 'LOST',
        'ANULADA': 'VOID',
        'CANCELADA': 'CANCELLED',
      }
      status = statusMap[statusUpper] || 'PENDING'
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  // Normalizar datos
  const normalizedData = {
    platform: row.plataforma || '',
    marketType: row.mercado || 'Match Winner',
    selection: row.seleccion || '',
    odds: odds,
    stake: stake,
    currency: (row.moneda || 'EUR').toUpperCase(),
    betPlacedAt: betPlacedAt,
    platformUrl: row.link || '',
    platformBetId: '',
    notes: row.notas || '',
    tags: row.tags ? row.tags.split(';').map(t => t.trim()).filter(t => t) : [],
    status: status as 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'CANCELLED',
    result: row.resultado ? (row.resultado.toUpperCase() as 'WON' | 'LOST' | 'VOID') : undefined,
    actualWin: row.ganancia_real ? parseFloat(String(row.ganancia_real)) + stake : undefined,
  }
  
  return { valid: true, data: normalizedData, errors: [] }
}

/**
 * Lee un archivo CSV y retorna su contenido como texto
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const text = e.target?.result as string
      resolve(text)
    }
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'))
    }
    
    reader.readAsText(file, 'UTF-8')
  })
}

