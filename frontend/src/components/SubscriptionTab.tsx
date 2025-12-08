import { useState, useEffect } from 'react';
import { paymentsService, type Subscription } from '../services/paymentsService';
// import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionTab() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userTier, setUserTier] = useState<'FREE' | 'BASIC' | 'PREMIUM' | 'PRO'>('FREE');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await paymentsService.getSubscription();
      setSubscription(data.subscription);
      setUserTier(data.userTier);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading('manage');
    try {
      const { url } = await paymentsService.createPortalSession();
      window.location.href = url;
    } catch (error: any) {
      console.error('Error opening portal:', error);
      alert('Error al abrir el portal de gestión. Por favor intenta de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que quieres cancelar tu suscripción? Seguirás teniendo acceso hasta el final del período de facturación.')) {
      return;
    }

    setActionLoading('cancel');
    try {
      await paymentsService.cancelSubscription();
      alert('Suscripción cancelada. Tendrás acceso hasta el final del período actual.');
      loadSubscription();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      alert('Error al cancelar la suscripción. Por favor intenta de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading('reactivate');
    try {
      await paymentsService.reactivateSubscription();
      alert('Suscripción reactivada.');
      loadSubscription();
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      alert('Error al reactivar la suscripción. Por favor intenta de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  const getTierName = (tier: string) => {
    const names: Record<string, string> = {
      FREE: 'Básico',
      BASIC: 'Básico',
      PREMIUM: 'Premium',
      PRO: 'Pro',
    };
    return names[tier] || tier;
  };

  const getTierPrice = (tier: string) => {
    const prices: Record<string, string> = {
      FREE: 'Gratis',
      BASIC: '€19/mes',
      PREMIUM: '€79/mes',
      PRO: '€29/mes',
    };
    return prices[tier] || '';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20">
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const isFree = userTier === 'FREE';
  const isActive = subscription?.status === 'ACTIVE';
  const isCancelled = subscription?.cancelAtPeriodEnd;

  return (
    <div className="bg-gradient-to-br from-dark-900 to-dark-950 rounded-xl p-8 border border-primary-500/20">
      <h2 className="text-2xl font-black text-white mb-6">Suscripción</h2>
      <div className="space-y-6">
        {/* Current Plan */}
        <div className="bg-primary-500/10 rounded-xl p-6 border border-primary-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-white mb-1">
                Plan {getTierName(userTier)}
              </h3>
              <p className="text-gray-400">{getTierPrice(userTier)}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-lg font-semibold ${
                isActive
                  ? 'bg-accent-500/30 text-accent-300'
                  : isCancelled
                  ? 'bg-yellow-500/30 text-yellow-300'
                  : 'bg-primary-500/30 text-primary-300'
              }`}
            >
              {isActive ? 'Activo' : isCancelled ? 'Cancelará al final del período' : 'Inactivo'}
            </span>
          </div>

          {subscription && subscription.currentPeriodEnd && (
            <p className="text-gray-300 mb-4">
              {isCancelled
                ? `Acceso hasta: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : `Renovación: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
            </p>
          )}

          {isFree ? (
            <div>
              <p className="text-gray-300 mb-4">
                Actualmente estás en el plan gratuito. Actualiza para desbloquear todas las funcionalidades.
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-bold transition-colors"
              >
                Actualizar a Pro
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleManageSubscription}
                disabled={actionLoading !== null}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                {actionLoading === 'manage' ? 'Cargando...' : 'Gestionar Suscripción'}
              </button>
              {isCancelled ? (
                <button
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading !== null}
                  className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'reactivate' ? 'Procesando...' : 'Reactivar'}
                </button>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading !== null}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'cancel' ? 'Procesando...' : 'Cancelar Suscripción'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Historial de Pagos</h3>
          {subscription && (subscription as any).payments && (subscription as any).payments.length > 0 ? (
            <div className="space-y-2">
              {(subscription as any).payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-primary-500/20"
                >
                  <div>
                    <p className="text-white font-semibold">{payment.description || 'Suscripción'}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">
                      {payment.amount} {payment.currency}
                    </p>
                    <p
                      className={`text-sm ${
                        payment.status === 'COMPLETED'
                          ? 'text-green-400'
                          : payment.status === 'FAILED'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {payment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No hay pagos registrados</div>
          )}
        </div>
      </div>
    </div>
  );
}

