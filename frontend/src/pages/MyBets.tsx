import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { externalBetsService, type ExternalBet } from '../services/externalBetsService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import RegisterBetForm from '../components/RegisterBetForm'
import ImportBetsModal from '../components/ImportBetsModal'
import { exportToCSV } from '../utils/csvExport'
import EmptyState from '../components/EmptyState'
import SkeletonLoader from '../components/SkeletonLoader'
// import { VirtualizedList } from '../components/VirtualizedList' // Not used yet

export default function MyBets() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [resolvingBetId, setResolvingBetId] = useState<string | null>(null)
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  
  // Filtros
  const [filters, setFilters] = useState({
    platform: 'all',
    status: 'all',
    dateRange: 'all',
    search: '',
  })
  
  // Detectar query param para abrir formulario automáticamente (desde QuickAddBet)
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'add') {
      setIsRegisterFormOpen(true)
      // Limpiar query param
      setSearchParams({})
    } else if (action === 'import') {
      setIsImportModalOpen(true)
      // Limpiar query param
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])
  
  // Calcular fechas para filtro
  const getDateRange = (range: string) => {
    const now = new Date()
    switch (range) {
      case 'week':
        return {
          startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString(),
        }
      case 'month':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          endDate: now.toISOString(),
        }
      case 'year':
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
          endDate: now.toISOString(),
        }
      default:
        return {}
    }
  }
  
  // Preparar filtros para API
  const apiFilters = {
    limit: 100,
    ...(filters.platform !== 'all' && { platform: filters.platform }),
    ...(filters.status !== 'all' && { status: filters.status }),
    ...getDateRange(filters.dateRange),
  }
  
  const { data: bets, isLoading, error } = useQuery({
    queryKey: ['externalBets', apiFilters],
    queryFn: async () => {
      try {
        const result = await externalBetsService.getMyBets(apiFilters);
        return Array.isArray(result) ? result : [];
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error('Error loading bets:', err);
        }
        toast.error(`Error al cargar apuestas: ${err.message || 'Error desconocido'}`);
        return [];
      }
    },
    refetchInterval: 30000,
    retry: 2,
    staleTime: 30000, // 30 seconds
  })
  
  // Filtrar por búsqueda de texto (client-side) - Memoizado
  const filteredBets = useMemo(() => {
    if (!bets) return [];
    return bets.filter((bet: ExternalBet) => {
      if (!filters.search) return true
      
      const searchLower = filters.search.toLowerCase()
      const eventName = bet.event 
        ? `${bet.event.homeTeam} ${bet.event.awayTeam}`.toLowerCase()
        : ''
      const selection = bet.selection.toLowerCase()
      const platform = bet.platform.toLowerCase()
      
      return (
        eventName.includes(searchLower) ||
        selection.includes(searchLower) ||
        platform.includes(searchLower)
      )
    })
  }, [bets, filters.search])

  // Mutation para resolver apuesta
  const resolveBetMutation = useMutation({
    mutationFn: ({ betId, result, actualWin }: { betId: string; result: 'WON' | 'LOST' | 'VOID'; actualWin?: number }) =>
      externalBetsService.resolveBet(betId, result, actualWin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['externalBets'] })
      queryClient.invalidateQueries({ queryKey: ['roiTracking'] })
      queryClient.invalidateQueries({ queryKey: ['userStatistics'] })
      toast.success('Apuesta resuelta correctamente')
      setResolvingBetId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Error al resolver apuesta')
      setResolvingBetId(null)
    },
  })

  const handleResolveBet = (betId: string, result: 'WON' | 'LOST' | 'VOID', actualWin?: number) => {
    setResolvingBetId(betId)
    resolveBetMutation.mutate({ betId, result, actualWin })
  }

  // Exportar apuestas a CSV
  const handleExportBets = () => {
    if (!filteredBets || filteredBets.length === 0) {
      toast.error('No hay apuestas para exportar')
      return
    }

    try {
      const csvData = filteredBets.map((bet) => ({
        fecha: format(new Date(bet.betPlacedAt), 'dd/MM/yyyy HH:mm'),
        evento: bet.event ? `${bet.event.homeTeam} vs ${bet.event.awayTeam}` : bet.selection,
        seleccion: bet.selection,
        mercado: bet.marketType,
        plataforma: bet.platform,
        cuota: bet.odds.toFixed(2),
        stake: bet.stake.toFixed(2),
        moneda: bet.currency,
        ganancia_potencial: ((bet.stake * bet.odds) - bet.stake).toFixed(2),
        estado: getStatusLabel(bet.status),
        resultado: bet.result ? getStatusLabel(bet.result) : '',
        ganancia_real: bet.actualWin ? (bet.actualWin - bet.stake).toFixed(2) : '',
        fecha_resolucion: bet.settledAt ? format(new Date(bet.settledAt), 'dd/MM/yyyy HH:mm') : '',
        notas: bet.notes || '',
        tags: bet.tags.join('; '),
        link: bet.platformUrl || '',
      }))

      exportToCSV(csvData, [
        { key: 'fecha', label: 'Fecha' },
        { key: 'evento', label: 'Evento' },
        { key: 'seleccion', label: 'Selección' },
        { key: 'mercado', label: 'Mercado' },
        { key: 'plataforma', label: 'Plataforma' },
        { key: 'cuota', label: 'Cuota' },
        { key: 'stake', label: 'Stake' },
        { key: 'moneda', label: 'Moneda' },
        { key: 'ganancia_potencial', label: 'Ganancia Potencial' },
        { key: 'estado', label: 'Estado' },
        { key: 'resultado', label: 'Resultado' },
        { key: 'ganancia_real', label: 'Ganancia Real' },
        { key: 'fecha_resolucion', label: 'Fecha Resolución' },
        { key: 'notas', label: 'Notas' },
        { key: 'tags', label: 'Tags' },
        { key: 'link', label: 'Link' },
      ], `apuestas_${format(new Date(), 'yyyy-MM-dd')}.csv`)

      toast.success(`Exportadas ${filteredBets.length} apuestas a CSV`)
    } catch (error) {
      console.error('Error exportando apuestas:', error)
      toast.error('Error al exportar apuestas')
    }
  }

  if (isLoading && !bets) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6">
          <SkeletonLoader type="text" />
        </div>
        <SkeletonLoader type="table" />
      </div>
    );
  }

  // Show error state if there's an error and no bets
  if (error && !bets) {
    return (
      <div className="px-4 py-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
          <p className="text-red-400 mb-2 font-semibold">Error al cargar apuestas</p>
          <p className="text-sm text-gray-400 mb-4">Por favor, intenta recargar la página</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON':
        return 'bg-green-500/20 border-green-500/40 text-green-400'
      case 'LOST':
        return 'bg-red-500/20 border-red-500/40 text-red-400'
      case 'PENDING':
        return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
      case 'VOID':
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400'
      case 'CANCELLED':
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400'
      default:
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'WON': return 'Ganada'
      case 'LOST': return 'Perdida'
      case 'PENDING': return 'Pendiente'
      case 'VOID': return 'Anulada'
      case 'CANCELLED': return 'Cancelada'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2">Mis Apuestas</h1>
            <p className="text-sm sm:text-base text-gray-400">Registra y gestiona tus apuestas externas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {filteredBets && filteredBets.length > 0 && (
            <button
              onClick={handleExportBets}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:from-accent-400 hover:to-accent-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20 w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
          )}
          <button
            onClick={() => setIsRegisterFormOpen(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:from-primary-400 hover:to-primary-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Apuesta
          </button>
        </div>
      </div>

        {/* Filtros */}
        <div className="mb-6 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Buscar por evento, selección, plataforma..."
                className="w-full px-4 py-3 pl-10 bg-dark-800 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Filtro por Plataforma */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Plataforma
            </label>
            <select
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">Todas</option>
              <option value="Bet365">Bet365</option>
              <option value="Betfair">Betfair</option>
              <option value="Pinnacle">Pinnacle</option>
              <option value="William Hill">William Hill</option>
              <option value="DraftKings">DraftKings</option>
              <option value="FanDuel">FanDuel</option>
              <option value="BetMGM">BetMGM</option>
              <option value="Caesars">Caesars</option>
              <option value="Unibet">Unibet</option>
              <option value="888sport">888sport</option>
              <option value="Betway">Betway</option>
            </select>
          </div>
          
          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-3 bg-dark-800 border border-primary-500/30 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="WON">Ganada</option>
              <option value="LOST">Perdida</option>
              <option value="VOID">Anulada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
        </div>
        
        {/* Filtro por Fecha */}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Período
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Todas' },
              { value: 'week', label: 'Última Semana' },
              { value: 'month', label: 'Este Mes' },
              { value: 'year', label: 'Este Año' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilters({ ...filters, dateRange: option.value })}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filters.dateRange === option.value
                    ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                    : 'bg-dark-800 border border-gray-600 text-gray-300 hover:border-primary-500/40'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Contador de resultados */}
        {bets && (
          <div className="mt-4 pt-4 border-t border-primary-500/20">
            <p className="text-sm text-gray-400">
              Mostrando <span className="text-white font-semibold">{filteredBets.length}</span> de{' '}
              <span className="text-white font-semibold">{bets.length}</span> apuestas
              {filters.platform !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all' || filters.search
                ? ' (filtradas)'
                : ''}
            </p>
          </div>
        )}
      </div>

      {filteredBets && filteredBets.length > 0 ? (
        <div className="space-y-4">
          {filteredBets.map((bet: ExternalBet) => {
            const potentialWin = bet.stake * bet.odds - bet.stake
            const isResolving = resolvingBetId === bet.id
            
            return (
              <div key={bet.id} className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-xl p-4 sm:p-6 border-2 border-slate-700/50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {bet.valueBetAlert && (
                        <span className="px-2 py-1 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-full text-xs font-bold">
                          Value Bet +{bet.valueBetAlert.valuePercentage.toFixed(1)}%
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(bet.status)}`}>
                        {getStatusLabel(bet.status)}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white mb-1 line-clamp-2">
                      {bet.event 
                        ? `${bet.event.homeTeam} vs ${bet.event.awayTeam}`
                        : bet.selection}
                    </h3>
                    <p className="text-gray-400 mb-1">
                      {bet.selection} @ {bet.odds.toFixed(2)} en {bet.platform}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(bet.betPlacedAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-primary-500/20">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Stake</p>
                    <p className="text-white font-bold">€{bet.stake.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Ganancia Potencial</p>
                    <p className="text-white font-bold">
                      €{potentialWin.toFixed(2)}
                    </p>
                  </div>
                  {bet.status === 'WON' && bet.actualWin && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Ganancia Real</p>
                      <p className="text-green-400 font-bold">
                        €{(bet.actualWin - bet.stake).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {bet.status === 'LOST' && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Pérdida</p>
                      <p className="text-red-400 font-bold">
                        -€{bet.stake.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón para resolver si está pendiente */}
                {bet.status === 'PENDING' && (
                  <div className="mt-4 pt-4 border-t border-primary-500/20">
                    <p className="text-sm text-gray-400 mb-3">¿Ya se resolvió esta apuesta?</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const actualWin = bet.stake * bet.odds
                          handleResolveBet(bet.id, 'WON', actualWin)
                        }}
                        disabled={isResolving}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg text-xs sm:text-sm font-semibold hover:bg-green-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isResolving && resolvingBetId === bet.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Resolviendo...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Marcar como Ganada
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleResolveBet(bet.id, 'LOST')}
                        disabled={isResolving}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isResolving && resolvingBetId === bet.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Resolviendo...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Marcar como Perdida
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleResolveBet(bet.id, 'VOID')}
                        disabled={isResolving}
                        className="px-4 py-2 bg-gray-500/20 border border-gray-500/40 text-gray-300 rounded-lg font-semibold hover:bg-gray-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isResolving && resolvingBetId === bet.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Resolviendo...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Anular
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : bets && bets.length > 0 ? (
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20 text-center">
          <EmptyState
            icon="bets"
            title="No hay apuestas que coincidan con los filtros"
            message="Intenta ajustar los filtros para ver más resultados o registra una nueva apuesta."
            actionLabel="Registrar Apuesta"
            actionTo="/my-bets?action=add"
          />
          <button
            onClick={() => setFilters({ platform: 'all', status: 'all', dateRange: 'all', search: '' })}
            className="px-4 py-2 bg-primary-500/20 border border-primary-500/40 text-primary-300 rounded-lg hover:bg-primary-500/30 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20 text-center">
          <p className="text-gray-400 mb-2">No tienes apuestas registradas aún</p>
          <p className="text-sm text-gray-500">
            Registra tus apuestas para trackear tu ROI y ver tu progreso
          </p>
        </div>
      )}

      {/* Register Bet Form Modal */}
      <RegisterBetForm
        isOpen={isRegisterFormOpen}
        onClose={() => {
          setIsRegisterFormOpen(false)
          // Limpiar query params si existen
          if (searchParams.get('action')) {
            navigate('/my-bets', { replace: true })
          }
        }}
      />

      {/* Import Bets Modal */}
      <ImportBetsModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false)
          // Limpiar query params si existen
          if (searchParams.get('action')) {
            navigate('/my-bets', { replace: true })
          }
        }}
      />
      </div>
    </div>
  )
}

