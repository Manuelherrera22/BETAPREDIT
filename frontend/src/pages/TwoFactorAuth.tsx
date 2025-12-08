/**
 * Two-Factor Authentication Page
 * Setup and manage 2FA
 */

import { useState } from 'react';
import { twoFactorService } from '../services/2faService';
import GradientText from '../components/GradientText';
import toast from 'react-hot-toast';

export default function TwoFactorAuth() {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [enabled, setEnabled] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await twoFactorService.generate();
      setQrCode(result.qrCode);
      setSecret(result.secret);
      toast.success('Código QR generado. Escanea con tu app de autenticación');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Error al generar código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token || token.length !== 6) {
      toast.error('Ingresa un código de 6 dígitos');
      return;
    }

    if (!secret) {
      toast.error('Primero genera un código QR');
      return;
    }

    setLoading(true);
    try {
      await twoFactorService.verify(token, secret);
      setEnabled(true);
      setQrCode(null);
      setSecret(null);
      setToken('');
      toast.success('2FA habilitado correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('¿Estás seguro de deshabilitar 2FA? Esto reduce la seguridad de tu cuenta.')) {
      return;
    }

    setLoading(true);
    try {
      await twoFactorService.disable();
      setEnabled(false);
      toast.success('2FA deshabilitado');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Error al deshabilitar 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <GradientText className="text-4xl font-black mb-2">
          Autenticación de Dos Factores
        </GradientText>
        <p className="text-gray-400 mb-8">
          Añade una capa extra de seguridad a tu cuenta
        </p>

        <div className="bg-dark-800 rounded-xl p-8 border border-primary-500/20">
          {!enabled ? (
            <>
              <h3 className="text-xl font-bold text-white mb-4">Habilitar 2FA</h3>
              
              {!qrCode ? (
                <div>
                  <p className="text-gray-400 mb-6">
                    La autenticación de dos factores añade una capa extra de seguridad. 
                    Necesitarás un código de tu app de autenticación cada vez que inicies sesión.
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Generando...' : 'Generar Código QR'}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 mb-4">
                    Escanea este código QR con tu app de autenticación (Google Authenticator, Authy, etc.)
                  </p>
                  <div className="mb-6 flex justify-center">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64 bg-white p-4 rounded-lg" />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ingresa el código de 6 dígitos
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-2xl text-center"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleVerify}
                      disabled={loading || token.length !== 6}
                      className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      Verificar y Habilitar
                    </button>
                    <button
                      onClick={() => {
                        setQrCode(null);
                        setSecret(null);
                        setToken('');
                      }}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-green-400 font-semibold">2FA Habilitado</p>
                    <p className="text-gray-400 text-sm">Tu cuenta está protegida con autenticación de dos factores</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDisable}
                disabled={loading}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Deshabilitando...' : 'Deshabilitar 2FA'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

