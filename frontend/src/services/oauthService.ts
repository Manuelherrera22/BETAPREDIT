/**
 * OAuth Service
 * Handles OAuth authentication flows
 */

import api from './api';

class OAuthService {
  /**
   * Get Google OAuth URL
   */
  async getGoogleAuthUrl(): Promise<string> {
    const response = await api.get('/oauth/google');
    return response.data.data.authUrl;
  }

  /**
   * Initiate Google OAuth flow
   */
  async initiateGoogle(): Promise<void> {
    const authUrl = await this.getGoogleAuthUrl();
    window.location.href = authUrl;
  }
}

export const oauthService = new OAuthService();

