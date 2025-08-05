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
            :disabled="props.readOnly"
            :title="props.readOnly ? 'Cannot delete: Quarter is locked' : ''"
          >
            <span :class="styles.buttonIcon">🗑️</span>
            {{ t('businessQuarters.deleteSelected') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button>
          
          <button 
            @click="bulkDuplicate"
            :class="styles.bulkDuplicateButton"
            :disabled="props.readOnly"
            :title="props.readOnly ? 'Cannot duplicate: Quarter is locked' : ''"
          >
            <span :class="styles.buttonIcon">📋</span>
            {{ t('businessQuarters.duplicateSelected') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
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
            :disabled="props.readOnly"
            :title="props.readOnly ? 'Cannot create: Quarter is locked' : ''"
          >
            <span :class="styles.buttonIcon">📝</span>
            {{ t('businessQuarters.createInForm') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button>

          <button 
            @click="$emit('copyFromAnotherQuarter')"
            :class="styles.copyQuarterButton"
            :disabled="props.readOnly"
            :title="props.readOnly ? 'Cannot copy: Quarter is locked' : ''"
          >
            <span :class="styles.buttonIcon">📋</span>
            {{ t('businessQuarters.copyFromAnotherQuarter') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button>

          <button 
            @click="$emit('addRow')"
            :class="styles.addButton"
            :disabled="props.readOnly"
            :title="props.readOnly ? 'Cannot add row: Quarter is locked' : ''"
          >
            <span :class="styles.buttonIcon">+</span>
            {{ t('businessQuarters.insertRow') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button>
          
          <button 
            @click="$emit('saveChanges')"
            :class="[styles.saveButton, canSave && !props.readOnly ? styles.active : '']"
            :disabled="!canSave || props.readOnly"
            :title="getDisabledSaveTitle()"
          >
            <span :class="styles.buttonIcon">💾</span>
            {{ t('businessQuarters.saveChanges') }}
            <span v-if="hasValidationErrors" :class="styles.errorBadge">{{ validationErrorCount }}</span>
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
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
              <div :class="styles.cellContainer">
                <!-- SearchableDropdown for Entity Name English -->
                <SearchableDropdown
                  v-if="column.editable && column.key === DROPDOWN_COLUMNS.ENTITY_NAME_ENGLISH"
                  :model-value="row[column.key]"
                  @update:model-value="handleDropdownChange(row, column.key, $event)"
                  :options="entityNameOptions"
                  placeholder="Select entity name..."
                  search-placeholder="Search entities..."
                  no-results-text="No entities found"
                  :disabled="props.readOnly"
                  :class="[
                    column.required && !row[column.key] ? styles.requiredField : '',
                    !isFieldValid(row, column.key) ? styles.invalidField : '',
                    props.readOnly ? styles.readOnlyField : ''
                  ]"
                />
                <!-- SearchableDropdown for Entity Name Arabic -->
                <SearchableDropdown
                  v-else-if="column.editable && column.key === DROPDOWN_COLUMNS.ENTITY_NAME_ARABIC"
                  :model-value="row[column.key]"
                  @update:model-value="handleDropdownChange(row, column.key, $event)"
                  :options="arabicLegalNameOptions"
                  placeholder="Select Arabic legal name..."
                  search-placeholder="Search Arabic names..."
                  no-results-text="No Arabic names found"
                  :disabled="props.readOnly"
                  :class="[
                    column.required && !row[column.key] ? styles.requiredField : '',
                    !isFieldValid(row, column.key) ? styles.invalidField : '',
                    props.readOnly ? styles.readOnlyField : ''
                  ]"
                />
                <!-- SearchableDropdown for Country of Incorporation -->
                <SearchableDropdown
                  v-else-if="column.editable && column.key === DROPDOWN_COLUMNS.COUNTRY_OF_INCORPORATION"
                  :model-value="row[column.key]"
                  @update:model-value="handleDropdownChange(row, column.key, $event)"
                  :options="countries"
                  placeholder="Select country..."
                  search-placeholder="Search countries..."
                  no-results-text="No countries found"
                  :disabled="props.readOnly"
                  :class="[
                    column.required && !row[column.key] ? styles.requiredField : '',
                    !isFieldValid(row, column.key) ? styles.invalidField : '',
                    props.readOnly ? styles.readOnlyField : ''
                  ]"
                />
                <!-- SearchableDropdown for Investment Relationship Type -->
                <SearchableDropdown
                  v-else-if="column.editable && column.key === DROPDOWN_COLUMNS.INVESTMENT_RELATIONSHIP_TYPE"
                  :model-value="row[column.key]"
                  @update:model-value="handleDropdownChange(row, column.key, $event)"
                  :options="relationshipTypeOptions"
                  placeholder="Select relationship type..."
                  search-placeholder="Search relationship types..."
                  no-results-text="No relationship types found"
                  :disabled="props.readOnly"
                  :class="[
                    column.required && !row[column.key] ? styles.requiredField : '',
                    !isFieldValid(row, column.key) ? styles.invalidField : '',
                    props.readOnly ? styles.readOnlyField : ''
                  ]"
                />
                <!-- SearchableDropdown for Ownership Structure -->
                <SearchableDropdown
                  v-else-if="column.editable && column.key === DROPDOWN_COLUMNS.OWNERSHIP_STRUCTURE"
                  :model-value="row[column.key]"
                  @update:model-value="handleDropdownChange(row, column.key, $event)"
                  :options="ownershipStructureOptions"
                  placeholder="Select ownership structure..."
                  search-placeholder="Search ownership structures..."
                  no-results-text="No ownership structures found"
                  :disabled="props.readOnly"
                  :class="[
                    column.required && !row[column.key] ? styles.requiredField : '',
                    !isFieldValid(row, column.key) ? styles.invalidField : '',
                    props.readOnly ? styles.readOnlyField : ''
                  ]"
                />
                <!-- SearchableDropdown for Direct Parent Entity -->
                <SearchableDropdown
                  v-else-if="column.editable && column.key === DROPDOWN_COLUMNS.DIRECT_PARENT_ENTITY"
                  :model-value="row[column.key]"
                  @update:model-value="handleDropdownChange(row, column.key, $event)"
                  :options="directParentOptions"
                  placeholder="Select direct parent..."
                  search-placeholder="Search parent entities..."
                  no-results-text="No parent entities found"
                  :disabled="props.readOnly"
                  :class="[
                    column.required && !row[column.key] ? styles.requiredField : '',
                    !isFieldValid(row, column.key) ? styles.invalidField : '',
                    props.readOnly ? styles.readOnlyField : ''
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
                  :disabled="props.readOnly"
                  :class="[
                    column.required && !row[column.key] ? styles.requiredField : '',
                    !isFieldValid(row, column.key) ? styles.invalidField : '',
                    props.readOnly ? styles.readOnlyField : ''
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
                    !isFieldValid(row, column.key) ? styles.invalidField : '',
                    props.readOnly ? styles.readOnlyField : ''
                  ]"
                  :type="column.type || 'text'"
                  :required="column.required"
                  :placeholder="props.readOnly ? 'Read-only' : (column.required ? 'Required *' : '')"
                  :disabled="props.readOnly"
                  :readonly="props.readOnly"
                />
                <!-- Display span for non-editable columns -->
                <span v-else :class="styles.cellText">
                  {{ row[column.key] }}
                  <span v-if="props.readOnly && column.editable" :class="styles.lockIcon">🔒</span>
                </span>
                
                <!-- Validation Error Message -->
                <div 
                  v-if="!isFieldValid(row, column.key) && fieldErrors[row.id]?.[column.key]" 
                  :class="styles.cellError"
                >
                  {{ fieldErrors[row.id][column.key] }}
                </div>
              </div>
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
                  :title="props.readOnly ? 'Cannot edit: Quarter is locked' : t('businessQuarters.editRecord')"
                  :disabled="props.readOnly"
                >
                  <span :class="styles.actionIcon">✏️</span>
                  <span v-if="props.readOnly" :class="styles.lockIcon">🔒</span>
                </button>
                <button 
                  @click="duplicateRowInPlace(row)"
                  :class="styles.duplicateButton"
                  :title="props.readOnly ? 'Cannot duplicate: Quarter is locked' : t('businessQuarters.duplicate')"
                  :disabled="props.readOnly"
                >
                  <span :class="styles.actionIcon">📋</span>
                  <span v-if="props.readOnly" :class="styles.lockIcon">🔒</span>
                </button>
                <!-- Delete button for unsaved rows -->
                <button 
                  v-if="row.isNewRow"
                  @click="deleteUnsavedRow(row.id)"
                  :class="styles.deleteRowButton"
                  :title="props.readOnly ? 'Cannot delete: Quarter is locked' : t('businessQuarters.deleteUnsaved')"
                  :disabled="props.readOnly"
                >
                  <span :class="styles.actionIcon">🗑️</span>
                  <span v-if="props.readOnly" :class="styles.lockIcon">🔒</span>
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
  readOnly?: boolean // Quarter is read-only (locked from editing)
  hasDataFromPreviousQuarter?: boolean // Indicates if data was loaded from previous quarter
}

// Column key constants for dropdown columns
const DROPDOWN_COLUMNS = {
  ENTITY_NAME_ENGLISH: 'entityNameEnglish',
  ENTITY_NAME_ARABIC: 'entityNameArabic',
  COUNTRY_OF_INCORPORATION: 'countryOfIncorporation',
  INVESTMENT_RELATIONSHIP_TYPE: 'investmentRelationshipType',
  OWNERSHIP_STRUCTURE: 'ownershipStructure',
  DIRECT_PARENT_ENTITY: 'directParentEntity',
  CURRENCY: 'currency'
} as const

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  tableId: 'default',
  currentPeriod: '',
  readOnly: false,
  hasDataFromPreviousQuarter: false
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
  validationChange: [hasErrors: boolean, errorCount: number]
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

// Validation state computed properties
const hasValidationErrors = computed(() => {
  return Object.values(fieldErrors.value).some(rowErrors => 
    Object.keys(rowErrors).length > 0
  )
})

const validationErrorCount = computed(() => {
  let count = 0
  Object.values(fieldErrors.value).forEach(rowErrors => {
    count += Object.keys(rowErrors).length
  })
  return count
})

const canSave = computed(() => {
  // Can save if there are changes and no validation errors
  // OR if data was loaded from previous quarter (allows saving without manual changes)
  return (hasChanges.value || props.hasDataFromPreviousQuarter) && !hasValidationErrors.value
})

// Multi-select computed properties
const isAllSelected = computed(() => {
  return props.data.length > 0 && selectedRows.value.length === props.data.length
})

// Dropdown options
const countries = computed(() => countriesData)
const currencies = computed(() => currenciesData)

// Entity Name options for English field
const entityNameOptions = computed(() => [
  { value: 'saudi-aramco', label: 'Saudi Aramco' },
  { value: 'sabic', label: 'SABIC (Saudi Basic Industries Corporation)' },
  { value: 'almarai', label: 'Almarai Company' },
  { value: 'stc', label: 'Saudi Telecom Company' },
  { value: 'samba', label: 'Samba Financial Group' },
  { value: 'rajhi-bank', label: 'Al Rajhi Bank' },
  { value: 'riyadh-bank', label: 'Riyad Bank' },
  { value: 'anb', label: 'Arab National Bank' },
  { value: 'pif-ventures', label: 'PIF Ventures' },
  { value: 'neom', label: 'NEOM Company' },
  { value: 'red-sea', label: 'Red Sea Development Company' },
  { value: 'qiddiya', label: 'Qiddiya Investment Company' },
  { value: 'roshn', label: 'Roshn Group' },
  { value: 'elm', label: 'Elm Company' },
  { value: 'sisco', label: 'Saudi Investment Services Company' }
])

// Arabic Legal Name options for Arabic field
const arabicLegalNameOptions = computed(() => [
  { value: 'aramco-ar', label: 'شركة أرامكو السعودية' },
  { value: 'sabic-ar', label: 'الشركة السعودية للصناعات الأساسية' },
  { value: 'almarai-ar', label: 'شركة المراعي' },
  { value: 'stc-ar', label: 'شركة الاتصالات السعودية' },
  { value: 'samba-ar', label: 'مجموعة سامبا المالية' },
  { value: 'rajhi-ar', label: 'مصرف الراجحي' },
  { value: 'riyadh-ar', label: 'بنك الرياض' },
  { value: 'anb-ar', label: 'البنك العربي الوطني' },
  { value: 'pif-ventures-ar', label: 'شركة صندوق الاستثمارات العامة للمشاريع' },
  { value: 'neom-ar', label: 'شركة نيوم' },
  { value: 'red-sea-ar', label: 'شركة تطوير البحر الأحمر' },
  { value: 'qiddiya-ar', label: 'شركة القدية للاستثمار' },
  { value: 'roshn-ar', label: 'مجموعة روشن' },
  { value: 'elm-ar', label: 'شركة علم' },
  { value: 'sisco-ar', label: 'الشركة السعودية للخدمات الاستثمارية' }
])

// Investment Relationship Type options
const relationshipTypeOptions = computed(() => [
  { value: 'subsidiary', label: 'Subsidiary' },
  { value: 'associate', label: 'Associate' },
  { value: 'joint-venture', label: 'Joint Venture' },
  { value: 'investment', label: 'Investment' },
  { value: 'partnership', label: 'Partnership' }
])

// Ownership Structure options
const ownershipStructureOptions = computed(() => [
  { value: 'public-listed', label: 'Public Listed Company' },
  { value: 'private-limited', label: 'Private Limited Company' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole-proprietorship', label: 'Sole Proprietorship' },
  { value: 'government-entity', label: 'Government Entity' }
])

// Direct Parent Entity options - dynamically generated from existing Entity Names in the table
const directParentOptions = computed(() => {
  // Get all unique Entity Names from the current table data
  const entityNames = props.data
    .map(row => row.entityNameEnglish)
    .filter(name => name && String(name).trim() !== '') // Filter out empty/null values
    .map(name => String(name).trim()) // Ensure string and trim whitespace
  
  // Remove duplicates and create dropdown options
  const uniqueNames = [...new Set(entityNames)]
  
  return uniqueNames.map(name => ({
    value: name,
    label: name
  }))
})

const markAsModified = (row: TableRow) => {
  row.isModified = true
  
  // Initialize field errors for the row if not exists
  if (!fieldErrors.value[row.id]) {
    fieldErrors.value[row.id] = {}
  }
  
  // Validate all required fields when row is modified
  props.columns.forEach(column => {
    if (column.required) {
      validateField(row, column.key)
    }
  })
  
  // Always validate CR and MOI fields since their requirements depend on country
  validateField(row, 'commercialRegistrationNumber')
  validateField(row, 'moiNumber')
  
  emit('rowModified', row)
}

// Handle dropdown value changes
const handleDropdownChange = (row: TableRow, columnKey: string, value: string | number) => {
  row[columnKey] = value
  validateField(row, columnKey)
  
  // If country changes, re-validate CR and MOI fields since requirements depend on country
  if (columnKey === 'countryOfIncorporation') {
    validateField(row, 'commercialRegistrationNumber')
    validateField(row, 'moiNumber')
  }
  
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
  
  // Initialize field errors for the row if not exists
  if (!fieldErrors.value[row.id]) {
    fieldErrors.value[row.id] = {}
  }
  
  const value = row[fieldKey]
  const countryOfIncorporation = row.countryOfIncorporation
  const isSaudiEntity = countryOfIncorporation === 'SAU'
  
  // Special validation for Commercial Registration (CR) Number
  if (fieldKey === 'commercialRegistrationNumber') {
    // CR Number is always required
    if (!value || String(value).trim() === '') {
      fieldErrors.value[row.id][fieldKey] = 'Commercial Registration Number is required'
      return false
    }
    
    // If Saudi entity, must be numbers only
    if (isSaudiEntity) {
      const numbersOnlyRegex = /^[0-9]+$/
      if (!numbersOnlyRegex.test(String(value).trim())) {
        fieldErrors.value[row.id][fieldKey] = 'Commercial Registration Number must contain numbers only for Saudi entities'
        return false
      }
    }
    // For non-Saudi entities, any alphanumeric string is acceptable (no additional format validation)
  }
  
  // Special validation for Ministry of Interior (MOI) Number
  if (fieldKey === 'moiNumber') {
    // MOI Number is required only for Saudi entities
    if (isSaudiEntity) {
      if (!value || String(value).trim() === '') {
        fieldErrors.value[row.id][fieldKey] = 'MOI Number is required for Saudi entities'
        return false
      }
      
      // Must be numbers only for Saudi entities
      const numbersOnlyRegex = /^[0-9]+$/
      if (!numbersOnlyRegex.test(String(value).trim())) {
        fieldErrors.value[row.id][fieldKey] = 'MOI Number must contain numbers only for Saudi entities'
        return false
      }
    }
    // For non-Saudi entities, MOI number can be empty (no validation needed)
  }
  
  // Special validation for Direct Parent Entity
  if (fieldKey === 'directParentEntity') {
    // Direct Parent is not required, but if provided, must exist as Entity Name in another row
    if (value && String(value).trim() !== '') {
      const entityNameExists = props.data.some(dataRow => 
        dataRow.id !== row.id && // Must be a different row
        dataRow.entityNameEnglish && 
        String(dataRow.entityNameEnglish).trim() === String(value).trim()
      )
      
      if (!entityNameExists) {
        fieldErrors.value[row.id][fieldKey] = 'Direct Parent Entity must exist as an Entity Name in another row'
        return false
      }
    }
  }
  
  // General required field validation for other fields
  if (column.required && fieldKey !== 'commercialRegistrationNumber' && fieldKey !== 'moiNumber') {
    if (!value || String(value).trim() === '') {
      fieldErrors.value[row.id][fieldKey] = 'This field is required'
      return false
    }
  }
  
  // Clear error if validation passes
  delete fieldErrors.value[row.id][fieldKey]
  return true
}

const isFieldValid = (row: TableRow, fieldKey: string) => {
  return !fieldErrors.value[row.id]?.[fieldKey]
}

// Get tooltip text for disabled save button
const getDisabledSaveTitle = () => {
  if (props.readOnly) {
    return 'Cannot save: This quarter is locked because future quarters have been saved'
  }
  if (!canSave.value && hasValidationErrors.value) {
    return `Cannot save: ${validationErrorCount.value} validation error(s)`
  }
  if (props.hasDataFromPreviousQuarter && !hasChanges.value) {
    return 'Save loaded previous quarter data'
  }
  if (!hasChanges.value && !props.hasDataFromPreviousQuarter) {
    return 'No changes to save'
  }
  return 'Save changes'
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

// Watch for validation state changes and emit to parent
watch([hasValidationErrors, validationErrorCount], ([hasErrors, errorCount]) => {
  emit('validationChange', hasErrors, errorCount)
}, { immediate: true })

// Debug watcher to monitor data changes
watch(() => props.data, (newData, oldData) => {
  console.log('=== DEBUG: DataTable received data ===')
  console.log('Number of rows:', newData.length)
  if (newData.length > 0) {
    console.log('First row:', newData[0])
    console.log('Country field in first row:', newData[0].countryOfIncorporation)
    console.log('Available fields:', Object.keys(newData[0]))
  }
  
  // Check for new rows and validate them immediately
  if (oldData && newData.length > oldData.length) {
    // Find newly added rows
    const newRows = newData.filter(newRow => 
      !oldData.some(oldRow => oldRow.id === newRow.id)
    )
    
    // Validate each new row
    newRows.forEach(row => {
      if (row.isNewRow) {
        // Initialize field errors for the new row
        if (!fieldErrors.value[row.id]) {
          fieldErrors.value[row.id] = {}
        }
        
        // Validate all required fields and special validation rules
        props.columns.forEach(column => {
          validateField(row, column.key)
        })
      }
    })
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
