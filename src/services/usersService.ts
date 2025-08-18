// Users Management Service
import apiService from './apiService'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  type: 'SuperAdmin' | 'Admin' | 'User'
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login: string | null
  company: number
  created_at: string
  groups: any[]
  user_permissions: any[]
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface UpdateUserRequest {
  id: number
  username?: string
  email?: string
  password?: string
  first_name?: string
  last_name?: string
  type?: 'Admin' | 'User'
}

export interface DeleteUserRequest {
  id: number
}

class UsersService {
  private static instance: UsersService

  static getInstance(): UsersService {
    if (!UsersService.instance) {
      UsersService.instance = new UsersService()
    }
    return UsersService.instance
  }

  /**
   * List users with optional search functionality
   */
  async getUsers(search?: string): Promise<User[]> {
    try {
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : ''
      const users = await apiService.get<User[]>(`/api/users/${queryParams}`)
      return users
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const user = await apiService.post<User>('/api/users/', userData)
      return user
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(userData: UpdateUserRequest): Promise<User> {
    try {
      const user = await apiService.put<User>('/api/users/', userData)
      return user
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: number): Promise<void> {
    try {
      // We need to use a custom method since delete with body is not standard
      // Using the private makeRequest method via type assertion
      const api = apiService as any
      await api.makeRequest('/api/users/', {
        method: 'DELETE',
        body: { id: userId },
        requiresAuth: true
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number
    active: number
    inactive: number
    admins: number
    users: number
  }> {
    try {
      const users = await this.getUsers()
      
      const stats = {
        total: users.length,
        active: users.filter(user => user.is_active).length,
        inactive: users.filter(user => !user.is_active).length,
        admins: users.filter(user => user.type === 'Admin' || user.type === 'SuperAdmin').length,
        users: users.filter(user => user.type === 'User').length
      }

      return stats
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        admins: 0,
        users: 0
      }
    }
  }
}

export default UsersService.getInstance()
