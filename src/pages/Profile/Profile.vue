<template>
  <div :class="styles.profilePage">
    <Header />
    
    <main :class="styles.mainContent">
      <!-- Hero Section -->
      <section :class="styles.heroSection">
        <div :class="styles.heroContent">
          <div :class="styles.heroText">
            <h1 :class="styles.heroTitle">{{ t('profile.title') }}</h1>
            <p :class="styles.heroSubtitle">{{ t('profile.subtitle') }}</p>
          </div>
          <div :class="styles.heroIcon">
            <span :class="styles.profileIcon">👤</span>
          </div>
        </div>
      </section>

      <!-- Profile Content -->
      <section :class="styles.profileSection">
        <div :class="styles.profileGrid">
          
          <!-- User Information Card -->
          <div :class="[styles.profileCard, styles.userCard]">
            <div :class="styles.cardHeader">
              <div :class="styles.cardIcon">
                <span :class="styles.icon">👤</span>
                <div :class="styles.iconGlow"></div>
              </div>
              <div :class="styles.cardTitle">
                <h3>{{ t('profile.userInfo.title') }}</h3>
                <p>{{ t('profile.userInfo.description') }}</p>
              </div>
            </div>
            
            <div :class="styles.cardContent" v-if="profileData?.user">
              <div :class="styles.infoGrid">
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('profile.userInfo.fullName') }}</span>
                  <span :class="styles.infoValue">{{ profileData.user.full_name || '-' }}</span>
                </div>
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('profile.userInfo.username') }}</span>
                  <span :class="styles.infoValue">{{ profileData.user.username || '-' }}</span>
                </div>
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('profile.userInfo.email') }}</span>
                  <span :class="styles.infoValue">{{ profileData.user.email || '-' }}</span>
                </div>
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('profile.userInfo.role') }}</span>
                  <span :class="styles.infoValue">{{ profileData.user.type || '-' }}</span>
                </div>
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('profile.userInfo.memberSince') }}</span>
                  <span :class="styles.infoValue">{{ formatDate(profileData.user.date_joined) }}</span>
                </div>
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('profile.userInfo.lastLogin') }}</span>
                  <span :class="styles.infoValue">{{ formatDate(profileData.user.last_login) || t('common.never') }}</span>
                </div>
              </div>
            </div>

            <div v-else-if="loading" :class="styles.loadingState">
              <div :class="styles.loadingSpinner"></div>
              <span>{{ t('common.loading') }}</span>
            </div>

            <div v-else :class="styles.errorState">
              <span :class="styles.errorIcon">⚠️</span>
              <span>{{ t('common.errorLoading') }}</span>
            </div>
          </div>

          <!-- Company Information Card -->
          <div :class="[styles.profileCard, styles.companyCard]">
            <div :class="styles.cardHeader">
              <div :class="styles.cardIcon">
                <span :class="styles.icon">🏢</span>
                <div :class="styles.iconGlow"></div>
              </div>
              <div :class="styles.cardTitle">
                <h3>{{ t('profile.companyInfo.title') }}</h3>
                <p>{{ t('profile.companyInfo.description') }}</p>
              </div>
            </div>
            
            <div :class="styles.cardContent" v-if="profileData?.company">
              <div :class="styles.infoGrid">
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('profile.companyInfo.name') }}</span>
                  <span :class="styles.infoValue">{{ profileData.company.name || '-' }}</span>
                </div>
                <div :class="styles.infoItem" v-if="profileData.company.arabic_name">
                  <span :class="styles.infoLabel">{{ t('profile.companyInfo.arabicName') }}</span>
                  <span :class="styles.infoValue">{{ profileData.company.arabic_name }}</span>
                </div>
                <div :class="styles.infoItem" v-if="profileData.company.cr_number">
                  <span :class="styles.infoLabel">{{ t('profile.companyInfo.crNumber') }}</span>
                  <span :class="styles.infoValue">{{ profileData.company.cr_number }}</span>
                </div>
                <div :class="styles.infoItem" v-if="profileData.company.moi_number">
                  <span :class="styles.infoLabel">{{ t('profile.companyInfo.moiNumber') }}</span>
                  <span :class="styles.infoValue">{{ profileData.company.moi_number }}</span>
                </div>
                <div :class="styles.infoItem" v-if="profileData.company.country_of_incorporation">
                  <span :class="styles.infoLabel">{{ t('profile.companyInfo.country') }}</span>
                  <span :class="styles.infoValue">{{ profileData.company.country_of_incorporation }}</span>
                </div>
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('profile.companyInfo.status') }}</span>
                  <span :class="[styles.infoValue, styles.statusBadge, { [styles.active]: profileData.company.is_active }]">
                    {{ profileData.company.is_active ? t('common.active') : t('common.inactive') }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else-if="loading" :class="styles.loadingState">
              <div :class="styles.loadingSpinner"></div>
              <span>{{ t('common.loading') }}</span>
            </div>

            <div v-else :class="styles.errorState">
              <span :class="styles.errorIcon">⚠️</span>
              <span>{{ t('common.errorLoading') }}</span>
            </div>
          </div>

          <!-- Change Password Card -->
          <div :class="[styles.profileCard, styles.passwordCard]">
            <div :class="styles.cardHeader">
              <div :class="styles.cardIcon">
                <span :class="styles.icon">🔒</span>
                <div :class="styles.iconGlow"></div>
              </div>
              <div :class="styles.cardTitle">
                <h3>{{ t('profile.changePassword.title') }}</h3>
                <p>{{ t('profile.changePassword.description') }}</p>
              </div>
            </div>
            
            <div :class="styles.cardContent">
              <form :class="styles.passwordForm" @submit.prevent="handlePasswordChange">
                <div :class="styles.formGroup">
                  <label :class="styles.formLabel" for="oldPassword">{{ t('profile.changePassword.currentPassword') }}</label>
                  <input
                    id="oldPassword"
                    type="password"
                    v-model="passwordForm.oldPassword"
                    :class="[styles.formInput, { [styles.error]: passwordErrors.oldPassword }]"
                    :placeholder="t('profile.changePassword.currentPasswordPlaceholder')"
                    autocomplete="current-password"
                  />
                  <span v-if="passwordErrors.oldPassword" :class="styles.errorMessage">
                    {{ passwordErrors.oldPassword[0] }}
                  </span>
                </div>

                <div :class="styles.formGroup">
                  <label :class="styles.formLabel" for="newPassword">{{ t('profile.changePassword.newPassword') }}</label>
                  <input
                    id="newPassword"
                    type="password"
                    v-model="passwordForm.newPassword"
                    :class="[styles.formInput, { [styles.error]: passwordErrors.newPassword }]"
                    :placeholder="t('profile.changePassword.newPasswordPlaceholder')"
                    autocomplete="new-password"
                  />
                  <span v-if="passwordErrors.newPassword" :class="styles.errorMessage">
                    {{ passwordErrors.newPassword[0] }}
                  </span>
                </div>

                <div :class="styles.formGroup">
                  <label :class="styles.formLabel" for="confirmPassword">{{ t('profile.changePassword.confirmPassword') }}</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    v-model="passwordForm.confirmPassword"
                    :class="[styles.formInput, { [styles.error]: passwordErrors.confirmPassword }]"
                    :placeholder="t('profile.changePassword.confirmPasswordPlaceholder')"
                    autocomplete="new-password"
                  />
                  <span v-if="passwordErrors.confirmPassword" :class="styles.errorMessage">
                    {{ passwordErrors.confirmPassword[0] }}
                  </span>
                </div>

                <div v-if="passwordErrors.nonFieldErrors" :class="styles.generalError">
                  <span :class="styles.errorIcon">⚠️</span>
                  <span>{{ passwordErrors.nonFieldErrors[0] }}</span>
                </div>

                <button 
                  type="submit" 
                  :class="[styles.submitButton, { [styles.loading]: changingPassword }]"
                  :disabled="changingPassword || !isPasswordFormValid"
                >
                  <span v-if="changingPassword" :class="styles.loadingSpinner"></span>
                  {{ changingPassword ? t('common.saving') : t('profile.changePassword.submit') }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- Additional Info Section -->
      <section :class="styles.infoSection">
        <div :class="styles.infoCard">
          <div :class="styles.infoIcon">
            <span>ℹ️</span>
          </div>
          <div :class="styles.infoContent">
            <h4>{{ t('profile.info.title') }}</h4>
            <p>{{ t('profile.info.description') }}</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Particle System -->
    <div :class="styles.particleSystem">
      <div v-for="i in 30" :key="i" :class="styles.particle" :style="particleStyle(i)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import Header from '../../components/Header/Header.vue'
import { makeHttpRequest } from '../../services/httpClient'
import notificationService from '../../services/notificationService'
import styles from './Profile.module.css'

const { t } = useI18n()

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  type: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login: string | null
  created_at: string
}

interface Company {
  id: number
  name: string
  arabic_name: string | null
  cr_number: string | null
  moi_number: string | null
  country_of_incorporation: string | null
  is_active: boolean
  parent_company: number | null
  created_at: string
  updated_at: string
}

interface ProfileData {
  user: User
  company: Company
}

interface PasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

interface PasswordErrors {
  oldPassword?: string[]
  newPassword?: string[]
  confirmPassword?: string[]
  nonFieldErrors?: string[]
  usernameOrEmail?: string[]
}

// State
const loading = ref(true)
const changingPassword = ref(false)
const profileData = ref<ProfileData | null>(null)

const passwordForm = ref<PasswordForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordErrors = ref<PasswordErrors>({})

// Computed
const isPasswordFormValid = computed(() => {
  return passwordForm.value.oldPassword.length > 0 &&
         passwordForm.value.newPassword.length >= 12 &&
         passwordForm.value.confirmPassword.length > 0 &&
         passwordForm.value.newPassword === passwordForm.value.confirmPassword
})

// Methods
const fetchProfile = async () => {
  try {
    loading.value = true
    
    const response = await makeHttpRequest<ProfileData>('/api/auth/profile/')
    profileData.value = response
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    
    if (error.message !== 'Session ended') {
      notificationService.error(
        t('profile.error.title'),
        t('profile.error.fetchFailed')
      )
    }
  } finally {
    loading.value = false
  }
}

const handlePasswordChange = async () => {
  if (!isPasswordFormValid.value || !profileData.value?.user) return

  try {
    changingPassword.value = true
    passwordErrors.value = {}

    const payload = {
      username_or_email: profileData.value.user.email,
      old_password: passwordForm.value.oldPassword,
      new_password: passwordForm.value.newPassword,
      new_password_confirm: passwordForm.value.confirmPassword
    }

    await makeHttpRequest('/api/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    // Success
    notificationService.success(
      t('profile.changePassword.success.title'),
      t('profile.changePassword.success.message')
    )

    // Reset form
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

  } catch (error: any) {
    console.error('Error changing password:', error)
    
    if (error.message !== 'Session ended') {
      // Handle different error formats that might come from the HTTP client
      if (error.message) {
        // Try to extract field-specific errors from the error message
        const errorMessage = error.message.toLowerCase()
        
        if (errorMessage.includes('old_password') || errorMessage.includes('current password')) {
          passwordErrors.value.oldPassword = ['Current password is incorrect']
        } else if (errorMessage.includes('new_password')) {
          passwordErrors.value.newPassword = ['New password does not meet requirements (minimum 12 characters)']
        } else if (errorMessage.includes('password_confirm') || errorMessage.includes('confirmation')) {
          passwordErrors.value.confirmPassword = ['Password confirmation does not match']
        } else {
          passwordErrors.value.nonFieldErrors = [error.message]
        }
      } else {
        // Fallback error handling
        notificationService.error(
          t('profile.changePassword.error.title'),
          t('profile.changePassword.error.message')
        )
      }
    }
  } finally {
    changingPassword.value = false
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return null
  
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Particle animation styles
const particleStyle = (_index: number) => {
  const delay = Math.random() * 20
  const duration = 15 + Math.random() * 10
  const xOffset = Math.random() * 100
  const yOffset = Math.random() * 100
  
  return {
    left: `${xOffset}%`,
    top: `${yOffset}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    '--particle-color': `hsl(${180 + Math.random() * 60}, 70%, 60%)`
  }
}

// Lifecycle
onMounted(() => {
  fetchProfile()
})
</script>
