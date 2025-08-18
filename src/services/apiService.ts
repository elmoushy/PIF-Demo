// API Service with automatic token refresh and authentication
import authService from './authService'

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000'

interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  requiresAuth?: boolean
}

class ApiService {
  private static instance: ApiService
  private refreshPromise: Promise<any> | null = null

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  private async makeRequest<T>(url: string, config: ApiRequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      requiresAuth = true
    } = config

    const fullUrl = `${BASE_URL}${url}`
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Add authorization header if required and available
    if (requiresAuth) {
      const accessToken = sessionStorage.getItem('access_token')
      if (accessToken) {
        defaultHeaders.Authorization = `Bearer ${accessToken}`
      }
    }

    const requestConfig: RequestInit = {
      method,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    }

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestConfig.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(fullUrl, requestConfig)
      
      let data: any
      try {
        data = await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        // Handle 401 Unauthorized errors with token refresh
        if (response.status === 401 && requiresAuth) {
          return this.handleUnauthorized<T>(url, config)
        }

        // Handle other API errors
        const error = new Error(data.detail || `HTTP ${response.status}`) as Error & { response?: any; status?: number }
        error.response = data
        error.status = response.status
        throw error
      }

      return data
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  private async handleUnauthorized<T>(url: string, config: ApiRequestConfig): Promise<T> {
    // Prevent multiple simultaneous refresh attempts
    if (!this.refreshPromise) {
      this.refreshPromise = this.attemptTokenRefresh()
    }

    try {
      await this.refreshPromise
      this.refreshPromise = null
      
      // Retry the original request with new token
      return this.makeRequest<T>(url, config)
    } catch {
      this.refreshPromise = null
      
      // If refresh fails, clear tokens and throw session ended error
      authService.clearLocalData()
      
      // Emit a global event for session ended
      window.dispatchEvent(new CustomEvent('session-ended'))
      
      throw new Error('Session ended')
    }
  }

  private async attemptTokenRefresh(): Promise<void> {
    const refreshToken = sessionStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      await authService.refreshToken()
      // Token refresh was successful, new tokens are already stored
      console.log('Token refreshed successfully')
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  // Public methods for different HTTP methods
  async get<T>(url: string, requiresAuth = true): Promise<T> {
    return this.makeRequest<T>(url, { method: 'GET', requiresAuth })
  }

  async post<T>(url: string, data?: any, requiresAuth = true): Promise<T> {
    return this.makeRequest<T>(url, { method: 'POST', body: data, requiresAuth })
  }

  async put<T>(url: string, data?: any, requiresAuth = true): Promise<T> {
    return this.makeRequest<T>(url, { method: 'PUT', body: data, requiresAuth })
  }

  async patch<T>(url: string, data?: any, requiresAuth = true): Promise<T> {
    return this.makeRequest<T>(url, { method: 'PATCH', body: data, requiresAuth })
  }

  async delete<T>(url: string, requiresAuth = true): Promise<T> {
    return this.makeRequest<T>(url, { method: 'DELETE', requiresAuth })
  }
}

export const apiService = ApiService.getInstance()
export default apiService
