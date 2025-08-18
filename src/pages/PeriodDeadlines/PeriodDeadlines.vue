<template>
  <div :class="styles.deadlinesPage">
    <Header />
    
    <main :class="styles.mainContent">
      <!-- Hero Section -->
      <section :class="styles.heroSection">
        <div :class="styles.heroContent">
          <div :class="styles.heroText">
            <h1 :class="styles.heroTitle">{{ t('periodDeadlines.title') }}</h1>
            <p :class="styles.heroSubtitle">{{ t('periodDeadlines.subtitle') }}</p>
          </div>
          <div :class="styles.heroIcon">
            <span :class="styles.deadlineIcon">📅</span>
          </div>
        </div>
      </section>

    <!-- Statistics Section -->
      <section v-if="deadlines.length > 0" :class="styles.statsSection">
        <div :class="styles.statsGrid">
          <div :class="styles.statCard">
            <div :class="styles.statIcon">📊</div>
            <div :class="styles.statContent">
              <span :class="styles.statNumber">{{ deadlines.length }}</span>
              <span :class="styles.statLabel">{{ t('periodDeadlines.totalDeadlines') }}</span>
            </div>
          </div>
          <div :class="styles.statCard">
            <div :class="styles.statIcon">⏰</div>
            <div :class="styles.statContent">
              <span :class="styles.statNumber">{{ upcomingDeadlines }}</span>
              <span :class="styles.statLabel">{{ t('periodDeadlines.upcoming') }}</span>
            </div>
          </div>
          <div :class="styles.statCard">
            <div :class="styles.statIcon">✅</div>
            <div :class="styles.statContent">
              <span :class="styles.statNumber">{{ pastDeadlines }}</span>
              <span :class="styles.statLabel">{{ t('periodDeadlines.past') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Actions Section -->
      <section :class="styles.actionsSection">
        <div :class="styles.actionButtons">
          <button 
            :class="[styles.actionButton, styles.primaryButton]" 
            @click="openCreateModal"
            :disabled="!canCreateDeadlines"
          >
            <span :class="styles.buttonIcon">➕</span>
            {{ t('periodDeadlines.createNew') }}
          </button>
          <button 
            :class="[styles.actionButton, styles.secondaryButton]" 
            @click="refreshDeadlines"
            :disabled="loading"
          >
            <span :class="styles.buttonIcon">🔄</span>
            {{ t('common.refresh') }}
          </button>
        </div>
        
        <!-- Filters -->
        <div :class="styles.filters">
          <div :class="styles.filterGroup">
            <label :class="styles.filterLabel">{{ t('periodDeadlines.filterByYear') }}</label>
            <select :class="styles.filterSelect" v-model="filters.year" @change="applyFilters">
              <option value="">{{ t('common.allYears') }}</option>
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
          <div :class="styles.filterGroup">
            <label :class="styles.filterLabel">{{ t('periodDeadlines.filterByPeriod') }}</label>
            <select :class="styles.filterSelect" v-model="filters.period" @change="applyFilters">
              <option value="">{{ t('common.allPeriods') }}</option>
              <option value="First Half">{{ t('periodDeadlines.periods.firstHalf') }}</option>
              <option value="Third Quarter">{{ t('periodDeadlines.periods.thirdQuarter') }}</option>
              <option value="Fourth Quarter">{{ t('periodDeadlines.periods.fourthQuarter') }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Deadlines Grid -->
      <section :class="styles.deadlinesSection">
        <div v-if="loading" :class="styles.loadingState">
          <div :class="styles.loadingSpinner"></div>
          <p>{{ t('common.loading') }}</p>
        </div>
        
        <div v-else-if="error" :class="styles.errorState">
          <div :class="styles.errorIcon">⚠️</div>
          <p :class="styles.errorMessage">{{ error }}</p>
          <button :class="styles.retryButton" @click="loadDeadlines">
            {{ t('common.retry') }}
          </button>
        </div>
        
        <div v-else-if="filteredDeadlines.length === 0" :class="styles.emptyState">
          <div :class="styles.emptyIcon">📅</div>
          <h3 :class="styles.emptyTitle">{{ t('periodDeadlines.noDeadlines') }}</h3>
          <p :class="styles.emptyMessage">{{ t('periodDeadlines.noDeadlinesMessage') }}</p>
          <button 
            v-if="canCreateDeadlines" 
            :class="styles.createButton" 
            @click="openCreateModal"
          >
            {{ t('periodDeadlines.createFirst') }}
          </button>
        </div>
        
        <div v-else :class="styles.deadlinesGrid">
          <div 
            v-for="deadline in filteredDeadlines" 
            :key="`${deadline.year}-${deadline.time_period}`"
            :class="[styles.deadlineCard, getDeadlineCardClass(deadline)]"
          >
            <div :class="styles.cardHeader">
              <div :class="styles.cardIcon">
                <span :class="styles.periodIcon">{{ getPeriodIcon(deadline.time_period) }}</span>
                <div :class="styles.iconGlow"></div>
              </div>
              <div :class="styles.cardTitle">
                <h3>{{ deadline.time_period }}</h3>
                <p>{{ deadline.year }}</p>
              </div>
              <div :class="styles.cardStatus">
                <span :class="[styles.statusBadge, getStatusClass(deadline)]">
                  {{ getDeadlineStatus(deadline) }}
                </span>
              </div>
            </div>
            
            <div :class="styles.cardContent">
              <div :class="styles.deadlineInfo">
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('periodDeadlines.deadline') }}</span>
                  <span :class="styles.infoValue">{{ formatDate(deadline.dead_line) }}</span>
                </div>
                <div :class="styles.infoItem">
                  <span :class="styles.infoLabel">{{ t('periodDeadlines.timeRemaining') }}</span>
                  <span :class="[styles.infoValue, getTimeRemainingClass(deadline)]">
                    {{ getTimeRemaining(deadline.dead_line) }}
                  </span>
                </div>
              </div>
            </div>

            <div :class="styles.cardFooter">
              <button 
                v-if="canCreateDeadlines"
                :class="styles.editButton" 
                @click="openEditModal(deadline)"
              >
                <span :class="styles.buttonIcon">✏️</span>
                {{ t('common.edit') }}
              </button>
              <span :class="styles.deadlineTime">
                {{ formatTime(deadline.dead_line) }}
              </span>
            </div>
          </div>
        </div>
      </section>


    </main>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" :class="styles.modalOverlay" @click="closeModal">
          <div :class="styles.modalContainer" @click.stop>
            <div :class="styles.modalHeader">
              <h2 :class="styles.modalTitle">
                {{ isEditing ? t('periodDeadlines.editDeadline') : t('periodDeadlines.createDeadline') }}
              </h2>
              <button :class="styles.modalClose" @click="closeModal">✕</button>
            </div>
            
            <form :class="styles.modalForm" @submit.prevent="saveDeadline">
              <div :class="styles.formGroup">
                <label :class="styles.formLabel">{{ t('periodDeadlines.year') }}</label>
                <input 
                  :class="[styles.formInput, { [styles.error]: errors.year }]"
                  type="number"
                  v-model.number="form.year"
                  :min="new Date().getFullYear()"
                  :max="new Date().getFullYear() + 10"
                  required
                />
                <span v-if="errors.year" :class="styles.errorText">{{ errors.year }}</span>
              </div>
              
              <div :class="styles.formGroup">
                <label :class="styles.formLabel">{{ t('periodDeadlines.timePeriod') }}</label>
                <select 
                  :class="[styles.formSelect, { [styles.error]: errors.time_period }]"
                  v-model="form.time_period"
                  required
                >
                  <option value="">{{ t('common.selectOption') }}</option>
                  <option value="First Half">{{ t('periodDeadlines.periods.firstHalf') }}</option>
                  <option value="Third Quarter">{{ t('periodDeadlines.periods.thirdQuarter') }}</option>
                  <option value="Fourth Quarter">{{ t('periodDeadlines.periods.fourthQuarter') }}</option>
                </select>
                <span v-if="errors.time_period" :class="styles.errorText">{{ errors.time_period }}</span>
              </div>
              
              <div :class="styles.formGroup">
                <label :class="styles.formLabel">{{ t('periodDeadlines.deadline') }}</label>
                <input 
                  :class="[styles.formInput, { [styles.error]: errors.dead_line }]"
                  type="datetime-local"
                  v-model="form.dead_line"
                  required
                />
                <span v-if="errors.dead_line" :class="styles.errorText">{{ errors.dead_line }}</span>
              </div>
              
              <div :class="styles.modalActions">
                <button type="button" :class="styles.cancelButton" @click="closeModal">
                  {{ t('common.cancel') }}
                </button>
                <button 
                  type="submit" 
                  :class="styles.saveButton" 
                  :disabled="saving"
                >
                  {{ saving ? t('common.saving') : (isEditing ? t('common.update') : t('common.create')) }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Particle System -->
    <div :class="styles.particleSystem">
      <div v-for="i in 20" :key="i" :class="styles.particle" :style="particleStyle(i)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import { useAuthStore } from '../../stores/useAuthStore'
import Header from '../../components/Header/Header.vue'
import periodDeadlineService from '../../services/periodDeadlineService'
import notificationService from '../../services/notificationService'
import styles from './PeriodDeadlines.module.css'

interface PeriodDeadline {
  year: number
  time_period: 'First Half' | 'Third Quarter' | 'Fourth Quarter'
  dead_line: string
}

interface DeadlineForm {
  year: number | null
  time_period: string
  dead_line: string
}

const { t } = useI18n()
const authStore = useAuthStore()

// State
const deadlines = ref<PeriodDeadline[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)

// Form data
const form = ref<DeadlineForm>({
  year: null,
  time_period: '',
  dead_line: ''
})

const errors = ref<Record<string, string>>({})

// Filters
const filters = ref({
  year: '',
  period: ''
})

// Computed
const canCreateDeadlines = computed(() => {
  return authStore.user?.role === 'SuperAdmin'
})

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = new Set<number>()
  
  // Add years from existing deadlines
  deadlines.value.forEach(d => years.add(d.year))
  
  // Add current year and next few years
  for (let i = 0; i <= 5; i++) {
    years.add(currentYear + i)
  }
  
  return Array.from(years).sort((a, b) => a - b)
})

const filteredDeadlines = computed(() => {
  let result = [...deadlines.value]
  
  if (filters.value.year) {
    result = result.filter(d => d.year.toString() === filters.value.year)
  }
  
  if (filters.value.period) {
    result = result.filter(d => d.time_period === filters.value.period)
  }
  
  // Sort by year and then by period
  return result.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    
    const periodOrder = { 'First Half': 1, 'Third Quarter': 2, 'Fourth Quarter': 3 }
    return (periodOrder[a.time_period] || 0) - (periodOrder[b.time_period] || 0)
  })
})

const upcomingDeadlines = computed(() => {
  const now = new Date()
  return deadlines.value.filter(d => new Date(d.dead_line) > now).length
})

const pastDeadlines = computed(() => {
  const now = new Date()
  return deadlines.value.filter(d => new Date(d.dead_line) <= now).length
})

// Methods
const loadDeadlines = async () => {
  loading.value = true
  error.value = null
  
  try {
    deadlines.value = await periodDeadlineService.getDeadlines()
  } catch (err: any) {
    error.value = err.message || t('common.errorLoading')
  } finally {
    loading.value = false
  }
}

const refreshDeadlines = () => {
  loadDeadlines()
}

const applyFilters = () => {
  // Filters are applied automatically through computed property
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    year: new Date().getFullYear(),
    time_period: '',
    dead_line: ''
  }
  errors.value = {}
  showModal.value = true
}

const openEditModal = (deadline: PeriodDeadline) => {
  isEditing.value = true
  form.value = {
    year: deadline.year,
    time_period: deadline.time_period,
    dead_line: new Date(deadline.dead_line).toISOString().slice(0, 16)
  }
  errors.value = {}
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  errors.value = {}
}

const saveDeadline = async () => {
  if (!form.value.year || !form.value.time_period || !form.value.dead_line) {
    notificationService.error(t('common.error'), t('validation.required'))
    return
  }
  
  saving.value = true
  errors.value = {}
  
  try {
    const deadlineData = {
      year: form.value.year,
      time_period: form.value.time_period,
      dead_line: new Date(form.value.dead_line).toISOString()
    }
    
    await periodDeadlineService.createOrUpdateDeadline(deadlineData)
    
    notificationService.success(
      t('periodDeadlines.success'),
      isEditing.value ? t('periodDeadlines.updatedSuccessfully') : t('periodDeadlines.createdSuccessfully')
    )
    
    closeModal()
    await loadDeadlines()
  } catch (err: any) {
    if (err.response?.data) {
      errors.value = err.response.data
    } else {
      notificationService.error(t('common.error'), err.message)
    }
  } finally {
    saving.value = false
  }
}

// Utility methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString()
}

const getTimeRemaining = (deadlineString: string) => {
  const now = new Date()
  const deadline = new Date(deadlineString)
  const diff = deadline.getTime() - now.getTime()
  
  if (diff < 0) {
    return t('periodDeadlines.expired')
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) {
    return `${days} ${t('common.days')}`
  } else if (hours > 0) {
    return `${hours} ${t('common.hours')}`
  } else {
    return t('periodDeadlines.lessThanHour')
  }
}

const getDeadlineStatus = (deadline: PeriodDeadline) => {
  const now = new Date()
  const deadlineDate = new Date(deadline.dead_line)
  const diff = deadlineDate.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (diff < 0) return t('periodDeadlines.expired')
  if (days <= 7) return t('periodDeadlines.urgent')
  if (days <= 30) return t('periodDeadlines.upcoming')
  return t('periodDeadlines.future')
}

const getStatusClass = (deadline: PeriodDeadline) => {
  const now = new Date()
  const deadlineDate = new Date(deadline.dead_line)
  const diff = deadlineDate.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (diff < 0) return styles.expired
  if (days <= 7) return styles.urgent
  if (days <= 30) return styles.upcoming
  return styles.future
}

const getTimeRemainingClass = (deadline: PeriodDeadline) => {
  const now = new Date()
  const deadlineDate = new Date(deadline.dead_line)
  const diff = deadlineDate.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (diff < 0) return styles.expiredTime
  if (days <= 7) return styles.urgentTime
  return styles.normalTime
}

const getDeadlineCardClass = (deadline: PeriodDeadline) => {
  const now = new Date()
  const deadlineDate = new Date(deadline.dead_line)
  const diff = deadlineDate.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (diff < 0) return styles.expiredCard
  if (days <= 7) return styles.urgentCard
  if (days <= 30) return styles.upcomingCard
  return styles.futureCard
}

const getPeriodIcon = (period: string) => {
  switch (period) {
    case 'First Half': return '📈'
    case 'Third Quarter': return '🍂'
    case 'Fourth Quarter': return '❄️'
    default: return '📅'
  }
}

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
    '--particle-color': `hsl(${160 + Math.random() * 40}, 70%, 60%)`
  }
}

// Lifecycle
onMounted(() => {
  loadDeadlines()
})
</script>
