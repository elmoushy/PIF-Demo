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
    if (!user.value) {
      console.log('isAuthenticated: No user')
      return false
    }
    
    // Check if user has a valid authentication token
    if (!authService.isAuthenticated()) {
      console.log('isAuthenticated: No valid token')
      return false
    }
    
    console.log('isAuthenticated: user role =', user.value.role)
    console.log('isAuthenticated: user status =', user.value.status)
    console.log('isAuthenticated: user is_active =', user.value.is_active)
    
    // For SuperAdmin, always consider as authenticated if token is valid
    if ((user.value.role as string) === 'SuperAdmin') {
      console.log('isAuthenticated: SuperAdmin - returning true')
      return true
    }
    
    // For other roles, check status and active state
    const userIsActive = user.value?.is_active ?? (user.value?.status === 'Accepted')
    const isAccepted = user.value.status === 'Accepted'
    
    console.log('isAuthenticated: userIsActive =', userIsActive, 'isAccepted =', isAccepted)
    
    return isAccepted && userIsActive
  })
  const isAdmin = computed(() => user.value?.role === 'Administrator' || (user.value?.role as string) === 'SuperAdmin')
  const isCompany = computed(() => user.value?.role === 'Company')
  const isSuperAdmin = computed(() => (user.value?.role as string) === 'SuperAdmin')
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
      user.value = response.user || null
      
      // Debug logging
      console.log('Login response user:', response.user)
      console.log('Auth store user after login:', user.value)
      console.log('isAuthenticated after login:', isAuthenticated.value)
      console.log('authService.isAuthenticated():', authService.isAuthenticated())
      
      return response.user || {} as User
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterRequest): Promise<User> => {
    isLoading.value = true
    
    try {
      const registeredUser = await authService.register(userData)
      user.value = registeredUser
      return registeredUser
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (callEndpoint: boolean = true): Promise<void> => {
    isLoading.value = true
    
    try {
      await authService.logout(callEndpoint)
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      user.value = null
      isLoading.value = false
      
      // Clear any remaining notifications
      notificationService.clear()
    }
  }

  const updateProfile = async (updates: Partial<Pick<User, 'first_name' | 'last_name' | 'email'>>): Promise<User> => {
    if (!user.value) {
      throw new Error('No authenticated user')
    }

    isLoading.value = true
    
    try {
      const updatedUser = await authService.updateProfile(updates)
      user.value = updatedUser
      return updatedUser
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
    currentPassword: string, 
    newPassword: string, 
    newPasswordConfirm: string
  ): Promise<void> => {
    if (!user.value) {
      throw new Error('No authenticated user')
    }

    isLoading.value = true
    
    try {
      await authService.changePassword(currentPassword, newPassword, newPasswordConfirm)
      notificationService.success(
        'Password Changed',
        'Your password has been updated successfully.'
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

  const hasPermission = (permission: 'admin' | 'company' | 'superadmin'): boolean => {
    if (!user.value || !isActive.value) return false
    
    // SuperAdmin has all permissions
    if ((user.value.role as string) === 'SuperAdmin') return true
    
    // For other roles, check status first
    if (user.value.status !== 'Accepted') return false
    
    switch (permission) {
      case 'superadmin':
        return (user.value.role as string) === 'SuperAdmin'
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
    isSuperAdmin,
    isActive,
    isApproved,
    
    // Actions
    initAuth,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    
    // Helpers
    checkUserStatus,
    getUserDisplayName,
    hasPermission
  }
})
