<template>
  <div :class="styles.dataTable">
    <!-- Action Bar -->
    <div :class="styles.actionBar">
      <div :class="styles.leftActions">
        <!-- Bulk Actions (shown when items are selected) -->
        <div v-if="selectedRows.length > 0" :class="styles.bulkActions">
          <span :class="styles.selectionInfo">
            {{ selectedRows.length }} {{ t('businessQuarters.selected') }}
          </span>
          
          <button 
            @click="bulkDelete"
            :class="styles.deleteButton"
          >
            <span :class="styles.buttonIcon">🗑️</span>
            {{ t('businessQuarters.deleteSelected') }}
          </button>
          
          <button 
            @click="bulkDuplicate"
            :class="styles.bulkDuplicateButton"
          >
            <span :class="styles.buttonIcon">📋</span>
            {{ t('businessQuarters.duplicateSelected') }}
          </button>
          
          <button 
            @click="clearSelection"
            :class="styles.clearButton"
          >
            <span :class="styles.buttonIcon">✖️</span>
            {{ t('businessQuarters.clearSelection') }}
          </button>
        </div>

        <!-- Regular Actions (shown when no items are selected) -->
        <div v-else :class="styles.regularActions">
          <button 
            @click="$emit('createInForm')"
            :class="styles.addButton"
          >
            <span :class="styles.buttonIcon">📝</span>
            {{ t('businessQuarters.createInForm') }}
          </button>

          <button 
            @click="$emit('copyFromAnotherQuarter')"
            :class="styles.copyQuarterButton"
          >
            <span :class="styles.buttonIcon">📋</span>
            {{ t('businessQuarters.copyFromAnotherQuarter') }}
          </button>

          <button 
            @click="$emit('addRow')"
            :class="styles.addButton"
          >
            <span :class="styles.buttonIcon">+</span>
            {{ t('businessQuarters.insertRow') }}
          </button>
          
          <button 
            @click="$emit('saveChanges')"
            :class="[styles.saveButton, hasChanges ? styles.active : '']"
            :disabled="!hasChanges"
          >
            <span :class="styles.buttonIcon">💾</span>
            {{ t('businessQuarters.saveChanges') }}
          </button>
        </div>
      </div>
      
      <div :class="styles.rightActions">
        <button 
          @click="$emit('generateReport')"
          :class="styles.reportButton"
        >
          <span :class="styles.buttonIcon">📊</span>
          {{ t('businessQuarters.generateReport') }}
        </button>
        
        <!-- Current Selection Display -->
        <div :class="styles.currentSelection">
          <div :class="styles.selectionBadge">
            <span :class="styles.badgeIcon">📅</span>
            <span :class="styles.badgeText">{{ props.currentPeriod || 'Q1 2025' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div :class="styles.tableContainer">
      <table ref="tableRef" :class="styles.table">
        <thead :class="styles.tableHead">
          <tr>
            <!-- Select All Checkbox -->
            <th :class="styles.tableHeader" :style="{ width: '50px', minWidth: '50px', maxWidth: '50px' }">
              <div :class="styles.headerContent">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  :class="styles.selectAllCheckbox"
                />
              </div>
            </th>
            <th 
              v-for="column in columns" 
              :key="column.key" 
              :class="styles.tableHeader"
              :style="getColumnStyle(column.key)"
            >
              <div :class="styles.headerContent">
                <span>{{ t(`businessQuarters.columns.${column.key}`) }}</span>
                <div :style="{ backgroundColor: 'rgba(0, 181, 141, 0.20)' }"
                  :class="styles.resizeHandle"
                  @mousedown="startResize($event, column.key)"
                  @click.stop
                ></div>
              </div>
            </th>
            <th 
              :class="styles.tableHeader"
              :style="getColumnStyle('actions')"
            >
              <div :class="styles.headerContent">
                <span>{{ t('businessQuarters.actions') }}</span>
                <div 
                  :class="styles.resizeHandle"
                  @mousedown="startResize($event, 'actions')"
                  @click.stop
                ></div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody :class="styles.tableBody">
          <tr 
            v-for="row in data" 
            :key="row.id" 
            :class="[
              styles.tableRow, 
              row.isModified ? styles.modified : '',
              selectedRows.includes(row.id) ? styles.selected : ''
            ]"
          >
            <!-- Row Selection Checkbox -->
            <td :class="styles.tableCell" :style="{ width: '50px', minWidth: '50px', maxWidth: '50px' }">
              <input
                type="checkbox"
                :checked="selectedRows.includes(row.id)"
                @change="toggleRowSelection(row.id)"
                :class="styles.rowCheckbox"
              />
            </td>
            <td 
              v-for="column in columns" 
              :key="column.key" 
              :class="styles.tableCell"
              :style="getColumnStyle(column.key)"
            >
              <!-- SearchableDropdown for Country of Incorporation -->
              <SearchableDropdown
                v-if="column.editable && column.key === DROPDOWN_COLUMNS.COUNTRY_OF_INCORPORATION"
                :model-value="row[column.key]"
                @update:model-value="handleDropdownChange(row, column.key, $event)"
                :options="countries"
                placeholder="Select country..."
                search-placeholder="Search countries..."
                no-results-text="No countries found"
                :class="[
                  column.required && !row[column.key] ? styles.requiredField : '',
                  !isFieldValid(row, column.key) ? styles.invalidField : ''
                ]"
              />
              <!-- SearchableDropdown for Currency -->
              <SearchableDropdown
                v-else-if="column.editable && column.key === DROPDOWN_COLUMNS.CURRENCY"
                :model-value="row[column.key]"
                @update:model-value="handleDropdownChange(row, column.key, $event)"
                :options="currencies"
                placeholder="Select currency..."
                search-placeholder="Search currencies..."
                no-results-text="No currencies found"
                :class="[
                  column.required && !row[column.key] ? styles.requiredField : '',
                  !isFieldValid(row, column.key) ? styles.invalidField : ''
                ]"
              />
              <!-- Regular input for other editable columns -->
              <input
                v-else-if="column.editable && column.key !== 'reportingPeriod'"
                v-model="row[column.key]"
                @input="markAsModified(row)"
                @blur="validateField(row, column.key)"
                :class="[
                  styles.cellInput,
                  column.required && !row[column.key] ? styles.requiredField : '',
                  !isFieldValid(row, column.key) ? styles.invalidField : ''
                ]"
                :type="column.type || 'text'"
                :required="column.required"
                :placeholder="column.required ? 'Required *' : ''"
              />
              <!-- Display span for non-editable columns -->
              <span v-else :class="styles.cellText">{{ row[column.key] }}</span>
            </td>
            <td 
              :class="styles.tableCell"
              :style="getColumnStyle('actions')"
            >
              <div :class="styles.actionButtons">
                <button 
                  @click="$emit('viewRow', row)"
                  :class="styles.actionButton"
                  :title="t('businessQuarters.viewDetails')"
                >
                  <span :class="styles.actionIcon">👁️</span>
                </button>
                <button 
                  @click="$emit('editRow', row)"
                  :class="styles.actionButton"
                  :title="t('businessQuarters.editRecord')"
                >
                  <span :class="styles.actionIcon">✏️</span>
                </button>
                <button 
                  @click="duplicateRowInPlace(row)"
                  :class="styles.duplicateButton"
                  :title="t('businessQuarters.duplicate')"
                >
                  <span :class="styles.actionIcon">📋</span>
                </button>
                <!-- Delete button for unsaved rows -->
                <button 
                  v-if="row.isNewRow"
                  @click="deleteUnsavedRow(row.id)"
                  :class="styles.deleteRowButton"
                  :title="t('businessQuarters.deleteUnsaved')"
                >
                  <span :class="styles.actionIcon">🗑️</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Loading State -->
    <div v-if="loading" :class="styles.loadingState">
      <div :class="styles.spinner"></div>
      <span>{{ t('businessQuarters.loading') }}</span>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && data.length === 0" :class="styles.emptyState">
      <span :class="styles.emptyIcon">📊</span>
      <h3>{{ t('businessQuarters.noData') }}</h3>
      <p>{{ t('businessQuarters.noDataDescription') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import SearchableDropdown from '../SearchableDropdown/SearchableDropdown.vue'
import styles from './DataTable.module.css'
import countriesData from '../../data/countries.json'
import currenciesData from '../../data/currencies.json'

interface Column {
  key: string
  editable?: boolean
  type?: string
  required?: boolean
}

interface TableRow {
  id: string
  isModified?: boolean
  isNewRow?: boolean // New property to track unsaved rows
  [key: string]: any
}

interface Props {
  data: TableRow[]
  columns: Column[]
  loading?: boolean
  tableId?: string // Unique identifier for storing column widths
  currentPeriod?: string // Current quarter/year selection display
}

// Column key constants for dropdown columns
const DROPDOWN_COLUMNS = {
  COUNTRY_OF_INCORPORATION: 'countryOfIncorporation',
  CURRENCY: 'currency'
} as const

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  tableId: 'default',
  currentPeriod: ''
})

const emit = defineEmits<{
  addRow: []
  saveChanges: []
  generateReport: []
  createInForm: []
  copyFromAnotherQuarter: []
  viewRow: [row: TableRow]
  editRow: [row: TableRow]
  duplicateRow: [row: TableRow, insertIndex: number]
  rowModified: [row: TableRow]
  deleteUnsavedRow: [rowId: string]
  bulkDelete: [rowIds: string[]]
  bulkDuplicate: [rowIds: string[]]
}>()

const { t } = useI18n()

// Multi-select functionality
const selectedRows = ref<string[]>([])

// Validation state
const fieldErrors = ref<Record<string, Record<string, string>>>({})

// Column width management
const columnWidths = ref<Record<string, number>>({})
const isResizing = ref(false)
const resizingColumn = ref<string | null>(null)
const startX = ref(0)
const startWidth = ref(0)
const tableRef = ref<HTMLTableElement>()

const hasChanges = computed(() => {
  return props.data.some(row => row.isModified)
})

// Multi-select computed properties
const isAllSelected = computed(() => {
  return props.data.length > 0 && selectedRows.value.length === props.data.length
})

// Dropdown options
const countries = computed(() => countriesData)
const currencies = computed(() => currenciesData)

const markAsModified = (row: TableRow) => {
  row.isModified = true
  // Validate all required fields when row is modified
  props.columns.forEach(column => {
    if (column.required) {
      validateField(row, column.key)
    }
  })
  emit('rowModified', row)
}

// Handle dropdown value changes
const handleDropdownChange = (row: TableRow, columnKey: string, value: string | number) => {
  row[columnKey] = value
  validateField(row, columnKey)
  markAsModified(row)
}

// Multi-select functions
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRows.value = []
  } else {
    selectedRows.value = props.data.map(row => row.id)
  }
}

const toggleRowSelection = (rowId: string) => {
  const index = selectedRows.value.indexOf(rowId)
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(rowId)
  }
}

const clearSelection = () => {
  selectedRows.value = []
}

// Bulk actions
const bulkDelete = () => {
  emit('bulkDelete', [...selectedRows.value])
  selectedRows.value = []
}

const bulkDuplicate = () => {
  emit('bulkDuplicate', [...selectedRows.value])
  selectedRows.value = []
}

// Delete unsaved row
const deleteUnsavedRow = (rowId: string) => {
  emit('deleteUnsavedRow', rowId)
  // Remove from selection if selected
  const index = selectedRows.value.indexOf(rowId)
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  }
}

// Duplicate row and insert it right below the original
const duplicateRowInPlace = (row: TableRow) => {
  // Find the index of the current row in the data array
  const currentIndex = props.data.findIndex(item => item.id === row.id)
  
  if (currentIndex !== -1) {
    // Emit with the row and the insertion index (right after current row)
    emit('duplicateRow', row, currentIndex + 1)
  }
}

// Validation functions
const validateField = (row: TableRow, fieldKey: string) => {
  const column = props.columns.find(col => col.key === fieldKey)
  if (!column) return true
  
  if (!fieldErrors.value[row.id]) {
    fieldErrors.value[row.id] = {}
  }
  
  // Check if field is required and empty
  if (column.required && (!row[fieldKey] || String(row[fieldKey]).trim() === '')) {
    fieldErrors.value[row.id][fieldKey] = 'This field is required'
    return false
  }
  
  // Clear error if validation passes
  delete fieldErrors.value[row.id][fieldKey]
  return true
}

const isFieldValid = (row: TableRow, fieldKey: string) => {
  return !fieldErrors.value[row.id]?.[fieldKey]
}

// Load saved column widths from localStorage
const loadColumnWidths = () => {
  const saved = localStorage.getItem(`table-column-widths-${props.tableId}`)
  if (saved) {
    try {
      columnWidths.value = JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to parse saved column widths:', e)
    }
  }
  
  // Set default widths for columns that don't have saved widths
  props.columns.forEach(column => {
    if (!columnWidths.value[column.key]) {
      columnWidths.value[column.key] = 150 // Default width
    }
  })
  
  // Set default width for actions column
  if (!columnWidths.value['actions']) {
    columnWidths.value['actions'] = 120
  }
}

// Save column widths to localStorage
const saveColumnWidths = () => {
  localStorage.setItem(`table-column-widths-${props.tableId}`, JSON.stringify(columnWidths.value))
}

// Start resizing
const startResize = (event: MouseEvent, columnKey: string) => {
  event.preventDefault()
  isResizing.value = true
  resizingColumn.value = columnKey
  startX.value = event.clientX
  startWidth.value = columnWidths.value[columnKey] || 150
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

// Handle resize
const handleResize = (event: MouseEvent) => {
  if (!isResizing.value || !resizingColumn.value) return
  
  const delta = event.clientX - startX.value
  const newWidth = Math.max(80, startWidth.value + delta) // Minimum width of 80px
  
  columnWidths.value[resizingColumn.value] = newWidth
}

// Stop resizing
const stopResize = () => {
  if (isResizing.value) {
    saveColumnWidths()
  }
  
  isResizing.value = false
  resizingColumn.value = null
  
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// Get column style with width
const getColumnStyle = (columnKey: string) => {
  return {
    width: `${columnWidths.value[columnKey] || 150}px`,
    minWidth: `${columnWidths.value[columnKey] || 150}px`,
    maxWidth: `${columnWidths.value[columnKey] || 150}px`
  }
}

// Debug watcher to monitor data changes
watch(() => props.data, (newData) => {
  console.log('=== DEBUG: DataTable received data ===')
  console.log('Number of rows:', newData.length)
  if (newData.length > 0) {
    console.log('First row:', newData[0])
    console.log('Country field in first row:', newData[0].countryOfIncorporation)
    console.log('Available fields:', Object.keys(newData[0]))
  }
  console.log('=== END DEBUG ===')
}, { immediate: true })

onMounted(() => {
  loadColumnWidths()
  
  // Apply widths after component is mounted
  nextTick(() => {
    if (tableRef.value) {
      // Force table layout
      tableRef.value.style.tableLayout = 'fixed'
    }
  })
})
</script>
