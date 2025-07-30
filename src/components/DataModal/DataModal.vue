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
                  <!-- Currency Field - SearchableDropdown -->
                  <SearchableDropdown
                    v-if="column.key === 'currency'"
                    v-model="formData[column.key]"
                    :options="currenciesData"
                    :placeholder="getPlaceholder(column)"
                    :disabled="mode === 'view'"
                    :search-placeholder="t('common.searchCurrency')"
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
import currenciesData from '../../data/currencies.json'

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

// Initialize form data
const initializeFormData = () => {
  const data: Record<string, any> = {}
  
  props.columns.forEach(column => {
    if (props.data && props.data[column.key] !== undefined) {
      data[column.key] = props.data[column.key]
    } else {
      // Default values for new records
      switch (column.key) {
        case 'reportingPeriod':
          data[column.key] = 'Q1 2025'
          break
        case 'currency':
          data[column.key] = 'SAR'
          break
        case 'countryOfIncorporation':
          data[column.key] = 'SAU'
          break
        case 'percentOwnership':
          data[column.key] = '0'
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
  const requiredFields = ['companyName', 'reportingPeriod', 'currency']
  return requiredFields.includes(column.key) || column.required
}

const getPlaceholder = (column: Column) => {
  const placeholders: Record<string, string> = {
    companyName: t('businessQuarters.placeholders.companyName'),
    arabicLegalName: t('businessQuarters.placeholders.arabicLegalName'),
    percentOwnership: '0',
    commercialRegistrationNumber: '1234567890',
    currency: t('common.selectCurrency'),
    countryOfIncorporation: t('common.selectCountry')
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
    if (column.key === 'percentOwnership') {
      const value = parseFloat(formData.value[column.key])
      if (isNaN(value) || value < 0 || value > 100) {
        newErrors[column.key] = t('validation.invalidPercentage')
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
