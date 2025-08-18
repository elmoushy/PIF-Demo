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
        @saveDraft="handleSaveDraft"
        @unsubmit="handleUnsubmit"
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
      :userRole="(currentUser?.role === 'SuperAdmin' ? 'Administrator' : currentUser?.role) || 'Company'"
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

// Optimized computed properties - use more efficient filtering
const filteredData = computed(() => {
  let filtered = tableData.value

  // Apply search filter - optimized for performance
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(row => {
      // Only search essential fields for better performance
      return (
        (row.entityNameEnglish && row.entityNameEnglish.toLowerCase().includes(query)) ||
        (row.entityNameArabic && row.entityNameArabic.toLowerCase().includes(query)) ||
        (row.commercialRegistrationNumber && row.commercialRegistrationNumber.toLowerCase().includes(query))
      )
    })
  }

  // Apply filter dropdown filters - simplified
  if (filters.value.country) {
    filtered = filtered.filter(row => 
      row.countryOfIncorporation && row.countryOfIncorporation.toLowerCase().includes(filters.value.country.toLowerCase())
    )
  }
  
  if (filters.value.currency) {
    filtered = filtered.filter(row => 
      row.currency && row.currency.toLowerCase().includes(filters.value.currency.toLowerCase())
    )
  }

  return filtered
})

// Simple pagination with better performance
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredData.value.slice(start, end)
})

// Optimized quarter status checking
const isCurrentQuarterReadOnly = computed(() => {
  return dataService.isQuarterReadOnly(selectedPeriod.value)
})

// Simple check for previous quarter data
const hasDataFromPreviousQuarter = computed(() => {
  return tableData.value.some(row => row.isFromPreviousQuarter)
})

// Event handlers
const handlePeriodChange = async (period: string, quarter: number, year: number) => {
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
  
  // Set loading state
  loading.value = true
  
  try {
    let periodData: BusinessQuarterRow[] = []
    let isFromPreviousQuarter = false
    let previousQuarterSource: string | undefined
    
    if (currentUser.value?.username) {
      // Initialize user data if it doesn't exist
      dataService.initializeUserData(currentUser.value.username)
      
      console.log(`=== LOADING API DATA FOR ${currentUser.value.username} ===`)
      
      // Try to load data from API first, with localStorage fallback
      try {
        const apiResult = await dataService.loadPeriodDataWithApi(currentUser.value.username, period)
        periodData = apiResult.data
        isFromPreviousQuarter = apiResult.isFromPreviousQuarter
        previousQuarterSource = apiResult.previousQuarterSource
        
        console.log('API data loaded successfully:', {
          dataLength: periodData.length,
          isFromPreviousQuarter,
          previousQuarterSource
        })
        
        // Show success notification for API data
        if (periodData.length > 0) {
          notificationService.success(
            'Data Loaded', 
            `Successfully loaded ${periodData.length} investment records from API.`
          )
        }
        
      } catch (apiError) {
        console.error('API data loading failed, falling back to localStorage:', apiError)
        
        // Fall back to localStorage if API fails
        if (isAdmin.value) {
          // For admin users, load combined data (both admin and company data)
          console.log('=== LOADING COMBINED DATA FOR ADMIN (FALLBACK) ===')
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
        
        // Show notification about API failure and localStorage fallback
        notificationService.warning(
          'API Unavailable', 
          'Could not connect to server. Using local data instead.'
        )
      }
    }
    
    // Show notification if data was loaded from previous quarter
    if (isFromPreviousQuarter && previousQuarterSource) {
      notificationService.info(
        'Previous Quarter Data Loaded', 
        `Data from ${previousQuarterSource} has been loaded for viewing. Click Save to finalize changes for ${period}.`
      )
    }
    
    // Show notification if no data found
    if (periodData.length === 0) {
      notificationService.info(
        'No Data Found', 
        `No investment data found for ${period}. You can start adding new entries.`
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
    console.error('Error loading period data:', error)
    notificationService.error(
      'Data Loading Failed', 
      'Failed to load investment data. Please try again or contact support.'
    )
    tableData.value = []
  } finally {
    // Clear loading state
    loading.value = false
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

const handleSaveChanges = async () => {
  // Check if quarter is read-only
  if (isCurrentQuarterReadOnly.value) {
    notificationService.error(
      'Cannot Submit', 
      'This quarter is locked because future quarters have been submitted. Cannot modify past quarters.'
    )
    return
  }
  
  // Check for validation errors before submitting
  if (hasValidationErrors.value) {
    notificationService.error(
      'Cannot Submit', 
      `Please fix ${validationErrorCount.value} validation error(s) before submitting.`
    )
    return
  }
  
  // Check if there are any changes to submit
  const hasChanges = tableData.value.some(row => row.isModified || row.isNewRow)
  if (!hasChanges && !hasDataFromPreviousQuarter.value) {
    notificationService.warning('No Changes', 'No changes detected to submit.')
    return
  }

  if (!currentUser.value?.username) {
    notificationService.error('Cannot Submit', 'No authenticated user found.')
    return
  }
  
  loading.value = true
  
  try {
    // Submit investments for approval via API
    const result = await dataService.submitInvestmentsToApi(
      currentUser.value.username, 
      selectedPeriod.value, 
      tableData.value
    )
    
    setTimeout(() => {
      // Reset modified flags and mark data as submitted
      tableData.value.forEach(row => {
        row.isModified = false
        row.isNewRow = false // Clear the new row flag when submitting
        row.isFromPreviousQuarter = false // No longer from previous quarter
        row.isSubmitted = true // Mark as submitted
        row.isRowReadOnly = true // Submitted data becomes read-only
      })
      loading.value = false
      
      // Show success message with submission details
      notificationService.success(
        'Quarter Submitted Successfully', 
        `${selectedPeriod.value} has been submitted for approval. ${result.submitted_count} investments were submitted. Previous quarters are now locked from editing.`
      )
    }, 1000)
  } catch (error: any) {
    loading.value = false
    
    // Handle specific API error messages
    const errorMessage = error.message || 'Failed to submit investments. Please try again.'
    notificationService.error('Submission Failed', errorMessage)
  }
}

const handleSaveDraft = async () => {
  // Check if quarter is read-only
  if (isCurrentQuarterReadOnly.value) {
    notificationService.error(
      'Cannot Save Draft', 
      'This quarter is locked because future quarters have been saved. Cannot modify past quarters.'
    )
    return
  }
  
  // Check if there are any changes to save
  const hasChanges = tableData.value.some(row => row.isModified || row.isNewRow)
  if (!hasChanges) {
    notificationService.warning('No Changes', 'No changes detected to save as draft.')
    return
  }

  if (!currentUser.value?.username) {
    notificationService.error('Cannot Save Draft', 'No authenticated user found.')
    return
  }
  
  loading.value = true
  
  try {
    // Save draft to API - no validation constraints
    await dataService.saveDraftToApi(currentUser.value.username, selectedPeriod.value, tableData.value)
    
    setTimeout(() => {
      // Reset modified flags for draft save (but keep isNewRow flag)
      tableData.value.forEach(row => {
        row.isModified = false
        // Don't clear isNewRow flag for drafts - keep it until final save
      })
      loading.value = false
      
      notificationService.success(
        'Draft Saved', 
        `${selectedPeriod.value} draft has been saved successfully.`
      )
    }, 1000)
  } catch (error) {
    loading.value = false
    notificationService.error('Draft Save Failed', 'Failed to save draft. Please try again.')
  }
}

const handleUnsubmit = async () => {
  // Check if quarter is read-only (shouldn't be needed for unsubmit, but defensive)
  if (isCurrentQuarterReadOnly.value) {
    notificationService.error(
      'Cannot Unsubmit', 
      'This quarter is locked. Please contact your administrator.'
    )
    return
  }

  if (!currentUser.value?.username) {
    notificationService.error('Cannot Unsubmit', 'No authenticated user found.')
    return
  }
  
  // Check if there are any submitted investments to unsubmit
  const hasSubmittedData = tableData.value.some(row => row.isSubmitted)
  if (!hasSubmittedData) {
    notificationService.warning('Nothing to Unsubmit', 'No submitted investments found for this period.')
    return
  }
  
  loading.value = true
  
  try {
    // Unsubmit investments via API
    await dataService.unsubmitInvestmentsFromApi(
      currentUser.value.username, 
      selectedPeriod.value
    )
    
    setTimeout(() => {
      // Update local data - mark as unsubmitted and editable
      tableData.value.forEach(row => {
        row.isSubmitted = false
        row.isRowReadOnly = false
        row.submittedAt = undefined
        row.submittedBy = undefined
      })
      loading.value = false
      
      notificationService.success(
        'Unsubmitted Successfully', 
        `${selectedPeriod.value} investments have been unsubmitted and can now be modified.`
      )
    }, 1000)
  } catch (error: any) {
    loading.value = false
    
    // Handle specific API error messages
    const errorMessage = error.message || 'Failed to unsubmit investments. Please try again.'
    notificationService.error('Unsubmit Failed', errorMessage)
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
  await initializeData()
})

// Initialize data from API with localStorage fallback
const initializeData = async () => {
  try {
    if (!currentUser.value?.username) {
      console.warn('No authenticated user found')
      return
    }

    // Set loading state
    loading.value = true

    // Initialize user-specific data if it doesn't exist
    dataService.initializeUserData(currentUser.value.username)
    
    // Initialize legacy data structure (for backward compatibility)
    const allData = dataService.initializeData()
    
    // Update allQuarterData for the modal to work properly
    allQuarterData.value = allData
    
    // Load API data for the default period
    let defaultPeriodData: BusinessQuarterRow[] = []
    let isFromPreviousQuarter = false
    let previousQuarterSource: string | undefined
    
    console.log(`=== INITIALIZING API DATA FOR ${currentUser.value.username} ===`)
    
    try {
      // Try to load data from API first
      const apiResult = await dataService.loadPeriodDataWithApi(currentUser.value.username, selectedPeriod.value)
      defaultPeriodData = apiResult.data
      isFromPreviousQuarter = apiResult.isFromPreviousQuarter
      previousQuarterSource = apiResult.previousQuarterSource
      
      console.log('API data initialized successfully:', {
        dataLength: defaultPeriodData.length,
        isFromPreviousQuarter,
        previousQuarterSource
      })
      
      // Show success notification for API data
      if (defaultPeriodData.length > 0) {
        notificationService.success(
          'Data Loaded', 
          `Successfully loaded ${defaultPeriodData.length} investment records from API.`
        )
      }
      
    } catch (apiError) {
      console.error('API data initialization failed, falling back to localStorage:', apiError)
      
      // Fall back to localStorage if API fails
      if (isAdmin.value) {
        // For admin users, load combined data (both admin and company data)
        console.log('=== INITIALIZING COMBINED DATA FOR ADMIN (FALLBACK) ===')
        defaultPeriodData = dataService.getCombinedDataForAdmin(selectedPeriod.value)
        console.log('Admin initialized combined data length:', defaultPeriodData.length)
      } else {
        // For company users, load only their own data
        console.log('=== INITIALIZING COMPANY DATA ONLY (FALLBACK) ===')
        defaultPeriodData = dataService.loadUserPeriodData(currentUser.value.username, selectedPeriod.value)
        console.log('Company initialized data length:', defaultPeriodData.length)
      }
      
      // Show notification about API failure and localStorage fallback
      notificationService.warning(
        'API Unavailable', 
        'Could not connect to server. Using local data instead.'
      )
    }
    
    // Show notification if data was loaded from previous quarter
    if (isFromPreviousQuarter && previousQuarterSource) {
      notificationService.info(
        'Previous Quarter Data Loaded', 
        `Data from ${previousQuarterSource} has been loaded for viewing.`
      )
    }
    
    // Show notification if no data found
    if (defaultPeriodData.length === 0) {
      notificationService.info(
        'No Data Found', 
        `No investment data found for ${selectedPeriod.value}. You can start adding new entries.`
      )
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
  } finally {
    // Clear loading state
    loading.value = false
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
