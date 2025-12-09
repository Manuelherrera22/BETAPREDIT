/**
 * Import Bets Modal Component
 * Modal para importar apuestas desde archivo CSV
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { externalBetsService, type RegisterExternalBetData } from '../services/externalBetsService'
import { readCSVFile, parseCSV, validateAndNormalizeBetRow } from '../utils/csvImport'
import toast from 'react-hot-toast'

interface ImportBetsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ImportBetsModal({ isOpen, onClose }: ImportBetsModalProps) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ valid: any[]; errors: string[] } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const importBetsMutation = useMutation({
    mutationFn: async (bets: RegisterExternalBetData[]) => {
      // Importar apuestas una por una (o en batch si el backend lo soporta)
      const results = []
      for (const bet of bets) {
        try {
          const result = await externalBetsService.registerBet(bet)
          results.push({ success: true, data: result })
        } catch (error: any) {
          results.push({ 
            success: false, 
            error: error?.response?.data?.error?.message || 'Error desconocido' 
          })
        }
      }
      return results
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length
      
      queryClient.invalidateQueries({ queryKey: ['externalBets'] })
      queryClient.invalidateQueries({ queryKey: ['roiTracking'] })
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] })
      
      if (errorCount === 0) {
        toast.success(`✅ ${successCount} apuestas importadas correctamente`)
      } else {
        toast.success(`✅ ${successCount} apuestas importadas, ${errorCount} con errores`)
      }
      
      handleClose()
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Error al importar apuestas')
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Por favor selecciona un archivo CSV')
      return
    }

    setFile(selectedFile)

    try {
      setIsProcessing(true)
      const csvText = await readCSVFile(selectedFile)
      const rows = parseCSV(csvText)
      
      const valid: any[] = []
      const errors: string[] = []
      
      rows.forEach((row, index) => {
        const validation = validateAndNormalizeBetRow(row, index)
        if (validation.valid && validation.data) {
          valid.push(validation.data)
        } else {
          errors.push(...validation.errors)
        }
      })
      
      setPreview({ valid, errors })
      
      if (valid.length === 0) {
        toast.error('No se encontraron apuestas válidas en el archivo')
      } else if (errors.length > 0) {
        toast(`${valid.length} apuestas válidas, ${errors.length} errores encontrados`, {
          icon: '⚠️',
          duration: 4000,
        })
      } else {
        toast.success(`${valid.length} apuestas listas para importar`)
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error al procesar el archivo CSV')
      setPreview(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = () => {
    if (!preview || preview.valid.length === 0) {
      toast.error('No hay apuestas válidas para importar')
      return
    }

    importBetsMutation.mutate(preview.valid)
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl border border-primary-500/20 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm border-b border-primary-500/20 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white">Importar Apuestas desde CSV</h2>
            <p className="text-sm text-gray-400 mt-1">
              Importa múltiples apuestas desde un archivo CSV
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Seleccionar Archivo CSV
            </label>
            <div className="border-2 border-dashed border-primary-500/30 rounded-lg p-8 text-center hover:border-primary-500/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="text-white font-semibold">
                    {file ? file.name : 'Haz clic para seleccionar archivo'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Solo archivos CSV
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Processing */}
          {isProcessing && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 text-center">
              <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-400">Procesando archivo...</p>
            </div>
          )}

          {/* Preview */}
          {preview && !isProcessing && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Apuestas Válidas</p>
                  <p className="text-2xl font-black text-green-400">{preview.valid.length}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Errores</p>
                  <p className="text-2xl font-black text-red-400">{preview.errors.length}</p>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm font-semibold text-red-400 mb-2">Errores encontrados:</p>
                  <ul className="space-y-1">
                    {preview.errors.map((error, index) => (
                      <li key={index} className="text-xs text-gray-300">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Valid Bets Preview */}
              {preview.valid.length > 0 && (
                <div className="bg-dark-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm font-semibold text-white mb-3">
                    Vista previa ({preview.valid.length} apuestas):
                  </p>
                  <div className="space-y-2">
                    {preview.valid.slice(0, 5).map((bet, index) => (
                      <div key={index} className="text-xs text-gray-400 bg-dark-900 p-2 rounded">
                        {bet.platform} - {bet.selection} @ {bet.odds} (€{bet.stake})
                      </div>
                    ))}
                    {preview.valid.length > 5 && (
                      <p className="text-xs text-gray-500 text-center">
                        ... y {preview.valid.length - 5} más
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Format Info */}
          <div className="bg-dark-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-white mb-2">Formato esperado del CSV:</p>
            <p className="text-xs text-gray-400 mb-2">
              Columnas: fecha, evento, seleccion, mercado, plataforma, cuota, stake, moneda, estado, notas, tags, link
            </p>
            <p className="text-xs text-gray-500">
              Campos obligatorios: plataforma, seleccion, cuota, stake
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-dark-900/95 backdrop-blur-sm border-t border-primary-500/20 p-6 flex gap-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-6 py-3 bg-dark-800 border border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-dark-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!preview || preview.valid.length === 0 || importBetsMutation.isPending}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:from-primary-400 hover:to-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importBetsMutation.isPending ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Importar {preview?.valid.length || 0} Apuestas
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

