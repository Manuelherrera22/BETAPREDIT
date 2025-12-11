/**
 * 2FA Service (Frontend)
 */

import api from './api';

export interface Generate2FAResponse {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

class TwoFactorService {
  async generate(): Promise<Generate2FAResponse> {
    const response = await api.get('/2fa/generate');
    return response.data.data;
  }

  async verify(token: string, secret: string): Promise<void> {
    await api.post('/2fa/verify', { token, secret });
  }

  async disable(): Promise<void> {
    await api.post('/2fa/disable');
  }
}

export const twoFactorService = new TwoFactorService();



