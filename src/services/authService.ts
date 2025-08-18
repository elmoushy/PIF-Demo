// Production Version - Backend Integration
import { httpPost } from './httpClient'

// Types
export interface LoginRequest {
  username_or_email: string
  password: string
}

export interface RegisterRequest {
  name: string
  arabic_name?: string
  cr_number?: string
  moi_number?: string
  country_of_incorporation?: string
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
}

export interface AuthResponse {
  tokens: {
    access: string
    refresh: string
  }
  user?: User
}

export interface TokenRefreshResponse {
  tokens: {
    access: string
    refresh: string
  }
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'Administrator' | 'Company' | 'SuperAdmin'
  status: 'Pending' | 'Accepted' | 'Rejected'
  date_joined: string
  is_active?: boolean
  full_name?: string
  company?: {
    id: number
    name: string
    arabic_name?: string
    cr_number?: string
    moi_number?: string
    country_of_incorporation?: string
    is_active: boolean
  }
}

export interface ApiError {
  detail?: string
  username_or_email?: string[]
  password?: string[]
  non_field_errors?: string[]
  name?: string[]
  username?: string[]
  email?: string[]
  password_confirm?: string[]
  first_name?: string[]
  last_name?: string[]
  refresh?: string[]
  [key: string]: any
}

// Token Management
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token'
  private static REFRESH_TOKEN_KEY = 'refresh_token'
  private static USER_KEY = 'user_data'

  static setTokens(access: string, refresh: string): void {
    // Store access token in sessionStorage for security
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, access)
    // Store refresh token in sessionStorage as well per requirements
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refresh)
  }

  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  static getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  static setUser(user: User): void {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  static getUser(): User | null {
    const userData = sessionStorage.getItem(this.USER_KEY)
    return userData ? JSON.parse(userData) : null
  }

  static clearAll(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(this.USER_KEY)
  }

  static hasValidSession(): boolean {
    const accessToken = this.getAccessToken()
    const refreshToken = this.getRefreshToken()
    return !!(accessToken || refreshToken)
  }
}

// Main Auth Service
class AuthService {
  private static instance: AuthService
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Helper method to format API errors
  private formatApiError(error: any): string {
    if (error.response) {
      const { response } = error
      
      // Handle validation errors
      if (response.non_field_errors) {
        return response.non_field_errors[0]
      }
      
      // Handle field-specific errors
      const fieldErrors = []
      for (const [field, messages] of Object.entries(response)) {
        if (Array.isArray(messages) && field !== 'non_field_errors') {
          fieldErrors.push(`${field}: ${(messages as string[])[0]}`)
        }
      }
      
      if (fieldErrors.length > 0) {
        return fieldErrors.join(', ')
      }
      
      // Handle detail errors
      if (response.detail) {
        return response.detail
      }
    }
    
    return error.message || 'An unexpected error occurred'
  }

  // JWT token decoder helper (basic)
  private decodeJwtUser(accessToken: string): Partial<User> | null {
    try {
      const base64Url = accessToken.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      
      const payload = JSON.parse(jsonPayload)
      
      // Extract user info from JWT payload if available
      return {
        id: payload.user_id || payload.sub,
        username: payload.username,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role: payload.role,
        status: payload.status,
        is_active: payload.is_active
      }
    } catch {
      return null
    }
  }

  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await httpPost<AuthResponse>('/api/auth/login/', credentials)
      
      console.log('AuthService login response:', response)
      
      if (response.tokens) {
        TokenManager.setTokens(response.tokens.access, response.tokens.refresh)
        
        // Try to get user info from response first, then from JWT token
        let user = response.user
        if (!user && response.tokens.access) {
          const decodedUser = this.decodeJwtUser(response.tokens.access)
          if (decodedUser && decodedUser.id) {
            user = decodedUser as User
          }
        }
        
        if (user) {
          // For SuperAdmin users, ensure they have accepted status if not provided
          if (user.role === 'SuperAdmin' && !user.status) {
            user = { ...user, status: 'Accepted' as const, is_active: true }
          }
          
          console.log('AuthService storing user:', user)
          TokenManager.setUser(user)
          return { tokens: response.tokens, user }
        }
      }
      
      throw new Error('Invalid response from server')
    } catch (error: any) {
      throw new Error(this.formatApiError(error))
    }
  }

  // Register
  async register(userData: RegisterRequest): Promise<User> {
    try {
      const response = await httpPost<AuthResponse>('/api/auth/register/', userData)
      
      if (response.tokens) {
        TokenManager.setTokens(response.tokens.access, response.tokens.refresh)
        
        // Try to get user info from response first, then from JWT token
        let user = response.user
        if (!user && response.tokens.access) {
          const decodedUser = this.decodeJwtUser(response.tokens.access)
          if (decodedUser && decodedUser.id) {
            user = decodedUser as User
          }
        }
        
        if (user) {
          TokenManager.setUser(user)
          return user
        }
      }
      
      throw new Error('Registration completed but user data is not available')
    } catch (error: any) {
      throw new Error(this.formatApiError(error))
    }
  }

  // Logout
  async logout(callEndpoint: boolean = true): Promise<void> {
    try {
      if (callEndpoint) {
        const refreshToken = TokenManager.getRefreshToken()
        const accessToken = TokenManager.getAccessToken()
        if (refreshToken && accessToken) {
          await httpPost('/api/auth/logout/', { refresh: refreshToken }, {
            'Authorization': `Bearer ${accessToken}`
          })
        }
      }
    } catch {
      console.warn('Logout request failed')
    } finally {
      TokenManager.clearAll()
    }
  }

  // Clear local data
  clearLocalData(): void {
    TokenManager.clearAll()
  }

  // Update user profile (if supported by backend)
  async updateProfile(updates: Partial<Pick<User, 'first_name' | 'last_name' | 'email'>>): Promise<User> {
    try {
      const accessToken = TokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available')
      }

      const user = await httpPost<User>('/api/auth/profile/update/', updates, {
        'Authorization': `Bearer ${accessToken}`
      })
      TokenManager.setUser(user)
      return user
    } catch (error: any) {
      throw new Error(this.formatApiError(error))
    }
  }

  // Change password (if supported by backend)
  async changePassword(currentPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> {
    try {
      const accessToken = TokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available')
      }

      await httpPost('/api/auth/password/change/', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm
      }, {
        'Authorization': `Bearer ${accessToken}`
      })
    } catch (error: any) {
      throw new Error(this.formatApiError(error))
    }
  }

  // Check authentication status
  isAuthenticated(): boolean {
    const hasValidSession = TokenManager.hasValidSession()
    console.log('AuthService.isAuthenticated() =', hasValidSession)
    console.log('Access token exists:', !!TokenManager.getAccessToken())
    console.log('Refresh token exists:', !!TokenManager.getRefreshToken())
    return hasValidSession
  }

  // Get current user
  getCurrentUser(): User | null {
    const user = TokenManager.getUser()
    console.log('AuthService.getCurrentUser() =', user)
    return user
  }

  // Manual token refresh
  async refreshToken(): Promise<TokenRefreshResponse> {
    const refreshToken = TokenManager.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await httpPost<TokenRefreshResponse>('/api/auth/token/refresh/', {
        refresh: refreshToken
      })
      
      if (response.tokens) {
        // Store new tokens
        TokenManager.setTokens(response.tokens.access, response.tokens.refresh)
        return response
      }
      
      throw new Error('Invalid refresh response')
    } catch (error: any) {
      // If refresh fails, clear all tokens
      TokenManager.clearAll()
      
      if (error.message.includes('401') || error.response?.code === 'token_not_valid') {
        throw new Error('Session ended')
      }
      
      throw new Error(this.formatApiError(error))
    }
  }
}

// Password validation utility
export class PasswordValidator {
  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!password) {
      errors.push('Password is required')
      return { isValid: false, errors }
    }

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()
export default authService
