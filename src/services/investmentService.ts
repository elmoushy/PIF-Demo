/**
 * Investment Service for handling investment period data from API
 */
import { makeHttpRequest } from './httpClient'

// API Response interface matching the endpoint documentation
export interface InvestmentApiResponse {
  id: number
  year: number
  time_period: string
  asset_code: string | null
  entity_name: string
  arabic_legal_name: string | null
  commercial_registration_number: string | null
  moi_number: string | null
  country_of_incorporation: string | null
  ownership_percentage: number // Decimal as number for API
  acquisition_disposal_date: string | null // YYYY-MM-DD format
  direct_parent: string | null
  ultimate_parent: string | null
  relationship_of_investment: string | null
  direct_or_indirect: string | null
  entities_principal_activities: string | null
  is_submitted: boolean
  submitted_at: string | null // ISO datetime
  submitted_by: number | null
  created_by: number
  created_at: string // ISO datetime
  updated_by: number | null
  updated_at: string // ISO datetime
}

// Business Quarter Row interface (internal app format)
export interface BusinessQuarterRow {
  id: string
  assetCode?: string
  entityNameEnglish: string
  entityNameArabic: string
  commercialRegistrationNumber: string
  moiNumber?: string
  countryOfIncorporation: string
  ownershipPercentage: number
  acquisitionDisposalDate?: string
  directParentEntity: string
  ultimateParentEntity: string
  investmentRelationshipType: string
  ownershipStructure: string
  principalActivities?: string
  currency?: string
  
  // Metadata
  isModified?: boolean
  isNewRow?: boolean
  isFromPreviousQuarter?: boolean
  previousQuarterSource?: string
  dataSource?: string
  isRowReadOnly?: boolean
  createdAt?: string
  updatedAt?: string
  isSubmitted?: boolean
  submittedAt?: string
  submittedBy?: number
}

class InvestmentService {
  /**
   * Get investments for a specific year and time period
   */
  async getInvestmentsByPeriod(year: number, timePeriod: string): Promise<BusinessQuarterRow[]> {
    try {
      const queryParams = new URLSearchParams({
        year: year.toString(),
        time_period: timePeriod
      })

      const url = `/api/investment/period/?${queryParams.toString()}`
      console.log(`Making API call to: ${url}`)
      console.log(`Formatted time_period: "${timePeriod}"`)

      const response = await makeHttpRequest<InvestmentApiResponse[]>(
        url,
        { method: 'GET' },
        true // Include authentication
      )

      // Transform API response to internal format
      return this.transformApiResponseToBusinessQuarter(response)
    } catch (error: any) {
      console.error('Error fetching investments:', error)
      
      // Handle specific error cases
      if (error.status === 404) {
        // No data found - return empty array
        console.log('No investment data found for the specified period')
        return []
      } else if (error.status === 400) {
        throw new Error('Invalid request parameters')
      } else if (error.status === 401) {
        throw new Error('Authentication required')
      } else {
        throw new Error('Failed to fetch investment data')
      }
    }
  }

  /**
   * Save investments as draft to the API (POST endpoint)
   */
  async saveInvestmentsDraft(year: number, timePeriod: string, investments: BusinessQuarterRow[]): Promise<InvestmentApiResponse[]> {
    try {
      // Transform internal format to API format for POST
      const apiInvestments = this.transformBusinessQuarterToApiRequest(investments, year, timePeriod)

      console.log(`Saving ${apiInvestments.length} investments as draft to API`)
      console.log(`Year: ${year}, Time Period: "${timePeriod}"`)

      const response = await makeHttpRequest<InvestmentApiResponse[]>(
        '/api/investment/period/',
        {
          method: 'POST',
          body: JSON.stringify(apiInvestments)
        },
        true // Include authentication
      )

      console.log('Draft save successful:', response)
      return response
    } catch (error: any) {
      console.error('Error saving investments draft:', error)
      
      // Handle specific error cases
      if (error.status === 400) {
        throw new Error('Invalid investment data format')
      } else if (error.status === 401) {
        throw new Error('Authentication required')
      } else if (error.status === 403) {
        throw new Error('Permission denied')
      } else {
        throw new Error('Failed to save investments draft')
      }
    }
  }

  /**
   * Submit investments for approval (POST /api/investment/submit/)
   */
  async submitInvestmentsByPeriod(year: number, timePeriod: string): Promise<{ detail: string; submitted_count: number }> {
    try {
      console.log(`Submitting investments by period to API`)
      console.log(`Year: ${year}, Time Period: "${timePeriod}"`)

      const response = await makeHttpRequest<{ detail: string; submitted_count: number }>(
        '/api/investment/submit/',
        {
          method: 'POST',
          body: JSON.stringify({
            year: year,
            time_period: timePeriod
          })
        },
        true // Include authentication
      )

      console.log('Investment submission successful:', response)
      return response
    } catch (error: any) {
      console.error('Error submitting investments:', error)
      
      // Handle specific error cases based on API documentation
      if (error.status === 400) {
        if (error.detail?.includes('deadline')) {
          throw new Error('Submission deadline has passed or period not yet open')
        } else {
          throw new Error('Invalid submission data or missing parameters')
        }
      } else if (error.status === 401) {
        throw new Error('Authentication required')
      } else if (error.status === 403) {
        throw new Error('Not authorized to submit these investments')
      } else if (error.status === 404) {
        throw new Error('No investments found for the specified period')
      } else {
        throw new Error('Failed to submit investments')
      }
    }
  }

  /**
   * Unsubmit investments (POST /api/investment/unsubmit/)
   * Allows reversing submission status to enable modifications
   */
  async unsubmitInvestmentsByPeriod(year: number, timePeriod: string): Promise<{ detail: string }> {
    try {
      console.log(`Unsubmitting investments by period`)
      console.log(`Year: ${year}, Time Period: "${timePeriod}"`)
      
      const requestData = {
        year: year,
        time_period: timePeriod
      }
      
      console.log('Unsubmit request data:', requestData)
      
      const response = await makeHttpRequest<{ detail: string }>('/api/investment/unsubmit/', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })
      
      console.log('Unsubmit response:', response)
      return response
      
    } catch (error: any) {
      console.error('Error unsubmitting investments:', error)
      
      // Handle specific error cases
      if (error.status === 400) {
        if (error.message?.includes('required')) {
          throw new Error('Year and time period are required for bulk unsubmit')
        }
        throw new Error('Invalid request parameters')
      } else if (error.status === 401) {
        throw new Error('Authentication required')
      } else if (error.status === 403) {
        throw new Error('Permission denied: Not authorized to unsubmit these investments')
      } else if (error.status === 404) {
        throw new Error('No investments found for the specified period')
      } else {
        throw new Error('Failed to unsubmit investments')
      }
    }
  }

  /**
   * Unsubmit a single investment by ID (POST /api/investment/unsubmit/)
   */
  async unsubmitInvestmentById(investmentId: number): Promise<{ detail: string }> {
    try {
      console.log(`Unsubmitting investment by ID: ${investmentId}`)
      
      const requestData = {
        id: investmentId
      }
      
      console.log('Unsubmit request data:', requestData)
      
      const response = await makeHttpRequest<{ detail: string }>('/api/investment/unsubmit/', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })
      
      console.log('Unsubmit response:', response)
      return response
      
    } catch (error: any) {
      console.error('Error unsubmitting investment:', error)
      
      // Handle specific error cases
      if (error.status === 400) {
        throw new Error('Invalid investment ID')
      } else if (error.status === 401) {
        throw new Error('Authentication required')
      } else if (error.status === 403) {
        throw new Error('Permission denied: Not authorized to unsubmit this investment')
      } else if (error.status === 404) {
        throw new Error('Investment not found')
      } else {
        throw new Error('Failed to unsubmit investment')
      }
    }
  }

  /**
   * Transform API response format to internal BusinessQuarterRow format
   */
  private transformApiResponseToBusinessQuarter(apiData: InvestmentApiResponse[]): BusinessQuarterRow[] {
    console.log('transformApiResponseToBusinessQuarter - input:', apiData)
    const result = apiData.map(item => {
      console.log('Processing API item:', { id: item.id, is_submitted: item.is_submitted })
      return {
        id: item.id.toString(),
        assetCode: item.asset_code || undefined,
        entityNameEnglish: item.entity_name,
        entityNameArabic: item.arabic_legal_name || '',
        commercialRegistrationNumber: item.commercial_registration_number || '',
        moiNumber: item.moi_number || undefined,
        countryOfIncorporation: item.country_of_incorporation || '',
        ownershipPercentage: item.ownership_percentage || 0,
        acquisitionDisposalDate: item.acquisition_disposal_date || undefined,
        directParentEntity: item.direct_parent || '',
        ultimateParentEntity: item.ultimate_parent || 'PIF',
        investmentRelationshipType: item.relationship_of_investment || '',
        ownershipStructure: item.direct_or_indirect || '',
        principalActivities: item.entities_principal_activities || undefined,
        
        // Metadata
        isModified: false,
        isNewRow: false,
        isFromPreviousQuarter: false,
        dataSource: 'api',
        isRowReadOnly: item.is_submitted, // Submitted rows are read-only
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        isSubmitted: item.is_submitted,
        submittedAt: item.submitted_at || undefined,
        submittedBy: item.submitted_by || undefined
      }
    })
    console.log('transformApiResponseToBusinessQuarter - output:', result)
    return result
  }

  /**
   * Transform internal BusinessQuarterRow format to API request format
   */
  private transformBusinessQuarterToApiRequest(businessData: BusinessQuarterRow[], year: number, timePeriod: string): Partial<InvestmentApiResponse>[] {
    return businessData.map(item => ({
      // Only include ID if it's an existing record (not a new row)
      ...(item.id && !item.isNewRow && !isNaN(Number(item.id)) ? { id: Number(item.id) } : {}),
      
      year: year,
      time_period: timePeriod,
      asset_code: item.assetCode || null,
      entity_name: item.entityNameEnglish,
      arabic_legal_name: item.entityNameArabic || null,
      commercial_registration_number: item.commercialRegistrationNumber || null,
      moi_number: item.moiNumber || null,
      country_of_incorporation: item.countryOfIncorporation || null,
      ownership_percentage: Number(item.ownershipPercentage) || 0, // Send as number, not string
      acquisition_disposal_date: item.acquisitionDisposalDate || null,
      direct_parent: item.directParentEntity || null,
      ultimate_parent: item.ultimateParentEntity || 'PIF',
      relationship_of_investment: this.convertRelationshipToApiFormat(item.investmentRelationshipType),
      direct_or_indirect: this.convertOwnershipStructureToApiFormat(item.ownershipStructure),
      entities_principal_activities: item.principalActivities || null
      // Note: Do not send is_submitted, submitted_at, submitted_by for draft saves
      // Note: created_by, created_at, updated_by, updated_at will be handled by the backend
    }))
  }

  /**
   * Parse period string to extract year and time period
   * Examples: "First Half 2025" -> { year: 2025, timePeriod: "first half" }
   */
  parsePeriodString(periodString: string): { year: number; timePeriod: string } {
    const parts = periodString.trim().split(' ')
    
    // Handle different formats
    if (parts.length >= 3) {
      // Format: "First Half 2025" or "Third Quarter 2025" or "Fourth Quarter 2025"
      const year = parseInt(parts[parts.length - 1])
      const timePeriod = parts.slice(0, -1).join(' ')
      
      if (isNaN(year)) {
        throw new Error(`Invalid year in period string: ${periodString}`)
      }
      
      // Convert to API format (lowercase)
      const apiTimePeriod = this.convertToApiFormat(timePeriod)
      
      return { year, timePeriod: apiTimePeriod }
    } else {
      throw new Error(`Invalid period format: ${periodString}`)
    }
  }

  /**
   * Convert internal period format to API format
   * Internal: "First Half", "Third Quarter", "Fourth Quarter"
   * API: "First Half", "Third Quarter", "Fourth Quarter" (title case)
   */
  private convertToApiFormat(internalPeriod: string): string {
    const periodMap: Record<string, string> = {
      'First Half': 'First Half',
      'Third Quarter': 'Third Quarter', 
      'Fourth Quarter': 'Fourth Quarter',
      // Handle case variations
      'first half': 'First Half',
      'third quarter': 'Third Quarter',
      'fourth quarter': 'Fourth Quarter',
      'forth quarter': 'Fourth Quarter'
    }
    
    const apiFormat = periodMap[internalPeriod]
    if (!apiFormat) {
      throw new Error(`Invalid time period: ${internalPeriod}. Must be one of: First Half, Third Quarter, Fourth Quarter`)
    }
    
    return apiFormat
  }

  /**
   * Convert API period format to internal format for display
   * API: "First Half", "Third Quarter", "Fourth Quarter"
   * Internal: "First Half", "Third Quarter", "Fourth Quarter"
   */
  private convertToInternalFormat(apiPeriod: string): string {
    const periodMap: Record<string, string> = {
      'First Half': 'First Half',
      'Third Quarter': 'Third Quarter',
      'Fourth Quarter': 'Fourth Quarter'
    }
    
    const internalFormat = periodMap[apiPeriod]
    if (!internalFormat) {
      throw new Error(`Invalid API time period: ${apiPeriod}`)
    }
    
    return internalFormat
  }

  /**
   * Get available time periods (API format)
   */
  getValidTimePeriods(): string[] {
    return ['First Half', 'Third Quarter', 'Fourth Quarter']
  }

  /**
   * Convert internal relationship type to API format
   * Internal: "Joint venture" -> API: "JV"
   * Internal: "Subsidiary" -> API: "Subsidiary"
   * Internal: "Associate" -> API: "Associate"
   */
  private convertRelationshipToApiFormat(internalRelationship: string | null): string | null {
    if (!internalRelationship) return null
    
    const relationshipMap: Record<string, string> = {
      'Joint venture': 'JV',
      'Subsidiary': 'Subsidiary',
      'Associate': 'Associate',
      'Subsidiary of Associate': 'Subsidiary',
      'Joint Venture of Associate': 'JV',
      'Associate of Associate': 'Associate',
      'Subsidiary of a JV': 'Subsidiary',
      'Associate of a JV': 'Associate',
      'Joint Venture of a JV': 'JV'
    }
    
    return relationshipMap[internalRelationship] || internalRelationship
  }

  /**
   * Convert internal ownership structure to API format
   * Internal: "Direct to PIF" -> API: "Direct"
   * Internal: "Direct" -> API: "Direct"
   * Internal: "In-direct" -> API: "Indirect"
   */
  private convertOwnershipStructureToApiFormat(internalStructure: string | null): string | null {
    if (!internalStructure) return null
    
    const structureMap: Record<string, string> = {
      'Direct to PIF': 'Direct',
      'Direct': 'Direct',
      'In-direct': 'Indirect',
      'Indirect': 'Indirect'
    }
    
    return structureMap[internalStructure] || internalStructure
  }

  /**
   * Validate time period format (accepts both internal and API formats)
   */
  isValidTimePeriod(timePeriod: string): boolean {
    const validPeriods = ['First Half', 'Third Quarter', 'Fourth Quarter']
    
    return validPeriods.includes(timePeriod)
  }

  /**
   * Get investment data with fallback logic (similar to backend)
   * This implements client-side fallback if needed
   */
  async getInvestmentDataWithFallback(year: number, timePeriod: string): Promise<{
    data: BusinessQuarterRow[]
    isFromPreviousQuarter: boolean
    previousQuarterSource?: string
  }> {
    try {
      // Try to get data for the requested period
      const data = await this.getInvestmentsByPeriod(year, timePeriod)
      
      if (data.length > 0) {
        return {
          data,
          isFromPreviousQuarter: false
        }
      }

      // If no data found, try fallback logic
      console.log(`No data found for ${timePeriod} ${year}, trying fallback...`)
      
      let fallbackYear = year
      let fallbackPeriod = ''
      
      if (timePeriod.toLowerCase() === 'first half') {
        // Fallback to Fourth Quarter of previous year
        fallbackYear = year - 1
        fallbackPeriod = 'forth quarter' // API format
      } else if (timePeriod.toLowerCase() === 'third quarter') {
        // Fallback to First Half of same year
        fallbackPeriod = 'first half' // API format
      } else if (timePeriod.toLowerCase() === 'forth quarter' || timePeriod.toLowerCase() === 'fourth quarter') {
        // Fallback to Third Quarter of same year
        fallbackPeriod = 'third quarter' // API format
      }

      if (fallbackPeriod) {
        const fallbackData = await this.getInvestmentsByPeriod(fallbackYear, fallbackPeriod)
        
        if (fallbackData.length > 0) {
          // Convert API format back to internal format for display
          const displayFallbackPeriod = this.convertToInternalFormat(fallbackPeriod)
          
          // Mark data as from previous quarter
          const markedData = fallbackData.map(row => ({
            ...row,
            isFromPreviousQuarter: true,
            previousQuarterSource: `${displayFallbackPeriod} ${fallbackYear}`
          }))

          return {
            data: markedData,
            isFromPreviousQuarter: true,
            previousQuarterSource: `${displayFallbackPeriod} ${fallbackYear}`
          }
        }
      }

      // No data found in fallback either
      return {
        data: [],
        isFromPreviousQuarter: false
      }

    } catch (error) {
      console.error('Error in getInvestmentDataWithFallback:', error)
      throw error
    }
  }

  /**
   * Test method to verify URL formatting (for development/debugging)
   */
  testUrlFormatting(): void {
    console.log('=== Testing URL Formatting ===')
    
    const testCases = [
      { internal: 'First Half', api: 'First Half' },
      { internal: 'Third Quarter', api: 'Third Quarter' },
      { internal: 'Fourth Quarter', api: 'Fourth Quarter' }
    ]
    
    testCases.forEach(testCase => {
      try {
        const converted = this.convertToApiFormat(testCase.internal)
        const params = new URLSearchParams({
          year: '2025',
          time_period: converted
        })
        const url = `/api/investment/period/?${params.toString()}`
        
        console.log(`${testCase.internal} -> ${converted} -> ${url}`)
        
        // Verify it matches expected format
        const expectedUrl = `/api/investment/period/?year=2025&time_period=${encodeURIComponent(testCase.api)}`
        const matches = url === expectedUrl
        console.log(`✓ Matches expected: ${matches}`)
        
      } catch (error) {
        console.error(`❌ Error with ${testCase.internal}:`, error)
      }
    })
    
    console.log('=== End URL Formatting Test ===')
  }
}

// Export singleton instance
export const investmentService = new InvestmentService()

// Expose test method for debugging
if (typeof window !== 'undefined') {
  (window as any).testInvestmentUrlFormatting = () => investmentService.testUrlFormatting()
}

export default investmentService
