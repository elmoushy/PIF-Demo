<template>
  <div v-if="isVisible" :class="$style.modalOverlay" @click="handleOverlayClick">
    <div :class="$style.modalContainer" @click.stop>
      <div :class="$style.modalHeader">
        <h2 :class="$style.modalTitle">
          {{ isEditing ? t('users.modal.editUser') : t('users.modal.addUser') }}
        </h2>
        <button :class="$style.closeButton" @click="$emit('close')" :title="t('common.close')">
          ✕
        </button>
      </div>

      <form @submit.prevent="handleSubmit" :class="$style.modalForm">
        <div :class="$style.formGrid">
          <!-- First Name -->
          <div :class="$style.formGroup">
            <label :class="$style.formLabel" for="firstName">
              {{ t('users.form.firstName') }} *
            </label>
            <input
              id="firstName"
              type="text"
              :class="[$style.formInput, { [$style.error]: errors.first_name }]"
              v-model="formData.first_name"
              :placeholder="t('users.form.firstNamePlaceholder')"
              required
              maxlength="30"
              @blur="validateField('first_name')"
            />
            <span v-if="errors.first_name" :class="$style.errorMessage">
              {{ errors.first_name }}
            </span>
          </div>

          <!-- Last Name -->
          <div :class="$style.formGroup">
            <label :class="$style.formLabel" for="lastName">
              {{ t('users.form.lastName') }} *
            </label>
            <input
              id="lastName"
              type="text"
              :class="[$style.formInput, { [$style.error]: errors.last_name }]"
              v-model="formData.last_name"
              :placeholder="t('users.form.lastNamePlaceholder')"
              required
              maxlength="30"
              @blur="validateField('last_name')"
            />
            <span v-if="errors.last_name" :class="$style.errorMessage">
              {{ errors.last_name }}
            </span>
          </div>

          <!-- Username -->
          <div :class="$style.formGroup">
            <label :class="$style.formLabel" for="username">
              {{ t('users.form.username') }} *
            </label>
            <input
              id="username"
              type="text"
              :class="[$style.formInput, { [$style.error]: errors.username }]"
              v-model="formData.username"
              :placeholder="t('users.form.usernamePlaceholder')"
              required
              minlength="3"
              maxlength="30"
              pattern="[a-zA-Z0-9_]+"
              @blur="validateField('username')"
            />
            <span v-if="errors.username" :class="$style.errorMessage">
              {{ errors.username }}
            </span>
          </div>

          <!-- Email -->
          <div :class="$style.formGroup">
            <label :class="$style.formLabel" for="email">
              {{ t('users.form.email') }} *
            </label>
            <input
              id="email"
              type="email"
              :class="[$style.formInput, { [$style.error]: errors.email }]"
              v-model="formData.email"
              :placeholder="t('users.form.emailPlaceholder')"
              required
              @blur="validateField('email')"
            />
            <span v-if="errors.email" :class="$style.errorMessage">
              {{ errors.email }}
            </span>
          </div>

          <!-- Password (only for new users) -->
          <div v-if="!isEditing" :class="[$style.formGroup, $style.fullWidth]">
            <label :class="$style.formLabel" for="password">
              {{ t('users.form.password') }} *
            </label>
            <div :class="$style.passwordContainer">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                :class="[$style.formInput, { [$style.error]: errors.password }]"
                v-model="formData.password"
                :placeholder="t('users.form.passwordPlaceholder')"
                required
                minlength="8"
                @blur="validateField('password')"
              />
              <button
                type="button"
                :class="$style.passwordToggle"
                @click="showPassword = !showPassword"
                :title="showPassword ? t('users.form.hidePassword') : t('users.form.showPassword')"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <span v-if="errors.password" :class="$style.errorMessage">
              {{ errors.password }}
            </span>
          </div>

          <!-- Role (only for editing) -->
          <div v-if="isEditing" :class="$style.formGroup">
            <label :class="$style.formLabel" for="userType">
              {{ t('users.form.role') }}
            </label>
            <select
              id="userType"
              :class="$style.formSelect"
              v-model="formData.type"
            >
              <option value="User">{{ t('users.roles.user') }}</option>
              <option value="Admin">{{ t('users.roles.admin') }}</option>
            </select>
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
            :disabled="!isFormValid || submitting"
          >
            <span v-if="submitting">⏳</span>
            {{ isEditing ? t('common.update') : t('common.create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from '../../../hooks/useI18n'
import type { User, CreateUserRequest, UpdateUserRequest } from '../../../services/usersService'

interface Props {
  isVisible: boolean
  user?: User | null
  isEditing: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: CreateUserRequest | UpdateUserRequest): void
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  isEditing: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Form state
const formData = ref<CreateUserRequest & { type?: string }>({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  type: 'User'
})

const errors = ref<Record<string, string>>({})
const showPassword = ref(false)
const submitting = ref(false)

// Validation rules
const validateField = (fieldName: string) => {
  const value = formData.value[fieldName as keyof typeof formData.value]
  
  switch (fieldName) {
    case 'first_name':
    case 'last_name':
      if (!value || value.toString().trim().length === 0) {
        errors.value[fieldName] = t('users.validation.required')
      } else if (value.toString().length > 30) {
        errors.value[fieldName] = `Must be no more than 30 characters`
      } else {
        delete errors.value[fieldName]
      }
      break
      
    case 'username':
      if (!value || value.toString().trim().length === 0) {
        errors.value[fieldName] = t('users.validation.required')
      } else if (value.toString().length < 3) {
        errors.value[fieldName] = `Must be at least 3 characters`
      } else if (value.toString().length > 30) {
        errors.value[fieldName] = `Must be no more than 30 characters`
      } else if (!/^[a-zA-Z0-9_]+$/.test(value.toString())) {
        errors.value[fieldName] = t('users.validation.invalidUsername')
      } else {
        delete errors.value[fieldName]
      }
      break
      
    case 'email':
      if (!value || value.toString().trim().length === 0) {
        errors.value[fieldName] = t('users.validation.required')
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toString())) {
        errors.value[fieldName] = t('users.validation.invalidEmail')
      } else {
        delete errors.value[fieldName]
      }
      break
      
    case 'password':
      if (!props.isEditing) {
        if (!value || value.toString().trim().length === 0) {
          errors.value[fieldName] = t('users.validation.required')
        } else if (value.toString().length < 8) {
          errors.value[fieldName] = `Must be at least 8 characters`
        } else {
          delete errors.value[fieldName]
        }
      }
      break
  }
}

const validateForm = () => {
  validateField('first_name')
  validateField('last_name')
  validateField('username')
  validateField('email')
  
  if (!props.isEditing) {
    validateField('password')
  }
}

const isFormValid = computed(() => {
  const requiredFields = ['first_name', 'last_name', 'username', 'email']
  if (!props.isEditing) {
    requiredFields.push('password')
  }
  
  const hasAllRequiredFields = requiredFields.every(field => {
    const value = formData.value[field as keyof typeof formData.value]
    return value && value.toString().trim().length > 0
  })
  
  const hasNoErrors = Object.keys(errors.value).length === 0
  
  return hasAllRequiredFields && hasNoErrors
})

// Event handlers
const handleOverlayClick = (event: Event) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

const handleSubmit = () => {
  validateForm()
  
  if (!isFormValid.value) {
    return
  }
  
  submitting.value = true
  
  try {
    if (props.isEditing) {
      const updateData: UpdateUserRequest = {
        id: props.user!.id,
        username: formData.value.username,
        email: formData.value.email,
        first_name: formData.value.first_name,
        last_name: formData.value.last_name,
        type: formData.value.type as 'Admin' | 'User'
      }
      emit('save', updateData)
    } else {
      const createData: CreateUserRequest = {
        username: formData.value.username,
        email: formData.value.email,
        password: formData.value.password,
        first_name: formData.value.first_name,
        last_name: formData.value.last_name
      }
      emit('save', createData)
    }
  } finally {
    submitting.value = false
  }
}

// Watchers
watch(() => props.isVisible, (visible) => {
  if (visible) {
    // Reset form when modal opens
    if (props.isEditing && props.user) {
      formData.value = {
        username: props.user.username,
        email: props.user.email,
        password: '',
        first_name: props.user.first_name,
        last_name: props.user.last_name,
        type: props.user.type
      }
    } else {
      formData.value = {
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        type: 'User'
      }
    }
    
    errors.value = {}
    showPassword.value = false
    submitting.value = false
    
    // Focus first input
    nextTick(() => {
      const firstInput = document.getElementById('firstName')
      if (firstInput) {
        firstInput.focus()
      }
    })
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
  z-index: 9999;
  padding: 2rem;
}

.modalContainer {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

[data-theme="light"] .modalContainer {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 99, 75, 0.1);
}

.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #8C949E;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="light"] .closeButton {
  background: rgba(0, 0, 0, 0.05);
  color: #48635A;
}

.closeButton:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
}

.modalForm {
  padding: 2rem;
}

.formGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.formGroup.fullWidth {
  grid-column: 1 / -1;
}

.formLabel {
  font-size: 0.9rem;
  font-weight: 600;
  color: #E8EDF2;
  margin-bottom: 0.5rem;
}

[data-theme="light"] .formLabel {
  color: #112821;
}

.formInput,
.formSelect {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #E8EDF2;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

[data-theme="light"] .formInput,
[data-theme="light"] .formSelect {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 99, 75, 0.1);
  color: #112821;
}

.formInput::placeholder {
  color: #8C949E;
}

[data-theme="light"] .formInput::placeholder {
  color: #48635A;
}

.formInput:focus,
.formSelect:focus {
  border-color: rgba(0, 255, 194, 0.3);
  box-shadow: 0 0 20px rgba(0, 255, 194, 0.2);
}

[data-theme="light"] .formInput:focus,
[data-theme="light"] .formSelect:focus {
  border-color: rgba(0, 99, 75, 0.3);
  box-shadow: 0 0 20px rgba(0, 99, 75, 0.15);
}

.formInput.error,
.formSelect.error {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
}

.passwordContainer {
  position: relative;
}

.passwordToggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8C949E;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
}

[data-theme="light"] .passwordToggle {
  color: #48635A;
}

.passwordToggle:hover {
  color: #E8EDF2;
}

[data-theme="light"] .passwordToggle:hover {
  color: #112821;
}

.errorMessage {
  font-size: 0.8rem;
  color: #EF4444;
  margin-top: 0.25rem;
}

.modalActions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .modalActions {
  border-top-color: rgba(0, 99, 75, 0.1);
}

.button {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancelButton {
  background: rgba(255, 255, 255, 0.1);
  color: #8C949E;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

[data-theme="light"] .cancelButton {
  background: rgba(0, 0, 0, 0.05);
  color: #48635A;
  border-color: rgba(0, 99, 75, 0.2);
}

.cancelButton:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #E8EDF2;
}

[data-theme="light"] .cancelButton:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #112821;
}

.saveButton {
  background: linear-gradient(135deg, #00FFC2 0%, #00B894 100%);
  color: #0B0F10;
}

[data-theme="light"] .saveButton {
  background: linear-gradient(135deg, #00634B 0%, #004A37 100%);
  color: #FDFEFE;
}

.saveButton:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 255, 194, 0.3);
}

[data-theme="light"] .saveButton:hover:not(:disabled) {
  box-shadow: 0 8px 32px rgba(0, 99, 75, 0.3);
}

.saveButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modalOverlay {
    padding: 1rem;
  }
  
  .formGrid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .modalForm {
    padding: 1.5rem;
  }
  
  .modalActions {
    flex-direction: column-reverse;
  }
  
  .button {
    width: 100%;
    justify-content: center;
  }
}
</style>
