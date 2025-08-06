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
  dataSource?: string // Data source ('admin' or 'company')
  isRowReadOnly?: boolean // Flag to indicate if row is read-only
  createdAt?: string
  updatedAt?: string
}

export interface QuarterData {
  [period: string]: BusinessQuarterRow[]
}

class DataService {
  private readonly STORAGE_KEY = 'pif_business_quarters_data'
  private readonly BACKUP_KEY = 'pif_business_quarters_backup'
  private readonly USER_DATA_KEY = 'pif_user_specific_data'
  private readonly USER_SAVE_STATUS_KEY = 'pif_user_save_status' // Track which users have saved to which quarters

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
    localStorage.removeItem(this.USER_DATA_KEY) // Clear user-specific data too
    localStorage.removeItem(this.USER_SAVE_STATUS_KEY) // Clear save status tracking
    console.log('All data cleared from localStorage including save status')
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
   * Reset user-specific data for testing
   */
  resetUserData(): void {
    localStorage.removeItem(this.USER_DATA_KEY)
    localStorage.removeItem(this.USER_SAVE_STATUS_KEY) // Also clear save status
    console.log('User-specific data and save status cleared from localStorage')
  }

  /**
   * Clear save status for all users (for testing purposes)
   */
  clearSaveStatus(): void {
    localStorage.removeItem(this.USER_SAVE_STATUS_KEY)
    console.log('Save status cleared from localStorage')
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
  generateId(): string {
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
   * Load user-specific data from localStorage
   */
  loadUserData(username: string): QuarterData {
    try {
      const userData = localStorage.getItem(this.USER_DATA_KEY)
      const allUserData = userData ? JSON.parse(userData) : {}
      return allUserData[username] || {}
    } catch (error) {
      console.error('Error loading user data from localStorage:', error)
      return {}
    }
  }

  /**
   * Save user-specific data to localStorage
   */
  saveUserData(username: string, data: QuarterData): void {
    try {
      const userData = localStorage.getItem(this.USER_DATA_KEY)
      const allUserData = userData ? JSON.parse(userData) : {}
      allUserData[username] = data
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(allUserData))
      console.log(`User data saved for ${username}`)
    } catch (error) {
      console.error('Error saving user data to localStorage:', error)
      throw new Error('Failed to save user data.')
    }
  }

  /**
   * Load user and period specific data
   */
  loadUserPeriodData(username: string, period: string): BusinessQuarterRow[] {
    const userData = this.loadUserData(username)
    return userData[period] || []
  }

  /**
   * Check if a user has saved data to a specific quarter
   */
  hasUserSavedToQuarter(username: string, period: string): boolean {
    try {
      const saveStatus = localStorage.getItem(this.USER_SAVE_STATUS_KEY)
      const status = saveStatus ? JSON.parse(saveStatus) : {}
      return !!(status[username] && status[username][period])
    } catch (error) {
      console.error('Error checking user save status:', error)
      return false
    }
  }

  /**
   * Mark that a user has saved data to a specific quarter
   */
  markUserSavedToQuarter(username: string, period: string): void {
    try {
      const saveStatus = localStorage.getItem(this.USER_SAVE_STATUS_KEY)
      const status = saveStatus ? JSON.parse(saveStatus) : {}
      
      if (!status[username]) {
        status[username] = {}
      }
      status[username][period] = new Date().toISOString()
      
      localStorage.setItem(this.USER_SAVE_STATUS_KEY, JSON.stringify(status))
      console.log(`Marked ${username} as saved to ${period}`)
    } catch (error) {
      console.error('Error marking user save status:', error)
    }
  }

  /**
   * Load user and period specific data with previous quarter fallback logic
   */
  loadUserPeriodDataWithFallback(username: string, period: string): {
    data: BusinessQuarterRow[],
    isFromPreviousQuarter: boolean,
    previousQuarterSource?: string
  } {
    console.log(`=== Loading data for ${username} in ${period} ===`)
    
    // Check if user has saved to this quarter
    const hasSavedToCurrentQuarter = this.hasUserSavedToQuarter(username, period)
    console.log(`${username} has saved to ${period}:`, hasSavedToCurrentQuarter)
    
    if (hasSavedToCurrentQuarter) {
      // User has saved to this quarter, load their saved data
      const savedData = this.loadUserPeriodData(username, period)
      console.log(`Loading saved data for ${username}: ${savedData.length} rows`)
      return {
        data: savedData,
        isFromPreviousQuarter: false
      }
    } else {
      // User hasn't saved to this quarter, load from previous quarter
      const previousQuarter = this.getPreviousQuarter(period)
      if (previousQuarter) {
        const previousData = this.loadUserPeriodData(username, previousQuarter)
        console.log(`Loading previous quarter data for ${username}: ${previousData.length} rows from ${previousQuarter}`)
        
        // Mark the data as from previous quarter and assign new IDs
        const adaptedData = previousData.map((row: BusinessQuarterRow) => ({
          ...row,
          id: this.generateId(),
          isModified: false,
          isNewRow: true,
          isFromPreviousQuarter: true,
          previousQuarterSource: previousQuarter,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
        
        return {
          data: adaptedData,
          isFromPreviousQuarter: true,
          previousQuarterSource: previousQuarter
        }
      } else {
        console.log(`No previous quarter found for ${period}`)
        return {
          data: [],
          isFromPreviousQuarter: false
        }
      }
    }
  }

  /**
   * Save user and period specific data
   */
  saveUserPeriodData(username: string, period: string, data: BusinessQuarterRow[]): void {
    // Filter out read-only rows to prevent accidental saving of other users' data
    // This is an extra layer of protection
    const editableDataOnly = data.filter(row => !row.isRowReadOnly)
    
    if (editableDataOnly.length !== data.length) {
      console.warn(`Filtered out ${data.length - editableDataOnly.length} read-only rows from save operation for ${username}`)
    }
    
    const userData = this.loadUserData(username)
    userData[period] = editableDataOnly.map(row => ({
      ...row,
      updatedAt: new Date().toISOString(),
      dataSource: username === 'PIF_SubmitIQ' ? 'admin' : 'company', // Ensure correct data source
      isRowReadOnly: false // When saving user's own data, it should never be read-only
    }))
    this.saveUserData(username, userData)
    
    // Mark that the user has saved to this quarter
    this.markUserSavedToQuarter(username, period)
    console.log(`Saved ${editableDataOnly.length} editable rows for ${username} to ${period}`)
  }

  /**
   * Get combined data for admin users (both admin and company data)
   */
  getCombinedDataForAdmin(period: string): BusinessQuarterRow[] {
    console.log('=== DEBUG: getCombinedDataForAdmin called ===')
    console.log('Period:', period)
    
    // Load admin's data with fallback logic (can load from previous quarter)
    const adminResult = this.loadUserPeriodDataWithFallback('PIF_SubmitIQ', period)
    console.log('Admin data length:', adminResult.data.length)
    console.log('Admin data is from previous quarter:', adminResult.isFromPreviousQuarter)
    
    // Load company's data ONLY from current quarter (no fallback to previous quarter)
    // Company data should only show what's been saved to current quarter
    const companyCurrentData = this.loadUserPeriodData('Company', period)
    console.log('Company current quarter data length:', companyCurrentData.length)
    console.log('Company data loaded from current quarter only (no fallback)')
    
    // Tag admin data as admin source
    const taggedAdminData = adminResult.data.map((row: BusinessQuarterRow) => ({ 
      ...row, 
      dataSource: 'admin',
      isRowReadOnly: false // Admin can always edit their own data
    }))
    
    // Tag company data as read-only (always read-only for admin user)
    const taggedCompanyData = companyCurrentData.map((row: BusinessQuarterRow) => ({ 
      ...row, 
      dataSource: 'company',
      isRowReadOnly: true // Company data is always read-only for admin
    }))
    
    const combinedData = [...taggedAdminData, ...taggedCompanyData]
    console.log('Combined data length:', combinedData.length)
    console.log('Combined data with read-only flags:', combinedData.map(row => ({ 
      entity: row.entityNameEnglish, 
      source: row.dataSource, 
      readOnly: row.isRowReadOnly 
    })))
    console.log('=== END DEBUG: getCombinedDataForAdmin ===')
    
    return combinedData
  }

  /**
   * Initialize user-specific sample data
   */
  initializeUserData(username: string): void {
    console.log('=== DEBUG: initializeUserData called ===')
    console.log('Username:', username)
    
    const existingData = this.loadUserData(username)
    console.log('Existing data periods:', Object.keys(existingData))
    
    if (Object.keys(existingData).length === 0) {
      console.log('No existing data found, initializing sample data for:', username)
      
      if (username === 'Company') {
        const companyData = this.getCompanySampleData()
        console.log('Company sample data periods:', Object.keys(companyData))
        console.log('Company sample data First Half 2025 length:', companyData['First Half 2025']?.length || 0)
        this.saveUserData(username, companyData)
        
        // Mark that Company has saved to First Half 2025 (since we just initialized sample data)
        this.markUserSavedToQuarter(username, 'First Half 2025')
        console.log('Marked Company as saved to First Half 2025')
      } else if (username === 'PIF_SubmitIQ') {
        const adminData = this.getAdminSampleData()
        console.log('Admin sample data periods:', Object.keys(adminData))
        console.log('Admin sample data First Half 2025 length:', adminData['First Half 2025']?.length || 0)
        this.saveUserData(username, adminData)
        
        // Mark that PIF_SubmitIQ has saved to First Half 2025 (since we just initialized sample data)
        this.markUserSavedToQuarter(username, 'First Half 2025')
        console.log('Marked PIF_SubmitIQ as saved to First Half 2025')
        
        // IMPORTANT: Also ensure Company user data is initialized
        // Admin users need to see Company data too
        console.log('Admin user detected - also initializing Company user data...')
        const companyData = this.loadUserData('Company')
        if (Object.keys(companyData).length === 0) {
          console.log('Company data not found, initializing it for Admin to access...')
          const companyDataSample = this.getCompanySampleData()
          this.saveUserData('Company', companyDataSample)
          // Also mark Company as saved to First Half 2025
          this.markUserSavedToQuarter('Company', 'First Half 2025')
          console.log('Company data initialized for Admin access and marked as saved')
        } else {
          console.log('Company data already exists - Admin can access it')
        }
      }
    } else {
      console.log('User already has data, skipping initialization')
      
      // Mark existing periods as saved for this user
      const existingPeriods = Object.keys(existingData)
      existingPeriods.forEach(period => {
        if (!this.hasUserSavedToQuarter(username, period)) {
          this.markUserSavedToQuarter(username, period)
          console.log(`Marked ${username} as saved to existing period: ${period}`)
        }
      })
      
      // If this is an admin user, also ensure Company data exists
      if (username === 'PIF_SubmitIQ') {
        console.log('Admin user with existing data - checking Company data availability...')
        const companyData = this.loadUserData('Company')
        if (Object.keys(companyData).length === 0) {
          console.log('Company data missing - initializing for Admin access...')
          const companyDataSample = this.getCompanySampleData()
          this.saveUserData('Company', companyDataSample)
          // Also mark Company as saved to First Half 2025
          this.markUserSavedToQuarter('Company', 'First Half 2025')
          console.log('Company data initialized for Admin access and marked as saved')
        } else {
          // Mark existing Company periods as saved
          const companyPeriods = Object.keys(companyData)
          companyPeriods.forEach(period => {
            if (!this.hasUserSavedToQuarter('Company', period)) {
              this.markUserSavedToQuarter('Company', period)
              console.log(`Marked Company as saved to existing period: ${period}`)
            }
          })
        }
      }
    }
    
    console.log('=== END DEBUG: initializeUserData ===')
  }

  /**
   * Get Company user sample data (3 fake rows for first half 2025)
   */
  private getCompanySampleData(): QuarterData {
    return {
      'First Half 2025': [
        {
          id: this.generateId(),
          entityNameEnglish: 'neom', // Matches dropdown value
          entityNameArabic: 'neom-ar', // Matches dropdown value
          commercialRegistrationNumber: 'CT2025001',
          moiNumber: '',
          countryOfIncorporation: 'USA',
          ownershipPercentage: 45,
          acquisitionDisposalDate: '2025-02-15',
          directParentEntity: '', // No parent - top level entity
          ultimateParentEntity: 'PIF',
          investmentRelationshipType: 'Subsidiary',
          ownershipStructure: 'Direct',
          principalActivities: 'Technology solutions and software development',
          currency: 'USD',
          isModified: false,
          isNewRow: false,
          dataSource: 'company',
          createdAt: new Date('2025-02-15').toISOString(),
          updatedAt: new Date('2025-02-15').toISOString()
        },
        {
          id: this.generateId(),
          entityNameEnglish: 'red-sea', // Matches dropdown value
          entityNameArabic: 'red-sea-ar', // Matches dropdown value
          commercialRegistrationNumber: 'GE2025002',
          moiNumber: '',
          countryOfIncorporation: 'DEU',
          ownershipPercentage: 60,
          acquisitionDisposalDate: '2025-04-10',
          directParentEntity: 'neom', // References first entity
          ultimateParentEntity: 'PIF',
          investmentRelationshipType: 'Joint venture',
          ownershipStructure: 'In-direct',
          principalActivities: 'Renewable energy development and clean technology',
          currency: 'EUR',
          isModified: false,
          isNewRow: false,
          dataSource: 'company',
          createdAt: new Date('2025-04-10').toISOString(),
          updatedAt: new Date('2025-04-10').toISOString()
        },
        {
          id: this.generateId(),
          entityNameEnglish: 'qiddiya', // Matches dropdown value
          entityNameArabic: 'qiddiya-ar', // Matches dropdown value
          commercialRegistrationNumber: 'FS2025003',
          moiNumber: '',
          countryOfIncorporation: 'GBR',
          ownershipPercentage: 30,
          acquisitionDisposalDate: '2025-06-01',
          directParentEntity: 'red-sea', // References second entity
          ultimateParentEntity: 'PIF',
          investmentRelationshipType: 'Associate',
          ownershipStructure: 'Direct',
          principalActivities: 'Investment banking and financial advisory services',
          currency: 'GBP',
          isModified: false,
          isNewRow: false,
          dataSource: 'company',
          createdAt: new Date('2025-06-01').toISOString(),
          updatedAt: new Date('2025-06-01').toISOString()
        }
      ]
    }
  }

  /**
   * Get Admin user sample data
   */
  private getAdminSampleData(): QuarterData {
    return {
      'First Half 2025': [
        {
          id: this.generateId(),
          assetCode: 'SA001',
          entityNameEnglish: 'saudi-aramco', // Matches dropdown value
          entityNameArabic: 'aramco-ar', // Matches dropdown value
          commercialRegistrationNumber: '2052101150',
          moiNumber: '7001234567',
          countryOfIncorporation: 'SAU',
          ownershipPercentage: 100,
          acquisitionDisposalDate: '2025-01-15',
          directParentEntity: '', // No parent - top level entity
          ultimateParentEntity: 'PIF',
          investmentRelationshipType: 'Subsidiary',
          ownershipStructure: 'Direct to PIF',
          principalActivities: 'Oil and gas exploration, production, refining, and marketing',
          currency: 'SAR',
          isModified: false,
          isNewRow: false,
          dataSource: 'admin',
          createdAt: new Date('2025-01-15').toISOString(),
          updatedAt: new Date('2025-01-15').toISOString()
        },
        {
          id: this.generateId(),
          assetCode: 'SA002',
          entityNameEnglish: 'sabic', // Matches dropdown value
          entityNameArabic: 'sabic-ar', // Matches dropdown value
          commercialRegistrationNumber: '2052101151',
          moiNumber: '7001234568',
          countryOfIncorporation: 'SAU',
          ownershipPercentage: 75,
          acquisitionDisposalDate: '2025-02-20',
          directParentEntity: 'saudi-aramco', // References first entity
          ultimateParentEntity: 'PIF',
          investmentRelationshipType: 'Joint venture',
          ownershipStructure: 'Direct to PIF',
          principalActivities: 'Petrochemicals, chemicals, and fertilizers manufacturing',
          currency: 'SAR',
          isModified: false,
          isNewRow: false,
          dataSource: 'admin',
          createdAt: new Date('2025-02-20').toISOString(),
          updatedAt: new Date('2025-02-20').toISOString()
        }
      ]
    }
  }

  /**
   * Get default sample data for initial setup (Legacy method - now points to admin data)
   */
  private getDefaultData(): QuarterData {
    return this.getAdminSampleData()
  }
}

// Export singleton instance
export const dataService = new DataService()
