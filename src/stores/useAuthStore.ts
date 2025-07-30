import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService, { type User, type LoginRequest, type RegisterRequest } from '../services/authService'
import notificationService from '../services/notificationService'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // Computed
  const isAuthenticated = computed(() => {
    // If is_active is not provided by API, assume active if status is 'Accepted'
    const userIsActive = user.value?.is_active ?? (user.value?.status === 'Accepted')
    return !!user.value && user.value.status === 'Accepted' && userIsActive && authService.isAuthenticated()
  })
  const isAdmin = computed(() => user.value?.role === 'Administrator')
  const isCompany = computed(() => user.value?.role === 'Company')
  const isActive = computed(() => {
    // If is_active is not provided by API, assume active if status is 'Accepted'
    return user.value?.is_active ?? (user.value?.status === 'Accepted')
  })
  const isApproved = computed(() => user.value?.status === 'Accepted')

  // Actions
  const initAuth = async () => {
    if (isInitialized.value) return

    try {
      if (authService.isAuthenticated()) {
        user.value = authService.getCurrentUser()
        
        // No need to call profile endpoint on init - rely on stored user data
        // Token validity will be checked automatically on first API call
      }
    } catch (error) {
      console.warn('Auth initialization failed:', error)
      await logout(false) // Don't call logout endpoint on init failure
    } finally {
      isInitialized.value = true
    }
  }

  const login = async (credentials: LoginRequest): Promise<User> => {
    isLoading.value = true
    
    try {
      const response = await authService.login(credentials)
      user.value = response.user
      
      return response.user
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterRequest): Promise<User> => {
    isLoading.value = true
    
    try {
      const registeredUser = await authService.register(userData)
      return registeredUser
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (_callEndpoint: boolean = true): Promise<void> => {
    isLoading.value = true
    
    try {
      // In demo mode, just clear local data
      await authService.logout(false)
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      user.value = null
      isLoading.value = false
      
      // Clear any remaining notifications
      notificationService.clear()
    }
  }

  const updateProfile = async (_updates: Partial<Pick<User, 'first_name' | 'last_name' | 'email'>>): Promise<User> => {
    if (!user.value) {
      throw new Error('No authenticated user')
    }

    isLoading.value = true
    
    try {
      // In demo mode, simulate update without calling backend
      notificationService.info(
        'Demo Mode',
        'Profile updates are not available in demo mode.'
      )
      
      return user.value
    } catch (error) {
      notificationService.error(
        'Update Failed',
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      )
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (
    _currentPassword: string, 
    _newPassword: string, 
    _newPasswordConfirm: string
  ): Promise<void> => {
    if (!user.value) {
      throw new Error('No authenticated user')
    }

    isLoading.value = true
    
    try {
      // In demo mode, show info message
      notificationService.info(
        'Demo Mode',
        'Password changes are not available in demo mode.'
      )
    } catch (error) {
      notificationService.error(
        'Password Change Failed',
        error instanceof Error ? error.message : 'Failed to change password. Please try again.'
      )
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const refreshUserData = async (forceRefresh: boolean = false): Promise<void> => {
    if (!isAuthenticated.value) return

    // In demo mode, just return current user data
    if (!forceRefresh) return

    try {
      // In demo mode, just keep the current user data
      const currentUser = authService.getCurrentUser()
      if (currentUser) {
        user.value = currentUser
      }
    } catch (error) {
      console.warn('Failed to refresh user data:', error)
      // Don't throw error here as this might be called periodically
    }
  }

  // Helper methods
  const checkUserStatus = () => {
    if (!user.value) return { canLogin: false, message: 'No user data' }

    if (user.value.status === 'Pending') {
      return {
        canLogin: false,
        message: 'Your account is pending approval. Please wait for administrator approval.'
      }
    }

    if (user.value.status === 'Rejected') {
      return {
        canLogin: false,
        message: 'Your account has been rejected. Please contact support.'
      }
    }

    if (!user.value.is_active && user.value.status !== 'Accepted') {
      return {
        canLogin: false,
        message: 'Your account is inactive. Please contact support.'
      }
    }

    return { canLogin: true, message: 'OK' }
  }

  const getUserDisplayName = (): string => {
    if (!user.value) return 'Guest'
    
    if (user.value.first_name && user.value.last_name) {
      return `${user.value.first_name} ${user.value.last_name}`
    }
    
    if (user.value.first_name) {
      return user.value.first_name
    }
    
    return user.value.username
  }

  const hasPermission = (permission: 'admin' | 'company'): boolean => {
    if (!user.value || !isActive.value || !isApproved.value) return false
    
    switch (permission) {
      case 'admin':
        return user.value.role === 'Administrator'
      case 'company':
        return user.value.role === 'Company' || user.value.role === 'Administrator'
      default:
        return false
    }
  }

  return {
    // State
    user,
    isLoading,
    isInitialized,
    
    // Computed
    isAuthenticated,
    isAdmin,
    isCompany,
    isActive,
    isApproved,
    
    // Actions
    initAuth,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUserData,
    
    // Helpers
    checkUserStatus,
    getUserDisplayName,
    hasPermission
  }
})
