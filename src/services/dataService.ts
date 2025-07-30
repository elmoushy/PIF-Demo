/**
 * Data Service for managing localStorage persistence
 * Simulates a backend database for the demo application
 */

export interface BusinessQuarterRow {
  id: string
  companyName: string
  reportingPeriod: string
  currency: string
  relatedParties: string
  arabicLegalName: string
  relationship: string
  directParent: string
  percentOwnership: string
  countryOfIncorporation: string
  commercialRegistrationNumber: string
  isModified?: boolean
  isNewRow?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface QuarterData {
  [period: string]: BusinessQuarterRow[]
}

class DataService {
  private readonly STORAGE_KEY = 'pif_business_quarters_data'
  private readonly BACKUP_KEY = 'pif_business_quarters_backup'

  /**
   * Initialize localStorage with default data if not exists
   */
  initializeData(): QuarterData {
    const existingData = this.loadAllData()
    
    if (Object.keys(existingData).length === 0) {
      const defaultData = this.getDefaultData()
      this.saveAllData(defaultData)
      return defaultData
    }
    
    return existingData
  }

  /**
   * Load all quarter data from localStorage
   */
  loadAllData(): QuarterData {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
      return this.loadBackupData()
    }
  }

  /**
   * Save all quarter data to localStorage
   */
  saveAllData(data: QuarterData): void {
    try {
      // Create backup before saving
      this.createBackup(data)
      
      // Add timestamps to all rows
      const timestampedData: QuarterData = {}
      Object.entries(data).forEach(([period, rows]) => {
        timestampedData[period] = rows.map(row => ({
          ...row,
          updatedAt: new Date().toISOString()
        }))
      })
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(timestampedData))
      console.log('Data saved to localStorage successfully')
    } catch (error) {
      console.error('Error saving data to localStorage:', error)
      throw new Error('Failed to save data. Please check your browser storage settings.')
    }
  }

  /**
   * Load data for a specific period
   */
  loadPeriodData(period: string): BusinessQuarterRow[] {
    const allData = this.loadAllData()
    return allData[period] || []
  }

  /**
   * Save data for a specific period
   */
  savePeriodData(period: string, data: BusinessQuarterRow[]): void {
    const allData = this.loadAllData()
    allData[period] = data.map(row => ({
      ...row,
      updatedAt: new Date().toISOString()
    }))
    this.saveAllData(allData)
  }

  /**
   * Add a new row to a specific period
   */
  addRow(period: string, row: Omit<BusinessQuarterRow, 'id' | 'createdAt' | 'updatedAt'>): BusinessQuarterRow {
    const newRow: BusinessQuarterRow = {
      ...row,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const periodData = this.loadPeriodData(period)
    periodData.push(newRow)
    this.savePeriodData(period, periodData)
    
    return newRow
  }

  /**
   * Update an existing row
   */
  updateRow(period: string, rowId: string, updates: Partial<BusinessQuarterRow>): boolean {
    const periodData = this.loadPeriodData(period)
    const rowIndex = periodData.findIndex(row => row.id === rowId)
    
    if (rowIndex === -1) return false
    
    periodData[rowIndex] = {
      ...periodData[rowIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    this.savePeriodData(period, periodData)
    return true
  }

  /**
   * Delete rows by IDs
   */
  deleteRows(period: string, rowIds: string[]): boolean {
    const periodData = this.loadPeriodData(period)
    const filteredData = periodData.filter(row => !rowIds.includes(row.id))
    
    if (filteredData.length === periodData.length) return false
    
    this.savePeriodData(period, filteredData)
    return true
  }

  /**
   * Duplicate rows
   */
  duplicateRows(period: string, rowIds: string[]): BusinessQuarterRow[] {
    const periodData = this.loadPeriodData(period)
    const rowsToDuplicate = periodData.filter(row => rowIds.includes(row.id))
    
    const duplicatedRows = rowsToDuplicate.map(row => ({
      ...row,
      id: this.generateId(),
      companyName: `${row.companyName} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isModified: true,
      isNewRow: true
    }))
    
    const updatedData = [...periodData, ...duplicatedRows]
    this.savePeriodData(period, updatedData)
    
    return duplicatedRows
  }

  /**
   * Copy data from one period to another
   */
  copyPeriodData(fromPeriod: string, toPeriod: string): BusinessQuarterRow[] {
    const sourceData = this.loadPeriodData(fromPeriod)
    
    const copiedData = sourceData.map(row => ({
      ...row,
      id: this.generateId(),
      reportingPeriod: toPeriod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isModified: true,
      isNewRow: true
    }))
    
    this.savePeriodData(toPeriod, copiedData)
    return copiedData
  }

  /**
   * Get available periods with data counts
   */
  getAvailablePeriods(): { period: string; count: number }[] {
    const allData = this.loadAllData()
    return Object.entries(allData).map(([period, data]) => ({
      period,
      count: data.length
    }))
  }

  /**
   * Export data for backup or reporting
   */
  exportData(): string {
    const allData = this.loadAllData()
    return JSON.stringify(allData, null, 2)
  }

  /**
   * Import data from backup or external source
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      this.saveAllData(data)
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  /**
   * Clear all data (for testing purposes)
   */
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.BACKUP_KEY)
    console.log('All data cleared from localStorage')
  }

  /**
   * Reset data to default sample data (useful for development/testing)
   */
  resetToDefaultData(): QuarterData {
    this.clearAllData()
    const defaultData = this.getDefaultData()
    this.saveAllData(defaultData)
    console.log('Data reset to default sample data')
    return defaultData
  }

  /**
   * Create backup of current data
   */
  private createBackup(data: QuarterData): void {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        data
      }
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup))
    } catch (error) {
      console.warn('Failed to create backup:', error)
    }
  }

  /**
   * Load backup data if main data is corrupted
   */
  private loadBackupData(): QuarterData {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY)
      if (backup) {
        const parsed = JSON.parse(backup)
        console.warn('Loaded backup data due to main data corruption')
        return parsed.data || {}
      }
    } catch (error) {
      console.error('Backup data also corrupted:', error)
    }
    return {}
  }

  /**
   * Generate unique ID for new rows
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get default sample data for initial setup
   */
  private getDefaultData(): QuarterData {
    const currentYear = new Date().getFullYear()
    
    return {
      [`Q1 ${currentYear}`]: [
        {
          id: this.generateId(),
          companyName: 'Saudi Aramco',
          reportingPeriod: `Q1 ${currentYear}`,
          currency: 'SAR',
          relatedParties: 'Government Entity',
          arabicLegalName: 'شركة أرامكو السعودية',
          relationship: 'Subsidiary',
          directParent: 'Public Investment Fund',
          percentOwnership: '100',
          countryOfIncorporation: 'Saudi Arabia',
          commercialRegistrationNumber: '2052101150',
          isModified: false,
          isNewRow: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: this.generateId(),
          companyName: 'NEOM Technology',
          reportingPeriod: `Q1 ${currentYear}`,
          currency: 'USD',
          relatedParties: 'Joint Venture',
          arabicLegalName: 'شركة نيوم للتكنولوجيا',
          relationship: 'Joint Venture',
          directParent: 'NEOM Company',
          percentOwnership: '51',
          countryOfIncorporation: 'Saudi Arabia',
          commercialRegistrationNumber: '2052101151',
          isModified: false,
          isNewRow: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: this.generateId(),
          companyName: 'Saudi Green Initiative',
          reportingPeriod: `Q1 ${currentYear}`,
          currency: 'SAR',
          relatedParties: 'Environmental Entity',
          arabicLegalName: 'مبادرة السعودية الخضراء',
          relationship: 'Subsidiary',
          directParent: 'Crown Prince Foundation',
          percentOwnership: '100',
          countryOfIncorporation: 'Saudi Arabia',
          commercialRegistrationNumber: '2052101152',
          isModified: false,
          isNewRow: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: this.generateId(),
          companyName: 'Al Rajhi Bank',
          reportingPeriod: `Q1 ${currentYear}`,
          currency: 'SAR',
          relatedParties: 'Financial Institution',
          arabicLegalName: 'مصرف الراجحي',
          relationship: 'Associate',
          directParent: 'Al Rajhi Banking Group',
          percentOwnership: '25',
          countryOfIncorporation: 'Saudi Arabia',
          commercialRegistrationNumber: '1010001054',
          isModified: false,
          isNewRow: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: this.generateId(),
          companyName: 'Emirates NBD',
          reportingPeriod: `Q1 ${currentYear}`,
          currency: 'AED',
          relatedParties: 'Regional Partner',
          arabicLegalName: 'بنك الإمارات دبي الوطني',
          relationship: 'Joint Venture',
          directParent: 'Emirates Investment Authority',
          percentOwnership: '30',
          countryOfIncorporation: 'United Arab Emirates',
          commercialRegistrationNumber: '1014548',
          isModified: false,
          isNewRow: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: this.generateId(),
          companyName: 'Qatar Petroleum International',
          reportingPeriod: `Q1 ${currentYear}`,
          currency: 'QAR',
          relatedParties: 'Energy Consortium',
          arabicLegalName: 'قطر للبترول الدولية',
          relationship: 'Strategic Partnership',
          directParent: 'Qatar Energy',
          percentOwnership: '20',
          countryOfIncorporation: 'Qatar',
          commercialRegistrationNumber: '45123',
          isModified: false,
          isNewRow: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      [`Q2 ${currentYear}`]: [],
      [`Q3 ${currentYear}`]: [],
      [`Q4 ${currentYear}`]: [],
      [`Q1 ${currentYear - 1}`]: [],
      [`Q2 ${currentYear - 1}`]: [],
      [`Q3 ${currentYear - 1}`]: [],
      [`Q4 ${currentYear - 1}`]: []
    }
  }
}

// Export singleton instance
export const dataService = new DataService()
