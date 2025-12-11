/**
 * API Client Utility
 * Provides a centralized HTTP client with timeout, retry, and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { logger } from './logger';

interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private defaultTimeout: number = 10000; // 10 seconds
  private defaultRetries: number = 2;
  private defaultRetryDelay: number = 1000; // 1 second

  constructor(options: ApiClientOptions = {}) {
    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout || this.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add request timestamp for logging
        (config as any).requestStartTime = Date.now();
        return config;
      },
      (error) => {
        logger.error('API request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with retry logic
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config as any).requestStartTime;
        logger.debug(`API request completed in ${duration}ms: ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as any;
        
        // Don't retry if retries exhausted or if it's not a retryable error
        if (!config || !this.isRetryableError(error)) {
          return Promise.reject(error);
        }

        // Initialize retry count
        config.retryCount = config.retryCount || 0;
        const maxRetries = config.retries || this.defaultRetries;

        if (config.retryCount >= maxRetries) {
          logger.warn(`API request failed after ${maxRetries} retries: ${error.config?.url}`);
          return Promise.reject(error);
        }

        // Increment retry count
        config.retryCount += 1;

        // Calculate retry delay (exponential backoff)
        const delay = (config.retryDelay || this.defaultRetryDelay) * Math.pow(2, config.retryCount - 1);
        
        logger.warn(`Retrying API request (${config.retryCount}/${maxRetries}) after ${delay}ms: ${error.config?.url}`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the request
        return this.client(config);
      }
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      // Network errors are retryable
      return true;
    }

    const status = error.response.status;
    
    // Retry on 5xx errors (server errors)
    if (status >= 500 && status < 600) {
      return true;
    }

    // Retry on 429 (rate limit)
    if (status === 429) {
      return true;
    }

    // Retry on 408 (timeout)
    if (status === 408) {
      return true;
    }

    // Don't retry on 4xx errors (client errors)
    return false;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Get the underlying axios instance
   */
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instances for common APIs
export const theOddsApiClient = new ApiClient({
  timeout: 15000, // 15 seconds for The Odds API
  retries: 2,
});

export const apiFootballClient = new ApiClient({
  timeout: 15000, // 15 seconds for API-Football
  retries: 2,
});

export const defaultApiClient = new ApiClient({
  timeout: 10000, // 10 seconds default
  retries: 2,
});

// Export class for custom instances
export { ApiClient };

