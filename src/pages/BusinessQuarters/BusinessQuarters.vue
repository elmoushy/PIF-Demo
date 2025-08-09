<template>
  <div :class="styles.businessQuartersPage">
    <Header />
    
    <main :class="styles.mainContent">
      <!-- Filter Bar -->
      <FilterBar 
        v-model="selectedPeriod"
        @search="handleSearch"
        @filter="handleFilter"
        @clearFilters="handleClearFilters"
        @periodChanged="handlePeriodChange"
      />


      <!-- Data Table -->
      <DataTable 
        :data="paginatedData"
        :columns="tableColumns"
        :loading="loading"
        :currentPeriod="selectedPeriod"
        :readOnly="isCurrentQuarterReadOnly"
        :hasDataFromPreviousQuarter="hasDataFromPreviousQuarter"
        :userRole="currentUser?.role"
        table-id="business-quarters-table"
        @addRow="handleAddRow"
        @saveChanges="handleSaveChanges"
        @generateReport="handleGenerateReport"
        @createInForm="handleCreateInForm"
        @copyFromAnotherQuarter="handleCopyFromAnotherQuarter"
        @viewRow="handleViewRow"
        @editRow="handleEditRow"
        @duplicateRow="handleDuplicateRow"
        @rowModified="handleRowModified"
        @deleteUnsavedRow="handleDeleteUnsavedRow"
        @bulkDelete="handleBulkDelete"
        @bulkDuplicate="handleBulkDuplicate"
        @validationChange="handleValidationChange"
        @xlsxUpload="handleXlsxUpload"
      />

      <!-- Pagination -->
      <Pagination 
        :currentPage="currentPage"
        :totalItems="filteredData.length"
        :itemsPerPage="itemsPerPage"
        @changePage="handlePageChange"
        @updateItemsPerPage="handleItemsPerPageChange"
      />
    </main>

    <!-- Data Modal -->
    <DataModal
      :isOpen="modalState.isOpen"
      :mode="modalState.mode"
      :columns="tableColumns"
      :data="modalState.data"
      :tableData="tableData"
      :userRole="currentUser?.role"
      @close="closeModal"
      @submit="handleModalSubmit"
    />

    <!-- Quarter Copy Modal -->
    <QuarterCopyModal
      :isOpen="copyModalState.isOpen"
      :currentPeriod="selectedPeriod"
      :availableData="allQuarterData"
      @close="closeCopyModal"
      @copyData="handleCopyData"
    />

    <!-- Report Modal -->
    <ReportModal
      :isOpen="reportModalState.isOpen"
      :userRole="currentUser?.role || 'Company'"
      :username="currentUser?.username || ''"
      :currentPeriod="selectedPeriod"
      @close="closeReportModal"
      @reportGenerated="handleReportGenerated"
    />

    <!-- Notification Container -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/useAuthStore'
import { dataService, type BusinessQuarterRow } from '../../services/dataService'
import { notificationService } from '../../services/notificationService'
import Header from '../../components/Header/Header.vue'
// import QuarterSelector from '../../components/QuarterSelector/QuarterSelector.vue'
import FilterBar from '../../components/FilterBar/FilterBar.vue'
import DataTable from '../../components/DataTable/DataTable.vue'
import Pagination from '../../components/Pagination/Pagination.vue'
import DataModal from '../../components/DataModal/DataModal.vue'
import QuarterCopyModal from '../../components/QuarterCopyModal/QuarterCopyModal.vue'
import ReportModal from '../../components/ReportModal/ReportModal.vue'
import NotificationContainer from '../../components/NotificationContainer/NotificationContainer.vue'
import styles from './BusinessQuarters.module.css'

const authStore = useAuthStore()

// State
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const filters = ref<Record<string, string>>({})
const currentQuarter = ref(1)
const currentYear = ref(new Date().getFullYear())
const selectedPeriod = ref('First Half 2025')

// Data state - using localStorage through dataService
const tableData = ref<BusinessQuarterRow[]>([])
const allQuarterData = ref<Record<string, BusinessQuarterRow[]>>({})

// Modal state
const modalState = ref({
  isOpen: false,
  mode: 'view' as 'view' | 'edit' | 'create',
  data: undefined as Record<string, any> | undefined
})

// Copy modal state
const copyModalState = ref({
  isOpen: false
})

// Report modal state
const reportModalState = ref({
  isOpen: false
})

// Validation state
const hasValidationErrors = ref(false)
const validationErrorCount = ref(0)

// Current user from auth store
const currentUser = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)

// Table configuration based on user role and new requirements
const tableColumns = computed(() => {
  const columns = [
    // 1. Asset Code - conditional visibility (only for Admin/PIF_SubmitIQ)
    ...(isAdmin.value ? [{ 
      key: 'assetCode', 
      editable: true, 
      required: false,
      type: 'text'
    }] : []),
    
    // 2. Entity Name (English) - dropdown, english text only
    { 
      key: 'entityNameEnglish', 
      editable: true, 
      required: true,
      type: 'dropdown',
      validation: 'english'
    },
    
    // 3. Entity Name (Arabic Legal Name) - dropdown, arabic text only
    { 
      key: 'entityNameArabic', 
      editable: true, 
      required: true,
      type: 'dropdown',
      validation: 'arabic'
    },
    
    // 4. Commercial Registration (CR) Number
    { 
      key: 'commercialRegistrationNumber', 
      editable: true, 
      required: true,
      type: 'text',
      validation: 'conditional'
    },
    
    // 5. Ministry of Interior (MOI) Number (700 Number)
    { 
      key: 'moiNumber', 
      editable: true, 
      required: false,
      type: 'text',
      validation: 'conditional'
    },
    
    // 6. Country of Incorporation
    { 
      key: 'countryOfIncorporation', 
      editable: true, 
      required: true,
      type: 'dropdown'
    },
    
    // 7. Ownership Percentage (%)
    { 
      key: 'ownershipPercentage', 
      editable: true, 
      required: true,
      type: 'number',
      min: 0,
      max: 100
    },
    
    // 8. Acquisition or Disposal Date
    { 
      key: 'acquisitionDisposalDate', 
      editable: true, 
      required: false,
      type: 'date'
    },
    
    // 9. Direct Parent Entity - dropdown from existing entities
    { 
      key: 'directParentEntity', 
      editable: true, 
      required: true,
      type: 'dropdown',
      validation: 'entityReference'
    },
    
    // 10. Ultimate Parent Entity - always "PIF"
    { 
      key: 'ultimateParentEntity', 
      editable: false, 
      required: true,
      type: 'text',
      defaultValue: 'PIF'
    },
    
    // 11. Investment Relationship Type
    { 
      key: 'investmentRelationshipType', 
      editable: true, 
      required: true,
      type: 'dropdown'
    },
    
    // 12. Ownership Structure (Direct or Indirect)
    { 
      key: 'ownershipStructure', 
      editable: true, 
      required: true,
      type: 'dropdown',
      userRole: currentUser.value?.role // Pass user role for conditional rendering
    },
    
    // 13. Entity's Principal Activities
    { 
      key: 'principalActivities', 
      editable: true, 
      required: false,
      type: 'textarea'
    }
  ]
  
  return columns
})

// Dropdown options (Legacy - moved to DataTable component)
// const dropdownOptions = {
//   // Entity names - these would typically come from a service/API
//   entityNames: [
//     { value: 'Saudi Aramco', label: 'Saudi Aramco' },
//     { value: 'SABIC', label: 'SABIC' },
//     { value: 'Al Rajhi Bank', label: 'Al Rajhi Bank' },
//     { value: 'Saudi Telecom Company', label: 'Saudi Telecom Company' },
//     { value: 'Ma\'aden', label: 'Ma\'aden' }
//   ],
//   
//   // Arabic entity names
//   entityNamesArabic: [
//     { value: 'أرامكو السعودية', label: 'أرامكو السعودية' },
//     { value: 'سابك', label: 'سابك' },
//     { value: 'مصرف الراجحي', label: 'مصرف الراجحي' },
//     { value: 'شركة الاتصالات السعودية', label: 'شركة الاتصالات السعودية' },
//     { value: 'معادن', label: 'معادن' }
//   ],
//   
//   // Investment relationship types
//   investmentRelationshipTypes: [
//     { value: 'Subsidiary', label: 'Subsidiary' },
//     { value: 'Joint venture', label: 'Joint venture' },
//     { value: 'Associate', label: 'Associate' },
//     { value: 'Subsidiary of Associate', label: 'Subsidiary of Associate' },
//     { value: 'Joint Venture of Associate', label: 'Joint Venture of Associate' },
//     { value: 'Associate of Associate', label: 'Associate of Associate' },
//     { value: 'Subsidiary of a JV', label: 'Subsidiary of a JV' },
//     { value: 'Associate of a JV', label: 'Associate of a JV' },
//     { value: 'Joint Venture of a JV', label: 'Joint Venture of a JV' }
//   ],
//   
//   // Ownership structure options
//   ownershipStructure: [
//     { value: 'Direct and In-Direct', label: 'Direct and In-Direct' },
//     { value: 'PIF', label: 'PIF' }
//   ]
// }

// Validation functions (Legacy - moved to DataTable component)
// const validateField = (field: string, value: any, rowData: any) => {
//   const errors: string[] = []
//   
//   switch (field) {
//     case 'entityNameEnglish':
//       if (value && !/^[a-zA-Z0-9\s&.'()-]+$/.test(value)) {
//         errors.push('Entity name must contain only English characters, numbers, and common symbols')
//       }
//       break
//       
//     case 'entityNameArabic':
//       if (value && !/^[\u0600-\u06FF\s\u0660-\u0669.-]+$/.test(value)) {
//         errors.push('Arabic legal name must contain only Arabic characters and numbers')
//       }
//       break
//       
//     case 'commercialRegistrationNumber':
//       if (rowData.countryOfIncorporation === 'SAU') {
//         if (value && !/^\d+$/.test(value)) {
//           errors.push('CR number must be numbers only for Saudi entities')
//         }
//       }
//       break
//       
//     case 'moiNumber':
//       // MOI Number is only required for Saudi entities
//       if (rowData.countryOfIncorporation === 'SAU') {
//         if (!value || value.trim() === '') {
//           errors.push('MOI number is required for Saudi entities')
//         } else if (!/^\d+$/.test(value)) {
//           errors.push('MOI number must be numbers only for Saudi entities')
//         }
//       }
//       break
//       
//     case 'ownershipPercentage':
//       const percentage = parseFloat(value)
//       if (isNaN(percentage) || percentage < 0 || percentage > 100) {
//         errors.push('Ownership percentage must be between 0 and 100')
//       }
//       break
//       
//     case 'directParentEntity':
//       // Validate that direct parent exists in other rows
//       if (value) {
//         const existsInData = tableData.value.some(row => 
//           row.entityNameEnglish === value && row.id !== rowData.id
//         )
//         if (!existsInData) {
//           errors.push('Direct parent entity must exist as an Entity Name in another row')
//         }
//       }
//       break
//   }
//   
//   return errors
// }

// Helper function to check if MOI field is required based on country (Legacy - moved to DataTable component)
// const isMoiRequired = (countryOfIncorporation: string) => {
//   return countryOfIncorporation === 'SAU'
// }

// Get available direct parent options (from existing entity names) (Legacy - moved to DataTable component)
// const getDirectParentOptions = computed(() => {
//   const entityNames = tableData.value
//     .map(row => row.entityNameEnglish)
//     .filter(name => name && name.trim())
//     .map(name => ({ value: name, label: name }))
//   
//   // Remove duplicates
//   const uniqueNames = entityNames.filter((item, index, arr) => 
//     arr.findIndex(i => i.value === item.value) === index
//   )
//   
//   return uniqueNames
// })

// Computed properties
const filteredData = computed(() => {
  let filtered = tableData.value

  // Apply search filter - search across all text fields
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(row => {
      const searchableFields = [
        row.entityNameEnglish,
        row.entityNameArabic,
        row.commercialRegistrationNumber,
        row.directParentEntity,
        row.investmentRelationshipType,
        row.principalActivities,
        row.countryOfIncorporation
      ]
      
      return searchableFields.some(value => 
        String(value).toLowerCase().includes(query)
      )
    })
  }

  // Apply filter dropdown filters
  Object.entries(filters.value).forEach(([filterType, filterValue]) => {
    if (filterValue) {
      switch (filterType) {
        case 'country':
        case 'countryOfIncorporation':
          filtered = filtered.filter(row => 
            row.countryOfIncorporation.toLowerCase().includes(filterValue.toLowerCase())
          )
          break
        case 'investmentRelationshipType':
          filtered = filtered.filter(row => 
            row.investmentRelationshipType.toLowerCase().includes(filterValue.toLowerCase())
          )
          break
        default:
          // Generic filter for any other field
          filtered = filtered.filter(row => 
            String((row as any)[filterType]).toLowerCase().includes(filterValue.toLowerCase())
          )
      }
    }
  })

  return filtered
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredData.value.slice(start, end)
})

// Quarter progression computed properties
const isCurrentQuarterReadOnly = computed(() => {
  return dataService.isQuarterReadOnly(selectedPeriod.value)
})

const hasDataFromPreviousQuarter = computed(() => {
  return tableData.value.some(row => row.isFromPreviousQuarter)
})

// Event handlers
const handlePeriodChange = (period: string, quarter: number, year: number) => {
  // Save current data to localStorage before switching periods
  if (selectedPeriod.value && tableData.value.some(row => row.isModified) && currentUser.value?.username) {
    try {
      // Filter out read-only rows to prevent saving them to current user's data
      const editableDataOnly = tableData.value.filter(row => !row.isRowReadOnly)
      
      if (editableDataOnly.length > 0) {
        dataService.saveUserPeriodData(currentUser.value.username, selectedPeriod.value, editableDataOnly)
        // Update allQuarterData for the modal with editable data only
        allQuarterData.value[selectedPeriod.value] = [...editableDataOnly]
        console.log(`Auto-saved ${editableDataOnly.length} editable rows for ${currentUser.value.username} before period change`)
      }
    } catch (error) {
      notificationService.error('Save Failed', 'Failed to save changes. Please try again.')
      return
    }
  }
  
  selectedPeriod.value = period
  currentQuarter.value = quarter
  currentYear.value = year
  
  // Load data for the new period from localStorage
  try {
    let periodData: BusinessQuarterRow[] = []
    let isFromPreviousQuarter = false
    let previousQuarterSource: string | undefined
    
    if (currentUser.value?.username) {
      // Initialize user data if it doesn't exist
      dataService.initializeUserData(currentUser.value.username)
      
      if (isAdmin.value) {
        // For admin users, load combined data (both admin and company data)
        console.log('=== LOADING COMBINED DATA FOR ADMIN ===')
        periodData = dataService.getCombinedDataForAdmin(period)
        console.log('Admin loaded combined data length:', periodData.length)
        
        // Check if admin's data OR company's data is from previous quarter
        const adminResult = dataService.loadUserPeriodDataWithFallback('PIF_SubmitIQ', period)
        const companyResult = dataService.loadUserPeriodDataWithFallback('Company', period)
        
        if (adminResult.isFromPreviousQuarter || companyResult.isFromPreviousQuarter) {
          isFromPreviousQuarter = true
          // Use the admin's source if available, otherwise company's source
          previousQuarterSource = adminResult.previousQuarterSource || companyResult.previousQuarterSource
        }
      } else {
        // For company users, use the new fallback logic
        console.log('=== LOADING COMPANY DATA WITH FALLBACK ===')
        const companyResult = dataService.loadUserPeriodDataWithFallback(currentUser.value.username, period)
        periodData = companyResult.data
        isFromPreviousQuarter = companyResult.isFromPreviousQuarter
        previousQuarterSource = companyResult.previousQuarterSource
        console.log('Company loaded data length:', periodData.length)
        console.log('Company data is from previous quarter:', isFromPreviousQuarter)
      }
    }
    
    // Show notification if data was loaded from previous quarter
    if (isFromPreviousQuarter && previousQuarterSource) {
      notificationService.info(
        'Previous Quarter Data Loaded', 
        `Data from ${previousQuarterSource} has been loaded for viewing. Click Save to finalize changes for ${period}.`
      )
    }
    
    tableData.value = periodData.map(row => ({
      ...row,
      isModified: false, // Reset modified state when loading from storage
      // Preserve the isFromPreviousQuarter flag if it exists
      isFromPreviousQuarter: row.isFromPreviousQuarter || isFromPreviousQuarter
    }))
    
    // Update allQuarterData for the modal
    allQuarterData.value[period] = [...tableData.value]
    
  } catch (error) {
    tableData.value = []
  }
  
  // Reset to first page when period changes
  currentPage.value = 1
}

const handleSearch = (query: string) => {
  searchQuery.value = query
  currentPage.value = 1
}

const handleFilter = (filter: { type: string; value: string }) => {
  filters.value[filter.type] = filter.value
  currentPage.value = 1
}

const handleClearFilters = () => {
  searchQuery.value = ''
  filters.value = {}
  currentPage.value = 1
}

const handleAddRow = () => {
  // Check if quarter is read-only
  if (isCurrentQuarterReadOnly.value) {
    notificationService.error(
      'Cannot Add Row', 
      'This quarter is locked because future quarters have been saved. Cannot modify past quarters.'
    )
    return
  }

  if (!currentUser.value?.username) {
    notificationService.error('Cannot Add Row', 'No authenticated user found.')
    return
  }
  
  try {
    // Set default ownership structure based on user role
    const defaultOwnershipStructure = isAdmin.value ? 'Direct to PIF' : 'Direct'
    
    const newRowData = {
      entityNameEnglish: '',
      entityNameArabic: '',
      commercialRegistrationNumber: '',
      moiNumber: '',
      countryOfIncorporation: 'SAU',
      ownershipPercentage: 0,
      acquisitionDisposalDate: undefined,
      directParentEntity: '',
      ultimateParentEntity: 'PIF',
      investmentRelationshipType: '',
      ownershipStructure: defaultOwnershipStructure,
      principalActivities: '',
      isModified: true,
      isNewRow: true,
      dataSource: isAdmin.value ? 'admin' : 'company'
    }

    // Add asset code only for admin users
    if (isAdmin.value) {
      Object.assign(newRowData, { assetCode: '' })
    }
    
    // Create new row with generated ID
    const newRow: BusinessQuarterRow = {
      ...newRowData,
      id: dataService.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add to current table data
    tableData.value.push(newRow)
  } catch (error) {
    notificationService.error('Add Row Failed', 'Failed to add new row. Please try again.')
  }
}

const handleDeleteUnsavedRow = (rowId: string) => {
  // Check if quarter is read-only
  if (isCurrentQuarterReadOnly.value) {
    notificationService.error(
      'Cannot Delete Row', 
      'This quarter is locked because future quarters have been saved. Cannot modify past quarters.'
    )
    return
  }
  
  try {
    // For unsaved rows, just remove from local data
    const rowIndex = tableData.value.findIndex(row => row.id === rowId)
    if (rowIndex !== -1) {
      const row = tableData.value[rowIndex]
      if (row.isNewRow) {
        // Remove from localStorage if it was saved there
        dataService.deleteRows(selectedPeriod.value, [rowId])
        // Remove from local array
        tableData.value.splice(rowIndex, 1)
      }
    }
  } catch (error) {
    notificationService.error('Delete Failed', 'Failed to delete row. Please try again.')
  }
}

const handleBulkDelete = (rowIds: string[]) => {
  // Check if quarter is read-only
  if (isCurrentQuarterReadOnly.value) {
    notificationService.error(
      'Cannot Delete Rows', 
      'This quarter is locked because future quarters have been saved. Cannot modify past quarters.'
    )
    return
  }
  
  try {
    // Only allow deletion of unsaved rows
    const unsavedRowIds = rowIds.filter(id => {
      const row = tableData.value.find(r => r.id === id)
      return row?.isNewRow
    })
    
    if (unsavedRowIds.length === 0) {
      notificationService.warning('Invalid Selection', 'Only unsaved rows can be deleted in bulk.')
      return
    }
    
    // Remove from localStorage
    dataService.deleteRows(selectedPeriod.value, unsavedRowIds)
    
    // Remove from local array
    tableData.value = tableData.value.filter(row => !unsavedRowIds.includes(row.id))
    
  } catch (error) {
    notificationService.error('Bulk Delete Failed', 'Failed to delete rows. Please try again.')
  }
}

const handleBulkDuplicate = (rowIds: string[]) => {
  // Check if quarter is read-only
  if (isCurrentQuarterReadOnly.value) {
    notificationService.error(
      'Cannot Duplicate Rows', 
      'This quarter is locked because future quarters have been saved. Cannot modify past quarters.'
    )
    return
  }
  
  try {
    const duplicatedRows = dataService.duplicateRows(selectedPeriod.value, rowIds)
    
    // Add to local table data
    tableData.value.push(...duplicatedRows)
    
  } catch (error) {
    notificationService.error('Bulk Duplicate Failed', 'Failed to duplicate rows. Please try again.')
  }
}

const handleSaveChanges = () => {
  // Check if quarter is read-only
  if (isCurrentQuarterReadOnly.value) {
    notificationService.error(
      'Cannot Save', 
      'This quarter is locked because future quarters have been saved. Cannot modify past quarters.'
    )
    return
  }
  
  // Check for validation errors before saving
  if (hasValidationErrors.value) {
    notificationService.error(
      'Cannot Save', 
      `Please fix ${validationErrorCount.value} validation error(s) before saving.`
    )
    return
  }
  
  // Check if there are any changes to save
  const hasChanges = tableData.value.some(row => row.isModified || row.isNewRow)
  if (!hasChanges) {
    notificationService.warning('No Changes', 'No changes detected to save.')
    return
  }

  if (!currentUser.value?.username) {
    notificationService.error('Cannot Save', 'No authenticated user found.')
    return
  }
  
  loading.value = true
  
  try {
    // Save user-specific data
    if (isAdmin.value) {
      // For admin users, need to separate and save data to appropriate user buckets
      // Only save data that isn't read-only
      const adminData = tableData.value.filter(row => 
        (!row.dataSource || row.dataSource === 'admin') && !row.isRowReadOnly
      )
      const companyData = tableData.value.filter(row => 
        row.dataSource === 'company' && !row.isRowReadOnly
      )
      
      if (adminData.length > 0) {
        dataService.saveUserPeriodData('PIF_SubmitIQ', selectedPeriod.value, adminData)
      }
      
      // Note: Company data should not be saved by admin users since it's read-only
      // This prevents accidental modification of Company data
      if (companyData.length > 0) {
        console.warn('Admin attempted to save Company data, but Company data is read-only')
      }
    } else {
      // For company users, save only their own data (should never be read-only for themselves)
      const editableData = tableData.value.filter(row => !row.isRowReadOnly)
      dataService.saveUserPeriodData(currentUser.value.username, selectedPeriod.value, editableData)
    }
    
    setTimeout(() => {
      // Reset modified flags and mark new rows as saved
      tableData.value.forEach(row => {
        row.isModified = false
        row.isNewRow = false // Clear the new row flag when saving
        row.isFromPreviousQuarter = false // No longer from previous quarter
      })
      loading.value = false
      
      // Show success message with quarter finalization info
      notificationService.success(
        'Quarter Finalized', 
        `${selectedPeriod.value} has been saved and finalized. Previous quarters are now locked from editing.`
      )
    }, 1000)
  } catch (error) {
    loading.value = false
    notificationService.error('Save Failed', 'Failed to save changes. Please try again.')
  }
}

const handleGenerateReport = () => {
  // Open the report modal for user to choose report options
  reportModalState.value.isOpen = true
}

// Handle XLSX upload
const handleXlsxUpload = (uploadedData: any[]) => {
  // Check if quarter is read-only
  if (isCurrentQuarterReadOnly.value) {
    notificationService.error(
      'Cannot Import Data', 
      'This quarter is locked because future quarters have been saved. Cannot modify past quarters.'
    )
    return
  }

  try {
    // Cast the uploaded data to BusinessQuarterRow format
    // The uploaded data should already have the correct structure from the XLSX modal
    const businessQuarterRows = uploadedData as BusinessQuarterRow[]
    
    // Add uploaded data to the table
    tableData.value.push(...businessQuarterRows)
    
    notificationService.success(
      'Data Imported Successfully',
      `${businessQuarterRows.length} rows have been imported from Excel. Please review the data and click 'Save Changes' to persist.`
    )
  } catch (error) {
    console.error('XLSX upload error:', error)
    notificationService.error(
      'Import Failed', 
      'Failed to import data from Excel file. Please check the file format and try again.'
    )
  }
}

// Report modal handlers
const closeReportModal = () => {
  reportModalState.value.isOpen = false
}

const handleReportGenerated = (success: boolean) => {
  if (success) {
    console.log('Report generated successfully')
  } else {
    console.log('Report generation failed')
  }
}

// Helper function to detect current custom quarter based on date
const detectCurrentCustomQuarter = (): string => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11, we need 1-12
  const currentYear = now.getFullYear()
  
  if (currentMonth >= 1 && currentMonth <= 6) {
    return `First Half ${currentYear}`
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    return `Quarter 3 ${currentYear}`
  } else if (currentMonth >= 10 && currentMonth <= 12) {
    return `Quarter 4 ${currentYear}`
  }
  
  // Fallback (should never reach here)
  return `First Half ${currentYear}`
}

// Helper function to get previous quarter
const getPreviousCustomQuarter = (currentQuarter: string): string | null => {
  const year = currentQuarter.split(' ')[currentQuarter.split(' ').length - 1]
  const yearNum = parseInt(year)
  
  if (currentQuarter.includes('First Half')) {
    // Previous to First Half is Quarter 4 of previous year
    return `Quarter 4 ${yearNum - 1}`
  } else if (currentQuarter.includes('Quarter 3')) {
    // Previous to Quarter 3 is First Half of same year
    return `First Half ${yearNum}`
  } else if (currentQuarter.includes('Quarter 4')) {
    // Previous to Quarter 4 is Quarter 3 of same year
    return `Quarter 3 ${yearNum}`
  }
  
  return null
}

const handleDuplicateRow = (row: any, insertIndex?: number) => {
  try {
    const duplicatedRows = dataService.duplicateRows(selectedPeriod.value, [row.id])
    if (duplicatedRows.length > 0) {
      if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= tableData.value.length) {
        // Insert at specific position
        tableData.value.splice(insertIndex, 0, duplicatedRows[0])
      } else {
        // Fallback to adding at the end
        tableData.value.push(duplicatedRows[0])
      }
    }
  } catch (error) {
    notificationService.error('Duplicate Failed', 'Failed to duplicate row. Please try again.')
  }
}

const handleRowModified = (row: any) => {
  // Update the row in localStorage when modified
  try {
    const rowIndex = tableData.value.findIndex(r => r.id === row.id)
    if (rowIndex !== -1) {
      tableData.value[rowIndex] = { ...row, isModified: true }
      // Auto-save to localStorage
      dataService.updateRow(selectedPeriod.value, row.id, row)
    }
  } catch (error) {
    console.error('Failed to save row modification:', error)
  }
}

const handleValidationChange = (hasErrors: boolean, errorCount: number) => {
  hasValidationErrors.value = hasErrors
  validationErrorCount.value = errorCount
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleItemsPerPageChange = (items: number) => {
  itemsPerPage.value = items
  currentPage.value = 1
}

// Modal handlers
const handleCreateInForm = () => {
  modalState.value = {
    isOpen: true,
    mode: 'create',
    data: undefined
  }
}

const handleViewRow = (row: any) => {
  modalState.value = {
    isOpen: true,
    mode: 'view',
    data: row
  }
}

const handleEditRow = (row: any) => {
  modalState.value = {
    isOpen: true,
    mode: 'edit',
    data: row
  }
}

const closeModal = () => {
  modalState.value = {
    isOpen: false,
    mode: 'view',
    data: undefined
  }
}

const handleModalSubmit = (data: Record<string, any>) => {
  try {
    if (modalState.value.mode === 'create') {
      const newRow = dataService.addRow(selectedPeriod.value, {
        entityNameEnglish: data.entityNameEnglish || '',
        entityNameArabic: data.entityNameArabic || '',
        commercialRegistrationNumber: data.commercialRegistrationNumber || '',
        moiNumber: data.moiNumber || '',
        countryOfIncorporation: data.countryOfIncorporation || 'SAU',
        ownershipPercentage: data.ownershipPercentage || 0,
        acquisitionDisposalDate: data.acquisitionDisposalDate || undefined,
        directParentEntity: data.directParentEntity || '',
        ultimateParentEntity: 'PIF',
        investmentRelationshipType: data.investmentRelationshipType || '',
        ownershipStructure: data.ownershipStructure || 'PIF',
        principalActivities: data.principalActivities || '',
        isModified: false,
        isNewRow: false
      })
      tableData.value.push(newRow)
    } else if (modalState.value.mode === 'edit') {
      const existingRowIndex = tableData.value.findIndex(row => row.id === modalState.value.data?.id)
      if (existingRowIndex !== -1 && modalState.value.data?.id) {
        const updatedRow = {
          ...modalState.value.data,
          ...data,
          isModified: false
        }
        
        // Update in localStorage
        dataService.updateRow(selectedPeriod.value, modalState.value.data.id, updatedRow)
        
        // Update local data
        tableData.value[existingRowIndex] = updatedRow as any
      }
    }
  } catch (error) {
    notificationService.error('Save Failed', 'Failed to save data. Please try again.')
    return
  }
  
  closeModal()
}

// Copy modal handlers
const handleCopyFromAnotherQuarter = () => {
  copyModalState.value.isOpen = true
}

const closeCopyModal = () => {
  copyModalState.value.isOpen = false
}

const handleCopyData = (fromPeriod: string, _data: any[]) => {
  loading.value = true
  
  try {
    setTimeout(() => {
      // Copy data from the selected quarter to the current quarter using dataService
      const copiedData = dataService.copyPeriodData(fromPeriod, selectedPeriod.value)
      
      // Update local table data
      tableData.value = copiedData
      
      loading.value = false
      closeCopyModal()
      
      // Show success message
      notificationService.success('Data Copied', `Successfully copied ${copiedData.length} records from ${fromPeriod}`)
    }, 1000)
  } catch (error) {
    loading.value = false
    notificationService.error('Copy Failed', 'Failed to copy data. Please try again.')
  }
}

// Lifecycle
onMounted(async () => {
  // Initialize authentication first
  await authStore.initAuth()
  
  // Then initialize data based on authenticated user
  initializeData()
})

// Initialize data from localStorage with proper error handling
const initializeData = () => {
  try {
    if (!currentUser.value?.username) {
      console.warn('No authenticated user found')
      return
    }

    // Initialize user-specific data if it doesn't exist
    dataService.initializeUserData(currentUser.value.username)
    
    // Initialize legacy data structure (for backward compatibility)
    const allData = dataService.initializeData()
    
    // Update allQuarterData for the modal to work properly
    allQuarterData.value = allData
    
    // Load user-specific data for the default period
    let defaultPeriodData: BusinessQuarterRow[] = []
    
    if (isAdmin.value) {
      // For admin users, load combined data (both admin and company data)
      console.log('=== INITIALIZING COMBINED DATA FOR ADMIN ===')
      defaultPeriodData = dataService.getCombinedDataForAdmin(selectedPeriod.value)
      console.log('Admin initialized combined data length:', defaultPeriodData.length)
    } else {
      // For company users, load only their own data
      console.log('=== INITIALIZING COMPANY DATA ONLY ===')
      defaultPeriodData = dataService.loadUserPeriodData(currentUser.value.username, selectedPeriod.value)
      console.log('Company initialized data length:', defaultPeriodData.length)
    }
    
    tableData.value = defaultPeriodData
    
    if (defaultPeriodData[0]) {
      console.log('Country field value:', defaultPeriodData[0].countryOfIncorporation)
      console.log('All fields:', Object.keys(defaultPeriodData[0]))
    }
    console.log('=== END DEBUG ===')
    
    console.log('Initialized user-specific data:', {
      username: currentUser.value.username,
      userRole: currentUser.value.role,
      isAdmin: isAdmin.value,
      currentPeriodRecords: defaultPeriodData.length,
      availablePeriods: dataService.getAvailablePeriods()
    })
  } catch (error) {
    console.error('Failed to initialize data:', error)
    notificationService.error('Initialization Failed', 'Failed to load data. Please refresh the page.')
  }
}

// Helper function to reset data (useful for development/testing)
const resetDataToDefault = () => {
  try {
    const newData = dataService.resetToDefaultData()
    allQuarterData.value = newData
    
    // Reload current period data
    const defaultPeriodData = dataService.loadPeriodData(selectedPeriod.value)
    tableData.value = defaultPeriodData
    
    notificationService.success('Data Reset', 'Data has been reset to default sample data with proper country values.')
    console.log('Data reset successfully with enhanced sample data')
  } catch (error) {
    console.error('Failed to reset data:', error)
    notificationService.error('Reset Failed', 'Failed to reset data. Please try again.')
  }
}

// Expose resetDataToDefault to window for console access during development
if (typeof window !== 'undefined') {
  (window as any).resetDataToDefault = resetDataToDefault
  
  // Expose user data reset for testing
  ;(window as any).resetUserData = () => {
    try {
      dataService.resetUserData()
      console.log('User data reset successfully. Please refresh the page or re-login to see the new sample data.')
    } catch (error) {
      console.error('Failed to reset user data:', error)
    }
  }
  
  // Expose method to clear save status for testing
  ;(window as any).clearSaveStatus = () => {
    try {
      dataService.clearSaveStatus()
      console.log('Save status cleared successfully. Users will now load from previous quarter again.')
    } catch (error) {
      console.error('Failed to clear save status:', error)
    }
  }
  
  // Expose method to test combined data loading
  ;(window as any).testCombinedData = () => {
    try {
      console.log('=== Testing Combined Data Loading ===')
      console.log('Current user:', currentUser.value?.username)
      console.log('Is admin:', isAdmin.value)
      
      // Test individual data loading
      const adminData = dataService.loadUserPeriodData('PIF_SubmitIQ', 'First Half 2025')
      const companyData = dataService.loadUserPeriodData('Company', 'First Half 2025')
      console.log('Direct admin data length:', adminData.length)
      console.log('Direct company data length:', companyData.length)
      
      // Test combined data loading
      const combinedData = dataService.getCombinedDataForAdmin('First Half 2025')
      console.log('Combined data result length:', combinedData.length)
      console.log('Combined data entities:', combinedData.map(row => row.entityNameEnglish))
      console.log('Combined data sources:', combinedData.map(row => row.dataSource))
      
      return {
        adminData: adminData.length,
        companyData: companyData.length,
        combinedData: combinedData.length,
        entities: combinedData.map(row => row.entityNameEnglish),
        sources: combinedData.map(row => row.dataSource)
      }
    } catch (error) {
      console.error('Failed to test combined data:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  
  // Expose method to force reload current user data
  ;(window as any).reloadCurrentUserData = () => {
    try {
      console.log('=== Reloading Current User Data ===')
      if (!currentUser.value?.username) {
        console.error('No current user found')
        return
      }
      
      // Force re-initialize data
      dataService.initializeUserData(currentUser.value.username)
      
      // Reload the table data
      let newData: BusinessQuarterRow[] = []
      if (isAdmin.value) {
        newData = dataService.getCombinedDataForAdmin(selectedPeriod.value)
      } else {
        newData = dataService.loadUserPeriodData(currentUser.value.username, selectedPeriod.value)
      }
      
      tableData.value = newData
      console.log('Reloaded data length:', newData.length)
      console.log('Reloaded entities:', newData.map(row => row.entityNameEnglish))
      
      return {
        userType: isAdmin.value ? 'admin' : 'company',
        dataLength: newData.length,
        entities: newData.map(row => row.entityNameEnglish)
      }
    } catch (error) {
      console.error('Failed to reload user data:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  
  // Also expose the report generation functions for testing
  ;(window as any).testQuarterDetection = () => {
    console.log('=== Quarter Detection Test ===')
    const currentQuarter = selectedPeriod.value // Use selected period instead of date detection
    const previousQuarter = getPreviousCustomQuarter(currentQuarter)
    console.log('Selected Quarter (UI):', currentQuarter)
    console.log('Previous Quarter:', previousQuarter)
    
    // Also test the date-based detection for comparison
    const dateBasedQuarter = detectCurrentCustomQuarter()
    console.log('Date-based Quarter:', dateBasedQuarter)
    
    return { currentQuarter, previousQuarter, dateBasedQuarter }
  }
  
  // Add debugging method to test fallback logic
  ;(window as any).testFallbackLogic = (username: string, period: string) => {
    console.log(`=== Testing Fallback Logic for ${username} in ${period} ===`)
    
    // Check save status
    const hasSaved = dataService.hasUserSavedToQuarter(username, period)
    console.log(`${username} has saved to ${period}:`, hasSaved)
    
    // Test fallback loading
    const result = dataService.loadUserPeriodDataWithFallback(username, period)
    console.log('Fallback result:', {
      dataLength: result.data.length,
      isFromPreviousQuarter: result.isFromPreviousQuarter,
      previousQuarterSource: result.previousQuarterSource
    })
    
    return result
  }
  
  // Add debugging method to reset everything and test fresh
  ;(window as any).resetAllDataAndTest = () => {
    console.log('=== Resetting All Data and Testing ===')
    
    // Clear all data
    dataService.clearAllData()
    
    // Reinitialize for current user
    if (currentUser.value?.username) {
      dataService.initializeUserData(currentUser.value.username)
      
      // Test loading for current period
      handlePeriodChange(selectedPeriod.value, 1, 2025)
      
      console.log('Data reset and reloaded. Current table data length:', tableData.value.length)
      console.log('Has data from previous quarter:', hasDataFromPreviousQuarter.value)
    }
    
    return {
      username: currentUser.value?.username,
      period: selectedPeriod.value,
      dataLength: tableData.value.length,
      hasDataFromPreviousQuarter: hasDataFromPreviousQuarter.value
    }
  }
  
  // Add debugging method to test the specific admin data loading behavior
  ;(window as any).testAdminDataLoading = (targetPeriod?: string) => {
    console.log('=== Testing Admin Data Loading Behavior ===')
    const testPeriod = targetPeriod || 'Quarter 3 2025'
    
    if (currentUser.value?.username !== 'PIF_SubmitIQ') {
      console.error('This test only works for PIF_SubmitIQ user. Current user:', currentUser.value?.username)
      return { error: 'Must be logged in as PIF_SubmitIQ user' }
    }
    
    console.log(`Testing data loading for period: ${testPeriod}`)
    
    // Test the combined data loading
    const combinedData = dataService.getCombinedDataForAdmin(testPeriod)
    
    const adminRows = combinedData.filter(row => row.dataSource === 'admin')
    const companyRows = combinedData.filter(row => row.dataSource === 'company')
    
    console.log('=== TEST RESULTS ===')
    console.log(`Total combined data: ${combinedData.length} rows`)
    console.log(`Admin (PIF_SubmitIQ) rows: ${adminRows.length}`)
    console.log(`Company rows: ${companyRows.length}`)
    console.log('Admin rows are read-only:', adminRows.map(r => r.isRowReadOnly))
    console.log('Company rows are read-only:', companyRows.map(r => r.isRowReadOnly))
    console.log('Admin rows from previous quarter:', adminRows.map(r => r.isFromPreviousQuarter))
    console.log('Company rows from previous quarter:', companyRows.map(r => r.isFromPreviousQuarter))
    
    return {
      testPeriod,
      totalRows: combinedData.length,
      adminRows: adminRows.length,
      companyRows: companyRows.length,
      adminReadOnly: adminRows.every(r => !r.isRowReadOnly),
      companyReadOnly: companyRows.every(r => r.isRowReadOnly),
      adminFromPrevious: adminRows.some(r => r.isFromPreviousQuarter),
      companyFromPrevious: companyRows.some(r => r.isFromPreviousQuarter)
    }
  }
  
  // Add debugging method to test save functionality and verify read-only filtering
  ;(window as any).testSaveFiltering = () => {
    if (currentUser.value?.username !== 'PIF_SubmitIQ') {
      console.error('This test only works for PIF_SubmitIQ user. Current user:', currentUser.value?.username)
      return { error: 'Must be logged in as PIF_SubmitIQ user' }
    }
    
    console.log('=== Testing Save Filtering ===')
    console.log('Current table data length:', tableData.value.length)
    
    const readOnlyRows = tableData.value.filter(row => row.isRowReadOnly)
    const editableRows = tableData.value.filter(row => !row.isRowReadOnly)
    
    console.log('Read-only rows (should NOT be saved):', readOnlyRows.length)
    console.log('Editable rows (should be saved):', editableRows.length)
    
    readOnlyRows.forEach((row, index) => {
      console.log(`Read-only row ${index + 1}:`, {
        entity: row.entityNameEnglish,
        dataSource: row.dataSource,
        isRowReadOnly: row.isRowReadOnly
      })
    })
    
    editableRows.forEach((row, index) => {
      console.log(`Editable row ${index + 1}:`, {
        entity: row.entityNameEnglish,
        dataSource: row.dataSource,
        isRowReadOnly: row.isRowReadOnly
      })
    })
    
    return {
      totalRows: tableData.value.length,
      readOnlyRows: readOnlyRows.length,
      editableRows: editableRows.length,
      readOnlyData: readOnlyRows.map(r => ({ entity: r.entityNameEnglish, source: r.dataSource })),
      editableData: editableRows.map(r => ({ entity: r.entityNameEnglish, source: r.dataSource }))
    }
  }
  
  ;(window as any).generateTestReport = handleGenerateReport
}
</script>
