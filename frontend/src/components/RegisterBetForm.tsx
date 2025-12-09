import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { externalBetsService, type RegisterExternalBetData } from '../services/externalBetsService'
import { eventsService, type Event } from '../services/eventsService'
import { useDebounce } from '../hooks/useDebounce'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface RegisterBetFormProps {
  isOpen: boolean
  onClose: () => void
  valueBetAlertId?: string // Si viene de una alerta de value bet
  initialData?: Partial<RegisterExternalBetData> // Datos iniciales si viene de una alerta
}

const PLATFORMS = [
  'Bet365',
  'Betfair',
  'Pinnacle',
  'William Hill',
  'DraftKings',
  'FanDuel',
  'BetMGM',
  'Caesars',
  'Unibet',
  '888sport',
  'Betway',
  'BetVictor',
  'Otra',
]

const MARKET_TYPES = [
  'Match Winner',
  'Over/Under',
  'Both Teams to Score',
  'Double Chance',
  'Draw No Bet',
  'Asian Handicap',
  'Correct Score',
  'First Goal Scorer',
  'Anytime Goal Scorer',
  'Otra',
]

export default function RegisterBetForm({
  isOpen,
  onClose,
  valueBetAlertId,
  initialData,
}: RegisterBetFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<RegisterExternalBetData>({
    platform: initialData?.platform || '',
    marketType: initialData?.marketType || 'Match Winner',
    selection: initialData?.selection || '',
    odds: initialData?.odds || 0,
    stake: initialData?.stake || 0,
    currency: initialData?.currency || 'EUR',
    betPlacedAt: initialData?.betPlacedAt || new Date().toISOString(),
    platformUrl: initialData?.platformUrl || '',
    platformBetId: initialData?.platformBetId || '',
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
    eventId: initialData?.eventId,
    externalEventId: initialData?.externalEventId,
    valueBetAlertId: valueBetAlertId || initialData?.valueBetAlertId,
  })

  const [customPlatform, setCustomPlatform] = useState('')
  const [customMarketType, setCustomMarketType] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [eventSearchQuery, setEventSearchQuery] = useState('')
  const [showEventResults, setShowEventResults] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const eventSearchRef = useRef<HTMLDivElement>(null)

  // Debounce para búsqueda de eventos
  const debouncedEventQuery = useDebounce(eventSearchQuery, 300)

  // Buscar eventos cuando el usuario escribe
  const { data: searchResults = [], isLoading: searchingEvents } = useQuery({
    queryKey: ['eventSearch', debouncedEventQuery],
    queryFn: () => eventsService.searchEvents(debouncedEventQuery),
    enabled: debouncedEventQuery.length >= 2 && showEventResults,
    retry: false,
  })

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventSearchRef.current && !eventSearchRef.current.contains(event.target as Node)) {
        setShowEventResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Seleccionar evento
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event)
    setFormData({
      ...formData,
      eventId: event.id,
    })
    setEventSearchQuery(`${event.homeTeam} vs ${event.awayTeam}`)
    setShowEventResults(false)
  }

  // Limpiar selección de evento
  const handleClearEvent = () => {
    setSelectedEvent(null)
    setFormData({
      ...formData,
      eventId: undefined,
    })
    setEventSearchQuery('')
  }

  const registerBetMutation = useMutation({
    mutationFn: (data: RegisterExternalBetData) => externalBetsService.registerBet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalBets'] })
      queryClient.invalidateQueries({ queryKey: ['roiTracking'] })
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] })
      toast.success('Apuesta registrada correctamente')
      handleClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Error al registrar apuesta')
    },
  })

  const handleClose = () => {
    // Reset form
    setFormData({
      platform: '',
      marketType: 'Match Winner',
      selection: '',
      odds: 0,
      stake: 0,
      currency: 'EUR',
      betPlacedAt: new Date().toISOString(),
      platformUrl: '',
      platformBetId: '',
      notes: '',
      tags: [],
    })
    setCustomPlatform('')
    setCustomMarketType('')
    setTagInput('')
    setEventSearchQuery('')
    setSelectedEvent(null)
    setShowEventResults(false)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validación
    if (!formData.platform || !formData.selection || !formData.odds || !formData.stake) {
      toast.error('Por favor completa todos los campos obligatorios')
      return
    }

    if (formData.odds <= 1) {
      toast.error('La cuota debe ser mayor a 1.00')
      return
    }

    if (formData.stake <= 0) {
      toast.error('El stake debe ser mayor a 0')
      return
    }

    // Usar plataforma personalizada si se seleccionó "Otra"
    const finalPlatform = formData.platform === 'Otra' ? customPlatform : formData.platform
    const finalMarketType = formData.marketType === 'Otra' ? customMarketType : formData.marketType

    if (formData.platform === 'Otra' && !customPlatform) {
      toast.error('Por favor ingresa el nombre de la plataforma')
      return
    }

    if (formData.marketType === 'Otra' && !customMarketType) {
      toast.error('Por favor ingresa el tipo de mercado')
      return
    }

    const submitData: RegisterExternalBetData = {
      ...formData,
      platform: finalPlatform,
      marketType: finalMarketType,
      betPlacedAt: new Date(formData.betPlacedAt).toISOString(),
    }

    registerBetMutation.mutate(submitData)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    })
  }

  if (!isOpen) return null

  const potentialWin = formData.stake > 0 && formData.odds > 0 
    ? (formData.stake * formData.odds - formData.stake).toFixed(2)
    : '0.00'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay - usando el mismo patrón que QuickAddBet */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal - usando el mismo patrón de diseño que otros componentes */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl border border-primary-500/20 shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm border-b border-primary-500/20 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white">Registrar Nueva Apuesta</h2>
            <p className="text-sm text-gray-400 mt-1">
              Registra una apuesta realizada en una plataforma externa
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Platform */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Plataforma <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              required
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Selecciona una plataforma</option>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            {formData.platform === 'Otra' && (
              <input
                type="text"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                placeholder="Nombre de la plataforma"
                className="mt-2 w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
            )}
          </div>

          {/* Market Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Tipo de Mercado <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.marketType}
              onChange={(e) => setFormData({ ...formData, marketType: e.target.value })}
              required
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            >
              {MARKET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {formData.marketType === 'Otra' && (
              <input
                type="text"
                value={customMarketType}
                onChange={(e) => setCustomMarketType(e.target.value)}
                placeholder="Tipo de mercado"
                className="mt-2 w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
            )}
          </div>

          {/* Event Search */}
          <div ref={eventSearchRef} className="relative">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Buscar Evento (Opcional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={eventSearchQuery}
                onChange={(e) => {
                  setEventSearchQuery(e.target.value)
                  setShowEventResults(true)
                  if (!e.target.value) {
                    handleClearEvent()
                  }
                }}
                onFocus={() => {
                  if (eventSearchQuery.length >= 2) {
                    setShowEventResults(true)
                  }
                }}
                placeholder="Buscar evento por nombre de equipo..."
                className="w-full px-4 py-3 pl-10 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {selectedEvent && (
                <button
                  type="button"
                  onClick={handleClearEvent}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-dark-700 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Evento seleccionado */}
            {selectedEvent && (
              <div className="mt-2 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {selectedEvent.homeTeam} vs {selectedEvent.awayTeam}
                    </p>
                    {selectedEvent.sport && (
                      <p className="text-xs text-gray-400">{selectedEvent.sport.name}</p>
                    )}
                    {selectedEvent.startTime && (
                      <p className="text-xs text-gray-400">
                        {format(new Date(selectedEvent.startTime), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-xs font-semibold">
                    Vinculado
                  </span>
                </div>
              </div>
            )}

            {/* Resultados de búsqueda */}
            {showEventResults && debouncedEventQuery.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-primary-500/30 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                {searchingEvents ? (
                  <div className="p-4 text-center text-gray-400">
                    <svg className="animate-spin h-5 w-5 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Buscando eventos...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => handleSelectEvent(event)}
                        className="w-full px-4 py-3 text-left hover:bg-dark-700 transition-colors border-b border-dark-700 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {event.homeTeam} vs {event.awayTeam}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {event.sport && (
                                <span className="text-xs text-gray-400">{event.sport.name}</span>
                              )}
                              {event.startTime && (
                                <span className="text-xs text-gray-500">
                                  {format(new Date(event.startTime), 'dd/MM/yyyy HH:mm')}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            event.status === 'LIVE' 
                              ? 'bg-red-500/20 text-red-400'
                              : event.status === 'FINISHED'
                              ? 'bg-gray-500/20 text-gray-400'
                              : 'bg-primary-500/20 text-primary-400'
                          }`}>
                            {event.status === 'LIVE' ? 'EN VIVO' : event.status === 'FINISHED' ? 'FINALIZADO' : 'PROGRAMADO'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No se encontraron eventos
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Selección <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.selection}
              onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
              placeholder="Ej: Home, Over 2.5, Both Teams to Score"
              required
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Odds and Stake */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Cuota <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                value={formData.odds || ''}
                onChange={(e) => setFormData({ ...formData, odds: parseFloat(e.target.value) || 0 })}
                placeholder="2.50"
                required
                className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Stake <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.stake || ''}
                  onChange={(e) => setFormData({ ...formData, stake: parseFloat(e.target.value) || 0 })}
                  placeholder="10.00"
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-dark-700 border border-primary-500/30 rounded text-white text-sm focus:outline-none"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Potential Win Display */}
          {formData.stake > 0 && formData.odds > 0 && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Ganancia Potencial:</span>
                <span className="text-lg font-bold text-primary-300">
                  {formData.currency} {potentialWin}
                </span>
              </div>
            </div>
          )}

          {/* Bet Placed Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Fecha de la Apuesta <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.betPlacedAt ? new Date(formData.betPlacedAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, betPlacedAt: new Date(e.target.value).toISOString() })}
              required
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Platform URL and Bet ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Link al Ticket (Opcional)
              </label>
              <input
                type="url"
                value={formData.platformUrl || ''}
                onChange={(e) => setFormData({ ...formData, platformUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                ID de Apuesta en Plataforma (Opcional)
              </label>
              <input
                type="text"
                value={formData.platformBetId || ''}
                onChange={(e) => setFormData({ ...formData, platformBetId: e.target.value })}
                placeholder="Ej: BET123456"
                className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales sobre esta apuesta..."
              rows={3}
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Tags (Opcional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Agregar tag (Enter para agregar)"
                className="flex-1 px-4 py-2 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
              >
                Agregar
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t border-primary-500/20">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-dark-800 border border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-dark-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={registerBetMutation.isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:from-primary-400 hover:to-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {registerBetMutation.isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Registrar Apuesta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

