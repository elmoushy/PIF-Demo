/**
 * Report Service for generating Excel reports
 * Handles role-based data access and period comparison
 */

import * as XLSX from 'xlsx-js-style'
import { dataService } from './dataService'
import type { BusinessQuarterRow } from './dataService'

export interface ReportOptions {
  userRole: 'Administrator' | 'Company'
  username: string
  currentPeriod: string
  includeAllCompanies?: boolean // For Administrator: true = consolidated, false = specific company
  targetCompany?: string // For Administrator company-specific reports
  reportType?: 'full-data' | 'change-tracking' // New property for report type
}

export interface PeriodComparisonData {
  currentPeriod: string
  previousPeriod: string | null
  currentData: BusinessQuarterRow[]
  previousData: BusinessQuarterRow[]
}

class ReportService {
  /**
   * Generate Excel report based on user role and options
   */
  async generateExcelReport(options: ReportOptions): Promise<void> {
    try {
      // Get period comparison data
      const comparisonData = this.getPeriodComparisonData(options)
      
      // Create Excel workbook
      const workbook = XLSX.utils.book_new()
      
      // Generate main report sheet
      const reportSheet = this.createReportSheet(comparisonData, options)
      XLSX.utils.book_append_sheet(workbook, reportSheet, 'Report')
      
      // Add summary sheet if Administrator with consolidated report
      if (options.userRole === 'Administrator' && options.includeAllCompanies) {
        const summarySheet = this.createSummarySheet(comparisonData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      }
      
      // Generate filename
      const filename = this.generateFilename(options, comparisonData)
      
      // Download the file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      this.downloadExcelFile(excelBuffer, filename)
      
    } catch (error) {
      console.error('Report generation failed:', error)
      throw new Error('Failed to generate Excel report')
    }
  }

  /**
   * Get data for current and previous periods based on user role
   */
  private getPeriodComparisonData(options: ReportOptions): PeriodComparisonData {
    const currentPeriod = options.currentPeriod
    const previousPeriod = this.getPreviousPeriod(currentPeriod)
    
    let currentData: BusinessQuarterRow[] = []
    let previousData: BusinessQuarterRow[] = []
    
    if (options.userRole === 'Administrator') {
      if (options.includeAllCompanies) {
        // Consolidated report - get all companies data
        currentData = dataService.getCombinedDataForAdmin(currentPeriod)
        previousData = previousPeriod ? dataService.getCombinedDataForAdmin(previousPeriod) : []
      } else if (options.targetCompany) {
        // Company-specific report for Administrator
        currentData = dataService.loadUserPeriodData(options.targetCompany, currentPeriod)
        previousData = previousPeriod ? dataService.loadUserPeriodData(options.targetCompany, previousPeriod) : []
      } else {
        // Default to admin's own data
        currentData = dataService.loadUserPeriodData('PIF_SubmitIQ', currentPeriod)
        previousData = previousPeriod ? dataService.loadUserPeriodData('PIF_SubmitIQ', previousPeriod) : []
      }
    } else {
      // Company user - only their own data
      currentData = dataService.loadUserPeriodData(options.username, currentPeriod)
      previousData = previousPeriod ? dataService.loadUserPeriodData(options.username, previousPeriod) : []
    }
    
    return {
      currentPeriod,
      previousPeriod,
      currentData,
      previousData
    }
  }

  /**
   * Create the main report sheet with period comparison
   */
  private createReportSheet(data: PeriodComparisonData, options: ReportOptions): XLSX.WorkSheet {
    const values: any[][] = []
    const styles: { [key: string]: any } = {}
    
    // Report Header
    const reportTypeDisplay = options.reportType === 'full-data' ? 'Full Data Report' : 'Change Tracking Report'
    const scopeDisplay = options.includeAllCompanies ? 'Consolidated (All Companies)' : 'Company-Specific'
    
    values.push(['Business Quarters Report'])
    values.push([`Generated for: ${options.userRole === 'Administrator' ? 'Administrator (PIF_SubmitIQ)' : options.username}`])
    values.push([`Report Format: ${reportTypeDisplay}`])
    values.push([`Report Scope: ${scopeDisplay}`])
    values.push([`Current Period: ${data.currentPeriod}`])
    values.push([`Previous Period: ${data.previousPeriod || 'N/A'}`])
    values.push([`Generated on: ${new Date().toLocaleString()}`])
    values.push([]) // Empty row
    
    // Column headers with dual ownership percentage
    const headers = this.createHeaders(data.previousPeriod, data.currentPeriod)
    values.push(headers)
    
    // Data rows with period comparison
    const dataRows = this.createDataRows(data, styles, values.length, options.reportType)
    values.push(...dataRows)
    
    // Add change analysis sections if previous period data exists and report type is change-tracking
    if (data.previousPeriod && data.previousData.length > 0 && options.reportType !== 'full-data') {
      // Add Changes Section (Yellow Header)
      values.push([]) // Empty row
      values.push([]) // Empty row
      const changesSection = this.createChangesSection(data)
      values.push(...changesSection)
      
      // Add Deleted Records Section (Red Header)
      values.push([]) // Empty row
      values.push([]) // Empty row
      const deletedSection = this.createDeletedSection(data)
      values.push(...deletedSection)
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(values)
    
    // Apply styles
    this.applyWorksheetStyles(worksheet, styles, data, options.reportType)
    
    // Set column widths
    this.setColumnWidths(worksheet)
    
    return worksheet
  }

  /**
   * Create headers with dual ownership percentage columns
   */
  private createHeaders(previousPeriod: string | null, currentPeriod: string): string[] {
    const baseHeaders = [
      'Asset Code',
      'Entity Name (English)',
      'Entity Name (Arabic)',
      'CR Number',
      'MOI Number',
      'Country',
      'Acquisition Date',
      'Direct Parent',
      'Ultimate Parent',
      'Investment Type',
      'Ownership Structure',
      'Principal Activities',
      'Currency'
    ]
    
    // Insert dual ownership percentage columns
    const ownershipHeaders = []
    
    if (previousPeriod) {
      // Get the end dates for both periods
      const previousEndDate = this.getPeriodEndDate(previousPeriod)
      const currentEndDate = this.getPeriodEndDate(this.getCurrentPeriodFromPrevious(previousPeriod))
      
      ownershipHeaders.push(`Ownership % as at ${previousEndDate}`)
      ownershipHeaders.push(`Ownership % as at ${currentEndDate}`)
    } else {
      // Only current period
      const currentEndDate = this.getPeriodEndDate(currentPeriod)
      ownershipHeaders.push(`Ownership % as at ${currentEndDate}`)
    }
    
    // Insert ownership headers after Country (index 5)
    const result = [...baseHeaders]
    result.splice(6, 0, ...ownershipHeaders)
    
    return result
  }

  /**
   * Create data rows with period comparison
   */
  private createDataRows(data: PeriodComparisonData, styles: any, startRow: number, reportType?: 'full-data' | 'change-tracking'): any[][] {
    const rows: any[][] = []
    
    // Process current period data
    data.currentData.forEach((row, index) => {
      const dataRow = this.createSingleDataRow(row, data.previousData, data.previousPeriod !== null)
      rows.push(dataRow)
      
      // Apply styling for new/modified records
      this.applyRowStyles(styles, startRow + index, row, data.previousData, reportType)
    })
    
    return rows
  }

  /**
   * Create a single data row with ownership percentage comparison
   */
  private createSingleDataRow(currentRow: BusinessQuarterRow, previousData: BusinessQuarterRow[], hasPreviousPeriod: boolean): any[] {
    // Find matching row in previous data by Entity Name English and CR Number
    const previousRow = previousData.find(prev => 
      prev.entityNameEnglish === currentRow.entityNameEnglish &&
      prev.commercialRegistrationNumber === currentRow.commercialRegistrationNumber
    )
    
    const baseData = [
      currentRow.assetCode || '',
      currentRow.entityNameEnglish || '',
      currentRow.entityNameArabic || '',
      currentRow.commercialRegistrationNumber || '',
      currentRow.moiNumber || '',
      currentRow.countryOfIncorporation || '',
      currentRow.acquisitionDisposalDate || '',
      currentRow.directParentEntity || '',
      currentRow.ultimateParentEntity || '',
      currentRow.investmentRelationshipType || '',
      currentRow.ownershipStructure || '',
      currentRow.principalActivities || '',
      currentRow.currency || ''
    ]
    
    // Insert ownership percentages
    const ownershipData = []
    
    if (hasPreviousPeriod) {
      // Previous period ownership
      ownershipData.push(previousRow?.ownershipPercentage || 0)
      // Current period ownership
      ownershipData.push(currentRow.ownershipPercentage || 0)
    } else {
      // Only current period ownership
      ownershipData.push(currentRow.ownershipPercentage || 0)
    }
    
    // Insert ownership data after Country (index 5)
    const result = [...baseData]
    result.splice(6, 0, ...ownershipData.map(val => val.toString()))
    
    return result
  }

  /**
   * Create changes section with yellow header
   */
  private createChangesSection(data: PeriodComparisonData): any[][] {
    const values: any[][] = []
    
    // Section title
    values.push(['CHANGES BETWEEN QUARTERS'])
    values.push([`Changes from ${data.previousPeriod} to ${data.currentPeriod}`])
    values.push([]) // Empty row
    
    // Yellow header for changes
    const changesHeader = [
      'Entity Name (English)',
      'Field Changed',
      'Previous Value',
      'Current Value',
      'Change Type'
    ]
    values.push(changesHeader)
    
    // Find changes by comparing current and previous data using Entity Name as foreign key
    const changes = this.findChangesBetweenPeriods(data.currentData, data.previousData)
    
    if (changes.length === 0) {
      values.push(['No changes detected between periods', '', '', '', ''])
    } else {
      changes.forEach(change => {
        values.push([
          change.entityName,
          change.fieldChanged,
          change.previousValue,
          change.currentValue,
          change.changeType
        ])
      })
    }
    
    return values
  }

  /**
   * Create deleted records section with red header
   */
  private createDeletedSection(data: PeriodComparisonData): any[][] {
    const values: any[][] = []
    
    // Section title
    values.push(['DELETED RECORDS'])
    values.push([`Records removed from ${data.previousPeriod} to ${data.currentPeriod}`])
    values.push([]) // Empty row
    
    // Red header for deleted records
    const deletedHeader = [
      'Entity Name (English)',
      'Entity Name (Arabic)',
      'CR Number',
      'MOI Number',
      'Country',
      'Ownership %',
      'Investment Type'
    ]
    values.push(deletedHeader)
    
    // Find deleted records (entities that existed in previous period but not in current)
    const deletedRecords = this.findDeletedRecords(data.currentData, data.previousData)
    
    if (deletedRecords.length === 0) {
      values.push(['No records deleted between periods', '', '', '', '', '', ''])
    } else {
      deletedRecords.forEach(record => {
        values.push([
          record.entityNameEnglish || '',
          record.entityNameArabic || '',
          record.commercialRegistrationNumber || '',
          record.moiNumber || '',
          record.countryOfIncorporation || '',
          record.ownershipPercentage || '',
          record.investmentRelationshipType || ''
        ])
      })
    }
    
    return values
  }

  /**
   * Find changes between periods using Entity Name as foreign key
   */
  private findChangesBetweenPeriods(currentData: BusinessQuarterRow[], previousData: BusinessQuarterRow[]): Array<{
    entityName: string;
    fieldChanged: string;
    previousValue: string;
    currentValue: string;
    changeType: string;
  }> {
    const changes: Array<{
      entityName: string;
      fieldChanged: string;
      previousValue: string;
      currentValue: string;
      changeType: string;
    }> = []
    
    // Fields to monitor for changes
    const monitoredFields = [
      { key: 'entityNameArabic', label: 'Entity Name (Arabic)' },
      { key: 'commercialRegistrationNumber', label: 'CR Number' },
      { key: 'moiNumber', label: 'MOI Number' },
      { key: 'countryOfIncorporation', label: 'Country' },
      { key: 'ownershipPercentage', label: 'Ownership %' },
      { key: 'acquisitionDisposalDate', label: 'Acquisition Date' },
      { key: 'directParentEntity', label: 'Direct Parent' },
      { key: 'ultimateParentEntity', label: 'Ultimate Parent' },
      { key: 'investmentRelationshipType', label: 'Investment Type' },
      { key: 'ownershipStructure', label: 'Ownership Structure' },
      { key: 'principalActivities', label: 'Principal Activities' },
      { key: 'currency', label: 'Currency' }
    ]
    
    currentData.forEach(currentRow => {
      // Find matching record in previous data using Entity Name as foreign key
      const previousRow = previousData.find(prev => 
        prev.entityNameEnglish === currentRow.entityNameEnglish
      )
      
      if (previousRow) {
        // Compare each monitored field
        monitoredFields.forEach(field => {
          const currentValue = String((currentRow as any)[field.key] || '').trim()
          const previousValue = String((previousRow as any)[field.key] || '').trim()
          
          if (currentValue !== previousValue) {
            changes.push({
              entityName: currentRow.entityNameEnglish || 'Unknown Entity',
              fieldChanged: field.label,
              previousValue: previousValue || '(empty)',
              currentValue: currentValue || '(empty)',
              changeType: previousValue === '' ? 'Added' : currentValue === '' ? 'Removed' : 'Modified'
            })
          }
        })
      } else {
        // New record - not a change, but could be noted
        changes.push({
          entityName: currentRow.entityNameEnglish || 'Unknown Entity',
          fieldChanged: 'New Record',
          previousValue: '(not existed)',
          currentValue: '(new entity)',
          changeType: 'Added'
        })
      }
    })
    
    return changes
  }

  /**
   * Find records that were deleted between periods
   */
  private findDeletedRecords(currentData: BusinessQuarterRow[], previousData: BusinessQuarterRow[]): BusinessQuarterRow[] {
    return previousData.filter(previousRow => 
      // Record exists in previous period but not in current period (using Entity Name as foreign key)
      !currentData.some(currentRow => 
        currentRow.entityNameEnglish === previousRow.entityNameEnglish
      )
    )
  }

  /**
   * Apply row styles for highlighting changes
   */
  private applyRowStyles(styles: any, rowIndex: number, currentRow: BusinessQuarterRow, previousData: BusinessQuarterRow[], reportType?: 'full-data' | 'change-tracking'): void {
    const previousRow = previousData.find(prev => 
      prev.entityNameEnglish === currentRow.entityNameEnglish &&
      prev.commercialRegistrationNumber === currentRow.commercialRegistrationNumber
    )
    
    if (!previousRow) {
      // New record - highlight in bright vibrant green only for Change Tracking Report
      if (reportType === 'change-tracking') {
        for (let col = 0; col < 15; col++) { // Adjust based on actual column count
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col })
          styles[cellAddress] = { 
            fill: { patternType: 'solid', fgColor: { rgb: 'E8F5E8' } }, // Bright vibrant green for new additions
            border: {
              top: { style: 'thin', color: { rgb: 'CCCCCC' } },
              bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
              left: { style: 'thin', color: { rgb: 'CCCCCC' } },
              right: { style: 'thin', color: { rgb: 'CCCCCC' } }
            }
          }
        }
      }
    } else {
      // For Full Data Report, keep existing logic unchanged
      // For Change Tracking Report, remove the yellow highlighting for ownership changes
      if (reportType === 'full-data') {
        // Check for changes in ownership percentage - keep yellow highlighting for Full Data Report
        if (currentRow.ownershipPercentage !== previousRow.ownershipPercentage) {
          // Highlight ownership percentage columns in yellow
          const ownershipCols = [6, 7] // Adjusted positions after inserting ownership columns
          ownershipCols.forEach(col => {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col })
            styles[cellAddress] = { 
              fill: { patternType: 'solid', fgColor: { rgb: 'FFFF99' } },
              border: {
                top: { style: 'thin', color: { rgb: 'CCCCCC' } },
                bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                left: { style: 'thin', color: { rgb: 'CCCCCC' } },
                right: { style: 'thin', color: { rgb: 'CCCCCC' } }
              }
            }
          })
        }
      }
      // For Change Tracking Report: no additional styling for existing rows with changes
    }
  }

  /**
   * Create summary sheet for consolidated reports
   */
  private createSummarySheet(data: PeriodComparisonData): XLSX.WorkSheet {
    const values: any[][] = []
    
    values.push(['Summary Report'])
    values.push([`Period: ${data.currentPeriod}`])
    values.push([]) // Empty row
    
    // Company breakdown
    const companyStats = this.getCompanyStatistics(data.currentData)
    values.push(['Company Breakdown:'])
    values.push(['Company', 'Entities Count', 'Total Ownership %'])
    
    companyStats.forEach(stat => {
      values.push([stat.company, stat.count, stat.totalOwnership])
    })
    
    values.push([]) // Empty row
    
    // Period comparison if available
    if (data.previousPeriod && data.previousData.length > 0) {
      values.push(['Period Comparison:'])
      values.push(['Metric', data.previousPeriod, data.currentPeriod, 'Change'])
      values.push(['Total Entities', data.previousData.length, data.currentData.length, data.currentData.length - data.previousData.length])
      
      const prevTotalOwnership = data.previousData.reduce((sum, row) => sum + (row.ownershipPercentage || 0), 0)
      const currTotalOwnership = data.currentData.reduce((sum, row) => sum + (row.ownershipPercentage || 0), 0)
      values.push(['Total Ownership %', prevTotalOwnership.toFixed(2), currTotalOwnership.toFixed(2), (currTotalOwnership - prevTotalOwnership).toFixed(2)])
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(values)
    this.setColumnWidths(worksheet)
    
    return worksheet
  }

  /**
   * Get company statistics for summary
   */
  private getCompanyStatistics(data: BusinessQuarterRow[]): Array<{ company: string; count: number; totalOwnership: number }> {
    const companies = new Map<string, { count: number; totalOwnership: number }>()
    
    data.forEach(row => {
      const company = row.dataSource === 'admin' ? 'PIF_SubmitIQ' : 'Company'
      const existing = companies.get(company) || { count: 0, totalOwnership: 0 }
      
      companies.set(company, {
        count: existing.count + 1,
        totalOwnership: existing.totalOwnership + (row.ownershipPercentage || 0)
      })
    })
    
    return Array.from(companies.entries()).map(([company, stats]) => ({
      company,
      count: stats.count,
      totalOwnership: parseFloat(stats.totalOwnership.toFixed(2))
    }))
  }

  /**
   * Apply worksheet styles
   */
  private applyWorksheetStyles(worksheet: XLSX.WorkSheet, styles: any, data: PeriodComparisonData, reportType?: 'full-data' | 'change-tracking'): void {
    // Apply data row styles first
    Object.keys(styles).forEach(cellAddress => {
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' }
      }
      worksheet[cellAddress].s = styles[cellAddress]
    })
    
    // Get worksheet range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    // Apply main header styling - row 9 (0-indexed row 8)
    const headerRow = 8 // Headers are on row 9 (0-indexed row 8)
    this.applySelectiveHeaderStyling(worksheet, headerRow, range, data, reportType)
    
    // Find and style yellow headers (Changes section)
    this.findAndStyleSectionHeaders(worksheet, range, 'CHANGES BETWEEN QUARTERS', 'FFFF99') // Yellow
    
    // Find and style red headers (Deleted section)
    this.findAndStyleSectionHeaders(worksheet, range, 'DELETED RECORDS', 'FF9999') // Light red
  }

  /**
   * Apply selective header styling - only highlight headers when there are new records in Change Tracking Report
   */
  private applySelectiveHeaderStyling(worksheet: XLSX.WorkSheet, headerRow: number, range: XLSX.Range, data: PeriodComparisonData, reportType?: 'full-data' | 'change-tracking'): void {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col })
      
      // Ensure cell exists
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' }
      }
      
      let bgColor = 'F0F0F0' // Default light gray for all headers
      let textColor = '000000' // Black text
      
      // Determine header styling based on report type and presence of new records
      if (reportType === 'full-data') {
        // For Full Data Report, keep the original green styling for all headers
        bgColor = '90EE90' // Light green
        textColor = '000000' // Black text
      } else if (reportType === 'change-tracking' && this.hasNewRecords(data)) {
        // For Change Tracking Report, only apply bright green when there are new records
        bgColor = '00FF00' // Bright vibrant green to match new row highlighting
        textColor = '000000' // Black text
      }
      // Otherwise keep default gray styling for Change Tracking Report with no new records
      
      // Apply styling to header cells
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: textColor } },
        fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }
    }
  }

  /**
   * Check if there are new records in the current data
   */
  private hasNewRecords(data: PeriodComparisonData): boolean {
    if (!data.previousData || data.previousData.length === 0) {
      return true // All records are new if no previous data
    }
    
    return data.currentData.some(currentRow => {
      const previousRow = data.previousData.find(prev => 
        prev.entityNameEnglish === currentRow.entityNameEnglish &&
        prev.commercialRegistrationNumber === currentRow.commercialRegistrationNumber
      )
      return !previousRow // This is a new record
    })
  }

  /**
   * Apply header styling to a specific row
   */
  private applyHeaderStyling(worksheet: XLSX.WorkSheet, headerRow: number, range: XLSX.Range, bgColor: string): void {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col })
      
      // Ensure cell exists
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' }
      }
      
      // Determine text color based on background color
      const textColor = bgColor === 'FFFF99' ? '000000' : 'FFFFFF' // Black text for yellow, white for others
      
      // Apply styling to header cells
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: textColor } },
        fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }
    }
  }

  /**
   * Find and style section headers based on title text
   */
  private findAndStyleSectionHeaders(worksheet: XLSX.WorkSheet, range: XLSX.Range, titleText: string, bgColor: string): void {
    // Search for the title text in the worksheet
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 })
      const cell = worksheet[cellAddress]
      
      if (cell && cell.v && String(cell.v).includes(titleText)) {
        // Style the title row
        this.applySectionTitleStyling(worksheet, row, range, bgColor)
        
        // Find and style the header row (should be a few rows down)
        for (let headerRow = row + 1; headerRow <= Math.min(row + 5, range.e.r); headerRow++) {
          const headerCellAddress = XLSX.utils.encode_cell({ r: headerRow, c: 0 })
          const headerCell = worksheet[headerCellAddress]
          
          // Check if this looks like a header row (has column titles)
          if (headerCell && headerCell.v && 
              (String(headerCell.v).includes('Entity Name') || 
               String(headerCell.v).includes('Field Changed'))) {
            this.applyHeaderStyling(worksheet, headerRow, range, bgColor)
            break
          }
        }
        break
      }
    }
  }

  /**
   * Apply section title styling
   */
  private applySectionTitleStyling(worksheet: XLSX.WorkSheet, titleRow: number, range: XLSX.Range, bgColor: string): void {
    for (let col = range.s.c; col <= Math.min(range.s.c + 4, range.e.c); col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: titleRow, c: col })
      
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' }
      }
      
      const darkerBgColor = this.darkenColor(bgColor)
      // Use black text for yellow backgrounds, white for others
      const textColor = bgColor === 'FFFF99' ? '000000' : 'FFFFFF'
      
      worksheet[cellAddress].s = {
        font: { bold: true, size: 12, color: { rgb: textColor } },
        fill: { patternType: 'solid', fgColor: { rgb: darkerBgColor } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }
    }
  }

  /**
   * Darken a hex color for section titles
   */
  private darkenColor(hexColor: string): string {
    const colorMap: { [key: string]: string } = {
      'FFFF99': 'E6E600', // Yellow -> Darker yellow
      'FF9999': 'CC0000'  // Light red -> Dark red
    }
    return colorMap[hexColor] || hexColor
  }

  /**
   * Set column widths for better readability
   */
  private setColumnWidths(worksheet: XLSX.WorkSheet): void {
    const widths = [
      { wch: 12 }, // Asset Code
      { wch: 25 }, // Entity Name (English)
      { wch: 25 }, // Entity Name (Arabic)
      { wch: 18 }, // CR Number
      { wch: 15 }, // MOI Number
      { wch: 15 }, // Country
      { wch: 18 }, // Ownership % Previous
      { wch: 18 }, // Ownership % Current
      { wch: 15 }, // Acquisition Date
      { wch: 20 }, // Direct Parent
      { wch: 18 }, // Ultimate Parent
      { wch: 18 }, // Investment Type
      { wch: 18 }, // Ownership Structure
      { wch: 30 }, // Principal Activities
      { wch: 10 }  // Currency
    ]
    
    worksheet['!cols'] = widths
  }

  /**
   * Get previous period for a given current period
   */
  private getPreviousPeriod(currentPeriod: string): string | null {
    return dataService.getPreviousQuarter(currentPeriod)
  }

  /**
   * Get period end date for display
   */
  private getPeriodEndDate(period: string): string {
    const year = period.split(' ').pop() || '2025'
    
    if (period.includes('First Half')) {
      return `30 Jun ${year}`
    } else if (period.includes('Quarter 3')) {
      return `30 Sep ${year}`
    } else if (period.includes('Quarter 4')) {
      return `31 Dec ${year}`
    }
    
    return `30 Jun ${year}` // Default
  }

  /**
   * Get current period from previous period (helper method)
   */
  private getCurrentPeriodFromPrevious(previousPeriod: string): string {
    const year = previousPeriod.split(' ').pop() || '2025'
    
    if (previousPeriod.includes('First Half')) {
      return `Quarter 3 ${year}`
    } else if (previousPeriod.includes('Quarter 3')) {
      return `Quarter 4 ${year}`
    } else if (previousPeriod.includes('Quarter 4')) {
      const nextYear = (parseInt(year) + 1).toString()
      return `First Half ${nextYear}`
    }
    
    return `Quarter 3 ${year}` // Default
  }

  /**
   * Generate filename for the Excel report
   */
  private generateFilename(options: ReportOptions, data: PeriodComparisonData): string {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const period = data.currentPeriod.replace(/\s/g, '-')
    const reportFormat = options.reportType === 'full-data' ? 'Full-Data' : 'Change-Tracking'
    
    if (options.userRole === 'Administrator') {
      if (options.includeAllCompanies) {
        return `PIF-Consolidated-${reportFormat}-Report-${period}-${timestamp}.xlsx`
      } else {
        const company = options.targetCompany || 'PIF-SubmitIQ'
        return `PIF-Company-${reportFormat}-Report-${company}-${period}-${timestamp}.xlsx`
      }
    } else {
      return `Company-${reportFormat}-Report-${period}-${timestamp}.xlsx`
    }
  }

  /**
   * Download Excel file
   */
  private downloadExcelFile(buffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}

// Export singleton instance
export const reportService = new ReportService()
