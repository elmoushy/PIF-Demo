/**
 * Data Service for managing localStorage persistence
 * Simulates a backend database for the demo application
 */

export interface BusinessQuarterRow {
  id: string
  // 1. Asset Code - conditional
  assetCode?: string
  // 2. Entity Name (English)
  entityNameEnglish: string
  // 3. Entity Name (Arabic Legal Name)
  entityNameArabic: string
  // 4. Commercial Registration (CR) Number
  commercialRegistrationNumber: string
  // 5. Ministry of Interior (MOI) Number (700 Number)
  moiNumber?: string
  // 6. Country of Incorporation
  countryOfIncorporation: string
  // 7. Ownership Percentage (%)
  ownershipPercentage: number
  // 8. Acquisition or Disposal Date
  acquisitionDisposalDate?: string
  // 9. Direct Parent Entity
  directParentEntity: string
  // 10. Ultimate Parent Entity
  ultimateParentEntity: string
  // 11. Investment Relationship Type
  investmentRelationshipType: string
  // 12. Ownership Structure
  ownershipStructure: string
  // 13. Entity's Principal Activities
  principalActivities?: string
  // 14. Currency
  currency?: string
  
  // Metadata
  isModified?: boolean
  isNewRow?: boolean
  isFromPreviousQuarter?: boolean // Flag to indicate data loaded from previous quarter
  previousQuarterSource?: string // Source quarter name
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
      entityNameEnglish: `${row.entityNameEnglish} (Copy)`,
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
   * Get the previous quarter for a given quarter
   */
  getPreviousQuarter(currentPeriod: string): string | null {
    const quarterMap: Record<string, string | null> = {
      'First Half 2025': null, // No previous quarter
      'Quarter 3 2025': 'First Half 2025',
      'Quarter 4 2025': 'Quarter 3 2025'
    }
    
    return quarterMap[currentPeriod] || null
  }

  /**
   * Check if a quarter has saved data (is locked from editing previous quarters)
   */
  isQuarterSaved(period: string): boolean {
    const periodData = this.loadPeriodData(period)
    return periodData.some(row => !row.isNewRow)
  }

  /**
   * Get read-only status for a quarter based on future quarter saves
   */
  isQuarterReadOnly(period: string): boolean {
    const allQuarters = ['First Half 2025', 'Quarter 3 2025', 'Quarter 4 2025']
    const currentIndex = allQuarters.indexOf(period)
    
    if (currentIndex === -1) return false
    
    // Check if any future quarter has saved data
    for (let i = currentIndex + 1; i < allQuarters.length; i++) {
      if (this.isQuarterSaved(allQuarters[i])) {
        return true
      }
    }
    
    return false
  }

  /**
   * Load data from previous quarter for viewing (without saving to current quarter)
   */
  loadPreviousQuarterData(currentPeriod: string): BusinessQuarterRow[] {
    const previousQuarter = this.getPreviousQuarter(currentPeriod)
    
    if (!previousQuarter) {
      return [] // No previous quarter data available
    }
    
    const previousData = this.loadPeriodData(previousQuarter)
    
    // Return cloned data with new IDs and marked as viewing from previous quarter
    return previousData.map(row => ({
      ...row,
      id: this.generateId(), // New ID to avoid conflicts
      isModified: false,
      isNewRow: true, // Mark as new until explicitly saved
      isFromPreviousQuarter: true, // Flag to indicate source
      previousQuarterSource: previousQuarter,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
  }

  /**
   * Save quarter data and mark it as finalized
   */
  saveQuarterDataFinal(period: string, data: BusinessQuarterRow[]): void {
    const finalizedData = data.map(row => ({
      ...row,
      isNewRow: false, // Mark as saved
      isFromPreviousQuarter: false, // No longer from previous quarter
      updatedAt: new Date().toISOString()
    }))
    
    this.savePeriodData(period, finalizedData)
  }

  /**
   * Get default sample data for initial setup
   */
  private getDefaultData(): QuarterData {
    return {
      'First Half 2025': [
        {
          id: this.generateId(),
          assetCode: 'SA001',
          entityNameEnglish: 'saudi-aramco',
          entityNameArabic: 'aramco-ar',
          commercialRegistrationNumber: '2052101150',
          moiNumber: '7001234567',
          countryOfIncorporation: 'SAU',
          ownershipPercentage: 100,
          acquisitionDisposalDate: '2025-01-15',
          directParentEntity: 'sabic',
          ultimateParentEntity: 'Direct to PIF',
          investmentRelationshipType: 'subsidiary',
          ownershipStructure: 'public-listed',
          principalActivities: 'Oil and gas exploration, production, refining, and marketing',
          currency: 'SAR',
          isModified: false,
          isNewRow: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: this.generateId(),
          assetCode: 'SA002',
          entityNameEnglish: 'sabic',
          entityNameArabic: 'sabic-ar',
          commercialRegistrationNumber: '2052101151',
          moiNumber: '7001234568',
          countryOfIncorporation: 'ARE',
          ownershipPercentage: 75,
          acquisitionDisposalDate: '2025-02-20',
          directParentEntity: 'saudi-aramco',
          ultimateParentEntity: 'Direct to PIF',
          investmentRelationshipType: 'associate',
          ownershipStructure: 'private-limited',
          principalActivities: 'Petrochemicals, chemicals, and fertilizers manufacturing',
          currency: 'AED',
          isModified: false,
          isNewRow: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    }
  }
}

// Export singleton instance
export const dataService = new DataService()
