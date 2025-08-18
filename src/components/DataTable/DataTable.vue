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
          <!-- <button 
            @click="$emit('createInForm')"
            :class="styles.addButton"
            :disabled="props.readOnly"
            :title="props.readOnly ? 'Cannot create: Quarter is locked' : ''"
          >
            <span :class="styles.buttonIcon">📝</span>
            {{ t('businessQuarters.createInForm') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button> -->

          <!-- <button 
            @click="$emit('copyFromAnotherQuarter')"
            :class="styles.copyQuarterButton"
            :disabled="props.readOnly"
            :title="props.readOnly ? 'Cannot copy: Quarter is locked' : ''"
          >
            <span :class="styles.buttonIcon">📋</span>
            {{ t('businessQuarters.copyFromAnotherQuarter') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button> -->

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
            @click="showUploadModal = true"
            :class="styles.uploadButton"
            :disabled="props.readOnly"
            :title="props.readOnly ? 'Cannot upload: Quarter is locked' : ''"
          >
            <span :class="styles.buttonIcon">📤</span>
            {{ t('xlsxUpload.title') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button>
          
          <button 
            @click="$emit('saveDraft')"
            :class="[styles.draftButton, canSaveDraft && !props.readOnly ? styles.active : '']"
            :disabled="!canSaveDraft || props.readOnly"
            :title="getDisabledDraftTitle()"
          >
            <span :class="styles.buttonIcon">📋</span>
            {{ t('businessQuarters.saveDraft') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button>
          
          <button 
            @click="$emit('saveChanges')"
            :class="[styles.saveButton, canSaveChanges && !props.readOnly ? styles.active : '']"
            :disabled="!canSaveChanges || props.readOnly"
            :title="getDisabledSaveTitle()"
          >
            <span :class="styles.buttonIcon">💾</span>
            {{ t('businessQuarters.saveChanges') }}
            <span v-if="hasValidationErrors" :class="styles.errorBadge">{{ validationErrorCount }}</span>
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button>

          <button 
            @click="$emit('unsubmit')"
            :class="[styles.unsubmitButton, hasSubmittedData && !props.readOnly ? styles.active : '']"
            :disabled="!hasSubmittedData || props.readOnly"
            :title="getDisabledUnsubmitTitle()"
          >
            <span :class="styles.buttonIcon">↩️</span>
            {{ t('businessQuarters.unsubmit') }}
            <span v-if="props.readOnly" :class="styles.lockBadge">🔒</span>
          </button>

          <!-- button of Unsubmit -->
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
              selectedRows.includes(row.id) ? styles.selected : '',
              isRowReadOnly(row) ? styles.readOnlyRow : ''
            ]"
          >
            <!-- Selection cell with dynamic colspan if ENTITY column merged into it -->
            <td
              v-if="!isRowReadOnly(row)"
              :class="styles.tableCell"
              :colspan="selectionColspan(row)"
              :style="selectionColspan(row) === 1 ? { width: '50px', minWidth: '50px', maxWidth: '50px' } : {}"
            >
              <input
                type="checkbox"
                :checked="selectedRows.includes(row.id)"
                @change="toggleRowSelection(row.id)"
                :class="styles.rowCheckbox"
              />
            </td>

            <!-- Render remaining data cells with possible merged colspan -->
            <template v-for="cell in buildRowCells(row)" :key="cell.key">
              <td
                :colspan="cell.colspan"
                :class="styles.tableCell"
                :style="getColumnStyle(cell.key)"
                :data-row-id="row.id"
                :data-column-key="cell.key"
              >
                <div :class="styles.cellContainer">
                  <!-- SearchableDropdown for Entity Name English -->
                  <SearchableDropdown
                    v-if="props.columns.find(c => c.key === cell.key)?.editable && cell.key === DROPDOWN_COLUMNS.ENTITY_NAME_ENGLISH"
                    :model-value="row[cell.key]"
                    @update:model-value="handleDropdownChange(row, cell.key, $event)"
                    :options="getFilteredEntityNameOptions(row)"
                    placeholder="Select entity name..."
                    search-placeholder="Search entities..."
                    no-results-text="No entities found"
                    :disabled="isRowReadOnly(row)"
                    :class="[
                      props.columns.find(c => c.key === cell.key)?.required && !row[cell.key] ? styles.requiredField : '',
                      !isFieldValid(row, cell.key) ? styles.invalidField : '',
                      isRowReadOnly(row) ? styles.readOnlyField : ''
                    ]"
                  />
                  <!-- SearchableDropdown for Entity Name Arabic -->
                  <SearchableDropdown
                    v-else-if="props.columns.find(c => c.key === cell.key)?.editable && cell.key === DROPDOWN_COLUMNS.ENTITY_NAME_ARABIC"
                    :model-value="row[cell.key]"
                    @update:model-value="handleDropdownChange(row, cell.key, $event)"
                    :options="arabicLegalNameOptions"
                    placeholder="Select Arabic legal name..."
                    search-placeholder="Search Arabic names..."
                    no-results-text="No Arabic names found"
                    :disabled="isRowReadOnly(row)"
                    :class="[
                      props.columns.find(c => c.key === cell.key)?.required && !row[cell.key] ? styles.requiredField : '',
                      !isFieldValid(row, cell.key) ? styles.invalidField : '',
                      isRowReadOnly(row) ? styles.readOnlyField : ''
                    ]"
                  />
                  <!-- Country of Incorporation -->
                  <SearchableDropdown
                    v-else-if="props.columns.find(c => c.key === cell.key)?.editable && cell.key === DROPDOWN_COLUMNS.COUNTRY_OF_INCORPORATION"
                    :model-value="row[cell.key]"
                    @update:model-value="handleDropdownChange(row, cell.key, $event)"
                    :options="countries"
                    placeholder="Select country..."
                    search-placeholder="Search countries..."
                    no-results-text="No countries found"
                    :disabled="isRowReadOnly(row)"
                    :class="[
                      props.columns.find(c => c.key === cell.key)?.required && !row[cell.key] ? styles.requiredField : '',
                      !isFieldValid(row, cell.key) ? styles.invalidField : '',
                      isRowReadOnly(row) ? styles.readOnlyField : ''
                    ]"
                  />
                  <!-- Investment Relationship Type -->
                  <SearchableDropdown
                    v-else-if="props.columns.find(c => c.key === cell.key)?.editable && cell.key === DROPDOWN_COLUMNS.INVESTMENT_RELATIONSHIP_TYPE"
                    :model-value="row[cell.key]"
                    @update:model-value="handleDropdownChange(row, cell.key, $event)"
                    :options="relationshipTypeOptions"
                    placeholder="Select relationship type..."
                    search-placeholder="Search relationship types..."
                    no-results-text="No relationship types found"
                    :disabled="isRowReadOnly(row)"
                    :class="[
                      props.columns.find(c => c.key === cell.key)?.required && !row[cell.key] ? styles.requiredField : '',
                      !isFieldValid(row, cell.key) ? styles.invalidField : '',
                      isRowReadOnly(row) ? styles.readOnlyField : ''
                    ]"
                  />
                  <!-- Ownership Structure -->
                  <SearchableDropdown
                    v-else-if="props.columns.find(c => c.key === cell.key)?.editable && cell.key === DROPDOWN_COLUMNS.OWNERSHIP_STRUCTURE"
                    :model-value="row[cell.key]"
                    @update:model-value="handleDropdownChange(row, cell.key, $event)"
                    :options="ownershipStructureOptions"
                    placeholder="Select ownership structure..."
                    search-placeholder="Search ownership structures..."
                    no-results-text="No ownership structures found"
                    :disabled="isRowReadOnly(row)"
                    :class="[
                      props.columns.find(c => c.key === cell.key)?.required && !row[cell.key] ? styles.requiredField : '',
                      !isFieldValid(row, cell.key) ? styles.invalidField : '',
                      isRowReadOnly(row) ? styles.readOnlyField : ''
                    ]"
                  />
                  <!-- Direct Parent Entity -->
                  <SearchableDropdown
                    v-else-if="props.columns.find(c => c.key === cell.key)?.editable && cell.key === DROPDOWN_COLUMNS.DIRECT_PARENT_ENTITY"
                    :model-value="row[cell.key]"
                    @update:model-value="handleDropdownChange(row, cell.key, $event)"
                    :options="directParentOptions"
                    placeholder="Select direct parent..."
                    search-placeholder="Search parent entities..."
                    no-results-text="No parent entities found"
                    :disabled="isRowReadOnly(row)"
                    :class="[
                      props.columns.find(c => c.key === cell.key)?.required && !row[cell.key] ? styles.requiredField : '',
                      !isFieldValid(row, cell.key) ? styles.invalidField : '',
                      isRowReadOnly(row) ? styles.readOnlyField : ''
                    ]"
                  />
                  <!-- Currency -->
                  <SearchableDropdown
                    v-else-if="props.columns.find(c => c.key === cell.key)?.editable && cell.key === DROPDOWN_COLUMNS.CURRENCY"
                    :model-value="row[cell.key]"
                    @update:model-value="handleDropdownChange(row, cell.key, $event)"
                    :options="currencies"
                    placeholder="Select currency..."
                    search-placeholder="Search currencies..."
                    no-results-text="No currencies found"
                    :disabled="isRowReadOnly(row)"
                    :class="[
                      props.columns.find(c => c.key === cell.key)?.required && !row[cell.key] ? styles.requiredField : '',
                      !isFieldValid(row, cell.key) ? styles.invalidField : '',
                      isRowReadOnly(row) ? styles.readOnlyField : ''
                    ]"
                  />
                  <!-- Generic input -->
                  <input
                    v-else-if="props.columns.find(c => c.key === cell.key)?.editable && cell.key !== 'reportingPeriod'"
                    v-model="row[cell.key]"
                    @input="markAsModified(row)"
                    @blur="validateField(row, cell.key)"
                    :class="[
                      styles.cellInput,
                      props.columns.find(c => c.key === cell.key)?.required && !row[cell.key] ? styles.requiredField : '',
                      !isFieldValid(row, cell.key) ? styles.invalidField : '',
                      isRowReadOnly(row) ? styles.readOnlyField : ''
                    ]"
                    :type="props.columns.find(c => c.key === cell.key)?.type || 'text'"
                    :required="props.columns.find(c => c.key === cell.key)?.required"
                    :placeholder="isRowReadOnly(row) ? 'Read-only' : (props.columns.find(c => c.key === cell.key)?.required ? 'Required *' : '')"
                    :disabled="isRowReadOnly(row)"
                    :readonly="isRowReadOnly(row)"
                  />
                  <!-- Static text -->
                  <span v-else :class="styles.cellText">
                    {{ row[cell.key] }}
                    <span v-if="isRowReadOnly(row) && props.columns.find(c => c.key === cell.key)?.editable" :class="styles.lockIcon">🔒</span>
                  </span>
                  <!-- Validation error -->
                  <div
                    v-if="!isFieldValid(row, cell.key) && fieldErrors[row.id]?.[cell.key]"
                    :class="styles.cellError"
                    @click.stop
                  >
                    {{ fieldErrors[row.id][cell.key] }}
                  </div>
                </div>
              </td>
            </template>

            <td 
              :class="styles.tableCell"
              :style="getColumnStyle('actions')"
            >
              <div :class="styles.actionButtons">
                <!-- ...existing action buttons... -->
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
                  :title="isRowReadOnly(row) ? 'Cannot edit: Row is read-only' : t('businessQuarters.editRecord')"
                  :disabled="isRowReadOnly(row)"
                >
                  <span :class="styles.actionIcon">✏️</span>
                  <span v-if="isRowReadOnly(row)" :class="styles.lockIcon">🔒</span>
                </button>
                <button 
                  @click="duplicateRowInPlace(row)"
                  :class="styles.duplicateButton"
                  :title="isRowReadOnly(row) ? 'Cannot duplicate: Row is read-only' : t('businessQuarters.duplicate')"
                  :disabled="isRowReadOnly(row)"
                >
                  <span :class="styles.actionIcon">📋</span>
                  <span v-if="isRowReadOnly(row)" :class="styles.lockIcon">🔒</span>
                </button>
                <button 
                  v-if="row.isNewRow"
                  @click="deleteUnsavedRow(row.id)"
                  :class="styles.deleteRowButton"
                  :title="isRowReadOnly(row) ? 'Cannot delete: Row is read-only' : t('businessQuarters.deleteUnsaved')"
                  :disabled="isRowReadOnly(row)"
                >
                  <span :class="styles.actionIcon">🗑️</span>
                  <span v-if="isRowReadOnly(row)" :class="styles.lockIcon">🔒</span>
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

    <!-- XLSX Upload Modal -->
    <XlsxUploadModal
      :is-visible="showUploadModal"
      :columns="props.columns"
      :current-period="props.currentPeriod"
      @close="showUploadModal = false"
      @upload="handleXlsxUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import SearchableDropdown from '../SearchableDropdown'
import XlsxUploadModal from '../XlsxUploadModal'
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
  isRowReadOnly?: boolean // New property to control row-level read-only access
  dataSource?: string // Property to identify data source ('admin' or 'company')
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
  userRole?: string // User role for conditional rendering ('Administrator' or 'Company')
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
  hasDataFromPreviousQuarter: false,
  userRole: 'Administrator'
})

const emit = defineEmits<{
  addRow: []
  saveDraft: []
  saveChanges: []
  unsubmit: []
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
  xlsxUpload: [data: TableRow[]]
}>()

const { t } = useI18n()

// Multi-select functionality
const selectedRows = ref<string[]>([])

// Upload modal state
const showUploadModal = ref(false)

// Validation state
const fieldErrors = ref<Record<string, Record<string, string>>>({})

// Column width management
const columnWidths = ref<Record<string, number>>({})
const isResizing = ref(false)
const resizingColumn = ref<string | null>(null)
const startX = ref(0)
const startWidth = ref(0)
const tableRef = ref<HTMLTableElement>()

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

const hasSubmittedData = computed(() => {
  console.log('DataTable hasSubmittedData check:', props.data.map(row => ({ 
    id: row.id, 
    isSubmitted: row.isSubmitted, 
    is_submitted: row.is_submitted, 
    type_isSubmitted: typeof row.isSubmitted,
    type_is_submitted: typeof row.is_submitted
  })))
  return props.data.some(row => row.isSubmitted === true || row.isSubmitted === "true")
})

// Save Draft: Always enabled (no conditions)
const canSaveDraft = computed(() => {
  return true
})

// Save Changes: Only enabled if there's at least one row with is_submitted: false
const canSaveChanges = computed(() => {
  return props.data.some(row => row.is_submitted === false)
})

// Multi-select computed properties
const isAllSelected = computed(() => {
  // Only consider non-read-only rows for selection
  const editableRows = props.data.filter(row => !isRowReadOnly(row))
  return editableRows.length > 0 && selectedRows.value.length === editableRows.length
})

// Dropdown options
const countries = computed(() => countriesData)
const currencies = computed(() => currenciesData)

// Entity Name options for English field - Base list of all available entities
const baseEntityNameOptions = [
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
]

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

// Investment Relationship Type options - Fixed list as per requirements
const relationshipTypeOptions = computed(() => [
  { value: 'Subsidiary', label: 'Subsidiary' },
  { value: 'Joint venture', label: 'Joint venture' },
  { value: 'Associate', label: 'Associate' },
  { value: 'Subsidiary of Associate', label: 'Subsidiary of Associate' },
  { value: 'Joint Venture of Associate', label: 'Joint Venture of Associate' },
  { value: 'Associate of Associate', label: 'Associate of Associate' },
  { value: 'Subsidiary of a JV', label: 'Subsidiary of a JV' },
  { value: 'Associate', label: 'Associate' },
  { value: 'Subsidiary', label: 'Subsidiary' },
  { value: 'Associate of a JV', label: 'Associate of a JV' },
  { value: 'Joint Venture of a JV', label: 'Joint Venture of a JV' }
])

// Ownership Structure options - Based on user role
const ownershipStructureOptions = computed(() => {
  if (props.userRole === 'Company') {
    // For Company users: Show dropdown with Direct/In-direct options
    return [
      { value: 'Direct', label: 'Direct' },
      { value: 'In-direct', label: 'In-direct' }
    ]
  } else {
    // For Administrator (PIF_SubmitIQ): Hardcoded value "Direct to PIF"
    return [
      { value: 'Direct to PIF', label: 'Direct to PIF' }
    ]
  }
})

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

// Helper function to get filtered entity name options for a specific row
const getFilteredEntityNameOptions = (currentRow: TableRow) => {
  // Get all currently selected entity name values from OTHER rows (excluding current row)
  const selectedEntityNames = props.data
    .filter(row => row.id !== currentRow.id) // Exclude current row
    .map(row => row.entityNameEnglish)
    .filter(name => name && String(name).trim() !== '') // Filter out empty/null values
    .map(name => String(name).trim()) // Ensure string and trim whitespace
  
  // Remove duplicates to get unique selected values
  const uniqueSelectedNames = [...new Set(selectedEntityNames)]
  
  // Filter out options that are already selected in other rows
  const filteredOptions = baseEntityNameOptions.filter(option => {
    const isAlreadySelected = uniqueSelectedNames.includes(option.label)
    const isCurrentValue = currentRow.entityNameEnglish && String(currentRow.entityNameEnglish).trim() === option.label
    
    // Include option if:
    // 1. It's not selected in other rows, OR
    // 2. It's the current row's selected value (allow keeping current selection)
    return !isAlreadySelected || isCurrentValue
  })
  
  return filteredOptions
}

// Check if a specific row should be read-only
const isRowReadOnly = (row: TableRow): boolean => {
  // Global read-only state (quarter locked)
  if (props.readOnly) {
    return true
  }
  
  // Row-level read-only (for example, Company data when viewed by PIF_SubmitIQ)
  if (row.isRowReadOnly) {
    return true
  }
  
  return false
}

const markAsModified = (row: TableRow) => {
  // Prevent modification if the row is read-only
  if (isRowReadOnly(row)) {
    return
  }
  
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
  // Prevent changes if the row is read-only
  if (isRowReadOnly(row)) {
    return
  }
  
  row[columnKey] = value
  validateField(row, columnKey)
  
  // If country changes, re-validate CR and MOI fields since requirements depend on country
  if (columnKey === 'countryOfIncorporation') {
    validateField(row, 'commercialRegistrationNumber')
    validateField(row, 'moiNumber')
  }
  
  // If entity name changes, re-validate all Direct Parent Entity fields in other rows
  // since they depend on available entity names
  if (columnKey === 'entityNameEnglish') {
    props.data.forEach(otherRow => {
      if (otherRow.id !== row.id && otherRow.directParentEntity) {
        validateField(otherRow, 'directParentEntity')
      }
    })
  }
  
  markAsModified(row)
}

// Multi-select functions
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRows.value = []
  } else {
    // Only select non-read-only rows
    selectedRows.value = props.data
      .filter(row => !isRowReadOnly(row))
      .map(row => row.id)
  }
}

const toggleRowSelection = (rowId: string) => {
  // Find the row to check if it's read-only
  const row = props.data.find(r => r.id === rowId)
  if (row && isRowReadOnly(row)) {
    // Don't allow selection of read-only rows
    return
  }
  
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
  // Filter out read-only rows from bulk delete
  const deletableRows = selectedRows.value.filter(rowId => {
    const row = props.data.find(r => r.id === rowId)
    return row && !isRowReadOnly(row)
  })
  
  if (deletableRows.length === 0) {
    // If no rows can be deleted, show a message (you could emit a notification event here)
    console.warn('No rows can be deleted - all selected rows are read-only')
    return
  }
  
  emit('bulkDelete', deletableRows)
  selectedRows.value = []
}

const bulkDuplicate = () => {
  // Filter out read-only rows from bulk duplicate
  const duplicatableRows = selectedRows.value.filter(rowId => {
    const row = props.data.find(r => r.id === rowId)
    return row && !isRowReadOnly(row)
  })
  
  if (duplicatableRows.length === 0) {
    // If no rows can be duplicated, show a message
    console.warn('No rows can be duplicated - all selected rows are read-only')
    return
  }
  
  emit('bulkDuplicate', duplicatableRows)
  selectedRows.value = []
}

// Handle XLSX upload
const handleXlsxUpload = (data: TableRow[]) => {
  showUploadModal.value = false
  emit('xlsxUpload', data)
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
    // Direct Parent is not required, but if provided, must exist as Entity Name in the same or another row
    if (value && String(value).trim() !== '') {
      const entityNameExists = props.data.some(dataRow => 
        dataRow.entityNameEnglish && 
        String(dataRow.entityNameEnglish).trim() === String(value).trim()
      )
      
      if (!entityNameExists) {
        fieldErrors.value[row.id][fieldKey] = 'Direct Parent Entity must exist as an Entity Name in the same or another row'
        return false
      }
    }
  }
  
  // Special validation for Entity Name English - must be unique across all rows
  if (fieldKey === 'entityNameEnglish') {
    if (value && String(value).trim() !== '') {
      const duplicateExists = props.data.some(dataRow => 
        dataRow.id !== row.id && // Exclude current row
        dataRow.entityNameEnglish && 
        String(dataRow.entityNameEnglish).trim() === String(value).trim()
      )
      
      if (duplicateExists) {
        fieldErrors.value[row.id][fieldKey] = 'Entity Name must be unique. This name is already used in another row'
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

// Get tooltip text for disabled save/submit button
const getDisabledSaveTitle = () => {
  if (props.readOnly) {
    return 'Cannot submit: This quarter is locked because future quarters have been submitted'
  }
  if (!canSaveChanges.value) {
    return 'Cannot submit: No unsubmitted data available'
  }
  return 'Submit for approval (final submission)'
}

// Get tooltip text for disabled draft button
const getDisabledDraftTitle = () => {
  if (props.readOnly) {
    return 'Cannot save draft: This quarter is locked because future quarters have been saved'
  }
  return 'Save as draft (always available, no validation required)'
}

// Get tooltip text for disabled unsubmit button
const getDisabledUnsubmitTitle = () => {
  if (props.readOnly) {
    return 'Cannot unsubmit: This quarter is locked because future quarters have been saved'
  }
  if (!hasSubmittedData.value) {
    return 'No submitted data to unsubmit'
  }
  return 'Unsubmit investments for this period'
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
      columnWidths.value[column.key] = 225 // Increased default width to prevent text overflow
    }
  })
  
  // Set default width for actions column
  if (!columnWidths.value['actions']) {
    columnWidths.value['actions'] = 150 // Increased actions column width
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
  startWidth.value = columnWidths.value[columnKey] || 220
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

// Handle resize
const handleResize = (event: MouseEvent) => {
  if (!isResizing.value || !resizingColumn.value) return
  
  const delta = event.clientX - startX.value
  const newWidth = Math.max(120, startWidth.value + delta) // Increased minimum width to prevent text overflow
  
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
    width: `${columnWidths.value[columnKey] || 220}px`,
    minWidth: `${columnWidths.value[columnKey] || 220}px`,
    maxWidth: `${columnWidths.value[columnKey] || 220}px`
  }
}

// Add helper logic for merged ENTITY NAME cell handling
const ENTITY = DROPDOWN_COLUMNS.ENTITY_NAME_ENGLISH;
const isEmpty = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '');
const isReadOnlyToken = (v: unknown) => typeof v === 'string' && v.replace(/[-\s]+/g, '').toLowerCase() === 'readonly';
const shouldSkipEntityName = (row: TableRow) => isRowReadOnly(row) && (isEmpty(row[ENTITY]) || isReadOnlyToken(row[ENTITY]));
interface BuiltCell { key: string; colspan: number }
const buildRowCells = (row: TableRow): BuiltCell[] => {
  const cols: BuiltCell[] = props.columns.map(c => ({ key: c.key, colspan: 1 }));
  const idx = props.columns.findIndex(c => c.key === ENTITY);
  if (idx !== -1 && shouldSkipEntityName(row)) {
    if (idx > 0) {
      cols[idx - 1].colspan += 1;
      cols.splice(idx, 1);
      (row as any).__mergeIntoSelection = false;
    } else {
      (row as any).__mergeIntoSelection = true;
      cols.splice(idx, 1);
    }
  } else {
    (row as any).__mergeIntoSelection = false;
  }
  return cols;
};
const selectionColspan = (row: TableRow) => (row as any).__mergeIntoSelection ? 2 : 1;

// Watch for validation state changes and emit to parent (simplified)
watch([hasValidationErrors, validationErrorCount], ([hasErrors, errorCount]) => {
  emit('validationChange', hasErrors, errorCount)
}, { immediate: true })

// Removed heavy debug watcher for better performance

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
