// Entities Management Service
import apiService from './apiService'

export interface Entity {
  id: number
  name: string
  arabic_name: string
  cr_number: string
  moi_number: string
  country_of_incorporation: string
  is_active: boolean
  parent_company: number
  created_at: string
  updated_at: string
}

export interface CreateEntityRequest {
  name: string
  arabic_name?: string
  cr_number?: string
  moi_number?: string
  country_of_incorporation?: string
  is_active?: boolean
}

export interface UpdateEntityRequest {
  id: number
  name?: string
  arabic_name?: string
  cr_number?: string
  moi_number?: string
  country_of_incorporation?: string
  is_active?: boolean
}

class EntitiesService {
  private static instance: EntitiesService

  static getInstance(): EntitiesService {
    if (!EntitiesService.instance) {
      EntitiesService.instance = new EntitiesService()
    }
    return EntitiesService.instance
  }

  /**
   * Get all entities
   */
  async getEntities(search?: string): Promise<Entity[]> {
    try {
      const params = new URLSearchParams()
      if (search) {
        params.append('search', search)
      }
      
      const queryString = params.toString()
      const endpoint = queryString ? `/api/entities/?${queryString}` : '/api/entities/'
      
      const data = await apiService.get<Entity[]>(endpoint)
      return data
    } catch (error: any) {
      console.error('Error fetching entities:', error)
      throw new Error(error.response?.detail || 'Failed to fetch entities')
    }
  }

  /**
   * Get single entity by ID
   */
  async getEntity(id: number): Promise<Entity> {
    try {
      const data = await apiService.get<Entity>(`/api/entities/?id=${id}`)
      return data
    } catch (error: any) {
      console.error('Error fetching entity:', error)
      throw new Error(error.response?.detail || 'Failed to fetch entity')
    }
  }

  /**
   * Create a new entity
   */
  async createEntity(entityData: CreateEntityRequest): Promise<Entity> {
    try {
      const data = await apiService.post<Entity>('/api/entities/', entityData)
      return data
    } catch (error: any) {
      console.error('Error creating entity:', error)
      
      // Handle validation errors
      if (error.status === 400) {
        const errors = error.response
        if (typeof errors === 'object') {
          const errorMessages = Object.values(errors).flat()
          throw new Error(errorMessages.join(', '))
        }
      }
      
      throw new Error(error.response?.detail || error.message || 'Failed to create entity')
    }
  }

  /**
   * Update an existing entity
   */
  async updateEntity(entityData: UpdateEntityRequest): Promise<Entity> {
    try {
      const data = await apiService.put<Entity>('/api/entities/', entityData)
      return data
    } catch (error: any) {
      console.error('Error updating entity:', error)
      
      // Handle validation errors
      if (error.status === 400) {
        const errors = error.response
        if (typeof errors === 'object') {
          const errorMessages = Object.values(errors).flat()
          throw new Error(errorMessages.join(', '))
        }
      }
      
      throw new Error(error.response?.detail || error.message || 'Failed to update entity')
    }
  }

  /**
   * Delete an entity
   */
  async deleteEntity(id: number): Promise<void> {
    try {
      await apiService.post<{ detail: string }>('/api/entities/', { id })
    } catch (error: any) {
      console.error('Error deleting entity:', error)
      throw new Error(error.response?.detail || error.message || 'Failed to delete entity')
    }
  }
}

export default EntitiesService.getInstance()
