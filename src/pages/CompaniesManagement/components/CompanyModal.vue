<template>
  <div v-if="isVisible" :class="$style.modalOverlay" @click="handleOverlayClick">
    <div :class="$style.modalContainer" @click.stop>
      <div :class="$style.modalHeader">
        <h2 :class="$style.modalTitle">{{ title }}</h2>
        <button
          type="button"
          :class="$style.closeButton"
          @click="$emit('close')"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>

      <form @submit.prevent="handleSubmit" :class="$style.modalForm">
        <div :class="$style.modalBody">
          <!-- Company Name -->
          <div :class="$style.formGroup">
            <label :class="$style.label" for="company-name">
              {{ t('companies.name') }} *
            </label>
            <input
              id="company-name"
              v-model="formData.name"
              type="text"
              :class="[$style.input, { [$style.error]: errors.name }]"
              :placeholder="t('companies.namePlaceholder')"
              required
              maxlength="100"
            />
            <span v-if="errors.name" :class="$style.errorText">{{ errors.name }}</span>
          </div>

          <!-- Arabic Name -->
          <div :class="$style.formGroup">
            <label :class="$style.label" for="company-arabic-name">
              {{ t('companies.arabicName') }}
            </label>
            <input
              id="company-arabic-name"
              v-model="formData.arabic_name"
              type="text"
              :class="[$style.input, { [$style.error]: errors.arabic_name }]"
              :placeholder="t('companies.arabicNamePlaceholder')"
              maxlength="100"
              dir="rtl"
            />
            <span v-if="errors.arabic_name" :class="$style.errorText">{{ errors.arabic_name }}</span>
          </div>

          <!-- CR Number -->
          <div :class="$style.formGroup">
            <label :class="$style.label" for="cr-number">
              {{ t('companies.crNumber') }}
            </label>
            <input
              id="cr-number"
              v-model="formData.cr_number"
              type="text"
              :class="[$style.input, { [$style.error]: errors.cr_number }]"
              :placeholder="t('companies.crNumberPlaceholder')"
              maxlength="50"
            />
            <span v-if="errors.cr_number" :class="$style.errorText">{{ errors.cr_number }}</span>
          </div>

          <!-- MOI Number -->
          <div :class="$style.formGroup">
            <label :class="$style.label" for="moi-number">
              {{ t('companies.moiNumber') }}
            </label>
            <input
              id="moi-number"
              v-model="formData.moi_number"
              type="text"
              :class="[$style.input, { [$style.error]: errors.moi_number }]"
              :placeholder="t('companies.moiNumberPlaceholder')"
              maxlength="50"
            />
            <span v-if="errors.moi_number" :class="$style.errorText">{{ errors.moi_number }}</span>
          </div>

          <!-- Country of Incorporation -->
          <div :class="$style.formGroup">
            <label :class="$style.label" for="country">
              {{ t('companies.countryOfIncorporation') }}
            </label>
            <input
              id="country"
              v-model="formData.country_of_incorporation"
              type="text"
              :class="[$style.input, { [$style.error]: errors.country_of_incorporation }]"
              :placeholder="t('companies.countryPlaceholder')"
              maxlength="100"
            />
            <span v-if="errors.country_of_incorporation" :class="$style.errorText">{{ errors.country_of_incorporation }}</span>
          </div>

          <!-- Active Status -->
          <div :class="$style.formGroup">
            <label :class="$style.checkboxLabel">
              <input
                v-model="formData.is_active"
                type="checkbox"
                :class="$style.checkbox"
              />
              <span :class="$style.checkboxText">{{ t('companies.isActive') }}</span>
            </label>
          </div>
        </div>

        <div :class="$style.modalActions">
          <button
            type="button"
            :class="[$style.button, $style.cancelButton]"
            @click="$emit('close')"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            :class="[$style.button, $style.saveButton]"
            :disabled="loading"
          >
            {{ loading ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Company, CompanyUpdateData } from '../../../services/companiesService'
import { useI18n } from '../../../hooks/useI18n'

interface Props {
  isVisible: boolean
  company?: Company | null
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: CompanyUpdateData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// Form data
const formData = ref<CompanyUpdateData>({
  name: '',
  arabic_name: '',
  cr_number: '',
  moi_number: '',
  country_of_incorporation: '',
  is_active: true
})

// Form errors
const errors = ref<Record<string, string>>({})

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    arabic_name: '',
    cr_number: '',
    moi_number: '',
    country_of_incorporation: '',
    is_active: true
  }
}

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!formData.value.name?.trim()) {
    errors.value.name = 'Company name is required'
    return false
  }
  
  if (formData.value.name && formData.value.name.length > 100) {
    errors.value.name = 'Company name must not exceed 100 characters'
    return false
  }
  
  if (formData.value.arabic_name && formData.value.arabic_name.length > 100) {
    errors.value.arabic_name = 'Arabic name must not exceed 100 characters'
    return false
  }
  
  if (formData.value.cr_number && formData.value.cr_number.length > 50) {
    errors.value.cr_number = 'CR number must not exceed 50 characters'
    return false
  }
  
  if (formData.value.moi_number && formData.value.moi_number.length > 50) {
    errors.value.moi_number = 'MOI number must not exceed 50 characters'
    return false
  }
  
  if (formData.value.country_of_incorporation && formData.value.country_of_incorporation.length > 100) {
    errors.value.country_of_incorporation = 'Country must not exceed 100 characters'
    return false
  }
  
  return true
}

const handleSubmit = () => {
  if (!validateForm()) {
    return
  }
  
  // Only send non-empty fields
  const dataToSend: CompanyUpdateData = {}
  
  if (formData.value.name?.trim()) {
    dataToSend.name = formData.value.name.trim()
  }
  if (formData.value.arabic_name?.trim()) {
    dataToSend.arabic_name = formData.value.arabic_name.trim()
  }
  if (formData.value.cr_number?.trim()) {
    dataToSend.cr_number = formData.value.cr_number.trim()
  }
  if (formData.value.moi_number?.trim()) {
    dataToSend.moi_number = formData.value.moi_number.trim()
  }
  if (formData.value.country_of_incorporation?.trim()) {
    dataToSend.country_of_incorporation = formData.value.country_of_incorporation.trim()
  }
  if (formData.value.is_active !== undefined) {
    dataToSend.is_active = formData.value.is_active
  }
  
  emit('save', dataToSend)
}

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

// Computed properties
const title = props.company 
  ? t('companies.editCompany') 
  : t('companies.addCompany')

// Watch for company changes to populate form
watch(() => props.company, (newCompany) => {
  if (newCompany) {
    formData.value = {
      name: newCompany.name,
      arabic_name: newCompany.arabic_name,
      cr_number: newCompany.cr_number,
      moi_number: newCompany.moi_number,
      country_of_incorporation: newCompany.country_of_incorporation,
      is_active: newCompany.is_active
    }
  } else {
    resetForm()
  }
  errors.value = {}
}, { immediate: true })

// Watch modal visibility to reset form
watch(() => props.isVisible, (isVisible) => {
  if (!isVisible) {
    resetForm()
    errors.value = {}
  }
})
</script>

<style module>
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modalContainer {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(0, 255, 194, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

[data-theme="light"] .modalContainer {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 99, 75, 0.2);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 40px rgba(0, 99, 75, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0;
  padding-bottom: 1.5rem;
}

[data-theme="light"] .modalHeader {
  border-bottom-color: rgba(0, 99, 75, 0.1);
}

.modalTitle {
  font-size: 1.5rem;
  font-weight: 700;
  color: #E8EDF2;
  margin: 0;
}

[data-theme="light"] .modalTitle {
  color: #112821;
}

.closeButton {
  background: none;
  border: none;
  font-size: 2rem;
  color: #8C949E;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.closeButton:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #E8EDF2;
}

[data-theme="light"] .closeButton {
  color: #48635A;
}

[data-theme="light"] .closeButton:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #112821;
}

.modalForm {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.modalBody {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.formGroup {
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #E8EDF2;
  margin-bottom: 0.5rem;
}

[data-theme="light"] .label {
  color: #112821;
}

.input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #E8EDF2;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

[data-theme="light"] .input {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 99, 75, 0.2);
  color: #112821;
}

.input:focus {
  outline: none;
  border-color: rgba(0, 255, 194, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 255, 194, 0.1);
}

[data-theme="light"] .input:focus {
  border-color: rgba(0, 99, 75, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 99, 75, 0.1);
}

.input.error {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input::placeholder {
  color: #8C949E;
}

[data-theme="light"] .input::placeholder {
  color: #48635A;
}

.errorText {
  display: block;
  font-size: 0.8rem;
  color: #EF4444;
  margin-top: 0.25rem;
}

.checkboxLabel {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #E8EDF2;
}

[data-theme="light"] .checkboxLabel {
  color: #112821;
}

.checkbox {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="light"] .checkbox {
  border-color: rgba(0, 99, 75, 0.3);
  background: rgba(0, 0, 0, 0.02);
}

.checkbox:checked {
  background: #00FFC2;
  border-color: #00FFC2;
}

[data-theme="light"] .checkbox:checked {
  background: #00634B;
  border-color: #00634B;
}

.checkboxText {
  flex: 1;
}

.modalActions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: flex-end;
}

[data-theme="light"] .modalActions {
  border-top-color: rgba(0, 99, 75, 0.1);
}

.button {
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 100px;
}

.cancelButton {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #E8EDF2;
}

[data-theme="light"] .cancelButton {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 99, 75, 0.2);
  color: #112821;
}

.cancelButton:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

[data-theme="light"] .cancelButton:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 99, 75, 0.3);
}

.saveButton {
  background: linear-gradient(135deg, #00FFC2 0%, #00B8A0 100%);
  color: #0B0F10;
  border: none;
}

[data-theme="light"] .saveButton {
  background: linear-gradient(135deg, #00634B 0%, #004D3A 100%);
  color: #FFFFFF;
}

.saveButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 194, 0.3);
}

[data-theme="light"] .saveButton:hover {
  box-shadow: 0 8px 25px rgba(0, 99, 75, 0.3);
}

.saveButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modalContainer {
    margin: 1rem;
    max-width: none;
    max-height: calc(100vh - 2rem);
  }
  
  .modalHeader {
    padding: 1.5rem 1.5rem 0;
  }
  
  .modalBody {
    padding: 1.5rem;
  }
  
  .modalActions {
    padding: 1rem 1.5rem 1.5rem;
    flex-direction: column;
  }
  
  .button {
    width: 100%;
  }
}
</style>
