<template>
  <Teleport to="body">
    <div v-if="isOpen" :class="styles.modalOverlay" @click="handleOverlayClick">
      <div :class="styles.modalContainer">
        <!-- Modal Header -->
        <div :class="styles.modalHeader">
          <div :class="styles.headerContent">
            <div :class="styles.iconWrapper">
              <span :class="styles.modalIcon">
                {{ mode === 'view' ? '👁️' : mode === 'edit' ? '✏️' : '➕' }}
              </span>
            </div>
            <div>
              <h2 :class="styles.modalTitle">
                {{ getModalTitle() }}
              </h2>
              <p :class="styles.modalSubtitle">
                {{ getModalSubtitle() }}
              </p>
            </div>
          </div>
          <button @click="closeModal" :class="styles.closeButton">
            <span :class="styles.closeIcon">✕</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div :class="styles.modalBody">
          <form @submit.prevent="handleSubmit" :class="styles.form">
            <div :class="styles.formGrid">
              <div 
                v-for="column in columns" 
                :key="column.key"
                :class="styles.formField"
              >
                <label :class="styles.fieldLabel">
                  {{ t(`businessQuarters.columns.${column.key}`) }}
                  <span v-if="isRequired(column)" :class="styles.required">*</span>
                </label>
                
                <div :class="styles.inputWrapper">
                  <!-- Entity Name English - SearchableDropdown -->
                  <SearchableDropdown
                    v-if="column.key === 'entityNameEnglish'"
                    v-model="formData[column.key]"
                    :options="entityNamesOptions"
                    :placeholder="getPlaceholder(column)"
                    :disabled="mode === 'view'"
                    :search-placeholder="t('common.searchEntityName')"
                    :no-results-text="t('common.noResults')"
                    :class="[
                      styles.fieldInput,
                      mode === 'view' ? styles.readonly : ''
                    ]"
                  />
                  
                  <!-- Entity Name Arabic - SearchableDropdown -->
                  <SearchableDropdown
                    v-else-if="column.key === 'entityNameArabic'"
                    v-model="formData[column.key]"
                    :options="entityNamesArabicOptions"
                    :placeholder="getPlaceholder(column)"
                    :disabled="mode === 'view'"
                    :search-placeholder="t('common.searchEntityNameArabic')"
                    :no-results-text="t('common.noResults')"
                    :class="[
                      styles.fieldInput,
                      mode === 'view' ? styles.readonly : ''
                    ]"
                  />
                  
                  <!-- Investment Relationship Type - SearchableDropdown -->
                  <SearchableDropdown
                    v-else-if="column.key === 'investmentRelationshipType'"
                    v-model="formData[column.key]"
                    :options="investmentRelationshipOptions"
                    :placeholder="getPlaceholder(column)"
                    :disabled="mode === 'view'"
                    :search-placeholder="t('common.searchRelationshipType')"
                    :no-results-text="t('common.noResults')"
                    :class="[
                      styles.fieldInput,
                      mode === 'view' ? styles.readonly : ''
                    ]"
                  />
                  
                  <!-- Ownership Structure - SearchableDropdown -->
                  <SearchableDropdown
                    v-else-if="column.key === 'ownershipStructure'"
                    v-model="formData[column.key]"
                    :options="ownershipStructureOptions"
                    :placeholder="getPlaceholder(column)"
                    :disabled="mode === 'view'"
                    :search-placeholder="t('common.searchOwnershipStructure')"
                    :no-results-text="t('common.noResults')"
                    :class="[
                      styles.fieldInput,
                      mode === 'view' ? styles.readonly : ''
                    ]"
                  />
                  
                  <!-- Country of Incorporation Field - SearchableDropdown -->
                  <SearchableDropdown
                    v-else-if="column.key === 'countryOfIncorporation'"
                    v-model="formData[column.key]"
                    :options="countriesData"
                    :placeholder="getPlaceholder(column)"
                    :disabled="mode === 'view'"
                    :search-placeholder="t('common.searchCountry')"
                    :no-results-text="t('common.noResults')"
                    :class="[
                      styles.fieldInput,
                      mode === 'view' ? styles.readonly : ''
                    ]"
                  />
                  
                  <!-- Direct Parent Entity - SearchableDropdown -->
                  <SearchableDropdown
                    v-else-if="column.key === 'directParentEntity'"
                    v-model="formData[column.key]"
                    :options="directParentEntityOptions"
                    :placeholder="getPlaceholder(column)"
                    :disabled="mode === 'view'"
                    :search-placeholder="t('common.searchParentEntity')"
                    :no-results-text="t('common.noParentEntities')"
                    :class="[
                      styles.fieldInput,
                      mode === 'view' ? styles.readonly : ''
                    ]"
                  />
                  
                  <!-- Regular Input Fields -->
                  <input
                    v-else-if="column.type !== 'select' && column.type !== 'textarea'"
                    v-model="formData[column.key]"
                    :type="column.type || 'text'"
                    :class="[
                      styles.fieldInput,
                      mode === 'view' ? styles.readonly : ''
                    ]"
                    :readonly="mode === 'view'"
                    :placeholder="getPlaceholder(column)"
                  />
                  
                  <select
                    v-else-if="column.type === 'select'"
                    v-model="formData[column.key]"
                    :class="[
                      styles.fieldSelect,
                      mode === 'view' ? styles.readonly : ''
                    ]"
                    :disabled="mode === 'view'"
                  >
                    <option value="">{{ t('common.selectOption') }}</option>
                    <option 
                      v-for="option in getSelectOptions(column)" 
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  
                  <textarea
                    v-else
                    v-model="formData[column.key]"
                    :class="[
                      styles.fieldTextarea,
                      mode === 'view' ? styles.readonly : ''
                    ]"
                    :readonly="mode === 'view'"
                    :placeholder="getPlaceholder(column)"
                    rows="3"
                  ></textarea>
                  
                  <div v-if="column.key === 'percentOwnership'" :class="styles.inputSuffix">
                    %
                  </div>
                </div>
                
                <div v-if="errors[column.key]" :class="styles.fieldError">
                  {{ errors[column.key] }}
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Modal Footer -->
        <div v-if="mode !== 'view'" :class="styles.modalFooter">
          <button 
            type="button" 
            @click="closeModal" 
            :class="styles.cancelButton"
          >
            {{ t('common.cancel') }}
          </button>
          <button 
            type="button" 
            @click="handleSubmit" 
            :class="styles.submitButton"
            :disabled="!isFormValid"
          >
            <span :class="styles.buttonIcon">
              {{ mode === 'edit' ? '💾' : '➕' }}
            </span>
            {{ mode === 'edit' ? t('common.saveChanges') : t('common.create') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import SearchableDropdown from '../SearchableDropdown/SearchableDropdown.vue'
import styles from './DataModal.module.css'
import countriesData from '../../data/countries.json'

interface Column {
  key: string
  editable?: boolean
  type?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

interface Props {
  isOpen: boolean
  mode: 'view' | 'edit' | 'create'
  columns: Column[]
  data?: Record<string, any>
  tableData?: Record<string, any>[] // All table data for validation purposes
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [data: Record<string, any>]
}>()

const { t } = useI18n()

// Form state
const formData = ref<Record<string, any>>({})
const errors = ref<Record<string, string>>({})

// Dropdown options
const entityNamesOptions = [
  { value: 'Saudi Aramco', label: 'Saudi Aramco' },
  { value: 'SABIC', label: 'SABIC' },
  { value: 'Al Rajhi Bank', label: 'Al Rajhi Bank' },
  { value: 'Saudi Telecom Company', label: 'Saudi Telecom Company' },
  { value: 'Ma\'aden', label: 'Ma\'aden' },
  { value: 'NEOM Technology', label: 'NEOM Technology' },
  { value: 'Saudi Green Initiative', label: 'Saudi Green Initiative' },
  { value: 'Public Investment Fund', label: 'Public Investment Fund' },
  { value: 'Saudi National Bank', label: 'Saudi National Bank' },
  { value: 'Alinma Bank', label: 'Alinma Bank' },
  { value: 'Riyad Bank', label: 'Riyad Bank' },
  { value: 'Banque Saudi Fransi', label: 'Banque Saudi Fransi' },
  { value: 'Emirates NBD', label: 'Emirates NBD' },
  { value: 'Qatar Petroleum International', label: 'Qatar Petroleum International' },
  { value: 'Mubadala Investment Company', label: 'Mubadala Investment Company' },
  { value: 'Kuwait Investment Authority', label: 'Kuwait Investment Authority' }
]

const entityNamesArabicOptions = [
  { value: 'شركة أرامكو السعودية', label: 'شركة أرامكو السعودية' },
  { value: 'الشركة السعودية للصناعات الأساسية - سابك', label: 'الشركة السعودية للصناعات الأساسية - سابك' },
  { value: 'مصرف الراجحي', label: 'مصرف الراجحي' },
  { value: 'شركة الاتصالات السعودية', label: 'شركة الاتصالات السعودية' },
  { value: 'شركة التعدين العربية السعودية - معادن', label: 'شركة التعدين العربية السعودية - معادن' },
  { value: 'شركة نيوم للتكنولوجيا', label: 'شركة نيوم للتكنولوجيا' },
  { value: 'مبادرة السعودية الخضراء', label: 'مبادرة السعودية الخضراء' },
  { value: 'صندوق الاستثمارات العامة', label: 'صندوق الاستثمارات العامة' },
  { value: 'البنك الأهلي السعودي', label: 'البنك الأهلي السعودي' },
  { value: 'بنك الإنماء', label: 'بنك الإنماء' },
  { value: 'بنك الرياض', label: 'بنك الرياض' },
  { value: 'البنك السعودي الفرنسي', label: 'البنك السعودي الفرنسي' },
  { value: 'بنك الإمارات دبي الوطني', label: 'بنك الإمارات دبي الوطني' },
  { value: 'قطر للبترول الدولية', label: 'قطر للبترول الدولية' },
  { value: 'شركة مبادلة للاستثمار', label: 'شركة مبادلة للاستثمار' },
  { value: 'مؤسسة الكويت للاستثمار', label: 'مؤسسة الكويت للاستثمار' }
]

const investmentRelationshipOptions = [
  { value: 'Subsidiary', label: 'Subsidiary' },
  { value: 'Joint venture', label: 'Joint venture' },
  { value: 'Associate', label: 'Associate' },
  { value: 'Subsidiary of Associate', label: 'Subsidiary of Associate' },
  { value: 'Joint Venture of Associate', label: 'Joint Venture of Associate' },
  { value: 'Associate of Associate', label: 'Associate of Associate' },
  { value: 'Subsidiary of a JV', label: 'Subsidiary of a JV' },
  { value: 'Associate of a JV', label: 'Associate of a JV' },
  { value: 'Joint Venture of a JV', label: 'Joint Venture of a JV' }
]

const ownershipStructureOptions = [
  { value: 'Direct and In-Direct', label: 'Direct and In-Direct' },
  { value: 'Direct to PIF', label: 'Direct to PIF' }
]

// Direct Parent Entity options - dynamically generated from existing Entity Names in the table
const directParentEntityOptions = computed(() => {
  if (!props.tableData || props.tableData.length === 0) {
    return []
  }
  
  const currentRowId = props.data?.id // ID of the row being edited (if applicable)
  
  // Get all unique Entity Names from the table data, excluding the current row
  const entityNames = props.tableData
    .filter(row => row.id !== currentRowId) // Exclude current row
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

// Initialize form data
const initializeFormData = () => {
  const data: Record<string, any> = {}
  
  props.columns.forEach(column => {
    if (props.data && props.data[column.key] !== undefined) {
      data[column.key] = props.data[column.key]
    } else {
      // Default values for new records
      switch (column.key) {
        case 'countryOfIncorporation':
          data[column.key] = 'SAU'
          break
        case 'ownershipPercentage':
          data[column.key] = 0
          break
        case 'ultimateParentEntity':
          data[column.key] = 'Direct to PIF'
          break
        case 'ownershipStructure':
          data[column.key] = 'Direct to PIF'
          break
        default:
          data[column.key] = ''
      }
    }
  })
  
  formData.value = data
}

// Watch for prop changes
watch(() => [props.isOpen, props.data], () => {
  if (props.isOpen) {
    initializeFormData()
    errors.value = {}
  }
}, { immediate: true })

// Computed properties
const isFormValid = computed(() => {
  return props.columns
    .filter(col => isRequired(col))
    .every(col => formData.value[col.key] && formData.value[col.key].toString().trim())
})

// Methods
const getModalTitle = () => {
  switch (props.mode) {
    case 'view':
      return t('businessQuarters.viewDetails')
    case 'edit':
      return t('businessQuarters.editRecord')
    case 'create':
      return t('businessQuarters.createRecord')
    default:
      return ''
  }
}

const getModalSubtitle = () => {
  if (props.mode === 'view' || props.mode === 'edit') {
    return formData.value.companyName || t('businessQuarters.recordDetails')
  }
  return t('businessQuarters.fillRequiredFields')
}

const isRequired = (column: Column) => {
  const requiredFields = [
    'entityNameEnglish', 
    'entityNameArabic', 
    'commercialRegistrationNumber',
    'countryOfIncorporation',
    'ownershipPercentage',
    'directParentEntity',
    'ultimateParentEntity',
    'investmentRelationshipType',
    'ownershipStructure'
  ]
  
  // MOI is required only for Saudi entities
  if (column.key === 'moiNumber') {
    return formData.value.countryOfIncorporation === 'SAU'
  }
  
  return requiredFields.includes(column.key) || column.required
}

const getPlaceholder = (column: Column) => {
  const placeholders: Record<string, string> = {
    entityNameEnglish: t('businessQuarters.placeholders.entityNameEnglish'),
    entityNameArabic: t('businessQuarters.placeholders.entityNameArabic'),
    commercialRegistrationNumber: '1234567890',
    moiNumber: '7001234567',
    ownershipPercentage: '0',
    directParentEntity: t('common.selectEntity'),
    investmentRelationshipType: t('common.selectRelationshipType'),
    ownershipStructure: t('common.selectOwnershipStructure'),
    countryOfIncorporation: t('common.selectCountry'),
    principalActivities: t('businessQuarters.placeholders.principalActivities')
  }
  return placeholders[column.key] || `${t('common.enter')} ${t(`businessQuarters.columns.${column.key}`)}`
}

const getSelectOptions = (column: Column) => {
  if (column.options) return column.options
  
  const options: Record<string, { value: string; label: string }[]> = {
    relationship: [
      { value: 'Subsidiary', label: 'Subsidiary' },
      { value: 'Joint Venture', label: 'Joint Venture' },
      { value: 'Associate', label: 'Associate' },
      { value: 'Parent', label: 'Parent' }
    ]
  }
  
  return options[column.key] || []
}

const validateForm = () => {
  const newErrors: Record<string, string> = {}
  
  props.columns.forEach(column => {
    if (isRequired(column)) {
      const value = formData.value[column.key]
      if (!value || value.toString().trim() === '') {
        newErrors[column.key] = t('validation.required')
      }
    }
    
    // Additional validations
    if (column.key === 'ownershipPercentage') {
      const value = parseFloat(formData.value[column.key])
      if (isNaN(value) || value < 0 || value > 100) {
        newErrors[column.key] = t('validation.invalidPercentage')
      }
    }
    
    // English text validation
    if (column.key === 'entityNameEnglish') {
      const value = formData.value[column.key]
      if (value && !/^[a-zA-Z0-9\s&.'()-]+$/.test(value)) {
        newErrors[column.key] = 'Entity name must contain only English characters, numbers, and common symbols'
      }
    }
    
    // Arabic text validation
    if (column.key === 'entityNameArabic') {
      const value = formData.value[column.key]
      if (value && !/^[\u0600-\u06FF\s\u0660-\u0669.-]+$/.test(value)) {
        newErrors[column.key] = 'Arabic legal name must contain only Arabic characters and numbers'
      }
    }
    
    // CR Number validation - always required, special rules for Saudi entities
    if (column.key === 'commercialRegistrationNumber') {
      const value = formData.value[column.key]
      const isSaudiEntity = formData.value.countryOfIncorporation === 'SAU'
      
      // CR Number is always required for all countries
      if (!value || String(value).trim() === '') {
        newErrors[column.key] = 'Commercial Registration Number is required'
      } else if (isSaudiEntity) {
        // For Saudi entities, must be numbers only
        if (!/^[0-9]+$/.test(String(value).trim())) {
          newErrors[column.key] = 'Commercial Registration Number must contain numbers only for Saudi entities'
        }
      }
      // For non-Saudi entities, any alphanumeric string is acceptable (no additional validation)
    }
    
    // MOI Number validation - required only for Saudi entities
    if (column.key === 'moiNumber') {
      const value = formData.value[column.key]
      const isSaudiEntity = formData.value.countryOfIncorporation === 'SAU'
      
      if (isSaudiEntity) {
        // MOI Number is required for Saudi entities
        if (!value || String(value).trim() === '') {
          newErrors[column.key] = 'MOI Number is required for Saudi entities'
        } else {
          // Must be numbers only for Saudi entities
          if (!/^[0-9]+$/.test(String(value).trim())) {
            newErrors[column.key] = 'MOI Number must contain numbers only for Saudi entities'
          }
        }
      }
      // For non-Saudi entities, MOI number is optional (no validation needed)
    }
    
    // Direct Parent Entity validation
    if (column.key === 'directParentEntity') {
      const value = formData.value[column.key]
      
      // Direct Parent is not required, but if provided, must exist as Entity Name in another row
      if (value && String(value).trim() !== '') {
        if (props.tableData && props.tableData.length > 0) {
          const currentRowId = props.data?.id // ID of the row being edited (if applicable)
          
          const entityNameExists = props.tableData.some(tableRow => 
            tableRow.id !== currentRowId && // Must be a different row (exclude current row being edited)
            tableRow.entityNameEnglish && 
            String(tableRow.entityNameEnglish).trim() === String(value).trim()
          )
          
          if (!entityNameExists) {
            newErrors[column.key] = 'Direct Parent Entity must exist as an Entity Name in another row'
          }
        }
      }
    }
  })
  
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = () => {
  if (props.mode === 'view') return
  
  if (validateForm()) {
    emit('submit', { ...formData.value })
    closeModal()
  }
}

const closeModal = () => {
  emit('close')
}

const handleOverlayClick = (event: Event) => {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

// Keyboard handling
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>
