/**
 * Referrals Page
 * Dashboard for referral system
 */

import { useState, useEffect } from 'react';
import { referralService, type ReferralStats, type LeaderboardEntry } from '../services/referralService';
import GradientText from '../components/GradientText';

export default function Referrals() {
  // const { user } = useAuthStore();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, leaderboardData] = await Promise.all([
        referralService.getMyReferrals(),
        referralService.getLeaderboard(10),
      ]);
      setStats(statsData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralLink = () => {
    if (!stats?.referralCode) return;

    const referralUrl = referralService.getReferralUrl(stats.referralCode);
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRewardDescription = (stats: ReferralStats) => {
    const rewards = [];
    if (stats.rewards.freeMonths && stats.rewards.freeMonths > 0) {
      rewards.push(`${stats.rewards.freeMonths} mes${stats.rewards.freeMonths > 1 ? 'es' : ''} gratis`);
    }
    if (stats.rewards.premiumAccess) {
      rewards.push('Acceso Premium');
    }
    if (stats.rewards.discount) {
      rewards.push(`${stats.rewards.discount}% de descuento permanente`);
    }
    return rewards.length > 0 ? rewards.join(', ') : 'Aún no has ganado recompensas';
  };

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-12 text-gray-400">Cargando referidos...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-12 text-red-400">Error al cargar datos de referidos</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <GradientText className="text-4xl font-black mb-2">
            Programa de Referidos
          </GradientText>
          <p className="text-gray-400">
            Invita a tus amigos y gana recompensas increíbles
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl p-6 border border-primary-500/30">
            <div className="text-sm text-gray-400 mb-1">Total Referidos</div>
            <div className="text-3xl font-black text-white">{stats.totalReferrals}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/30">
            <div className="text-sm text-gray-400 mb-1">Referidos Activos</div>
            <div className="text-3xl font-black text-white">{stats.activeReferrals}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl p-6 border border-yellow-500/30">
            <div className="text-sm text-gray-400 mb-1">Pendientes</div>
            <div className="text-3xl font-black text-white">{stats.pendingReferrals}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30">
            <div className="text-sm text-gray-400 mb-1">Recompensas</div>
            <div className="text-lg font-bold text-white">{stats.rewardedReferrals}</div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20 mb-8">
          <h2 className="text-2xl font-black text-white mb-4">Tu Código de Referido</h2>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <div className="bg-dark-800 rounded-lg p-4 border border-primary-500/30 mb-2">
                <div className="text-sm text-gray-400 mb-1">Código</div>
                <div className="text-2xl font-black text-primary-400 font-mono">
                  {stats.referralCode}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Comparte este código o el link de abajo con tus amigos
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyReferralLink}
                className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-gradient-to-br from-gold-500/20 to-yellow-600/20 rounded-xl p-8 border border-gold-500/30 mb-8">
          <h2 className="text-2xl font-black text-white mb-4">Tus Recompensas</h2>
          <div className="bg-dark-800/50 rounded-lg p-6 border border-gold-500/30">
            <div className="text-lg text-white mb-2">{getRewardDescription(stats)}</div>
            <div className="text-sm text-gray-400 mt-4">
              <div className="mb-2">🎁 Recompensas disponibles:</div>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>3 referidos activos = 1 mes gratis</li>
                <li>5 referidos activos = Acceso Premium</li>
                <li>10 referidos activos = 50% descuento permanente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20 mb-8">
          <h2 className="text-2xl font-black text-white mb-6">Tus Referidos</h2>
          {stats.referrals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Aún no has referido a nadie. ¡Comparte tu código para empezar!
            </div>
          ) : (
            <div className="space-y-4">
              {stats.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="bg-dark-800 rounded-lg p-4 border border-primary-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">
                        {referral.referredUser.firstName} {referral.referredUser.lastName}
                      </div>
                      <div className="text-sm text-gray-400">{referral.referredUser.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Registrado: {new Date(referral.createdAt).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        referral.status === 'ACTIVE'
                          ? 'bg-green-500/30 text-green-300'
                          : referral.status === 'REWARDED'
                          ? 'bg-purple-500/30 text-purple-300'
                          : 'bg-yellow-500/30 text-yellow-300'
                      }`}>
                        {referral.status === 'ACTIVE' ? 'Activo' : 
                         referral.status === 'REWARDED' ? 'Recompensado' : 'Pendiente'}
                      </div>
                      {referral.rewardGranted && (
                        <div className="text-xs text-gray-400 mt-1">
                          Recompensa: {referral.rewardType}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20">
          <h2 className="text-2xl font-black text-white mb-6">Top Referrers</h2>
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No hay datos aún</div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user.id}
                  className="bg-dark-800 rounded-lg p-4 border border-primary-500/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-500/30 flex items-center justify-center font-black text-white">
                      {entry.rank}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {entry.user.firstName} {entry.user.lastName}
                      </div>
                      <div className="text-sm text-gray-400">{entry.user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-accent-400">
                      {entry.activeReferrals} activos
                    </div>
                    <div className="text-sm text-gray-400">
                      {entry.totalReferrals} total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

