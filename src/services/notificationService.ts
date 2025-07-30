import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
}

class NotificationService {
  private notifications = ref<Notification[]>([])
  private nextId = 1

  private generateId(): string {
    return `notification-${this.nextId++}-${Date.now()}`
  }

  show(notification: Omit<Notification, 'id'>): string {
    const id = this.generateId()
    const newNotification: Notification = {
      id,
      duration: 5000, // 5 seconds default
      persistent: false,
      ...notification
    }

    this.notifications.value.push(newNotification)

    // Auto-remove non-persistent notifications
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        this.remove(id)
      }, newNotification.duration)
    }

    return id
  }

  success(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  error(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'error',
      title,
      message,
      duration: 8000, // Longer for errors
      ...options
    })
  }

  warning(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  info(title: string, message: string, options?: Partial<Notification>): string {
    return this.show({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  remove(id: string): void {
    const index = this.notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      this.notifications.value.splice(index, 1)
    }
  }

  clear(): void {
    this.notifications.value = []
  }

  getNotifications() {
    return this.notifications
  }

  // Authentication-specific helpers
  loginSuccess(username: string): string {
    return this.success(
      'Welcome back!',
      `Successfully logged in as ${username}. Redirecting to dashboard...`
    )
  }

  loginError(message: string): string {
    let title = 'Login Failed'
    let friendlyMessage = message

    if (message.includes('Invalid credentials')) {
      title = 'Invalid Credentials'
      friendlyMessage = 'Please check your username/email and password and try again.'
    } else if (message.includes('Rate limited') || message.includes('throttled')) {
      title = 'Too Many Attempts'
      friendlyMessage = 'Too many login attempts. Please wait a moment before trying again.'
    } else if (message.includes('Network error')) {
      title = 'Connection Error'
      friendlyMessage = 'Unable to connect to the server. Please check your internet connection.'
    }

    return this.error(title, friendlyMessage)
  }

  registrationSuccess(): string {
    return this.success(
      'Registration Successful!',
      'Your account has been created and is pending administrator approval. You will be notified once approved.'
    )
  }

  registrationError(message: string): string {
    let title = 'Registration Failed'
    let friendlyMessage = message

    if (message.includes('username already exists')) {
      title = 'Username Taken'
      friendlyMessage = 'This username is already taken. Please choose a different username.'
    } else if (message.includes('email already exists')) {
      title = 'Email Already Registered'
      friendlyMessage = 'An account with this email already exists. Please use a different email or try logging in.'
    } else if (message.includes('Password must contain')) {
      title = 'Weak Password'
      friendlyMessage = 'Password does not meet security requirements. Please ensure it contains at least 12 characters with uppercase, lowercase, digit, and special character.'
    }

    return this.error(title, friendlyMessage)
  }

  sessionExpired(): string {
    return this.warning(
      'Session Expired',
      'Your session has expired for security reasons. Please log in again.',
      { persistent: true }
    )
  }

  accountPending(): string {
    return this.warning(
      'Account Pending',
      'Your account is pending approval. Please wait for administrator approval before logging in.',
      { duration: 10000 }
    )
  }

  accountRejected(): string {
    return this.error(
      'Account Rejected',
      'Your account has been rejected. Please contact support for assistance.',
      { persistent: true }
    )
  }

  accountInactive(): string {
    return this.error(
      'Account Inactive',
      'Your account is inactive. Please contact support for assistance.',
      { persistent: true }
    )
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
export default notificationService
