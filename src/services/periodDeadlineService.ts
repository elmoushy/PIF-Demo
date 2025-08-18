// Period Deadline Service for API interactions
import apiService from './apiService'

interface PeriodDeadline {
  year: number
  time_period: 'First Half' | 'Third Quarter' | 'Fourth Quarter'
  dead_line: string
}

interface DeadlineFilters {
  year_gte?: number
  deadline_gte?: string
}

interface CreateDeadlineData {
  year: number
  time_period: string
  dead_line: string
}

class PeriodDeadlineService {
  private static instance: PeriodDeadlineService

  static getInstance(): PeriodDeadlineService {
    if (!PeriodDeadlineService.instance) {
      PeriodDeadlineService.instance = new PeriodDeadlineService()
    }
    return PeriodDeadlineService.instance
  }

  /**
   * Get all period deadlines with optional filtering
   */
  async getDeadlines(filters?: DeadlineFilters): Promise<PeriodDeadline[]> {
    try {
      let url = '/api/period-deadline/'
      
      if (filters) {
        const queryParams = new URLSearchParams()
        
        if (filters.year_gte) {
          queryParams.append('year_gte', filters.year_gte.toString())
        }
        
        if (filters.deadline_gte) {
          queryParams.append('deadline_gte', filters.deadline_gte)
        }
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`
        }
      }
      
      const deadlines = await apiService.get<PeriodDeadline[]>(url)
      
      // Sort deadlines by year and then by period for consistent display
      return deadlines.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        
        const periodOrder = { 'First Half': 1, 'Third Quarter': 2, 'Fourth Quarter': 3 }
        return (periodOrder[a.time_period] || 0) - (periodOrder[b.time_period] || 0)
      })
    } catch (error: any) {
      console.error('Error fetching period deadlines:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required to access period deadlines')
      } else if (error.response?.status === 400) {
        throw new Error('Invalid filter parameters provided')
      } else if (error.response?.status >= 500) {
        throw new Error('Server error occurred while fetching deadlines')
      } else {
        throw new Error('Failed to load period deadlines')
      }
    }
  }

  /**
   * Create or update a period deadline (upsert operation)
   * Uses PUT method as per API specification
   */
  async createOrUpdateDeadline(data: CreateDeadlineData): Promise<PeriodDeadline> {
    try {
      // Validate required fields
      if (!data.year || !data.time_period || !data.dead_line) {
        throw new Error('All fields are required: year, time_period, and dead_line')
      }

      // Validate time period
      const validPeriods = ['First Half', 'Third Quarter', 'Fourth Quarter']
      if (!validPeriods.includes(data.time_period)) {
        throw new Error('Invalid time period. Must be one of: First Half, Third Quarter, Fourth Quarter')
      }

      // Validate year
      const currentYear = new Date().getFullYear()
      if (data.year < currentYear || data.year > currentYear + 10) {
        throw new Error(`Year must be between ${currentYear} and ${currentYear + 10}`)
      }

      // Validate deadline format
      const deadlineDate = new Date(data.dead_line)
      if (isNaN(deadlineDate.getTime())) {
        throw new Error('Invalid deadline date format')
      }

      // Prepare the request payload
      const payload = {
        year: data.year,
        time_period: data.time_period,
        dead_line: data.dead_line
      }

      const result = await apiService.put<PeriodDeadline>('/api/period-deadline/', payload)
      
      return result
    } catch (error: any) {
      console.error('Error creating/updating period deadline:', error)
      
      if (error.response?.status === 401) {
        throw new Error('Authentication required to manage period deadlines')
      } else if (error.response?.status === 403) {
        throw new Error('Only SuperAdmin users can create or update period deadlines')
      } else if (error.response?.status === 400) {
        // Handle validation errors
        if (error.response?.data) {
          const validationErrors = error.response.data
          const errorMessages = []
          
          if (validationErrors.year) {
            errorMessages.push(`Year: ${validationErrors.year.join(', ')}`)
          }
          if (validationErrors.time_period) {
            errorMessages.push(`Time Period: ${validationErrors.time_period.join(', ')}`)
          }
          if (validationErrors.dead_line) {
            errorMessages.push(`Deadline: ${validationErrors.dead_line.join(', ')}`)
          }
          if (validationErrors.non_field_errors) {
            errorMessages.push(validationErrors.non_field_errors.join(', '))
          }
          
          if (errorMessages.length > 0) {
            const errorObj = new Error(errorMessages.join('\n'))
            ;(errorObj as any).response = error.response
            throw errorObj
          }
        }
        throw new Error('Validation error occurred')
      } else if (error.response?.status >= 500) {
        throw new Error('Server error occurred while saving deadline')
      } else if (error.message) {
        throw error
      } else {
        throw new Error('Failed to save period deadline')
      }
    }
  }

  /**
   * Get deadlines for a specific year
   */
  async getDeadlinesForYear(year: number): Promise<PeriodDeadline[]> {
    return this.getDeadlines({ year_gte: year })
  }

  /**
   * Get upcoming deadlines (after current date)
   */
  async getUpcomingDeadlines(): Promise<PeriodDeadline[]> {
    const now = new Date().toISOString()
    return this.getDeadlines({ deadline_gte: now })
  }

  /**
   * Check if a deadline exists for a specific year and period
   */
  async deadlineExists(year: number, timePeriod: string): Promise<boolean> {
    try {
      const deadlines = await this.getDeadlinesForYear(year)
      return deadlines.some(d => d.time_period === timePeriod)
    } catch (error) {
      console.error('Error checking deadline existence:', error)
      return false
    }
  }

  /**
   * Get the next upcoming deadline
   */
  async getNextDeadline(): Promise<PeriodDeadline | null> {
    try {
      const upcomingDeadlines = await this.getUpcomingDeadlines()
      
      if (upcomingDeadlines.length === 0) {
        return null
      }
      
      // Sort by deadline date and return the earliest
      return upcomingDeadlines.sort((a, b) => 
        new Date(a.dead_line).getTime() - new Date(b.dead_line).getTime()
      )[0]
    } catch (error) {
      console.error('Error getting next deadline:', error)
      return null
    }
  }

  /**
   * Validate deadline data before submission
   */
  validateDeadlineData(data: CreateDeadlineData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}
    
    // Validate year
    if (!data.year) {
      errors.year = 'Year is required'
    } else {
      const currentYear = new Date().getFullYear()
      if (data.year < currentYear) {
        errors.year = 'Year cannot be in the past'
      } else if (data.year > currentYear + 10) {
        errors.year = 'Year cannot be more than 10 years in the future'
      }
    }
    
    // Validate time period
    if (!data.time_period) {
      errors.time_period = 'Time period is required'
    } else {
      const validPeriods = ['First Half', 'Third Quarter', 'Fourth Quarter']
      if (!validPeriods.includes(data.time_period)) {
        errors.time_period = 'Invalid time period selected'
      }
    }
    
    // Validate deadline
    if (!data.dead_line) {
      errors.dead_line = 'Deadline is required'
    } else {
      const deadlineDate = new Date(data.dead_line)
      if (isNaN(deadlineDate.getTime())) {
        errors.dead_line = 'Invalid deadline date'
      } else {
        const now = new Date()
        if (deadlineDate <= now) {
          errors.dead_line = 'Deadline must be in the future'
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * Format deadline for display
   */
  formatDeadlineForDisplay(deadline: PeriodDeadline): {
    formattedDate: string
    formattedTime: string
    timeRemaining: string
    status: 'future' | 'upcoming' | 'urgent' | 'expired'
  } {
    const deadlineDate = new Date(deadline.dead_line)
    const now = new Date()
    const diff = deadlineDate.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    let status: 'future' | 'upcoming' | 'urgent' | 'expired'
    let timeRemaining: string
    
    if (diff < 0) {
      status = 'expired'
      timeRemaining = 'Expired'
    } else if (days <= 7) {
      status = 'urgent'
      timeRemaining = days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`
    } else if (days <= 30) {
      status = 'upcoming'
      timeRemaining = `${days} days`
    } else {
      status = 'future'
      timeRemaining = `${days} days`
    }
    
    return {
      formattedDate: deadlineDate.toLocaleDateString(),
      formattedTime: deadlineDate.toLocaleTimeString(),
      timeRemaining,
      status
    }
  }
}

export const periodDeadlineService = PeriodDeadlineService.getInstance()
export default periodDeadlineService
