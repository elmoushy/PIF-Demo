// Session management utility
import { useAuthStore } from '../stores/useAuthStore'
import notificationService from './notificationService'

class SessionManager {
  private static instance: SessionManager
  private isSessionEnded = false
  private boundHandleSessionEnded: () => void
  private boundHandleUnhandledRejection: (event: PromiseRejectionEvent) => void

  constructor() {
    this.boundHandleSessionEnded = this.handleSessionEnded.bind(this)
    this.boundHandleUnhandledRejection = this.handleUnhandledRejection.bind(this)
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  init() {
    // Listen for session ended events
    window.addEventListener('session-ended', this.boundHandleSessionEnded)
    
    // Listen for unhandled auth errors
    window.addEventListener('unhandledrejection', this.boundHandleUnhandledRejection)
  }

  private async handleSessionEnded() {
    if (this.isSessionEnded) {
      return // Prevent multiple session ended handlers
    }
    
    this.isSessionEnded = true
    
    try {
      const authStore = useAuthStore()
      
      // Clear all authentication data
      await authStore.logout(false) // Don't call logout endpoint since session is already ended
      
      // Show session ended notification
      notificationService.error(
        'Session Ended',
        'Your session has expired. Please log in again to continue.'
      )
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } finally {
      // Reset flag after a delay to allow new sessions
      setTimeout(() => {
        this.isSessionEnded = false
      }, 1000)
    }
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    if (event.reason?.message === 'Session ended') {
      event.preventDefault() // Prevent the unhandled rejection from being logged
      window.dispatchEvent(new CustomEvent('session-ended'))
    }
  }

  cleanup() {
    window.removeEventListener('session-ended', this.boundHandleSessionEnded)
    window.removeEventListener('unhandledrejection', this.boundHandleUnhandledRejection)
  }
}

export const sessionManager = SessionManager.getInstance()
export default sessionManager
