import { apiService } from './apiService'

export interface Company {
  id: number
  name: string
  arabic_name: string
  cr_number: string
  moi_number: string
  country_of_incorporation: string
  is_active: boolean
  parent_company: number | null
  created_at: string
  updated_at: string
}

export interface CompanyUpdateData {
  name?: string
  arabic_name?: string
  cr_number?: string
  moi_number?: string
  country_of_incorporation?: string
  is_active?: boolean
}

export interface CompaniesApiResponse {
  companies: Company[]
  total: number
}

class CompaniesService {
  private readonly baseEndpoint = '/api/company/'

  /**
   * Get companies based on user role
   * SuperAdmin sees all companies, others see their own company
   */
  async getCompanies(): Promise<Company[]> {
    try {
      const response = await apiService.get<Company | Company[]>(this.baseEndpoint)
      
      // Handle both single company (Admin/User) and array (SuperAdmin) responses
      if (Array.isArray(response)) {
        return response
      } else {
        return [response]
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error)
      throw new Error('Failed to fetch companies')
    }
  }

  /**
   * Update company information
   */
  async updateCompany(companyData: CompanyUpdateData): Promise<Company> {
    try {
      const response = await apiService.put<Company>(this.baseEndpoint, companyData)
      return response
    } catch (error) {
      console.error('Failed to update company:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to update company')
    }
  }

  /**
   * Check if user can manage multiple companies (SuperAdmin role)
   */
  async canManageMultipleCompanies(): Promise<boolean> {
    try {
      const companies = await this.getCompanies()
      return companies.length > 1
    } catch {
      return false
    }
  }
}

export const companiesService = new CompaniesService()
export default companiesService
