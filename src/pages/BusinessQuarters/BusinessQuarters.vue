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

    <!-- Notification Container -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// import { useI18n } from '../../hooks/useI18n'
import { dataService, type BusinessQuarterRow } from '../../services/dataService'
import { notificationService } from '../../services/notificationService'
import Header from '../../components/Header/Header.vue'
// import QuarterSelector from '../../components/QuarterSelector/QuarterSelector.vue'
import FilterBar from '../../components/FilterBar/FilterBar.vue'
import DataTable from '../../components/DataTable/DataTable.vue'
import Pagination from '../../components/Pagination/Pagination.vue'
import DataModal from '../../components/DataModal/DataModal.vue'
import QuarterCopyModal from '../../components/QuarterCopyModal/QuarterCopyModal.vue'
import NotificationContainer from '../../components/NotificationContainer/NotificationContainer.vue'
import styles from './BusinessQuarters.module.css'

// const { t } = useI18n()

// State
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const filters = ref<Record<string, string>>({})
const currentQuarter = ref(1)
const currentYear = ref(new Date().getFullYear())
const selectedPeriod = ref(`Q1 ${new Date().getFullYear()}`)

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

// Table configuration
const tableColumns = [
  { key: 'companyName', editable: true, required: true },
  { key: 'reportingPeriod', editable: true, required: true },
  { key: 'currency', editable: true, required: true },
  { key: 'relatedParties', editable: true, required: true },
  { key: 'arabicLegalName', editable: true, required: true },
  { key: 'relationship', editable: true, required: true },
  { key: 'directParent', editable: true, required: true },
  { key: 'percentOwnership', editable: true, type: 'number', required: true },
  { key: 'countryOfIncorporation', editable: true, required: true },
  { key: 'commercialRegistrationNumber', editable: true, required: true }
]

// Computed properties
const filteredData = computed(() => {
  let filtered = tableData.value

  // Apply search filter - search across all text fields
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(row => {
      const searchableFields = [
        row.companyName,
        row.currency,
        row.relatedParties,
        row.arabicLegalName,
        row.relationship,
        row.directParent,
        row.countryOfIncorporation,
        row.commercialRegistrationNumber
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
        case 'currency':
          filtered = filtered.filter(row => 
            row.currency.toLowerCase().includes(filterValue.toLowerCase())
          )
          break
        case 'country':
        case 'countryOfIncorporation':
          filtered = filtered.filter(row => 
            row.countryOfIncorporation.toLowerCase().includes(filterValue.toLowerCase())
          )
          break
        case 'relationship':
          filtered = filtered.filter(row => 
            row.relationship.toLowerCase().includes(filterValue.toLowerCase())
          )
          break
        case 'relatedParties':
          filtered = filtered.filter(row => 
            row.relatedParties.toLowerCase().includes(filterValue.toLowerCase())
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

// Event handlers
const handlePeriodChange = (period: string, quarter: number, year: number) => {
  // Save current data to localStorage before switching periods
  if (selectedPeriod.value && tableData.value.some(row => row.isModified)) {
    try {
      dataService.savePeriodData(selectedPeriod.value, tableData.value)
      // Update allQuarterData for the modal
      allQuarterData.value[selectedPeriod.value] = [...tableData.value]
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
    const periodData = dataService.loadPeriodData(period)
    tableData.value = periodData.map(row => ({
      ...row,
      isModified: false // Reset modified state when loading from storage
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
  try {
    const newRow = dataService.addRow(selectedPeriod.value, {
      companyName: '',
      reportingPeriod: selectedPeriod.value,
      currency: 'SAR',
      relatedParties: '',
      arabicLegalName: '',
      relationship: '',
      directParent: '',
      percentOwnership: '0',
      countryOfIncorporation: 'Saudi Arabia',
      commercialRegistrationNumber: '',
      isModified: true,
      isNewRow: true
    })
    
    // Add to current table data
    tableData.value.push(newRow)
  } catch (error) {
    notificationService.error('Add Row Failed', 'Failed to add new row. Please try again.')
  }
}

const handleDeleteUnsavedRow = (rowId: string) => {
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
  try {
    const duplicatedRows = dataService.duplicateRows(selectedPeriod.value, rowIds)
    
    // Add to local table data
    tableData.value.push(...duplicatedRows)
    
  } catch (error) {
    notificationService.error('Bulk Duplicate Failed', 'Failed to duplicate rows. Please try again.')
  }
}

const handleSaveChanges = () => {
  loading.value = true
  
  try {
    // Save all changes to localStorage
    dataService.savePeriodData(selectedPeriod.value, tableData.value)
    
    setTimeout(() => {
      // Reset modified flags and mark new rows as saved
      tableData.value.forEach(row => {
        row.isModified = false
        row.isNewRow = false // Clear the new row flag when saving
      })
      loading.value = false
      
      // Show success message
      notificationService.success('Changes Saved', 'All changes have been saved successfully!')
    }, 1000)
  } catch (error) {
    loading.value = false
    notificationService.error('Save Failed', 'Failed to save changes. Please try again.')
  }
}

const handleGenerateReport = () => {
  // Add report generation logic here
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
        companyName: data.companyName || '',
        reportingPeriod: selectedPeriod.value,
        currency: data.currency || 'SAR',
        relatedParties: data.relatedParties || '',
        arabicLegalName: data.arabicLegalName || '',
        relationship: data.relationship || '',
        directParent: data.directParent || '',
        percentOwnership: data.percentOwnership || '0',
        countryOfIncorporation: data.countryOfIncorporation || 'Saudi Arabia',
        commercialRegistrationNumber: data.commercialRegistrationNumber || '',
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
onMounted(() => {
  // Initialize data from localStorage
  initializeData()
})

// Initialize data from localStorage with proper error handling
const initializeData = () => {
  try {
    // Initialize localStorage with default data if needed
    const allData = dataService.initializeData()
    
    // Update allQuarterData for the modal to work properly
    allQuarterData.value = allData
    
    // Load data for the default period
    const defaultPeriodData = dataService.loadPeriodData(selectedPeriod.value)
    tableData.value = defaultPeriodData
    
    if (defaultPeriodData[0]) {
      console.log('Country field value:', defaultPeriodData[0].countryOfIncorporation)
      console.log('All fields:', Object.keys(defaultPeriodData[0]))
    }
    console.log('=== END DEBUG ===')
    
    console.log('Initialized data from localStorage:', {
      totalPeriods: Object.keys(allData).length,
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
}
</script>
