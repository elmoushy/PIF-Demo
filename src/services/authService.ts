// DEMO VERSION - No backend dependencies
// Types
export interface LoginRequest {
  username_or_email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'Administrator' | 'Company'
  status: 'Pending' | 'Accepted' | 'Rejected'
  date_joined: string
  is_active?: boolean
}

export interface TokenRefreshResponse {
  access: string
  refresh?: string
}

export interface ApiError {
  error?: string
  detail?: string
  [key: string]: any
}

// Demo credentials
// const DEMO_CREDENTIALS = {
//   username: 'PIF_SubmitIQ',
//   password: 'PIF_SubmitIQ123'
// }

// Demo user data
// const DEMO_USER: User = {
//   id: 1,
//   username: 'PIF_SubmitIQ',
//   email: 'demo@pif-submitiq.com',
//   first_name: 'PIF',
//   last_name: 'SubmitIQ',
//   role: 'Administrator',
//   status: 'Accepted',
//   date_joined: new Date().toISOString(),
//   is_active: true
// }

// Token Management (Demo Version)
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token'
  private static REFRESH_TOKEN_KEY = 'refresh_token'
  private static USER_KEY = 'user_data'
  private static TOKEN_EXPIRY_KEY = 'token_expiry'

  static setTokens(access: string, refresh: string): void {
    // Store demo tokens
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, access)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh)
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, (Date.now() + 24 * 60 * 60 * 1000).toString()) // 24 hours
  }

  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  static isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY)
    if (!expiryTime) return true
    return Date.now() > parseInt(expiryTime)
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  static getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY)
    return userData ? JSON.parse(userData) : null
  }

  static clearAll(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY)
  }

  static hasValidSession(): boolean {
    const accessToken = this.getAccessToken()
    const refreshToken = this.getRefreshToken()
    return !!(accessToken || refreshToken) && !this.isTokenExpired()
  }
}

// Main Auth Service (Demo Version)
class AuthService {
  // Demo credentials
  private DEMO_CREDENTIALS = [
    {
      username: 'PIF_SubmitIQ',
      password: 'PIF_SubmitIQ123'
    },
    {
      username: 'Company',
      password: 'Company123'
    }
  ]

  // Demo user data
  private DEMO_USERS: User[] = [
    {
      id: 1,
      username: 'PIF_SubmitIQ',
      email: 'demo@pif-submitiq.com',
      first_name: 'PIF',
      last_name: 'SubmitIQ',
      role: 'Administrator',
      status: 'Accepted',
      date_joined: new Date().toISOString(),
      is_active: true
    },
    {
      id: 2,
      username: 'Company',
      email: 'company@example.com',
      first_name: 'Company',
      last_name: 'User',
      role: 'Company',
      status: 'Accepted',
      date_joined: new Date().toISOString(),
      is_active: true
    }
  ]

  // Demo delay to simulate network request
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Login (Demo)
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    await this.delay(800) // Simulate network delay

    // Debug logging for credentials
    console.log('Demo Login Attempt:', {
      provided: {
        username_or_email: credentials.username_or_email,
        password: credentials.password
      },
      expected: this.DEMO_CREDENTIALS
    })

    // Find matching user credentials
    const matchingCredential = this.DEMO_CREDENTIALS.find(cred => 
      cred.username === credentials.username_or_email && 
      cred.password === credentials.password
    )
    
    if (matchingCredential) {
      // Find the corresponding user data
      const matchingUser = this.DEMO_USERS.find(user => 
        user.username === matchingCredential.username
      )
      
      if (!matchingUser) {
        throw new Error('User data not found')
      }

      // Generate demo tokens
      const access = 'demo_access_token_' + Date.now()
      const refresh = 'demo_refresh_token_' + Date.now()

      // Store tokens and user data
      TokenManager.setTokens(access, refresh)
      TokenManager.setUser(matchingUser)

      console.log('Demo login successful for user:', matchingUser.username)

      return {
        access,
        refresh,
        user: matchingUser
      }
    } else {
      const validCredentials = this.DEMO_CREDENTIALS.map(cred => 
        `Username: "${cred.username}" Password: "${cred.password}"`
      ).join(' OR ')
      const errorMessage = `Invalid credentials. Valid credentials: ${validCredentials}`
      console.error('Demo login failed:', errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Register (Demo - not functional)
  async register(_userData: RegisterRequest): Promise<User> {
    await this.delay(800)
    throw new Error('Registration is not available in demo mode. Please use the demo credentials to login.')
  }

  // Logout (Demo)
  async logout(_callEndpoint: boolean = true): Promise<void> {
    await this.delay(300)
    TokenManager.clearAll()
  }

  // Clear local data
  clearLocalData(): void {
    TokenManager.clearAll()
  }

  // Get current user profile (Demo)
  async getProfile(): Promise<User> {
    await this.delay(500)
    const user = TokenManager.getUser()
    if (!user) {
      throw new Error('No authenticated user')
    }
    return user
  }

  // Update user profile (Demo - not functional)
  async updateProfile(_updates: Partial<Pick<User, 'first_name' | 'last_name' | 'email'>>): Promise<User> {
    await this.delay(800)
    throw new Error('Profile updates are not available in demo mode.')
  }

  // Change password (Demo - not functional)
  async changePassword(_currentPassword: string, _newPassword: string, _newPasswordConfirm: string): Promise<void> {
    await this.delay(800)
    throw new Error('Password changes are not available in demo mode.')
  }

  // Check authentication status
  isAuthenticated(): boolean {
    return TokenManager.hasValidSession()
  }

  // Get current user
  getCurrentUser(): User | null {
    return TokenManager.getUser()
  }

  // Manual token refresh (Demo)
  async refreshToken(): Promise<TokenRefreshResponse> {
    await this.delay(500)
    
    if (!TokenManager.hasValidSession()) {
      throw new Error('No valid session')
    }

    // Generate new demo tokens
    const access = 'demo_access_token_' + Date.now()
    const refresh = 'demo_refresh_token_' + Date.now()
    
    TokenManager.setTokens(access, refresh)

    return { access, refresh }
  }
}

// Password validation utility (simplified for demo)
export class PasswordValidator {
  static validate(_password: string): { isValid: boolean; errors: string[] } {
    // In demo mode, accept any password
    return {
      isValid: true,
      errors: []
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService
